import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def new_id() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ClaimStatus(str, enum.Enum):
    unreviewed = "unreviewed"
    under_review = "under_review"
    corroborated = "corroborated"
    contested = "contested"
    refuted = "refuted"
    retracted = "retracted"


class IdentityStatus(str, enum.Enum):
    anonymous_subject = "anonymous_subject"
    suggested_private = "suggested_private"
    verified_private = "verified_private"
    approved_public = "approved_public"
    withdrawn = "withdrawn"


class SubmissionStatus(str, enum.Enum):
    manifest_received = "manifest_received"
    uploaded = "uploaded"
    quarantined = "quarantined"
    accepted = "accepted"
    rejected = "rejected"


class Timestamped:
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )


class Location(Timestamped, Base):
    __tablename__ = "locations"
    name: Mapped[str] = mapped_column(String(200))
    locality: Mapped[str | None] = mapped_column(String(200))
    country_code: Mapped[str] = mapped_column(String(2), default="IN")
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    precision: Mapped[str] = mapped_column(String(30), default="locality")


class Event(Timestamped, Base):
    __tablename__ = "events"
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    title_en: Mapped[str] = mapped_column(String(300))
    title_hi: Mapped[str | None] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(Text)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    location_id: Mapped[str | None] = mapped_column(ForeignKey("locations.id"))
    public: Mapped[bool] = mapped_column(Boolean, default=False)


class Source(Timestamped, Base):
    __tablename__ = "sources"
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"), index=True)
    publisher: Mapped[str] = mapped_column(String(240))
    source_type: Mapped[str] = mapped_column(String(50))
    url: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(Text)
    acquired_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rights_basis: Mapped[str] = mapped_column(String(80), default="link_only")
    reliability_note: Mapped[str | None] = mapped_column(Text)


class Submission(Timestamped, Base):
    __tablename__ = "submissions"
    receipt_code: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    idempotency_key: Mapped[str] = mapped_column(String(160), unique=True)
    alias: Mapped[str | None] = mapped_column(String(100))
    encrypted_contact: Mapped[str | None] = mapped_column(Text)
    source_url: Mapped[str | None] = mapped_column(Text)
    context: Mapped[str] = mapped_column(Text, default="")
    rights_basis: Mapped[str] = mapped_column(String(80))
    consent_restrictions: Mapped[str | None] = mapped_column(Text)
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus), default=SubmissionStatus.manifest_received
    )
    expected_size: Mapped[int | None] = mapped_column(Integer)
    original_filename: Mapped[str | None] = mapped_column(String(512))
    upload_token_hash: Mapped[str | None] = mapped_column(String(64))


class MediaAsset(Timestamped, Base):
    __tablename__ = "media_assets"
    submission_id: Mapped[str] = mapped_column(ForeignKey("submissions.id"), index=True)
    original_filename: Mapped[str] = mapped_column(String(512))
    media_type: Mapped[str] = mapped_column(String(160))
    byte_size: Mapped[int] = mapped_column(Integer)
    sha256: Mapped[str] = mapped_column(String(64), unique=True)
    blake3: Mapped[str] = mapped_column(String(64), unique=True)
    storage_key: Mapped[str] = mapped_column(Text)
    quarantine_state: Mapped[str] = mapped_column(String(40), default="pending")
    c2pa_manifest: Mapped[dict | None] = mapped_column(JSON)
    retained_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Derivative(Timestamped, Base):
    __tablename__ = "derivatives"
    asset_id: Mapped[str] = mapped_column(ForeignKey("media_assets.id"), index=True)
    kind: Mapped[str] = mapped_column(String(50))
    storage_key: Mapped[str] = mapped_column(Text)
    sha256: Mapped[str] = mapped_column(String(64))
    manifest: Mapped[dict] = mapped_column(JSON, default=dict)
    public: Mapped[bool] = mapped_column(Boolean, default=False)
    redaction_approved_by: Mapped[str | None] = mapped_column(String(120))


class CustodyEvent(Timestamped, Base):
    __tablename__ = "custody_events"
    asset_id: Mapped[str | None] = mapped_column(ForeignKey("media_assets.id"), index=True)
    submission_id: Mapped[str | None] = mapped_column(ForeignKey("submissions.id"), index=True)
    actor_id: Mapped[str] = mapped_column(String(160))
    action: Mapped[str] = mapped_column(String(100))
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    previous_hash: Mapped[str | None] = mapped_column(String(64))
    event_hash: Mapped[str] = mapped_column(String(64))


class Segment(Timestamped, Base):
    __tablename__ = "segments"
    asset_id: Mapped[str] = mapped_column(ForeignKey("media_assets.id"), index=True)
    start_ms: Mapped[int] = mapped_column(Integer)
    end_ms: Mapped[int] = mapped_column(Integer)
    transcript_original: Mapped[str | None] = mapped_column(Text)
    transcript_translation: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str | None] = mapped_column(String(16))
    approved_by: Mapped[str | None] = mapped_column(String(160))


class ObservationProposal(Timestamped, Base):
    __tablename__ = "observation_proposals"
    asset_id: Mapped[str] = mapped_column(ForeignKey("media_assets.id"), index=True)
    start_ms: Mapped[int] = mapped_column(Integer)
    end_ms: Mapped[int] = mapped_column(Integer)
    proposal_type: Mapped[str] = mapped_column(String(60))
    payload: Mapped[dict] = mapped_column(JSON)
    model_name: Mapped[str] = mapped_column(String(120))
    model_version: Mapped[str] = mapped_column(String(80))
    confidence: Mapped[float] = mapped_column(Float)
    published: Mapped[bool] = mapped_column(Boolean, default=False)


class Observation(Timestamped, Base):
    __tablename__ = "observations"
    proposal_id: Mapped[str | None] = mapped_column(ForeignKey("observation_proposals.id"))
    asset_id: Mapped[str] = mapped_column(ForeignKey("media_assets.id"), index=True)
    reviewer_id: Mapped[str] = mapped_column(String(160))
    start_ms: Mapped[int] = mapped_column(Integer)
    end_ms: Mapped[int] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(Text)
    confidence_note: Mapped[str | None] = mapped_column(Text)


class Claim(Timestamped, Base):
    __tablename__ = "claims"
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"), index=True)
    title: Mapped[str] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text)
    status: Mapped[ClaimStatus] = mapped_column(Enum(ClaimStatus), default=ClaimStatus.unreviewed)
    created_by: Mapped[str] = mapped_column(String(160))
    version: Mapped[int] = mapped_column(Integer, default=1)
    rights_cleared: Mapped[bool] = mapped_column(Boolean, default=False)
    redaction_approved: Mapped[bool] = mapped_column(Boolean, default=False)


class ClaimRelation(Timestamped, Base):
    __tablename__ = "claim_relations"
    from_claim_id: Mapped[str] = mapped_column(ForeignKey("claims.id"))
    to_claim_id: Mapped[str] = mapped_column(ForeignKey("claims.id"))
    relation: Mapped[str] = mapped_column(String(30))
    __table_args__ = (UniqueConstraint("from_claim_id", "to_claim_id", "relation"),)


class Citation(Timestamped, Base):
    __tablename__ = "citations"
    claim_id: Mapped[str] = mapped_column(ForeignKey("claims.id"), index=True)
    source_id: Mapped[str | None] = mapped_column(ForeignKey("sources.id"))
    derivative_id: Mapped[str | None] = mapped_column(ForeignKey("derivatives.id"))
    start_ms: Mapped[int | None] = mapped_column(Integer)
    end_ms: Mapped[int | None] = mapped_column(Integer)
    frame_region: Mapped[dict | None] = mapped_column(JSON)
    quoted_text: Mapped[str | None] = mapped_column(Text)
    reviewer_id: Mapped[str] = mapped_column(String(160))


class Subject(Timestamped, Base):
    __tablename__ = "subjects"
    public_label: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)


class IdentityAssertion(Timestamped, Base):
    __tablename__ = "identity_assertions"
    subject_id: Mapped[str] = mapped_column(ForeignKey("subjects.id"), index=True)
    proposed_name: Mapped[str] = mapped_column(String(240))
    status: Mapped[IdentityStatus] = mapped_column(
        Enum(IdentityStatus), default=IdentityStatus.suggested_private
    )
    basis: Mapped[str] = mapped_column(String(40))
    basis_citation: Mapped[str] = mapped_column(Text)
    second_source_url: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str] = mapped_column(String(160))
    legal_reviewed: Mapped[bool] = mapped_column(Boolean, default=False)


class ReviewDecision(Timestamped, Base):
    __tablename__ = "review_decisions"
    target_type: Mapped[str] = mapped_column(String(40), index=True)
    target_id: Mapped[str] = mapped_column(String(36), index=True)
    reviewer_id: Mapped[str] = mapped_column(String(160))
    reviewer_role: Mapped[str] = mapped_column(String(40))
    decision: Mapped[str] = mapped_column(String(20))
    notes: Mapped[str | None] = mapped_column(Text)
    __table_args__ = (UniqueConstraint("target_type", "target_id", "reviewer_id"),)


class Publication(Timestamped, Base):
    __tablename__ = "publications"
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id"), index=True)
    claim_id: Mapped[str | None] = mapped_column(ForeignKey("claims.id"), index=True)
    version: Mapped[int] = mapped_column(Integer)
    snapshot: Mapped[dict] = mapped_column(JSON)
    snapshot_sha256: Mapped[str] = mapped_column(String(64), unique=True)
    published_by: Mapped[str] = mapped_column(String(160))
    supersedes_id: Mapped[str | None] = mapped_column(ForeignKey("publications.id"))


class RightOfReply(Timestamped, Base):
    __tablename__ = "rights_of_reply"
    subject_id: Mapped[str] = mapped_column(ForeignKey("subjects.id"), index=True)
    publication_id: Mapped[str] = mapped_column(ForeignKey("publications.id"), index=True)
    status: Mapped[str] = mapped_column(String(30), default="invited")
    response_text: Mapped[str | None] = mapped_column(Text)
    public: Mapped[bool] = mapped_column(Boolean, default=False)


class Correction(Timestamped, Base):
    __tablename__ = "corrections"
    publication_id: Mapped[str] = mapped_column(ForeignKey("publications.id"), index=True)
    reason: Mapped[str] = mapped_column(Text)
    previous_text: Mapped[str] = mapped_column(Text)
    replacement_text: Mapped[str] = mapped_column(Text)
    approved_by: Mapped[str] = mapped_column(String(160))


class LegalHold(Timestamped, Base):
    __tablename__ = "legal_holds"
    asset_id: Mapped[str] = mapped_column(ForeignKey("media_assets.id"), index=True)
    reason: Mapped[str] = mapped_column(Text)
    placed_by: Mapped[str] = mapped_column(String(160))
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class AccessGrant(Timestamped, Base):
    __tablename__ = "access_grants"
    principal_id: Mapped[str] = mapped_column(String(160), index=True)
    resource_type: Mapped[str] = mapped_column(String(50))
    resource_id: Mapped[str] = mapped_column(String(36))
    permission: Mapped[str] = mapped_column(String(40))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AuditEvent(Timestamped, Base):
    __tablename__ = "audit_events"
    actor_id: Mapped[str] = mapped_column(String(160))
    action: Mapped[str] = mapped_column(String(100), index=True)
    target_type: Mapped[str] = mapped_column(String(40))
    target_id: Mapped[str] = mapped_column(String(36))
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    previous_hash: Mapped[str | None] = mapped_column(String(64))
    event_hash: Mapped[str] = mapped_column(String(64), unique=True)
