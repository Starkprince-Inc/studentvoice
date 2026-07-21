import json
import shutil
import subprocess
from dataclasses import asdict, dataclass
from pathlib import Path

from .integrity import IntegrityManifest, create_manifest
from .policy import DEFAULT_POLICY, AnalysisPolicy


@dataclass(frozen=True)
class TimeMapping:
    original_start_ms: int
    derivative_start_ms: int
    rate: float = 1.0

    def derivative_to_original(self, derivative_ms: int) -> int:
        return self.original_start_ms + round((derivative_ms - self.derivative_start_ms) / self.rate)


@dataclass(frozen=True)
class ObservationProposal:
    proposal_type: str
    start_ms: int
    end_ms: int
    payload: dict
    model_name: str
    model_version: str
    confidence: float
    human_review_required: bool = True
    published: bool = False


def _require(binary: str) -> str:
    found = shutil.which(binary)
    if not found:
        raise RuntimeError(f"Required binary not found: {binary}")
    return found


def probe_media(source: Path) -> dict:
    ffprobe = _require("ffprobe")
    result = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-show_format",
            "-show_streams",
            "-of",
            "json",
            str(source.resolve(strict=True)),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout)


def create_proxy(source: Path, destination: Path, width: int = 960) -> IntegrityManifest:
    ffmpeg = _require("ffmpeg")
    destination.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            ffmpeg,
            "-nostdin",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(source.resolve(strict=True)),
            "-map_metadata",
            "-1",
            "-vf",
            f"scale='min({width},iw)':-2",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "26",
            "-c:a",
            "aac",
            "-b:a",
            "96k",
            "-movflags",
            "+faststart",
            "-y",
            str(destination),
        ],
        check=True,
    )
    return create_manifest(destination, "video/mp4")


def extract_keyframes(source: Path, destination: Path, interval_seconds: int = 10) -> list[Path]:
    ffmpeg = _require("ffmpeg")
    destination.mkdir(parents=True, exist_ok=True)
    pattern = destination / "frame-%06d.jpg"
    subprocess.run(
        [
            ffmpeg,
            "-nostdin",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(source.resolve(strict=True)),
            "-vf",
            f"fps=1/{interval_seconds},scale='min(1280,iw)':-2",
            "-q:v",
            "3",
            "-y",
            str(pattern),
        ],
        check=True,
    )
    return sorted(destination.glob("frame-*.jpg"))


def privacy_mask_proposal(
    start_ms: int, end_ms: int, boxes: list[dict], detector: str, version: str, confidence: float
) -> ObservationProposal:
    return ObservationProposal(
        proposal_type="privacy_mask_proposal",
        start_ms=start_ms,
        end_ms=end_ms,
        payload={"boxes": boxes, "purpose": "redaction_only", "cross_video_identity": False},
        model_name=detector,
        model_version=version,
        confidence=confidence,
    )


def prepare_job(source: Path, work_dir: Path, policy: AnalysisPolicy = DEFAULT_POLICY) -> dict:
    policy.validate()
    source_manifest = create_manifest(source)
    metadata = probe_media(source)
    proxy_path = work_dir / "proxy" / "review.mp4"
    proxy_manifest = create_proxy(source, proxy_path)
    frames = extract_keyframes(proxy_path, work_dir / "keyframes")
    job = {
        "schema_version": "1.0",
        "source": asdict(source_manifest) | {"manifest_sha256": source_manifest.manifest_sha256},
        "proxy": asdict(proxy_manifest)
        | {"manifest_sha256": proxy_manifest.manifest_sha256, "time_mapping": asdict(TimeMapping(0, 0))},
        "technical_metadata": metadata,
        "keyframes": [str(frame) for frame in frames],
        "enabled_capabilities": sorted(str(item) for item in policy.enabled),
        "prohibited_capabilities": ["face recognition", "gait recognition", "cross-video re-identification"],
        "publication_state": "private_machine_proposals_only",
    }
    manifest_path = work_dir / "job-manifest.json"
    manifest_path.write_text(json.dumps(job, indent=2, sort_keys=True), encoding="utf-8")
    return job
