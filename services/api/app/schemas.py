from datetime import datetime
from typing import Literal

from pydantic import AnyHttpUrl, BaseModel, Field, field_validator

from .models import ClaimStatus


class SubmissionCreate(BaseModel):
    alias: str | None = Field(default=None, max_length=100)
    contact: str | None = Field(default=None, max_length=500)
    source_url: AnyHttpUrl | None = None
    context: str = Field(default="", max_length=10_000)
    rights_basis: Literal["creator", "authorized_by_creator", "link_only"]
    consent_restrictions: str | None = Field(default=None, max_length=4_000)
    original_filename: str | None = Field(default=None, max_length=512)
    expected_size: int | None = Field(default=None, ge=1)

    @field_validator("original_filename")
    @classmethod
    def safe_filename(cls, value: str | None):
        if value and ("/" in value or "\\" in value or value in {".", ".."}):
            raise ValueError("original_filename must not contain a path")
        return value


class SubmissionComplete(BaseModel):
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    blake3: str = Field(pattern=r"^[0-9a-f]{64}$")
    byte_size: int = Field(gt=0)
    media_type: str = Field(max_length=160)
    storage_key: str = Field(max_length=2048)


class ClaimCreate(BaseModel):
    event_id: str
    title: str = Field(min_length=5, max_length=500)
    body: str = Field(min_length=10, max_length=20_000)
    status: ClaimStatus = ClaimStatus.under_review
    rights_cleared: bool = False
    redaction_approved: bool = False


class CitationCreate(BaseModel):
    source_id: str | None = None
    derivative_id: str | None = None
    start_ms: int | None = Field(default=None, ge=0)
    end_ms: int | None = Field(default=None, ge=0)
    quoted_text: str | None = Field(default=None, max_length=4_000)


class ReviewCreate(BaseModel):
    decision: Literal["approve", "reject"]
    notes: str | None = Field(default=None, max_length=5_000)


class IdentityCreate(BaseModel):
    subject_id: str
    proposed_name: str = Field(min_length=2, max_length=240)
    basis: Literal["nameplate", "badge", "official_record"]
    basis_citation: str = Field(min_length=5, max_length=4_000)
    second_source_url: AnyHttpUrl | None = None


class LegalReview(BaseModel):
    approved: bool
    notes: str = Field(min_length=5, max_length=5_000)


class CorrectionCreate(BaseModel):
    reason: str = Field(min_length=5, max_length=5_000)
    previous_text: str = Field(min_length=1, max_length=20_000)
    replacement_text: str = Field(min_length=1, max_length=20_000)


class RightOfReplyCreate(BaseModel):
    subject_id: str
    status: Literal["invited", "received", "declined", "unreachable"] = "invited"
    response_text: str | None = Field(default=None, max_length=20_000)
    public: bool = False


class Receipt(BaseModel):
    submission_id: str
    receipt_code: str
    status: str
    created_at: datetime
    sha256: str | None = None
    blake3: str | None = None
