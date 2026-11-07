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

  React.useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (
          child.isMesh &&
          ((child.material &&
            child.material.name &&
            (child.material.name.includes('Soil') ||
              child.material.name.includes('Dry') ||
              child.material.name.includes('Orchard Dry Soil'))) ||
            (child.name &&
              (child.name.toLowerCase().includes('soil') ||
                child.name.toLowerCase().includes('stone') ||
                child.name.toLowerCase().includes('root'))))
        ) {
          child.visible = false;
          if (child.parent) child.parent.remove(child);
        }
      });
    }
  }, [scene]);

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
