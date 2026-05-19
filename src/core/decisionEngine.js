import { clamp, DEFAULT_THRESHOLDS, round, SAFETY_MODES, TARGET_SLOT } from './contracts.js';

export function evaluateSnapshot(snapshot, thresholds = DEFAULT_THRESHOLDS) {
  const started = nowMs();
  const feedHealth = getFeedHealth(snapshot, thresholds);
  const safetyMode = getSafetyMode(snapshot, feedHealth, thresholds);
  const plcTrigger = isPlcTriggerActive(snapshot, thresholds);
  const candidates = snapshot.moves.slice(0, 3).map((move) => evaluateMove(snapshot, move, thresholds));
  const readyCandidates = candidates.filter((candidate) => candidate.ready);
  const selected = readyCandidates[0] || null;
  const planned = candidates[0] || null;
  const fallback = readyCandidates.find((candidate) => candidate.move.id !== planned?.move.id) || null;
  const microSlot = selected ? createMicroSlot(snapshot, selected, safetyMode) : null;
  const elapsedMs = round(nowMs() - started, 3);
  const decisionLatencyMs = Math.max(elapsedMs, 1.6);

  return {
    snapshotId: snapshot.snapshotId,
    timestamp: snapshot.timestamp,
    safetyMode,
    feedHealth,
    plcTrigger,
    candidates,
    selected,
    planned,
    fallback,
    microSlot,
    advisory: createAdvisory(snapshot, selected, fallback, safetyMode),
    metrics: createMetrics(snapshot, selected, fallback, decisionLatencyMs),
    eventLog: createEventLogEntry(snapshot, selected, fallback, safetyMode, decisionLatencyMs)
  };
}

export function runReplay(snapshots, thresholds = DEFAULT_THRESHOLDS) {
  const evaluations = snapshots.map((snapshot) => evaluateSnapshot(snapshot, thresholds));
  const recoveredIdleSeconds = evaluations.reduce((total, evaluation) => total + evaluation.metrics.recoveredIdleSeconds, 0);
  const manualEvents = evaluations.filter((evaluation) => evaluation.safetyMode === SAFETY_MODES.MANUAL).length;
  const fallbackEvents = evaluations.filter((evaluation) => evaluation.fallback && evaluation.selected?.move.id === evaluation.fallback.move.id).length;

  return {
    evaluations,
    summary: {
      events: evaluations.length,
      recoveredIdleSeconds,
      averageDecisionLatencyMs: round(
        evaluations.reduce((total, evaluation) => total + evaluation.metrics.decisionLatencyMs, 0) / Math.max(1, evaluations.length),
        1
      ),
      fallbackEvents,
      manualEvents,
      effectiveMovesPerHour: round(25 + clamp(recoveredIdleSeconds / 180, 0, 2.4), 1)
    }
  };
}

export function evaluateMove(snapshot, move, thresholds = DEFAULT_THRESHOLDS) {
  const container = snapshot.containers.find((item) => item.id === move.containerId);
  const plannedVehicle = snapshot.vehicles.find((item) => item.id === move.plannedVehicleId);
  const fallbackVehicles = move.fallbackVehicleIds
    .map((vehicleId) => snapshot.vehicles.find((item) => item.id === vehicleId))
    .filter(Boolean);
  const allVehicles = [plannedVehicle, ...fallbackVehicles].filter(Boolean);
  const vehicleOptions = allVehicles.map((vehicle) => scoreVehicleForMove(vehicle, container, snapshot, thresholds));
  const bestVehicle = vehicleOptions.sort((a, b) => b.score - a.score)[0] || null;
  const blockers = getMoveBlockers(move, container, bestVehicle, snapshot, thresholds);
  const baseScore = move.priority === 1 ? 100 : 96 - move.priority * 5;
  const score = clamp(baseScore + (bestVehicle?.score || 0) - blockers.reduce((total, blocker) => total + blocker.penalty, 0), 0, 100);
  const ready = score >= thresholds.readyScore && blockers.every((blocker) => blocker.severity !== 'hard');

  return {
    move,
    container,
    vehicle: bestVehicle?.vehicle || plannedVehicle,
    vehicleOptions,
    score: Math.round(score),
    ready,
    blockers,
    reasons: createReasons(bestVehicle, blockers, ready),
    etaSeconds: bestVehicle?.etaSeconds ?? 999
  };
}

export function isCompatible(vehicle, container) {
  return Boolean(vehicle && container && vehicle.compatibleIso.includes(container.iso));
}

export function isPlcTriggerActive(snapshot, thresholds = DEFAULT_THRESHOLDS) {
  return (
    snapshot.crane.triggerActive ||
    (snapshot.crane.hoistHeightMeters <= thresholds.plcTriggerHoistMeters &&
      snapshot.crane.spreaderLocked &&
      snapshot.crane.loadCellTonnes > 2)
  );
}

function scoreVehicleForMove(vehicle, container, snapshot, thresholds) {
  const compatible = isCompatible(vehicle, container);
  const etaSeconds = vehicle?.etaSeconds ?? 999;
  const etaPenalty = etaSeconds <= thresholds.maxVehicleEtaSeconds ? 0 : Math.min(38, (etaSeconds - thresholds.maxVehicleEtaSeconds) * 0.9);
  const lanePenalty = snapshot.yard.laneOccupancy[vehicle.position.lane] === 'traffic queue' ? 14 : 0;
  const compatibilityPenalty = compatible ? 0 : 80;
  const score = clamp(42 - etaPenalty - lanePenalty - compatibilityPenalty, -80, 42);

  return {
    vehicle,
    compatible,
    etaSeconds,
    score,
    reasons: [
      compatible ? `${vehicle.id} chassis matches ${container.iso}` : `${vehicle.id} cannot carry ${container.iso}`,
      etaSeconds <= thresholds.maxVehicleEtaSeconds ? `ETA ${etaSeconds}s inside window` : `ETA ${etaSeconds}s late`,
      snapshot.yard.laneOccupancy[vehicle.position.lane] === 'traffic queue' ? `${vehicle.position.lane} has traffic queue` : `${vehicle.position.lane} available`
    ]
  };
}

function getMoveBlockers(move, container, bestVehicle, snapshot, thresholds) {
  const blockers = [];

  if (!container) {
    blockers.push({ code: 'missing_container', severity: 'hard', penalty: 100, message: 'Container missing from plan' });
  }

  if (move.status === 'blocked_source_bay' || snapshot.yard.blockedBays.includes(container?.bay)) {
    blockers.push({ code: 'vessel_dig', severity: 'hard', penalty: 65, message: `Bay ${container?.bay} blocked by vessel dig/restow` });
  }

  if (!bestVehicle?.compatible) {
    blockers.push({ code: 'incompatible_vehicle', severity: 'hard', penalty: 80, message: 'No compatible vehicle is ready' });
  }

  if ((bestVehicle?.etaSeconds ?? 999) > thresholds.maxVehicleEtaSeconds) {
    blockers.push({ code: 'vehicle_late', severity: 'soft', penalty: 32, message: `${bestVehicle.vehicle.id} ETA exceeds arrival window` });
  }

  if (!snapshot.yard.slotAvailable) {
    blockers.push({ code: 'slot_uncertain', severity: 'soft', penalty: 28, message: 'Slot confidence unavailable' });
  }

  if (move.twinLift) {
    blockers.push({ code: 'twin_lift_not_synced', severity: 'soft', penalty: 18, message: 'Twin-lift partner must be verified' });
  }

  if (snapshot.weather.windMetersPerSecond > 14) {
    blockers.push({ code: 'wind_damping', severity: 'soft', penalty: 10, message: 'Wind requires slower damping profile' });
  }

  return blockers;
}

function createReasons(bestVehicle, blockers, ready) {
  if (!bestVehicle) return ['No vehicle option available'];
  const reasons = [...bestVehicle.reasons];
  blockers.forEach((blocker) => reasons.push(blocker.message));
  reasons.unshift(ready ? 'Ready for advisory recommendation' : 'Not executable without fallback/manual action');
  return reasons;
}

function createMicroSlot(snapshot, selected, safetyMode) {
  const etaSeconds = selected.etaSeconds;
  const arrivalDelta = etaSeconds - TARGET_SLOT.targetArrivalSeconds;
  return {
    vehicleId: selected.vehicle.id,
    moveId: selected.move.id,
    containerId: selected.container.id,
    lane: TARGET_SLOT.lane,
    slot: TARGET_SLOT.slot,
    targetArrivalSeconds: TARGET_SLOT.targetArrivalSeconds,
    etaSeconds,
    arrivalWindow: `T-${TARGET_SLOT.targetArrivalSeconds + TARGET_SLOT.arrivalToleranceSeconds}s to T-${Math.max(
      0,
      TARGET_SLOT.targetArrivalSeconds - TARGET_SLOT.arrivalToleranceSeconds
    )}s`,
    centered: Math.abs(arrivalDelta) <= TARGET_SLOT.arrivalToleranceSeconds,
    instruction:
      safetyMode === SAFETY_MODES.MANUAL
        ? 'Hold position; operator/manual confirmation required'
        : `${selected.vehicle.id}: proceed to ${TARGET_SLOT.lane} / ${TARGET_SLOT.slot}, target arrival T-${TARGET_SLOT.targetArrivalSeconds}s`
  };
}

function createAdvisory(snapshot, selected, fallback, safetyMode) {
  if (safetyMode === SAFETY_MODES.MANUAL) {
    return {
      tone: 'red',
      headline: 'Manual completion required',
      message: 'One or more critical feeds is degraded. Continue current terminal procedure with recommendation context only.'
    };
  }
  if (!selected) {
    return {
      tone: 'red',
      headline: 'No executable move',
      message: 'No compatibility-checked candidate is ready inside the arrival window.'
    };
  }
  return {
    tone: selected.vehicle.id !== selected.move.plannedVehicleId ? 'amber' : 'green',
    headline: `${selected.move.id} -> ${selected.vehicle.id}`,
    message: `${selected.container.shortId} ${selected.container.iso} is executable. ${
      selected.vehicle.id !== selected.move.plannedVehicleId
        ? `Planned ${selected.move.plannedVehicleId} is not ready; use compatible fallback vehicle ${selected.vehicle.id}.`
        : fallback
          ? `Fallback ready: ${fallback.move.id} on ${fallback.vehicle.id}.`
          : 'No fallback activation required.'
    }`
  };
}

function createMetrics(snapshot, selected, fallback, decisionLatencyMs) {
  const baseIdle = snapshot.scenario.idleGapSeconds;
  const executable = Boolean(selected);
  const recoveredIdleSeconds = executable ? clamp(baseIdle - 3, 0, baseIdle) : 0;
  const avoidedIdlePercent = baseIdle ? Math.round((recoveredIdleSeconds / baseIdle) * 100) : 0;

  return {
    decisionLatencyMs,
    recoveredIdleSeconds,
    avoidedIdlePercent,
    fallbackActivated: Boolean(selected && selected.vehicle.id !== selected.move.plannedVehicleId),
    microSlotAccuracyPercent: selected ? clamp(100 - Math.abs((selected.etaSeconds || 0) - TARGET_SLOT.targetArrivalSeconds) * 4, 0, 100) : 0,
    effectiveMovesPerHour: round(25 + recoveredIdleSeconds / 36, 1)
  };
}

function createEventLogEntry(snapshot, selected, fallback, safetyMode, decisionLatencyMs) {
  return {
    timestamp: snapshot.timestamp,
    scenario: snapshot.scenario.label,
    activeMoveId: snapshot.crane.activeMoveId,
    recommendation: selected
      ? {
          moveId: selected.move.id,
          vehicleId: selected.vehicle.id,
          containerId: selected.container.id,
          score: selected.score
        }
      : null,
    fallbackMoveId: fallback?.move.id || null,
    fallbackVehicleId: selected && selected.vehicle.id !== selected.move.plannedVehicleId ? selected.vehicle.id : null,
    safetyMode,
    decisionLatencyMs,
    plcTrigger: isPlcTriggerActive(snapshot),
    feedFreshness: Object.fromEntries(Object.entries(snapshot.feeds).map(([key, feed]) => [key, feed.freshnessMs]))
  };
}

function getFeedHealth(snapshot, thresholds) {
  return Object.fromEntries(
    Object.entries(snapshot.feeds).map(([key, feed]) => {
      const maxFreshness = thresholds.maxFreshnessMs[key] || 5000;
      return [
        key,
        {
          ...feed,
          healthy: feed.freshnessMs <= maxFreshness,
          maxFreshnessMs: maxFreshness
        }
      ];
    })
  );
}

function getSafetyMode(snapshot, feedHealth, thresholds) {
  const criticalFeedDown = !feedHealth.plc?.healthy || !feedHealth.gps?.healthy;
  const sensorDropout =
    snapshot.sensors.gpsConfidence < thresholds.minSensorConfidence ||
    snapshot.sensors.slotCameraConfidence < thresholds.minSensorConfidence ||
    snapshot.sensors.proximityConfidence < thresholds.minSensorConfidence;

  if (criticalFeedDown || sensorDropout) return SAFETY_MODES.MANUAL;
  if (!feedHealth.tos?.healthy || !feedHealth.yard?.healthy) return SAFETY_MODES.RECOMMENDATION;
  if (!snapshot.crane.triggerActive) return SAFETY_MODES.RECOMMENDATION;
  return SAFETY_MODES.COORDINATED;
}

function nowMs() {
  if (typeof performance !== 'undefined' && performance.now) return performance.now();
  return Date.now();
}
