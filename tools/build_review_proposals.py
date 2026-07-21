"""Build private, privacy-redacted review proposals from extracted frames.

This tool performs face *detection only for redaction*. It creates no face
embeddings, identity matches, cross-file tracks, or public evidence records.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import UTC, datetime
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageFont


WINDOW_RE = re.compile(r"window-(\d{4}|\d{6})$")
FRAME_RE = re.compile(r"frame_(\d+)\.jpg$", re.IGNORECASE)
CUE_RE = re.compile(r"cue_(\d+)\.jpg$", re.IGNORECASE)


def parse_clock(value: str) -> float:
    parts = [float(part) for part in value.split(":")]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    raise ValueError(f"Invalid clock value: {value}")


def window_start(name: str) -> float:
    match = WINDOW_RE.fullmatch(name)
    if not match:
        raise ValueError(name)
    digits = match.group(1)
    if len(digits) == 4:
        return int(digits[:2]) * 60 + int(digits[2:])
    return int(digits[:2]) * 3600 + int(digits[2:4]) * 60 + int(digits[4:])


def clock(seconds: float) -> str:
    total_ms = round(seconds * 1000)
    hours, remainder = divmod(total_ms, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    suffix = f".{millis:03d}" if millis else ""
    return f"{hours:02d}:{minutes:02d}:{secs:02d}{suffix}"


def filename_clock(seconds: float) -> str:
    total_tenths = round(seconds * 10)
    hours, remainder = divmod(total_tenths, 36_000)
    minutes, remainder = divmod(remainder, 600)
    secs, tenths = divmod(remainder, 10)
    return f"{hours:02d}h{minutes:02d}m{secs:02d}s{tenths}"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path(r"C:\Windows\Fonts\arialbd.ttf") if bold else Path(r"C:\Windows\Fonts\arial.ttf"),
        Path(r"C:\Windows\Fonts\segoeuib.ttf") if bold else Path(r"C:\Windows\Fonts\segoeui.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def pixelate(image: Image.Image, box: tuple[int, int, int, int], block: int = 12) -> None:
    x1, y1, x2, y2 = box
    region = image.crop(box)
    region = region.resize(
        (max(1, (x2 - x1) // block), max(1, (y2 - y1) // block)),
        Image.Resampling.BILINEAR,
    ).resize((x2 - x1, y2 - y1), Image.Resampling.NEAREST)
    image.paste(region, box)


def detect_redactions(frame: cv2.typing.MatLike) -> list[tuple[int, int, int, int]]:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(
        str(Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml")
    )
    detections = cascade.detectMultiScale(
        gray,
        scaleFactor=1.08,
        minNeighbors=4,
        minSize=(22, 22),
    )
    height, width = gray.shape
    boxes: list[tuple[int, int, int, int]] = []
    for x, y, w, h in detections:
        padding = max(8, round(max(w, h) * 0.2))
        boxes.append(
            tuple(
                int(value)
                for value in (
                    max(0, x - padding),
                    max(0, y - padding),
                    min(width, x + w + padding),
                    min(height, y + h + padding),
                )
            )
        )
    return boxes


def candidates(root: Path, cue_times: list[float], interval: float) -> list[tuple[float, str, Path]]:
    result: list[tuple[float, str, Path]] = []
    for directory in sorted(path for path in root.iterdir() if path.is_dir()):
        if WINDOW_RE.fullmatch(directory.name):
            start = window_start(directory.name)
            for path in sorted(directory.glob("frame_*.jpg")):
                match = FRAME_RE.fullmatch(path.name)
                if match:
                    timestamp = start + (int(match.group(1)) - 1) * interval
                    result.append((timestamp, directory.name, path))
        elif directory.name == "frames":
            for path in sorted(directory.glob("cue_*.jpg")):
                match = CUE_RE.fullmatch(path.name)
                if match and int(match.group(1)) < len(cue_times):
                    result.append((cue_times[int(match.group(1))], "cue", path))
    return sorted(result, key=lambda item: (item[0], item[1], item[2].name))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-root", type=Path, required=True)
    parser.add_argument("--output-root", type=Path, required=True)
    parser.add_argument("--source-sha256", required=True)
    parser.add_argument("--interval", type=float, default=0.5)
    parser.add_argument("--cue-times", default="")
    args = parser.parse_args()

    input_root = args.input_root.resolve()
    output_root = args.output_root.resolve()
    output_root.mkdir(parents=True, exist_ok=True)
    if not input_root.is_dir():
        raise SystemExit(f"Input root does not exist: {input_root}")
    cue_times = [parse_clock(value.strip()) for value in args.cue_times.split(",") if value.strip()]

    manifest_path = output_root / "manifest.json"
    existing = json.loads(manifest_path.read_text("utf-8")) if manifest_path.exists() else {}
    manual_items = [
        item for item in existing.get("items", []) if not str(item.get("record_id", "")).startswith("SV-SAM-P")
    ]

    seen_source_hashes: set[str] = set()
    proposals: list[dict[str, object]] = []
    skipped_duplicates = 0
    skipped_unreadable = 0
    for timestamp, series, source_path in candidates(input_root, cue_times, args.interval):
        source_hash = hashlib.sha256(source_path.read_bytes()).hexdigest()
        if source_hash in seen_source_hashes:
            skipped_duplicates += 1
            continue
        seen_source_hashes.add(source_hash)
        frame = cv2.imread(str(source_path))
        if frame is None:
            skipped_unreadable += 1
            continue
        frame = cv2.resize(frame, (960, 540), interpolation=cv2.INTER_AREA)
        boxes = detect_redactions(frame)
        image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        for box in boxes:
            pixelate(image, box)

        number = len(proposals) + 1
        proposal_id = f"SV-SAM-P{number:04d}"
        draw = ImageDraw.Draw(image)
        draw.rounded_rectangle((18, 16, 328, 58), radius=5, fill="#11110f")
        draw.text((30, 26), f"{proposal_id}  |  {clock(timestamp)}", font=font(17, True), fill="#d9f24f")
        footer = Image.new("RGB", (960, 92), "#11110f")
        footer_draw = ImageDraw.Draw(footer)
        footer_draw.text((22, 14), "AUTOMATED REVIEW PROPOSAL - UNREVIEWED", font=font(21, True), fill="#d9f24f")
        footer_draw.text(
            (22, 51),
            "Face detection was used only to propose privacy masks. No recognition, identity, or conduct finding.",
            font=font(14),
            fill="#f5f1e8",
        )
        derivative = Image.new("RGB", (960, 632), "#11110f")
        derivative.paste(image, (0, 0))
        derivative.paste(footer, (0, 540))
        output_name = f"{proposal_id}_{filename_clock(timestamp)}.webp"
        output_path = output_root / output_name
        derivative.save(output_path, "WEBP", quality=84, method=6)
        proposals.append(
            {
                "record_id": proposal_id,
                "timestamp": clock(timestamp),
                "source_series": series,
                "source_frame_sha256": source_hash,
                "derivative_file": output_name,
                "sha256": hashlib.sha256(output_path.read_bytes()).hexdigest(),
                "privacy_redaction_boxes": [list(box) for box in boxes],
                "proposal_model": f"opencv-haar-frontalface-default@{cv2.__version__}",
                "review_status": "unreviewed",
                "public_status": "withheld_pending_rights_and_editorial_approval",
            }
        )

    manifest = {
        "source_sha256": args.source_sha256.lower(),
        "generated_at": datetime.now(UTC).isoformat(),
        "process": "manual review frames plus automated privacy-mask proposals; no biometric recognition or cross-file matching",
        "proposal_summary": {
            "generated": len(proposals),
            "exact_duplicates_skipped": skipped_duplicates,
            "unreadable_skipped": skipped_unreadable,
        },
        "items": manual_items + proposals,
    }
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest["proposal_summary"], indent=2))


if __name__ == "__main__":
    main()
