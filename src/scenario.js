export const LANES = {
  lane1: { id: 'lane1', label: 'Lane 1', z: -1.15 },
  lane2: { id: 'lane2', label: 'Lane 2', z: -2.35 },
  buffer: { id: 'buffer', label: 'Fallback buffer', z: -3.55 }
};

export const WORLD = {
  source: { x: 0, y: 1.47, z: 2.12 },
  slot: { x: 0, z: LANES.lane2.z },
  arrivalWindow: { x: -2.75, z: LANES.lane2.z },
  fallbackWindow: { x: -2.75, z: LANES.buffer.z },
  hoistHigh: 4.08,
  sourceContact: 1.94,
  landingContact: 1.46
};

const cameraPresets = {
  overview: { position: [6.6, 5.3, 6.5], target: [-0.35, 1.15, -0.45], fov: 42 },
  vessel: { position: [5.8, 4.8, 5.2], target: [0.15, 1.95, 1.7], fov: 37 },
  engine: { position: [5.9, 4.8, 4.0], target: [-1.95, 1.15, -0.2], fov: 40 },
  slot: { position: [2.4, 5.4, -6.8], target: [-0.6, 0.75, -2.45], fov: 40 },
  guide: { position: [4.6, 3.65, -5.15], target: [0, 1.85, -2.35], fov: 34 },
  safety: { position: [5.4, 4.6, 3.8], target: [-0.75, 1.2, -1.1], fov: 39 }
};

export const SCENARIOS = [
  { id: 'normal', label: 'Normal', issue: 'No exception', color: '#4ade80' },
  { id: 'late-truck', label: 'Late truck', issue: 'Primary ITV misses the target window', color: '#fbbf24' },
  { id: 'vessel-dig', label: 'Vessel dig', issue: 'Primary move blocked by unexpected restow', color: '#f87171' },
  { id: 'sensor-dropout', label: 'Sensor dropout', issue: 'Guidance degrades to recommendation mode', color: '#38bdf8' }
];

export const PHASES = [
  {
    phaseId: 'baseline-wait',
    short: 'WAIT',
    zone: 'Vessel / crane',
    title: 'Baseline Wait',
    durationMs: 5200,
    focusZone: 'overview',
    cameraPose: cameraPresets.overview,
    visiblePanel: 'baseline',
    narration: 'Before ZERO-WAIT, the crane finishes a move and waits for the next truck, task, and confirmation.',
    bullets: ['Idle gap is visible at the handoff point.', 'The next vehicle is not yet committed.', 'No fallback has been prepared.']
  },
  {
    phaseId: 'data-feeds',
    short: 'FEEDS',
    zone: 'Coordination engine',
    title: 'Data Feeds',
    durationMs: 5200,
    focusZone: 'engine',
    cameraPose: cameraPresets.engine,
    visiblePanel: 'engine',
    narration: 'The coordination layer combines TOS/BAPLIE, PLC, GPS/VMT, yard readiness, and wind inputs.',
    bullets: ['Inputs flow into one live state model.', 'No crane commands are issued.', 'The engine prepares decisions while the move is still running.']
  },
  {
    phaseId: 'plc-trigger',
    short: 'TRIGGER',
    zone: 'Vessel / crane',
    title: 'PLC Trigger',
    durationMs: 5400,
    focusZone: 'vessel',
    cameraPose: cameraPresets.vessel,
    visiblePanel: 'crane',
    narration: 'The spreader descends onto the vessel container and the PLC trigger starts next-move evaluation.',
    bullets: ['Hoist height and spreader status cross the trigger threshold.', 'The source bay is highlighted on the vessel.', 'The container locks before lift begins.']
  },
  {
    phaseId: 'look-ahead',
    short: 'RANK',
    zone: 'Vessel / crane',
    title: 'Look-Ahead Ranking',
    durationMs: 5600,
    focusZone: 'vessel',
    cameraPose: cameraPresets.vessel,
    visiblePanel: 'ranking',
    narration: 'The locked container is hoisted clear while the engine ranks the next two to three executable moves.',
    bullets: ['Readiness score includes load moment and damping profile.', 'Twin-lift sync is checked before the trolley stops.', 'A verified fallback stays ready.']
  },
  {
    phaseId: 'micro-slot',
    short: 'SLOT',
    zone: 'Quay micro-slot',
    title: 'Micro-Slot Vehicle Positioning',
    durationMs: 6800,
    focusZone: 'slot',
    cameraPose: cameraPresets.slot,
    visiblePanel: 'micro-slot',
    narration: 'ITV-115 receives a precise Lane 2 arrival window while the crane travels landside with the current container.',
    bullets: ['Lane 2 / Slot B is shown separately from the fallback buffer.', 'The truck slows into the target window instead of crowding the crane.', 'ITV-122 waits in a separate fallback lane.']
  },
  {
    phaseId: 'dynamic-resequence',
    short: 'RESEQ',
    zone: 'Coordination engine',
    title: 'Dynamic Resequencing',
    durationMs: 6200,
    focusZone: 'engine',
    cameraPose: cameraPresets.engine,
    visiblePanel: 'resequence',
    narration: 'The rolling horizon rechecks readiness and promotes a fallback before the crane reaches idle.',
    bullets: ['Primary move can be demoted if conditions change.', 'Fallback route is already staged.', 'The operator sees one clear recommendation.']
  },
  {
    phaseId: 'spreader-guidance',
    short: 'GUIDE',
    zone: 'Spreader guidance',
    title: 'Spreader Guidance',
    durationMs: 7000,
    focusZone: 'guide',
    cameraPose: cameraPresets.guide,
    visiblePanel: 'spreader',
    narration: 'The spreader camera and proximity sensors guide the final descent like reverse parking for a container.',
    bullets: ['Guide rails show lateral offset.', 'Distance-to-contact drives visual beep cadence.', 'The target only turns green when centered.']
  },
  {
    phaseId: 'handoff',
    short: 'LOCK',
    zone: 'Vessel / crane',
    title: 'Handoff And Release',
    durationMs: 5600,
    focusZone: 'guide',
    cameraPose: cameraPresets.guide,
    visiblePanel: 'handoff',
    narration: 'Twistlocks confirm, the container is released onto ITV-108, and the spreader raises empty.',
    bullets: ['The carried box stays attached until the release point.', 'ITV-108 becomes loaded before departure.', 'The next vehicle is already staged.']
  },
  {
    phaseId: 'zero-wait',
    short: 'ZERO',
    zone: 'Quay micro-slot',
    title: 'Zero-Wait Moment',
    durationMs: 6600,
    focusZone: 'slot',
    cameraPose: cameraPresets.slot,
    visiblePanel: 'zero-wait',
    narration: 'ITV-108 clears the handoff point and ITV-115 slides into Slot B without a dead-time gap.',
    bullets: ['The outgoing and incoming vehicles stay separated.', 'Slot B turns green when ITV-115 is centered.', 'The crane has no reason to wait.']
  },
  {
    phaseId: 'safety-modes',
    short: 'SAFE',
    zone: 'Safety',
    title: 'Safety Modes',
    durationMs: 6200,
    focusZone: 'safety',
    cameraPose: cameraPresets.safety,
    visiblePanel: 'safety',
    narration: 'The system degrades from coordinated mode to recommendation mode and then manual availability.',
    bullets: ['ZERO-WAIT recommends; it does not command the crane.', 'Uncertain sensor input reduces automation confidence.', 'The operator keeps final authority.']
  },
  {
    phaseId: 'feedback-loop',
    short: 'LOG',
    zone: 'Coordination engine',
    title: 'Feedback Loop',
    durationMs: 5600,
    focusZone: 'engine',
    cameraPose: cameraPresets.engine,
    visiblePanel: 'feedback',
    narration: 'The outcome is logged, KPIs update, and the next look-ahead horizon opens immediately.',
    bullets: ['Idle seconds are written to the black-box log.', 'Moves/hour and recovered GOH update.', 'The next two to three tasks are refreshed.']
  }
];

const detailsByPanel = {
  baseline: [
    { label: 'Idle gap', value: '8-15 s', tone: 'red' },
    { label: 'Next move', value: 'Unknown', tone: 'amber' },
    { label: 'Fallback', value: 'None', tone: 'red' }
  ],
  engine: [
    { label: 'TOS / BAPLIE', value: 'Move list live', tone: 'cyan' },
    { label: 'PLC', value: 'Hoist + spreader', tone: 'amber' },
    { label: 'GPS / VMT', value: 'Fleet positions', tone: 'green' }
  ],
  crane: [
    { label: 'PLC trigger', value: 'Z-axis + lock', tone: 'cyan' },
    { label: 'Source bay', value: 'Vessel highlighted', tone: 'amber' },
    { label: 'Decision', value: '128 ms', tone: 'green' }
  ],
  ranking: [
    { label: 'Move 43', value: '94 ready', tone: 'green' },
    { label: 'Move 44', value: '88 fallback', tone: 'green' },
    { label: 'Move 45', value: '71 reserve', tone: 'amber' }
  ],
  'micro-slot': [
    { label: 'ITV-115', value: 'ETA window', tone: 'green' },
    { label: 'Target', value: 'Lane 2 / Slot B', tone: 'cyan' },
    { label: 'ITV-122', value: 'Buffer lane', tone: 'amber' }
  ],
  resequence: [
    { label: 'Horizon', value: '5 s check', tone: 'cyan' },
    { label: 'Primary', value: 'Re-ranked', tone: 'amber' },
    { label: 'Fallback', value: 'Promotable', tone: 'green' }
  ],
  spreader: [
    { label: 'Distance', value: '3.0 -> 0.2 m', tone: 'cyan' },
    { label: 'Offset', value: 'Closing', tone: 'amber' },
    { label: 'Sensors', value: 'Camera + LIDAR', tone: 'green' }
  ],
  handoff: [
    { label: 'Twistlock', value: 'Confirmed', tone: 'green' },
    { label: 'ITV-108', value: 'Loaded', tone: 'green' },
    { label: 'Spreader', value: 'Empty return', tone: 'cyan' }
  ],
  'zero-wait': [
    { label: 'Idle gap', value: '0 s', tone: 'green' },
    { label: 'ITV-115', value: 'Centered', tone: 'green' },
    { label: 'Next move', value: 'Active', tone: 'cyan' }
  ],
  safety: [
    { label: 'Coordinated', value: 'Normal', tone: 'green' },
    { label: 'Recommendation', value: 'Degraded', tone: 'amber' },
    { label: 'Manual', value: 'Available', tone: 'cyan' }
  ],
  feedback: [
    { label: 'Recovered idle', value: '20 s', tone: 'green' },
    { label: 'Moves/hour', value: '+5-8%', tone: 'cyan' },
    { label: 'Annual GOH', value: '180 h', tone: 'green' }
  ]
};

const routeDetails = {
  normal: {
    primary: 'ITV-115 follows the blue Lane 2 route into the arrival window.',
    fallback: 'ITV-122 remains ready in the buffer lane.'
  },
  'late-truck': {
    primary: 'ITV-115 is late and remains outside the target window.',
    fallback: 'ITV-122 is promoted from the fallback buffer.'
  },
  'vessel-dig': {
    primary: 'The planned vessel bay is blocked by a dig.',
    fallback: 'Move 44 becomes the recommended executable task.'
  },
  'sensor-dropout': {
    primary: 'One proximity feed becomes uncertain.',
    fallback: 'Guidance degrades to recommendation mode.'
  }
};

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
  const crane = getCraneState(phase.phaseId, progress);
  const trucks = getTruckStates(phase.phaseId, progress, scenario.id, issueActive);
  const microSlot = getMicroSlotState(phase.phaseId, progress, scenario.id, issueActive, trucks);
  const guidance = getGuidanceState(phase.phaseId, progress, scenario.id);
  const safetyMode = getSafetyMode(phase.phaseId, progress, scenario.id);
  const metrics = getMetrics(phase.phaseId, progress);
  const panelDetails = getPanelDetails(phase.visiblePanel, scenario.id, issueActive, progress, microSlot);

  return {
    ...phase,
    progress,
    scenario,
    issueActive,
    cameraPose: phase.cameraPose,
    narration: getNarration(phase, scenario.id, issueActive),
    systemMode: safetyMode,
    crane,
    trucks,
    microSlot,
    guidance,
    metrics,
    panelDetails,
    routeDetails: getRouteDetails(phase.phaseId, scenario.id, issueActive, microSlot),
    sourceContainer: {
      visible: crane.sourceVisible,
      locked: crane.locked && ['plc-trigger', 'look-ahead'].includes(phase.phaseId)
    }
  };
}

function getCraneState(phaseId, progress) {
  const p = clamp(progress, 0, 1);
  const e = easeInOut(p);
  const sourceZ = WORLD.source.z;
  const slotZ = WORLD.slot.z;
  const sourceContact = WORLD.sourceContact;
  const high = WORLD.hoistHigh;
  const landing = WORLD.landingContact;

  switch (phaseId) {
    case 'plc-trigger': {
      const lockProgress = clamp((p - 0.12) / 0.72, 0, 1);
      return {
        trolleyX: 0,
        trolleyZ: sourceZ,
        hoistY: lerp(high, sourceContact, easeInOut(lockProgress)),
        carried: p > 0.78,
        locked: p > 0.66,
        sourceVisible: p <= 0.78,
        slotAligned: false,
        containerOnTruck: false
      };
    }
    case 'look-ahead':
      return {
        trolleyX: 0,
        trolleyZ: sourceZ,
        hoistY: lerp(sourceContact, high, e),
        carried: true,
        locked: true,
        sourceVisible: false,
        slotAligned: false,
        containerOnTruck: false
      };
    case 'micro-slot':
      return {
        trolleyX: 0,
        trolleyZ: lerp(sourceZ, slotZ, e),
        hoistY: high,
        carried: true,
        locked: true,
        sourceVisible: false,
        slotAligned: p > 0.78,
        containerOnTruck: false
      };
    case 'dynamic-resequence':
      return {
        trolleyX: 0,
        trolleyZ: lerp(lerp(sourceZ, slotZ, 0.72), slotZ, e),
        hoistY: lerp(high, 3.55, e),
        carried: true,
        locked: true,
        sourceVisible: false,
        slotAligned: true,
        containerOnTruck: false
      };
    case 'spreader-guidance':
      return {
        trolleyX: 0,
        trolleyZ: slotZ,
        hoistY: lerp(3.2, landing, e),
        carried: true,
        locked: true,
        sourceVisible: false,
        slotAligned: true,
        containerOnTruck: false
      };
    case 'handoff':
      return {
        trolleyX: 0,
        trolleyZ: slotZ,
        hoistY: p < 0.45 ? landing : lerp(landing, 2.75, easeInOut((p - 0.45) / 0.55)),
        carried: p < 0.45,
        locked: p < 0.45,
        sourceVisible: false,
        slotAligned: true,
        containerOnTruck: p >= 0.45
      };
    case 'zero-wait':
      return {
        trolleyX: 0,
        trolleyZ: lerp(slotZ, sourceZ, e),
        hoistY: lerp(2.75, high, e),
        carried: false,
        locked: false,
        sourceVisible: true,
        slotAligned: false,
        containerOnTruck: false
      };
    case 'safety-modes':
      return {
        trolleyX: 0,
        trolleyZ: lerp(slotZ, sourceZ, e),
        hoistY: high,
        carried: false,
        locked: false,
        sourceVisible: true,
        slotAligned: false,
        containerOnTruck: false
      };
    case 'feedback-loop':
      return {
        trolleyX: 0,
        trolleyZ: sourceZ,
        hoistY: lerp(high, 3.15, e),
        carried: false,
        locked: false,
        sourceVisible: true,
        slotAligned: false,
        containerOnTruck: false
      };
    default:
      return {
        trolleyX: 0,
        trolleyZ: phaseId === 'data-feeds' ? sourceZ : slotZ,
        hoistY: phaseId === 'baseline-wait' ? 2.7 : high,
        carried: false,
        locked: false,
        sourceVisible: true,
        slotAligned: false,
        containerOnTruck: false
      };
  }
}

function getTruckStates(phaseId, progress, scenarioId, issueActive) {
  const p = clamp(progress, 0, 1);
  const e = easeInOut(p);
  const slotX = WORLD.slot.x;
  const approachX = -6.4;
  const arrivalX = WORLD.arrivalWindow.x;
  const fallbackX = WORLD.fallbackWindow.x;

  const itv108 = {
    id: 'ITV-108',
    lane: 'lane2',
    x: slotX,
    z: LANES.lane2.z,
    loaded: false,
    target: ['baseline-wait', 'plc-trigger', 'look-ahead', 'micro-slot', 'dynamic-resequence', 'spreader-guidance', 'handoff'].includes(phaseId),
    status: 'Current handoff vehicle',
    tone: 'cyan'
  };

  const itv115 = {
    id: 'ITV-115',
    lane: 'lane2',
    x: approachX,
    z: LANES.lane2.z,
    loaded: false,
    target: false,
    status: 'Next vehicle',
    tone: 'amber'
  };

  const itv122 = {
    id: 'ITV-122',
    lane: 'buffer',
    x: fallbackX,
    z: LANES.buffer.z,
    loaded: false,
    target: issueActive,
    status: 'Fallback buffer',
    tone: issueActive ? 'green' : 'muted'
  };

  if (['data-feeds', 'plc-trigger', 'look-ahead'].includes(phaseId)) {
    itv115.x = approachX;
    itv115.status = 'Awaiting micro-slot';
  }

  if (phaseId === 'micro-slot') {
    itv115.x = lerp(approachX, arrivalX, e);
    itv115.target = true;
    itv115.status = p > 0.82 ? 'Centered in arrival window' : 'Approaching timed window';
    itv115.tone = p > 0.82 ? 'green' : 'amber';
  }

  if (phaseId === 'dynamic-resequence') {
    itv115.x = scenarioId === 'late-truck' && issueActive ? lerp(arrivalX - 1.1, arrivalX - 2.4, e) : arrivalX;
    itv115.target = !issueActive;
    itv115.status = issueActive ? 'Primary delayed or blocked' : 'Held in arrival window';
    itv115.tone = issueActive ? 'red' : 'green';
    if (issueActive) {
      itv122.x = lerp(fallbackX, -1.25, e);
      itv122.status = 'Fallback promoted';
    }
  }

  if (phaseId === 'spreader-guidance' || phaseId === 'handoff') {
    itv115.x = arrivalX;
    itv115.target = true;
    itv115.status = 'Staged behind Slot B';
    itv115.tone = 'green';
  }

  if (phaseId === 'handoff') {
    itv108.loaded = progress >= 0.45;
    itv108.status = progress >= 0.45 ? 'Loaded and ready to depart' : 'Receiving current container';
    itv108.tone = progress >= 0.45 ? 'green' : 'cyan';
  }

  if (phaseId === 'zero-wait') {
    const departProgress = easeInOut(clamp(p / 0.72, 0, 1));
    const arriveProgress = easeInOut(clamp((p - 0.26) / 0.7, 0, 1));
    itv108.x = lerp(slotX, 6.2, departProgress);
    itv108.loaded = true;
    itv108.target = false;
    itv108.status = 'Departing loaded';
    itv108.tone = 'green';
    itv115.x = lerp(arrivalX, slotX, arriveProgress);
    itv115.target = true;
    itv115.status = arriveProgress > 0.92 ? 'Centered in Slot B' : 'Sliding into Slot B';
    itv115.tone = arriveProgress > 0.92 ? 'green' : 'amber';
  }

  if (phaseId === 'safety-modes' || phaseId === 'feedback-loop') {
    itv108.x = 6.6;
    itv108.loaded = true;
    itv108.target = false;
    itv108.status = 'Loaded / departed';
    itv108.tone = 'muted';
    itv115.x = slotX;
    itv115.target = true;
    itv115.status = 'Now active at Slot B';
    itv115.tone = 'green';
  }

  return { itv108, itv115, itv122 };
}

function getMicroSlotState(phaseId, progress, scenarioId, issueActive, trucks) {
  const active = ['micro-slot', 'dynamic-resequence', 'spreader-guidance', 'handoff', 'zero-wait'].includes(phaseId);
  const centered = phaseId === 'zero-wait' ? Math.abs(trucks.itv115.x - WORLD.slot.x) < 0.18 : Math.abs(trucks.itv115.x - WORLD.arrivalWindow.x) < 0.18;
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
  return {
    active,
    distance,
    offset,
    proximity: active ? clamp(1 - distance / 6, 0, 1) : 0.08,
    beep: distance < 0.5 ? 'LOCKED' : distance < 1.5 ? 'CONTACT' : distance < 3.5 ? 'CLOSE' : active ? 'BEEP' : 'IDLE',
    confidence: scenarioId === 'sensor-dropout' && phaseId === 'safety-modes' ? 61 : Math.round(98 - offset * 10),
    locked: distance < 0.5 || phaseId === 'handoff'
  };
}

function getSafetyMode(phaseId, progress, scenarioId) {
  if (phaseId !== 'safety-modes') {
    if (phaseId === 'baseline-wait') return 'Manual baseline';
    return 'Coordinated';
  }
  if (scenarioId === 'sensor-dropout') {
    if (progress < 0.34) return 'Coordinated';
    if (progress < 0.68) return 'Recommendation';
    return 'Manual available';
  }
  if (progress < 0.45) return 'Coordinated';
  if (progress < 0.78) return 'Recommendation';
  return 'Manual available';
}

function getMetrics(phaseId, progress) {
  const order = PHASES.findIndex((phase) => phase.phaseId === phaseId);
  const base = Math.max(0, order);
  const phaseGain = base + progress;
  return {
    idleSaved: Math.round(clamp(phaseGain * 2.05, 0, 22)),
    onTime: Math.round(clamp(64 + phaseGain * 3.1, 64, 96)),
    movesHour: (25 + clamp(phaseGain * 0.38, 0, 4)).toFixed(1),
    recoveredHours: Math.round(clamp(phaseGain * 17, 0, 180)),
    annualValue: Math.round(clamp(phaseGain * 17, 0, 180) * 280)
  };
}

function getPanelDetails(panel, scenarioId, issueActive, progress, microSlot) {
  if (issueActive && panel === 'resequence') {
    if (scenarioId === 'late-truck') {
      return [
        { label: 'ITV-115', value: 'Late', tone: 'red' },
        { label: 'ITV-122', value: 'Promoted', tone: 'green' },
        { label: 'Decision', value: '118 ms', tone: 'cyan' }
      ];
    }
    if (scenarioId === 'vessel-dig') {
      return [
        { label: 'Move 43', value: 'Blocked', tone: 'red' },
        { label: 'Move 44', value: 'Promoted', tone: 'green' },
        { label: 'Decision', value: '118 ms', tone: 'cyan' }
      ];
    }
  }
  if (panel === 'zero-wait') {
    return [
      { label: 'Idle gap', value: progress > 0.12 ? '0 s' : 'Closing', tone: progress > 0.12 ? 'green' : 'cyan' },
      { label: 'ITV-115', value: microSlot.centered ? 'Centered' : 'Sliding in', tone: microSlot.centered ? 'green' : 'amber' },
      { label: 'Next move', value: microSlot.centered ? 'Active' : 'Queued', tone: microSlot.centered ? 'cyan' : 'amber' }
    ];
  }
  if (panel === 'handoff') {
    return [
      { label: 'Twistlock', value: progress >= 0.45 ? 'Released' : 'Confirmed', tone: 'green' },
      { label: 'ITV-108', value: progress >= 0.45 ? 'Loaded' : 'Receiving', tone: progress >= 0.45 ? 'green' : 'cyan' },
      { label: 'Spreader', value: progress >= 0.45 ? 'Empty return' : 'Loaded descent', tone: 'cyan' }
    ];
  }
  return detailsByPanel[panel] || detailsByPanel.engine;
}

function getRouteDetails(phaseId, scenarioId, issueActive, microSlot) {
  if (phaseId === 'zero-wait') {
    return {
      primary: microSlot.centered
        ? 'ITV-115 is centered in Slot B while ITV-108 has cleared the handoff lane.'
        : 'ITV-108 departs loaded while ITV-115 advances from the arrival window.',
      fallback: 'The fallback buffer remains physically separate, so the slot never gets crowded.'
    };
  }
  if (phaseId === 'micro-slot') {
    return {
      primary: 'ITV-115 follows the blue Lane 2 route into the arrival window.',
      fallback: 'ITV-122 remains ready in the buffer lane.'
    };
  }
  if (issueActive && ['dynamic-resequence', 'safety-modes'].includes(phaseId)) {
    return routeDetails[scenarioId] || routeDetails.normal;
  }
  return routeDetails[scenarioId] || routeDetails.normal;
}

function getNarration(phase, scenarioId, issueActive) {
  if (!issueActive) return phase.narration;
  if (scenarioId === 'late-truck') {
    return 'Late truck detected: ITV-115 is kept out of the handoff slot and the fallback route is promoted.';
  }
  if (scenarioId === 'vessel-dig') {
    return 'Unexpected vessel dig detected: the blocked move is demoted and Move 44 becomes the executable recommendation.';
  }
  if (scenarioId === 'sensor-dropout') {
    return 'Sensor uncertainty detected: ZERO-WAIT degrades to recommendation mode while the operator keeps authority.';
  }
  return phase.narration;
}

function isIssueActive(phaseId, scenarioId, progress) {
  if (scenarioId === 'normal') return false;
  if (phaseId === 'dynamic-resequence' && progress > 0.15) return true;
  if (phaseId === 'safety-modes' && scenarioId === 'sensor-dropout') return progress > 0.22;
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
