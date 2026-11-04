import React, { useRef, useMemo } from 'react';
import type { Group } from 'three';
import * as THREE from 'three';

export interface GalgoEspanol3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

function createLoftedGeometry(
  rings: Array<{ z: number; y: number; rx: number; ry: number; x?: number }>,
  numRad = 28,
  closeEnds = true
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const numRings = rings.length;

  for (let i = 0; i < numRings; i++) {
    const ring = rings[i];
    const v = i / (numRings - 1);
    const rx = ring.rx;
    const ry = ring.ry;
    const cx = ring.x || 0;
    const cy = ring.y || 0;
    const cz = ring.z || 0;

    for (let j = 0; j <= numRad; j++) {
      const u = j / numRad;
      const phi = u * Math.PI * 2;

      const px = cx + rx * Math.sin(phi);
      const py = cy + ry * Math.cos(phi);
      const pz = cz;

      positions.push(px, py, pz);
      uvs.push(u, v);
    }
  }

  for (let i = 0; i < numRings - 1; i++) {
    for (let j = 0; j < numRad; j++) {
      const a = i * (numRad + 1) + j;
      const b = (i + 1) * (numRad + 1) + j;
      const c = (i + 1) * (numRad + 1) + (j + 1);
      const d = i * (numRad + 1) + (j + 1);

      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  if (closeEnds) {
    const frontCenterIdx = positions.length / 3;
    const firstRing = rings[0];
    positions.push(firstRing.x || 0, firstRing.y || 0, firstRing.z || 0);
    uvs.push(0.5, 0);

    for (let j = 0; j < numRad; j++) {
      indices.push(frontCenterIdx, j + 1, j);
    }

    const backCenterIdx = positions.length / 3;
    const lastRing = rings[numRings - 1];
    positions.push(lastRing.x || 0, lastRing.y || 0, lastRing.z || 0);
    uvs.push(0.5, 1);

    const lastRingStart = (numRings - 1) * (numRad + 1);
    for (let j = 0; j < numRad; j++) {
      indices.push(backCenterIdx, lastRingStart + j, lastRingStart + j + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Modelo 3D esculpido continuo de Galgo Español (Spanish Greyhound)
 * Malla orgánica sin primitivas separadas, con capa barcina atigrada,
 * antepecho blanco, patas delanteras blancas y collar de cuero granate.
 */
export function GalgoEspanol3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: GalgoEspanol3DProps) {
  const groupRef = useRef<Group>(null);

  // Malla continua del cuerpo completo (desde el hocico hasta la punta de la cola)
  const bodyGeo = useMemo(() => {
    const bodyRings = [
      { z: 0.76, y: 0.90, rx: 0.015, ry: 0.015 },
      { z: 0.70, y: 0.91, rx: 0.024, ry: 0.022 },
      { z: 0.60, y: 0.92, rx: 0.034, ry: 0.032 },
      { z: 0.50, y: 0.94, rx: 0.048, ry: 0.045 },
      { z: 0.42, y: 0.95, rx: 0.054, ry: 0.052 },
      { z: 0.35, y: 0.91, rx: 0.052, ry: 0.065 },
      { z: 0.28, y: 0.84, rx: 0.055, ry: 0.082 },
      { z: 0.22, y: 0.76, rx: 0.062, ry: 0.105 },
      { z: 0.16, y: 0.68, rx: 0.078, ry: 0.138 },
      { z: 0.08, y: 0.60, rx: 0.092, ry: 0.162 },
      { z: -0.04, y: 0.62, rx: 0.088, ry: 0.145 },
      { z: -0.14, y: 0.66, rx: 0.072, ry: 0.108 },
      { z: -0.22, y: 0.69, rx: 0.068, ry: 0.095 },
      { z: -0.30, y: 0.68, rx: 0.082, ry: 0.105 },
      { z: -0.38, y: 0.63, rx: 0.072, ry: 0.088 },
      { z: -0.44, y: 0.58, rx: 0.032, ry: 0.032 },
      { z: -0.47, y: 0.42, rx: 0.016, ry: 0.016 },
      { z: -0.48, y: 0.26, rx: 0.011, ry: 0.011 },
      { z: -0.45, y: 0.18, rx: 0.007, ry: 0.007 },
      { z: -0.42, y: 0.22, rx: 0.004, ry: 0.004 },
    ];
    return createLoftedGeometry(bodyRings, 32, true);
  }, []);

  // Malla continua de las patas delanteras
  const frontLegGeo = useMemo(() => {
    const frontLegRings = [
      { z: 0.16, y: 0.65, rx: 0.048, ry: 0.065 },
      { z: 0.17, y: 0.52, rx: 0.036, ry: 0.042 },
      { z: 0.16, y: 0.42, rx: 0.028, ry: 0.032 },
      { z: 0.15, y: 0.33, rx: 0.022, ry: 0.026 },
      { z: 0.15, y: 0.22, rx: 0.017, ry: 0.020 },
      { z: 0.15, y: 0.10, rx: 0.015, ry: 0.017 },
      { z: 0.16, y: 0.04, rx: 0.015, ry: 0.018 },
      { z: 0.19, y: 0.012, rx: 0.022, ry: 0.038 },
    ];
    return createLoftedGeometry(frontLegRings, 20, true);
  }, []);

  // Mallas continuas de las patas traseras
  const hindLegGeoLeft = useMemo(() => {
    const hindLegRings = [
      { z: -0.33, y: 0.65, rx: 0.065, ry: 0.088 },
      { z: -0.31, y: 0.53, rx: 0.058, ry: 0.080 },
      { z: -0.27, y: 0.40, rx: 0.042, ry: 0.052 },
      { z: -0.35, y: 0.28, rx: 0.030, ry: 0.042 },
      { z: -0.41, y: 0.15, rx: 0.022, ry: 0.034 },
      { z: -0.40, y: 0.08, rx: 0.017, ry: 0.020 },
      { z: -0.38, y: 0.012, rx: 0.022, ry: 0.040 },
    ];
    return createLoftedGeometry(hindLegRings, 24, true);
  }, []);

  const hindLegGeoRight = useMemo(() => {
    const hindLegRings = [
      { z: -0.28, y: 0.65, rx: 0.065, ry: 0.088 },
      { z: -0.26, y: 0.53, rx: 0.058, ry: 0.080 },
      { z: -0.22, y: 0.40, rx: 0.042, ry: 0.052 },
      { z: -0.30, y: 0.28, rx: 0.030, ry: 0.042 },
      { z: -0.36, y: 0.15, rx: 0.022, ry: 0.034 },
      { z: -0.35, y: 0.08, rx: 0.017, ry: 0.020 },
      { z: -0.33, y: 0.012, rx: 0.022, ry: 0.040 },
    ];
    return createLoftedGeometry(hindLegRings, 24, true);
  }, []);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* 1. Malla continua del cuerpo completo */}
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#ba8c58" roughness={0.42} metalness={0.06} />
      </mesh>

      {/* 2. Patas delanteras blancas continuas */}
      {[-0.082, 0.082].map((lx) => (
        <mesh key={`f-leg-${lx}`} geometry={frontLegGeo} position={[lx, 0, 0]} castShadow>
          <meshStandardMaterial color="#fdfcf9" roughness={0.6} />
        </mesh>
      ))}

      {/* 3. Patas traseras musculadas continuas */}
      <mesh geometry={hindLegGeoLeft} position={[-0.105, 0, 0]} castShadow>
        <meshStandardMaterial color="#ba8c58" roughness={0.42} />
      </mesh>
      <mesh geometry={hindLegGeoRight} position={[0.105, 0, 0]} castShadow>
        <meshStandardMaterial color="#ba8c58" roughness={0.42} />
      </mesh>

      {/* Calcetines blancos en pies traseros */}
      {[-0.105, 0.105].map((hx, idx) => {
        const zOff = idx === 0 ? -0.05 : 0;
        return (
          <mesh key={`sock-${hx}`} position={[hx, 0.04, -0.34 + zOff]}>
            <cylinderGeometry args={[0.019, 0.022, 0.08, 14]} />
            <meshStandardMaterial color="#fdfcf9" roughness={0.6} />
          </mesh>
        );
      })}

      {/* 4. Ojos rasgados oscuros */}
      {[-0.045, 0.045].map((ex) => (
        <group key={`eye-${ex}`} position={[ex, 0.94, 0.50]}>
          <mesh scale={[0.38, 0.85, 1.2]}>
            <sphereGeometry args={[0.017, 16, 16]} />
            <meshStandardMaterial color="#140c08" roughness={0.08} metalness={0.8} />
          </mesh>
          <mesh position={[ex > 0 ? 0.007 : -0.007, 0.003, 0.004]}>
            <sphereGeometry args={[0.0035, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* 5. Orejas en rosa plegadas hacia atrás */}
      {[-0.048, 0.048].map((ox) => (
        <group
          key={`ear-${ox}`}
          position={[ox, 0.94, 0.40]}
          rotation={[0.38, ox > 0 ? -0.45 : 0.45, ox > 0 ? 0.4 : -0.4]}
        >
          <mesh position={[0, -0.04, -0.035]} rotation={[-0.28, 0, 0]} scale={[0.9, 1.25, 0.32]}>
            <sphereGeometry args={[0.034, 14, 14]} />
            <meshStandardMaterial color="#32261e" roughness={0.55} />
          </mesh>
        </group>
      ))}

      {/* 6. Collar tradicional de cuero granate con herraje plateado */}
      <mesh position={[0, 0.85, 0.33]} rotation={[0.95, 0, 0]} scale={[1, 1, 1.3]}>
        <torusGeometry args={[0.076, 0.016, 16, 32]} />
        <meshStandardMaterial color="#3d1714" roughness={0.35} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.79, 0.41]}>
        <boxGeometry args={[0.032, 0.035, 0.014]} />
        <meshStandardMaterial color="#d8dde3" metalness={0.95} roughness={0.15} />
      </mesh>
    </group>
  );
}
