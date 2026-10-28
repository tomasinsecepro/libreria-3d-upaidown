import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage } from '@react-three/drei';

export interface ModelViewerProps {
  modelUrl: string; // Ruta al archivo .glb (ej: '/models/rover.glb')
  autoRotate?: boolean;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export function ModelViewer3D({ modelUrl, autoRotate = true }: ModelViewerProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px', background: '#121619' }}>
      <Suspense fallback={<div style={{ color: '#fff', padding: '1rem' }}>Cargando modelo 3D GLB...</div>}>
        <Canvas camera={{ position: [4, 3, 5], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <Stage environment="city" intensity={0.6}>
            <Model url={modelUrl} />
          </Stage>
          <OrbitControls autoRotate={autoRotate} makeDefault />
        </Canvas>
      </Suspense>
    </div>
  );
}
