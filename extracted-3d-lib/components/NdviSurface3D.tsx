import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { BufferAttribute, BufferGeometry, Color, DoubleSide } from 'three';

export interface NdviSurface3DProps {
  className?: string;
  showOverlay?: boolean;
}

function ndviValue(x: number, z: number) {
  const base = 0.68 + 0.11 * Math.sin(x * 0.58) + 0.07 * Math.cos(z * 0.72);
  const anomaly = 0.58 * Math.exp(-((x - 2.1) ** 2 + (z + 0.4) ** 2) / 3.2);
  const edge = 0.05 * Math.sin((x + z) * 1.7);
  return Math.max(-1, Math.min(1, base - anomaly + edge));
}

function ndviColor(value: number) {
  const stops = [
    [-1, '#7b3d34'],
    [-0.25, '#bd7535'],
    [0, '#c8a742'],
    [0.35, '#8b9b3e'],
    [0.65, '#3d7a45'],
    [1, '#12613e'],
  ] as const;

  for (let i = 1; i < stops.length; i++) {
    if (value <= stops[i]![0]) {
      const [a, ca] = stops[i - 1]!;
      const [b, cb] = stops[i]!;
      return new Color(ca).lerp(new Color(cb), (value - a) / (b - a));
    }
  }
  return new Color(stops.at(-1)![1]);
}

function Surface() {
  const geometry = useMemo(() => {
    const width = 12;
    const depth = 8;
    const cols = 72;
    const rows = 48;
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        const x = (col / cols) * width - width / 2;
        const z = (row / rows) * depth - depth / 2;
        const v = ndviValue(x, z);
        const y = 0.18 + (v + 1) * 0.42;

        positions.push(x, y, z);
        const c = ndviColor(v);
        colors.push(c.r, c.g, c.b);
      }
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const a = row * (cols + 1) + col;
        const b = a + 1;
        const c = a + cols + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    g.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group rotation={[0, -0.18, 0]}>
      {/* Superficie topográfica con colores por vértice */}
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors side={DoubleSide} roughness={0.76} metalness={0} />
      </mesh>

      {/* Malla poligonal transparente superpuesta (wireframe) */}
      <mesh geometry={geometry} position={[0, 0.015, 0]}>
        <meshBasicMaterial color="#dbe8df" wireframe transparent opacity={0.075} />
      </mesh>

      {/* Indicador toroidal de anomalía (zona de estrés / fallo) */}
      <mesh position={[2.1, 0.95, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.035, 12, 64]} />
        <meshBasicMaterial color="#f07b68" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

export function NdviSurface3D({
  className = 'ndvi-webgl',
  showOverlay = true,
}: NdviSurface3DProps) {
  return (
    <div
      className={className}
      role="img"
      aria-label="Interactive synthetic NDVI surface"
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: '380px', background: '#07100f' }}
    >
      <Canvas
        camera={{ position: [8, 7, 10], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#07100f']} />
        <fog attach="fog" args={['#07100f', 13, 24]} />
        <ambientLight intensity={1.4} />
        <directionalLight position={[-4, 8, 5]} intensity={2.2} />
        <Surface />
        <gridHelper args={[18, 18, '#294039', '#182923']} position={[0, 0, 0]} />
        <OrbitControls
          enablePan={false}
          minDistance={8}
          maxDistance={18}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 0.3, 0]}
        />
      </Canvas>

      {showOverlay && (
        <div
          className="ndvi-3d-controls"
          style={{
            position: 'absolute',
            left: 22,
            top: 22,
            display: 'grid',
            gap: 5,
            padding: '11px 13px',
            background: 'rgba(6,16,15,0.78)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'none',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#fff',
          }}
        >
          <b style={{ color: '#2ed573' }}>INTERACTIVE WEBGL SURFACE</b>
          <span style={{ color: '#a4b0be' }}>DRAG TO ORBIT · SCROLL TO ZOOM</span>
        </div>
      )}
    </div>
  );
}
