import React, { Suspense, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export interface PivotRiego3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  // Control SCADA en vivo:
  angleDegrees?: number; // 0 a 360 grados (posición angular del pívot en la finca)
  autoRotate?: boolean;  // Si está activo el avance automático
  speed?: number;        // Velocidad de giro
  isWaterSpraying?: boolean; // Estado de bomba de riego (abierta/cerrada)
  modelUrl?: string;
}

function PivotModel({
  url,
  angleDegrees,
  autoRotate = false,
  speed = 0.05,
}: {
  url: string;
  angleDegrees?: number;
  autoRotate?: boolean;
  speed?: number;
}) {
  const { scene } = useGLTF(url);
  const pivotArmRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (pivotArmRef.current) {
      if (angleDegrees !== undefined) {
        // Fijado por telemetría SCADA
        pivotArmRef.current.rotation.y = (angleDegrees * Math.PI) / 180;
      } else if (autoRotate) {
        // Rotación continua simulación
        pivotArmRef.current.rotation.y += delta * speed;
      }
    }
  });

  return (
    <group ref={pivotArmRef}>
      <primitive object={scene} />
    </group>
  );
}

export function PivotRiego3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  angleDegrees,
  autoRotate = true,
  speed = 0.04,
  modelUrl = '/models/pivot-riego-7t.glb',
}: PivotRiego3DProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Suspense fallback={null}>
        <PivotModel
          url={modelUrl}
          angleDegrees={angleDegrees}
          autoRotate={autoRotate}
          speed={speed}
        />
      </Suspense>
    </group>
  );
}
