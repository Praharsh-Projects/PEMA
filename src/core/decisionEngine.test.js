import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SAFETY_MODES } from './contracts.js';
import { evaluateSnapshot } from './decisionEngine.js';
import { createSyntheticSnapshot } from './synthetic.js';

describe('ZERO-WAIT advisory engine', () => {
  it('selects the planned move when the assigned truck is compatible and on time', () => {
    const snapshot = createSyntheticSnapshot({ scenarioId: 'normal', tick: 30 });
    const result = evaluateSnapshot(snapshot);

    assert.equal(result.selected.move.id, 'MOVE-44');
    assert.equal(result.selected.vehicle.id, 'ITV-122');
    assert.equal(result.selected.ready, true);
    assert.equal(result.metrics.fallbackActivated, false);
  });

  it('promotes a compatible fallback vehicle when the scheduled truck is late', () => {
    const snapshot = createSyntheticSnapshot({ scenarioId: 'late-truck', tick: 30 });
    const result = evaluateSnapshot(snapshot);

    assert.equal(result.selected.move.id, 'MOVE-44');
    assert.equal(result.selected.vehicle.id, 'ITV-115');
    assert.equal(result.metrics.fallbackActivated, true);
    assert.ok(result.selected.reasons.some((reason) => reason.includes('ITV-115 chassis matches')));
  });

  it('does not assign a 40 ft container to a 20 ft chassis', () => {
    const snapshot = createSyntheticSnapshot({ scenarioId: 'late-truck', tick: 30 });
    const result = evaluateSnapshot(snapshot);
    const selectedVehicleIds = result.selected.vehicleOptions.map((option) => option.vehicle.id);
    const rejected = result.selected.vehicleOptions.find((option) => option.vehicle.id === 'ITV-108');

    assert.ok(selectedVehicleIds.includes('ITV-108'));
    assert.equal(rejected.compatible, false);
    assert.ok(rejected.reasons.some((reason) => reason.includes('cannot carry')));
  });

  it('skips a blocked vessel bay and selects the next executable move', () => {
    const snapshot = createSyntheticSnapshot({ scenarioId: 'vessel-dig', tick: 30 });
    const result = evaluateSnapshot(snapshot);

    assert.equal(result.planned.move.id, 'MOVE-44');
    assert.equal(result.planned.ready, false);
    assert.equal(result.selected.move.id, 'MOVE-45');
    assert.equal(result.selected.vehicle.id, 'ITV-115');
  });

  it('degrades to manual mode on sensor dropout', () => {
    const snapshot = createSyntheticSnapshot({ scenarioId: 'sensor-dropout', tick: 30 });
    const result = evaluateSnapshot(snapshot);

    assert.equal(result.safetyMode, SAFETY_MODES.MANUAL);
    assert.equal(result.advisory.headline, 'Manual completion required');
  });

  it('keeps decision evaluation below the 200 ms target under replay load', () => {
    const started = performance.now();
    for (let i = 0; i < 1000; i += 1) {
      evaluateSnapshot(createSyntheticSnapshot({ scenarioId: i % 2 ? 'normal' : 'late-truck', tick: i }));
    }
    const averageMs = (performance.now() - started) / 1000;

    assert.ok(averageMs < 2, `expected average evaluation below 2 ms, got ${averageMs}`);
  });
});
