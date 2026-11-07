import React, { Suspense, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export interface PistachioTree3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  modelUrl?: string;
  windBreeze?: boolean;
}

function PistachioTreeModel({
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
      ref.current.rotation.z = Math.sin(t * 0.95) * 0.007;
      ref.current.rotation.x = Math.cos(t * 0.85) * 0.005;
    }
  });

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export function PistachioTree3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  windBreeze = true,
  modelUrl = '/models/arbol-pistacho.glb',
}: PistachioTree3DProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Suspense fallback={null}>
        <PistachioTreeModel url={modelUrl} windBreeze={windBreeze} />
      </Suspense>
    </group>
  );
}

useGLTF.preload('/models/arbol-pistacho.glb');
