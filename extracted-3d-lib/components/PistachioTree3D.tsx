import React, { Suspense, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export interface PistachioTree3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  windBreeze?: boolean; // Leve oscilación de la copa por el viento del campo
  modelUrl?: string;
}

function TreeModel({ url, windBreeze = true }: { url: string; windBreeze?: boolean }) {
  const { scene } = useGLTF(url);
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (ref.current && windBreeze) {
      // Brisa suave en el follaje
      const t = clock.elapsedTime;
      ref.current.rotation.z = Math.sin(t * 1.2) * 0.012;
      ref.current.rotation.x = Math.cos(t * 0.9) * 0.008;
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
        <TreeModel url={modelUrl} windBreeze={windBreeze} />
      </Suspense>
    </group>
  );
}
