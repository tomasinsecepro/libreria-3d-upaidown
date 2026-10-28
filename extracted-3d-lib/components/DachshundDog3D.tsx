import React, { Suspense, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export interface DachshundDog3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  breathingEffect?: boolean;
  modelUrl?: string;
}

function DachshundModel({
  url,
  breathingEffect = true,
}: {
  url: string;
  breathingEffect?: boolean;
}) {
  const { scene } = useGLTF(url);
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (ref.current && breathingEffect) {
      const t = clock.elapsedTime;
      // Respiración sutil y movimiento orgánico de alerta
      const breath = Math.sin(t * 2.4) * 0.003;
      ref.current.scale.set(1 + breath * 0.5, 1 + breath, 1 + breath * 0.8);
      // Leve oscilación de la cabeza / atención
      ref.current.rotation.y = Math.sin(t * 0.7) * 0.015;
    }
  });

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export function DachshundDog3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  breathingEffect = true,
  modelUrl = '/models/perro-salchicha.glb',
}: DachshundDog3DProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Suspense fallback={null}>
        <DachshundModel url={modelUrl} breathingEffect={breathingEffect} />
      </Suspense>
    </group>
  );
}

useGLTF.preload?.('/models/perro-salchicha.glb');
