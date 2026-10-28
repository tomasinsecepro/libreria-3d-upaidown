import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Rover3D } from './Rover3D';
import { Sentinel3D } from './Sentinel3D';
import { Drone3D } from './Drone3D';

export interface FieldScene3DProps {
  roverProbing?: boolean;
  sentinelHeight?: number; // 0 a 1
  sentinelBayOpen?: boolean;
  droneActive?: boolean;
  className?: string;
  showOverlay?: boolean;
}

function Field({
  roverProbing = false,
  sentinelHeight = 0.5,
  sentinelBayOpen = false,
  droneActive = true,
}: {
  roverProbing?: boolean;
  sentinelHeight?: number;
  sentinelBayOpen?: boolean;
  droneActive?: boolean;
}) {
  return (
    <>
      <color attach="background" args={['#8ba0a5']} />
      <fog attach="fog" args={['#8ba0a5', 12, 28]} />
      <ambientLight intensity={1.1} />
      <directionalLight
        position={[-6, 10, -4]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Terreno base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 42, 32, 32]} />
        <meshStandardMaterial color="#302b20" roughness={1} />
      </mesh>

      {/* Surcos agrícolas */}
      {[-7, -4, 4, 7].map((z) => (
        <mesh key={z} position={[0, 0.14, z]} receiveShadow>
          <boxGeometry args={[28, 0.22, 0.72]} />
          <meshStandardMaterial color="#405a2d" roughness={1} />
        </mesh>
      ))}

      {/* Vehículo Rover */}
      <Rover3D probing={roverProbing} />

      {/* Torre / Mástil Sentinel */}
      <Sentinel3D height={sentinelHeight} bayOpen={sentinelBayOpen} />

      {/* Dron aéreo */}
      <Drone3D active={droneActive} />
    </>
  );
}

export function FieldScene3D({
  roverProbing = false,
  sentinelHeight = 0.5,
  sentinelBayOpen = false,
  droneActive = true,
  className = 'field-scene-3d',
  showOverlay = true,
}: FieldScene3DProps) {
  return (
    <section className={className} aria-label="Interactive 3D concept scene" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
      <Suspense fallback={<div style={{ color: '#fff', padding: '1rem' }}>Cargando escena 3D...</div>}>
        <Canvas
          shadows
          camera={{ position: [8, 7, 11], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <Field
            roverProbing={roverProbing}
            sentinelHeight={sentinelHeight}
            sentinelBayOpen={sentinelBayOpen}
            droneActive={droneActive}
          />
          <OrbitControls
            enablePan={false}
            minDistance={8}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2.08}
            target={[0, 1.3, 0]}
          />
        </Canvas>
      </Suspense>

      {showOverlay && (
        <div
          className="scene-classification"
          style={{
            position: 'absolute',
            zIndex: 3,
            right: 24,
            top: 22,
            display: 'grid',
            gap: 5,
            padding: '12px 14px',
            background: 'rgba(6,16,15,0.78)',
            border: '1px solid rgba(226,241,234,0.12)',
            backdropFilter: 'blur(12px)',
            pointerEvents: 'none',
            color: '#e2f1ea',
            fontFamily: 'monospace',
            fontSize: '11px',
          }}
        >
          <b style={{ color: '#00e5ff' }}>INTERACTIVE 3D CONCEPT SCENE</b>
          <span style={{ color: '#ffb300' }}>PROCEDURAL PLACEHOLDER GEOMETRY · GLB READY</span>
        </div>
      )}
    </section>
  );
}
