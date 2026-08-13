import { DEFAULT_THRESHOLDS, SCENARIO_IDS } from './contracts.js';

export const SYNTHETIC_CONTAINERS = [
  {
    id: 'TGHU-771205-3',
    shortId: 'TGHU 1205',
    iso: '20GP',
    sizeFt: 20,
    weightTonnes: 18.2,
    bay: '34-06-82',
    requiredChassis: '20 ft chassis',
    loadMoment: 'Low',
    dampingProfile: 'Light'
  },
  {
    id: 'CAXU-421934-7',
    shortId: 'CAXU 1934',
    iso: '40HC',
    sizeFt: 40,
    weightTonnes: 28.4,
    bay: '38-08-84',
    requiredChassis: '40 ft skeletal',
    loadMoment: 'High',
    dampingProfile: 'Heavy'
  },
  {
    id: 'PONU-553018-9',
    shortId: 'PONU 3018',
    iso: '40RF',
    sizeFt: 40,
    weightTonnes: 24.1,
    bay: '40-04-86',
    requiredChassis: '40 ft powered',
    loadMoment: 'Medium',
    dampingProfile: 'Reefer'
  },
  {
    id: 'MEDU-908442-1',
    shortId: 'MEDU 8442',
    iso: '45HC',
    sizeFt: 45,
    weightTonnes: 31,
    bay: '42-02-82',
    requiredChassis: '45 ft extendable',
    loadMoment: 'High',
    dampingProfile: 'Oversize'
  }
];

export const SYNTHETIC_VEHICLES = [
  {
    id: 'ITV-108',
    chassis: '20 ft chassis',
    compatibleIso: ['20GP'],
    position: { lane: 'Lane 2', slot: 'Slot B', distanceMeters: 0 },
    loaded: false
  },
  {
    id: 'ITV-115',
    chassis: '40 ft skeletal',
    compatibleIso: ['40HC', '40RF'],
    position: { lane: 'Lane 2', slot: 'Approach', distanceMeters: 42 },
    loaded: false
  },
  {
    id: 'ITV-122',
    chassis: '40 ft skeletal',
    compatibleIso: ['40HC', '40RF'],
    position: { lane: 'Lane 1', slot: 'Queue', distanceMeters: 78 },
    loaded: false
  },
  {
    id: 'ITV-130',
    chassis: '45 ft extendable',
    compatibleIso: ['45HC'],
    position: { lane: 'Buffer', slot: 'Standby', distanceMeters: 96 },
    loaded: false
  }
];

export const SYNTHETIC_MOVES = [
  {
    id: 'MOVE-44',
    sequence: 44,
    containerId: 'CAXU-421934-7',
    plannedVehicleId: 'ITV-122',
    fallbackVehicleIds: ['ITV-115', 'ITV-108'],
    operation: 'discharge',
    twinLift: false,
    priority: 1
  },
  {
    id: 'MOVE-45',
    sequence: 45,
    containerId: 'PONU-553018-9',
    plannedVehicleId: 'ITV-115',
    fallbackVehicleIds: ['ITV-122'],
    operation: 'discharge',
    twinLift: false,
    priority: 2
  },
  {
    id: 'MOVE-46',
    sequence: 46,
    containerId: 'TGHU-771205-3',
    plannedVehicleId: 'ITV-108',
    fallbackVehicleIds: ['ITV-115'],
    operation: 'discharge',
    twinLift: false,
    priority: 3
  },
  {
    id: 'MOVE-47',
    sequence: 47,
    containerId: 'MEDU-908442-1',
    plannedVehicleId: 'ITV-130',
    fallbackVehicleIds: [],
    operation: 'discharge',
    twinLift: false,
    priority: 4
  }
];

export const SCENARIO_PROFILES = {
  normal: {
    label: 'Normal',
    issue: 'No exception',
    idleGapSeconds: 10,
    description: 'All feeds are fresh and the planned 40HC truck can make the micro-slot.'
  },
  'late-truck': {
    label: 'Late truck',
    issue: 'Scheduled ITV-122 delayed by quay traffic',
    idleGapSeconds: 18,
    description: 'The planned truck is compatible but too late, so a compatible fallback is promoted.'
  },
  'vessel-dig': {
    label: 'Vessel dig',
    issue: 'Primary source bay blocked by restow/dig',
    idleGapSeconds: 24,
    description: 'The primary move is physically blocked; the system recommends a fallback or manual completion.'
  },
  'sensor-dropout': {
    label: 'Sensor dropout',
    issue: 'Positioning confidence below threshold',
    idleGapSeconds: 14,
    description: 'GPS/proximity confidence drops, so the system degrades to manual mode.'
  }
};

export function createSyntheticSnapshot({ scenarioId = 'normal', tick = 0 } = {}) {
  const scenario = SCENARIO_IDS.includes(scenarioId) ? scenarioId : 'normal';
  const cycle = tick % 36;
  const triggerProgress = cycle / 36;
  const hoistHeightMeters = Math.max(0.8, 9 - triggerProgress * 7.6);
  const triggered = hoistHeightMeters <= DEFAULT_THRESHOLDS.plcTriggerHoistMeters;
  const vehicles = createVehiclesForScenario(scenario, tick);
  const moveStatus = createMoveStatusForScenario(scenario);
  const feedFreshnessMs = createFeedFreshnessForScenario(scenario, tick);

  return {
    snapshotId: `${scenario}-${tick}`,
    timestamp: new Date(Date.UTC(2026, 4, 19, 8, 0, tick)).toISOString(),
    scenario: { id: scenario, ...SCENARIO_PROFILES[scenario] },
    feeds: {
      tos: { freshnessMs: feedFreshnessMs.tos, status: 'live', source: 'TOS/BAPLIE export' },
      plc: { freshnessMs: feedFreshnessMs.plc, status: 'read-only', source: 'OPC-UA / Modbus gateway' },
      gps: { freshnessMs: feedFreshnessMs.gps, status: scenario === 'sensor-dropout' ? 'degraded' : 'tracking', source: 'VMT/GPS telemetry' },
      yard: { freshnessMs: feedFreshnessMs.yard, status: scenario === 'vessel-dig' ? 'blocked bay reported' : 'ready', source: 'yard readiness feed' },
      weather: { freshnessMs: feedFreshnessMs.weather, status: 'stable', source: 'quay wind mast' }
    },
    crane: {
      id: 'STS-04',
      activeMoveId: 'MOVE-43',
      phase: triggered ? 'final_lowering' : 'trolley_travel',
      hoistHeightMeters,
      trolleyPosition: triggered ? 'landside handoff' : 'outbound',
      spreaderLocked: true,
      loadCellTonnes: 18.2,
      antiSwayMeters: triggered ? 0.18 : 0.42,
      triggerActive: triggered
    },
    moves: SYNTHETIC_MOVES.map((move) => ({
      ...move,
      status: moveStatus[move.id] || 'available'
    })),
    containers: SYNTHETIC_CONTAINERS,
    vehicles,
    yard: {
      targetSlot: 'Lane 2 / Slot B',
      slotAvailable: scenario !== 'sensor-dropout',
      blockedBays: scenario === 'vessel-dig' ? ['38-08-84'] : [],
      laneOccupancy: {
        'Lane 1': scenario === 'late-truck' ? 'traffic queue' : 'clear',
        'Lane 2': 'available',
        Buffer: 'available'
      }
    },
    weather: {
      windMetersPerSecond: 8 + (tick % 4),
      gustMetersPerSecond: 11 + (tick % 3),
      visibility: 'good',
      restriction: 'none'
    },
    sensors: {
      gpsConfidence: scenario === 'sensor-dropout' ? 48 : 96,
      slotCameraConfidence: scenario === 'sensor-dropout' ? 42 : 94,
      proximityConfidence: scenario === 'sensor-dropout' ? 51 : 97
    }
  };
}

function createVehiclesForScenario(scenario, tick) {
  const drift = Math.sin(tick / 4) * 0.8;
  const vehicles = SYNTHETIC_VEHICLES.map((vehicle) => ({ ...vehicle, position: { ...vehicle.position } }));
  const byId = Object.fromEntries(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  byId['ITV-108'].etaSeconds = scenario === 'sensor-dropout' ? 16 : 4;
  byId['ITV-108'].position.distanceMeters = 8 + drift;

  byId['ITV-115'].etaSeconds = scenario === 'late-truck' || scenario === 'vessel-dig' ? 8 : 15;
  byId['ITV-115'].position.distanceMeters = scenario === 'late-truck' ? 22 + drift : 42 + drift;

  byId['ITV-122'].etaSeconds = scenario === 'late-truck' ? 52 : 10;
  byId['ITV-122'].position.distanceMeters = scenario === 'late-truck' ? 180 : 36 + drift;

  byId['ITV-130'].etaSeconds = 27;
  return vehicles;
}

function createMoveStatusForScenario(scenario) {
  if (scenario === 'vessel-dig') {
    return {
      'MOVE-44': 'blocked_source_bay',
      'MOVE-45': 'available',
      'MOVE-46': 'available',
      'MOVE-47': 'available'
    };
  }
  return {
    'MOVE-44': 'available',
    'MOVE-45': 'available',
    'MOVE-46': 'available',
    'MOVE-47': 'available'
  };
}

function createFeedFreshnessForScenario(scenario, tick) {
  return {
    tos: scenario === 'vessel-dig' ? 4100 : 1500 + (tick % 4) * 100,
    plc: 120,
    gps: scenario === 'sensor-dropout' ? 8200 : 900,
    yard: scenario === 'vessel-dig' ? 1200 : 2600,
    weather: 5000
  };
}
