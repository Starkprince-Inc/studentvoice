import hashlib
import json
from datetime import timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import AuditEvent, CustodyEvent, utcnow


def _canonical_time(value):
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


def audit_digest(actor_id, action, target_type, target_id, details, created_at, previous_hash):
    payload = {
        "actor_id": actor_id,
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "details": details or {},
        "created_at": _canonical_time(created_at),
        "previous_hash": previous_hash,
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def append_audit(
    db: Session, actor_id: str, action: str, target_type: str, target_id: str, details: dict | None = None
) -> AuditEvent:
    previous = db.scalar(select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(1))
    created_at = utcnow()
    previous_hash = previous.event_hash if previous else None
    digest = audit_digest(actor_id, action, target_type, target_id, details, created_at, previous_hash)
    event = AuditEvent(
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details or {},
        created_at=created_at,
        previous_hash=previous_hash,
        event_hash=digest,
    )
    db.add(event)
    return event


def append_custody(db: Session, actor_id: str, action: str, asset_id: str, submission_id: str, details=None):
    previous = db.scalar(select(CustodyEvent).order_by(CustodyEvent.created_at.desc()).limit(1))
    created_at = utcnow()
    previous_hash = previous.event_hash if previous else None
    digest = audit_digest(actor_id, action, "media_asset", asset_id, details, created_at, previous_hash)
    event = CustodyEvent(
        asset_id=asset_id,
        submission_id=submission_id,
        actor_id=actor_id,
        action=action,
        details=details or {},
        previous_hash=previous_hash,
        event_hash=digest,
        created_at=created_at,
    )
    db.add(event)
    return event
