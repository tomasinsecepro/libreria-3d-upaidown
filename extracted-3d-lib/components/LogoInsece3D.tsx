import React, { Suspense, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export interface LogoInsece3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  autoRotate?: boolean;  // Rotación suave del logo completo
  floatingEffect?: boolean; // Leve flotación tipo rótulo corporativo
  modelUrl?: string;
}

function LogoModel({
  url,
  floatingEffect = true,
}: {
  url: string;
  floatingEffect?: boolean;
}) {
  const { scene } = useGLTF(url);
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (ref.current && floatingEffect) {
      const t = clock.elapsedTime;
      ref.current.position.y = Math.sin(t * 1.5) * 0.06;
      ref.current.rotation.y = Math.sin(t * 0.8) * 0.08;
    }
  });

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export function LogoInsece3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  floatingEffect = true,
  modelUrl = '/models/logo-insece.glb',
}: LogoInsece3DProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Suspense fallback={null}>
        <LogoModel url={modelUrl} floatingEffect={floatingEffect} />
      </Suspense>
    </group>
  );
}
