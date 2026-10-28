import React, { Suspense, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export interface EmbalseRiego3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  waterLevelPercent?: number; // 0% a 100% de llenado del embalse
  modelUrl?: string;
}

function ReservoirModel({
  url,
  waterLevelPercent = 80,
}: {
  url: string;
  waterLevelPercent?: number;
}) {
  const { scene } = useGLTF(url);
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const waterMesh = scene.getObjectByName('Irrigation Water Mirror');
      if (waterMesh) {
        // Ondulación sutil en la lámina de agua
        const baseHeight = (waterLevelPercent / 100) * 3.8;
        waterMesh.position.y = (baseHeight / 2) + 0.15 + Math.sin(clock.elapsedTime * 1.6) * 0.015;
      }
    }
  });

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export function EmbalseRiego3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  waterLevelPercent = 80,
  modelUrl = '/models/embalse-riego.glb',
}: EmbalseRiego3DProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Suspense fallback={null}>
        <ReservoirModel
          url={modelUrl}
          waterLevelPercent={waterLevelPercent}
        />
      </Suspense>
    </group>
  );
}
