import hashlib
import json
import secrets
from contextlib import asynccontextmanager
from datetime import timedelta
from pathlib import Path
from xml.sax.saxutils import escape

import blake3
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from .audit import append_audit, append_custody, audit_digest
from .config import get_settings
from .crypto import encrypt_contact
from .database import Base, engine, get_db
from .models import (
    AuditEvent,
    Citation,
    Claim,
    Correction,
    CustodyEvent,
    Derivative,
    Event,
    IdentityAssertion,
    IdentityStatus,
    MediaAsset,
    Publication,
    ReviewDecision,
    RightOfReply,
    Source,
    Subject,
    Submission,
    SubmissionStatus,
    utcnow,
)
from .policies import assert_claim_publishable, assert_identity_publishable
from .schemas import (
    CitationCreate,
    ClaimCreate,
    CorrectionCreate,
    IdentityCreate,
    LegalReview,
    Receipt,
    ReviewCreate,
    RightOfReplyCreate,
    SubmissionComplete,
    SubmissionCreate,
)
from .security import Actor, get_actor, require_role


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    Path(get_settings().quarantine_root).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="StudentVoice Evidence API",
    version="0.1.0",
    description="Evidence intake, chain of custody, review, publication, correction, and identity safeguards.",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "intake", "description": "Pseudonymous and one-time evidence intake"},
        {"name": "editorial", "description": "Protected claim and identity review"},
        {"name": "public", "description": "Published, redacted public records"},
    ],
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().public_base_url],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type", "Idempotency-Key", "X-Demo-Actor", "X-Demo-Role"],
)


@app.get("/healthz", include_in_schema=False)
def healthz():
    return {"status": "ok", "biometric_identification": False}


def receipt_for(db: Session, submission: Submission) -> Receipt:
    asset = db.scalar(select(MediaAsset).where(MediaAsset.submission_id == submission.id))
    return Receipt(
        submission_id=submission.id,
        receipt_code=submission.receipt_code,
        status=submission.status.value,
        created_at=submission.created_at,
        sha256=asset.sha256 if asset else None,
        blake3=asset.blake3 if asset else None,
    )


@app.post("/v1/submissions", tags=["intake"], status_code=201)
def create_submission(
    payload: SubmissionCreate,
    request: Request,
    db: Session = Depends(get_db),
    idempotency_key: str = Header(min_length=8, max_length=160, alias="Idempotency-Key"),
):
    existing = db.scalar(select(Submission).where(Submission.idempotency_key == idempotency_key))
    if existing:
        return {
            **receipt_for(db, existing).model_dump(mode="json"),
            "upload": None,
            "idempotent_replay": True,
        }
    if payload.expected_size and payload.expected_size > get_settings().maximum_upload_bytes:
        raise HTTPException(status_code=413, detail="Upload exceeds the 20 GB limit")
    if payload.rights_basis == "link_only" and not payload.source_url:
        raise HTTPException(status_code=422, detail="A public URL is required for link-only submissions")
    upload_token = secrets.token_urlsafe(32) if payload.original_filename else None
    submission = Submission(
        receipt_code=f"SV-{secrets.token_hex(6).upper()}",
        idempotency_key=idempotency_key,
        alias=payload.alias,
        encrypted_contact=encrypt_contact(payload.contact),
        source_url=str(payload.source_url) if payload.source_url else None,
        context=payload.context,
        rights_basis=payload.rights_basis,
        consent_restrictions=payload.consent_restrictions,
        expected_size=payload.expected_size,
        original_filename=payload.original_filename,
        upload_token_hash=hashlib.sha256(upload_token.encode()).hexdigest() if upload_token else None,
    )
    db.add(submission)
    db.flush()
    append_audit(
        db,
        "anonymous-intake",
        "submission.created",
        "submission",
        submission.id,
        {
            "rights_basis": payload.rights_basis,
            "has_contact": bool(payload.contact),
            "remote_ip_retained": False,
        },
    )
    db.commit()
    upload = None
    if upload_token:
        upload = {
            "method": "PUT",
            "url": str(request.base_url).rstrip("/") + f"/v1/uploads/{submission.id}?token={upload_token}",
            "content_type": "application/octet-stream",
            "expires_in_seconds": get_settings().upload_intent_ttl_seconds,
        }
    return {
        **receipt_for(db, submission).model_dump(mode="json"),
        "upload": upload,
        "idempotent_replay": False,
    }


@app.put("/v1/uploads/{submission_id}", tags=["intake"])
async def local_quarantine_upload(
    submission_id: str, request: Request, token: str = Query(min_length=20), db: Session = Depends(get_db)
):
    submission = db.get(Submission, submission_id)
    if not submission or not submission.upload_token_hash:
        raise HTTPException(status_code=404, detail="Upload intent not found")
    if not secrets.compare_digest(submission.upload_token_hash, hashlib.sha256(token.encode()).hexdigest()):
        raise HTTPException(status_code=403, detail="Invalid upload token")
    if (utcnow() - submission.created_at) > timedelta(seconds=get_settings().upload_intent_ttl_seconds):
        raise HTTPException(status_code=410, detail="Upload intent expired")
    root = Path(get_settings().quarantine_root).resolve()
    part_path, final_path = root / f"{submission.id}.part", root / f"{submission.id}.evidence"
    sha, b3, size = hashlib.sha256(), blake3.blake3(), 0
    try:
        with part_path.open("xb") as output:
            async for chunk in request.stream():
                size += len(chunk)
                if size > get_settings().maximum_upload_bytes:
                    raise HTTPException(status_code=413, detail="Upload exceeds the 20 GB limit")
                output.write(chunk)
                sha.update(chunk)
                b3.update(chunk)
        part_path.replace(final_path)
    except FileExistsError as exc:
        raise HTTPException(status_code=409, detail="Upload already in progress") from exc
    except Exception:
        part_path.unlink(missing_ok=True)
        raise
    asset = MediaAsset(
        submission_id=submission.id,
        original_filename=submission.original_filename or "original.bin",
        media_type=request.headers.get("content-type", "application/octet-stream")[:160],
        byte_size=size,
        sha256=sha.hexdigest(),
        blake3=b3.hexdigest(),
        storage_key=str(final_path),
        quarantine_state="pending_scan",
        retained_until=utcnow() + timedelta(days=30),
    )
    submission.status = SubmissionStatus.uploaded
    submission.upload_token_hash = None
    db.add(asset)
    db.flush()
    append_custody(
        db,
        "anonymous-intake",
        "asset.quarantined",
        asset.id,
        submission.id,
        {"sha256": asset.sha256, "blake3": asset.blake3, "byte_size": size},
    )
    append_audit(
        db,
        "anonymous-intake",
        "asset.quarantined",
        "media_asset",
        asset.id,
        {"sha256": asset.sha256, "blake3": asset.blake3, "byte_size": size},
    )
    db.commit()
    return {
        "asset_id": asset.id,
        "status": "uploaded",
        "sha256": asset.sha256,
        "blake3": asset.blake3,
        "byte_size": size,
    }


@app.post("/v1/submissions/{submission_id}/complete", tags=["intake"])
def complete_submission(submission_id: str, payload: SubmissionComplete, db: Session = Depends(get_db)):
    submission = db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if payload.byte_size > get_settings().maximum_upload_bytes:
        raise HTTPException(status_code=413, detail="Upload exceeds the 20 GB limit")
    asset = db.scalar(select(MediaAsset).where(MediaAsset.submission_id == submission.id))
    if asset:
        if (asset.sha256, asset.blake3, asset.byte_size) != (
            payload.sha256,
            payload.blake3,
            payload.byte_size,
        ):
            raise HTTPException(
                status_code=409, detail="Completion hashes do not match the quarantined upload"
            )
    else:
        asset = MediaAsset(
            submission_id=submission.id,
            original_filename=submission.original_filename or "original.bin",
            media_type=payload.media_type,
            byte_size=payload.byte_size,
            sha256=payload.sha256,
            blake3=payload.blake3,
            storage_key=payload.storage_key,
            quarantine_state="pending_scan",
            retained_until=utcnow() + timedelta(days=30),
        )
        db.add(asset)
    db.flush()
    submission.status = SubmissionStatus.quarantined
    append_custody(
        db,
        "intake-service",
        "submission.completed",
        asset.id,
        submission.id,
        {"sha256": payload.sha256, "byte_size": payload.byte_size},
    )
    append_audit(
        db,
        "intake-service",
        "submission.completed",
        "submission",
        submission.id,
        {"asset_id": asset.id, "sha256": payload.sha256},
    )
    db.commit()
    return receipt_for(db, submission)


@app.get("/v1/submissions/{submission_id}/receipt", response_model=Receipt, tags=["intake"])
def get_receipt(submission_id: str, receipt_code: str = Query(min_length=8), db: Session = Depends(get_db)):
    submission = db.get(Submission, submission_id)
    if not submission or not secrets.compare_digest(submission.receipt_code, receipt_code):
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt_for(db, submission)


@app.post("/v1/internal/claims", tags=["editorial"], status_code=201)
def create_claim(payload: ClaimCreate, actor: Actor = Depends(get_actor), db: Session = Depends(get_db)):
    require_role(actor, "reviewer", "editor")
    if not db.get(Event, payload.event_id):
        raise HTTPException(status_code=404, detail="Event not found")
    claim = Claim(**payload.model_dump(), created_by=actor.id)
    db.add(claim)
    db.flush()
    append_audit(db, actor.id, "claim.created", "claim", claim.id, {"status": claim.status.value})
    db.commit()
    return {"id": claim.id, "status": claim.status.value, "version": claim.version}


@app.post("/v1/internal/claims/{claim_id}/citations", tags=["editorial"], status_code=201)
def create_citation(
    claim_id: str, payload: CitationCreate, actor: Actor = Depends(get_actor), db: Session = Depends(get_db)
):
    require_role(actor, "reviewer", "editor")
    if not db.get(Claim, claim_id):
        raise HTTPException(status_code=404, detail="Claim not found")
    if bool(payload.source_id) == bool(payload.derivative_id):
        raise HTTPException(status_code=422, detail="Exactly one source_id or derivative_id is required")
    if payload.end_ms is not None and payload.start_ms is not None and payload.end_ms < payload.start_ms:
        raise HTTPException(status_code=422, detail="end_ms must be after start_ms")
    citation = Citation(claim_id=claim_id, reviewer_id=actor.id, **payload.model_dump())
    db.add(citation)
    append_audit(
        db,
        actor.id,
        "citation.created",
        "claim",
        claim_id,
        {"source_id": payload.source_id, "derivative_id": payload.derivative_id},
    )
    db.commit()
    return {"id": citation.id}


def add_review(db: Session, target_type: str, target_id: str, payload: ReviewCreate, actor: Actor):
    require_role(actor, "reviewer", "editor", "legal")
    existing = db.scalar(
        select(ReviewDecision).where(
            ReviewDecision.target_type == target_type,
            ReviewDecision.target_id == target_id,
            ReviewDecision.reviewer_id == actor.id,
        )
    )
    if existing:
        existing.decision, existing.notes, existing.reviewer_role = (
            payload.decision,
            payload.notes,
            actor.role,
        )
    else:
        db.add(
            ReviewDecision(
                target_type=target_type,
                target_id=target_id,
                reviewer_id=actor.id,
                reviewer_role=actor.role,
                decision=payload.decision,
                notes=payload.notes,
            )
        )
    append_audit(
        db,
        actor.id,
        "review.recorded",
        target_type,
        target_id,
        {"decision": payload.decision, "role": actor.role},
    )
    db.commit()
    return {"target_id": target_id, "decision": payload.decision, "reviewer_role": actor.role}


@app.post("/v1/internal/claims/{claim_id}/reviews", tags=["editorial"])
def review_claim(
    claim_id: str, payload: ReviewCreate, actor: Actor = Depends(get_actor), db: Session = Depends(get_db)
):
    if not db.get(Claim, claim_id):
        raise HTTPException(status_code=404, detail="Claim not found")
    return add_review(db, "claim", claim_id, payload, actor)


@app.post("/v1/internal/claims/{claim_id}/publish", tags=["editorial"], status_code=201)
def publish_claim(claim_id: str, actor: Actor = Depends(get_actor), db: Session = Depends(get_db)):
    require_role(actor, "editor")
    claim = db.get(Claim, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    assert_claim_publishable(db, claim)
    snapshot = {
        "claim_id": claim.id,
        "event_id": claim.event_id,
        "title": claim.title,
        "body": claim.body,
        "status": claim.status.value,
        "version": claim.version,
        "published_at": utcnow().isoformat(),
    }
    digest = hashlib.sha256(json.dumps(snapshot, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    publication = Publication(
        event_id=claim.event_id,
        claim_id=claim.id,
        version=claim.version,
        snapshot=snapshot,
        snapshot_sha256=digest,
        published_by=actor.id,
    )
    db.add(publication)
    append_audit(db, actor.id, "claim.published", "claim", claim.id, {"snapshot_sha256": digest})
    db.commit()
    return {"publication_id": publication.id, "snapshot_sha256": digest, "version": publication.version}


@app.post("/v1/internal/subjects", tags=["editorial"], status_code=201)
def create_subject(public_label: str, actor: Actor = Depends(get_actor), db: Session = Depends(get_db)):
    require_role(actor, "reviewer", "editor")
    subject = Subject(public_label=public_label[:200])
    db.add(subject)
    db.flush()
    append_audit(db, actor.id, "subject.created", "subject", subject.id)
    db.commit()
    return {"id": subject.id, "public_label": subject.public_label}


@app.post("/v1/internal/identity-assertions", tags=["editorial"], status_code=201)
def create_identity_assertion(
    payload: IdentityCreate, actor: Actor = Depends(get_actor), db: Session = Depends(get_db)
):
    require_role(actor, "reviewer", "editor")
    if not db.get(Subject, payload.subject_id):
        raise HTTPException(status_code=404, detail="Subject not found")
    assertion = IdentityAssertion(
        subject_id=payload.subject_id,
        proposed_name=payload.proposed_name,
        basis=payload.basis,
        basis_citation=payload.basis_citation,
        second_source_url=str(payload.second_source_url) if payload.second_source_url else None,
        created_by=actor.id,
    )
    db.add(assertion)
    db.flush()
    append_audit(
        db,
        actor.id,
        "identity_assertion.created",
        "identity_assertion",
        assertion.id,
        {"basis": assertion.basis},
    )
    db.commit()
    return {"id": assertion.id, "status": assertion.status.value}


@app.post("/v1/internal/identity-assertions/{assertion_id}/reviews", tags=["editorial"])
def review_identity(
    assertion_id: str, payload: ReviewCreate, actor: Actor = Depends(get_actor), db: Session = Depends(get_db)
):
    if not db.get(IdentityAssertion, assertion_id):
        raise HTTPException(status_code=404, detail="Identity assertion not found")
    return add_review(db, "identity_assertion", assertion_id, payload, actor)


@app.post("/v1/internal/identity-assertions/{assertion_id}/legal-review", tags=["editorial"])
def legal_review_identity(
    assertion_id: str, payload: LegalReview, actor: Actor = Depends(get_actor), db: Session = Depends(get_db)
):
    require_role(actor, "legal")
    assertion = db.get(IdentityAssertion, assertion_id)
    if not assertion:
        raise HTTPException(status_code=404, detail="Identity assertion not found")
    assertion.legal_reviewed = payload.approved
    result = add_review(
        db,
        "identity_assertion",
        assertion_id,
        ReviewCreate(decision="approve" if payload.approved else "reject", notes=payload.notes),
        actor,
    )
    result["legal_reviewed"] = assertion.legal_reviewed
    return result


@app.post("/v1/internal/identity-assertions/{assertion_id}/approve-public", tags=["editorial"])
def approve_public_identity(
    assertion_id: str, actor: Actor = Depends(get_actor), db: Session = Depends(get_db)
):
    require_role(actor, "editor")
    assertion = db.get(IdentityAssertion, assertion_id)
    if not assertion:
        raise HTTPException(status_code=404, detail="Identity assertion not found")
    assert_identity_publishable(db, assertion)
    assertion.status = IdentityStatus.approved_public
    append_audit(
        db,
        actor.id,
        "identity_assertion.approved_public",
        "identity_assertion",
        assertion.id,
        {"basis": assertion.basis},
    )
    db.commit()
    return {"id": assertion.id, "status": assertion.status.value}


@app.post("/v1/internal/publications/{publication_id}/corrections", tags=["editorial"], status_code=201)
def create_correction(
    publication_id: str,
    payload: CorrectionCreate,
    actor: Actor = Depends(get_actor),
    db: Session = Depends(get_db),
):
    require_role(actor, "editor")
    if not db.get(Publication, publication_id):
        raise HTTPException(status_code=404, detail="Publication not found")
    correction = Correction(publication_id=publication_id, approved_by=actor.id, **payload.model_dump())
    db.add(correction)
    db.flush()
    append_audit(
        db,
        actor.id,
        "publication.corrected",
        "publication",
        publication_id,
        {"correction_id": correction.id, "reason": payload.reason},
    )
    db.commit()
    return {"id": correction.id, "publication_id": publication_id}


@app.post("/v1/internal/publications/{publication_id}/right-of-reply", tags=["editorial"], status_code=201)
def record_right_of_reply(
    publication_id: str,
    payload: RightOfReplyCreate,
    actor: Actor = Depends(get_actor),
    db: Session = Depends(get_db),
):
    require_role(actor, "editor", "legal")
    if not db.get(Publication, publication_id) or not db.get(Subject, payload.subject_id):
        raise HTTPException(status_code=404, detail="Publication or subject not found")
    if payload.public and payload.status != "received":
        raise HTTPException(status_code=422, detail="Only a received response may be public")
    reply = RightOfReply(publication_id=publication_id, **payload.model_dump())
    db.add(reply)
    db.flush()
    append_audit(
        db,
        actor.id,
        "right_of_reply.recorded",
        "publication",
        publication_id,
        {"reply_id": reply.id, "status": reply.status, "public": reply.public},
    )
    db.commit()
    return {"id": reply.id, "publication_id": publication_id, "status": reply.status, "public": reply.public}


@app.get("/v1/internal/events/{event_id}/legal-export", tags=["editorial"])
def legal_export(event_id: str, actor: Actor = Depends(get_actor), db: Session = Depends(get_db)):
    require_role(actor, "editor", "legal")
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    claims = list(db.scalars(select(Claim).where(Claim.event_id == event_id)))
    claim_ids = [claim.id for claim in claims]
    publications = list(db.scalars(select(Publication).where(Publication.event_id == event_id)))
    citations = (
        list(db.scalars(select(Citation).where(Citation.claim_id.in_(claim_ids)))) if claim_ids else []
    )
    derivative_ids = [citation.derivative_id for citation in citations if citation.derivative_id]
    derivatives = (
        list(db.scalars(select(Derivative).where(Derivative.id.in_(derivative_ids))))
        if derivative_ids
        else []
    )
    asset_ids = list({derivative.asset_id for derivative in derivatives})
    assets = list(db.scalars(select(MediaAsset).where(MediaAsset.id.in_(asset_ids)))) if asset_ids else []
    custody = (
        list(
            db.scalars(
                select(CustodyEvent)
                .where(CustodyEvent.asset_id.in_(asset_ids))
                .order_by(CustodyEvent.created_at)
            )
        )
        if asset_ids
        else []
    )
    reviews = (
        list(db.scalars(select(ReviewDecision).where(ReviewDecision.target_id.in_(claim_ids))))
        if claim_ids
        else []
    )
    append_audit(
        db,
        actor.id,
        "event.legal_exported",
        "event",
        event_id,
        {"assets": len(assets), "publications": len(publications)},
    )
    db.commit()
    return {
        "package_version": "1.0-draft",
        "generated_at": utcnow(),
        "event": {
            "id": event.id,
            "slug": event.slug,
            "title": event.title_en,
            "occurred_at": event.occurred_at,
        },
        "assets": [
            {
                "id": item.id,
                "original_filename": item.original_filename,
                "byte_size": item.byte_size,
                "sha256": item.sha256,
                "blake3": item.blake3,
                "storage_key": item.storage_key,
            }
            for item in assets
        ],
        "custody_events": [
            {
                "id": item.id,
                "asset_id": item.asset_id,
                "action": item.action,
                "actor_id": item.actor_id,
                "details": item.details,
                "previous_hash": item.previous_hash,
                "event_hash": item.event_hash,
                "created_at": item.created_at,
            }
            for item in custody
        ],
        "review_history": [
            {
                "target_type": item.target_type,
                "target_id": item.target_id,
                "reviewer_id": item.reviewer_id,
                "reviewer_role": item.reviewer_role,
                "decision": item.decision,
                "created_at": item.created_at,
            }
            for item in reviews
        ],
        "publication_snapshots": [
            {
                "id": item.id,
                "version": item.version,
                "snapshot": item.snapshot,
                "snapshot_sha256": item.snapshot_sha256,
            }
            for item in publications
        ],
        "section_63_certificate_draft": {
            "status": "counsel_must_finalize",
            "notice": "This generated schedule is not a signed certificate and is not legal advice.",
            "fields_to_complete": [
                "responsible person",
                "device/system particulars",
                "ordinary-course statement",
                "signature",
                "date and place",
            ],
        },
    }


@app.get("/v1/public/events/{slug}", tags=["public"])
def public_event(slug: str, db: Session = Depends(get_db)):
    event = db.scalar(select(Event).where(Event.slug == slug, Event.public.is_(True)))
    if not event:
        raise HTTPException(status_code=404, detail="Public event not found")
    sources = list(db.scalars(select(Source).where(Source.event_id == event.id)))
    publications = list(
        db.scalars(
            select(Publication).where(Publication.event_id == event.id).order_by(Publication.created_at)
        )
    )
    return {
        "id": event.id,
        "slug": event.slug,
        "title": {"en": event.title_en, "hi": event.title_hi},
        "description": event.description,
        "occurred_at": event.occurred_at,
        "sources": [
            {
                "id": source.id,
                "publisher": source.publisher,
                "type": source.source_type,
                "url": source.url,
                "title": source.title,
                "rights_basis": source.rights_basis,
            }
            for source in sources
        ],
        "publications": [
            publication.snapshot
            | {"publication_id": publication.id, "snapshot_sha256": publication.snapshot_sha256}
            for publication in publications
        ],
    }


@app.get("/v1/public/events/{slug}/evidence.jsonld", tags=["public"])
def event_jsonld(slug: str, db: Session = Depends(get_db)):
    record = public_event(slug, db)
    return {
        "@context": {"sv": "https://studentvoice.example/schema/", "schema": "https://schema.org/"},
        "@type": "sv:CivicEvidenceEvent",
        "@id": f"{get_settings().public_base_url}/events/{slug}",
        "schema:name": record["title"]["en"],
        "schema:datePublished": record["occurred_at"],
        "sv:sources": record["sources"],
        "sv:publicationSnapshots": record["publications"],
    }


@app.get("/v1/public/events/{slug}/feed.json", tags=["public"])
def event_json_feed(slug: str, db: Session = Depends(get_db)):
    record = public_event(slug, db)
    return {
        "version": "https://jsonfeed.org/version/1.1",
        "title": record["title"]["en"],
        "home_page_url": f"{get_settings().public_base_url}/events/{slug}",
        "feed_url": f"{get_settings().public_base_url}/v1/public/events/{slug}/feed.json",
        "items": [
            {
                "id": item["publication_id"],
                "title": item["title"],
                "content_text": item["body"],
                "date_published": item["published_at"],
                "_studentvoice": {"status": item["status"], "snapshot_sha256": item["snapshot_sha256"]},
            }
            for item in record["publications"]
        ],
    }


@app.get("/v1/public/events/{slug}/feed.rss", tags=["public"], response_class=Response)
def event_rss(slug: str, db: Session = Depends(get_db)):
    record = public_event(slug, db)
    items = "".join(
        f"<item><guid>{escape(item['publication_id'])}</guid><title>{escape(item['title'])}</title><description>{escape(item['body'])}</description><pubDate>{escape(item['published_at'])}</pubDate></item>"
        for item in record["publications"]
    )
    xml = f'<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>{escape(record["title"]["en"])}</title><link>{escape(get_settings().public_base_url + "/events/" + slug)}</link><description>{escape(record["description"])}</description>{items}</channel></rss>'
    return Response(content=xml, media_type="application/rss+xml")


@app.get("/v1/internal/audit/verify", tags=["editorial"])
def verify_audit(actor: Actor = Depends(get_actor), db: Session = Depends(get_db)):
    require_role(actor, "admin")
    events = list(db.scalars(select(AuditEvent).order_by(AuditEvent.created_at)))
    previous = None
    for item in events:
        if item.previous_hash != previous:
            return {"valid": False, "broken_at": item.id}
        expected = audit_digest(
            item.actor_id,
            item.action,
            item.target_type,
            item.target_id,
            item.details,
            item.created_at,
            item.previous_hash,
        )
        if not secrets.compare_digest(item.event_hash, expected):
            return {"valid": False, "broken_at": item.id}
        previous = item.event_hash
    return {"valid": True, "events": len(events), "head": previous}
