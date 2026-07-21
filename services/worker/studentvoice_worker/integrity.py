import hashlib
import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

import blake3


@dataclass(frozen=True)
class IntegrityManifest:
    original_filename: str
    byte_size: int
    sha256: str
    blake3: str
    acquired_at: str
    media_type: str | None = None

    def canonical_bytes(self) -> bytes:
        return json.dumps(asdict(self), sort_keys=True, separators=(",", ":")).encode("utf-8")

    @property
    def manifest_sha256(self) -> str:
        return hashlib.sha256(self.canonical_bytes()).hexdigest()


def hash_file(path: Path, chunk_size: int = 8 * 1024 * 1024) -> tuple[str, str, int]:
    sha, b3, size = hashlib.sha256(), blake3.blake3(), 0
    with path.open("rb") as source:
        while chunk := source.read(chunk_size):
            size += len(chunk)
            sha.update(chunk)
            b3.update(chunk)
    return sha.hexdigest(), b3.hexdigest(), size


def create_manifest(
    path: Path, media_type: str | None = None, acquired_at: datetime | None = None
) -> IntegrityManifest:
    resolved = path.resolve(strict=True)
    if not resolved.is_file():
        raise ValueError("Evidence path must be a regular file")
    sha256, blake3_hash, size = hash_file(resolved)
    acquired = acquired_at or datetime.now(timezone.utc)
    return IntegrityManifest(
        original_filename=resolved.name,
        byte_size=size,
        sha256=sha256,
        blake3=blake3_hash,
        acquired_at=acquired.isoformat(),
        media_type=media_type,
    )


def verify_manifest(path: Path, manifest: IntegrityManifest) -> bool:
    sha256, blake3_hash, size = hash_file(path.resolve(strict=True))
    return (sha256, blake3_hash, size) == (manifest.sha256, manifest.blake3, manifest.byte_size)
