import os
from datetime import datetime, timezone
from pathlib import Path

TEST_DB = Path(__file__).parent / "test.db"
TEST_DB.unlink(missing_ok=True)
os.environ["STUDENTVOICE_DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["STUDENTVOICE_ENVIRONMENT"] = "test"

from fastapi.testclient import TestClient

from app.database import SessionLocal, engine
from app.main import app
from app.models import Base, Event, Location, Source


def headers(actor: str, role: str):
    return {"X-Demo-Actor": actor, "X-Demo-Role": role}


def setup_module():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        location = Location(name="Jantar Mantar", locality="New Delhi")
        db.add(location)
        db.flush()
        event = Event(
            slug="test-event",
            title_en="Test event",
            description="Synthetic event",
            occurred_at=datetime(2026, 7, 20, tzinfo=timezone.utc),
            location_id=location.id,
            public=True,
        )
        db.add(event)
        db.flush()
        source = Source(
            event_id=event.id,
            publisher="Synthetic News",
            source_type="test",
            url="https://example.test/report",
            title="Synthetic report",
            rights_basis="link_only",
        )
        db.add(source)
        db.commit()


def teardown_module():
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    TEST_DB.unlink(missing_ok=True)


def event_and_source():
    with SessionLocal() as db:
        return db.query(Event).filter_by(slug="test-event").one().id, db.query(Source).one().id


def test_submission_is_idempotent_and_receipt_is_protected():
    with TestClient(app) as client:
        payload = {
            "source_url": "https://example.test/video",
            "context": "Synthetic public link",
            "rights_basis": "link_only",
        }
        first = client.post("/v1/submissions", json=payload, headers={"Idempotency-Key": "submission-0001"})
        second = client.post("/v1/submissions", json=payload, headers={"Idempotency-Key": "submission-0001"})
        assert first.status_code == 201
        assert second.status_code == 201
        assert first.json()["submission_id"] == second.json()["submission_id"]
        assert second.json()["idempotent_replay"] is True
        missing = client.get(
            f"/v1/submissions/{first.json()['submission_id']}/receipt", params={"receipt_code": "wrong-code"}
        )
        assert missing.status_code == 404


def test_claim_cannot_publish_until_all_gates_pass():
    event_id, source_id = event_and_source()
    with TestClient(app) as client:
        claim = client.post(
            "/v1/internal/claims",
            headers=headers("reviewer-a", "reviewer"),
            json={
                "event_id": event_id,
                "title": "Synthetic corroborated event claim",
                "body": "This claim exists only to verify the editorial approval policy.",
                "status": "corroborated",
                "rights_cleared": True,
                "redaction_approved": True,
            },
        )
        assert claim.status_code == 201
        claim_id = claim.json()["id"]
        citation = client.post(
            f"/v1/internal/claims/{claim_id}/citations",
            headers=headers("reviewer-a", "reviewer"),
            json={"source_id": source_id, "quoted_text": "Synthetic citation"},
        )
        assert citation.status_code == 201
        blocked = client.post(
            f"/v1/internal/claims/{claim_id}/publish", headers=headers("editor-a", "editor")
        )
        assert blocked.status_code == 409
        for actor, role in [("reviewer-a", "reviewer"), ("reviewer-b", "reviewer"), ("editor-a", "editor")]:
            approved = client.post(
                f"/v1/internal/claims/{claim_id}/reviews",
                headers=headers(actor, role),
                json={"decision": "approve", "notes": "Synthetic approval"},
            )
            assert approved.status_code == 200
        published = client.post(
            f"/v1/internal/claims/{claim_id}/publish", headers=headers("editor-a", "editor")
        )
        assert published.status_code == 201
        assert len(published.json()["snapshot_sha256"]) == 64


def test_identity_requires_non_biometric_basis_second_source_and_all_approvals():
    with TestClient(app) as client:
        subject = client.post(
            "/v1/internal/subjects",
            params={"public_label": "Officer A"},
            headers=headers("reviewer-a", "reviewer"),
        )
        assert subject.status_code == 201
        invalid = client.post(
            "/v1/internal/identity-assertions",
            headers=headers("reviewer-a", "reviewer"),
            json={
                "subject_id": subject.json()["id"],
                "proposed_name": "Synthetic Person",
                "basis": "face_match",
                "basis_citation": "Visual resemblance",
                "second_source_url": "https://example.test/record",
            },
        )
        assert invalid.status_code == 422
        assertion = client.post(
            "/v1/internal/identity-assertions",
            headers=headers("reviewer-a", "reviewer"),
            json={
                "subject_id": subject.json()["id"],
                "proposed_name": "Synthetic Person",
                "basis": "nameplate",
                "basis_citation": "Synthetic timestamp 00:10",
                "second_source_url": "https://example.test/official-record",
            },
        )
        assertion_id = assertion.json()["id"]
        blocked = client.post(
            f"/v1/internal/identity-assertions/{assertion_id}/approve-public",
            headers=headers("editor-a", "editor"),
        )
        assert blocked.status_code == 409
        for actor, role in [("reviewer-a", "reviewer"), ("reviewer-b", "reviewer"), ("editor-a", "editor")]:
            response = client.post(
                f"/v1/internal/identity-assertions/{assertion_id}/reviews",
                headers=headers(actor, role),
                json={"decision": "approve", "notes": "Synthetic evidence checked"},
            )
            assert response.status_code == 200
        legal = client.post(
            f"/v1/internal/identity-assertions/{assertion_id}/legal-review",
            headers=headers("counsel-a", "legal"),
            json={"approved": True, "notes": "Synthetic legal review"},
        )
        assert legal.status_code == 200
        approved = client.post(
            f"/v1/internal/identity-assertions/{assertion_id}/approve-public",
            headers=headers("editor-a", "editor"),
        )
        assert approved.status_code == 200
        assert approved.json()["status"] == "approved_public"


def test_audit_chain_is_intact():
    with TestClient(app) as client:
        result = client.get("/v1/internal/audit/verify", headers=headers("admin-a", "admin"))
        assert result.status_code == 200
        assert result.json()["valid"] is True
