import React, { useRef } from 'react';
import type { Group } from 'three';

export interface TorreMediaTension3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  voltageKv?: number;
}

export function TorreMediaTension3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  voltageKv = 20,
}: TorreMediaTension3DProps) {
  const groupRef = useRef<Group>(null);

  // Dimensiones normalizadas de apoyo metálico de celosía sin transformador
  const towerH = 11.2;
  const baseH = 2.0;

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* 1. Armario metálico inferior (base cuadrangular con puertas de maniobra) */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.22, baseH, 1.22]} />
        <meshStandardMaterial color="#60666d" metalness={0.75} roughness={0.35} />
      </mesh>
      {/* Tejadillo superior piramidal del armario */}
      <mesh position={[0, baseH + 0.1, 0]}>
        <cylinderGeometry args={[0.88, 1.24, 0.2, 4]} rotation={[0, Math.PI / 4, 0]} />
        <meshStandardMaterial color="#50565d" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 2. Fuste de celosía metálica galvanizada */}
      {/* 4 Montantes principales en las esquinas */}
      {[-0.38, 0.38].map((x) =>
        [-0.38, 0.38].map((z) => (
          <mesh
            key={`leg-${x}-${z}`}
            position={[x * 0.9, baseH + (towerH - baseH) / 2, z * 0.9]}
            castShadow
          >
            <cylinderGeometry args={[0.038, 0.048, towerH - baseH, 8]} />
            <meshStandardMaterial color="#949da5" metalness={0.9} roughness={0.22} />
          </mesh>
        ))
      )}

      {/* Tramos en cruz de celosía X en las 4 caras */}
      {Array.from({ length: 8 }).map((_, i) => {
        const y = baseH + 0.35 + i * 1.1;
        return (
          <group key={`truss-${i}`} position={[0, y, 0]}>
            {/* Montantes horizontales */}
            <mesh position={[0, 0, 0.35]}>
              <boxGeometry args={[0.72, 0.035, 0.035]} />
              <meshStandardMaterial color="#88929b" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0, -0.35]}>
              <boxGeometry args={[0.72, 0.035, 0.035]} />
              <meshStandardMaterial color="#88929b" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0.35, 0, 0]}>
              <boxGeometry args={[0.035, 0.035, 0.72]} />
              <meshStandardMaterial color="#88929b" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[-0.35, 0, 0]}>
              <boxGeometry args={[0.035, 0.035, 0.72]} />
              <meshStandardMaterial color="#88929b" metalness={0.85} roughness={0.25} />
            </mesh>
          </group>
        );
      })}

      {/* Conducto vertical central de cables / bajantes de tierra */}
      <mesh position={[0, baseH + (towerH - baseH) / 2, 0]}>
        <cylinderGeometry args={[0.055, 0.055, towerH - baseH, 12]} />
        <meshStandardMaterial color="#22252a" roughness={0.8} />
      </mesh>

      {/* 3. Cruceta superior de coronación y aisladores de línea */}
      <group position={[0, towerH, 0]}>
        {/* Viga horizontal de la cruceta */}
        <mesh position={[-0.4, 0, 0]}>
          <boxGeometry args={[2.8, 0.14, 0.28]} />
          <meshStandardMaterial color="#7a848e" metalness={0.9} roughness={0.25} />
        </mesh>
        {/* Tirantes superiores de arriostramiento de cruceta */}
        <mesh position={[-0.4, 0.45, 0]}>
          <boxGeometry args={[1.4, 0.06, 0.18]} />
          <meshStandardMaterial color="#7a848e" metalness={0.9} roughness={0.25} />
        </mesh>

        {/* 3 Cadenas de aisladores de suspensión de vidrio / composite */}
        {[-1.5, -0.4, 0.7].map((ax, i) => (
          <group key={`insulator-${i}`} position={[ax, 0.22, 0]}>
            <mesh>
              <cylinderGeometry args={[0.045, 0.045, 0.42, 12]} />
              <meshStandardMaterial color="#949da5" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Campanas del aislador */}
            {[0.08, 0.16, 0.24, 0.32].map((cy) => (
              <mesh key={`bell-${cy}`} position={[0, cy - 0.2, 0]}>
                <cylinderGeometry args={[0.09, 0.05, 0.035, 14]} />
                <meshStandardMaterial color="#8b3a2b" roughness={0.3} />
              </mesh>
            ))}
            {/* Cable aéreo conductor suspendido */}
            <mesh position={[0, -0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.014, 0.014, 1.6, 8]} />
              <meshStandardMaterial color="#b4bec4" metalness={0.92} roughness={0.15} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
