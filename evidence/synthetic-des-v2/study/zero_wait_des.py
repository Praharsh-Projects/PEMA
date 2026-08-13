"""SYNTHETIC_OFFLINE_NOT_CHESSCON discrete-event simulation core.

This module is intentionally independent of CHESSCON.  It implements a
terminating, author-defined one-STS synthetic experiment and makes the paired
random inputs explicit.  It is not a calibrated terminal model.
"""

from __future__ import annotations

import hashlib
import json
import math
import random
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable


ARTIFACT_LABEL = "SYNTHETIC_OFFLINE_NOT_CHESSCON"
STUDY_ID = "ZERO_WAIT_DES_V2_SYNTHETIC_2026_08_13"
POLICIES = ("R0_REACTIVE", "R1_ZERO_WAIT")


def load_manifest(path: Path | None = None) -> dict[str, Any]:
    """Load the pre-specified settings without changing them."""
    if path is None:
        path = Path(__file__).parent / "config" / "scenario_manifest.json"
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def stable_seed(*parts: object) -> int:
    """Return a platform-independent seed for a potential exogenous event."""
    material = "|".join(str(part) for part in parts).encode("utf-8")
    return int.from_bytes(hashlib.sha256(material).digest()[:8], "big")


def round_s(value: float) -> float:
    return round(float(value), 6)


def triangular_mean(values: tuple[float, float, float] | list[float]) -> float:
    low, mode, high = (float(value) for value in values)
    return (low + mode + high) / 3.0


def congested_triangle(values: tuple[float, float, float] | list[float]) -> tuple[float, float, float]:
    """Apply the registered congestion transform exactly.

    The triangular mean is multiplied by 1.25 and each deviation from the
    original triangular mean is multiplied by 1.5.  This preserves ordering
    while making both the location and spread transparent.
    """
    low, mode, high = (float(value) for value in values)
    original_mean = triangular_mean((low, mode, high))
    congested_mean = 1.25 * original_mean
    return tuple(congested_mean + 1.5 * (value - original_mean) for value in (low, mode, high))  # type: ignore[return-value]


@dataclass(frozen=True)
class TaskInput:
    task_id: int
    crane_service_s: float
    common_final_handoff_s: float
    task_block_start_s: float
    task_block_release_s: float

    @property
    def block_duration_s(self) -> float:
        return max(0.0, self.task_block_release_s - self.task_block_start_s)


@dataclass(frozen=True)
class VehicleTaskInput:
    task_id: int
    vehicle_id: int
    presentation_s: float
    vehicle_delay_s: float
    loaded_travel_s: float
    yard_service_s: float
    empty_travel_s: float


class RandomTape:
    """A materialisable, policy-independent common-random-number tape.

    Event keys use only condition, replication seed, task, vehicle and event
    primitive.  Policy never appears in the key, so R0 and R1 use the same
    potential exogenous conditions even if their decisions differ.
    """

    def __init__(self, manifest: dict[str, Any], condition: str, seed: int):
        if condition not in manifest["conditions"]:
            raise ValueError(f"Unknown condition: {condition}")
        self.manifest = manifest
        self.condition = condition
        self.seed = int(seed)
        self.condition_settings = manifest["conditions"][condition]
        self.distributions = manifest["distributions_seconds"]

    def _rng(self, task_id: int, vehicle_id: int | str, primitive: str) -> random.Random:
        return random.Random(stable_seed(STUDY_ID, self.condition, self.seed, task_id, vehicle_id, primitive))

    def _triangular(self, values: tuple[float, float, float] | list[float], task_id: int, vehicle_id: int | str, primitive: str) -> float:
        low, mode, high = (float(value) for value in values)
        return self._rng(task_id, vehicle_id, primitive).triangular(low, high, mode)

    def _transport_distribution(self) -> tuple[float, float, float]:
        values = self.distributions["loaded_empty_travel"]
        return congested_triangle(values) if self.condition != "nominal" else tuple(float(value) for value in values)

    def _yard_distribution(self) -> tuple[float, float, float]:
        values = self.distributions["yard_service"]
        return congested_triangle(values) if self.condition != "nominal" else tuple(float(value) for value in values)

    def task(self, task_id: int) -> TaskInput:
        service = self._triangular(self.distributions["sts_service"], task_id, "task", "sts_service")
        final_handoff = self._triangular(self.distributions["staged_handoff"], task_id, "task", "common_final_handoff")
        occurs = self._rng(task_id, "task", "task_block_occurs").random() < float(self.condition_settings["task_block_probability"])
        duration = self._triangular(self.distributions["task_block"], task_id, "task", "task_block_duration") if occurs else 0.0
        # Fixed task-index windows make every block exogenous and policy-independent.
        start = (task_id - 1) * float(self.distributions["sts_service"][1])
        return TaskInput(task_id, service, final_handoff, start, start + duration)

    def vehicle_task(self, task_id: int, vehicle_id: int) -> VehicleTaskInput:
        presentation = self._triangular(self.distributions["direct_reactive_handoff"], task_id, vehicle_id, "presentation")
        delayed = self._rng(task_id, vehicle_id, "vehicle_delay_occurs").random() < float(self.condition_settings["vehicle_delay_probability"])
        delay = self._triangular(self.distributions["vehicle_delay"], task_id, vehicle_id, "vehicle_delay") if delayed else 0.0
        loaded = self._triangular(self._transport_distribution(), task_id, vehicle_id, "loaded_travel")
        yard = self._triangular(self._yard_distribution(), task_id, vehicle_id, "yard_service")
        empty = self._triangular(self._transport_distribution(), task_id, vehicle_id, "empty_travel")
        return VehicleTaskInput(task_id, vehicle_id, presentation, delay, loaded, yard, empty)

    def materialized_rows(self) -> Iterable[dict[str, Any]]:
        count = int(self.manifest["moves_per_replication"])
        vehicles = int(self.manifest["resources"]["internal_transfer_vehicles"])
        for task_id in range(1, count + 1):
            task = self.task(task_id)
            for vehicle_id in range(1, vehicles + 1):
                item = self.vehicle_task(task_id, vehicle_id)
                yield {
                    "artifact_label": ARTIFACT_LABEL,
                    "study_id": STUDY_ID,
                    "condition": self.condition,
                    "seed": self.seed,
                    "task_id": task_id,
                    "vehicle_id": vehicle_id,
                    "crane_service_s": round_s(task.crane_service_s),
                    "common_final_handoff_s": round_s(task.common_final_handoff_s),
                    "task_block_start_s": round_s(task.task_block_start_s),
                    "task_block_release_s": round_s(task.task_block_release_s),
                    "presentation_s": round_s(item.presentation_s),
                    "vehicle_delay_s": round_s(item.vehicle_delay_s),
                    "loaded_travel_s": round_s(item.loaded_travel_s),
                    "yard_service_s": round_s(item.yard_service_s),
                    "empty_travel_s": round_s(item.empty_travel_s),
                }


@dataclass
class Vehicle:
    vehicle_id: int
    available_at_s: float = 0.0
    assignments: int = 0


@dataclass(frozen=True)
class StagePlan:
    task_id: int
    vehicle_id: int
    evaluation_s: float
    forecast_completion_s: float
    approach_arrival_s: float
    stage_arrival_s: float
    recovery_from_front_block: int
    evaluation_count: int


@dataclass
class RunState:
    manifest: dict[str, Any]
    condition: str
    seed: int
    policy: str
    tape: RandomTape
    task_inputs: dict[int, TaskInput]
    vehicle_inputs: dict[tuple[int, int], VehicleTaskInput]
    vehicles: dict[int, Vehicle]
    remaining_task_ids: list[int]
    yard_available_s: float = 0.0
    stage_misses: int = 0
    fallbacks: int = 0
    reservations: int = 0
    stage_successes: int = 0
    blocked_task_recoveries: int = 0
    max_stage_occupancy: int = 0
    last_controller_evaluation_count: int = 0
    moves: list[dict[str, Any]] = field(default_factory=list)


def task_block_active(task: TaskInput, at_s: float) -> bool:
    """Return whether an exogenous task block is active at ``at_s``.

    A nonzero-duration block is an interval, not a permanent pre-release
    state: the task remains executable before its recorded start and after its
    recorded release. This lets the rolling controller encounter a newly
    occurring block rather than giving it advance knowledge of one.
    """
    return (
        task.block_duration_s > 0.0
        and task.task_block_start_s - 1e-9 <= at_s < task.task_block_release_s - 1e-9
    )


def task_ready(task: TaskInput, at_s: float) -> bool:
    return not task_block_active(task, at_s)


def select_r0_task(state: RunState, at_s: float) -> tuple[int, float, float, int]:
    """R0 always holds the first outstanding task until it is executable."""
    task_id = state.remaining_task_ids[0]
    task = state.task_inputs[task_id]
    demand = task.task_block_release_s if task_block_active(task, at_s) else at_s
    return task_id, demand, max(0.0, demand - at_s), 0


def select_r1_task(state: RunState, at_s: float) -> tuple[int, float, float, int]:
    """Choose an executable task in the fixed next-three horizon."""
    horizon = int(state.manifest["controller"]["candidate_horizon_tasks"])
    candidates = state.remaining_task_ids[:horizon]
    ready = [task_id for task_id in candidates if task_ready(state.task_inputs[task_id], at_s)]
    front = candidates[0]
    if ready:
        selected = ready[0]
        demand = at_s
    else:
        selected = min(candidates, key=lambda task_id: (state.task_inputs[task_id].task_block_release_s, task_id))
        demand = state.task_inputs[selected].task_block_release_s
    recovery = int(selected != front and not task_ready(state.task_inputs[front], at_s))
    return selected, demand, max(0.0, demand - at_s), recovery


def choose_reactive_vehicle(state: RunState, task_id: int, demand_s: float) -> tuple[Vehicle, VehicleTaskInput, float, float]:
    """Choose the lowest *predicted* ETA vehicle only after demand is raised.

    The stochastic disruption delay is deliberately excluded from the rank.
    It materializes after selection in the returned actual-arrival time, so a
    delay event is a genuine unobserved perturbation rather than an oracle
    supplied to either policy.
    """
    candidates: list[tuple[float, int, Vehicle, VehicleTaskInput, float]] = []
    for vehicle in state.vehicles.values():
        inputs = state.vehicle_inputs[(task_id, vehicle.vehicle_id)]
        dispatch_s = max(demand_s, vehicle.available_at_s)
        predicted_arrival_s = dispatch_s + inputs.presentation_s
        candidates.append((predicted_arrival_s, vehicle.vehicle_id, vehicle, inputs, dispatch_s))
    predicted_arrival_s, _, vehicle, inputs, dispatch_s = min(candidates, key=lambda row: (row[0], row[1]))
    actual_arrival_s = predicted_arrival_s + inputs.vehicle_delay_s
    return vehicle, inputs, dispatch_s, actual_arrival_s


def build_stage_plan(state: RunState, service_start_s: float, actual_service_end_s: float) -> StagePlan | None:
    """Execute R1's rolling planning only while the current move is active.

    The policy uses the nominal 130-second forecast; actual_service_end_s is
    used only to stop observation when the move really finishes.  It is never
    used to choose an ETA, task, or reservation tick.
    """
    controller = state.manifest["controller"]
    interval = float(controller["evaluation_interval_s"])
    forecast = service_start_s + float(state.manifest["distributions_seconds"]["sts_service"][1])
    lead = float(controller["reservation_lead_s"])
    # Every 5-s tick in the active service is explicitly evaluated.  The
    # physical pre-stage reservation is committed only at the final eligible
    # grid tick, which is 10 to <15 seconds before the nominal forecast. The
    # preceding ticks are genuine re-evaluations of task and vehicle ETA; they
    # do not occupy the one physical stage position.
    first_tick = math.ceil(service_start_s / interval) * interval
    last_reservation_tick = math.floor((forecast - lead) / interval) * interval
    tick = first_tick
    evaluation_count = 0
    state.last_controller_evaluation_count = 0
    while tick <= actual_service_end_s + 1e-9 and tick <= last_reservation_tick + 1e-9:
        evaluation_count += 1
        state.last_controller_evaluation_count = evaluation_count
        task_id, demand, _, recovery = select_r1_task(state, tick)
        if demand <= tick + 1e-9:
            candidates: list[tuple[float, int, Vehicle, VehicleTaskInput]] = []
            for vehicle in state.vehicles.values():
                inputs = state.vehicle_inputs[(task_id, vehicle.vehicle_id)]
                # The predicted readiness projection can begin with the
                # current STS service. Only the reservation itself is bound
                # at the 10-s lead point. Do not expose the future delay draw
                # to the selector.
                projected_dispatch_s = max(service_start_s, vehicle.available_at_s)
                projected_approach_s = projected_dispatch_s + inputs.presentation_s
                if projected_approach_s <= forecast + 1e-9:
                    candidates.append((projected_approach_s, vehicle.vehicle_id, vehicle, inputs))
            if tick >= last_reservation_tick - 1e-9 and candidates:
                projected_approach_s, vehicle_id, _, inputs = min(candidates, key=lambda row: (row[0], row[1]))
                actual_approach_s = projected_approach_s + inputs.vehicle_delay_s
                # The vehicle can wait in an abstract approach state, but it
                # cannot enter the physical one-vehicle stage before the
                # final, causal reservation decision.
                stage_arrival_s = max(actual_approach_s, tick)
                state.reservations += 1
                return StagePlan(
                    task_id,
                    vehicle_id,
                    tick,
                    forecast,
                    actual_approach_s,
                    stage_arrival_s,
                    recovery,
                    evaluation_count,
                )
        tick += interval
    state.last_controller_evaluation_count = evaluation_count
    return None


def execute_move(
    state: RunState,
    *,
    service_order: int,
    task_id: int,
    vehicle: Vehicle,
    vehicle_inputs: VehicleTaskInput,
    handoff_start_s: float,
    prior_service_end_s: float | None,
    handoff_kind: str,
    task_demand_s: float,
    task_block_wait_s: float,
    reservation: StagePlan | None = None,
    stage_wait_s: float = 0.0,
    fallback: int = 0,
    stage_miss: int = 0,
    blocked_task_recovery: int = 0,
    controller_evaluation_count: int = 0,
) -> dict[str, Any]:
    """Complete one container move and emit an auditable event row."""
    if task_id not in state.remaining_task_ids:
        raise AssertionError(f"Task {task_id} was lost or assigned twice")
    task = state.task_inputs[task_id]
    if handoff_start_s < vehicle.available_at_s - 1e-9 and handoff_kind != "staged":
        raise AssertionError("A non-staged vehicle was used before it became available")
    if handoff_start_s < task_demand_s - 1e-9:
        raise AssertionError("Handoff began before the task became executable")
    if not task_ready(task, handoff_start_s):
        raise AssertionError("Handoff began while its task-block interval was active")

    final_handoff_s = task.common_final_handoff_s
    service_start_s = handoff_start_s + final_handoff_s
    service_end_s = service_start_s + task.crane_service_s
    yard_arrival_s = service_start_s + vehicle_inputs.loaded_travel_s
    yard_start_s = max(yard_arrival_s, state.yard_available_s)
    yard_end_s = yard_start_s + vehicle_inputs.yard_service_s
    vehicle_return_s = yard_end_s + vehicle_inputs.empty_travel_s
    if vehicle_return_s < vehicle.available_at_s - 1e-9:
        raise AssertionError("Vehicle availability moved backwards")
    state.yard_available_s = yard_end_s
    vehicle.available_at_s = vehicle_return_s
    vehicle.assignments += 1
    state.remaining_task_ids.remove(task_id)

    included = int(prior_service_end_s is not None)
    dwell_s = 0.0 if prior_service_end_s is None else service_start_s - prior_service_end_s
    if dwell_s < -1e-9:
        raise AssertionError("The next STS service overlapped its predecessor")
    if handoff_kind == "staged":
        state.stage_successes += 1
        state.max_stage_occupancy = max(state.max_stage_occupancy, 1)
    state.stage_misses += stage_miss
    state.fallbacks += fallback
    state.blocked_task_recoveries += blocked_task_recovery
    row = {
        "artifact_label": ARTIFACT_LABEL,
        "study_id": STUDY_ID,
        "condition": state.condition,
        "seed": state.seed,
        "policy": state.policy,
        "service_order": service_order,
        "task_id": task_id,
        "vehicle_id": vehicle.vehicle_id,
        "handoff_kind": handoff_kind,
        "task_block_start_s": round_s(task.task_block_start_s),
        "task_block_release_s": round_s(task.task_block_release_s),
        "task_demand_s": round_s(task_demand_s),
        "task_block_wait_s": round_s(task_block_wait_s),
        "reservation_evaluation_s": "" if reservation is None else round_s(reservation.evaluation_s),
        "forecast_completion_s": "" if reservation is None else round_s(reservation.forecast_completion_s),
        "approach_arrival_s": "" if reservation is None else round_s(reservation.approach_arrival_s),
        "stage_arrival_s": "" if reservation is None else round_s(reservation.stage_arrival_s),
        "controller_evaluations_before_reservation": "" if reservation is None else reservation.evaluation_count,
        "controller_evaluations_this_cycle": controller_evaluation_count,
        "presentation_s": round_s(vehicle_inputs.presentation_s),
        "vehicle_delay_s": round_s(vehicle_inputs.vehicle_delay_s),
        "vehicle_delay_known_to_selector": 0,
        "common_final_handoff_s": round_s(final_handoff_s),
        "sts_service_start_s": round_s(service_start_s),
        "sts_service_end_s": round_s(service_end_s),
        "crane_service_s": round_s(task.crane_service_s),
        "inter_cycle_dwell_s": round_s(dwell_s),
        "included_in_dwell_metric": included,
        "stage_wait_s": round_s(stage_wait_s),
        "stage_occupancy": int(handoff_kind == "staged"),
        "stage_miss": stage_miss,
        "fallback": fallback,
        "blocked_task_recovery": blocked_task_recovery,
        "loaded_travel_s": round_s(vehicle_inputs.loaded_travel_s),
        "yard_arrival_s": round_s(yard_arrival_s),
        "yard_start_s": round_s(yard_start_s),
        "yard_queue_wait_s": round_s(yard_start_s - yard_arrival_s),
        "yard_service_s": round_s(vehicle_inputs.yard_service_s),
        "yard_delivery_s": round_s(yard_end_s),
        "empty_travel_s": round_s(vehicle_inputs.empty_travel_s),
        "vehicle_return_s": round_s(vehicle_return_s),
    }
    state.moves.append(row)
    return row


def initialize_state(manifest: dict[str, Any], condition: str, seed: int, policy: str) -> RunState:
    if policy not in POLICIES:
        raise ValueError(f"Unsupported policy: {policy}")
    tape = RandomTape(manifest, condition, seed)
    move_count = int(manifest["moves_per_replication"])
    vehicle_count = int(manifest["resources"]["internal_transfer_vehicles"])
    task_inputs = {task_id: tape.task(task_id) for task_id in range(1, move_count + 1)}
    vehicle_inputs = {
        (task_id, vehicle_id): tape.vehicle_task(task_id, vehicle_id)
        for task_id in range(1, move_count + 1)
        for vehicle_id in range(1, vehicle_count + 1)
    }
    return RunState(
        manifest=manifest,
        condition=condition,
        seed=int(seed),
        policy=policy,
        tape=tape,
        task_inputs=task_inputs,
        vehicle_inputs=vehicle_inputs,
        vehicles={vehicle_id: Vehicle(vehicle_id) for vehicle_id in range(1, vehicle_count + 1)},
        remaining_task_ids=list(range(1, move_count + 1)),
    )


def resolve_reactive_task_handoff(
    task: TaskInput,
    arrival_s: float,
    selected_demand_s: float,
    selected_block_wait_s: float,
) -> tuple[float, float, float]:
    """Apply a task block that begins while a reactive vehicle is en route."""
    task_demand_s = selected_demand_s
    if task_block_active(task, arrival_s):
        task_demand_s = max(task_demand_s, task.task_block_release_s)
    handoff_start_s = max(arrival_s, task_demand_s)
    task_block_wait_s = max(selected_block_wait_s, max(0.0, task_demand_s - selected_demand_s))
    return handoff_start_s, task_demand_s, task_block_wait_s


def run_simulation(manifest: dict[str, Any], condition: str, seed: int, policy: str) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Run one terminating synthetic replication and retain every move event."""
    state = initialize_state(manifest, condition, seed, policy)
    # Both policies start from the same resource state and the same reactive
    # first move.  That initial condition is retained but excluded from dwell.
    first_task, first_demand, first_block_wait, _ = select_r0_task(state, 0.0)
    first_vehicle, first_inputs, _, first_arrival = choose_reactive_vehicle(state, first_task, first_demand)
    current = execute_move(
        state,
        service_order=1,
        task_id=first_task,
        vehicle=first_vehicle,
        vehicle_inputs=first_inputs,
        handoff_start_s=first_arrival,
        prior_service_end_s=None,
        handoff_kind="initial_reactive",
        task_demand_s=first_demand,
        task_block_wait_s=first_block_wait,
        controller_evaluation_count=0,
    )

    service_order = 2
    while state.remaining_task_ids:
        current_start = float(current["sts_service_start_s"])
        current_end = float(current["sts_service_end_s"])
        plan = build_stage_plan(state, current_start, current_end) if policy == "R1_ZERO_WAIT" else None
        controller_evaluation_count = state.last_controller_evaluation_count if policy == "R1_ZERO_WAIT" else 0
        if (
            plan is not None
            and plan.task_id in state.remaining_task_ids
            and task_ready(state.task_inputs[plan.task_id], current_end)
            and plan.stage_arrival_s >= plan.evaluation_s - 1e-9
            and plan.stage_arrival_s <= current_end + 1e-9
        ):
            vehicle = state.vehicles[plan.vehicle_id]
            inputs = state.vehicle_inputs[(plan.task_id, plan.vehicle_id)]
            current = execute_move(
                state,
                service_order=service_order,
                task_id=plan.task_id,
                vehicle=vehicle,
                vehicle_inputs=inputs,
                handoff_start_s=current_end,
                prior_service_end_s=current_end,
                handoff_kind="staged",
                task_demand_s=current_end,
                task_block_wait_s=0.0,
                reservation=plan,
                stage_wait_s=max(0.0, current_end - plan.stage_arrival_s),
                blocked_task_recovery=plan.recovery_from_front_block,
                controller_evaluation_count=controller_evaluation_count,
            )
        else:
            if policy == "R0_REACTIVE":
                task_id, demand_s, block_wait_s, recovery = select_r0_task(state, current_end)
                handoff_kind = "reactive"
                fallback = 0
                stage_miss = 0
            else:
                task_id, demand_s, block_wait_s, recovery = select_r1_task(state, current_end)
                handoff_kind = "fallback"
                fallback = 1
                stage_miss = 1
            vehicle, inputs, _, arrival_s = choose_reactive_vehicle(state, task_id, demand_s)
            handoff_start_s, effective_demand_s, effective_block_wait_s = resolve_reactive_task_handoff(
                state.task_inputs[task_id], arrival_s, demand_s, block_wait_s
            )
            current = execute_move(
                state,
                service_order=service_order,
                task_id=task_id,
                vehicle=vehicle,
                vehicle_inputs=inputs,
                handoff_start_s=handoff_start_s,
                prior_service_end_s=current_end,
                handoff_kind=handoff_kind,
                task_demand_s=effective_demand_s,
                task_block_wait_s=effective_block_wait_s,
                reservation=plan,
                fallback=fallback,
                stage_miss=stage_miss,
                blocked_task_recovery=recovery,
                controller_evaluation_count=controller_evaluation_count,
            )
        service_order += 1

    move_count = int(manifest["moves_per_replication"])
    if len(state.moves) != move_count:
        raise AssertionError("Unexpected number of completed moves")
    ids = [int(row["task_id"]) for row in state.moves]
    if sorted(ids) != list(range(1, move_count + 1)):
        raise AssertionError("A task was lost, duplicated, or outside the workload")
    if state.max_stage_occupancy > int(manifest["resources"]["physical_pre_stage_positions"]):
        raise AssertionError("Physical pre-stage capacity was exceeded")
    dwell_rows = [row for row in state.moves if int(row["included_in_dwell_metric"]) == 1]
    if len(dwell_rows) != move_count - 1:
        raise AssertionError("The primary metric must contain exactly 119 transitions")
    total_dwell = sum(float(row["inter_cycle_dwell_s"]) for row in dwell_rows)
    final_crane = max(float(row["sts_service_end_s"]) for row in state.moves)
    final_yard = max(float(row["yard_delivery_s"]) for row in state.moves)
    run = {
        "artifact_label": ARTIFACT_LABEL,
        "study_id": STUDY_ID,
        "condition": condition,
        "seed": int(seed),
        "policy": policy,
        "status": "completed",
        "completed_moves": move_count,
        "unique_tasks_completed": len(set(ids)),
        "dwell_transitions": len(dwell_rows),
        "inter_cycle_dwell_s_total": round_s(total_dwell),
        "inter_cycle_dwell_s_per_move": round_s(total_dwell / len(dwell_rows)),
        "sts_completion_time_s": round_s(final_crane),
        "completion_time_s": round_s(max(final_crane, final_yard)),
        "effective_moves_per_hour": round_s(move_count * 3600.0 / final_crane),
        "staged_vehicle_holding_s": round_s(sum(float(row["stage_wait_s"]) for row in state.moves)),
        "stage_misses": state.stage_misses,
        "fallbacks": state.fallbacks,
        "reservations": state.reservations,
        "stage_successes": state.stage_successes,
        "blocked_task_recoveries": state.blocked_task_recoveries,
        "yard_queue_wait_s": round_s(sum(float(row["yard_queue_wait_s"]) for row in state.moves)),
        "max_stage_occupancy": state.max_stage_occupancy,
        "vehicle_assignments": sum(vehicle.assignments for vehicle in state.vehicles.values()),
    }
    return run, state.moves


def all_runs(manifest: dict[str, Any]) -> Iterable[tuple[str, int, str]]:
    """Yield the fixed pre-specified 180-run experimental matrix."""
    for condition in ("nominal", "congestion", "disruption"):
        for seed in manifest["randomness"]["seeds"]:
            for policy in POLICIES:
                yield condition, int(seed), policy
