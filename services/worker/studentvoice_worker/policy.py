from dataclasses import dataclass
from enum import StrEnum


class AnalysisCapability(StrEnum):
    SCENE_DETECTION = "scene_detection"
    KEYFRAME_EXTRACTION = "keyframe_extraction"
    SPEECH_RECOGNITION = "speech_recognition"
    SPEAKER_SEGMENTATION = "non_identifying_speaker_segmentation"
    OCR = "ocr"
    PRIVACY_MASK_PROPOSAL = "privacy_mask_proposal"
    OBJECT_PROPOSAL = "object_proposal"
    PERCEPTUAL_DEDUPLICATION = "perceptual_deduplication"


PROHIBITED_CAPABILITIES = frozenset(
    {
        "face_recognition",
        "face_embedding",
        "gait_recognition",
        "cross_video_person_reidentification",
        "biometric_search",
        "personal_risk_scoring",
    }
)


@dataclass(frozen=True)
class AnalysisPolicy:
    enabled: frozenset[AnalysisCapability]
    human_review_required: bool = True
    allow_public_machine_output: bool = False

    def validate(self) -> None:
        values = {str(item) for item in self.enabled}
        blocked = values & PROHIBITED_CAPABILITIES
        if blocked:
            raise ValueError(f"Prohibited capabilities requested: {sorted(blocked)}")
        if not self.human_review_required or self.allow_public_machine_output:
            raise ValueError("Machine proposals must remain private until human review")


DEFAULT_POLICY = AnalysisPolicy(enabled=frozenset(AnalysisCapability))
