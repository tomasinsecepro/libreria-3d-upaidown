import React, { useRef, useMemo } from 'react';
import type { Group } from 'three';
import * as THREE from 'three';

export interface Liebre3DProps {
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
    const frontCenterIdx = Math.floor(positions.length / 3);
    const firstRing = rings[0];
    positions.push(firstRing.x || 0, firstRing.y || 0, firstRing.z || 0);
    uvs.push(0.5, 0);

    for (let j = 0; j < numRad; j++) {
      indices.push(frontCenterIdx, j + 1, j);
    }

    const backCenterIdx = Math.floor(positions.length / 3);
    const lastRing = rings[numRings - 1];
    positions.push(lastRing.x || 0, lastRing.y || 0, lastRing.z || 0);
    uvs.push(0.5, 1);

    const lastRingStart = (numRings - 1) * (numRad + 1);
    for (let j = 0; j < numRad; j++) {
      indices.push(backCenterIdx, lastRingStart + j, lastRingStart + j + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Modelo 3D hiperrealista esculpido continuo de Liebre Ibérica (Lepus granatensis) en Salto a 70 km/h
 * Malla orgánica continua sin piezas primitivas separadas, con manto agutí, vientre blanco nítido,
 * patas hiperextendidas en carrera, orejas aerodinámicas con puntas negras y ojos dorados ardientes.
 */
export function Liebre3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: Liebre3DProps) {
  const groupRef = useRef<Group>(null);

  // Malla continua del cuerpo completo extendido en salto aerodinámico
  const bodyGeo = useMemo(() => {
    const bodyRings = [
      { z: 0.44, y: 0.58, rx: 0.014, ry: 0.013 },
      { z: 0.40, y: 0.59, rx: 0.024, ry: 0.022 },
      { z: 0.34, y: 0.61, rx: 0.035, ry: 0.032 },
      { z: 0.28, y: 0.625, rx: 0.052, ry: 0.046 },
      { z: 0.22, y: 0.635, rx: 0.056, ry: 0.052 },
      { z: 0.16, y: 0.615, rx: 0.054, ry: 0.062 },
      { z: 0.10, y: 0.585, rx: 0.056, ry: 0.076 },
      { z: 0.04, y: 0.565, rx: 0.066, ry: 0.098 },
      { z: -0.02, y: 0.555, rx: 0.078, ry: 0.122 },
      { z: -0.09, y: 0.560, rx: 0.084, ry: 0.128 },
      { z: -0.16, y: 0.575, rx: 0.082, ry: 0.122 },
      { z: -0.23, y: 0.595, rx: 0.078, ry: 0.114 },
      { z: -0.30, y: 0.585, rx: 0.084, ry: 0.112 },
      { z: -0.38, y: 0.555, rx: 0.076, ry: 0.095 },
      { z: -0.45, y: 0.515, rx: 0.042, ry: 0.048 },
      { z: -0.50, y: 0.490, rx: 0.022, ry: 0.024 },
      { z: -0.54, y: 0.475, rx: 0.008, ry: 0.009 },
    ];
    return createLoftedGeometry(bodyRings, 36, true);
  }, []);

  // Pata delantera derecha en zancada aerodinámica
  const fLegRightGeo = useMemo(() => {
    const rings = [
      { z: 0.06, y: 0.52, rx: 0.036, ry: 0.046 },
      { z: 0.12, y: 0.44, rx: 0.026, ry: 0.034 },
      { z: 0.18, y: 0.37, rx: 0.020, ry: 0.025 },
      { z: 0.25, y: 0.31, rx: 0.016, ry: 0.020 },
      { z: 0.32, y: 0.25, rx: 0.014, ry: 0.017 },
      { z: 0.39, y: 0.20, rx: 0.015, ry: 0.018 },
      { z: 0.45, y: 0.16, rx: 0.018, ry: 0.028 },
    ];
    return createLoftedGeometry(rings, 22, true);
  }, []);

  // Pata delantera izquierda en compás de carrera
  const fLegLeftGeo = useMemo(() => {
    const rings = [
      { z: 0.06, y: 0.50, rx: 0.036, ry: 0.046 },
      { z: 0.10, y: 0.42, rx: 0.025, ry: 0.032 },
      { z: 0.15, y: 0.35, rx: 0.019, ry: 0.024 },
      { z: 0.21, y: 0.29, rx: 0.015, ry: 0.019 },
      { z: 0.27, y: 0.24, rx: 0.014, ry: 0.017 },
      { z: 0.33, y: 0.20, rx: 0.015, ry: 0.018 },
      { z: 0.38, y: 0.17, rx: 0.018, ry: 0.026 },
    ];
    return createLoftedGeometry(rings, 22, true);
  }, []);

  // Pata trasera derecha hiperextendida con articulación real en Z
  const hLegRightGeo = useMemo(() => {
    const rings = [
      { z: -0.20, y: 0.57, rx: 0.072, ry: 0.092 },
      { z: -0.16, y: 0.50, rx: 0.066, ry: 0.084 },
      { z: -0.14, y: 0.42, rx: 0.046, ry: 0.052 }, // Rodilla adelantada
      { z: -0.24, y: 0.44, rx: 0.038, ry: 0.044 },
      { z: -0.36, y: 0.46, rx: 0.028, ry: 0.034 },
      { z: -0.46, y: 0.48, rx: 0.022, ry: 0.026 },
      { z: -0.54, y: 0.49, rx: 0.019, ry: 0.022 }, // Corvejón seco alto
      { z: -0.63, y: 0.42, rx: 0.017, ry: 0.019 },
      { z: -0.72, y: 0.34, rx: 0.016, ry: 0.018 },
      { z: -0.80, y: 0.27, rx: 0.016, ry: 0.022 },
      { z: -0.87, y: 0.21, rx: 0.014, ry: 0.018 },
      { z: -0.92, y: 0.17, rx: 0.007, ry: 0.008 },
    ];
    return createLoftedGeometry(rings, 28, true);
  }, []);

  // Pata trasera izquierda ligeramente más alta en cadencia
  const hLegLeftGeo = useMemo(() => {
    const rings = [
      { z: -0.24, y: 0.60, rx: 0.072, ry: 0.092 },
      { z: -0.20, y: 0.53, rx: 0.066, ry: 0.084 },
      { z: -0.18, y: 0.45, rx: 0.046, ry: 0.052 },
      { z: -0.28, y: 0.47, rx: 0.038, ry: 0.044 },
      { z: -0.40, y: 0.49, rx: 0.028, ry: 0.034 },
      { z: -0.50, y: 0.51, rx: 0.022, ry: 0.026 },
      { z: -0.58, y: 0.52, rx: 0.019, ry: 0.022 },
      { z: -0.67, y: 0.45, rx: 0.017, ry: 0.019 },
      { z: -0.76, y: 0.37, rx: 0.016, ry: 0.018 },
      { z: -0.84, y: 0.30, rx: 0.016, ry: 0.022 },
      { z: -0.91, y: 0.24, rx: 0.014, ry: 0.018 },
      { z: -0.96, y: 0.20, rx: 0.007, ry: 0.008 },
    ];
    return createLoftedGeometry(rings, 28, true);
  }, []);

  // Oreja esculpida continua en cuchara (sin cilindros ni conos)
  const earGeo = useMemo(() => {
    const rings = [
      { z: 0.00, y: 0.00, rx: 0.016, ry: 0.014 },
      { z: 0.01, y: 0.03, rx: 0.022, ry: 0.011 },
      { z: 0.02, y: 0.07, rx: 0.032, ry: 0.009 },
      { z: 0.03, y: 0.12, rx: 0.038, ry: 0.007 }, // Cuchara amplia
      { z: 0.03, y: 0.16, rx: 0.034, ry: 0.006 },
      { z: 0.02, y: 0.20, rx: 0.024, ry: 0.005 },
      { z: 0.01, y: 0.23, rx: 0.010, ry: 0.004 },
      { z: 0.00, y: 0.25, rx: 0.003, ry: 0.003 },
    ];
    return createLoftedGeometry(rings, 24, true);
  }, []);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* 1. Malla continua del cuerpo completo con vientre blanco */}
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#af7943" roughness={0.60} metalness={0.03} />
      </mesh>

      {/* 2. Patas delanteras en zancada continua bajo la barbilla */}
      <mesh geometry={fLegRightGeo} position={[0.062, 0, 0]} castShadow>
        <meshStandardMaterial color="#b88653" roughness={0.65} />
      </mesh>
      <mesh geometry={fLegLeftGeo} position={[-0.062, 0, 0]} castShadow>
        <meshStandardMaterial color="#b88653" roughness={0.65} />
      </mesh>

      {/* Puntas de patas delanteras blanquecinas */}
      <mesh position={[0.062, 0.155, 0.45]} scale={[0.85, 0.55, 1.25]} castShadow>
        <sphereGeometry args={[0.016, 12, 12]} />
        <meshStandardMaterial color="#faf8f4" roughness={0.75} />
      </mesh>
      <mesh position={[-0.062, 0.165, 0.38]} scale={[0.85, 0.55, 1.25]} castShadow>
        <sphereGeometry args={[0.016, 12, 12]} />
        <meshStandardMaterial color="#faf8f4" roughness={0.75} />
      </mesh>

      {/* 3. Patas traseras propulsoras hiperextendidas continuas en 'Z' */}
      <mesh geometry={hLegRightGeo} position={[0.092, 0, 0]} castShadow>
        <meshStandardMaterial color="#9d6938" roughness={0.65} />
      </mesh>
      <mesh geometry={hLegLeftGeo} position={[-0.092, 0, 0]} castShadow>
        <meshStandardMaterial color="#9d6938" roughness={0.65} />
      </mesh>

      {/* 4. Ojos laterales dorados-ámbar con anillo periocular blanco y brillo */}
      {[-0.052, 0.052].map((ex) => (
        <group key={`eye-${ex}`} position={[ex, 0.628, 0.275]}>
          {/* Anillo periocular blanco */}
          <mesh scale={[0.36, 1.15, 1.30]}>
            <sphereGeometry args={[0.024, 18, 18]} />
            <meshStandardMaterial color="#faf8f4" roughness={0.8} />
          </mesh>
          {/* Iris ámbar ardiente */}
          <mesh position={[ex > 0 ? 0.005 : -0.005, 0, 0]}>
            <sphereGeometry args={[0.019, 20, 20]} />
            <meshStandardMaterial color="#d97e14" roughness={0.06} metalness={0.60} />
          </mesh>
          {/* Pupila horizontal oscura */}
          <mesh position={[ex > 0 ? 0.012 : -0.012, 0, 0]} scale={[0.40, 0.70, 1.20]}>
            <sphereGeometry args={[0.012, 16, 16]} />
            <meshBasicMaterial color="#060606" />
          </mesh>
          {/* Reflejo corneal */}
          <mesh position={[ex > 0 ? 0.016 : -0.016, 0.006, 0.006]}>
            <sphereGeometry args={[0.004, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* 5. Orejas aerodinámicas en cuchara con puntas negras azabache */}
      {[-0.034, 0.034].map((ox) => (
        <group
          key={`ear-${ox}`}
          position={[ox, 0.65, 0.20]}
          rotation={[-0.48, ox > 0 ? -0.18 : 0.18, ox > 0 ? 0.15 : -0.15]}
        >
          {/* Malla continua de la oreja en cuchara */}
          <mesh geometry={earGeo} castShadow>
            <meshStandardMaterial color="#aa7747" roughness={0.65} />
          </mesh>
          {/* Punta negra azabache esculpida en el ápice */}
          <mesh position={[0, 0.21, 0.01]} scale={[0.9, 0.9, 0.8]}>
            <sphereGeometry args={[0.02, 16, 16]} />
            <meshStandardMaterial color="#0d0d0d" roughness={0.55} />
          </mesh>
        </group>
      ))}

      {/* 6. Bigotes / vibrisas táctiles en el viento */}
      {[-1, 1].map((side) =>
        [-0.012, -0.004, 0.004, 0.012].map((wy, idx) => (
          <mesh
            key={`whisk-${side}-${idx}`}
            position={[side * 0.032, 0.585 + wy, 0.38]}
            rotation={[wy * 6, side * (0.85 + idx * 0.08), -0.18]}
          >
            <cylinderGeometry args={[0.0008, 0.0004, 0.12, 5]} />
            <meshBasicMaterial color={idx % 2 === 0 ? '#ffffff' : '#222222'} />
          </mesh>
        ))
      )}
    </group>
  );
}
