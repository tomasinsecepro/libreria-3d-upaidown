import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface TanqueAustraliano3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  waterLevelPercent?: number; // 0 a 100%
  radius?: number;
  height?: number;
}

export function TanqueAustraliano3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  waterLevelPercent = 85,
  radius = 4.2,
  height = 1.85,
}: TanqueAustraliano3DProps) {
  const waterRef = useRef<THREE.Mesh>(null);

  // Generación paramétrica de la chapa ondulada galvanizada con relieve físico real hasta arriba
  const { corrugatedGeo, linerGeo } = useMemo(() => {
    const radialSegs = 120;
    const heightSegs = 160;
    const waves = 18;
    const waveAmp = 0.038;

    // 1. Malla exterior de chapa ondulada (100% de la altura de la pared)
    const pos: number[] = [];
    const norm: number[] = [];
    const uvs: number[] = [];
    const idx: number[] = [];

    for (let i = 0; i <= heightSegs; i++) {
      const v = i / heightSegs;
      const y = v * height;
      const wave = Math.sin(v * waves * Math.PI * 2);
      const r = radius + wave * waveAmp;

      // Derivada para cálculo de normales exactas en la onda
      const dr_dy = (waveAmp * (waves * Math.PI * 2) * Math.cos(v * waves * Math.PI * 2)) / height;

      for (let j = 0; j <= radialSegs; j++) {
        const u = j / radialSegs;
        const phi = u * Math.PI * 2;
        const cosP = Math.cos(phi);
        const sinP = Math.sin(phi);

        pos.push(cosP * r, y, sinP * r);

        // Vector normal perturbado por la pendiente de la onda
        const nx = cosP;
        const ny = -dr_dy;
        const nz = sinP;
        const len = Math.hypot(nx, ny, nz) || 1;
        norm.push(nx / len, ny / len, nz / len);

        uvs.push(u * 8, v * waves);
      }
    }

    for (let i = 0; i < heightSegs; i++) {
      for (let j = 0; j < radialSegs; j++) {
        const a = i * (radialSegs + 1) + j;
        const b = (i + 1) * (radialSegs + 1) + j;
        const c = (i + 1) * (radialSegs + 1) + (j + 1);
        const d = i * (radialSegs + 1) + (j + 1);
        idx.push(a, b, d);
        idx.push(b, c, d);
      }
    }

    const cGeo = new THREE.BufferGeometry();
    cGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    cGeo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
    cGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    cGeo.setIndex(idx);

    // 2. Malla interior del liner azul (estricto interior estanco)
    const linerRadius = radius - 0.04;
    const lGeo = new THREE.CylinderGeometry(linerRadius, linerRadius, height, 96, 1, true);
    lGeo.translate(0, height / 2, 0);

    return { corrugatedGeo: cGeo, linerGeo: lGeo };
  }, [radius, height]);

  // Animación del agua
  useFrame(({ clock }) => {
    if (waterRef.current) {
      const t = clock.elapsedTime;
      const baseH = (waterLevelPercent / 100) * height * 0.94;
      waterRef.current.position.y = baseH + Math.sin(t * 1.5) * 0.008;
    }
  });

  const numPanels = 8;
  const panelSeams = useMemo(() => {
    return Array.from({ length: numPanels }).map((_, i) => (i * Math.PI * 2) / numPanels);
  }, [numPanels]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. Base / Solera circular de hormigón */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <cylinderGeometry args={[radius + 0.22, radius + 0.22, 0.12, 64]} />
        <meshStandardMaterial color="#88857f" roughness={0.92} metalness={0.05} />
      </mesh>

      {/* 2. Pared de chapa ondulada galvanizada completa hasta arriba */}
      <mesh geometry={corrugatedGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#a3abb2"
          metalness={0.92}
          roughness={0.32}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Costuras verticales de unión de virolas hasta la coronación */}
      {panelSeams.map((angle, idx) => {
        const x = Math.cos(angle) * (radius + 0.04);
        const z = Math.sin(angle) * (radius + 0.04);
        return (
          <group key={`seam-${idx}`} position={[x, height / 2, z]} rotation={[0, -angle, 0]}>
            {/* Pletina vertical galvanizada */}
            <mesh castShadow>
              <boxGeometry args={[0.06, height, 0.015]} />
              <meshStandardMaterial color="#7f888e" metalness={0.88} roughness={0.35} />
            </mesh>
            {/* Pernos de alta resistencia a lo largo de toda la costura */}
            {Array.from({ length: 11 }).map((_, bIdx) => (
              <mesh
                key={`bolt-${bIdx}`}
                position={[0, -height / 2 + 0.1 + bIdx * (height / 10.5), 0.012]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.018, 0.018, 0.015, 6]} />
                <meshStandardMaterial color="#cfd8dc" metalness={0.95} roughness={0.2} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* 4. Remate / Perfil perimetral superior de chapa galvanizada */}
      <mesh position={[0, height + 0.008, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[radius, 0.035, 12, 96]} />
        <meshStandardMaterial color="#95a0a8" roughness={0.28} metalness={0.92} />
      </mesh>

      {/* 5. Liner interior azul impermeable (estrictamente interior) */}
      <mesh geometry={linerGeo}>
        <meshStandardMaterial
          color="#0d6efd"
          roughness={0.42}
          metalness={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* 6. Fondo interior azul del liner */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius - 0.04, 64]} />
        <meshStandardMaterial color="#0854c7" roughness={0.5} />
      </mesh>

      {/* 7. Espejo de agua reflectante */}
      <mesh
        ref={waterRef}
        position={[0, (waterLevelPercent / 100) * height * 0.94, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[radius - 0.06, 64]} />
        <meshStandardMaterial
          color="#0077b6"
          roughness={0.1}
          metalness={0.25}
          transparent={true}
          opacity={0.88}
        />
      </mesh>

      {/* 8. Brida inferior de succión / vaciado con válvula de mariposa */}
      <group position={[radius + 0.12, 0.35, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.28, 20]} />
          <meshStandardMaterial color="#455a64" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.04, 20]} />
          <meshStandardMaterial color="#37474f" metalness={0.9} roughness={0.25} />
        </mesh>
        {/* Volante de maniobra manual en rojo */}
        <mesh position={[0.06, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.015, 8, 20]} />
          <meshStandardMaterial color="#d32f2f" roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}
