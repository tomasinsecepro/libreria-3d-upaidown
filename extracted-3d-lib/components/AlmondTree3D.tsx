import React, { Suspense, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export interface AlmondTree3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  modelUrl?: string;
  windBreeze?: boolean;
}

function AlmondTreeModel({
  url,
  windBreeze = true,
}: {
  url: string;
  windBreeze?: boolean;
}) {
  const { scene } = useGLTF(url);
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (ref.current && windBreeze) {
      const t = clock.elapsedTime;
      ref.current.rotation.z = Math.sin(t * 1.05) * 0.008;
      ref.current.rotation.x = Math.cos(t * 0.75) * 0.005;
    }
  });

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export function AlmondTree3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  windBreeze = true,
  modelUrl = '/models/arbol-almendro.glb',
}: AlmondTree3DProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Suspense fallback={null}>
        <AlmondTreeModel url={modelUrl} windBreeze={windBreeze} />
      </Suspense>
    </group>
  );
}

useGLTF.preload('/models/arbol-almendro.glb');
