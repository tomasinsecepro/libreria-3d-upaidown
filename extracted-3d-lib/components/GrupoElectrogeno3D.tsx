import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface GrupoElectrogeno3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  running?: boolean;
}

export function GrupoElectrogeno3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  running = false,
}: GrupoElectrogeno3DProps) {
  const engineRef = useRef<THREE.Group>(null);
  const fanRef = useRef<THREE.Group>(null);

  // Texturas de alta definición para cuadro de control y placas
  const { controlPanelTexture, carodLogoTexture, warningTexture, plateTexture } = useMemo(() => {
    // 1. Centralita digital DeepSea / ComAp
    const cvControl = document.createElement('canvas');
    cvControl.width = 512;
    cvControl.height = 512;
    const ctxC = cvControl.getContext('2d')!;
    ctxC.fillStyle = '#14171a';
    ctxC.fillRect(0, 0, 512, 512);

    // Pantalla LCD retroiluminada verde/ámbar
    ctxC.fillStyle = '#1b2a1e';
    ctxC.fillRect(80, 70, 350, 160);
    ctxC.strokeStyle = '#2d4232';
    ctxC.lineWidth = 4;
    ctxC.strokeRect(80, 70, 350, 160);

    // Texto LCD
    ctxC.fillStyle = '#7bf192';
    ctxC.font = 'bold 26px monospace';
    ctxC.fillText('GENSET: AUTO READY', 100, 115);
    ctxC.font = '22px monospace';
    ctxC.fillText('400V 50.0Hz  0 kW', 100, 155);
    ctxC.fillText('BAT: 12.8V  OIL: 4.8b', 100, 195);

    // Botonera de membrana
    const btnColors = ['#2e7d32', '#c62828', '#1565c0', '#424242', '#424242', '#424242'];
    const btnLabels = ['I', 'O', 'AUTO', '▲', '▼', 'OK'];
    for (let i = 0; i < 6; i++) {
      const bx = 90 + (i % 3) * 115;
      const by = 260 + Math.floor(i / 3) * 80;
      ctxC.fillStyle = btnColors[i];
      ctxC.beginPath();
      ctxC.roundRect(bx, by, 90, 55, 8);
      ctxC.fill();
      ctxC.strokeStyle = '#616161';
      ctxC.lineWidth = 2;
      ctxC.stroke();
      ctxC.fillStyle = '#ffffff';
      ctxC.font = 'bold 22px sans-serif';
      ctxC.textAlign = 'center';
      ctxC.fillText(btnLabels[i], bx + 45, by + 36);
    }
    ctxC.textAlign = 'start';
    const cTex = new THREE.CanvasTexture(cvControl);

    // 2. Logo Carod en relieve
    const cvCarod = document.createElement('canvas');
    cvCarod.width = 512;
    cvCarod.height = 160;
    const ctxL = cvCarod.getContext('2d')!;
    ctxL.fillStyle = '#0a0b0d';
    ctxL.fillRect(0, 0, 512, 160);
    ctxL.strokeStyle = '#ffffff';
    ctxL.lineWidth = 8;
    ctxL.strokeRect(12, 12, 488, 136);
    ctxL.fillStyle = '#ffffff';
    ctxL.font = 'italic bold 90px "Arial Black", sans-serif';
    ctxL.textAlign = 'center';
    ctxL.fillText('Carod', 256, 108);
    const lTex = new THREE.CanvasTexture(cvCarod);

    // 3. Señal de peligro eléctrico triángulo amarillo
    const cvWarn = document.createElement('canvas');
    cvWarn.width = 256;
    cvWarn.height = 256;
    const ctxW = cvWarn.getContext('2d')!;
    ctxW.clearRect(0, 0, 256, 256);
    ctxW.fillStyle = '#f9a825';
    ctxW.beginPath();
    ctxW.moveTo(128, 20);
    ctxW.lineTo(240, 225);
    ctxW.lineTo(16, 225);
    ctxW.closePath();
    ctxW.fill();
    ctxW.strokeStyle = '#000000';
    ctxW.lineWidth = 14;
    ctxW.stroke();
    // Rayo negro
    ctxW.fillStyle = '#000000';
    ctxW.beginPath();
    ctxW.moveTo(136, 65);
    ctxW.lineTo(100, 140);
    ctxW.lineTo(132, 140);
    ctxW.lineTo(116, 205);
    ctxW.lineTo(165, 125);
    ctxW.lineTo(132, 125);
    ctxW.closePath();
    ctxW.fill();
    const wTex = new THREE.CanvasTexture(cvWarn);

    // 4. Placa de características del alternador
    const cvPlate = document.createElement('canvas');
    cvPlate.width = 256;
    cvPlate.height = 128;
    const ctxP = cvPlate.getContext('2d')!;
    ctxP.fillStyle = '#cfd8dc';
    ctxP.fillRect(0, 0, 256, 128);
    ctxP.strokeStyle = '#37474f';
    ctxP.strokeRect(6, 6, 244, 116);
    ctxP.fillStyle = '#212121';
    ctxP.font = 'bold 20px sans-serif';
    ctxP.fillText('SYNCHRONOUS ALTERNATOR', 16, 32);
    ctxP.font = '14px monospace';
    ctxP.fillText('3-PHASE 400V 50Hz Cos φ 0.8', 16, 60);
    ctxP.fillText('IP23 INSUL. CLASS H 1500 RPM', 16, 85);
    ctxP.fillText('CAROD POWER SYSTEMS', 16, 110);
    const pTex = new THREE.CanvasTexture(cvPlate);

    return {
      controlPanelTexture: cTex,
      carodLogoTexture: lTex,
      warningTexture: wTex,
      plateTexture: pTex,
    };
  }, []);

  // Vibración física al estar en marcha
  useFrame(({ clock }) => {
    if (fanRef.current) {
      fanRef.current.rotation.x += running ? 0.35 : 0.05;
    }
    if (engineRef.current && running) {
      const t = clock.elapsedTime * 65;
      engineRef.current.position.y = Math.sin(t) * 0.0018;
      engineRef.current.position.x = Math.cos(t * 1.3) * 0.0012;
    }
  });

  // Materiales PBR
  const chassisMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x141618, roughness: 0.55, metalness: 0.35 }),
    []
  );
  const blockMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.65, metalness: 0.4 }),
    []
  );
  const darkMetalMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.45, metalness: 0.6 }),
    []
  );
  const steelMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x8a959e, roughness: 0.28, metalness: 0.88 }),
    []
  );
  const chromeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xd8e0e6, roughness: 0.15, metalness: 0.95 }),
    []
  );
  const rubberMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x111213, roughness: 0.92, metalness: 0.02 }),
    []
  );
  const aluminumLouverMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xc8d0d5, roughness: 0.3, metalness: 0.8 }),
    []
  );
  const radiatorMeshMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x374149, roughness: 0.6, metalness: 0.7 }),
    []
  );
  const socketBlueMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x1976d2, roughness: 0.35 }),
    []
  );
  const emergencyRedMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.3 }),
    []
  );
  const emergencyYellowMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.35 }),
    []
  );
  const dipstickYellowMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xfdd835, roughness: 0.4 }),
    []
  );
  const glassFilterMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xc5a059,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.75,
      }),
    []
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* ================================================================= */}
      {/* 1. BANCADA ESTRUCTURAL DE ACERO PESADO (SKID BASE / FUEL TANK)   */}
      {/* ================================================================= */}
      <group position={[0, 0.14, 0]}>
        {/* Depósito integrado en bancada */}
        <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.28, 0.96]} />
          <primitive object={chassisMat} />
        </mesh>

        {/* Largueros perimetrales UPN de acero estructural */}
        {[-0.48, 0.48].map((z, idx) => (
          <mesh key={`upn-z-${idx}`} position={[0, 0.12, z]} castShadow>
            <boxGeometry args={[2.52, 0.3, 0.04]} />
            <primitive object={chassisMat} />
          </mesh>
        ))}
        {[-1.25, 1.25].map((x, idx) => (
          <mesh key={`upn-x-${idx}`} position={[x, 0.12, 0]} castShadow>
            <boxGeometry args={[0.04, 0.3, 0.98]} />
            <primitive object={chassisMat} />
          </mesh>
        ))}

        {/* Patas / apoyos transversales inferiores */}
        {[-0.95, 0, 0.95].map((x, idx) => (
          <mesh key={`foot-${idx}`} position={[x, -0.07, 0]} castShadow>
            <boxGeometry args={[0.22, 0.08, 1.04]} />
            <primitive object={chassisMat} />
          </mesh>
        ))}

        {/* Huecos para horquillas de carretilla elevadora (Forklift pockets) */}
        {[-0.55, 0.55].map((x, idx) => (
          <mesh key={`fork-${idx}`} position={[x, 0.08, 0]}>
            <boxGeometry args={[0.24, 0.14, 1.0]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        ))}

        {/* Tapones de llenado y respiradero con nervaduras */}
        {[-0.2, 0.15].map((x, idx) => (
          <group key={`cap-${idx}`} position={[x, 0.27, 0.28]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.048, 0.048, 0.035, 16]} />
              <primitive object={darkMetalMat} />
            </mesh>
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.055, 0.055, 0.015, 8]} />
              <primitive object={darkMetalMat} />
            </mesh>
          </group>
        ))}

        {/* Placa con el logo oficial CAROD en el lateral frontal */}
        <mesh position={[0.25, 0.14, 0.505]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.55, 0.14]} />
          <meshStandardMaterial map={carodLogoTexture} roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Silentblocks de caucho negro antivibración */}
        {[
          [-0.85, 0.28, -0.32],
          [-0.85, 0.28, 0.32],
          [-0.15, 0.28, -0.32],
          [-0.15, 0.28, 0.32],
          [0.65, 0.28, -0.32],
          [0.65, 0.28, 0.32],
        ].map(([sx, sy, sz], idx) => (
          <group key={`silentblock-${idx}`} position={[sx, sy, sz]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.045, 0.05, 0.055, 16]} />
              <primitive object={rubberMat} />
            </mesh>
            <mesh position={[0, 0.035, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.025, 10]} />
              <primitive object={steelMat} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ================================================================= */}
      {/* 2. CONJUNTO MOTOR Y ALTERNADOR CONECTADOS (VIBRACIÓN REALISTA)     */}
      {/* ================================================================= */}
      <group ref={engineRef} position={[0, 0.44, 0]}>
        {/* --------------------------------------------------------------- */}
        {/* A. ALTERNADOR SÍNCRONO (ZONA TRASERA / IZQUIERDA)               */}
        {/* --------------------------------------------------------------- */}
        <group position={[-0.72, 0.26, 0]}>
          {/* Cuerpo cilíndrico principal del alternador */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.31, 0.31, 0.72, 32]} />
            <primitive object={blockMat} />
          </mesh>

          {/* Tapa trasera abovedada con aro perimetral */}
          <mesh position={[-0.37, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.315, 0.315, 0.04, 32]} />
            <primitive object={steelMat} />
          </mesh>

          {/* REJILLA DE VENTILACIÓN TRASERA CIRCULAR PLATEADA (LOUVERS) */}
          <group position={[-0.392, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            {/* Disco plateado base */}
            <mesh>
              <circleGeometry args={[0.28, 32]} />
              <primitive object={aluminumLouverMat} />
            </mesh>
            {/* Ranuras horizontales troqueladas en relieve */}
            {Array.from({ length: 12 }).map((_, rIdx) => {
              const ry = -0.18 + rIdx * 0.032;
              const rw = Math.sqrt(Math.max(0, 0.25 * 0.25 - ry * ry)) * 1.85;
              return (
                <mesh key={`louver-${rIdx}`} position={[0, ry, 0.005]}>
                  <boxGeometry args={[rw, 0.014, 0.008]} />
                  <primitive object={darkMetalMat} />
                </mesh>
              );
            })}
          </group>

          {/* Placa metálica de características del alternador */}
          <mesh position={[-0.15, 0.12, 0.312]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.24, 0.12]} />
            <meshStandardMaterial map={plateTexture} roughness={0.3} metalness={0.7} />
          </mesh>

          {/* Campana de acoplamiento SAE intermedia con rejilla de aire */}
          <mesh position={[0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.34, 0.31, 0.16, 32]} />
            <primitive object={darkMetalMat} />
          </mesh>
          <mesh position={[0.42, 0.02, 0.325]}>
            <boxGeometry args={[0.12, 0.24, 0.02]} />
            <primitive object={aluminumLouverMat} />
          </mesh>

          {/* Caja superior de conexiones / bornes de potencia */}
          <mesh position={[-0.1, 0.34, 0]} castShadow>
            <boxGeometry args={[0.44, 0.18, 0.38]} />
            <primitive object={chassisMat} />
          </mesh>
          {/* Triángulo de advertencia en la caja */}
          <mesh position={[-0.1, 0.34, 0.192]}>
            <planeGeometry args={[0.09, 0.09]} />
            <meshStandardMaterial map={warningTexture} transparent={true} roughness={0.3} />
          </mesh>

          {/* Manguera de cables de potencia saliendo hacia el cuadro superior */}
          {[-0.08, 0.02, 0.12].map((cx, idx) => (
            <mesh key={`pot-cable-${idx}`} position={[cx - 0.1, 0.48, 0.12]} rotation={[0.4, 0, -0.3]}>
              <cylinderGeometry args={[0.016, 0.016, 0.22, 10]} />
              <primitive object={rubberMat} />
            </mesh>
          ))}
        </group>

        {/* --------------------------------------------------------------- */}
        {/* B. MOTOR DIÉSEL INDUSTRIAL (4 CILINDROS, BOMBA, FILTROS, COLECTORES) */}
        {/* --------------------------------------------------------------- */}
        <group position={[0.18, 0.32, 0]}>
          {/* Bloque motor principal de fundición */}
          <mesh castShadow>
            <boxGeometry args={[0.82, 0.58, 0.52]} />
            <primitive object={blockMat} />
          </mesh>

          {/* Cárter inferior de aceite */}
          <mesh position={[0, -0.34, 0]} castShadow>
            <boxGeometry args={[0.76, 0.16, 0.44]} />
            <primitive object={blockMat} />
          </mesh>

          {/* Culata superior */}
          <mesh position={[0, 0.32, 0]} castShadow>
            <boxGeometry args={[0.8, 0.12, 0.48]} />
            <primitive object={blockMat} />
          </mesh>

          {/* 4 Tapas de balancines individuales con nervaduras */}
          {[-0.27, -0.09, 0.09, 0.27].map((cx, idx) => (
            <group key={`rocker-${idx}`} position={[cx, 0.42, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.15, 0.09, 0.42]} />
                <primitive object={blockMat} />
              </mesh>
              {/* Tapón roscado superior */}
              <mesh position={[0, 0.055, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.025, 12]} />
                <primitive object={darkMetalMat} />
              </mesh>
            </group>
          ))}

          {/* Colector de admisión y riel de inyección común */}
          <mesh position={[0, 0.34, 0.26]} castShadow>
            <boxGeometry args={[0.78, 0.065, 0.07]} />
            <primitive object={darkMetalMat} />
          </mesh>

          {/* 4 Tubos curvos metálicos de inyección diésel de alta presión */}
          {[-0.27, -0.09, 0.09, 0.27].map((ix, idx) => (
            <group key={`injector-pipe-${idx}`} position={[ix, 0.28, 0.28]}>
              <mesh rotation={[0.4, 0, 0]}>
                <cylinderGeometry args={[0.007, 0.007, 0.2, 8]} />
                <primitive object={steelMat} />
              </mesh>
              <mesh position={[0, 0.11, 0.04]} rotation={[-0.3, 0, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
                <primitive object={steelMat} />
              </mesh>
            </group>
          ))}

          {/* Varilla de nivel de aceite con tirador amarillo en bucle */}
          <group position={[0.24, 0.05, 0.29]}>
            <mesh rotation={[0, 0, -0.2]}>
              <cylinderGeometry args={[0.006, 0.006, 0.35, 8]} />
              <primitive object={steelMat} />
            </mesh>
            <mesh position={[0.04, 0.18, 0]}>
              <torusGeometry args={[0.025, 0.007, 8, 16]} />
              <primitive object={dipstickYellowMat} />
            </mesh>
          </group>

          {/* Filtro principal de aceite enroscado (cilindro gris/blanco) */}
          <group position={[0.12, -0.08, 0.28]}>
            <mesh rotation={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.065, 0.16, 20]} />
              <primitive object={steelMat} />
            </mesh>
            <mesh position={[0, 0.09, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.04, 16]} />
              <primitive object={darkMetalMat} />
            </mesh>
          </group>

          {/* Prefiltro de combustible decantador con vaso transparente/amarillo */}
          <group position={[0.32, -0.15, 0.27]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.045, 0.045, 0.14, 16]} />
              <primitive object={glassFilterMat} />
            </mesh>
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
              <primitive object={darkMetalMat} />
            </mesh>
            <mesh position={[0, -0.08, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.02, 12]} />
              <primitive object={steelMat} />
            </mesh>
          </group>

          {/* Motor de arranque (Starter motor) en la zona inferior acoplado a corona */}
          <group position={[-0.28, -0.22, 0.24]} rotation={[0, 0, Math.PI / 2]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.085, 0.085, 0.26, 20]} />
              <primitive object={darkMetalMat} />
            </mesh>
            <mesh position={[0.07, 0.02, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.14, 16]} />
              <primitive object={darkMetalMat} />
            </mesh>
          </group>

          {/* Colector de escape trasero y turbo/silenciador */}
          <mesh position={[-0.05, 0.24, -0.28]} castShadow>
            <boxGeometry args={[0.72, 0.09, 0.09]} />
            <primitive object={darkMetalMat} />
          </mesh>
        </group>

        {/* --------------------------------------------------------------- */}
        {/* C. SISTEMA DE ADMISIÓN: FILTRO DE AIRE CILÍNDRICO TIPO CICLÓNICO */}
        {/* --------------------------------------------------------------- */}
        <group position={[-0.08, 0.94, 0.04]}>
          {/* Cuerpo cilíndrico horizontal grande de plástico técnico negro */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.44, 24]} />
            <primitive object={darkMetalMat} />
          </mesh>

          {/* Abrazaderas metálicas de sujeción del filtro */}
          {[-0.12, 0.12].map((bx, idx) => (
            <mesh key={`clamp-${idx}`} position={[bx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.188, 0.188, 0.028, 24]} />
              <primitive object={steelMat} />
            </mesh>
          ))}

          {/* Tapa frontal con nervio central y cierre rápido */}
          <mesh position={[0.23, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.175, 0.185, 0.035, 24]} />
            <primitive object={darkMetalMat} />
          </mesh>
          <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.02, 16]} />
            <primitive object={darkMetalMat} />
          </mesh>

          {/* Sombrerete / Prefiltro hongo vertical de entrada de aire */}
          <group position={[-0.16, 0.26, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.16, 16]} />
              <primitive object={darkMetalMat} />
            </mesh>
            <mesh position={[0, 0.1, 0]} castShadow>
              <cylinderGeometry args={[0.11, 0.06, 0.07, 24]} />
              <primitive object={darkMetalMat} />
            </mesh>
          </group>

          {/* Conducto flexible acodado que baja al colector de admisión */}
          <mesh position={[0.12, -0.22, 0.14]} rotation={[0.6, 0.4, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.28, 16]} />
            <primitive object={rubberMat} />
          </mesh>
        </group>

        {/* --------------------------------------------------------------- */}
        {/* D. RADIADOR INDUSTRIAL FRONTAL CON MALLA Y VENTILADOR (DERECHA) */}
        {/* --------------------------------------------------------------- */}
        <group position={[0.88, 0.38, 0]}>
          {/* Marco exterior del radiador en acero negro */}
          <mesh castShadow>
            <boxGeometry args={[0.16, 0.88, 0.84]} />
            <primitive object={chassisMat} />
          </mesh>

          {/* Panal de aletas disipadoras centrales */}
          <mesh position={[0.01, 0, 0]}>
            <boxGeometry args={[0.11, 0.72, 0.74]} />
            <primitive object={radiatorMeshMat} />
          </mesh>

          {/* Depósito superior del radiador con tapón de presión */}
          <mesh position={[0, 0.44, 0]} castShadow>
            <boxGeometry args={[0.17, 0.12, 0.84]} />
            <primitive object={chassisMat} />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
            <primitive object={chromeMat} />
          </mesh>

          {/* Rejilla protectora de alambre para el ventilador (Fan guard) */}
          <group position={[-0.1, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.32, 0.015, 8, 32]} />
              <primitive object={chromeMat} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.2, 0.012, 8, 28]} />
              <primitive object={chromeMat} />
            </mesh>
            {/* Varillas radiales */}
            {Array.from({ length: 8 }).map((_, aIdx) => (
              <mesh
                key={`radiator-spoke-${aIdx}`}
                rotation={[0, 0, (aIdx * Math.PI) / 4]}
                position={[0, 0, 0]}
              >
                <boxGeometry args={[0.01, 0.65, 0.01]} />
                <primitive object={chromeMat} />
              </mesh>
            ))}
          </group>

          {/* Aspas giratorias del ventilador interior */}
          <group ref={fanRef} position={[-0.14, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
              <primitive object={darkMetalMat} />
            </mesh>
            {Array.from({ length: 7 }).map((_, fIdx) => (
              <mesh
                key={`blade-${fIdx}`}
                rotation={[0, 0, (fIdx * Math.PI * 2) / 7]}
                position={[0, 0.15, 0]}
              >
                <boxGeometry args={[0.015, 0.22, 0.065]} />
                <primitive object={darkMetalMat} />
              </mesh>
            ))}
          </group>

          {/* Manguito superior grueso de recirculación de refrigerante con codo */}
          <group position={[-0.24, 0.44, 0.18]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.32, 14]} />
              <primitive object={rubberMat} />
            </mesh>
            <mesh position={[0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.02, 14]} />
              <primitive object={steelMat} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ================================================================= */}
      {/* 3. ARCO TUBULAR DE SOPORTE Y CUADRO DE CONTROL ELÉCTRICO SUPERIOR */}
      {/* ================================================================= */}
      <group position={[-0.78, 0, 0]}>
        {/* Estructura tubular curvada de doble arco en acero negro */}
        {[-0.38, 0.38].map((tz, idx) => (
          <group key={`arch-${idx}`} position={[0, 0, tz]}>
            {/* Columnas verticales */}
            <mesh position={[-0.18, 0.72, 0]} castShadow>
              <cylinderGeometry args={[0.024, 0.024, 0.9, 14]} />
              <primitive object={chassisMat} />
            </mesh>
            <mesh position={[0.18, 0.72, 0]} castShadow>
              <cylinderGeometry args={[0.024, 0.024, 0.9, 14]} />
              <primitive object={chassisMat} />
            </mesh>
            {/* Curva superior en U invertida */}
            <mesh position={[0, 1.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.18, 0.024, 8, 16, Math.PI]} />
              <primitive object={chassisMat} />
            </mesh>
          </group>
        ))}

        {/* Travesaños de unión soldados */}
        {[-0.18, 0.18].map((tx, idx) => (
          <mesh key={`cross-bar-${idx}`} position={[tx, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.76, 12]} />
            <primitive object={chassisMat} />
          </mesh>
        ))}

        {/* --------------------------------------------------------------- */}
        {/* ARMARIO / CUADRO DE CONTROL METÁLICO (CONTROL PANEL BOX)        */}
        {/* --------------------------------------------------------------- */}
        <group position={[0, 1.48, 0]}>
          {/* Caja estanca principal con bisagras y cerradura */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.42, 0.62, 0.58]} />
            <primitive object={chassisMat} />
          </mesh>

          {/* Tejadillo superior con leve caída de protección */}
          <mesh position={[0, 0.32, 0]}>
            <boxGeometry args={[0.46, 0.025, 0.62]} />
            <primitive object={chassisMat} />
          </mesh>

          {/* FRONTIS / PUERTA PRINCIPAL DEL CUADRO (CARA DERECHA O LATERAL) */}
          <group position={[0, 0, 0.292]}>
            {/* Panel de la centralita digital DSE */}
            <mesh position={[-0.06, 0.11, 0.005]}>
              <planeGeometry args={[0.24, 0.24]} />
              <meshStandardMaterial map={controlPanelTexture} roughness={0.35} metalness={0.1} />
            </mesh>

            {/* Seta de parada de emergencia roja sobre base amarilla */}
            <group position={[-0.14, 0.18, 0.015]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.038, 0.038, 0.008, 20]} />
                <primitive object={emergencyYellowMat} />
              </mesh>
              <mesh position={[0, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.032, 0.026, 0.038, 20]} />
                <primitive object={emergencyRedMat} />
              </mesh>
            </group>

            {/* Base de enchufe industrial CEE azul (230V 16A/32A) */}
            <group position={[0.11, 0.16, 0.02]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.042, 0.042, 0.035, 20]} />
                <primitive object={socketBlueMat} />
              </mesh>
              {/* Tapa con bisagra basculante */}
              <mesh position={[0, 0.025, 0.02]} rotation={[0.3, 0, 0]}>
                <cylinderGeometry args={[0.045, 0.045, 0.012, 20]} />
                <primitive object={socketBlueMat} />
              </mesh>
            </group>

            {/* Ventana transparente para disyuntor/magnetotérmico */}
            <mesh position={[-0.06, -0.12, 0.005]}>
              <boxGeometry args={[0.22, 0.08, 0.015]} />
              <primitive object={darkMetalMat} />
            </mesh>
            <mesh position={[-0.06, -0.12, 0.015]}>
              <boxGeometry args={[0.18, 0.04, 0.01]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} transparent opacity={0.65} />
            </mesh>

            {/* Triángulo de advertencia de riesgo eléctrico */}
            <mesh position={[0.12, -0.12, 0.005]}>
              <planeGeometry args={[0.09, 0.09]} />
              <meshStandardMaterial map={warningTexture} transparent={true} roughness={0.3} />
            </mesh>

            {/* Logo oficial Carod en el cuadro de control */}
            <mesh position={[-0.06, -0.02, 0.005]}>
              <planeGeometry args={[0.14, 0.045]} />
              <meshStandardMaterial map={carodLogoTexture} roughness={0.3} />
            </mesh>
          </group>

          {/* Triángulo de advertencia en el lateral del cuadro */}
          <mesh position={[-0.212, 0.12, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.1, 0.1]} />
            <meshStandardMaterial map={warningTexture} transparent={true} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
