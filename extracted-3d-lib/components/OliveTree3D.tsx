import React, { Suspense, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export interface OliveTree3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  windBreeze?: boolean; // Leve brisa mediterránea que hace brillar el envés plateado
  modelUrl?: string;
}

function TreeModel({ url, windBreeze = true }: { url: string; windBreeze?: boolean }) {
  const { scene } = useGLTF(url);
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (ref.current && windBreeze) {
      const t = clock.elapsedTime;
      // Balanceo sutil de olivo
      ref.current.rotation.z = Math.sin(t * 1.1) * 0.009;
      ref.current.rotation.x = Math.cos(t * 0.8) * 0.006;
    }
  });

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export function OliveTree3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  windBreeze = true,
  modelUrl = '/models/arbol-olivo.glb',
}: OliveTree3DProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Suspense fallback={null}>
        <TreeModel url={modelUrl} windBreeze={windBreeze} />
      </Suspense>
    </group>
  );
}
