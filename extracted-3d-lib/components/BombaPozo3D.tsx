import React, { Suspense, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export interface BombaPozo3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  pumpRunning?: boolean; // Vibración sutil de impulsión de agua a alta presión
  modelUrl?: string;
}

function PumpModel({
  url,
  pumpRunning = true,
}: {
  url: string;
  pumpRunning?: boolean;
}) {
  const { scene } = useGLTF(url);
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (ref.current && pumpRunning) {
      // Vibración característica de la impulsión por agua a alta presión
      ref.current.position.y = Math.sin(clock.elapsedTime * 45) * 0.0015;
    }
  });

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export function BombaPozo3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  pumpRunning = true,
  modelUrl = '/models/bomba-pozo.glb',
}: BombaPozo3DProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Suspense fallback={null}>
        <PumpModel url={modelUrl} pumpRunning={pumpRunning} />
      </Suspense>
    </group>
  );
}
