#!/usr/bin/env python3
"""Stage a vetted synthetic DES build without committing raw data.

The source directory must be the complete, verified study package. This script
copies only source, tests, configuration, claim material, aggregate results,
figures, and manifests into ``evidence/synthetic-des-v2``. It never copies
per-move/per-run traces or the materialized random tape; those remain in one
checksummed post-review GitHub Release asset.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import shutil
import sys
from pathlib import Path


ARTIFACT_LABEL = "SYNTHETIC_OFFLINE_NOT_CHESSCON"
REPOSITORY = Path(__file__).resolve().parents[1]
TARGET = REPOSITORY / "evidence" / "synthetic-des-v2"

COPY_MAP = {
    "CLAIM_BOUNDARY.md": "study/CLAIM_BOUNDARY.md",
    "requirements.txt": "requirements.txt",
    "build_release.py": "study/build_release.py",
    "run_study.py": "study/run_study.py",
    "verify_package.py": "study/verify_package.py",
    "zero_wait_des.py": "study/zero_wait_des.py",
    "config/scenario_manifest.json": "study/config/scenario_manifest.json",
    "tests/test_claim_scan.py": "study/tests/test_claim_scan.py",
    "tests/test_zero_wait_des.py": "study/tests/test_zero_wait_des.py",
    "generated/VERIFICATION_REPORT.json": "results/VERIFICATION_REPORT.json",
    "generated/failure_records.json": "results/failure_records.json",
    "generated/paired_summary.csv": "results/paired_summary.csv",
    "generated/study_metadata.json": "results/study_metadata.json",
    "generated/figures/figure_1_dwell_comparison.png": "results/figures/figure_1_dwell_comparison.png",
    "generated/figures/figure_2_secondary_metrics.png": "results/figures/figure_2_secondary_metrics.png",
    "SHA256_MANIFEST.csv": "study/SHA256_MANIFEST.csv",
    "generated/SHA256_MANIFEST.csv": "provenance/generated_SHA256_MANIFEST.csv",
    "release/PROVENANCE.md": "provenance/RELEASE_PROVENANCE.md",
    "release/RAW_DATA_ZIP_MANIFEST.csv": "provenance/RAW_DATA_ZIP_MANIFEST.csv",
    "release/RELEASE_SUMMARY.json": "results/RELEASE_SUMMARY.json",
}

# The study verifier expects the package-level manifest at the study root.
# A second, immutable copy records the verified source package that was staged.
PROVENANCE_DUPLICATES = {
    "SHA256_MANIFEST.csv": "provenance/source_SHA256_MANIFEST.csv",
}

# These are source-derived placeholders in the repository scaffold and are
# expected to be replaced on the first successful staging run.
SCAFFOLD_REPLACEABLE = {"requirements.txt"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def required_source(source: Path) -> list[Path]:
    return [source / relative_path for relative_path in COPY_MAP]


def validate_source(source: Path, raw_archive: Path) -> dict[str, object]:
    missing = [path.relative_to(source).as_posix() for path in required_source(source) if not path.is_file()]
    if missing:
        raise ValueError("Source is missing required files: " + ", ".join(missing))
    if not raw_archive.is_file() or raw_archive.suffix.lower() != ".zip":
        raise ValueError("--raw-archive must name an existing .zip file")

    manifest = json.loads((source / "config/scenario_manifest.json").read_text(encoding="utf-8"))
    if manifest.get("artifact_label") != ARTIFACT_LABEL:
        raise ValueError(f"Source manifest must declare {ARTIFACT_LABEL}")

    study_text = "\n".join(
        (source / relative_path).read_text(encoding="utf-8")
        for relative_path in ("README.md", "CLAIM_BOUNDARY.md", "run_study.py", "zero_wait_des.py")
    ).lower()
    if "pre-registered" in study_text or "pre registered" in study_text:
        raise ValueError('Source still contains obsolete "pre-registered" wording; use "pre-specified".')
    if ARTIFACT_LABEL.lower() not in study_text:
        raise ValueError(f"Source claim material must visibly retain {ARTIFACT_LABEL}")

    return manifest


def write_release_pointer(raw_archive: Path) -> None:
    pointer = TARGET / "RELEASE_ASSET_POINTER.md"
    pointer.write_text(
        "# Raw synthetic-DES release asset\n\n"
        "**Status:** staged locally; pending post-review GitHub Release.\n\n"
        "The raw synthetic evidence is deliberately not committed to Git. "
        "Upload the following exact archive as a GitHub Release asset only after "
        "the review decision and release tag are approved.\n\n"
        "| Field | Value |\n"
        "| --- | --- |\n"
        f"| Release asset filename | `{raw_archive.name}` |\n"
        "| Release asset URL | Pending post-review release |\n"
        f"| SHA-256 | `{sha256(raw_archive)}` |\n"
        f"| Bytes | {raw_archive.stat().st_size} |\n"
        "| Scope | Offline synthetic DES only; not CHESSCON evidence |\n\n"
        "The archive must preserve the raw per-move and per-run traces, the "
        "materialized random tape, and their corresponding manifest. Do not "
        "replace it with CHESSCON files, vendor runtimes, or terminal data.\n",
        encoding="utf-8",
    )


def write_curated_public_manifest() -> None:
    """Hash the Git-tracked evidence snapshot without the raw release asset.

    The source-study manifest copied into this repository describes a complete
    local build, including raw traces intentionally excluded from Git. This
    separate manifest verifies only the curated public files and never implies
    that the raw CSV/JSON/tape archive was present or revalidated here.
    """
    destination = TARGET / "provenance" / "CURATED_PUBLIC_SHA256_MANIFEST.csv"
    rows = []
    for path in sorted(TARGET.rglob("*")):
        if not path.is_file() or path == destination or "__pycache__" in path.parts:
            continue
        relative = path.relative_to(TARGET).as_posix()
        if relative.startswith("study/generated/") or relative.startswith("study/release/"):
            continue
        rows.append(
            {
                "artifact_label": ARTIFACT_LABEL,
                "relative_path": relative,
                "sha256": sha256(path),
                "bytes": path.stat().st_size,
            }
        )
    with destination.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["artifact_label", "relative_path", "sha256", "bytes"],
            lineterminator="\n",
        )
        writer.writeheader()
        writer.writerows(rows)


def rebase_public_provenance() -> None:
    """Repair the one source-relative reference after flattening the release tree."""
    provenance = TARGET / "provenance" / "RELEASE_PROVENANCE.md"
    text = provenance.read_text(encoding="utf-8")
    text = text.replace(
        "`../config/scenario_manifest.json`",
        "`../study/config/scenario_manifest.json`",
    )
    provenance.write_text(text, encoding="utf-8")


def stage(source: Path, raw_archive: Path, force: bool) -> None:
    manifest = validate_source(source, raw_archive)
    destinations = [TARGET / relative_path for relative_path in COPY_MAP.values()]
    existing = [
        path.relative_to(TARGET).as_posix()
        for path in destinations
        if path.exists() and path.relative_to(TARGET).as_posix() not in SCAFFOLD_REPLACEABLE
    ]
    if existing and not force:
        raise ValueError("Destination already contains staged files; rerun with --force: " + ", ".join(existing))

    for source_relative, target_relative in COPY_MAP.items():
        destination = TARGET / target_relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source / source_relative, destination)

    for source_relative, target_relative in PROVENANCE_DUPLICATES.items():
        destination = TARGET / target_relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source / source_relative, destination)

    rebase_public_provenance()
    stage_manifest = {
        "artifact_label": ARTIFACT_LABEL,
        "source_study_id": manifest.get("study_id"),
        "source_manifest_sha256": sha256(source / "SHA256_MANIFEST.csv"),
        "raw_release_asset": {
            "filename": raw_archive.name,
            "sha256": sha256(raw_archive),
            "bytes": raw_archive.stat().st_size,
        },
        "tracked_public_files": sorted(
            set(COPY_MAP.values())
            | set(PROVENANCE_DUPLICATES.values())
            | {"provenance/CURATED_PUBLIC_SHA256_MANIFEST.csv"}
        ),
        "publication_transformations": {
            "provenance/RELEASE_PROVENANCE.md": "Rebased its source-relative configuration reference to the curated study path; original source identity remains in source_SHA256_MANIFEST.csv."
        },
        "untracked_raw_files": [
            "raw_per_move.*",
            "raw_per_run.*",
            "materialized_random_tape.csv",
            raw_archive.name,
        ],
    }
    provenance = TARGET / "provenance" / "PUBLICATION_STAGE.json"
    provenance.write_text(json.dumps(stage_manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    write_release_pointer(raw_archive)
    write_curated_public_manifest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True, help="Verified full synthetic-DES study package")
    parser.add_argument("--raw-archive", type=Path, required=True, help="Checksummed full raw-data ZIP to publish as a release asset")
    parser.add_argument("--force", action="store_true", help="Replace previously staged public study files after validation")
    args = parser.parse_args()

    try:
        stage(args.source.resolve(), args.raw_archive.resolve(), args.force)
    except ValueError as error:
        print(f"Refusing to stage synthetic DES release: {error}", file=sys.stderr)
        return 2
    print(f"Staged curated synthetic DES evidence in {TARGET}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
