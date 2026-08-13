"""Invariant tests for the standalone SYNTHETIC_OFFLINE_NOT_CHESSCON model."""

from __future__ import annotations

import copy
import csv
import unittest
from dataclasses import replace
from pathlib import Path
from unittest.mock import patch

from zero_wait_des import (
    POLICIES,
    RandomTape,
    build_stage_plan,
    initialize_state,
    load_manifest,
    run_simulation,
    task_ready,
)


class SyntheticDESInvariantTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = load_manifest()

    def test_random_tape_is_policy_independent_and_materialised(self) -> None:
        tape = RandomTape(self.manifest, "disruption", 7)
        first = list(tape.materialized_rows())[:10]
        self.assertTrue(first)
        self.assertTrue(all("policy" not in row for row in first))
        again = list(RandomTape(self.manifest, "disruption", 7).materialized_rows())[:10]
        self.assertEqual(first, again)
        # Both policies draw from the same condition/seed tape rather than an
        # arm-specific random stream.
        r0, _ = run_simulation(self.manifest, "disruption", 7, "R0_REACTIVE")
        r1, _ = run_simulation(self.manifest, "disruption", 7, "R1_ZERO_WAIT")
        self.assertEqual((r0["condition"], r0["seed"]), (r1["condition"], r1["seed"]))

    def test_seed_reproducibility(self) -> None:
        run_a, moves_a = run_simulation(self.manifest, "congestion", 13, "R1_ZERO_WAIT")
        run_b, moves_b = run_simulation(self.manifest, "congestion", 13, "R1_ZERO_WAIT")
        self.assertEqual(run_a, run_b)
        self.assertEqual(moves_a, moves_b)

    def test_terminating_workload_and_capacity(self) -> None:
        run, moves = run_simulation(self.manifest, "disruption", 17, "R1_ZERO_WAIT")
        self.assertEqual(run["completed_moves"], 120)
        self.assertEqual(run["unique_tasks_completed"], 120)
        self.assertEqual(sorted(row["task_id"] for row in moves), list(range(1, 121)))
        self.assertLessEqual(run["max_stage_occupancy"], 1)
        self.assertTrue(all(row["stage_occupancy"] in (0, 1) for row in moves))

    def test_reservation_fallback_and_r0_invariants(self) -> None:
        r0, r0_moves = run_simulation(self.manifest, "nominal", 9, "R0_REACTIVE")
        r1, r1_moves = run_simulation(self.manifest, "nominal", 9, "R1_ZERO_WAIT")
        self.assertEqual(r0["fallbacks"], 0)
        self.assertEqual(r0["stage_successes"], 0)
        self.assertTrue(all(row["handoff_kind"] not in {"staged", "fallback"} for row in r0_moves))
        staged = [row for row in r1_moves if row["handoff_kind"] == "staged"]
        fallbacks = [row for row in r1_moves if row["handoff_kind"] == "fallback"]
        self.assertGreater(len(staged) + len(fallbacks), 0)
        self.assertTrue(all(row["reservation_evaluation_s"] != "" for row in staged))
        self.assertTrue(all(float(row["stage_arrival_s"]) >= float(row["reservation_evaluation_s"]) for row in staged))
        self.assertTrue(all(float(row["forecast_completion_s"]) - float(row["reservation_evaluation_s"]) >= 10.0 - 1e-5 for row in staged))
        self.assertTrue(all(int(row["controller_evaluations_before_reservation"]) >= 1 for row in staged))
        self.assertTrue(all(int(row["controller_evaluations_this_cycle"]) >= 1 for row in r1_moves[1:]))
        self.assertTrue(all(int(row["controller_evaluations_this_cycle"]) == 0 for row in r0_moves))
        self.assertEqual(r1["fallbacks"], len(fallbacks))

    def test_rolling_evaluation_advances_in_five_second_ticks_when_task_is_not_ready(self) -> None:
        state = initialize_state(self.manifest, "nominal", 4, "R1_ZERO_WAIT")
        # Force every candidate in the next-three horizon to become
        # executable only at the fourth tick. The controller must test t=0,
        # 5, 10, and 15 rather than make a single post-hoc selection at the
        # end of service.
        for task_id in (1, 2, 3):
            task = state.task_inputs[task_id]
            state.task_inputs[task_id] = replace(task, task_block_start_s=0.0, task_block_release_s=15.0)
        plan = build_stage_plan(state, service_start_s=0.0, actual_service_end_s=130.0)
        self.assertIsNotNone(plan)
        assert plan is not None
        self.assertEqual(plan.evaluation_s, 120.0)
        self.assertEqual(plan.evaluation_count, 25)
        self.assertEqual(state.last_controller_evaluation_count, 25)
        self.assertGreaterEqual(plan.forecast_completion_s - plan.evaluation_s, 10.0)
        self.assertLess(plan.forecast_completion_s - plan.evaluation_s, 15.0)

    def test_task_block_is_active_only_within_its_recorded_interval(self) -> None:
        state = initialize_state(self.manifest, "disruption", 3, "R1_ZERO_WAIT")
        task = state.task_inputs[1]
        task = replace(task, task_block_start_s=20.0, task_block_release_s=40.0)
        self.assertTrue(task_ready(task, 19.999))
        self.assertFalse(task_ready(task, 20.0))
        self.assertFalse(task_ready(task, 39.999))
        self.assertTrue(task_ready(task, 40.0))

    def test_fallback_branch_is_preserved_when_no_reservation_can_be_made(self) -> None:
        # This controlled branch test does not change the pre-specified
        # experiment; it proves that an R1 cycle without a reservation is
        # accounted for as reactive fallback rather than silently discarded.
        with patch("zero_wait_des.build_stage_plan", return_value=None):
            run, moves = run_simulation(self.manifest, "nominal", 8, "R1_ZERO_WAIT")
        self.assertEqual(run["fallbacks"], 119)
        self.assertEqual(run["stage_misses"], 119)
        self.assertTrue(all(row["handoff_kind"] == "fallback" for row in moves[1:]))

    def test_primary_metric_recomputes_from_119_transition_rows(self) -> None:
        run, moves = run_simulation(self.manifest, "nominal", 3, "R1_ZERO_WAIT")
        included = [row for row in moves if row["included_in_dwell_metric"] == 1]
        self.assertEqual(len(included), 119)
        self.assertEqual(moves[0]["included_in_dwell_metric"], 0)
        total = sum(row["inter_cycle_dwell_s"] for row in included)
        self.assertAlmostEqual(total, run["inter_cycle_dwell_s_total"], places=5)
        self.assertAlmostEqual(total / 119.0, run["inter_cycle_dwell_s_per_move"], places=5)

    def test_secondary_metrics_recompute_from_raw_moves(self) -> None:
        run, moves = run_simulation(self.manifest, "congestion", 12, "R1_ZERO_WAIT")
        self.assertAlmostEqual(sum(row["stage_wait_s"] for row in moves), run["staged_vehicle_holding_s"], places=5)
        self.assertEqual(sum(row["stage_miss"] for row in moves), run["stage_misses"])
        self.assertEqual(sum(row["fallback"] for row in moves), run["fallbacks"])
        self.assertEqual(sum(row["stage_occupancy"] for row in moves), run["stage_successes"])
        self.assertEqual(sum(row["blocked_task_recovery"] for row in moves), run["blocked_task_recoveries"])
        self.assertAlmostEqual(sum(row["yard_queue_wait_s"] for row in moves), run["yard_queue_wait_s"], places=5)
        self.assertEqual(len(moves), run["vehicle_assignments"])
        self.assertTrue(all(row["vehicle_delay_known_to_selector"] == 0 for row in moves))

    def test_disruption_blocks_are_handled_without_losing_work(self) -> None:
        runs = [run_simulation(self.manifest, "disruption", seed, "R1_ZERO_WAIT") for seed in range(1, 6)]
        for run, moves in runs:
            self.assertEqual(run["completed_moves"], 120)
            self.assertEqual(len({row["task_id"] for row in moves}), 120)
            self.assertTrue(all(float(row["task_block_wait_s"]) >= 0.0 for row in moves))

    def test_disruption_materialises_post_selection_vehicle_delays(self) -> None:
        for policy in POLICIES:
            _, moves = run_simulation(self.manifest, "disruption", 1, policy)
            self.assertTrue(any(float(row["vehicle_delay_s"]) > 0.0 for row in moves))


if __name__ == "__main__":
    unittest.main()
