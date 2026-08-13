"""Independent checks for the completed SYNTHETIC_OFFLINE_NOT_CHESSCON study."""

from __future__ import annotations

import csv
import hashlib
import json
import re
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Any

from run_study import GENERATED, ROOT, sha256, write_json, write_manifest
from zero_wait_des import ARTIFACT_LABEL, POLICIES, load_manifest
from build_release import ARCHIVE, ARCHIVE_NAME, CHECKSUM, CONTENT_MANIFEST, RAW_DATA_FILES


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def verify_manifest(base: Path, manifest_path: Path) -> list[str]:
    errors: list[str] = []
    rows = read_csv(manifest_path)
    listed = {row["relative_path"]: row for row in rows}
    actual = {
        path.relative_to(base).as_posix(): path
        for path in base.rglob("*")
        if path.is_file() and path != manifest_path and "__pycache__" not in path.parts
    }
    if set(listed) != set(actual):
        errors.append("Manifest path set differs from current package files")
    for relative, path in actual.items():
        if relative not in listed:
            continue
        if listed[relative]["sha256"] != sha256(path):
            errors.append(f"Hash mismatch: {relative}")
        if int(listed[relative]["bytes"]) != path.stat().st_size:
            errors.append(f"Size mismatch: {relative}")
    return errors


def verify_release_archive() -> list[str]:
    """Validate the published raw-data ZIP against its external inventory."""
    errors: list[str] = []
    required = (ARCHIVE, CHECKSUM, CONTENT_MANIFEST)
    for path in required:
        if not path.is_file():
            errors.append(f"Missing release artifact: {path.relative_to(ROOT)}")
    if errors:
        return errors

    checksum_parts = CHECKSUM.read_text(encoding="utf-8").strip().split()
    if len(checksum_parts) != 2 or checksum_parts[1] != ARCHIVE_NAME:
        errors.append("Release checksum file has an unexpected format")
    elif checksum_parts[0] != sha256(ARCHIVE):
        errors.append("Release raw-data ZIP checksum mismatch")

    manifest_rows = read_csv(CONTENT_MANIFEST)
    expected = {relative.as_posix() for relative in RAW_DATA_FILES}
    listed = {row["relative_path"]: row for row in manifest_rows}
    if set(listed) != expected:
        errors.append("Release ZIP content manifest path set differs from the declared raw-data inventory")
    if len(listed) != len(manifest_rows):
        errors.append("Release ZIP content manifest contains duplicate paths")
    for relative, row in listed.items():
        path = ROOT / relative
        if row.get("artifact_label") != ARTIFACT_LABEL:
            errors.append(f"Release ZIP content manifest has incorrect label: {relative}")
        if not path.is_file():
            errors.append(f"Release ZIP source file is missing: {relative}")
            continue
        if row.get("sha256") != sha256(path):
            errors.append(f"Release ZIP content manifest hash mismatch: {relative}")
        if row.get("bytes") != str(path.stat().st_size):
            errors.append(f"Release ZIP content manifest size mismatch: {relative}")

    try:
        with zipfile.ZipFile(ARCHIVE) as archive:
            names = set(archive.namelist())
            expected_names = expected | {CONTENT_MANIFEST.name}
            if names != expected_names:
                errors.append("Release ZIP path set differs from the release content manifest")
            if CONTENT_MANIFEST.name not in names:
                errors.append("Release ZIP does not contain its content manifest")
            elif archive.read(CONTENT_MANIFEST.name) != CONTENT_MANIFEST.read_bytes():
                errors.append("Release ZIP content manifest differs from the external copy")
            for relative, row in listed.items():
                if relative not in names:
                    continue
                content = archive.read(relative)
                if hashlib.sha256(content).hexdigest() != row.get("sha256"):
                    errors.append(f"Release ZIP member hash mismatch: {relative}")
                if len(content) != int(row.get("bytes", -1)):
                    errors.append(f"Release ZIP member size mismatch: {relative}")
    except zipfile.BadZipFile:
        errors.append("Release raw-data archive is not a valid ZIP file")
    return errors


def _negative_context(line: str, start: int) -> bool:
    prefix = line[max(0, start - 80):start].lower()
    return any(phrase in prefix for phrase in ("not a ", "not an ", "not ", "no native ", "neither an ", "neither a ", "future native ", "future "))


def scan_claims(base: Path) -> list[str]:
    """Reject positive claims while permitting required negative boundaries."""
    patterns = [
        re.compile(r"chesscon\s+(?:result|results|comparison|validation)", re.I),
        re.compile(r"validated\s+terminal", re.I),
        re.compile(r"field[- ]proven", re.I),
        re.compile(r"empirical\s+(?:result|results|evidence)", re.I),
    ]
    violations: list[str] = []
    for path in base.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in {".md", ".json", ".py", ".csv", ".txt"}:
            continue
        if "__pycache__" in path.parts or "tests" in path.parts or "legacy_smoke_test" in path.parts or path.name == "VERIFICATION_REPORT.json":
            continue
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            continue
        for line_number, line in enumerate(lines, start=1):
            for pattern in patterns:
                match = pattern.search(line)
                if match and not _negative_context(line, match.start()):
                    violations.append(f"Prohibited positive claim in {path.relative_to(base)}:{line_number}: {match.group(0)}")
    return violations


def verify() -> dict[str, Any]:
    manifest = load_manifest()
    errors: list[str] = []
    if manifest["artifact_label"] != ARTIFACT_LABEL:
        errors.append("Manifest artifact label is missing or incorrect")
    runs = read_csv(GENERATED / "raw_per_run.csv")
    moves = read_csv(GENERATED / "raw_per_move.csv")
    tapes = read_csv(GENERATED / "materialized_random_tape.csv")
    for filename, key, expected in (
        ("raw_per_move.json", "moves", moves),
        ("raw_per_run.json", "runs", runs),
    ):
        path = GENERATED / filename
        if not path.exists():
            errors.append(f"Missing required JSON raw output: {filename}")
            continue
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"Invalid JSON raw output {filename}: {exc.msg}")
            continue
        if payload.get("artifact_label") != ARTIFACT_LABEL:
            errors.append(f"{filename}: missing synthetic artifact label")
        if not isinstance(payload.get(key), list) or len(payload[key]) != len(expected):
            errors.append(f"{filename}: JSON record count differs from canonical CSV")
    expected_runs = 3 * int(manifest["replications_per_condition"]) * len(POLICIES)
    if len(runs) != expected_runs:
        errors.append(f"Expected {expected_runs} runs, found {len(runs)}")
    if any(row["status"] != "completed" for row in runs):
        errors.append("At least one planned run is not completed; failure records must be retained")
    expected_tapes = 3 * int(manifest["replications_per_condition"]) * int(manifest["moves_per_replication"]) * int(manifest["resources"]["internal_transfer_vehicles"])
    if len(tapes) != expected_tapes:
        errors.append(f"Expected {expected_tapes} materialized random-tape rows, found {len(tapes)}")
    if "policy" in (tapes[0] if tapes else {}):
        errors.append("Materialized random tape must not include a policy key")

    by_run: dict[tuple[str, int, str], list[dict[str, str]]] = defaultdict(list)
    for row in moves:
        by_run[(row["condition"], int(row["seed"]), row["policy"])].append(row)
    for run in runs:
        key = (run["condition"], int(run["seed"]), run["policy"])
        rows = sorted(by_run.get(key, []), key=lambda row: int(row["service_order"]))
        if len(rows) != int(manifest["moves_per_replication"]):
            errors.append(f"{key}: does not retain exactly 120 moves")
            continue
        ids = sorted(int(row["task_id"]) for row in rows)
        if ids != list(range(1, int(manifest["moves_per_replication"]) + 1)):
            errors.append(f"{key}: duplicate/lost task IDs")
        included = [row for row in rows if row["included_in_dwell_metric"] == "1"]
        if len(included) != 119 or rows[0]["included_in_dwell_metric"] != "0":
            errors.append(f"{key}: dwell metric does not use exactly moves 2-120")
        recomputed_total = sum(float(row["inter_cycle_dwell_s"]) for row in included)
        recomputed_mean = recomputed_total / 119.0
        if abs(recomputed_total - float(run["inter_cycle_dwell_s_total"])) > 2e-5:
            errors.append(f"{key}: dwell total does not recompute from raw events")
        if abs(recomputed_mean - float(run["inter_cycle_dwell_s_per_move"])) > 2e-5:
            errors.append(f"{key}: dwell mean does not recompute from raw events")
        if max(int(row["stage_occupancy"]) for row in rows) > 1 or int(run["max_stage_occupancy"]) > 1:
            errors.append(f"{key}: single stage capacity exceeded")
        if run["policy"] == "R0_REACTIVE" and any(row["handoff_kind"] in {"staged", "fallback"} for row in rows):
            errors.append(f"{key}: R0 used a forbidden staging/fallback state")
        if run["policy"] == "R0_REACTIVE" and any(int(row["controller_evaluations_this_cycle"]) != 0 for row in rows):
            errors.append(f"{key}: R0 has controller evaluations")
        if run["policy"] == "R1_ZERO_WAIT":
            for row in rows:
                if int(row["service_order"]) > 1 and int(row["controller_evaluations_this_cycle"]) < 1:
                    errors.append(f"{key}: R1 did not record a five-second evaluation cycle")
                if row["handoff_kind"] == "staged" and not row["reservation_evaluation_s"]:
                    errors.append(f"{key}: staged move has no reservation evidence")
                if row["handoff_kind"] == "staged":
                    evaluation = float(row["reservation_evaluation_s"])
                    arrival = float(row["stage_arrival_s"])
                    forecast = float(row["forecast_completion_s"])
                    if arrival < evaluation - 2e-5:
                        errors.append(f"{key}: staged vehicle arrived before its recorded reservation")
                    if forecast - evaluation < float(manifest["controller"]["reservation_lead_s"]) - 2e-5:
                        errors.append(f"{key}: reservation does not meet 10-s forecast lead")
                    if forecast - evaluation >= float(manifest["controller"]["reservation_lead_s"]) + float(manifest["controller"]["evaluation_interval_s"]) + 2e-5:
                        errors.append(f"{key}: reservation is more than one evaluation interval ahead of lead")
                    if int(row["controller_evaluations_before_reservation"]) < 1:
                        errors.append(f"{key}: staged move has no 5-s evaluation trace")
                    if int(row["controller_evaluations_before_reservation"]) != int(row["controller_evaluations_this_cycle"]):
                        errors.append(f"{key}: staged move evaluation count is inconsistent")
                if row["handoff_kind"] == "fallback" and row["fallback"] != "1":
                    errors.append(f"{key}: fallback event not counted")
                if int(row["blocked_task_recovery"]) and int(row["task_id"]) == 1:
                    errors.append(f"{key}: invalid first-task recovery")
                if int(row["vehicle_delay_known_to_selector"]) != 0:
                    errors.append(f"{key}: selector improperly observed a future vehicle-delay draw")
                task_start = float(row["task_block_start_s"])
                task_release = float(row["task_block_release_s"])
                handoff = float(row["sts_service_start_s"]) - float(row["common_final_handoff_s"])
                if task_release > task_start + 1e-9 and task_start <= handoff < task_release - 1e-9:
                    errors.append(f"{key}: task was handed off while its block interval was active")

    for condition in ("nominal", "congestion", "disruption"):
        for seed in manifest["randomness"]["seeds"]:
            present = {row["policy"] for row in runs if row["condition"] == condition and int(row["seed"]) == int(seed)}
            if present != set(POLICIES):
                errors.append(f"{condition}/{seed}: unmatched R0/R1 pair")
    # The registered disruption setting is an unforeseen, post-selection
    # perturbation. Its materialised rate should therefore be nonzero in the
    # executed disruption moves; this guards against accidental oracle ETA
    # selection that avoids every potential delay draw.
    disruption_moves = [row for row in moves if row["condition"] == "disruption"]
    if not any(float(row["vehicle_delay_s"]) > 0.0 for row in disruption_moves):
        errors.append("Disruption arm did not materialise any vehicle-delay event")
    for policy in POLICIES:
        if not any(float(row["vehicle_delay_s"]) > 0.0 for row in disruption_moves if row["policy"] == policy):
            errors.append(f"Disruption arm did not materialise a vehicle-delay event for {policy}")
    # Recompute every named run-level metric from raw move events.  This is
    # intentionally separate from the pairing summaries, which operate on
    # complete-replication values.
    for run in runs:
        key = (run["condition"], int(run["seed"]), run["policy"])
        rows = by_run.get(key, [])
        if not rows:
            continue
        recomputed = {
            "staged_vehicle_holding_s": sum(float(row["stage_wait_s"]) for row in rows),
            "stage_misses": sum(int(row["stage_miss"]) for row in rows),
            "fallbacks": sum(int(row["fallback"]) for row in rows),
            "stage_successes": sum(int(row["stage_occupancy"]) for row in rows),
            "blocked_task_recoveries": sum(int(row["blocked_task_recovery"]) for row in rows),
            "yard_queue_wait_s": sum(float(row["yard_queue_wait_s"]) for row in rows),
            "vehicle_assignments": len(rows),
            "completion_time_s": max(max(float(row["sts_service_end_s"]) for row in rows), max(float(row["yard_delivery_s"]) for row in rows)),
            "sts_completion_time_s": max(float(row["sts_service_end_s"]) for row in rows),
        }
        recomputed["effective_moves_per_hour"] = len(rows) * 3600.0 / recomputed["sts_completion_time_s"]
        for metric, value in recomputed.items():
            if abs(float(run[metric]) - value) > 2e-5:
                errors.append(f"{key}: {metric} does not recompute from raw events")
    claim_errors = scan_claims(ROOT)
    archive_errors = verify_release_archive()
    errors.extend(claim_errors)
    errors.extend(archive_errors)
    return {
        "artifact_label": ARTIFACT_LABEL,
        "study_id": manifest["study_id"],
        "passed": not errors,
        "checks": {
            "planned_runs": expected_runs,
            "raw_runs": len(runs),
            "raw_moves": len(moves),
            "materialized_tape_rows": len(tapes),
            "claim_scan_violations": len(claim_errors),
            "release_archive_errors": len(archive_errors),
        },
        "errors": errors,
    }


def main() -> None:
    report = verify()
    report_path = GENERATED / "VERIFICATION_REPORT.json"
    write_json(report_path, report)
    generated_manifest = GENERATED / "SHA256_MANIFEST.csv"
    write_manifest(GENERATED, generated_manifest, exclude={generated_manifest})
    root_manifest = ROOT / "SHA256_MANIFEST.csv"
    write_manifest(ROOT, root_manifest, exclude={root_manifest})
    # Re-check manifests after including the report and refreshed checksums.
    manifest_errors = verify_manifest(GENERATED, generated_manifest) + verify_manifest(ROOT, root_manifest)
    if manifest_errors:
        report["passed"] = False
        report["errors"].extend(manifest_errors)
        write_json(report_path, report)
        write_manifest(GENERATED, generated_manifest, exclude={generated_manifest})
        write_manifest(ROOT, root_manifest, exclude={root_manifest})
    print(json.dumps(report, sort_keys=True))
    if not report["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
