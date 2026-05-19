import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowLeft, CheckCircle2, Database, Gauge, Play, Pause, RadioTower, Route, ShieldCheck } from 'lucide-react';
import { DATA_REQUIREMENTS, SAFETY_MODES } from './core/contracts.js';
import { evaluateSnapshot, runReplay } from './core/decisionEngine.js';
import { createSyntheticSnapshot, SCENARIO_PROFILES } from './core/synthetic.js';

const scenarioIds = Object.keys(SCENARIO_PROFILES);

export default function ImplementationLab({ onBack }) {
  const [scenarioId, setScenarioId] = useState('normal');
  const [tick, setTick] = useState(30);
  const [running, setRunning] = useState(true);
  const snapshot = useMemo(() => createSyntheticSnapshot({ scenarioId, tick }), [scenarioId, tick]);
  const evaluation = useMemo(() => evaluateSnapshot(snapshot), [snapshot]);
  const replay = useMemo(() => {
    const snapshots = Array.from({ length: 36 }, (_, index) => createSyntheticSnapshot({ scenarioId, tick: index }));
    return runReplay(snapshots);
  }, [scenarioId]);

  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => setTick((value) => (value + 1) % 72), 650);
    return () => window.clearInterval(id);
  }, [running]);

  return (
    <main className="lab-shell">
      <header className="lab-header">
        <button type="button" className="lab-back" onClick={onBack}>
          <ArrowLeft size={17} />
          Pitch simulator
        </button>
        <div>
          <span>ZERO-WAIT STS</span>
          <h1>Implementation MVP Console</h1>
        </div>
        <button type="button" className="lab-run" onClick={() => setRunning((value) => !value)}>
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? 'Pause replay' : 'Run replay'}
        </button>
      </header>

      <section className="lab-hero">
        <div>
          <span className="lab-kicker">Synthetic-only advisory engine</span>
          <h2>{evaluation.advisory.headline}</h2>
          <p>{evaluation.advisory.message}</p>
        </div>
        <div className={`lab-mode ${modeClass(evaluation.safetyMode)}`}>
          <ShieldCheck size={20} />
          <span>Safety mode</span>
          <strong>{evaluation.safetyMode}</strong>
        </div>
      </section>

      <section className="lab-scenarios" aria-label="Synthetic scenarios">
        {scenarioIds.map((id) => (
          <button key={id} type="button" className={scenarioId === id ? 'active' : ''} onClick={() => setScenarioId(id)}>
            <strong>{SCENARIO_PROFILES[id].label}</strong>
            <span>{SCENARIO_PROFILES[id].issue}</span>
          </button>
        ))}
      </section>

      <section className="lab-grid">
        <LabPanel icon={<RadioTower size={16} />} title="Data Feeds" badge={`${healthyFeedCount(evaluation)}/5 healthy`}>
          <div className="lab-feed-list">
            {Object.entries(evaluation.feedHealth).map(([key, feed]) => (
              <div key={key} className={feed.healthy ? 'healthy' : 'stale'}>
                <span>{key.toUpperCase()}</span>
                <strong>{feed.freshnessMs} ms</strong>
                <em>{feed.source}</em>
              </div>
            ))}
          </div>
        </LabPanel>

        <LabPanel icon={<Activity size={16} />} title="PLC Trigger" badge={evaluation.plcTrigger ? 'armed' : 'watching'}>
          <div className="lab-signal-stack">
            <Signal label="Hoist height" value={`${snapshot.crane.hoistHeightMeters.toFixed(1)} m`} good={evaluation.plcTrigger} />
            <Signal label="Spreader" value={snapshot.crane.spreaderLocked ? 'locked' : 'open'} good={snapshot.crane.spreaderLocked} />
            <Signal label="Load cell" value={`${snapshot.crane.loadCellTonnes} t`} good={snapshot.crane.loadCellTonnes > 2} />
            <Signal label="Anti-sway" value={`${snapshot.crane.antiSwayMeters.toFixed(2)} m`} good={snapshot.crane.antiSwayMeters < 0.3} />
          </div>
        </LabPanel>

        <LabPanel icon={<Database size={16} />} title="Look-Ahead Ranking" badge={`${evaluation.candidates.length} moves`}>
          <div className="lab-ranking">
            {evaluation.candidates.map((candidate) => (
              <div key={candidate.move.id} className={candidate.ready ? 'ready' : 'blocked'}>
                <b>{candidate.move.id}</b>
                <strong>{candidate.container.shortId}</strong>
                <span>
                  {candidate.container.iso} {'->'} {candidate.vehicle?.id || 'none'}
                </span>
                <i>{candidate.score}</i>
              </div>
            ))}
          </div>
        </LabPanel>

        <LabPanel icon={<Route size={16} />} title="Micro-Slot / VMT Advisory" badge={evaluation.microSlot?.slot || 'hold'}>
          {evaluation.microSlot ? (
            <div className="lab-vmt">
              <strong>{evaluation.microSlot.instruction}</strong>
              <span>ETA {evaluation.microSlot.etaSeconds}s</span>
              <span>{evaluation.microSlot.arrivalWindow}</span>
              <div className={evaluation.microSlot.centered ? 'centered' : ''}>{evaluation.microSlot.centered ? 'Inside arrival window' : 'Adjust speed'}</div>
            </div>
          ) : (
            <div className="lab-vmt hold">Hold. No executable recommendation.</div>
          )}
        </LabPanel>

        <LabPanel icon={<Gauge size={16} />} title="Replay KPIs" badge={`${replay.summary.events} events`}>
          <div className="lab-kpis">
            <Metric label="Recovered idle" value={`${replay.summary.recoveredIdleSeconds}s`} />
            <Metric label="Moves/hour" value={replay.summary.effectiveMovesPerHour} />
            <Metric label="Fallbacks" value={replay.summary.fallbackEvents} />
            <Metric label="Manual events" value={replay.summary.manualEvents} />
          </div>
        </LabPanel>

        <LabPanel icon={<AlertTriangle size={16} />} title="Synthetic Boundary" badge="prototype">
          <div className="lab-boundary">
            <strong>Complete without port data</strong>
            <span>Contracts, synthetic feeds, advisory engine, replay KPIs, HMI, and demo visualization.</span>
            <strong>Still needs real terminal access</strong>
            <span>PLC latency, TOS integration, GPS calibration, operator acceptance, safety approval, and real ROI proof.</span>
          </div>
        </LabPanel>
      </section>

      <section className="lab-bottom-grid">
        <LabPanel icon={<Database size={16} />} title="Canonical Data Contracts" badge="inputs">
          <div className="lab-requirements">
            {DATA_REQUIREMENTS.map((item) => (
              <div key={item.feed}>
                <strong>{item.feed}</strong>
                <span>{item.cadence}</span>
                <em>{item.fields.join(', ')}</em>
              </div>
            ))}
          </div>
        </LabPanel>

        <LabPanel icon={<CheckCircle2 size={16} />} title="Black-Box Event Log" badge={`${evaluation.metrics.decisionLatencyMs.toFixed(1)} ms`}>
          <pre className="lab-log">{JSON.stringify(evaluation.eventLog, null, 2)}</pre>
        </LabPanel>
      </section>
    </main>
  );
}

function LabPanel({ icon, title, badge, children }) {
  return (
    <article className="lab-panel">
      <header>
        <div>
          {icon}
          <strong>{title}</strong>
        </div>
        <span>{badge}</span>
      </header>
      {children}
    </article>
  );
}

function Signal({ label, value, good }) {
  return (
    <div className={good ? 'good' : 'watch'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function healthyFeedCount(evaluation) {
  return Object.values(evaluation.feedHealth).filter((feed) => feed.healthy).length;
}

function modeClass(mode) {
  if (mode === SAFETY_MODES.MANUAL) return 'manual';
  if (mode === SAFETY_MODES.RECOMMENDATION) return 'recommendation';
  return 'coordinated';
}
