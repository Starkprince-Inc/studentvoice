import argparse
import json
from dataclasses import asdict
from pathlib import Path

from .integrity import create_manifest
from .pipeline import prepare_job


def main() -> None:
    parser = argparse.ArgumentParser(
        description="StudentVoice local evidence worker (original files only; no URL downloads)."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    integrity = subparsers.add_parser(
        "integrity", help="Compute an acquisition manifest without modifying the file"
    )
    integrity.add_argument("source", type=Path)
    prepare = subparsers.add_parser(
        "prepare", help="Create a review proxy, keyframes, and deterministic manifest"
    )
    prepare.add_argument("source", type=Path)
    prepare.add_argument("work_dir", type=Path)
    args = parser.parse_args()
    if args.command == "integrity":
        manifest = create_manifest(args.source)
        print(json.dumps(asdict(manifest) | {"manifest_sha256": manifest.manifest_sha256}, indent=2))
    else:
        print(json.dumps(prepare_job(args.source, args.work_dir), indent=2))


if __name__ == "__main__":
    main()
