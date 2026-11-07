import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface BombaPresionVertical3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  powerKw?: number;
  stages?: number;
  running?: boolean;
}

export function BombaPresionVertical3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  powerKw = 18.5,
  stages = 14,
  running = true,
}: BombaPresionVertical3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Micro-vibración realista de operación cuando la bomba está en marcha
  useFrame(({ clock }) => {
    if (groupRef.current && running) {
      const t = clock.elapsedTime * 65;
      groupRef.current.position.x = position[0] + Math.sin(t) * 0.0004;
      groupRef.current.position.z = position[2] + Math.cos(t * 1.2) * 0.0004;
    }
  });

  // Materiales PBR de alta definición
  const {
    motorBlueMat,
    stainlessMat,
    stainlessSleeveMat,
    darkCastIronMat,
    blackMat,
    guardMat,
    boltMat,
    brassMat,
    nameplateMat,
  } = useMemo(() => {
    // 1. Azul motor eléctrico industrial
    const mBlue = new THREE.MeshStandardMaterial({
      color: 0x165bb6,
      roughness: 0.35,
      metalness: 0.22,
    });

    // 2. Acero inoxidable cepillado para camisa hidráulica (textura vertical fina)
    const cvS = document.createElement('canvas');
    cvS.width = 256;
    cvS.height = 512;
    const ctxS = cvS.getContext('2d')!;
    ctxS.fillStyle = '#d5dde4';
    ctxS.fillRect(0, 0, 256, 512);
    // Rayas verticales de satinado
    for (let x = 0; x < 256; x += 2) {
      const v = Math.random() * 20 - 10;
      ctxS.fillStyle = `rgba(255, 255, 255, ${0.08 + Math.random() * 0.1})`;
      ctxS.fillRect(x, 0, 1, 512);
    }
    const sleeveTex = new THREE.CanvasTexture(cvS);
    sleeveTex.wrapS = THREE.RepeatWrapping;
    sleeveTex.wrapT = THREE.RepeatWrapping;
    sleeveTex.repeat.set(4, 1);

    const sSleeve = new THREE.MeshStandardMaterial({
      color: 0xd8e1e8,
      map: sleeveTex,
      metalness: 0.94,
      roughness: 0.18,
    });

    const sSteel = new THREE.MeshStandardMaterial({
      color: 0xdce3ea,
      metalness: 0.92,
      roughness: 0.2,
    });

    // 3. Fundición gris oscura para bancada y bridas
    const dCast = new THREE.MeshStandardMaterial({
      color: 0x1f2327,
      roughness: 0.72,
      metalness: 0.35,
    });

    const blk = new THREE.MeshStandardMaterial({
      color: 0x15171a,
      roughness: 0.5,
      metalness: 0.15,
    });

    // Rejilla de protección de acoplamiento ranurada
    const cvG = document.createElement('canvas');
    cvG.width = 128;
    cvG.height = 128;
    const ctxG = cvG.getContext('2d')!;
    ctxG.fillStyle = '#1c1f22';
    ctxG.fillRect(0, 0, 128, 128);
    ctxG.fillStyle = '#9aa5b1';
    for (let y = 10; y < 120; y += 14) {
      for (let x = 8; x < 120; x += 18) {
        ctxG.fillRect(x, y, 10, 6);
      }
    }
    const guardTex = new THREE.CanvasTexture(cvG);
    const grd = new THREE.MeshStandardMaterial({
      map: guardTex,
      metalness: 0.85,
      roughness: 0.3,
    });

    const blt = new THREE.MeshStandardMaterial({
      color: 0xdde3ea,
      metalness: 0.95,
      roughness: 0.18,
    });

    const brs = new THREE.MeshStandardMaterial({
      color: 0xd4a038,
      metalness: 0.88,
      roughness: 0.28,
    });

    // Placa de características técnicas
    const cvN = document.createElement('canvas');
    cvN.width = 256;
    cvN.height = 128;
    const ctxN = cvN.getContext('2d')!;
    ctxN.fillStyle = '#c5d0dc';
    ctxN.fillRect(0, 0, 256, 128);
    ctxN.strokeStyle = '#333';
    ctxN.strokeRect(4, 4, 248, 120);
    ctxN.fillStyle = '#111';
    ctxN.font = 'bold 22px Arial';
    ctxN.fillText('VERTICAL PUMP', 18, 36);
    ctxN.font = '16px monospace';
    ctxN.fillText(`P: ${powerKw} kW  16 bar`, 18, 68);
    ctxN.fillText(`Q: 45 m3/h  2900 rpm`, 18, 96);
    const nTex = new THREE.CanvasTexture(cvN);
    const nPlate = new THREE.MeshStandardMaterial({
      map: nTex,
      metalness: 0.8,
      roughness: 0.3,
    });

    return {
      motorBlueMat: mBlue,
      stainlessMat: sSteel,
      stainlessSleeveMat: sSleeve,
      darkCastIronMat: dCast,
      blackMat: blk,
      guardMat: grd,
      boltMat: blt,
      brassMat: brs,
      nameplateMat: nPlate,
    };
  }, [powerKw]);

  // Dimensiones paramétricas precisas
  const baseH = 0.07;
  const inLineH = 0.18;
  const sleeveH = 0.98;
  const sleeveR = 0.125; // Diámetro 25 cm
  const lanternH = 0.28;
  const motorStatorH = 0.44;
  const motorCowlH = 0.18;
  const motorR = 0.145;

  const inLineY = baseH;
  const sleeveY = inLineY + inLineH;
  const lanternY = sleeveY + sleeveH;
  const motorY = lanternY + lanternH;

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* =================================================================== */}
      {/* 1. BANCADA BASE DE FUNDICIÓN CON ANCLAJES                           */}
      {/* =================================================================== */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, baseH, 0.34]} />
        <primitive object={darkCastIronMat} />
      </mesh>
      {/* Placas salientes de anclaje con taladros para pernos */}
      {[
        [-0.14, -0.14],
        [0.14, -0.14],
        [-0.14, 0.14],
        [0.14, 0.14],
      ].map(([bx, bz], i) => (
        <mesh key={`anchor-${i}`} position={[bx, baseH + 0.015, bz]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, 0.03, 16]} />
          <primitive object={boltMat} />
        </mesh>
      ))}

      {/* =================================================================== */}
      {/* 2. CUERPO HIDRÁULICO IN-LINE (ASPIRACIÓN E IMPULSIÓN EN LÍNEA A 180°)*/}
      {/* =================================================================== */}
      <group position={[0, inLineY + inLineH / 2, 0]}>
        {/* Cámara central de paso */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[sleeveR + 0.015, sleeveR + 0.02, inLineH, 32]} />
          <primitive object={darkCastIronMat} />
        </mesh>

        {/* Boca de aspiración (Izquierda, eje -X) */}
        <group position={[-sleeveR - 0.06, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.14, 24]} />
            <primitive object={darkCastIronMat} />
          </mesh>
          <mesh position={[-0.07, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.095, 0.095, 0.028, 24]} />
            <primitive object={stainlessMat} />
          </mesh>
          <mesh position={[-0.085, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.065, 0.065, 0.005, 24]} />
            <primitive object={darkCastIronMat} />
          </mesh>
          {/* Pernos de brida */}
          {Array.from({ length: 4 }).map((_, i) => {
            const a = (i / 4) * Math.PI * 2;
            return (
              <mesh
                key={`flange-l-${i}`}
                position={[-0.07, Math.cos(a) * 0.075, Math.sin(a) * 0.075]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.008, 0.008, 0.035, 6]} />
                <primitive object={boltMat} />
              </mesh>
            );
          })}
        </group>

        {/* Boca de impulsión (Derecha, eje +X) */}
        <group position={[sleeveR + 0.06, 0, 0]}>
          <mesh rotation={[0, 0, -Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.14, 24]} />
            <primitive object={darkCastIronMat} />
          </mesh>
          <mesh position={[0.07, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.095, 0.095, 0.028, 24]} />
            <primitive object={stainlessMat} />
          </mesh>
          <mesh position={[0.085, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.065, 0.065, 0.005, 24]} />
            <primitive object={darkCastIronMat} />
          </mesh>
          {/* Pernos de brida */}
          {Array.from({ length: 4 }).map((_, i) => {
            const a = (i / 4) * Math.PI * 2;
            return (
              <mesh
                key={`flange-r-${i}`}
                position={[0.07, Math.cos(a) * 0.075, Math.sin(a) * 0.075]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.008, 0.008, 0.035, 6]} />
                <primitive object={boltMat} />
              </mesh>
            );
          })}
        </group>

        {/* Tapón de drenaje / purga inferior */}
        <mesh position={[0, -0.06, sleeveR + 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.02, 6]} />
          <primitive object={brassMat} />
        </mesh>
      </group>

      {/* =================================================================== */}
      {/* 3. CAMISA MULTIETAPA DE ACERO INOXIDABLE Y TIRANTES TENSORES        */}
      {/* =================================================================== */}
      <group position={[0, sleeveY + sleeveH / 2, 0]}>
        {/* Camisa exterior cilíndrica de acero inoxidable AISI 304 */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[sleeveR, sleeveR, sleeveH, 48]} />
          <primitive object={stainlessSleeveMat} />
        </mesh>

        {/* 4 Tirantes tensores verticales pasantes (Tie-Rods) */}
        {Array.from({ length: 4 }).map((_, i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          const rx = Math.cos(a) * (sleeveR + 0.014);
          const rz = Math.sin(a) * (sleeveR + 0.014);
          return (
            <group key={`tie-rod-${i}`} position={[rx, 0, rz]}>
              {/* Varilla tensora continua */}
              <mesh castShadow>
                <cylinderGeometry args={[0.008, 0.008, sleeveH + 0.04, 16]} />
                <primitive object={stainlessMat} />
              </mesh>
              {/* Tuerca y arandela superior */}
              <mesh position={[0, sleeveH / 2 + 0.01, 0]}>
                <cylinderGeometry args={[0.014, 0.014, 0.02, 6]} />
                <primitive object={boltMat} />
              </mesh>
              {/* Tuerca y arandela inferior */}
              <mesh position={[0, -sleeveH / 2 - 0.01, 0]}>
                <cylinderGeometry args={[0.014, 0.014, 0.02, 6]} />
                <primitive object={boltMat} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* =================================================================== */}
      {/* 4. CABEZAL DE BOMBA Y LINTERNA DE ACOPLAMIENTO (MOTOR STOOL)        */}
      {/* =================================================================== */}
      <group position={[0, lanternY, 0]}>
        {/* Brida superior del cabezal */}
        <mesh position={[0, 0.018, 0]} castShadow>
          <cylinderGeometry args={[sleeveR + 0.025, sleeveR + 0.025, 0.036, 32]} />
          <primitive object={darkCastIronMat} />
        </mesh>

        {/* Tornillo de purga / desaireación superior */}
        <mesh position={[sleeveR * 0.7, 0.038, 0.05]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 0.025, 6]} />
          <primitive object={brassMat} />
        </mesh>

        {/* Linterna de acoplamiento cilíndrica con ventanas */}
        <mesh position={[0, lanternH / 2, 0]} castShadow>
          <cylinderGeometry args={[sleeveR + 0.015, sleeveR + 0.02, lanternH, 32]} />
          <primitive object={darkCastIronMat} />
        </mesh>

        {/* Rejilla protectora de acoplamiento ranurada */}
        <mesh position={[0, lanternH / 2, 0]}>
          <cylinderGeometry args={[sleeveR + 0.016, sleeveR + 0.016, lanternH * 0.55, 32, 1, true]} />
          <primitive object={guardMat} />
        </mesh>

        {/* Eje y manguito de acoplamiento interior visible */}
        <mesh position={[0, lanternH / 2, 0]}>
          <cylinderGeometry args={[0.028, 0.028, lanternH * 0.7, 24]} />
          <primitive object={stainlessMat} />
        </mesh>

        {/* Placa metálica de características */}
        <mesh position={[0, lanternH * 0.8, sleeveR + 0.022]}>
          <planeGeometry args={[0.09, 0.045]} />
          <primitive object={nameplateMat} />
        </mesh>
      </group>

      {/* =================================================================== */}
      {/* 5. MOTOR ELÉCTRICO TRIFÁSICO INDUSTRIAL (AZUL)                      */}
      {/* =================================================================== */}
      <group position={[0, motorY, 0]}>
        {/* Brida B5 de acoplamiento al cabezal */}
        <mesh position={[0, 0.018, 0]} castShadow>
          <cylinderGeometry args={[motorR + 0.01, motorR + 0.01, 0.036, 32]} />
          <primitive object={motorBlueMat} />
        </mesh>
        {/* Pernos de sujeción motor B5 */}
        {Array.from({ length: 4 }).map((_, i) => {
          const a = (i / 4) * Math.PI * 2;
          return (
            <mesh
              key={`m-bolt-${i}`}
              position={[Math.cos(a) * (motorR - 0.01), 0.038, Math.sin(a) * (motorR - 0.01)]}
            >
              <cylinderGeometry args={[0.009, 0.009, 0.02, 6]} />
              <primitive object={boltMat} />
            </mesh>
          );
        })}

        {/* Carcasa del estator */}
        <mesh position={[0, 0.036 + motorStatorH / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[motorR, motorR, motorStatorH, 32]} />
          <primitive object={motorBlueMat} />
        </mesh>

        {/* Aletas longitudinales de refrigeración del motor */}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <mesh
              key={`fin-${i}`}
              position={[Math.cos(a) * (motorR + 0.008), 0.036 + motorStatorH / 2, Math.sin(a) * (motorR + 0.008)]}
              rotation={[0, -a, 0]}
              castShadow
            >
              <boxGeometry args={[0.016, motorStatorH - 0.02, 0.005]} />
              <primitive object={motorBlueMat} />
            </mesh>
          );
        })}

        {/* Caja de bornes / terminales eléctricos (lateral derecho) */}
        <group position={[motorR + 0.035, 0.036 + motorStatorH * 0.65, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.07, 0.12, 0.11]} />
            <primitive object={motorBlueMat} />
          </mesh>
          {/* Tapa de la caja de bornes */}
          <mesh position={[0.036, 0, 0]}>
            <boxGeometry args={[0.006, 0.12, 0.11]} />
            <primitive object={motorBlueMat} />
          </mesh>
          {/* Prensaestopas de entrada de cable */}
          <mesh position={[0, -0.065, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.025, 12]} />
            <primitive object={blackMat} />
          </mesh>
        </group>

        {/* Caperuza del ventilador de refrigeración (Fan Cowl) */}
        <mesh position={[0, 0.036 + motorStatorH + motorCowlH / 2, 0]} castShadow>
          <cylinderGeometry args={[motorR - 0.005, motorR, motorCowlH, 32]} />
          <primitive object={motorBlueMat} />
        </mesh>
        {/* Rejilla superior del ventilador */}
        <mesh position={[0, 0.036 + motorStatorH + motorCowlH + 0.005, 0]}>
          <cylinderGeometry args={[motorR - 0.02, motorR - 0.02, 0.01, 24]} />
          <primitive object={darkCastIronMat} />
        </mesh>
        {/* Cáncamo de elevación superior */}
        <mesh position={[0, 0.036 + motorStatorH + motorCowlH + 0.035, 0]}>
          <torusGeometry args={[0.025, 0.006, 8, 20]} />
          <primitive object={boltMat} />
        </mesh>
      </group>
    </group>
  );
}
