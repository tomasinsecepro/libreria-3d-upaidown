import React, { Suspense, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import type { Group } from 'three';

export interface IngeteamInverter3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  modelUrl?: string;
}

function InverterModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<Group>(null);

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export function IngeteamInverter3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  modelUrl = '/models/inversor-ingeteam-110kw.glb',
}: IngeteamInverter3DProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Suspense fallback={null}>
        <InverterModel url={modelUrl} />
      </Suspense>
    </group>
  );
}

useGLTF.preload?.('/models/inversor-ingeteam-110kw.glb');
