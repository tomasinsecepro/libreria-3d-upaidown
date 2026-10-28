import React, { Suspense, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import type { Group } from 'three';

export interface SolarPanels3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  modelUrl?: string;
}

function SolarParkModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<Group>(null);

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export function SolarPanels3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  modelUrl = '/models/placas-solares.glb',
}: SolarPanels3DProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Suspense fallback={null}>
        <SolarParkModel url={modelUrl} />
      </Suspense>
    </group>
  );
}

useGLTF.preload?.('/models/placas-solares.glb');
