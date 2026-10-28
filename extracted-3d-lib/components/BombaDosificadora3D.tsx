import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export interface BombaDosificadora3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  flowLh?: number;
  strokePercent?: number;
  running?: boolean;
}

export function BombaDosificadora3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  flowLh = 500,
  strokePercent = 100,
  running = true,
}: BombaDosificadora3DProps) {
  const groupRef = useRef<Group>(null);
  const pistonRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (running && pistonRef.current) {
      // Movimiento alternativo de carrera del pistón/membrana
      const freq = (flowLh / 500) * 12;
      const strokeAmp = (strokePercent / 100) * 0.012;
      pistonRef.current.position.x = 0.12 + Math.sin(clock.elapsedTime * freq) * strokeAmp;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* 1. Patas de anclaje de chapa de acero doblada */}
      <mesh position={[-0.18, 0.06, 0.14]} castShadow>
        <boxGeometry args={[0.22, 0.12, 0.02]} />
        <meshStandardMaterial color="#1a1c20" roughness={0.7} metalness={0.5} />
      </mesh>
      <mesh position={[-0.18, 0.06, -0.14]} castShadow>
        <boxGeometry args={[0.22, 0.12, 0.02]} />
        <meshStandardMaterial color="#1a1c20" roughness={0.7} metalness={0.5} />
      </mesh>
      {/* Pletina base */}
      <mesh position={[-0.18, 0.01, 0]} receiveShadow>
        <boxGeometry args={[0.28, 0.02, 0.32]} />
        <meshStandardMaterial color="#141619" roughness={0.8} />
      </mesh>

      {/* 2. Cuerpo del reductor / caja de engranajes */}
      <mesh position={[-0.18, 0.22, 0]} castShadow>
        <boxGeometry args={[0.34, 0.28, 0.26]} />
        <meshStandardMaterial color="#212429" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* Mando micrométrico de ajuste de carrera en la cara trasera */}
      <mesh position={[-0.37, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 24]} />
        <meshStandardMaterial color="#111315" roughness={0.4} />
      </mesh>
      <mesh position={[-0.395, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.046, 0.046, 0.01, 24]} />
        <meshStandardMaterial color="#cfd6dc" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* 3. Motor eléctrico asíncrono IEC vertical */}
      <group position={[-0.18, 0.36, 0]} rotation={[0, 0, 0]}>
        {/* Brida de acoplamiento B14 */}
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.04, 24]} />
          <meshStandardMaterial color="#88929b" metalness={0.7} roughness={0.35} />
        </mesh>
        {/* Carcasa con aletas de refrigeración en aluminio */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 0.34, 24]} />
          <meshStandardMaterial color="#9aa4af" metalness={0.75} roughness={0.35} />
        </mesh>
        {/* 16 aletas de refrigeración */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 16;
          return (
            <mesh
              key={`fin-${i}`}
              position={[Math.cos(angle) * 0.115, 0.22, Math.sin(angle) * 0.115]}
              rotation={[0, -angle, 0]}
              castShadow
            >
              <boxGeometry args={[0.025, 0.32, 0.008]} />
              <meshStandardMaterial color="#a2acb7" metalness={0.8} roughness={0.3} />
            </mesh>
          );
        })}
        {/* Caja de bornes / terminales */}
        <mesh position={[0, 0.22, 0.14]} castShadow>
          <boxGeometry args={[0.12, 0.16, 0.08]} />
          <meshStandardMaterial color="#8e99a4" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Caperuza del ventilador en negro mate */}
        <mesh position={[0, 0.44, 0]} castShadow>
          <cylinderGeometry args={[0.115, 0.115, 0.16, 24]} />
          <meshStandardMaterial color="#16181b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.53, 0]}>
          <cylinderGeometry args={[0.09, 0.115, 0.04, 24]} />
          <meshStandardMaterial color="#16181b" roughness={0.6} />
        </mesh>
      </group>

      {/* 4. Linterna / separador intermedio transparente */}
      <mesh position={[0.04, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.118, 0.118, 0.12, 28]} />
        <meshPhysicalMaterial transmission={0.85} opacity={0.6} transparent roughness={0.15} ior={1.5} color="#eaf2f8" />
      </mesh>
      {/* Vástago interior en movimiento alternativo */}
      <group ref={pistonRef} position={[0.12, 0.22, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.18, 16]} />
          <meshStandardMaterial color="#cfd7de" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>
      {/* Anillo de apriete en acero inoxidable */}
      <mesh position={[0.105, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.122, 0.122, 0.025, 28]} />
        <meshStandardMaterial color="#d8e0e8" metalness={0.9} roughness={0.18} />
      </mesh>

      {/* 5. Cabezal dosificador (Liquid End) */}
      <group position={[0.22, 0.22, 0]}>
        {/* Cuerpo cilíndrico en polímero técnico negro */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.19, 32]} />
          <meshStandardMaterial color="#181a1d" roughness={0.4} metalness={0.2} />
        </mesh>

        {/* Brida frontal de acero inoxidable con 6 pernos Allen */}
        <mesh position={[0.10, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.123, 0.123, 0.016, 32]} />
          <meshStandardMaterial color="#d4dce4" metalness={0.92} roughness={0.18} />
        </mesh>
        {/* 6 Pernos Allen con arandela */}
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 6;
          const by = Math.sin(a) * 0.102;
          const bz = Math.cos(a) * 0.102;
          return (
            <mesh key={`bolt-${i}`} position={[0.115, by, bz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.018, 12]} />
              <meshStandardMaterial color="#adb7c2" metalness={0.95} roughness={0.2} />
            </mesh>
          );
        })}

        {/* Disco central frontal negro con distintivo 500 */}
        <mesh position={[0.11, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.088, 0.088, 0.005, 32]} />
          <meshStandardMaterial color="#111316" roughness={0.3} />
        </mesh>

        {/* Válvula de impulsión superior (con tapón rojo roscado) */}
        <mesh position={[0.03, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.07, 18]} />
          <meshStandardMaterial color="#181a1d" roughness={0.4} />
        </mesh>
        <mesh position={[0.03, 0.20, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.055, 24]} />
          <meshStandardMaterial color="#d93025" roughness={0.35} metalness={0.1} />
        </mesh>

        {/* Válvula de aspiración inferior (con tapón rojo roscado) */}
        <mesh position={[0.03, -0.14, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.07, 18]} />
          <meshStandardMaterial color="#181a1d" roughness={0.4} />
        </mesh>
        <mesh position={[0.03, -0.20, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.055, 24]} />
          <meshStandardMaterial color="#d93025" roughness={0.35} metalness={0.1} />
        </mesh>
      </group>
    </group>
  );
}
