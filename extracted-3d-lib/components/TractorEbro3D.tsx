import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

export interface TractorEbro3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  plowRaised?: boolean; // Eleva o baja el apero de labranza
  engineVibration?: boolean; // Efecto sutil de motor diésel encendido
}

// Colores míticos del Tractor Ebro
const ebroBlue = '#0d5ba6';
const ebroBlueDark = '#093f75';
const creamRim = '#ede8da';
const tireRubber = '#181b19';
const darkChassis = '#222527';
const chrome = '#c0c8cc';
const exhaustSteel = '#2b2d2f';
const glass = '#234455';
const plowFrameRed = '#b8261e';
const plowSteel = '#85929e';

export function TractorEbro3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  plowRaised = false,
  engineVibration = true,
}: TractorEbro3DProps) {
  const rootRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (rootRef.current && engineVibration) {
      // Vibración característica del motor diésel de 4 cilindros
      rootRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 32) * 0.003;
    }
  });

  return (
    <group ref={rootRef} position={position} rotation={rotation} scale={scale}>
      {/* 1. CHASIS Y BLOQUE DE TRANSMISIÓN */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.55, 2.8]} />
        <meshStandardMaterial color={darkChassis} metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.65, 0.8]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.6, 1.2]} />
        <meshStandardMaterial color={darkChassis} metalness={0.8} roughness={0.4} />
      </mesh>

      {/* 2. CAPÓ EBRO AZUL CLÁSICO */}
      <group position={[0, 1.15, -0.6]}>
        {/* Capó principal */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.92, 0.65, 1.95]} />
          <meshStandardMaterial color={ebroBlue} metalness={0.45} roughness={0.32} />
        </mesh>
        {/* Resalte superior del capó */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.65, 0.08, 1.85]} />
          <meshStandardMaterial color={ebroBlueDark} metalness={0.5} roughness={0.35} />
        </mesh>

        {/* Parrilla delantera */}
        <group position={[0, 0, -1.0]}>
          <mesh>
            <boxGeometry args={[0.84, 0.58, 0.06]} />
            <meshStandardMaterial color={darkChassis} />
          </mesh>
          {/* Franjas cromadas del radiador */}
          {[-0.2, -0.1, 0, 0.1, 0.2].map((y) => (
            <mesh key={y} position={[0, y, 0.02]}>
              <boxGeometry args={[0.72, 0.02, 0.04]} />
              <meshStandardMaterial color={chrome} metalness={0.95} roughness={0.15} />
            </mesh>
          ))}
          {/* Logo / Emblema EBRO */}
          <mesh position={[0, 0.16, 0.035]}>
            <boxGeometry args={[0.38, 0.09, 0.04]} />
            <meshStandardMaterial color={creamRim} />
          </mesh>
          <mesh position={[0, 0.16, 0.04]}>
            <boxGeometry args={[0.32, 0.06, 0.04]} />
            <meshStandardMaterial color={ebroBlueDark} />
          </mesh>
          {/* Faros dobles */}
          {[-0.3, 0.3].map((x) => (
            <group key={x} position={[x, 0.02, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh>
                <cylinderGeometry args={[0.1, 0.1, 0.06, 20]} />
                <meshStandardMaterial color={chrome} metalness={0.9} />
              </mesh>
              <mesh position={[0, 0.02, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.06, 20]} />
                <meshStandardMaterial color="#ffffff" emissive="#fff3cc" emissiveIntensity={0.8} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Tubo de escape vertical */}
        <group position={[-0.36, 0.32, -0.4]}>
          <mesh position={[0, 0.67, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1.35, 16]} />
            <meshStandardMaterial color={exhaustSteel} metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.35, 16]} />
            <meshStandardMaterial color={exhaustSteel} metalness={0.6} roughness={0.5} />
          </mesh>
        </group>

        {/* Filtro de aire ciclónico */}
        <group position={[0.36, 0.32, -0.6]}>
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.85, 14]} />
            <meshStandardMaterial color={darkChassis} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.18, 18]} />
            <meshStandardMaterial color={darkChassis} />
          </mesh>
          <mesh position={[0, 0.94, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.04, 18]} />
            <meshStandardMaterial color={creamRim} />
          </mesh>
        </group>
      </group>

      {/* 3. PUESTO DE MANDO Y CABINA */}
      <group position={[0, 1.1, 0.7]}>
        {/* Plataforma */}
        <mesh position={[0, -0.15, 0]} receiveShadow>
          <boxGeometry args={[1.4, 0.1, 1.3]} />
          <meshStandardMaterial color={darkChassis} />
        </mesh>
        {/* Asiento */}
        <group position={[0, 0.15, 0.2]}>
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.55, 0.08, 0.5]} />
            <meshStandardMaterial color={darkChassis} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.4, 0.22]}>
            <boxGeometry args={[0.55, 0.45, 0.08]} />
            <meshStandardMaterial color={darkChassis} roughness={0.9} />
          </mesh>
        </group>
        {/* Volante de dirección */}
        <group position={[0, 0.25, -0.35]}>
          <mesh position={[0, 0.22, 0]} rotation={[-0.4, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.55, 12]} />
            <meshStandardMaterial color={darkChassis} />
          </mesh>
          <mesh position={[0, 0.46, -0.1]} rotation={[1.17, 0, 0]}>
            <torusGeometry args={[0.2, 0.024, 8, 24]} />
            <meshStandardMaterial color={darkChassis} roughness={0.8} />
          </mesh>
        </group>
        {/* Arco de seguridad antivuelco ROPS con techo */}
        <group>
          {[-0.72, 0.72].map((x) =>
            [-0.45, 0.45].map((z) => (
              <mesh key={`${x}-${z}`} position={[x, 0.7, z]} castShadow>
                <boxGeometry args={[0.08, 1.55, 0.08]} />
                <meshStandardMaterial color={ebroBlueDark} metalness={0.5} roughness={0.35} />
              </mesh>
            ))
          )}
          {/* Techo crema */}
          <mesh position={[0, 1.54, 0]} castShadow>
            <boxGeometry args={[1.65, 0.09, 1.25]} />
            <meshStandardMaterial color={creamRim} metalness={0.25} roughness={0.4} />
          </mesh>
          {/* Cristales tintados */}
          <mesh position={[0, 0.95, -0.45]}>
            <boxGeometry args={[1.36, 0.85, 0.02]} />
            <meshStandardMaterial color={glass} transparent opacity={0.55} />
          </mesh>
        </group>
        {/* Guardabarros traseros con pilotos */}
        {[-0.88, 0.88].map((x) => (
          <group key={x} position={[x, 0.4, 0.2]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.42, 0.08, 1.45]} />
              <meshStandardMaterial color={ebroBlue} metalness={0.45} roughness={0.32} />
            </mesh>
            <mesh position={[0, 0.15, 0.73]}>
              <boxGeometry args={[0.12, 0.16, 0.04]} />
              <meshStandardMaterial color="#d11a1a" emissive="#aa1010" emissiveIntensity={0.6} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. RUEDAS DELANTERAS */}
      <mesh position={[0, 0.46, -1.25]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 1.6, 12]} />
        <meshStandardMaterial color={darkChassis} />
      </mesh>
      {[-0.86, 0.86].map((x) => (
        <group key={x} position={[x, 0.46, -1.25]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.46, 0.46, 0.24, 30]} />
            <meshStandardMaterial color={tireRubber} roughness={0.88} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.28, 0.28, 0.26, 24]} />
            <meshStandardMaterial color={creamRim} roughness={0.4} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.1, 0.1, 0.28, 16]} />
            <meshStandardMaterial color={ebroBlue} />
          </mesh>
        </group>
      ))}

      {/* 5. RUEDAS TRASERAS GIGANTES CON TACOS AGRÍCOLAS */}
      {[-1.08, 1.08].map((x) => (
        <group key={x} position={[x, 0.82, 0.88]} rotation={[0, 0, Math.PI / 2]}>
          {/* Neumático grande */}
          <mesh castShadow>
            <cylinderGeometry args={[0.85, 0.85, 0.44, 36]} />
            <meshStandardMaterial color={tireRubber} roughness={0.88} />
          </mesh>
          {/* Llanta crema profunda */}
          <mesh>
            <cylinderGeometry args={[0.54, 0.54, 0.4, 28]} />
            <meshStandardMaterial color={creamRim} roughness={0.4} />
          </mesh>
          {/* Buje central */}
          <mesh>
            <cylinderGeometry args={[0.18, 0.18, 0.46, 16]} />
            <meshStandardMaterial color={darkChassis} />
          </mesh>
          {/* Tacos de tracción en la banda de rodadura */}
          {Array.from({ length: 24 }).map((_, i) => (
            <mesh key={i} position={[0, Math.cos((i / 24) * Math.PI * 2) * 0.86, Math.sin((i / 24) * Math.PI * 2) * 0.86]}>
              <boxGeometry args={[0.38, 0.07, 0.12]} />
              <meshStandardMaterial color={tireRubber} roughness={0.88} />
            </mesh>
          ))}
        </group>
      ))}

      {/* 6. APERO DE LABRANZA (ARADO DE VERTEDERAS TRASERO) */}
      <group position={[0, plowRaised ? 0.85 : 0.45, 1.6]}>
        {/* Brazos hidráulicos del enganche tripuntal */}
        {[-0.32, 0.32].map((x) => (
          <mesh key={x} position={[x, 0.05, 0.35]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.8, 12]} />
            <meshStandardMaterial color={darkChassis} />
          </mesh>
        ))}
        {/* Bastidor diagonal del arado en rojo agrícola */}
        <mesh position={[0.2, 0.1, 0.65]} rotation={[0.4, -0.3, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.065, 1.8, 16]} />
          <meshStandardMaterial color={plowFrameRed} metalness={0.5} roughness={0.35} />
        </mesh>
        {/* Cuerpos de arado (vertederas de acero de labranza) */}
        {[0, 1, 2].map((b) => (
          <group key={b} position={[0.05 + b * 0.22, 0.2 - b * 0.08, 0.2 + b * 0.55]}>
            {/* Timón vertical */}
            <mesh position={[0, -0.15, 0]} castShadow>
              <boxGeometry args={[0.06, 0.65, 0.1]} />
              <meshStandardMaterial color={plowFrameRed} />
            </mesh>
            {/* Reja cortadora inferior de acero */}
            <mesh position={[0.08, -0.42, -0.1]}>
              <boxGeometry args={[0.03, 0.15, 0.42]} />
              <meshStandardMaterial color={plowSteel} metalness={0.85} roughness={0.25} />
            </mesh>
            {/* Vertedera helicoidal que voltea el surco */}
            <mesh position={[0.22, -0.32, 0.08]} rotation={[-0.3, 0.45, 0.35]} castShadow>
              <boxGeometry args={[0.38, 0.38, 0.04]} />
              <meshStandardMaterial color={plowSteel} metalness={0.85} roughness={0.25} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
