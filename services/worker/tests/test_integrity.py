from datetime import datetime, timezone
from pathlib import Path

from studentvoice_worker.integrity import create_manifest, verify_manifest
from studentvoice_worker.pipeline import TimeMapping, privacy_mask_proposal
from studentvoice_worker.policy import DEFAULT_POLICY, PROHIBITED_CAPABILITIES


def test_integrity_manifest_detects_any_change(tmp_path: Path):
    evidence = tmp_path / "camera-original.mp4"
    evidence.write_bytes(b"synthetic evidence bytes\x00\x01")
    acquired = datetime(2026, 7, 20, tzinfo=timezone.utc)
    manifest = create_manifest(evidence, "video/mp4", acquired)
    assert manifest.original_filename == "camera-original.mp4"
    assert manifest.byte_size == len(evidence.read_bytes())
    assert len(manifest.sha256) == 64 and len(manifest.blake3) == 64
    assert verify_manifest(evidence, manifest)
    evidence.write_bytes(evidence.read_bytes() + b"changed")
    assert not verify_manifest(evidence, manifest)


def test_timestamp_mapping_is_reversible_for_untrimmed_proxy():
    mapping = TimeMapping(original_start_ms=0, derivative_start_ms=0, rate=1.0)
    assert mapping.derivative_to_original(56_123) == 56_123


def test_privacy_detection_can_only_create_private_redaction_proposals():
    proposal = privacy_mask_proposal(
        1000, 1500, [{"x": 1, "y": 2, "width": 3, "height": 4}], "synthetic-detector", "test", 0.99
    )
    assert proposal.payload["purpose"] == "redaction_only"
    assert proposal.payload["cross_video_identity"] is False
    assert proposal.human_review_required is True
    assert proposal.published is False


def test_default_policy_excludes_biometrics():
    DEFAULT_POLICY.validate()
    enabled = {str(item) for item in DEFAULT_POLICY.enabled}
    assert enabled.isdisjoint(PROHIBITED_CAPABILITIES)
