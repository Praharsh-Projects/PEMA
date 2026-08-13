#!/usr/bin/env python3
"""Verify the curated public synthetic-DES snapshot without raw trace data.

This validates the Git-tracked source, configuration, aggregate results,
figures, provenance, and claim boundary. It does not claim to revalidate the
omitted CSV/JSON/tape archive, whose expected SHA-256 is recorded separately.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
from pathlib import Path


ARTIFACT_LABEL = "SYNTHETIC_OFFLINE_NOT_CHESSCON"
REPO = Path(__file__).resolve().parents[1]
EVIDENCE = REPO / "evidence" / "synthetic-des-v2"
MANIFEST = EVIDENCE / "provenance" / "CURATED_PUBLIC_SHA256_MANIFEST.csv"
RAW_NAME = "ZERO_WAIT_SYNTHETIC_DES_V2_FULL_RAW_DATA.zip"
FORBIDDEN_RAW = (
    "raw_per_move.csv",
    "raw_per_move.json",
    "raw_per_run.csv",
    "raw_per_run.json",
    "materialized_random_tape.csv",
    RAW_NAME,
)


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def negative_context(line: str, start: int) -> bool:
    prefix = line[max(0, start - 90):start].lower()
    return any(
        token in prefix
        for token in ("not a ", "not an ", "not ", "no native ", "neither an ", "neither a ", "future native ", "future ")
    )


def scan_claims() -> list[str]:
    patterns = (
        re.compile(r"chesscon\s+(?:result|results|comparison|validation)", re.I),
        re.compile(r"validated\s+terminal", re.I),
        re.compile(r"field[- ]proven", re.I),
        re.compile(r"empirical\s+(?:result|results|evidence)", re.I),
    )
    errors: list[str] = []
    for path in EVIDENCE.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in {".md", ".json", ".py", ".csv", ".txt"}:
            continue
        if "tests" in path.parts or "__pycache__" in path.parts or path.name == "VERIFICATION_REPORT.json":
            continue
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            continue
        for number, line in enumerate(lines, start=1):
            for pattern in patterns:
                match = pattern.search(line)
                if match and not negative_context(line, match.start()):
                    errors.append(f"Prohibited positive claim in {path.relative_to(EVIDENCE)}:{number}: {match.group(0)}")
    return errors


def main() -> int:
    errors: list[str] = []
    if not MANIFEST.is_file():
        errors.append("Missing curated public SHA-256 manifest")
        rows: list[dict[str, str]] = []
    else:
        with MANIFEST.open(newline="", encoding="utf-8") as handle:
            rows = list(csv.DictReader(handle))
    listed = {row.get("relative_path", ""): row for row in rows}
    actual = {
        path.relative_to(EVIDENCE).as_posix(): path
        for path in EVIDENCE.rglob("*")
        if path.is_file() and path != MANIFEST and "__pycache__" not in path.parts
    }
    if len(listed) != len(rows):
        errors.append("Curated public manifest contains duplicate paths")
    if set(listed) != set(actual):
        errors.append("Curated public manifest path set differs from current evidence files")
    for relative, path in actual.items():
        row = listed.get(relative)
        if row is None:
            continue
        if row.get("artifact_label") != ARTIFACT_LABEL:
            errors.append(f"Incorrect artifact label: {relative}")
        if row.get("sha256") != digest(path):
            errors.append(f"Hash mismatch: {relative}")
        if row.get("bytes") != str(path.stat().st_size):
            errors.append(f"Size mismatch: {relative}")

    for name in FORBIDDEN_RAW:
        if any(path.name == name for path in EVIDENCE.rglob(name)):
            errors.append(f"Raw-release file is present in the Git snapshot: {name}")

    pointer = (EVIDENCE / "RELEASE_ASSET_POINTER.md").read_text(encoding="utf-8")
    if RAW_NAME not in pointer or not re.search(r"\b[a-f0-9]{64}\b", pointer):
        errors.append("Raw-release pointer lacks the expected archive name or SHA-256")

    report_path = EVIDENCE / "results" / "VERIFICATION_REPORT.json"
    try:
        frozen_report = json.loads(report_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        errors.append(f"Cannot read frozen full-study verification report: {error}")
        frozen_report = {}
    checks = frozen_report.get("checks", {})
    if not frozen_report.get("passed"):
        errors.append("Frozen full-study verification report is not passing")
    if frozen_report.get("artifact_label") != ARTIFACT_LABEL:
        errors.append("Frozen full-study verification report lacks the synthetic artifact label")
    for key, expected in (("planned_runs", 180), ("raw_runs", 180), ("raw_moves", 21600), ("materialized_tape_rows", 54000)):
        if checks.get(key) != expected:
            errors.append(f"Frozen full-study report has unexpected {key}: {checks.get(key)!r}")

    claim_errors = scan_claims()
    errors.extend(claim_errors)
    report = {
        "artifact_label": ARTIFACT_LABEL,
        "verification_mode": "curated_public_snapshot_without_raw_archive",
        "passed": not errors,
        "checks": {
            "manifest_rows": len(rows),
            "frozen_full_study_report_passed": bool(frozen_report.get("passed")),
            "frozen_planned_runs": checks.get("planned_runs"),
            "frozen_raw_runs": checks.get("raw_runs"),
            "frozen_raw_moves": checks.get("raw_moves"),
            "frozen_materialized_tape_rows": checks.get("materialized_tape_rows"),
            "claim_scan_violations": len(claim_errors),
            "raw_archive_present": False,
        },
        "raw_archive_boundary": "The raw CSV/JSON/tape archive is intentionally absent from Git and was not revalidated by this curated-snapshot check.",
        "errors": errors,
    }
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
