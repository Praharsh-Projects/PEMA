import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { LANES, WORLD } from './scenario.js';

const toneColors = {
  cyan: '#38bdf8',
  green: '#4ade80',
  amber: '#fbbf24',
  red: '#f87171',
  muted: '#94a3b8'
};

export default function PortScene({ frame }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.55]}
      camera={{ position: [6.6, 5.3, 6.5], fov: 42, near: 0.1, far: 120 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#06101d']} />
      <fog attach="fog" args={['#06101d', 20, 44]} />
      <ambientLight intensity={0.75} />
      <directionalLight
        castShadow
        position={[6, 12, 5]}
        intensity={2.35}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[0, 5.5, WORLD.source.z]} color="#fbbf24" intensity={2.4} distance={8} />
      <pointLight position={[WORLD.slot.x, 3.5, WORLD.slot.z]} color="#38bdf8" intensity={2.8} distance={8} />
      <CameraRig pose={frame.cameraPose} />
      <PortWorld frame={frame} />
      <ContactShadows position={[0, 0.03, 0]} scale={18} blur={2.2} opacity={0.45} />
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
    </Canvas>
  );
}

function CameraRig({ pose }) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(...pose.target));
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    desiredPosition.set(...pose.position);
    desiredTarget.set(...pose.target);
    const alpha = 1 - Math.exp(-delta * 2.75);
    camera.position.lerp(desiredPosition, alpha);
    camera.fov += (pose.fov - camera.fov) * alpha;
    camera.updateProjectionMatrix();
    targetRef.current.lerp(desiredTarget, alpha);
    camera.lookAt(targetRef.current);
  });

  return null;
}

function PortWorld({ frame }) {
  return (
    <group>
      <GroundAndLanes frame={frame} />
      <Ship sourceContainer={frame.sourceContainer} />
      <ContainerYard />
      <STS crane={frame.crane} guidance={frame.guidance} focusZone={frame.focusZone} />
      <Truck {...frame.trucks.itv108} color="#eab308" accent="#38bdf8" />
      <Truck {...frame.trucks.itv115} color="#facc15" accent={toneColors[frame.trucks.itv115.tone] || '#fbbf24'} />
      <Truck {...frame.trucks.itv122} color="#64748b" accent={toneColors[frame.trucks.itv122.tone] || '#94a3b8'} />
      <DataFeedNetwork frame={frame} />
      <SafetyModeTower frame={frame} />
    </group>
  );
}

function GroundAndLanes({ frame }) {
  const micro = frame.microSlot;
  const slotColor = micro.centered ? '#4ade80' : '#38bdf8';
  const routeColor = micro.primaryBlocked ? '#f87171' : '#38bdf8';
  const fallbackColor = frame.issueActive ? '#4ade80' : '#fbbf24';

  return (
    <group>
      <Block position={[0, -0.05, -2.05]} args={[15.5, 0.1, 4.85]} color="#202838" receiveOnly />
      <Block position={[0, -0.08, 2.55]} args={[15.5, 0.08, 3.7]} color="#071827" receiveOnly />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 2.55]} receiveShadow>
        <planeGeometry args={[15.5, 3.7, 24, 10]} />
        <meshStandardMaterial color="#0b2238" roughness={0.64} metalness={0.08} />
      </mesh>
      <Line points={[[-7.55, 0.05, 0.28], [7.55, 0.05, 0.28]]} color="#fbbf24" lineWidth={1.5} transparent opacity={0.52} />

      {Object.values(LANES).map((lane) => (
        <group key={lane.id}>
          <Line points={[[-7.4, 0.07, lane.z], [7.4, 0.07, lane.z]]} color="#fbbf24" lineWidth={1} dashed dashSize={0.35} gapSize={0.22} transparent opacity={lane.id === 'buffer' ? 0.28 : 0.42} />
          <HtmlLabel position={[-7.3, 0.14, lane.z - 0.34]} className="scene-label muted">
            {lane.label}
          </HtmlLabel>
        </group>
      ))}

      <SlotBox x={WORLD.slot.x} z={WORLD.slot.z} color={slotColor} label="STS handoff · Slot B" active={micro.active} />
      <SlotBox x={WORLD.arrivalWindow.x} z={WORLD.arrivalWindow.z} color="#38bdf8" label="Arrival window" active={micro.active} small />
      <SlotBox x={WORLD.fallbackWindow.x} z={WORLD.fallbackWindow.z} color={fallbackColor} label="Fallback buffer" active={micro.active || frame.issueActive} small />

      {micro.active ? (
        <>
          <RouteLine
            points={[
              [-6.4, 0.16, WORLD.arrivalWindow.z],
              [WORLD.arrivalWindow.x, 0.16, WORLD.arrivalWindow.z],
              [WORLD.slot.x, 0.16, WORLD.slot.z]
            ]}
            color={routeColor}
            opacity={micro.primaryBlocked ? 0.3 : 0.75}
          />
          <RouteLine
            points={[
              [WORLD.fallbackWindow.x, 0.18, WORLD.fallbackWindow.z],
              [-1.25, 0.18, WORLD.fallbackWindow.z],
              [WORLD.slot.x, 0.18, WORLD.slot.z]
            ]}
            color={fallbackColor}
            opacity={frame.issueActive ? 0.85 : 0.32}
          />
          <HtmlLabel position={[WORLD.arrivalWindow.x, 0.5, WORLD.arrivalWindow.z - 0.6]} className={micro.centered ? 'slot-label locked' : 'slot-label'}>
            ETA {micro.etaSeconds}s · Lane 2
          </HtmlLabel>
        </>
      ) : null}
    </group>
  );
}

function SlotBox({ x, z, color, label, active, small = false }) {
  const halfX = small ? 0.85 : 1.15;
  const halfZ = 0.42;
  return (
    <group>
      <Line
        points={[
          [x - halfX, 0.11, z - halfZ],
          [x + halfX, 0.11, z - halfZ],
          [x + halfX, 0.11, z + halfZ],
          [x - halfX, 0.11, z + halfZ],
          [x - halfX, 0.11, z - halfZ]
        ]}
        color={color}
        lineWidth={active ? 3 : 1.5}
        dashed
        dashSize={0.12}
        gapSize={0.08}
        transparent
        opacity={active ? 0.88 : 0.32}
      />
      <HtmlLabel position={[x, 0.18, z + 0.55]} className="slot-label">
        {label}
      </HtmlLabel>
    </group>
  );
}

function Ship({ sourceContainer }) {
  const deckContainers = useMemo(() => {
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
    const items = [];
    for (let x = -3; x <= 3; x += 1) {
      for (let z = 0; z < 2; z += 1) {
        for (let level = 0; level < 2 + ((x + z + 5) % 2); level += 1) {
          if (x === 0 && z === 0 && level === 2) continue;
          items.push({
            key: `${x}-${z}-${level}`,
            position: [x * 0.92, 0.74 + level * 0.56, 2.05 + z * 0.72],
            color: colors[(x + z + level + 10) % colors.length]
          });
        }
      }
    }
    return items;
  }, []);

  return (
    <group>
      <Block position={[0, 0.44, 2.65]} args={[8.5, 0.88, 2.65]} color="#162235" metalness={0.2} />
      <Block position={[3.72, 1.22, 2.65]} args={[0.72, 1.36, 1.95]} color="#26364d" metalness={0.2} />
      <Block position={[3.72, 2.0, 2.65]} args={[0.56, 0.08, 1.48]} color="#fde047" emissive="#fde047" emissiveIntensity={0.14} />
      <Line points={[[-4.2, 0.95, 1.05], [4.2, 0.95, 1.05]]} color="#dc2626" lineWidth={1.5} transparent opacity={0.65} />
      {deckContainers.map((item) => (
        <Container3D key={item.key} position={item.position} color={item.color} scale={[0.82, 0.82, 0.82]} />
      ))}
      {sourceContainer.visible ? (
        <group>
          <Container3D position={[WORLD.source.x, WORLD.source.y, WORLD.source.z]} color="#ef4444" scale={[0.88, 0.88, 0.88]} />
          <Line
            points={[
              [-0.86, 2.08, WORLD.source.z - 0.4],
              [0.86, 2.08, WORLD.source.z - 0.4],
              [0.86, 2.08, WORLD.source.z + 0.4],
              [-0.86, 2.08, WORLD.source.z + 0.4],
              [-0.86, 2.08, WORLD.source.z - 0.4]
            ]}
            color={sourceContainer.locked ? '#4ade80' : '#fbbf24'}
            lineWidth={2.2}
            dashed
            dashSize={0.1}
            gapSize={0.08}
          />
          <HtmlLabel position={[WORLD.source.x, 2.4, WORLD.source.z + 0.7]} className="slot-label">
            Source bay · vessel
          </HtmlLabel>
        </group>
      ) : (
        <HtmlLabel position={[WORLD.source.x, 2.25, WORLD.source.z + 0.7]} className="slot-label locked">
          Picked from vessel bay
        </HtmlLabel>
      )}
      <HtmlLabel position={[0, 0.96, 3.95]} className="scene-label muted">
        MV Nordic Peak · vessel side
      </HtmlLabel>
    </group>
  );
}

function ContainerYard() {
  const stacks = useMemo(() => {
    const colors = ['#2563eb', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
    const items = [];
    for (let col = 0; col < 4; col += 1) {
      for (let level = 0; level < 3; level += 1) {
        items.push({
          key: `${col}-${level}`,
          position: [4.8 + col * 0.86, 0.36 + level * 0.58, -3.65],
          color: colors[(col + level) % colors.length]
        });
      }
    }
    return items;
  }, []);

  return (
    <group>
      {stacks.map((item) => (
        <Container3D key={item.key} position={item.position} color={item.color} scale={[0.78, 0.78, 0.78]} dimmed />
      ))}
      <HtmlLabel position={[5.9, 2.35, -3.65]} className="scene-label muted">
        Yard stacks
      </HtmlLabel>
    </group>
  );
}

function STS({ crane, guidance, focusZone }) {
  const { trolleyX, trolleyZ, hoistY } = crane;
  const structureOpacity = focusZone === 'slot' ? 0.46 : 1;
  const cableOffsets = [
    [-0.52, -0.23],
    [0.52, -0.23],
    [-0.52, 0.23],
    [0.52, 0.23]
  ];

  return (
    <group>
      {[-3.85, 3.85].map((x) =>
        [-3.75, 0.55].map((z) => (
          <group key={`${x}-${z}`}>
            <Block position={[x, 2.55, z]} args={[0.24, 5.1, 0.28]} color="#dc2626" metalness={0.25} opacity={structureOpacity} />
            <Block position={[x, 0.12, z]} args={[0.84, 0.24, 0.72]} color="#7f1d1d" metalness={0.35} opacity={structureOpacity} />
          </group>
        ))
      )}
      <Block position={[0, 5.22, -1.6]} args={[8.35, 0.24, 0.28]} color="#b91c1c" metalness={0.32} opacity={structureOpacity} />
      <Block position={[0, 5.22, 1.65]} args={[8.35, 0.24, 0.28]} color="#b91c1c" metalness={0.32} opacity={structureOpacity} />
      <Block position={[0, 5.26, -0.55]} args={[0.34, 0.28, 7.35]} color="#b91c1c" metalness={0.32} opacity={structureOpacity} />
      <Block position={[0, 5.58, -0.8]} args={[1.2, 0.58, 0.72]} color="#7f1d1d" metalness={0.3} opacity={structureOpacity} />
      <Line points={[[-3.85, 5.05, 0.55], [0, 6.05, -0.8], [3.85, 5.05, 0.55]]} color="#dc2626" lineWidth={2} transparent opacity={structureOpacity} />
      <OperatorCabin />

      <group position={[trolleyX, 5.03, trolleyZ]}>
        <Block position={[0, 0, 0]} args={[1.08, 0.34, 0.76]} color="#1f2937" metalness={0.42} />
        <Block position={[0, 0.1, 0]} args={[0.88, 0.06, 0.7]} color="#fde047" emissive="#f59e0b" emissiveIntensity={0.18} />
        <Wheel position={[-0.42, 0.18, -0.41]} radius={0.08} />
        <Wheel position={[0.42, 0.18, -0.41]} radius={0.08} />
        <Wheel position={[-0.42, 0.18, 0.41]} radius={0.08} />
        <Wheel position={[0.42, 0.18, 0.41]} radius={0.08} />
      </group>

      {cableOffsets.map(([x, z]) => (
        <Line key={`${x}-${z}`} points={[[trolleyX + x, 4.9, trolleyZ + z], [trolleyX + x, hoistY + 0.14, trolleyZ + z]]} color="#cbd5e1" lineWidth={1.1} />
      ))}

      <group position={[trolleyX, hoistY, trolleyZ]}>
        <Spreader locked={crane.locked || guidance.locked} />
        {crane.carried ? <Container3D position={[0, -0.5, 0]} color="#ef4444" scale={[0.9, 0.9, 0.9]} /> : null}
      </group>

      {guidance.active ? (
        <mesh position={[trolleyX, Math.max(0.68, hoistY / 2), trolleyZ]} transparent>
          <coneGeometry args={[1.15, Math.max(0.45, hoistY - 0.2), 4, 1, true]} />
          <meshBasicMaterial color={guidance.locked ? '#4ade80' : '#38bdf8'} transparent opacity={0.13} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
    </group>
  );
}

function OperatorCabin() {
  return (
    <group position={[-3.2, 4.56, -0.05]}>
      <Block position={[0, 0, 0]} args={[0.72, 0.48, 0.52]} color="#193049" metalness={0.1} />
      <Block position={[0, 0.03, -0.28]} args={[0.58, 0.28, 0.04]} color="#fde047" emissive="#fde047" emissiveIntensity={0.12} opacity={0.48} />
      <HumanFigure position={[0, -0.1, -0.18]} scale={0.42} color="#07111f" />
      <HtmlLabel position={[0, 0.58, -0.35]} className="scene-label">
        Operator cabin
      </HtmlLabel>
    </group>
  );
}

function Spreader({ locked }) {
  const sensorColor = locked ? '#4ade80' : '#38bdf8';
  return (
    <group>
      <Block position={[0, 0, 0]} args={[1.82, 0.18, 0.5]} color="#fbbf24" metalness={0.38} />
      <Block position={[-1.0, -0.02, 0]} args={[0.16, 0.3, 0.52]} color="#78350f" metalness={0.3} />
      <Block position={[1.0, -0.02, 0]} args={[0.16, 0.3, 0.52]} color="#78350f" metalness={0.3} />
      <Block position={[0, -0.18, -0.02]} args={[0.24, 0.12, 0.18]} color="#111827" metalness={0.4} />
      <mesh position={[0, -0.29, -0.03]}>
        <sphereGeometry args={[0.06, 16, 12]} />
        <meshStandardMaterial color={sensorColor} emissive={sensorColor} emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[-0.78, -0.21, 0.23]}>
        <sphereGeometry args={[0.045, 12, 8]} />
        <meshStandardMaterial color={sensorColor} emissive={sensorColor} emissiveIntensity={1.3} />
      </mesh>
      <mesh position={[0.78, -0.21, 0.23]}>
        <sphereGeometry args={[0.045, 12, 8]} />
        <meshStandardMaterial color={sensorColor} emissive={sensorColor} emissiveIntensity={1.3} />
      </mesh>
    </group>
  );
}

function Truck({ id, x, z, color, accent, loaded, target, status, tone }) {
  const opacity = tone === 'muted' ? 0.62 : 1;
  return (
    <group position={[x, 0.12, z]}>
      <Block position={[0.12, 0.34, 0]} args={[2.25, 0.18, 0.72]} color="#374151" opacity={opacity} metalness={0.35} />
      <Block position={[-0.92, 0.56, 0]} args={[0.72, 0.66, 0.72]} color={color} opacity={opacity} metalness={0.22} />
      <Block position={[-1.03, 0.68, -0.38]} args={[0.42, 0.22, 0.04]} color="#1e3a5f" opacity={0.7} />
      <Block position={[0.33, 0.5, 0]} args={[1.7, 0.08, 0.58]} color="#111827" opacity={opacity} metalness={0.2} />
      <DriverFigure />
      {loaded ? <Container3D position={[0.38, 0.88, 0]} color="#ef4444" scale={[0.92, 0.92, 0.9]} /> : null}
      {[-0.88, -0.48, 0.72, 1.05].map((wheelX) => (
        <Wheel key={wheelX} position={[wheelX, 0.18, -0.43]} radius={0.13} />
      ))}
      {[-0.88, -0.48, 0.72, 1.05].map((wheelX) => (
        <Wheel key={`${wheelX}-r`} position={[wheelX, 0.18, 0.43]} radius={0.13} />
      ))}
      <Block position={[-1.28, 0.44, -0.36]} args={[0.05, 0.08, 0.04]} color="#fde047" emissive="#fde047" emissiveIntensity={1} />
      {target ? (
        <mesh position={[0.12, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.25, 1.34, 48]} />
          <meshBasicMaterial color={accent} transparent opacity={0.28} />
        </mesh>
      ) : null}
      <HtmlLabel position={[0.05, 1.12, 0]} className={target ? 'truck-tag active' : 'truck-tag'}>
        {id} · {status}
      </HtmlLabel>
    </group>
  );
}

function DriverFigure() {
  return (
    <group position={[-0.98, 0.66, -0.15]} scale={0.28}>
      <HumanFigure color="#182033" />
    </group>
  );
}

function HumanFigure({ position = [0, 0, 0], scale = 1, color = '#0f172a' }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <Block position={[0, 0.23, 0]} args={[0.28, 0.45, 0.18]} color={color} />
      <Block position={[-0.23, 0.25, 0]} args={[0.08, 0.36, 0.08]} color={color} rotation={[0, 0, -0.28]} />
      <Block position={[0.23, 0.25, 0]} args={[0.08, 0.36, 0.08]} color={color} rotation={[0, 0, 0.28]} />
    </group>
  );
}

function DataFeedNetwork({ frame }) {
  const active = ['engine', 'safety'].includes(frame.focusZone) || frame.issueActive;
  const activity = active ? 1 : 0.18;
  const engine = [-4.9, 0.9, -0.25];
  const nodes = [
    { id: 'TOS / BAPLIE', position: [-6.6, 1.12, 0.55], color: '#38bdf8' },
    { id: 'PLC trigger', position: [-1.1, 4.15, 1.15], color: '#fbbf24' },
    { id: 'GPS / VMT', position: [-6.8, 0.95, -2.35], color: '#4ade80' },
    { id: 'Yard ready', position: [-5.9, 1.0, -3.55], color: '#a78bfa' },
    { id: 'Wind 8 m/s', position: [-2.6, 1.8, 0.85], color: '#93c5fd' }
  ];

  return (
    <group>
      <Block position={engine} args={[1.2, 0.48, 0.72]} color="#0f2742" emissive={frame.issueActive ? frame.scenario.color : '#38bdf8'} emissiveIntensity={0.1 + activity * 0.22} />
      <HtmlLabel position={[engine[0], engine[1] + 0.55, engine[2]]} className="engine-label">
        Coordination engine
      </HtmlLabel>
      {nodes.map((node, i) => (
        <group key={node.id}>
          <Block position={node.position} args={[0.86, 0.25, 0.42]} color="#111827" emissive={node.color} emissiveIntensity={activity * 0.18} opacity={0.9} />
          <Line points={[node.position, engine]} color={node.color} transparent opacity={0.08 + activity * 0.26} lineWidth={1.1} />
          <DataPulse from={node.position} to={engine} color={node.color} activity={activity} offset={i * 0.17} />
          <HtmlLabel position={[node.position[0], node.position[1] + 0.32, node.position[2]]} className="scene-label">
            {node.id}
          </HtmlLabel>
        </group>
      ))}
    </group>
  );
}

function DataPulse({ from, to, color, activity, offset }) {
  const ref = useRef();
  const materialRef = useRef();
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const end = useMemo(() => new THREE.Vector3(...to), [to]);
  const temp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    if (!ref.current || !materialRef.current) return;
    const t = (clock.elapsedTime * (0.22 + activity * 0.72) + offset) % 1;
    temp.copy(start).lerp(end, t);
    ref.current.position.copy(temp);
    ref.current.scale.setScalar(0.035 + activity * 0.065);
    materialRef.current.opacity = activity < 0.1 ? 0 : 0.32 + activity * 0.55;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 12, 8]} />
      <meshBasicMaterial ref={materialRef} color={color} transparent opacity={0} />
    </mesh>
  );
}

function SafetyModeTower({ frame }) {
  if (frame.phaseId !== 'safety-modes') return null;
  const modes = ['Coordinated', 'Recommendation', 'Manual available'];
  const activeIndex = frame.systemMode.startsWith('Coordinated') ? 0 : frame.systemMode.startsWith('Recommendation') ? 1 : 2;
  return (
    <group position={[2.85, 0.25, -0.25]}>
      {modes.map((mode, index) => {
        const color = index === 0 ? '#4ade80' : index === 1 ? '#fbbf24' : '#38bdf8';
        return (
          <group key={mode} position={[0, index * 0.48, 0]}>
            <Block position={[0, 0, 0]} args={[1.75, 0.3, 0.36]} color="#111827" emissive={index === activeIndex ? color : '#000000'} emissiveIntensity={index === activeIndex ? 0.45 : 0} />
            <mesh position={[-0.74, 0, -0.21]}>
              <sphereGeometry args={[0.075, 12, 8]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={index === activeIndex ? 1.4 : 0.25} />
            </mesh>
            <HtmlLabel position={[0, 0.04, -0.28]} className="mode-label">
              {mode}
            </HtmlLabel>
          </group>
        );
      })}
    </group>
  );
}

function RouteLine({ points, color, opacity }) {
  const end = points[points.length - 1];
  return (
    <group>
      <Line points={points} color={color} lineWidth={2.4} dashed dashSize={0.18} gapSize={0.12} transparent opacity={opacity} />
      <mesh position={end} rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.16, 0.34, 4]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

function Container3D({ position, color, scale = [1, 1, 1], dimmed = false }) {
  const ribs = [-0.55, -0.33, -0.11, 0.11, 0.33, 0.55];
  return (
    <group position={position} scale={scale}>
      <Block position={[0, 0, 0]} args={[1.45, 0.52, 0.62]} color={color} metalness={0.16} opacity={dimmed ? 0.76 : 1} />
      {ribs.map((x) => (
        <Block key={x} position={[x, 0.01, -0.323]} args={[0.025, 0.48, 0.018]} color="#0f172a" opacity={0.18} />
      ))}
      {ribs.map((x) => (
        <Block key={`${x}-front`} position={[x, 0.01, 0.323]} args={[0.025, 0.48, 0.018]} color="#0f172a" opacity={0.18} />
      ))}
      <Block position={[0, 0.275, 0]} args={[1.5, 0.035, 0.66]} color="#ffffff" opacity={0.1} />
      <Block position={[0, -0.275, 0]} args={[1.5, 0.035, 0.66]} color="#000000" opacity={0.18} />
    </group>
  );
}

function Wheel({ position, radius = 0.12 }) {
  return (
    <mesh castShadow receiveShadow position={position} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius, radius, 0.08, 20]} />
      <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
    </mesh>
  );
}

function Block({
  position,
  args,
  color,
  emissive = '#000000',
  emissiveIntensity = 0,
  metalness = 0.08,
  roughness = 0.58,
  opacity = 1,
  rotation = [0, 0, 0],
  receiveOnly = false
}) {
  return (
    <mesh castShadow={!receiveOnly} receiveShadow position={position} rotation={rotation}>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={metalness}
        roughness={roughness}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

function HtmlLabel({ children, position, className }) {
  return (
    <Html zIndexRange={[1, 0]} position={position} transform distanceFactor={3.2} className={className}>
      {children}
    </Html>
  );
}
