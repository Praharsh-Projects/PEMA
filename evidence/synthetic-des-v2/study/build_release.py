"""Build a checksummed raw-data release for SYNTHETIC_OFFLINE_NOT_CHESSCON.

This script intentionally packages only the independently reproducible
synthetic inputs and generated outputs.  It contains no CHESSCON data or
native-platform evidence.
"""

from __future__ import annotations

import csv
import hashlib
import json
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from run_study import GENERATED, ROOT, sha256, write_csv, write_json
from zero_wait_des import ARTIFACT_LABEL, STUDY_ID


RELEASE = ROOT / "release"
ARCHIVE_NAME = "ZERO_WAIT_SYNTHETIC_DES_V2_FULL_RAW_DATA.zip"
ARCHIVE = RELEASE / ARCHIVE_NAME
CHECKSUM = RELEASE / f"{ARCHIVE_NAME}.sha256"
CONTENT_MANIFEST = RELEASE / "RAW_DATA_ZIP_MANIFEST.csv"
SUMMARY = RELEASE / "RELEASE_SUMMARY.json"

# Excluding verification and checksum files prevents a checksum-report update
# from changing the immutable raw-data archive contents.
RAW_DATA_FILES = (
    Path("config/scenario_manifest.json"),
    Path("generated/raw_per_move.csv"),
    Path("generated/raw_per_move.json"),
    Path("generated/raw_per_run.csv"),
    Path("generated/raw_per_run.json"),
    Path("generated/materialized_random_tape.csv"),
    Path("generated/paired_summary.csv"),
    Path("generated/study_metadata.json"),
    Path("generated/failure_records.json"),
    Path("generated/figures/figure_1_dwell_comparison.png"),
    Path("generated/figures/figure_2_secondary_metrics.png"),
)


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def _require_inputs() -> list[Path]:
    paths = [ROOT / relative for relative in RAW_DATA_FILES]
    missing = [str(path.relative_to(ROOT)) for path in paths if not path.is_file()]
    if missing:
        raise FileNotFoundError(f"Missing generated release input(s): {', '.join(missing)}")
    return paths


def _write_content_manifest(paths: list[Path]) -> list[dict[str, Any]]:
    rows = [
        {
            "artifact_label": ARTIFACT_LABEL,
            "relative_path": path.relative_to(ROOT).as_posix(),
            "sha256": sha256(path),
            "bytes": path.stat().st_size,
        }
        for path in paths
    ]
    write_csv(CONTENT_MANIFEST, rows, ["artifact_label", "relative_path", "sha256", "bytes"])
    return rows


def _zip_write(archive: zipfile.ZipFile, source: Path, archive_name: str) -> None:
    """Write an entry with fixed metadata so unchanged inputs give one ZIP."""
    info = zipfile.ZipInfo(archive_name, date_time=(2026, 8, 14, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o100644 << 16
    archive.writestr(info, source.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def _build_archive(paths: list[Path]) -> None:
    temporary = ARCHIVE.with_suffix(".zip.tmp")
    with zipfile.ZipFile(temporary, mode="w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in paths:
            _zip_write(archive, path, path.relative_to(ROOT).as_posix())
        _zip_write(archive, CONTENT_MANIFEST, CONTENT_MANIFEST.name)
    temporary.replace(ARCHIVE)


def _write_checksum() -> str:
    digest = sha256(ARCHIVE)
    CHECKSUM.write_text(f"{digest}  {ARCHIVE_NAME}\n", encoding="utf-8")
    return digest


def _summary(rows: list[dict[str, Any]], archive_hash: str) -> dict[str, Any]:
    run_rows = _read_csv(GENERATED / "raw_per_run.csv")
    move_rows = _read_csv(GENERATED / "raw_per_move.csv")
    tape_rows = _read_csv(GENERATED / "materialized_random_tape.csv")
    paired_rows = _read_csv(GENERATED / "paired_summary.csv")
    metadata = json.loads((GENERATED / "study_metadata.json").read_text(encoding="utf-8"))
    return {
        "artifact_label": ARTIFACT_LABEL,
        "release_id": "ZERO_WAIT_SYNTHETIC_DES_V2_RELEASE_2026_08_14",
        "study_id": STUDY_ID,
        "release_built_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "claim_boundary": "Offline, uncalibrated synthetic DES only; not a terminal result or CHESSCON result.",
        "raw_data_archive": {
            "path": f"release/{ARCHIVE_NAME}",
            "sha256": archive_hash,
            "bytes": ARCHIVE.stat().st_size,
            "content_manifest": f"release/{CONTENT_MANIFEST.name}",
            "files": len(rows),
        },
        "execution": {
            "planned_runs": metadata["planned_runs"],
            "completed_runs": metadata["completed_runs"],
            "failed_runs": metadata["failed_runs"],
            "raw_per_run_records": len(run_rows),
            "raw_per_move_records": len(move_rows),
            "materialized_random_tape_records": len(tape_rows),
            "paired_summary_records": len(paired_rows),
        },
        "pre_specification": "config/scenario_manifest.json",
        "verification_command": "python3 verify_package.py",
    }


def main() -> None:
    RELEASE.mkdir(parents=True, exist_ok=True)
    paths = _require_inputs()
    rows = _write_content_manifest(paths)
    _build_archive(paths)
    archive_hash = _write_checksum()
    write_json(SUMMARY, _summary(rows, archive_hash))
    print(json.dumps({"artifact_label": ARTIFACT_LABEL, "archive": str(ARCHIVE.relative_to(ROOT)), "sha256": archive_hash}, sort_keys=True))


if __name__ == "__main__":
    main()
