import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Cpu,
  Database,
  FastForward,
  Gauge,
  ListChecks,
  Pause,
  Play,
  RadioTower,
  RotateCcw,
  Route,
  ShieldCheck,
  Ship,
  Zap
} from 'lucide-react';
import PortScene from './PortScene.jsx';
import ImplementationLab from './ImplementationLab.jsx';
import { PHASES, SCENARIOS, resolveFrame } from './scenario.js';

const speedOptions = [0.5, 1, 2];

export default function App() {
  const [view, setView] = useState(() => (window.location.hash === '#implementation' ? 'implementation' : 'pitch'));
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0);
  const [phaseElapsedMs, setPhaseElapsedMs] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [scenarioId, setScenarioId] = useState('normal');
  const selectedPhaseRef = useRef(selectedPhaseIndex);
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);

  useEffect(() => {
    const onHashChange = () => setView(window.location.hash === '#implementation' ? 'implementation' : 'pitch');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    selectedPhaseRef.current = selectedPhaseIndex;
  }, [selectedPhaseIndex]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now) => {
      const delta = Math.min(now - last, 80);
      last = now;
      if (playingRef.current) {
        setPhaseElapsedMs((current) => {
          const duration = PHASES[selectedPhaseRef.current]?.durationMs || 1;
          return (current + delta * speedRef.current) % duration;
        });
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const phaseInfo = useMemo(() => {
    const phase = PHASES[selectedPhaseIndex];
    const localMs = ((phaseElapsedMs % phase.durationMs) + phase.durationMs) % phase.durationMs;
    return {
      index: selectedPhaseIndex,
      phase,
      localMs,
      progress: localMs / phase.durationMs
    };
  }, [phaseElapsedMs, selectedPhaseIndex]);

  const frame = useMemo(
    () => resolveFrame(phaseInfo.phase, phaseInfo.progress, scenarioId),
    [phaseInfo.phase, phaseInfo.progress, scenarioId]
  );

  const jumpToPhase = (index) => {
    const wrapped = (index + PHASES.length) % PHASES.length;
    setSelectedPhaseIndex(wrapped);
    setPhaseElapsedMs(0);
    setPlaying(true);
  };

  const restart = () => {
    setPhaseElapsedMs(0);
    setPlaying(true);
  };

  const switchView = (nextView) => {
    window.location.hash = nextView === 'implementation' ? 'implementation' : '';
    setView(nextView);
  };

  if (view === 'implementation') {
    return <ImplementationLab onBack={() => switchView('pitch')} />;
  }

  return (
    <main className={`app-shell focus-${frame.focusZone}`}>
      <PortScene frame={frame} />

      <header className="top-bar">
        <div className="brand-block">
          <div className="brand-mark">Z</div>
          <div>
            <div className="brand-title">
              ZERO<span>·</span>WAIT STS
            </div>
            <div className="brand-subtitle">Storyboard pitch simulator</div>
          </div>
        </div>

        <div className="top-status">
          <button type="button" className="view-switch" onClick={() => switchView('implementation')}>
            MVP console
          </button>
          <StatusChip icon={<Activity size={14} />} label="Mode" value={frame.systemMode} tone={modeTone(frame.systemMode)} />
          <StatusChip icon={<Gauge size={14} />} label="Idle saved" value={`${frame.metrics.idleSaved}s`} tone="green" />
          <StatusChip icon={<Zap size={14} />} label="Moves/hr" value={frame.metrics.movesHour} tone="cyan" />
        </div>
      </header>

      <section className="active-phase-panel">
        <div className="phase-kicker">
          Phase {String(phaseInfo.index + 1).padStart(2, '0')} / {String(PHASES.length).padStart(2, '0')} · {frame.zone}
        </div>
        <h1>{frame.title}</h1>
        <p>{frame.narration}</p>
        <div className="phase-bullets">
          {frame.bullets.map((bullet) => (
            <span key={bullet}>{bullet}</span>
          ))}
        </div>
        <div className="detail-chips">
          {frame.panelDetails.map((item) => (
            <DetailChip key={item.label} {...item} />
          ))}
        </div>
      </section>

      <FocusPanel frame={frame} />

      <aside className="storyboard-rail">
        <div className="rail-title">Phase storyboard</div>
        <div className="phase-card-list">
          {PHASES.map((phase, index) => (
            <button
              key={phase.phaseId}
              className={`phase-card ${index === phaseInfo.index ? 'active' : ''}`}
              type="button"
              onClick={() => jumpToPhase(index)}
            >
              <strong>{phase.short}</strong>
              <span>{phase.title}</span>
              <em>{phase.zone}</em>
              {index === phaseInfo.index ? <i style={{ width: `${phaseInfo.progress * 100}%` }} /> : null}
            </button>
          ))}
        </div>
      </aside>

      <section className="scenario-dock">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className={`scenario-btn ${scenarioId === scenario.id ? 'active' : ''}`}
            style={{ '--scenario-color': scenario.color }}
            onClick={() => setScenarioId(scenario.id)}
          >
            {scenario.label}
          </button>
        ))}
      </section>

      <section className="playback-dock">
        <button className="icon-btn" type="button" onClick={() => jumpToPhase(phaseInfo.index - 1)} aria-label="Previous phase">
          <ChevronLeft size={18} />
        </button>
        <button className="primary-control" type="button" onClick={() => setPlaying((value) => !value)}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button className="icon-btn" type="button" onClick={() => jumpToPhase(phaseInfo.index + 1)} aria-label="Next phase">
          <ChevronRight size={18} />
        </button>
        <button className="icon-btn" type="button" onClick={restart} aria-label="Restart current phase">
          <RotateCcw size={17} />
        </button>
        <div className="speed-group" aria-label="Playback speed">
          {speedOptions.map((option) => (
            <button key={option} type="button" className={speed === option ? 'active' : ''} onClick={() => setSpeed(option)}>
              {option}x
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function FocusPanel({ frame }) {
  if (frame.visiblePanel === 'feeds') {
    return (
      <aside className="focus-panel feed-panel">
        <PanelHeader icon={<RadioTower size={15} />} title="Feed matrix" badge="5 SOURCES" tone="cyan" />
        <FeedMatrix frame={frame} />
      </aside>
    );
  }

  if (frame.visiblePanel === 'plc') {
    return (
      <aside className="focus-panel plc-panel">
        <PanelHeader icon={<Cpu size={15} />} title="PLC signal stack" badge="TRIGGER" tone={frame.crane.locked ? 'green' : 'amber'} />
        <PlcSignalStack frame={frame} />
      </aside>
    );
  }

  if (frame.visiblePanel === 'ranking') {
    return (
      <aside className="focus-panel ranking-panel">
        <PanelHeader icon={<ListChecks size={15} />} title="Move ranking board" badge="COMPAT" tone="green" />
        <MoveRankingBoard frame={frame} />
      </aside>
    );
  }

  if (frame.visiblePanel === 'micro-slot') {
    return (
      <aside className="focus-panel lane-panel">
        <PanelHeader icon={<Route size={15} />} title="Micro-slot lane map" badge={frame.microSlot.centered ? 'CENTERED' : 'TARGETING'} tone={frame.microSlot.centered ? 'green' : 'cyan'} />
        <SensorList sensors={frame.sensorLabels} />
        <MiniLaneMap frame={frame} />
        <div className="panel-copy">
          <strong>{frame.routeDetails.primary}</strong>
          <span>{frame.routeDetails.fallback}</span>
        </div>
      </aside>
    );
  }

  if (frame.visiblePanel === 'zero-wait') {
    return (
      <aside className="focus-panel zero-panel">
        <PanelHeader icon={<FastForward size={15} />} title="Fast cycle strip" badge="NO GAP" tone="green" />
        <FastCycleStrip frame={frame} />
        <div className="panel-copy">
          <strong>{frame.routeDetails.primary}</strong>
          <span>{frame.routeDetails.fallback}</span>
        </div>
      </aside>
    );
  }

  if (['spreader', 'handoff'].includes(frame.visiblePanel)) {
    return (
      <aside className="focus-panel spreader-panel">
        <PanelHeader icon={<Camera size={15} />} title="Spreader camera" badge={frame.guidance.beep} tone={frame.guidance.locked ? 'green' : 'amber'} />
        <SpreaderCamera frame={frame} />
        <SensorList sensors={frame.sensorLabels} />
      </aside>
    );
  }

  if (frame.visiblePanel === 'safety') {
    return (
      <aside className="focus-panel safety-panel">
        <PanelHeader icon={<ShieldCheck size={15} />} title="Safety degradation" badge={frame.systemMode} tone={modeTone(frame.systemMode)} />
        <SafetyFallbackPanel frame={frame} />
      </aside>
    );
  }

  if (frame.visiblePanel === 'resequence') {
    return (
      <aside className="focus-panel compatibility-panel">
        <PanelHeader icon={<AlertTriangle size={15} />} title="Compatibility board" badge={frame.issueActive ? 'EXCEPTION' : 'READY'} tone={frame.issueActive ? 'amber' : 'cyan'} />
        <CompatibilityBoard frame={frame} />
      </aside>
    );
  }

  if (['engine', 'resequence', 'feedback', 'ranking'].includes(frame.visiblePanel)) {
    return (
      <aside className="focus-panel engine-panel">
        <PanelHeader icon={<Database size={15} />} title={frame.visiblePanel === 'ranking' ? 'Readiness ranking' : 'Coordination engine'} badge={frame.issueActive ? 'FALLBACK' : 'LIVE'} tone={frame.issueActive ? 'amber' : 'cyan'} />
        <EngineRows frame={frame} />
      </aside>
    );
  }

  return (
    <aside className="focus-panel crane-panel">
      <PanelHeader icon={<Ship size={15} />} title="Crane and vessel workflow" badge={frame.crane.locked ? 'LOCKED' : 'READY'} tone={frame.crane.locked ? 'green' : 'cyan'} />
      <CraneSequence frame={frame} />
    </aside>
  );
}

function FeedMatrix({ frame }) {
  return (
    <div className="feed-matrix">
      {frame.dataFeeds.map((feed) => (
        <div className="feed-row" key={feed.id} style={{ '--feed-color': feed.color }}>
          <i />
          <div>
            <strong>{feed.name}</strong>
            <span>{feed.origin}</span>
            <em>{feed.sample}</em>
          </div>
          <b>{feed.freshness}</b>
        </div>
      ))}
    </div>
  );
}

function PlcSignalStack({ frame }) {
  return (
    <div className="signal-stack">
      <div className="container-card" style={{ '--container-color': frame.activeContainer.color }}>
        <strong>{frame.activeContainer.id}</strong>
        <span>
          {frame.activeContainer.iso} · {frame.activeContainer.weight} · Bay {frame.activeContainer.bay}
        </span>
      </div>
      {frame.plcSignals.map((signal) => (
        <div className={`signal-row ${signal.state}`} key={signal.label}>
          <span>{signal.label}</span>
          <strong>{signal.value}</strong>
          <em>{signal.threshold}</em>
        </div>
      ))}
    </div>
  );
}

function MoveRankingBoard({ frame }) {
  return (
    <div className="ranking-board">
      {frame.moves.slice(0, 4).map((move) => (
        <div className={`move-card ${move.compatible ? 'compatible' : 'blocked'}`} key={move.id} style={{ '--container-color': move.container.color }}>
          <div>
            <strong>{move.id}</strong>
            <span>{move.container.id}</span>
          </div>
          <em>
            {move.container.iso} · {move.container.weight} · Bay {move.container.bay}
          </em>
          <b>
            {move.vehicleId} {move.compatible ? 'can carry' : 'blocked'}
          </b>
          <i>{move.score}</i>
        </div>
      ))}
    </div>
  );
}

function CompatibilityBoard({ frame }) {
  const scene = frame.exceptionScene;
  const cards = [
    { label: 'Scheduled first', item: scene.planned, tone: scene.active ? 'red' : 'amber' },
    { label: 'Rejected', item: scene.rejected, tone: 'red' },
    { label: 'Recommendation', item: scene.fallback, tone: 'green' }
  ];

  return (
    <div className="compat-board">
      <div className="container-card" style={{ '--container-color': scene.targetContainer.color }}>
        <strong>{scene.targetContainer.id}</strong>
        <span>
          {scene.targetContainer.iso} · needs {scene.targetContainer.requiredChassis}
        </span>
      </div>
      {cards.map((card) => (
        <div className={`compat-card ${card.tone}`} key={card.label}>
          <span>{card.label}</span>
          <strong>{card.item.vehicle.id}</strong>
          <em>{card.item.reason}</em>
          <b>{card.item.compatible ? 'Compatible' : 'Not compatible'}</b>
        </div>
      ))}
      <div className="operator-callout">{scene.operatorCallout}</div>
    </div>
  );
}

function FastCycleStrip({ frame }) {
  return (
    <div className="cycle-strip">
      {frame.zeroWaitCycles.map((cycle) => {
        const container = frame.containers.find((item) => item.id === cycle.containerId);
        return (
          <div className={`cycle-card ${cycle.active ? 'active' : ''} ${cycle.loaded ? 'complete' : ''}`} key={cycle.label} style={{ '--container-color': container?.color || '#38bdf8' }}>
            <div>
              <strong>{cycle.label}</strong>
              <span>{cycle.loaded ? 'loaded' : `T+${cycle.seconds}s`}</span>
            </div>
            <em>
              {container?.shortId} {'->'} {cycle.vehicleId} · {cycle.routeStage}
            </em>
            <i>
              <span style={{ width: `${Math.round(cycle.local * 100)}%` }} />
            </i>
          </div>
        );
      })}
    </div>
  );
}

function SensorList({ sensors }) {
  if (!sensors.length) return null;
  return (
    <div className="sensor-list">
      {sensors.map((sensor) => (
        <div key={sensor.id} style={{ '--sensor-color': sensor.color }}>
          <i />
          <span>{sensor.label}</span>
          <strong>{sensor.value}</strong>
        </div>
      ))}
    </div>
  );
}

function SafetyFallbackPanel({ frame }) {
  const manual = frame.scenario.id !== 'normal' || frame.systemMode.startsWith('Manual');
  return (
    <div className="safety-fallback">
      <ModeLadder active={frame.systemMode} />
      <div className={`manual-banner ${manual ? 'active' : ''}`}>
        {manual ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
        <strong>{manual ? 'Manual completion required' : 'Coordinated path available'}</strong>
        <span>
          {frame.scenario.id === 'sensor-dropout'
            ? 'Proximity confidence dropped below threshold.'
            : frame.scenario.id === 'vessel-dig'
              ? 'Source bay must be cleared by operator workflow.'
              : 'Fallback ladder is visible for the operator.'}
        </span>
      </div>
    </div>
  );
}

function MiniLaneMap({ frame }) {
  const laneY = { lane1: 46, lane2: 94, buffer: 142 };
  const mapX = (x) => 34 + ((x + 7) / 14) * 292;
  const truck = (item) => ({
    x: mapX(item.x),
    y: laneY[item.lane],
    tone: item.tone,
    id: item.id
  });
  const trucks = [truck(frame.trucks.itv108), truck(frame.trucks.itv115), truck(frame.trucks.itv122)];

  return (
    <svg className="lane-map" viewBox="0 0 360 184" role="img" aria-label="Lane map with micro-slot targets">
      <rect width="360" height="184" rx="10" fill="#07111f" />
      {[
        ['Lane 1', laneY.lane1],
        ['Lane 2', laneY.lane2],
        ['Buffer', laneY.buffer]
      ].map(([label, y]) => (
        <g key={label}>
          <line x1="22" x2="338" y1={y} y2={y} stroke="#fbbf24" strokeDasharray="10 8" opacity="0.34" />
          <text x="24" y={y - 12} fill="#94a3b8" fontSize="10" fontWeight="800">
            {label}
          </text>
        </g>
      ))}
      <TargetBox x={mapX(frame.microSlot.slotX)} y={laneY.lane2} color={frame.microSlot.centered ? '#4ade80' : '#38bdf8'} label="Slot B" />
      <TargetBox x={mapX(frame.microSlot.arrivalX)} y={laneY.lane2} color="#38bdf8" label="Arrival" small />
      <TargetBox x={mapX(frame.microSlot.fallbackX)} y={laneY.buffer} color={frame.issueActive ? '#4ade80' : '#fbbf24'} label="Fallback" small />
      <path d={`M ${mapX(-6.4)} ${laneY.lane2} L ${mapX(frame.microSlot.arrivalX)} ${laneY.lane2} L ${mapX(frame.microSlot.slotX)} ${laneY.lane2}`} fill="none" stroke={frame.microSlot.primaryBlocked ? '#f87171' : '#38bdf8'} strokeWidth="3" strokeDasharray="7 6" opacity={frame.microSlot.primaryBlocked ? '0.38' : '0.85'} />
      <path d={`M ${mapX(frame.microSlot.fallbackX)} ${laneY.buffer} L ${mapX(-1.25)} ${laneY.buffer} L ${mapX(frame.microSlot.slotX)} ${laneY.lane2}`} fill="none" stroke="#4ade80" strokeWidth="3" strokeDasharray="7 6" opacity={frame.issueActive ? '0.88' : '0.3'} />
      {trucks.map((item) => (
        <g key={item.id} transform={`translate(${item.x - 23}, ${item.y - 12})`}>
          <rect width="46" height="24" rx="4" fill={toneColor(item.tone)} opacity={item.tone === 'muted' ? '0.48' : '0.95'} />
          <rect x="4" y="4" width="11" height="16" rx="2" fill="#111827" opacity="0.5" />
          <text x="26" y="15" textAnchor="middle" fill="#06101f" fontSize="8" fontWeight="900">
            {item.id.replace('ITV-', '')}
          </text>
        </g>
      ))}
    </svg>
  );
}

function TargetBox({ x, y, color, label, small = false }) {
  const width = small ? 62 : 76;
  return (
    <g>
      <rect x={x - width / 2} y={y - 18} width={width} height="36" rx="5" fill="none" stroke={color} strokeWidth="2" strokeDasharray="5 4" />
      <text x={x} y={y + 31} textAnchor="middle" fill={color} fontSize="9" fontWeight="900">
        {label}
      </text>
    </g>
  );
}

function SpreaderCamera({ frame }) {
  const distance = frame.guidance.distance;
  const offset = frame.guidance.offset;
  const prox = frame.guidance.proximity;
  const filled = Math.round(prox * 16);
  const locked = frame.guidance.locked;
  const guideShift = Math.max(-18, Math.min(18, offset * 28));

  return (
    <>
      <svg className="spreader-camera" viewBox="0 0 420 260" role="img" aria-label="Spreader reverse parking guide">
        <defs>
          <radialGradient id="camVignetteStoryboard" cx="50%" cy="48%" r="72%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.7)" />
          </radialGradient>
        </defs>
        <rect width="420" height="260" fill="#101827" />
        <g opacity="0.32" stroke="#fbbf24" strokeWidth="3">
          <line x1="60" x2="60" y1="0" y2="260" />
          <line x1="360" x2="360" y1="0" y2="260" />
          {Array.from({ length: 6 }, (_, i) => (
            <line key={i} x1="210" x2="210" y1={i * 48 + 10} y2={i * 48 + 34} />
          ))}
        </g>
        <g transform={`translate(${guideShift},0)`}>
          <rect x="96" y="106" width="238" height="62" rx="4" fill="#3f4756" stroke="#111827" />
          <rect x="112" y="117" width="18" height="18" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
          <rect x="112" y="139" width="18" height="18" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
          <rect x="299" y="117" width="18" height="18" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
          <rect x="299" y="139" width="18" height="18" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
        </g>
        <path d="M 66 234 L 354 234 L 322 178 L 98 178 Z" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="6 5" />
        <path d="M 94 178 L 326 178 L 298 120 L 122 120 Z" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 5" />
        <path d="M 126 120 L 294 120 L 276 78 L 144 78 Z" fill="rgba(74,222,128,0.08)" stroke={locked ? '#4ade80' : '#38bdf8'} strokeWidth="3" />
        <rect
          x="132"
          y="88"
          width="156"
          height="112"
          rx="2"
          fill={locked ? 'rgba(74,222,128,0.14)' : 'rgba(239,68,68,0.14)'}
          stroke={locked ? '#4ade80' : '#ef4444'}
          strokeWidth="2"
          strokeDasharray={locked ? '0' : '8 6'}
        />
        <g stroke="#38bdf8" strokeWidth="1.5" opacity="0.8">
          <line x1="188" y1="144" x2="232" y2="144" />
          <line x1="210" y1="122" x2="210" y2="166" />
          <circle cx="210" cy="144" r="8" fill="none" />
        </g>
        <text x="210" y="38" textAnchor="middle" fill={distance < 1 ? '#f87171' : distance < 4 ? '#fbbf24' : '#4ade80'} fontSize="24" fontWeight="800">
          {distance.toFixed(1)} m
        </text>
        <text x="210" y="56" textAnchor="middle" fill="#94a3b8" fontSize="10" letterSpacing="3">
          DISTANCE TO CONTACT
        </text>
        <text x="210" y="242" textAnchor="middle" fill={locked ? '#4ade80' : '#fbbf24'} fontSize="14" fontWeight="800" letterSpacing="3">
          {locked ? 'CONTACT · LOCKED' : `ALIGNING · X+${offset.toFixed(2)}m`}
        </text>
        <rect width="420" height="260" fill="url(#camVignetteStoryboard)" />
      </svg>
      <div className="prox-row">
        <div className="prox-bar">
          {Array.from({ length: 16 }, (_, index) => (
            <span key={index} className={index < filled ? (index > 13 ? 'red' : index > 8 ? 'amber' : 'green') : ''} />
          ))}
        </div>
        <div className={`beep ${frame.guidance.beep !== 'IDLE' ? 'active' : ''} ${locked ? 'locked' : ''}`}>
          <i />
          <strong>{frame.guidance.beep}</strong>
        </div>
      </div>
    </>
  );
}

function EngineRows({ frame }) {
  return (
    <div className="engine-rows">
      {frame.panelDetails.map((item) => (
        <div className="engine-row" key={item.label}>
          <span>{item.label}</span>
          <strong className={item.tone}>{item.value}</strong>
        </div>
      ))}
      <div className="panel-copy">
        <strong>{frame.routeDetails.primary}</strong>
        <span>{frame.routeDetails.fallback}</span>
      </div>
    </div>
  );
}

function CraneSequence({ frame }) {
  const craneFlowActive = ['plc-trigger', 'look-ahead', 'micro-slot', 'spreader-guidance', 'handoff', 'zero-wait'].includes(frame.phaseId);
  const steps = [
    ['Approach source', frame.phaseId === 'plc-trigger' || (craneFlowActive && frame.crane.locked)],
    ['Lock spreader', craneFlowActive && frame.crane.locked],
    ['Hoist clear', craneFlowActive && frame.crane.carried && frame.crane.hoistY > 2.6],
    ['Travel landside', craneFlowActive && frame.crane.trolleyZ < 0.4],
    ['Release to ITV', craneFlowActive && frame.crane.containerOnTruck]
  ];

  return (
    <div className="sequence-list">
      {steps.map(([label, done]) => (
        <div key={label} className={done ? 'done' : ''}>
          <span />
          <strong>{label}</strong>
        </div>
      ))}
    </div>
  );
}

function ModeLadder({ active }) {
  const modes = ['Coordinated', 'Recommendation', 'Manual available'];
  return (
    <div className="mode-ladder">
      {modes.map((mode, index) => {
        const current = active.startsWith(mode.split(' ')[0]);
        return (
          <div key={mode} className={current ? 'active' : ''}>
            <span>{index + 1}</span>
            <strong>{mode}</strong>
            <em>{index === 0 ? 'Full predictive sync' : index === 1 ? 'Guidance only' : 'Operator controls operation'}</em>
          </div>
        );
      })}
    </div>
  );
}

function DetailChip({ label, value, tone }) {
  return (
    <div className={`detail-chip ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PanelHeader({ icon, title, badge, tone }) {
  return (
    <div className="panel-header">
      <div>
        {icon}
        <span>{title}</span>
      </div>
      <b className={tone}>{badge}</b>
    </div>
  );
}

function StatusChip({ icon, label, value, tone }) {
  return (
    <div className={`status-chip ${tone}`}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function toneColor(tone) {
  return tone === 'green' ? '#4ade80' : tone === 'red' ? '#f87171' : tone === 'amber' ? '#fbbf24' : tone === 'muted' ? '#64748b' : '#38bdf8';
}

function modeTone(mode) {
  if (mode.startsWith('Manual')) return 'red';
  if (mode.startsWith('Recommendation')) return 'amber';
  return 'green';
}
