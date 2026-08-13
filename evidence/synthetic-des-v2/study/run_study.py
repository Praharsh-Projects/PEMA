"""Run the complete, fixed synthetic ZERO-WAIT DES experiment.

All output produced here is SYNTHETIC_OFFLINE_NOT_CHESSCON.  This script has
no CHESSCON executable, project, TOS, or terminal-data dependency.
"""

from __future__ import annotations

import csv
import hashlib
import json
import random
import shutil
from collections import defaultdict
from pathlib import Path
from statistics import mean
from typing import Any, Iterable

from PIL import Image, ImageDraw, ImageFont

from zero_wait_des import ARTIFACT_LABEL, STUDY_ID, RandomTape, all_runs, load_manifest, run_simulation, stable_seed


ROOT = Path(__file__).resolve().parent
GENERATED = ROOT / "generated"
FIGURES = GENERATED / "figures"


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: Iterable[dict[str, Any]], fieldnames: list[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def percentile(values: list[float], fraction: float) -> float:
    if not values:
        raise ValueError("Cannot calculate a percentile of zero values")
    values = sorted(values)
    position = (len(values) - 1) * fraction
    low = int(position)
    high = min(low + 1, len(values) - 1)
    return values[low] + (values[high] - values[low]) * (position - low)


def bootstrap_interval(deltas: list[float], condition: str, metric: str, manifest: dict[str, Any]) -> tuple[float, float]:
    """Percentile bootstrap of the 30 replication-level paired deltas."""
    if len(deltas) != int(manifest["replications_per_condition"]):
        raise ValueError(f"Expected 30 paired deltas for {condition}/{metric}, received {len(deltas)}")
    rng = random.Random(stable_seed(STUDY_ID, "bootstrap", manifest["analysis"]["bootstrap_seed"], condition, metric))
    samples = []
    for _ in range(int(manifest["analysis"]["bootstrap_resamples"])):
        samples.append(mean(deltas[rng.randrange(len(deltas))] for _ in range(len(deltas))))
    return percentile(samples, 0.025), percentile(samples, 0.975)


def paired_summary(runs: list[dict[str, Any]], manifest: dict[str, Any]) -> list[dict[str, Any]]:
    completed = [row for row in runs if row["status"] == "completed"]
    index = {(row["condition"], int(row["seed"]), row["policy"]): row for row in completed}
    definitions = {
        "inter_cycle_dwell_s_per_move": ("R0_REACTIVE minus R1_ZERO_WAIT; positive means lower R1 synthetic dwell", "R0_REACTIVE", "R1_ZERO_WAIT"),
        "completion_time_s": ("R0_REACTIVE minus R1_ZERO_WAIT; positive means shorter R1 synthetic completion", "R0_REACTIVE", "R1_ZERO_WAIT"),
        "effective_moves_per_hour": ("R1_ZERO_WAIT minus R0_REACTIVE; positive means higher R1 synthetic rate", "R1_ZERO_WAIT", "R0_REACTIVE"),
        "staged_vehicle_holding_s": ("R0_REACTIVE minus R1_ZERO_WAIT; R1-only staged-vehicle holding, reported descriptively", "R0_REACTIVE", "R1_ZERO_WAIT"),
        "stage_misses": ("R1_ZERO_WAIT minus R0_REACTIVE; count of synthetic staging misses", "R1_ZERO_WAIT", "R0_REACTIVE"),
        "fallbacks": ("R1_ZERO_WAIT minus R0_REACTIVE; count of synthetic reactive fallbacks", "R1_ZERO_WAIT", "R0_REACTIVE"),
        "blocked_task_recoveries": ("R1_ZERO_WAIT minus R0_REACTIVE; count of synthetic horizon recoveries", "R1_ZERO_WAIT", "R0_REACTIVE"),
    }
    rows: list[dict[str, Any]] = []
    for condition in ("nominal", "congestion", "disruption"):
        for metric, (definition, lhs, rhs) in definitions.items():
            r0 = [index[(condition, seed, "R0_REACTIVE")] for seed in manifest["randomness"]["seeds"]]
            r1 = [index[(condition, seed, "R1_ZERO_WAIT")] for seed in manifest["randomness"]["seeds"]]
            deltas = [float(index[(condition, seed, lhs)][metric]) - float(index[(condition, seed, rhs)][metric]) for seed in manifest["randomness"]["seeds"]]
            lower, upper = bootstrap_interval(deltas, condition, metric, manifest)
            rows.append(
                {
                    "artifact_label": ARTIFACT_LABEL,
                    "study_id": STUDY_ID,
                    "condition": condition,
                    "metric": metric,
                    "pairs": len(deltas),
                    "r0_mean": round(mean(float(row[metric]) for row in r0), 6),
                    "r1_mean": round(mean(float(row[metric]) for row in r1), 6),
                    "paired_difference": round(mean(deltas), 6),
                    "difference_definition": definition,
                    "bootstrap_lower": round(lower, 6),
                    "bootstrap_upper": round(upper, 6),
                }
            )
    return rows


def _font(size: int):
    try:
        return ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


def _scale(value: float, low: float, high: float, pixel_low: float, pixel_high: float) -> float:
    if high <= low:
        return (pixel_low + pixel_high) / 2.0
    return pixel_high - (value - low) * (pixel_high - pixel_low) / (high - low)


def create_dwell_figure(summary: list[dict[str, Any]]) -> None:
    """Create a compact PNG comparison of synthetic R0/R1 dwell means."""
    lookup = {(row["condition"], row["metric"]): row for row in summary}
    width, height = 1280, 720
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    title_font, label_font, small_font = _font(28), _font(18), _font(14)
    draw.text((60, 38), "Synthetic offline DES: mean inter-cycle dwell", fill="#152238", font=title_font)
    draw.text((60, 78), "SYNTHETIC_OFFLINE_NOT_CHESSCON — 30 paired replications per condition", fill="#506072", font=small_font)
    values = []
    for condition in ("nominal", "congestion", "disruption"):
        row = lookup[(condition, "inter_cycle_dwell_s_per_move")]
        values.extend([float(row["r0_mean"]), float(row["r1_mean"])])
    max_value = max(values) * 1.18
    left, right, top, bottom = 110, 1190, 155, 610
    draw.line((left, top, left, bottom), fill="#25364c", width=2)
    draw.line((left, bottom, right, bottom), fill="#25364c", width=2)
    for tick in range(6):
        value = max_value * tick / 5.0
        y = _scale(value, 0, max_value, top, bottom)
        draw.line((left - 8, y, right, y), fill="#e5eaf0", width=1)
        draw.text((20, y - 10), f"{value:.1f}", fill="#506072", font=small_font)
    colors = ("#5E81AC", "#D08770")
    group_width = (right - left) / 3.0
    bar_width = 105
    for group_index, condition in enumerate(("nominal", "congestion", "disruption")):
        center = left + group_width * (group_index + 0.5)
        row = lookup[(condition, "inter_cycle_dwell_s_per_move")]
        for offset, policy, color in ((-65, "R0", colors[0]), (65, "R1", colors[1])):
            value = float(row["r0_mean"] if policy == "R0" else row["r1_mean"])
            x0, x1 = center + offset - bar_width / 2.0, center + offset + bar_width / 2.0
            y = _scale(value, 0, max_value, top, bottom)
            draw.rounded_rectangle((x0, y, x1, bottom), radius=8, fill=color)
            draw.text((x0 + 12, y - 27), f"{value:.2f}", fill="#152238", font=small_font)
        delta = float(row["paired_difference"])
        draw.text((center - 85, bottom + 20), condition.capitalize(), fill="#152238", font=label_font)
        draw.text((center - 106, bottom + 48), f"paired R0−R1: {delta:+.2f} s", fill="#506072", font=small_font)
    draw.rectangle((875, 102, 895, 122), fill=colors[0])
    draw.text((905, 102), "R0_REACTIVE", fill="#152238", font=small_font)
    draw.rectangle((1030, 102, 1050, 122), fill=colors[1])
    draw.text((1060, 102), "R1_ZERO_WAIT", fill="#152238", font=small_font)
    draw.text((60, 670), "Metric: mean of 119 inter-cycle transitions per replication. Bar heights are synthetic model summaries only.", fill="#506072", font=small_font)
    image.save(FIGURES / "figure_1_dwell_comparison.png")


def create_secondary_figure(summary: list[dict[str, Any]]) -> None:
    """Create a two-panel PNG of synthetic secondary paired summaries."""
    lookup = {(row["condition"], row["metric"]): row for row in summary}
    width, height = 1280, 720
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    title_font, label_font, small_font = _font(26), _font(17), _font(14)
    draw.text((58, 35), "Synthetic offline DES: paired secondary summaries", fill="#152238", font=title_font)
    draw.text((58, 73), "SYNTHETIC_OFFLINE_NOT_CHESSCON — positive values follow the definition beneath each panel", fill="#506072", font=small_font)
    panels = [
        ("completion_time_s", "Paired completion-time change (R0−R1, s)", "#5E81AC"),
        ("effective_moves_per_hour", "Paired effective-rate change (R1−R0, moves/h)", "#A3BE8C"),
    ]
    for panel_index, (metric, heading, color) in enumerate(panels):
        left = 80 + panel_index * 620
        right = left + 520
        top, bottom = 165, 605
        values = [float(lookup[(condition, metric)]["paired_difference"]) for condition in ("nominal", "congestion", "disruption")]
        extreme = max(abs(value) for value in values) or 1.0
        low, high = -extreme * 1.25, extreme * 1.25
        zero = _scale(0, low, high, top, bottom)
        draw.text((left, 120), heading, fill="#152238", font=label_font)
        draw.line((left, top, left, bottom), fill="#25364c", width=2)
        draw.line((left, zero, right, zero), fill="#25364c", width=2)
        for tick in range(5):
            value = low + (high - low) * tick / 4.0
            y = _scale(value, low, high, top, bottom)
            draw.line((left - 5, y, right, y), fill="#e5eaf0", width=1)
            draw.text((left - 57, y - 8), f"{value:.1f}", fill="#506072", font=small_font)
        group_width = (right - left) / 3.0
        for index, condition in enumerate(("nominal", "congestion", "disruption")):
            value = float(lookup[(condition, metric)]["paired_difference"])
            center = left + group_width * (index + 0.5)
            y = _scale(value, low, high, top, bottom)
            x0, x1 = center - 55, center + 55
            draw.rounded_rectangle((x0, min(y, zero), x1, max(y, zero)), radius=8, fill=color)
            draw.text((center - 36, y - 25 if value >= 0 else y + 8), f"{value:+.2f}", fill="#152238", font=small_font)
            draw.text((center - 36, bottom + 20), condition.capitalize(), fill="#152238", font=small_font)
    draw.text((58, 672), "Each bar is the mean of 30 paired replication differences under declared synthetic assumptions; not a terminal estimate.", fill="#506072", font=small_font)
    image.save(FIGURES / "figure_2_secondary_metrics.png")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def write_manifest(base: Path, destination: Path, *, exclude: set[Path] | None = None) -> None:
    excluded = {path.resolve() for path in (exclude or set())}
    rows = []
    for path in sorted(base.rglob("*")):
        if not path.is_file() or path.resolve() in excluded or "__pycache__" in path.parts:
            continue
        rows.append(
            {
                "artifact_label": ARTIFACT_LABEL,
                "relative_path": path.relative_to(base).as_posix(),
                "sha256": sha256(path),
                "bytes": path.stat().st_size,
            }
        )
    write_csv(destination, rows, ["artifact_label", "relative_path", "sha256", "bytes"])


def run() -> None:
    manifest = load_manifest()
    if GENERATED.exists():
        shutil.rmtree(GENERATED)
    FIGURES.mkdir(parents=True, exist_ok=True)
    runs: list[dict[str, Any]] = []
    moves: list[dict[str, Any]] = []
    tapes: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []
    for condition in ("nominal", "congestion", "disruption"):
        for seed in manifest["randomness"]["seeds"]:
            tapes.extend(RandomTape(manifest, condition, int(seed)).materialized_rows())
    for condition, seed, policy in all_runs(manifest):
        try:
            run_row, move_rows = run_simulation(manifest, condition, seed, policy)
            runs.append(run_row)
            moves.extend(move_rows)
        except Exception as exc:  # preserved instead of silently removed
            failure = {
                "artifact_label": ARTIFACT_LABEL,
                "study_id": STUDY_ID,
                "condition": condition,
                "seed": seed,
                "policy": policy,
                "status": "failed",
                "error_type": type(exc).__name__,
                "error": str(exc),
            }
            failures.append(failure)
            runs.append(failure)

    tape_columns = [
        "artifact_label", "study_id", "condition", "seed", "task_id", "vehicle_id", "crane_service_s",
        "common_final_handoff_s", "task_block_start_s", "task_block_release_s", "presentation_s", "vehicle_delay_s",
        "loaded_travel_s", "yard_service_s", "empty_travel_s",
    ]
    move_columns = [
        "artifact_label", "study_id", "condition", "seed", "policy", "service_order", "task_id", "vehicle_id",
        "handoff_kind", "task_block_start_s", "task_block_release_s", "task_demand_s", "task_block_wait_s",
        "reservation_evaluation_s", "forecast_completion_s", "approach_arrival_s", "stage_arrival_s", "controller_evaluations_before_reservation", "controller_evaluations_this_cycle", "presentation_s", "vehicle_delay_s", "vehicle_delay_known_to_selector",
        "common_final_handoff_s", "sts_service_start_s", "sts_service_end_s", "crane_service_s", "inter_cycle_dwell_s",
        "included_in_dwell_metric", "stage_wait_s", "stage_occupancy", "stage_miss", "fallback", "blocked_task_recovery",
        "loaded_travel_s", "yard_arrival_s", "yard_start_s", "yard_queue_wait_s", "yard_service_s", "yard_delivery_s",
        "empty_travel_s", "vehicle_return_s",
    ]
    run_columns = [
        "artifact_label", "study_id", "condition", "seed", "policy", "status", "completed_moves", "unique_tasks_completed",
        "dwell_transitions", "inter_cycle_dwell_s_total", "inter_cycle_dwell_s_per_move", "sts_completion_time_s",
        "completion_time_s", "effective_moves_per_hour", "staged_vehicle_holding_s", "stage_misses", "fallbacks", "reservations",
        "stage_successes", "blocked_task_recoveries", "yard_queue_wait_s", "max_stage_occupancy", "vehicle_assignments",
    ]
    write_csv(GENERATED / "materialized_random_tape.csv", tapes, tape_columns)
    write_csv(GENERATED / "raw_per_move.csv", moves, move_columns)
    write_json(GENERATED / "raw_per_move.json", {"artifact_label": ARTIFACT_LABEL, "study_id": STUDY_ID, "moves": moves})
    write_csv(GENERATED / "raw_per_run.csv", runs, run_columns)
    write_json(GENERATED / "raw_per_run.json", {"artifact_label": ARTIFACT_LABEL, "study_id": STUDY_ID, "runs": runs})
    write_json(GENERATED / "failure_records.json", {"artifact_label": ARTIFACT_LABEL, "failures": failures})

    expected_runs = 3 * int(manifest["replications_per_condition"]) * 2
    complete = not failures and len(runs) == expected_runs
    summary: list[dict[str, Any]] = paired_summary(runs, manifest) if complete else []
    summary_columns = [
        "artifact_label", "study_id", "condition", "metric", "pairs", "r0_mean", "r1_mean", "paired_difference",
        "difference_definition", "bootstrap_lower", "bootstrap_upper",
    ]
    write_csv(GENERATED / "paired_summary.csv", summary, summary_columns)
    if complete:
        create_dwell_figure(summary)
        create_secondary_figure(summary)
    metadata = {
        "artifact_label": ARTIFACT_LABEL,
        "study_id": STUDY_ID,
        "study_complete": complete,
        "planned_runs": expected_runs,
        "completed_runs": sum(row["status"] == "completed" for row in runs),
        "failed_runs": len(failures),
        "moves_per_completed_run": int(manifest["moves_per_replication"]),
        "primary_metric_transitions_per_completed_run": int(manifest["moves_per_replication"]) - 1,
        "label_boundary": "Offline synthetic DES only; not a terminal result or CHESSCON result.",
        "manifest": manifest,
    }
    write_json(GENERATED / "study_metadata.json", metadata)
    generated_manifest = GENERATED / "SHA256_MANIFEST.csv"
    write_manifest(GENERATED, generated_manifest, exclude={generated_manifest})
    package_manifest = ROOT / "SHA256_MANIFEST.csv"
    write_manifest(ROOT, package_manifest, exclude={package_manifest})
    print(json.dumps({"study_complete": complete, "completed_runs": metadata["completed_runs"], "failed_runs": len(failures)}, sort_keys=True))


if __name__ == "__main__":
    run()
