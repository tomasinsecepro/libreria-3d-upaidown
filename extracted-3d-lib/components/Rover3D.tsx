import React from 'react';

export interface Rover3DProps {
  probing?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

const dark = '#151b1a';
const white = '#d9ddda';
const metal = '#7d8581';
const rubber = '#090b0b';
const signal = '#b9f36a';

function Track({ x }: { x: number }) {
  return (
    <group position={[x, 0.48, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.42, 0.65, 2.25]} />
        <meshStandardMaterial color={rubber} roughness={0.9} />
      </mesh>
      <mesh position={[x > 0 ? -0.215 : 0.215, 0, 0]}>
        <boxGeometry args={[0.035, 0.48, 1.72]} />
        <meshStandardMaterial color={white} metalness={0.45} roughness={0.35} />
      </mesh>
    </group>
  );
}

export function Rover3D({
  probing = false,
  position = [-2.25, 0, 1.2],
  rotation = [0, 0.38, 0],
}: Rover3DProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Orugas */}
      <Track x={-1} />
      <Track x={1} />

      {/* Chasis inferior */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[1.65, 0.62, 2.1]} />
        <meshStandardMaterial color={white} metalness={0.45} roughness={0.3} />
      </mesh>

      {/* Cabina superior */}
      <mesh position={[0, 1.32, 0]} castShadow>
        <boxGeometry args={[2.05, 0.78, 2.45]} />
        <meshStandardMaterial color={dark} metalness={0.5} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.66, 0]}>
        <boxGeometry args={[1.55, 0.12, 1.75]} />
        <meshStandardMaterial color="#292f2d" />
      </mesh>

      {/* Matriz de sensores frontales con emisores */}
      <group position={[0, 1.25, -1.28]}>
        {[-0.62, -0.32, 0.32, 0.62].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 20]} />
            <meshStandardMaterial
              color={x < 0 ? signal : '#7b8d86'}
              emissive={x < 0 ? signal : '#000'}
              emissiveIntensity={0.18}
            />
          </mesh>
        ))}
      </group>

      {/* Brazo de sondeo del suelo */}
      <group position={[0, probing ? 0.15 : 0.95, -1.5]}>
        <mesh>
          <cylinderGeometry args={[0.11, 0.11, 1.2, 18]} />
          <meshStandardMaterial color={metal} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.65, 0]}>
          <cylinderGeometry args={[0.2, 0.14, 0.16, 18]} />
          <meshStandardMaterial color={metal} metalness={0.8} />
        </mesh>
      </group>

      {/* Antena */}
      <mesh position={[0.82, 2.05, 0.65]}>
        <cylinderGeometry args={[0.025, 0.025, 1.25, 10]} />
        <meshStandardMaterial color={dark} />
      </mesh>
    </group>
  );
}
