import React from 'react';

export interface Sentinel3DProps {
  height?: number; // 0 a 1 (factor de elevación del mástil)
  bayOpen?: boolean;
  position?: [number, number, number];
}

const dark = '#151b1a';
const metal = '#7d8581';
const green = '#27362b';

export function Sentinel3D({
  height = 1,
  bayOpen = false,
  position = [2.5, 0, -0.4],
}: Sentinel3DProps) {
  const mast = 2.2 + height * 2.2;

  return (
    <group position={position}>
      {/* Base / Skid */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[2.1, 0.24, 1.7]} />
        <meshStandardMaterial color="#77736b" roughness={0.95} />
      </mesh>

      {/* Compartimento inferior */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.85, 0.75, 0.75]} />
        <meshStandardMaterial color={green} roughness={0.55} />
      </mesh>

      {/* Mástil telescópico */}
      {[-0.22, 0, 0.22].map((x) => (
        <mesh key={x} position={[x, mast / 2 + 0.45, 0]}>
          <cylinderGeometry args={[0.07, 0.085, mast, 16]} />
          <meshStandardMaterial color={metal} metalness={0.8} roughness={0.25} />
        </mesh>
      ))}

      {/* Bahía superior y compuerta */}
      <group position={[0, mast + 0.75, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.75, 0.8, 1.25]} />
          <meshStandardMaterial color={green} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.58, 0.42]} rotation={[bayOpen ? -0.85 : 0, 0, 0]}>
          <boxGeometry args={[1.7, 0.12, 1.2]} />
          <meshStandardMaterial color={dark} metalness={0.35} />
        </mesh>
        <mesh position={[0.68, 1.25, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 1.7, 10]} />
          <meshStandardMaterial color={dark} />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.14, 0.18, 0.7, 18]} />
          <meshStandardMaterial color={metal} metalness={0.75} />
        </mesh>
      </group>
    </group>
  );
}
