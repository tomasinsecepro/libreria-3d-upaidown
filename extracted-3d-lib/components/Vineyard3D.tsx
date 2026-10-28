import React, { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export interface Vineyard3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  rows?: number;
  vinesPerRow?: number;
  windBreeze?: boolean;
}

export function Vineyard3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  rows = 3,
  vinesPerRow = 6,
  windBreeze = true,
}: Vineyard3DProps) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current && windBreeze) {
      const t = clock.elapsedTime;
      // Suave balanceo del follaje de la vid con el viento
      groupRef.current.children.forEach((row, i) => {
        row.rotation.z = Math.sin(t * 1.3 + i) * 0.005;
      });
    }
  });

  const rowSpacing = 2.4; // 2.4 metros entre hileras (marco de plantación de espaldera)
  const vineSpacing = 1.2; // 1.2 metros entre cepas
  const postHeight = 1.8;

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <Suspense fallback={null}>
        {/* Suelo de viñedo albariza / arcillo-arenoso con surcos */}
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[vinesPerRow * vineSpacing + 4, 0.1, rows * rowSpacing + 3]} />
          <meshStandardMaterial color="#6e5c46" roughness={0.95} />
        </mesh>

        {Array.from({ length: rows }).map((_, rIdx) => {
          const rowZ = (rIdx - (rows - 1) / 2) * rowSpacing;

          return (
            <group key={`row-${rIdx}`} position={[0, 0, rowZ]}>
              {/* Alambres tensores galvanizados de espaldera */}
              {[0.6, 1.0, 1.4, 1.7].map((wireY) => (
                <mesh key={`wire-${wireY}`} position={[0, wireY, 0]}>
                  <cylinderGeometry args={[0.004, 0.004, (vinesPerRow + 1) * vineSpacing, 8]} />
                  <meshStandardMaterial color="#c0c8cf" metalness={0.9} roughness={0.2} />
                </mesh>
              ))}

              {/* Postes metálicos de acero galvanizado con perfil ranurado */}
              {Array.from({ length: vinesPerRow + 1 }).map((_, pIdx) => {
                const posX = (pIdx - vinesPerRow / 2) * vineSpacing;
                return (
                  <group key={`post-${pIdx}`} position={[posX, postHeight / 2, 0]}>
                    <mesh castShadow receiveShadow>
                      <boxGeometry args={[0.05, postHeight, 0.06]} />
                      <meshStandardMaterial color="#8e9aa5" metalness={0.8} roughness={0.3} />
                    </mesh>
                    {/* Anclaje y placa superior */}
                    <mesh position={[0, postHeight / 2 - 0.01, 0]}>
                      <boxGeometry args={[0.07, 0.02, 0.08]} />
                      <meshStandardMaterial color="#6a7783" metalness={0.85} roughness={0.35} />
                    </mesh>
                  </group>
                );
              })}

              {/* Cepas de vid leñosas (Cordón Royat doble) con racimos de uva */}
              {Array.from({ length: vinesPerRow }).map((_, vIdx) => {
                const vineX = (vIdx - (vinesPerRow - 1) / 2) * vineSpacing;
                return (
                  <group key={`vine-${vIdx}`} position={[vineX, 0, 0]}>
                    {/* Tronco añoso retorcido */}
                    <mesh position={[0, 0.3, 0]} castShadow>
                      <cylinderGeometry args={[0.035, 0.055, 0.6, 8]} />
                      <meshStandardMaterial color="#3d2c20" roughness={0.95} />
                    </mesh>
                    {/* Brazo horizontal derecho */}
                    <mesh position={[0.25, 0.6, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
                      <cylinderGeometry args={[0.025, 0.03, 0.5, 8]} />
                      <meshStandardMaterial color="#4a3627" roughness={0.9} />
                    </mesh>
                    {/* Brazo horizontal izquierdo */}
                    <mesh position={[-0.25, 0.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                      <cylinderGeometry args={[0.025, 0.03, 0.5, 8]} />
                      <meshStandardMaterial color="#4a3627" roughness={0.9} />
                    </mesh>

                    {/* Sarmientos verticales ascendentes */}
                    {[-0.36, -0.18, 0, 0.18, 0.36].map((sx, sIdx) => (
                      <mesh key={`shoot-${sIdx}`} position={[sx, 1.18, (sIdx % 2 === 0 ? 0.02 : -0.02)]} castShadow>
                        <cylinderGeometry args={[0.008, 0.013, 1.0, 6]} />
                        <meshStandardMaterial color="#4a3627" roughness={0.9} />
                      </mesh>
                    ))}

                    {/* Follaje realista con hojas de parra orientadas orgánicamente (sin bloques cúbicos) */}
                    {[-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45].flatMap((lx, i) =>
                      [0.85, 1.15, 1.45, 1.7].map((ly, j) => {
                        const seed = i * 7 + j * 13;
                        const lz = (seed % 2 === 0 ? 0.18 : -0.18) + (Math.sin(seed) * 0.06);
                        return (
                          <mesh
                            key={`leaf-${i}-${j}`}
                            position={[lx + Math.sin(seed * 2) * 0.08, ly, lz]}
                            rotation={[0.35 * Math.sin(seed * 3), 0.5 * Math.cos(seed * 4), 0.25 * Math.sin(seed * 5)]}
                            castShadow
                          >
                            <planeGeometry args={[0.24, 0.27]} />
                            <meshStandardMaterial color={j > 2 ? '#58a82b' : '#3d861e'} roughness={0.65} side={2} />
                          </mesh>
                        );
                      })
                    )}

                    {/* Racimos de uvas Tempranillo colgantes */}
                    {[-0.26, 0, 0.26].map((grapeX, gIdx) => (
                      <group key={`grape-${gIdx}`} position={[grapeX, 0.68, (gIdx % 2 === 0 ? 0.12 : -0.12)]}>
                        <mesh castShadow>
                          <coneGeometry args={[0.055, 0.16, 12]} rotation={[Math.PI, 0, 0]} />
                          <meshStandardMaterial color="#1c102b" roughness={0.22} metalness={0.18} />
                        </mesh>
                      </group>
                    ))}
                  </group>
                );
              })}
            </group>
          );
        })}
      </Suspense>
    </group>
  );
}
