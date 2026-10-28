import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export interface Drone3DProps {
  active?: boolean;
  position?: [number, number, number];
  scale?: number;
}

const dark = '#151b1a';
const white = '#d9ddda';

export function Drone3D({
  active = false,
  position = [0.7, 3.8, -1.1],
  scale = 0.55,
}: Drone3DProps) {
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (ref.current && active) {
      ref.current.position.y = 5.5 + Math.sin(clock.elapsedTime * 1.5) * 0.16;
      ref.current.rotation.y = clock.elapsedTime * 0.12;
    }
  });

  return (
    <group ref={ref} position={active ? [position[0], 5.5, position[2]] : position} scale={scale}>
      {/* Fuselaje */}
      <mesh>
        <boxGeometry args={[1, 0.22, 0.65]} />
        <meshStandardMaterial color={white} metalness={0.35} />
      </mesh>

      {/* Brazos y Rotores */}
      {[
        [-0.8, 0, -0.55],
        [0.8, 0, -0.55],
        [-0.8, 0, 0.55],
        [0.8, 0, 0.55],
      ].map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          <mesh>
            <boxGeometry args={[1.2, 0.08, 0.1]} />
            <meshStandardMaterial color={dark} />
          </mesh>
          <mesh position={[i % 2 ? -0.42 : 0.42, 0.07, 0]}>
            <cylinderGeometry args={[0.48, 0.48, 0.035, 24]} />
            <meshStandardMaterial color="#202624" transparent opacity={0.62} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
