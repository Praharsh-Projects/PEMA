export const LANES = {
  lane1: { id: 'lane1', label: 'Lane 1', z: -1.15 },
  lane2: { id: 'lane2', label: 'Lane 2', z: -2.35 },
  buffer: { id: 'buffer', label: 'Fallback buffer', z: -3.55 }
};

export const WORLD = {
  source: { x: 0, y: 1.47, z: 2.12 },
  alternateSource: { x: -1.08, y: 1.47, z: 2.82 },
  slot: { x: 0, z: LANES.lane2.z },
  arrivalWindow: { x: -2.75, z: LANES.lane2.z },
  fallbackWindow: { x: -2.75, z: LANES.buffer.z },
  queueWindow: { x: -4.55, z: LANES.lane1.z },
  hoistHigh: 4.08,
  sourceContact: 1.94,
  landingContact: 1.46
};

export const FIXED_QUAY_CAMERA = {
  position: [0.25, 5.2, -11.2],
  target: [0, 1.35, 0.15],
  fov: 52
};

export const SCENARIOS = [
  { id: 'normal', label: 'Normal', issue: 'No exception', color: '#4ade80' },
  { id: 'late-truck', label: 'Late truck', issue: 'Scheduled ITV delayed by quay traffic', color: '#fbbf24' },
  { id: 'vessel-dig', label: 'Vessel dig', issue: 'Source bay blocked by a dig/restow', color: '#f87171' },
  { id: 'sensor-dropout', label: 'Sensor dropout', issue: 'Guidance confidence drops below threshold', color: '#38bdf8' }
];

export const CONTAINERS = [
  {
    id: 'TGHU-771205-3',
    shortId: 'TGHU 1205',
    iso: '20GP',
    sizeFt: 20,
    weight: '18.2 t',
    weightClass: 'Medium',
    bay: '34-06-82',
    color: '#2563eb',
    requiredChassis: '20 ft chassis',
    scale: [0.72, 0.9, 0.9]
  },
  {
    id: 'CAXU-421934-7',
    shortId: 'CAXU 1934',
    iso: '40HC',
    sizeFt: 40,
    weight: '28.4 t',
    weightClass: 'Heavy',
    bay: '38-08-84',
    color: '#ef4444',
    requiredChassis: '40 ft skeletal',
    scale: [1, 0.9, 0.9]
  },
  {
    id: 'PONU-553018-9',
    shortId: 'PONU 3018',
    iso: '40RF',
    sizeFt: 40,
    weight: '24.1 t',
    weightClass: 'Reefer',
    bay: '40-04-86',
    color: '#10b981',
    requiredChassis: '40 ft powered',
    scale: [1, 0.9, 0.9]
  },
  {
    id: 'MEDU-908442-1',
    shortId: 'MEDU 8442',
    iso: '45HC',
    sizeFt: 45,
    weight: '31.0 t',
    weightClass: 'Oversize',
    bay: '42-02-82',
    color: '#f59e0b',
    requiredChassis: '45 ft extendable',
    scale: [1.12, 0.9, 0.9]
  }
];

export const VEHICLES = [
  {
    id: 'ITV-108',
    chassis: '20 ft chassis',
    compatibleIso: ['20GP'],
    role: 'Current handoff',
    color: '#eab308'
  },
  {
    id: 'ITV-115',
    chassis: '40 ft skeletal',
    compatibleIso: ['40HC', '40RF'],
    role: 'Compatible fallback',
    color: '#facc15'
  },
  {
    id: 'ITV-122',
    chassis: '40 ft skeletal',
    compatibleIso: ['40HC', '40RF'],
    role: 'Scheduled first',
    color: '#64748b'
  }
];

export const MOVES = [
  {
    id: 'MOVE-43',
    containerId: 'TGHU-771205-3',
    vehicleId: 'ITV-108',
    score: 96,
    status: 'Active handoff',
    damping: 'Light',
    twinLift: 'No',
    loadMoment: 'Low'
  },
  {
    id: 'MOVE-44',
    containerId: 'CAXU-421934-7',
    vehicleId: 'ITV-122',
    fallbackVehicleId: 'ITV-115',
    score: 91,
    status: 'Scheduled next',
    damping: 'Heavy',
    twinLift: 'No',
    loadMoment: 'High'
  },
  {
    id: 'MOVE-45',
    containerId: 'PONU-553018-9',
    vehicleId: 'ITV-115',
    score: 84,
    status: 'Fallback ready',
    damping: 'Reefer',
    twinLift: 'No',
    loadMoment: 'Medium'
  },
  {
    id: 'MOVE-46',
    containerId: 'MEDU-908442-1',
    vehicleId: 'ITV-122',
    score: 69,
    status: 'Reserve',
    damping: 'Oversize',
    twinLift: 'No',
    loadMoment: 'High'
  }
];

const dataFeeds = [
  {
    id: 'tos',
    name: 'TOS / BAPLIE',
    origin: 'Terminal planning',
    sample: 'Move list, bay 38-08-84, ISO 40HC',
    freshness: '2s',
    status: 'Live',
    color: '#38bdf8',
    position: [-5.45, 1.45, 2.48]
  },
  {
    id: 'plc',
    name: 'STS PLC',
    origin: 'Crane PLC cabinet',
    sample: 'Hoist 22.4m, twistlock locked, load 18.2t',
    freshness: '100ms',
    status: 'Trigger armed',
    color: '#fbbf24',
    position: [-1.24, 4.32, 0.85]
  },
  {
    id: 'gps',
    name: 'GPS / VMT',
    origin: 'ITV fleet tablets',
    sample: 'ITV-115 ETA 12s, lane 2, speed 8 km/h',
    freshness: '1s',
    status: 'Tracking',
    color: '#4ade80',
    position: [-5.65, 0.92, -2.36]
  },
  {
    id: 'yard',
    name: 'Yard readiness',
    origin: 'Yard block / RTG queue',
    sample: 'Slot B free, reefer plug ready, buffer open',
    freshness: '4s',
    status: 'Ready',
    color: '#a78bfa',
    position: [5.55, 1.14, -3.2]
  },
  {
    id: 'weather',
    name: 'Weather mast',
    origin: 'Quay wind sensor',
    sample: 'Wind 8 m/s, gust stable, damping normal',
    freshness: '3s',
    status: 'Stable',
    color: '#93c5fd',
    position: [-3.42, 2.55, 0.55]
  }
];

const phaseCopy = {
  baseline: {
    narration: 'The current problem is clear: after one handoff, the crane waits because the next truck, source bay, and fallback are not ready together.',
    bullets: ['Idle gap is visible at Slot B.', 'Next move is not committed.', 'No compatibility-checked fallback is staged.']
  },
  feeds: {
    narration: 'The coordination layer is built from visible feeds: TOS/BAPLIE, STS PLC, ITV GPS/VMT, yard readiness, and weather.',
    bullets: ['Every source has an origin and sample field.', 'Freshness/status is visible before decisions.', 'The engine recommends; it does not command the crane.']
  },
  trigger: {
    narration: 'The PLC trigger is visible: hoist height, trolley position, twistlock state, load cell, and anti-sway cross the evaluation threshold.',
    bullets: ['Trigger occurs before the crane reaches idle.', 'The source bay and container ID are visible.', 'Look-ahead starts from PLC facts.']
  },
  rank: {
    narration: 'Look-ahead ranking now shows which container goes to which vehicle and whether the truck chassis can carry it.',
    bullets: ['Container ISO, bay, weight, and required chassis are shown.', 'Vehicle compatibility is checked before dispatch.', 'Fallback candidates are ranked before the trolley stops.']
  },
  slot: {
    narration: 'Micro-slot dispatch guides ITV-108 to Slot B with visible GPS/VMT, lane beacon, slot camera, and stop-line sensor.',
    bullets: ['Lane 2 and Slot B stay separated from the fallback buffer.', 'Sensor labels explain how positioning is measured.', 'The truck turns green only when centered.']
  },
  guide: {
    narration: 'Spreader guidance shows the same handoff continuing: camera, proximity sensors, load cell, twistlock sensors, and hoist encoder all labeled.',
    bullets: ['Reverse-parking lines show lateral offset.', 'Distance drives the visual beep cadence.', 'The container remains attached under the spreader.']
  },
  handoff: {
    narration: 'The container is placed onto the compatible ITV, twistlocks release, and the spreader raises empty.',
    bullets: ['The carried box stays attached until release.', 'Truck load and container ID remain synchronized.', 'The next scheduled truck is evaluated immediately.']
  },
  resequence: {
    narration: 'Dedicated exception scene: the scheduled first truck is delayed, incompatible trucks are rejected, and only a compatible fallback is recommended.',
    bullets: ['ITV-122 is scheduled first but delayed by traffic.', 'ITV-108 is rejected for 40HC due to 20 ft chassis.', 'ITV-115 is compatible and becomes the operator recommendation.']
  },
  zero: {
    narration: 'Zero-Wait compresses multiple cycles: pick from vessel, truck enters Slot B, handoff completes, truck exits, next truck arrives.',
    bullets: ['Three ghosted handoff cycles show no dead-time gap.', 'Containers and trucks change every cycle.', 'The crane keeps moving instead of waiting.']
  },
  safety: {
    narration: 'Fallback makes authority clear: sensor dropout and vessel dig degrade to manual completion while ZERO-WAIT keeps recommendation context visible.',
    bullets: ['Manual completion is explicitly displayed.', 'Unavailable automated path is highlighted.', 'Operator keeps final authority.']
  },
  feedback: {
    narration: 'The black-box log records the actual move, recovered idle seconds, compatibility decision, and next refreshed horizon.',
    bullets: ['Recovered idle is logged per cycle.', 'Moves/hour and GOH estimate update.', 'The next two to three tasks are refreshed.']
  }
};

export const PHASES = [
  {
    phaseId: 'baseline-wait',
    short: 'WAIT',
    zone: 'Problem',
    title: 'Baseline Wait',
    durationMs: 5200,
    focusZone: 'overview',
    cameraPose: FIXED_QUAY_CAMERA,
    visiblePanel: 'baseline',
    ...phaseCopy.baseline
  },
  {
    phaseId: 'data-feeds',
    short: 'FEEDS',
    zone: 'Coordination engine',
    title: 'Data Feeds',
    durationMs: 6200,
    focusZone: 'engine',
    cameraPose: FIXED_QUAY_CAMERA,
    visiblePanel: 'feeds',
    ...phaseCopy.feeds
  },
  {
    phaseId: 'plc-trigger',
    short: 'TRIGGER',
    zone: 'PLC trigger',
    title: 'PLC Trigger',
    durationMs: 6200,
    focusZone: 'vessel',
    cameraPose: FIXED_QUAY_CAMERA,
    visiblePanel: 'plc',
    ...phaseCopy.trigger
  },
  {
    phaseId: 'look-ahead',
    short: 'RANK',
    zone: 'Look-ahead',
    title: 'Look-Ahead Ranking',
    durationMs: 6200,
    focusZone: 'vessel',
    cameraPose: FIXED_QUAY_CAMERA,
    visiblePanel: 'ranking',
    ...phaseCopy.rank
  },
  {
    phaseId: 'micro-slot',
    short: 'SLOT',
    zone: 'Micro-slot',
    title: 'Micro-Slot Vehicle Positioning',
    durationMs: 7000,
    focusZone: 'slot',
    cameraPose: FIXED_QUAY_CAMERA,
    visiblePanel: 'micro-slot',
    ...phaseCopy.slot
  },
  {
    phaseId: 'spreader-guidance',
    short: 'GUIDE',
    zone: 'Spreader guidance',
    title: 'Spreader Guidance',
    durationMs: 7000,
    focusZone: 'guide',
    cameraPose: FIXED_QUAY_CAMERA,
    visiblePanel: 'spreader',
    ...phaseCopy.guide
  },
  {
    phaseId: 'handoff',
    short: 'LOCK',
    zone: 'Handoff',
    title: 'Handoff And Release',
    durationMs: 5600,
    focusZone: 'guide',
    cameraPose: FIXED_QUAY_CAMERA,
    visiblePanel: 'handoff',
    ...phaseCopy.handoff
  },
  {
    phaseId: 'dynamic-resequence',
    short: 'RESEQ',
    zone: 'Exception scene',
    title: 'Dynamic Resequencing',
    durationMs: 7600,
    focusZone: 'exception',
    cameraPose: FIXED_QUAY_CAMERA,
    visiblePanel: 'resequence',
    ...phaseCopy.resequence
  },
  {
    phaseId: 'zero-wait',
    short: 'ZERO',
    zone: 'Fast cycles',
    title: 'Zero-Wait Moment',
    durationMs: 7600,
    focusZone: 'slot',
    cameraPose: FIXED_QUAY_CAMERA,
    visiblePanel: 'zero-wait',
    ...phaseCopy.zero
  },
  {
    phaseId: 'safety-modes',
    short: 'SAFE',
    zone: 'Safety / fallback',
    title: 'Safety And Fallback',
    durationMs: 6500,
    focusZone: 'safety',
    cameraPose: FIXED_QUAY_CAMERA,
    visiblePanel: 'safety',
    ...phaseCopy.safety
  },
  {
    phaseId: 'feedback-loop',
    short: 'LOG',
    zone: 'Feedback log',
    title: 'Feedback Loop',
    durationMs: 5600,
    focusZone: 'engine',
    cameraPose: FIXED_QUAY_CAMERA,
    visiblePanel: 'feedback',
    ...phaseCopy.feedback
  }
];

export function getTotalDuration() {
  return PHASES.reduce((total, phase) => total + phase.durationMs, 0);
}

export function getPhaseByElapsed(totalElapsedMs) {
  const cycle = getTotalDuration();
  let elapsed = ((totalElapsedMs % cycle) + cycle) % cycle;
  for (let i = 0; i < PHASES.length; i += 1) {
    const phase = PHASES[i];
    if (elapsed < phase.durationMs) {
      return { index: i, phase, localMs: elapsed, progress: elapsed / phase.durationMs };
    }
    elapsed -= phase.durationMs;
  }
  const last = PHASES[PHASES.length - 1];
  return { index: PHASES.length - 1, phase: last, localMs: last.durationMs, progress: 1 };
}

export function getElapsedForPhase(index) {
  return PHASES.slice(0, index).reduce((total, phase) => total + phase.durationMs, 0);
}

export function resolveFrame(phase, progress, scenarioId) {
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) || SCENARIOS[0];
  const issueActive = isIssueActive(phase.phaseId, scenario.id, progress);
  const craneMove = getCraneMove(phase.phaseId, progress, scenario.id);
  const activeMove = getMove(craneMove.moveId);
  const activeContainer = getContainer(activeMove.containerId);
  const crane = getCraneState(phase.phaseId, progress, craneMove);
  const trucks = getTruckStates(phase.phaseId, progress, scenario.id, issueActive, activeContainer);
  const microSlot = getMicroSlotState(phase.phaseId, progress, scenario.id, issueActive, trucks);
  const guidance = getGuidanceState(phase.phaseId, progress, scenario.id);
  const plcSignals = getPlcSignals(phase.phaseId, progress, crane, activeContainer);
  const exceptionScene = getExceptionScene(phase.phaseId, progress, scenario.id);
  const zeroWaitCycles = getZeroWaitCycles(phase.phaseId, progress);
  const safetyMode = getSafetyMode(phase.phaseId, progress, scenario.id);
  const metrics = getMetrics(phase.phaseId, progress);

  return {
    ...phase,
    progress,
    scenario,
    issueActive,
    cameraPose: phase.cameraPose,
    narration: getNarration(phase, scenario.id, issueActive),
    systemMode: safetyMode,
    containers: CONTAINERS,
    vehicles: VEHICLES,
    moves: getRankedMoves(phase.phaseId, scenario.id, issueActive),
    activeMove,
    activeContainer,
    dataFeeds,
    crane,
    trucks,
    microSlot,
    guidance,
    plcSignals,
    sensorLabels: getSensorLabels(phase.phaseId, scenario.id, issueActive),
    exceptionScene,
    zeroWaitCycles,
    metrics,
    panelDetails: getPanelDetails(phase.visiblePanel, scenario.id, issueActive, progress, microSlot, activeMove, activeContainer),
    routeDetails: getRouteDetails(phase.phaseId, scenario.id, issueActive, microSlot),
    sourceContainer: {
      ...activeContainer,
      visible: crane.sourceVisible,
      locked: crane.locked && ['plc-trigger', 'look-ahead'].includes(phase.phaseId),
      position: getSourcePosition(activeContainer.id)
    }
  };
}

function getCraneMove(phaseId, progress, scenarioId) {
  if (phaseId === 'zero-wait') {
    const cycle = getCurrentCycle(progress);
    return { moveId: cycle.moveId, cycleIndex: cycle.index };
  }
  if (phaseId === 'dynamic-resequence') return { moveId: 'MOVE-44', cycleIndex: 1 };
  if (phaseId === 'safety-modes' && scenarioId === 'vessel-dig') return { moveId: 'MOVE-44', cycleIndex: 1 };
  return { moveId: 'MOVE-43', cycleIndex: 0 };
}

function getCurrentCycle(progress) {
  const cycles = [
    { index: 0, moveId: 'MOVE-43', start: 0, end: 0.34 },
    { index: 1, moveId: 'MOVE-44', start: 0.28, end: 0.68 },
    { index: 2, moveId: 'MOVE-45', start: 0.62, end: 1 }
  ];
  return cycles.find((cycle) => progress >= cycle.start && progress <= cycle.end) || cycles[cycles.length - 1];
}

function getContainer(id) {
  return CONTAINERS.find((container) => container.id === id) || CONTAINERS[0];
}

function getVehicle(id) {
  return VEHICLES.find((vehicle) => vehicle.id === id) || VEHICLES[0];
}

function getMove(id) {
  return MOVES.find((move) => move.id === id) || MOVES[0];
}

function getSourcePosition(containerId) {
  if (containerId === 'CAXU-421934-7') return WORLD.alternateSource;
  if (containerId === 'PONU-553018-9') return { x: 1.08, y: 1.47, z: 2.82 };
  return WORLD.source;
}

function getCraneState(phaseId, progress, craneMove) {
  const p = clamp(progress, 0, 1);
  const e = easeInOut(p);
  const activeMove = getMove(craneMove.moveId);
  const activeContainer = getContainer(activeMove.containerId);
  const source = getSourcePosition(activeContainer.id);
  const sourceZ = source.z;
  const sourceX = source.x;
  const slotZ = WORLD.slot.z;
  const slotX = WORLD.slot.x;
  const sourceContact = WORLD.sourceContact;
  const high = WORLD.hoistHigh;
  const landing = WORLD.landingContact;

  if (phaseId === 'zero-wait') {
    const cycle = getCurrentCycle(p);
    const cycleProgress = clamp((p - cycle.start) / (cycle.end - cycle.start), 0, 1);
    const phase = cycleProgress < 0.22 ? 'pick' : cycleProgress < 0.52 ? 'travel' : cycleProgress < 0.72 ? 'lower' : 'release';
    const travel = easeInOut(clamp((cycleProgress - 0.22) / 0.3, 0, 1));
    const lower = easeInOut(clamp((cycleProgress - 0.52) / 0.2, 0, 1));
    return {
      trolleyX: lerp(sourceX, slotX, travel),
      trolleyZ: lerp(sourceZ, slotZ, travel),
      hoistY: phase === 'pick' ? lerp(sourceContact, high, easeInOut(cycleProgress / 0.22)) : phase === 'lower' ? lerp(high, landing, lower) : phase === 'release' ? lerp(landing, 2.75, easeInOut((cycleProgress - 0.72) / 0.28)) : high,
      carried: cycleProgress < 0.72,
      locked: cycleProgress < 0.72,
      sourceVisible: false,
      slotAligned: travel > 0.92,
      containerOnTruck: cycleProgress >= 0.72,
      moveId: activeMove.id,
      container: activeContainer
    };
  }

  switch (phaseId) {
    case 'plc-trigger': {
      const lockProgress = clamp((p - 0.12) / 0.72, 0, 1);
      return {
        trolleyX: sourceX,
        trolleyZ: sourceZ,
        hoistY: lerp(high, sourceContact, easeInOut(lockProgress)),
        carried: p > 0.78,
        locked: p > 0.66,
        sourceVisible: p <= 0.78,
        slotAligned: false,
        containerOnTruck: false,
        moveId: activeMove.id,
        container: activeContainer
      };
    }
    case 'look-ahead':
      return {
        trolleyX: sourceX,
        trolleyZ: sourceZ,
        hoistY: lerp(sourceContact, high, e),
        carried: true,
        locked: true,
        sourceVisible: false,
        slotAligned: false,
        containerOnTruck: false,
        moveId: activeMove.id,
        container: activeContainer
      };
    case 'micro-slot':
      return {
        trolleyX: lerp(sourceX, slotX, e),
        trolleyZ: lerp(sourceZ, slotZ, e),
        hoistY: high,
        carried: true,
        locked: true,
        sourceVisible: false,
        slotAligned: p > 0.78,
        containerOnTruck: false,
        moveId: activeMove.id,
        container: activeContainer
      };
    case 'spreader-guidance':
      return {
        trolleyX: slotX,
        trolleyZ: slotZ,
        hoistY: lerp(3.2, landing, e),
        carried: true,
        locked: true,
        sourceVisible: false,
        slotAligned: true,
        containerOnTruck: false,
        moveId: activeMove.id,
        container: activeContainer
      };
    case 'handoff':
      return {
        trolleyX: slotX,
        trolleyZ: slotZ,
        hoistY: p < 0.45 ? landing : lerp(landing, 2.75, easeInOut((p - 0.45) / 0.55)),
        carried: p < 0.45,
        locked: p < 0.45,
        sourceVisible: false,
        slotAligned: true,
        containerOnTruck: p >= 0.45,
        moveId: activeMove.id,
        container: activeContainer
      };
    case 'dynamic-resequence':
      return {
        trolleyX: WORLD.alternateSource.x,
        trolleyZ: WORLD.alternateSource.z,
        hoistY: lerp(high, 3.2, e),
        carried: false,
        locked: false,
        sourceVisible: true,
        slotAligned: false,
        containerOnTruck: false,
        moveId: activeMove.id,
        container: activeContainer
      };
    case 'safety-modes':
      return {
        trolleyX: scenarioNeedsManual(activeMove.id) ? WORLD.alternateSource.x : slotX,
        trolleyZ: scenarioNeedsManual(activeMove.id) ? WORLD.alternateSource.z : slotZ,
        hoistY: high,
        carried: false,
        locked: false,
        sourceVisible: true,
        slotAligned: false,
        containerOnTruck: false,
        moveId: activeMove.id,
        container: activeContainer
      };
    case 'feedback-loop':
      return {
        trolleyX: sourceX,
        trolleyZ: sourceZ,
        hoistY: lerp(high, 3.15, e),
        carried: false,
        locked: false,
        sourceVisible: true,
        slotAligned: false,
        containerOnTruck: false,
        moveId: activeMove.id,
        container: activeContainer
      };
    default:
      return {
        trolleyX: phaseId === 'data-feeds' ? sourceX : slotX,
        trolleyZ: phaseId === 'data-feeds' ? sourceZ : slotZ,
        hoistY: phaseId === 'baseline-wait' ? 2.7 : high,
        carried: false,
        locked: false,
        sourceVisible: true,
        slotAligned: false,
        containerOnTruck: false,
        moveId: activeMove.id,
        container: activeContainer
      };
  }
}

function scenarioNeedsManual(moveId) {
  return moveId === 'MOVE-44';
}

function getTruckStates(phaseId, progress, scenarioId, issueActive, activeContainer) {
  const p = clamp(progress, 0, 1);
  const e = easeInOut(p);
  const slotX = WORLD.slot.x;
  const approachX = -6.4;
  const arrivalX = WORLD.arrivalWindow.x;
  const fallbackX = WORLD.fallbackWindow.x;
  const queueX = WORLD.queueWindow.x;

  const itv108 = makeTruck('ITV-108', {
    lane: 'lane2',
    x: slotX,
    z: LANES.lane2.z,
    status: '20GP handoff vehicle',
    tone: 'cyan',
    target: ['baseline-wait', 'plc-trigger', 'look-ahead', 'micro-slot', 'spreader-guidance', 'handoff'].includes(phaseId)
  });
  const itv115 = makeTruck('ITV-115', {
    lane: 'lane2',
    x: approachX,
    z: LANES.lane2.z,
    status: '40 ft fallback',
    tone: 'amber'
  });
  const itv122 = makeTruck('ITV-122', {
    lane: 'buffer',
    x: fallbackX,
    z: LANES.buffer.z,
    status: 'Scheduled next',
    tone: 'muted'
  });

  if (['data-feeds', 'plc-trigger', 'look-ahead'].includes(phaseId)) {
    itv115.x = approachX;
    itv115.status = 'Awaiting micro-slot';
    itv122.status = 'Scheduled first for 40HC';
  }

  if (phaseId === 'micro-slot') {
    itv108.x = lerp(approachX, slotX, e);
    itv108.target = true;
    itv108.status = p > 0.82 ? 'Centered in Slot B' : 'GPS/VMT ETA to Slot B';
    itv108.tone = p > 0.82 ? 'green' : 'amber';
    itv115.x = arrivalX;
    itv115.z = LANES.lane1.z;
    itv115.lane = 'lane1';
    itv115.status = 'Next 40 ft candidate';
    itv122.x = fallbackX;
    itv122.status = '40 ft scheduled queue';
  }

  if (phaseId === 'spreader-guidance' || phaseId === 'handoff') {
    itv108.x = slotX;
    itv108.target = true;
    itv108.status = phaseId === 'handoff' && p >= 0.45 ? 'Loaded TGHU 20GP' : 'Receiving 20GP';
    itv108.tone = phaseId === 'handoff' && p >= 0.45 ? 'green' : 'cyan';
    itv108.loaded = phaseId === 'handoff' && p >= 0.45;
    itv108.loadedContainer = phaseId === 'handoff' && p >= 0.45 ? getContainer('TGHU-771205-3') : null;
    itv115.x = arrivalX;
    itv115.status = 'Staged for 40HC';
    itv115.tone = 'green';
    itv122.x = fallbackX;
    itv122.status = 'Scheduled next';
  }

  if (phaseId === 'dynamic-resequence') {
    const issueProgress = clamp((p - 0.14) / 0.72, 0, 1);
    itv108.x = lerp(1.15, 5.8, easeInOut(clamp(p / 0.7, 0, 1)));
    itv108.loaded = true;
    itv108.loadedContainer = getContainer('TGHU-771205-3');
    itv108.target = false;
    itv108.status = 'Reject: 20 ft chassis';
    itv108.tone = issueActive ? 'red' : 'muted';

    itv122.lane = 'lane1';
    itv122.z = LANES.lane1.z;
    itv122.x = scenarioId === 'late-truck' && issueActive ? lerp(queueX, queueX - 1.5, issueProgress) : queueX;
    itv122.target = !issueActive;
    itv122.status = issueActive ? 'Delayed by quay traffic' : 'Scheduled first';
    itv122.tone = issueActive ? 'red' : 'amber';

    itv115.lane = 'lane2';
    itv115.z = LANES.lane2.z;
    itv115.x = issueActive ? lerp(arrivalX, slotX, issueProgress) : arrivalX;
    itv115.target = issueActive;
    itv115.status = issueActive ? 'Compatible fallback' : 'Compatible standby';
    itv115.tone = issueActive ? 'green' : 'amber';
  }

  if (phaseId === 'zero-wait') {
    const cycles = getZeroWaitCycles(phaseId, p);
    const first = cycles[0];
    const second = cycles[1];
    const third = cycles[2];
    itv108.x = first.truckX;
    itv108.z = first.truckZ;
    itv108.lane = first.lane;
    itv108.loaded = first.loaded;
    itv108.loadedContainer = first.loaded ? getContainer(first.containerId) : null;
    itv108.target = first.active;
    itv108.status = first.loaded ? 'Loaded / departing' : first.routeStage;
    itv108.tone = first.active || first.loaded ? 'green' : 'muted';
    itv115.x = second.truckX;
    itv115.z = second.truckZ;
    itv115.lane = second.lane;
    itv115.loaded = second.loaded;
    itv115.loadedContainer = second.loaded ? getContainer(second.containerId) : null;
    itv115.target = second.active;
    itv115.status = second.loaded ? 'Loaded / departing' : second.routeStage;
    itv115.tone = second.active || second.loaded ? 'green' : 'amber';
    itv122.x = third.truckX;
    itv122.z = third.truckZ;
    itv122.lane = third.lane;
    itv122.loaded = third.loaded;
    itv122.loadedContainer = third.loaded ? getContainer(third.containerId) : null;
    itv122.target = third.active;
    itv122.status = third.loaded ? 'Loaded / departing' : third.routeStage;
    itv122.tone = third.active || third.loaded ? 'green' : 'muted';
  }

  if (phaseId === 'safety-modes' || phaseId === 'feedback-loop') {
    itv108.x = 6.6;
    itv108.loaded = true;
    itv108.loadedContainer = getContainer('TGHU-771205-3');
    itv108.target = false;
    itv108.status = 'Loaded / departed';
    itv108.tone = 'muted';
    itv115.x = slotX;
    itv115.target = true;
    itv115.status = scenarioId === 'normal' ? 'Ready at Slot B' : 'Manual completion standby';
    itv115.tone = scenarioId === 'normal' ? 'green' : 'amber';
    itv122.x = queueX;
    itv122.lane = 'lane1';
    itv122.z = LANES.lane1.z;
    itv122.status = scenarioId === 'late-truck' ? 'Recovered from delay' : 'Queue position';
  }

  return { itv108, itv115, itv122 };
}

function makeTruck(id, overrides) {
  const vehicle = getVehicle(id);
  return {
    id,
    lane: overrides.lane,
    x: overrides.x,
    z: overrides.z,
    chassis: vehicle.chassis,
    compatibleIso: vehicle.compatibleIso,
    loaded: false,
    loadedContainer: null,
    target: false,
    status: overrides.status,
    tone: overrides.tone,
    ...overrides
  };
}

function getMicroSlotState(phaseId, progress, scenarioId, issueActive, trucks) {
  const active = ['micro-slot', 'spreader-guidance', 'handoff', 'dynamic-resequence', 'zero-wait'].includes(phaseId);
  const slotTruck =
    phaseId === 'dynamic-resequence'
      ? trucks.itv115
      : phaseId === 'zero-wait'
        ? [trucks.itv108, trucks.itv115, trucks.itv122].find((truck) => truck.target) || trucks.itv115
        : trucks.itv108;
  const centered = Math.abs(slotTruck.x - WORLD.slot.x) < 0.18;
  return {
    active,
    slotX: WORLD.slot.x,
    slotZ: WORLD.slot.z,
    arrivalX: WORLD.arrivalWindow.x,
    arrivalZ: WORLD.arrivalWindow.z,
    fallbackX: WORLD.fallbackWindow.x,
    fallbackZ: WORLD.fallbackWindow.z,
    routeTone: issueActive ? 'green' : 'cyan',
    primaryBlocked: issueActive && ['late-truck', 'vessel-dig'].includes(scenarioId),
    centered,
    etaSeconds: Math.max(0, Math.round(12 - progress * 12))
  };
}

function getGuidanceState(phaseId, progress, scenarioId) {
  const active = phaseId === 'spreader-guidance' || phaseId === 'handoff';
  const p = active ? clamp(progress, 0, 1) : 0;
  const distance = phaseId === 'handoff' ? 0.2 : active ? lerp(3.0, 0.2, easeInOut(p)) : 7.8;
  const offset = phaseId === 'handoff' ? 0 : active ? lerp(0.44, 0.02, easeInOut(p)) : 0.7;
  const dropout = scenarioId === 'sensor-dropout' && phaseId === 'safety-modes';
  return {
    active,
    distance,
    offset,
    proximity: active ? clamp(1 - distance / 6, 0, 1) : 0.08,
    beep: distance < 0.5 ? 'LOCKED' : distance < 1.5 ? 'CONTACT' : distance < 3.5 ? 'CLOSE' : active ? 'BEEP' : 'IDLE',
    confidence: dropout ? 51 : Math.round(98 - offset * 10),
    locked: distance < 0.5 || phaseId === 'handoff',
    dropout
  };
}

function getPlcSignals(phaseId, progress, crane, container) {
  const p = clamp(progress, 0, 1);
  const armed = phaseId === 'plc-trigger';
  const hoistMeters = Math.max(0, (crane.hoistY - WORLD.sourceContact) * 11.2).toFixed(1);
  return [
    { label: 'Hoist encoder', value: `${hoistMeters} m`, threshold: '< 4.0 m', state: armed && p > 0.22 ? 'crossed' : 'watch' },
    { label: 'Trolley position', value: `Bay ${container.bay}`, threshold: 'over source', state: armed && p > 0.18 ? 'crossed' : 'watch' },
    { label: 'Twistlock', value: crane.locked ? 'Locked' : 'Open', threshold: 'locked', state: crane.locked ? 'crossed' : 'watch' },
    { label: 'Load cell', value: crane.locked ? container.weight : '0.0 t', threshold: '> 2 t', state: crane.locked ? 'crossed' : 'watch' },
    { label: 'Anti-sway', value: armed && p > 0.48 ? 'Damping OK' : 'Settling', threshold: '< 0.3 m', state: armed && p > 0.48 ? 'crossed' : 'watch' }
  ];
}

function getSensorLabels(phaseId, scenarioId, issueActive) {
  const micro = [
    { id: 'gps-vmt', label: 'GPS / VMT', value: 'ETA + lane', position: [-4.7, 0.92, LANES.lane2.z - 0.55], labelOffset: [-0.32, 0.42, -0.24], color: '#4ade80' },
    { id: 'lane-beacon', label: 'Lane beacon', value: 'Lane 2 ID', position: [-1.8, 0.35, LANES.lane2.z + 0.62], labelOffset: [-0.58, 0.44, 0.12], color: '#38bdf8' },
    { id: 'slot-camera', label: 'Slot camera', value: 'Centering', position: [0.82, 1.25, LANES.lane2.z + 0.74], labelOffset: [0.52, 0.34, 0.22], color: '#fbbf24' },
    { id: 'stop-line', label: 'Stop-line', value: 'Wheel stop', position: [0.25, 0.25, LANES.lane2.z - 0.62], labelOffset: [0.42, 0.38, -0.24], color: '#a78bfa' }
  ];
  const spreader = [
    { id: 'spreader-camera', label: 'Camera', value: 'Guide rails', position: [0.0, 1.82, LANES.lane2.z - 0.55], labelOffset: [-0.76, 0.3, -0.12], color: '#38bdf8' },
    { id: 'proximity', label: 'Proximity', value: '0.2-3.0 m', position: [-0.78, 1.58, LANES.lane2.z + 0.42], labelOffset: [-0.72, 0.24, 0.18], color: '#4ade80' },
    { id: 'load-cell', label: 'Load cell', value: '18.2 t', position: [0.7, 2.35, LANES.lane2.z], labelOffset: [0.68, 0.32, -0.08], color: '#fbbf24' },
    { id: 'twistlock', label: 'Twistlocks', value: '4 corners', position: [0.82, 1.58, LANES.lane2.z + 0.42], labelOffset: [0.76, 0.2, 0.16], color: '#4ade80' },
    { id: 'hoist-encoder', label: 'Hoist encoder', value: 'Height', position: [-0.72, 3.1, LANES.lane2.z - 0.1], labelOffset: [-0.42, 0.52, -0.18], color: '#93c5fd' }
  ];
  const plc = [
    { id: 'hoist-encoder', label: 'Hoist encoder', value: 'Height', position: [-0.74, 3.18, WORLD.source.z - 0.08], labelOffset: [-0.86, 0.5, 0.08], color: '#93c5fd' },
    { id: 'load-cell', label: 'Load cell', value: 'Weight', position: [0.74, 2.46, WORLD.source.z - 0.04], labelOffset: [0.76, 0.38, 0.1], color: '#fbbf24' },
    { id: 'twistlock', label: 'Twistlocks', value: 'Lock state', position: [0.0, 2.02, WORLD.source.z + 0.44], labelOffset: [0.12, -0.42, 0.58], color: '#4ade80' },
    { id: 'anti-sway', label: 'Anti-sway', value: 'Damping', position: [-0.46, 2.82, WORLD.source.z - 0.52], labelOffset: [-0.72, 0.18, -0.34], color: '#38bdf8' }
  ];
  if (phaseId === 'micro-slot') return micro;
  if (phaseId === 'spreader-guidance' || phaseId === 'handoff') return spreader;
  if (phaseId === 'plc-trigger') return plc;
  if (phaseId === 'dynamic-resequence' && issueActive) {
    return [
      { id: 'traffic', label: 'Traffic delay', value: scenarioId === 'late-truck' ? 'ITV-122 blocked' : 'Bay dig blocks move', position: [WORLD.queueWindow.x, 1.2, LANES.lane1.z - 0.55], labelOffset: [-0.55, 0.38, -0.12], color: '#f87171' },
      { id: 'compatibility', label: 'Compatibility', value: '40HC only', position: [-1.15, 0.95, LANES.lane2.z - 0.55], labelOffset: [0.55, 0.34, -0.18], color: '#4ade80' }
    ];
  }
  return [];
}

function getExceptionScene(phaseId, progress, scenarioId) {
  const active = phaseId === 'dynamic-resequence' && scenarioId !== 'normal';
  const targetMove = getMove('MOVE-44');
  const targetContainer = getContainer(targetMove.containerId);
  const planned = getVehicle('ITV-122');
  const fallback = getVehicle('ITV-115');
  const reject = getVehicle('ITV-108');
  return {
    active,
    type: scenarioId,
    issue: scenarioId === 'vessel-dig' ? 'Source bay blocked by vessel dig' : 'Scheduled ITV-122 delayed by quay traffic',
    targetContainer,
    planned: {
      vehicle: planned,
      reason: scenarioId === 'vessel-dig' ? 'Move blocked at vessel bay' : 'Traffic delay +48s',
      compatible: isCompatible(planned, targetContainer)
    },
    fallback: {
      vehicle: fallback,
      reason: '40 ft skeletal chassis matches 40HC',
      compatible: isCompatible(fallback, targetContainer)
    },
    rejected: {
      vehicle: reject,
      reason: '20 ft chassis cannot carry 40HC',
      compatible: isCompatible(reject, targetContainer)
    },
    operatorCallout: scenarioId === 'normal' ? 'No exception' : 'Operator recommendation: place CAXU 40HC on ITV-115'
  };
}

function getZeroWaitCycles(phaseId, progress) {
  const definitions = [
    {
      label: 'Cycle 1',
      moveId: 'MOVE-43',
      containerId: 'TGHU-771205-3',
      vehicleId: 'ITV-108',
      start: 0,
      end: 0.34,
      offset: 0,
      stage: { x: WORLD.slot.x, z: LANES.lane2.z, lane: 'lane2' },
      approach: { x: WORLD.slot.x, z: LANES.lane2.z, lane: 'lane2' },
      slot: { x: WORLD.slot.x, z: LANES.lane2.z, lane: 'lane2' },
      depart: { x: 6.15, z: LANES.lane2.z, lane: 'lane2' }
    },
    {
      label: 'Cycle 2',
      moveId: 'MOVE-44',
      containerId: 'CAXU-421934-7',
      vehicleId: 'ITV-115',
      start: 0.28,
      end: 0.68,
      offset: 7,
      stage: { x: -4.95, z: LANES.lane1.z, lane: 'lane1' },
      approach: { x: WORLD.arrivalWindow.x, z: LANES.lane1.z, lane: 'lane1' },
      merge: { x: WORLD.arrivalWindow.x, z: LANES.lane2.z, lane: 'lane2' },
      slot: { x: WORLD.slot.x, z: LANES.lane2.z, lane: 'lane2' },
      depart: { x: 6.15, z: LANES.lane2.z, lane: 'lane2' }
    },
    {
      label: 'Cycle 3',
      moveId: 'MOVE-45',
      containerId: 'PONU-553018-9',
      vehicleId: 'ITV-122',
      start: 0.62,
      end: 1,
      offset: 14,
      stage: { x: WORLD.fallbackWindow.x, z: LANES.buffer.z, lane: 'buffer' },
      approach: { x: -1.18, z: LANES.buffer.z, lane: 'buffer' },
      merge: { x: -1.18, z: LANES.lane2.z, lane: 'lane2' },
      slot: { x: WORLD.slot.x, z: LANES.lane2.z, lane: 'lane2' },
      depart: { x: 6.15, z: LANES.lane2.z, lane: 'lane2' }
    }
  ];
  return definitions.map((cycle) => {
    const local = clamp((progress - cycle.start) / (cycle.end - cycle.start), 0, 1);
    const active = phaseId === 'zero-wait' && progress >= cycle.start && progress <= cycle.end;
    const released = phaseId === 'zero-wait' && progress >= cycle.start && local >= 0.72;
    const route = getZeroWaitTruckRoute(cycle, local, phaseId === 'zero-wait');
    return {
      ...cycle,
      local,
      active,
      visible: true,
      released,
      loaded: released,
      departing: released && local > 0.76,
      complete: phaseId === 'zero-wait' && local > 0.94,
      truckX: route.x,
      truckZ: route.z,
      lane: route.lane,
      routeStage: route.stage,
      routePoints: route.points,
      seconds: cycle.offset
    };
  });
}

function getZeroWaitTruckRoute(cycle, local, isZeroWait) {
  if (!isZeroWait) {
    return {
      x: cycle.stage.x,
      z: cycle.stage.z,
      lane: cycle.stage.lane,
      stage: 'Staged and visible',
      points: [[cycle.stage.x, 0.22, cycle.stage.z], [cycle.slot.x, 0.22, cycle.slot.z], [cycle.depart.x, 0.22, cycle.depart.z]]
    };
  }

  if (cycle.label === 'Cycle 1') {
    if (local < 0.72) {
      return {
        x: cycle.slot.x,
        z: cycle.slot.z,
        lane: cycle.slot.lane,
        stage: 'Centered in Slot B',
        points: [[cycle.slot.x, 0.22, cycle.slot.z], [cycle.depart.x, 0.22, cycle.depart.z]]
      };
    }
    const departT = easeInOut((local - 0.72) / 0.28);
    return {
      x: lerp(cycle.slot.x, cycle.depart.x, departT),
      z: cycle.slot.z,
      lane: cycle.slot.lane,
      stage: 'Loaded departure',
      points: [[cycle.slot.x, 0.22, cycle.slot.z], [cycle.depart.x, 0.22, cycle.depart.z]]
    };
  }

  const stage = cycle.stage;
  const approach = cycle.approach;
  const merge = cycle.merge;
  const slot = cycle.slot;
  const depart = cycle.depart;

  if (local < 0.16) {
    return {
      x: stage.x,
      z: stage.z,
      lane: stage.lane,
      stage: 'Visible staging',
      points: [[stage.x, 0.22, stage.z], [approach.x, 0.22, approach.z], [merge.x, 0.22, merge.z], [slot.x, 0.22, slot.z], [depart.x, 0.22, depart.z]]
    };
  }
  if (local < 0.34) {
    const t = easeInOut((local - 0.16) / 0.18);
    return {
      x: lerp(stage.x, approach.x, t),
      z: lerp(stage.z, approach.z, t),
      lane: approach.lane,
      stage: 'Approaching lane',
      points: [[stage.x, 0.22, stage.z], [approach.x, 0.22, approach.z], [merge.x, 0.22, merge.z], [slot.x, 0.22, slot.z], [depart.x, 0.22, depart.z]]
    };
  }
  if (local < 0.48) {
    const t = easeInOut((local - 0.34) / 0.14);
    return {
      x: lerp(approach.x, merge.x, t),
      z: lerp(approach.z, merge.z, t),
      lane: merge.lane,
      stage: 'Merging to Lane 2',
      points: [[stage.x, 0.22, stage.z], [approach.x, 0.22, approach.z], [merge.x, 0.22, merge.z], [slot.x, 0.22, slot.z], [depart.x, 0.22, depart.z]]
    };
  }
  if (local < 0.62) {
    const t = easeInOut((local - 0.48) / 0.14);
    return {
      x: lerp(merge.x, slot.x, t),
      z: lerp(merge.z, slot.z, t),
      lane: slot.lane,
      stage: 'Entering Slot B',
      points: [[stage.x, 0.22, stage.z], [approach.x, 0.22, approach.z], [merge.x, 0.22, merge.z], [slot.x, 0.22, slot.z], [depart.x, 0.22, depart.z]]
    };
  }
  if (local < 0.76) {
    return {
      x: slot.x,
      z: slot.z,
      lane: slot.lane,
      stage: 'Receiving container',
      points: [[stage.x, 0.22, stage.z], [approach.x, 0.22, approach.z], [merge.x, 0.22, merge.z], [slot.x, 0.22, slot.z], [depart.x, 0.22, depart.z]]
    };
  }
  const t = easeInOut((local - 0.76) / 0.24);
  return {
    x: lerp(slot.x, depart.x, t),
    z: slot.z,
    lane: slot.lane,
    stage: 'Loaded departure',
    points: [[stage.x, 0.22, stage.z], [approach.x, 0.22, approach.z], [merge.x, 0.22, merge.z], [slot.x, 0.22, slot.z], [depart.x, 0.22, depart.z]]
  };
}

function getRankedMoves(phaseId, scenarioId, issueActive) {
  return MOVES.map((move) => {
    const container = getContainer(move.containerId);
    const vehicle = getVehicle(move.vehicleId);
    const fallbackVehicle = move.fallbackVehicleId ? getVehicle(move.fallbackVehicleId) : null;
    let status = move.status;
    let score = move.score;
    let recommendedVehicleId = move.vehicleId;

    if (phaseId === 'dynamic-resequence' && issueActive && move.id === 'MOVE-44') {
      status = scenarioId === 'vessel-dig' ? 'Manual source check' : 'Reassigned to fallback';
      score = scenarioId === 'vessel-dig' ? 44 : 93;
      recommendedVehicleId = scenarioId === 'vessel-dig' ? move.vehicleId : 'ITV-115';
    }

    return {
      ...move,
      status,
      score,
      container,
      vehicle,
      fallbackVehicle,
      recommendedVehicleId,
      compatible: isCompatible(vehicle, container),
      fallbackCompatible: fallbackVehicle ? isCompatible(fallbackVehicle, container) : false
    };
  });
}

function isCompatible(vehicle, container) {
  return vehicle.compatibleIso.includes(container.iso);
}

function getSafetyMode(phaseId, progress, scenarioId) {
  if (phaseId !== 'safety-modes') {
    if (phaseId === 'baseline-wait') return 'Manual baseline';
    return 'Coordinated';
  }
  if (scenarioId !== 'normal') return 'Manual completion required';
  if (scenarioId === 'normal') {
    if (progress < 0.45) return 'Coordinated';
    if (progress < 0.78) return 'Recommendation';
    return 'Manual available';
  }
}

function getMetrics(phaseId, progress) {
  const order = PHASES.findIndex((phase) => phase.phaseId === phaseId);
  const base = Math.max(0, order);
  const phaseGain = base + progress;
  return {
    idleSaved: Math.round(clamp(phaseGain * 2.05, 0, 24)),
    onTime: Math.round(clamp(64 + phaseGain * 3.1, 64, 96)),
    movesHour: (25 + clamp(phaseGain * 0.42, 0, 4.6)).toFixed(1),
    recoveredHours: Math.round(clamp(phaseGain * 17, 0, 190)),
    annualValue: Math.round(clamp(phaseGain * 17, 0, 190) * 280)
  };
}

function getPanelDetails(panel, scenarioId, issueActive, progress, microSlot, activeMove, activeContainer) {
  if (panel === 'baseline') {
    return [
      { label: 'Idle gap', value: '8-15 s', tone: 'red' },
      { label: 'Next move', value: 'Unverified', tone: 'amber' },
      { label: 'Fallback', value: 'No chassis check', tone: 'red' }
    ];
  }
  if (panel === 'feeds') {
    return [
      { label: 'Feeds', value: '5 live', tone: 'green' },
      { label: 'Freshness', value: '100ms-4s', tone: 'cyan' },
      { label: 'Output', value: 'Recommendation', tone: 'amber' }
    ];
  }
  if (panel === 'plc') {
    return [
      { label: 'Trigger', value: progress > 0.62 ? 'Crossed' : 'Armed', tone: progress > 0.62 ? 'green' : 'amber' },
      { label: 'Container', value: activeContainer.shortId, tone: 'cyan' },
      { label: 'Decision', value: '128 ms', tone: 'green' }
    ];
  }
  if (panel === 'ranking') {
    return [
      { label: activeMove.id, value: `${activeContainer.iso} -> ${activeMove.vehicleId}`, tone: 'green' },
      { label: 'Weight', value: activeContainer.weight, tone: 'cyan' },
      { label: 'Bay', value: activeContainer.bay, tone: 'amber' }
    ];
  }
  if (panel === 'micro-slot') {
    return [
      { label: 'ITV-108', value: microSlot.centered ? 'Centered' : 'ETA window', tone: microSlot.centered ? 'green' : 'amber' },
      { label: 'Sensors', value: '4 labeled', tone: 'cyan' },
      { label: 'Target', value: 'Lane 2 / Slot B', tone: 'green' }
    ];
  }
  if (panel === 'spreader') {
    return [
      { label: 'Distance', value: '3.0 -> 0.2 m', tone: 'cyan' },
      { label: 'Offset', value: 'Closing', tone: 'amber' },
      { label: 'Sensors', value: '5 labeled', tone: 'green' }
    ];
  }
  if (panel === 'handoff') {
    return [
      { label: 'Twistlock', value: progress >= 0.45 ? 'Released' : 'Confirmed', tone: 'green' },
      { label: activeMove.vehicleId, value: progress >= 0.45 ? 'Loaded' : 'Receiving', tone: progress >= 0.45 ? 'green' : 'cyan' },
      { label: activeContainer.iso, value: activeContainer.shortId, tone: 'amber' }
    ];
  }
  if (panel === 'resequence') {
    return [
      { label: 'Planned', value: scenarioId === 'normal' ? 'ITV-122 OK' : 'ITV-122 delayed', tone: scenarioId === 'normal' ? 'green' : 'red' },
      { label: 'Rejected', value: 'ITV-108 mismatch', tone: 'red' },
      { label: 'Fallback', value: 'ITV-115 compatible', tone: 'green' }
    ];
  }
  if (panel === 'zero-wait') {
    return [
      { label: 'Cycles', value: '3 shown', tone: 'green' },
      { label: 'Idle gap', value: progress > 0.12 ? '0 s' : 'Closing', tone: progress > 0.12 ? 'green' : 'cyan' },
      { label: 'Next move', value: 'Already staged', tone: 'cyan' }
    ];
  }
  if (panel === 'safety') {
    return [
      { label: 'Mode', value: scenarioId === 'normal' ? 'Coordinated' : 'Manual required', tone: scenarioId === 'normal' ? 'green' : 'red' },
      { label: 'Reason', value: scenarioId === 'sensor-dropout' ? 'Sensor dropout' : scenarioId === 'vessel-dig' ? 'Vessel dig' : 'Degrade path', tone: scenarioId === 'normal' ? 'cyan' : 'amber' },
      { label: 'Authority', value: 'Operator', tone: 'cyan' }
    ];
  }
  return [
    { label: 'Recovered idle', value: '24 s', tone: 'green' },
    { label: 'Moves/hour', value: '+5-8%', tone: 'cyan' },
    { label: 'Annual GOH', value: '190 h', tone: 'green' }
  ];
}

function getRouteDetails(phaseId, scenarioId, issueActive, microSlot) {
  if (phaseId === 'dynamic-resequence') {
    if (scenarioId === 'normal') {
      return {
        primary: 'No exception: ITV-122 remains the scheduled first truck for CAXU 40HC.',
        fallback: 'ITV-115 remains compatibility-checked as a fallback.'
      };
    }
    if (scenarioId === 'vessel-dig') {
      return {
        primary: 'Vessel dig blocks the source bay, so ZERO-WAIT degrades the task to manual completion.',
        fallback: 'The operator sees compatible truck context but completes the exception manually.'
      };
    }
    return {
      primary: 'ITV-122 is delayed by traffic; the route turns red and it is demoted.',
      fallback: 'ITV-115 is the only compatible available 40 ft chassis, so it is promoted.'
    };
  }
  if (phaseId === 'zero-wait') {
    return {
      primary: microSlot.centered ? 'The next truck is centered while the previous truck has cleared the slot.' : 'Fast cycles overlap safely: pick, slot, handoff, depart.',
      fallback: 'Ghost trails show the sequence without adding extra phase cards.'
    };
  }
  if (phaseId === 'micro-slot') {
    return {
      primary: 'ITV-108 follows the Lane 2 ETA route into Slot B using GPS/VMT and lane sensors.',
      fallback: 'ITV-115 and ITV-122 stay separate until compatibility and schedule say otherwise.'
    };
  }
  return {
    primary: 'The active recommendation is based on live position, crane status, and container compatibility.',
    fallback: 'Fallbacks are staged only when the truck can carry the selected container type.'
  };
}

function getNarration(phase, scenarioId, issueActive) {
  if (!issueActive) return phase.narration;
  if (phase.phaseId === 'dynamic-resequence') {
    if (scenarioId === 'late-truck') {
      return 'Late truck exception: scheduled ITV-122 is delayed by traffic, ITV-108 is rejected for chassis mismatch, and ITV-115 is recommended.';
    }
    if (scenarioId === 'vessel-dig') {
      return 'Vessel dig exception: the source bay is blocked, so the operator receives manual completion guidance with compatibility context preserved.';
    }
  }
  if (phase.phaseId === 'safety-modes' && scenarioId === 'sensor-dropout') {
    return 'Sensor dropout exception: proximity confidence drops below threshold and the system switches to manual completion required.';
  }
  return phase.narration;
}

function isIssueActive(phaseId, scenarioId, progress) {
  if (scenarioId === 'normal') return false;
  if (phaseId === 'dynamic-resequence') return true;
  if (phaseId === 'safety-modes' && ['sensor-dropout', 'vessel-dig'].includes(scenarioId)) return true;
  return false;
}

export function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
