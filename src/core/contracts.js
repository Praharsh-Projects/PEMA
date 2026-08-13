export const SCENARIO_IDS = ['normal', 'late-truck', 'vessel-dig', 'sensor-dropout'];

export const SAFETY_MODES = {
  COORDINATED: 'Coordinated',
  RECOMMENDATION: 'Recommendation',
  MANUAL: 'Manual'
};

export const TARGET_SLOT = {
  craneId: 'STS-04',
  lane: 'Lane 2',
  slot: 'Slot B',
  targetArrivalSeconds: 8,
  arrivalToleranceSeconds: 7,
  laneCenterX: 0,
  laneCenterY: 0
};

export const DEFAULT_THRESHOLDS = {
  plcTriggerHoistMeters: 4,
  maxDecisionMs: 200,
  maxVehicleEtaSeconds: 18,
  maxFreshnessMs: {
    tos: 5000,
    plc: 1000,
    gps: 2500,
    yard: 6000,
    weather: 15000
  },
  minSensorConfidence: 65,
  readyScore: 75,
  manualScoreFloor: 45
};

export const DATA_REQUIREMENTS = [
  {
    feed: 'TOS / BAPLIE',
    cadence: 'Per vessel call + move updates',
    fields: ['container ID', 'ISO type', 'weight', 'bay-row-tier', 'sequence', 'priority', 'special handling']
  },
  {
    feed: 'Crane PLC read-only',
    cadence: '100-500 ms',
    fields: ['hoist height', 'trolley position', 'spreader state', 'twistlock state', 'load cell', 'move timestamps']
  },
  {
    feed: 'Vehicle / VMT telemetry',
    cadence: '1 s target',
    fields: ['vehicle ID', 'position', 'speed', 'lane', 'chassis type', 'assignment', 'loaded/empty']
  },
  {
    feed: 'Yard / quay readiness',
    cadence: '1-5 s',
    fields: ['lane occupancy', 'slot availability', 'blocked bays', 'pinning/twistlock exceptions', 'reefer readiness']
  },
  {
    feed: 'Weather / context',
    cadence: '5-15 s',
    fields: ['wind speed', 'gust', 'visibility', 'handling restrictions']
  }
];

export function tonnes(weightText) {
  if (typeof weightText === 'number') return weightText;
  const match = String(weightText).match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
