from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Claim, Citation, IdentityAssertion, ReviewDecision


def _approvals(db: Session, target_type: str, target_id: str) -> list[ReviewDecision]:
    return list(
        db.scalars(
            select(ReviewDecision).where(
                ReviewDecision.target_type == target_type,
                ReviewDecision.target_id == target_id,
                ReviewDecision.decision == "approve",
            )
        )
    )


def assert_claim_publishable(db: Session, claim: Claim) -> None:
    if not claim.rights_cleared or not claim.redaction_approved:
        raise HTTPException(status_code=409, detail="Rights clearance and redaction approval are required")
    if not db.scalar(select(Citation.id).where(Citation.claim_id == claim.id).limit(1)):
        raise HTTPException(status_code=409, detail="At least one citation is required")
    approvals = _approvals(db, "claim", claim.id)
    reviewers = {item.reviewer_id for item in approvals if item.reviewer_role == "reviewer"}
    editors = {item.reviewer_id for item in approvals if item.reviewer_role in {"editor", "admin"}}
    if len(reviewers) < 2 or not editors:
        raise HTTPException(
            status_code=409, detail="Two independent reviewers and one editor approval are required"
        )


def assert_identity_publishable(db: Session, assertion: IdentityAssertion) -> None:
    if assertion.basis not in {"nameplate", "badge", "official_record"}:
        raise HTTPException(status_code=409, detail="Biometric resemblance is never an identity basis")
    if not assertion.second_source_url:
        raise HTTPException(status_code=409, detail="An independent second source is required")
    if not assertion.legal_reviewed:
        raise HTTPException(status_code=409, detail="Recorded legal approval is required")
    approvals = _approvals(db, "identity_assertion", assertion.id)
    reviewers = {item.reviewer_id for item in approvals if item.reviewer_role == "reviewer"}
    editors = {item.reviewer_id for item in approvals if item.reviewer_role in {"editor", "admin"}}
    legal = {item.reviewer_id for item in approvals if item.reviewer_role in {"legal", "admin"}}
    if len(reviewers) < 2 or not editors or not legal:
        raise HTTPException(status_code=409, detail="Two reviewers, editor, and legal approval are required")
