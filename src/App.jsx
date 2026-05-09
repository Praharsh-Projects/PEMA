import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Camera,
  ChevronLeft,
  ChevronRight,
  Database,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Route,
  ShieldCheck,
  Ship,
  Zap
} from 'lucide-react';
import PortScene from './PortScene.jsx';
import { PHASES, SCENARIOS, getElapsedForPhase, getPhaseByElapsed, resolveFrame } from './scenario.js';

const speedOptions = [0.5, 1, 2];

export default function App() {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [scenarioId, setScenarioId] = useState('normal');
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);

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
        setElapsed((current) => current + delta * speedRef.current);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const phaseInfo = useMemo(() => getPhaseByElapsed(elapsed), [elapsed]);
  const frame = useMemo(
    () => resolveFrame(phaseInfo.phase, phaseInfo.progress, scenarioId),
    [phaseInfo.phase, phaseInfo.progress, scenarioId]
  );

  const jumpToPhase = (index) => {
    const wrapped = (index + PHASES.length) % PHASES.length;
    setElapsed(getElapsedForPhase(wrapped));
  };

  const restart = () => {
    setElapsed(0);
    setPlaying(true);
  };

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
              className={`phase-card ${index === phaseInfo.index ? 'active' : ''} ${index < phaseInfo.index ? 'done' : ''}`}
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
        <button className="icon-btn" type="button" onClick={restart} aria-label="Restart simulation">
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
  if (['micro-slot', 'zero-wait'].includes(frame.visiblePanel)) {
    return (
      <aside className="focus-panel lane-panel">
        <PanelHeader icon={<Route size={15} />} title="Micro-slot lane map" badge={frame.microSlot.centered ? 'CENTERED' : 'TARGETING'} tone={frame.microSlot.centered ? 'green' : 'cyan'} />
        <MiniLaneMap frame={frame} />
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
      </aside>
    );
  }

  if (frame.visiblePanel === 'safety') {
    return (
      <aside className="focus-panel safety-panel">
        <PanelHeader icon={<ShieldCheck size={15} />} title="Safety degradation" badge={frame.systemMode} tone={modeTone(frame.systemMode)} />
        <ModeLadder active={frame.systemMode} />
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
  const steps = [
    ['Approach source', frame.phaseId === 'plc-trigger' || frame.crane.locked],
    ['Lock spreader', frame.crane.locked],
    ['Hoist clear', frame.crane.carried && frame.crane.hoistY > 2.6],
    ['Travel landside', frame.crane.trolleyZ < 0.4],
    ['Release to ITV', frame.crane.containerOnTruck]
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
