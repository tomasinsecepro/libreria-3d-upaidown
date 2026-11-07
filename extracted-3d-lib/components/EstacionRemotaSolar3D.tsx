import React, { useMemo } from 'react';
import * as THREE from 'three';

export interface EstacionRemotaSolar3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  tiltAngleDeg?: number;      // Inclinación de la placa solar (típico 35°)
  mastHeight?: number;        // Altura del mástil (2.10 m)
  panelWattage?: number;      // Potencia estimada placa (160W)
}

export function EstacionRemotaSolar3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  tiltAngleDeg = 35,
  mastHeight = 2.10,
}: EstacionRemotaSolar3DProps) {
  // Dimensiones del bloque de hormigón tipo contrapeso
  const blockL = 1.20;
  const blockW = 0.52;
  const blockH = 0.45;
  const mastRadius = 0.038; // Tubo 76 mm galvanizado
  const mastBaseY = blockH;
  const mastTopY = mastBaseY + mastHeight; // 2.55 m

  // Dimensiones placa solar (1.20 x 0.80 m)
  const panelW = 1.20;
  const panelH = 0.80;
  const panelThick = 0.035;
  const tiltRad = (tiltAngleDeg * Math.PI) / 180;

  // Materiales PBR
  const {
    concreteMat,
    galvaMat,
    aluMat,
    solarCellMat,
    solarBackMat,
    ral7035Mat,
    vinylMat,
    switchBlackMat,
    lockMat,
    boltMat,
    corrugatedMat,
  } = useMemo(() => {
    // 1. Hormigón rugoso prefabricado (bloque de contrapeso con árido)
    const cvC = document.createElement('canvas');
    cvC.width = 512;
    cvC.height = 512;
    const ctxC = cvC.getContext('2d');
    if (ctxC) {
      ctxC.fillStyle = '#8f9397';
      ctxC.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 9000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const v = Math.random() * 40 - 20;
        ctxC.fillStyle = `rgba(${135 + v}, ${138 + v}, ${141 + v}, ${0.15 + Math.random() * 0.25})`;
        ctxC.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 3);
      }
    }
    const concreteTex = new THREE.CanvasTexture(cvC);
    concreteTex.wrapS = THREE.RepeatWrapping;
    concreteTex.wrapT = THREE.RepeatWrapping;
    concreteTex.repeat.set(2, 2);

    const cMat = new THREE.MeshStandardMaterial({
      color: 0x9fa4a9,
      map: concreteTex,
      roughness: 0.94,
      metalness: 0.05,
    });

    // 2. Acero galvanizado en caliente para el mástil
    const cvG = document.createElement('canvas');
    cvG.width = 256;
    cvG.height = 256;
    const ctxG = cvG.getContext('2d');
    if (ctxG) {
      ctxG.fillStyle = '#b0b8c0';
      ctxG.fillRect(0, 0, 256, 256);
      // Cristalizaciones / lentejuelas de zinc del galvanizado
      for (let i = 0; i < 1500; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const v = Math.random() * 30 - 15;
        ctxG.fillStyle = `rgba(${185 + v}, ${192 + v}, ${198 + v}, 0.22)`;
        ctxG.beginPath();
        ctxG.arc(x, y, 2 + Math.random() * 5, 0, Math.PI * 2);
        ctxG.fill();
      }
    }
    const gTex = new THREE.CanvasTexture(cvG);
    gTex.wrapS = THREE.RepeatWrapping;
    gTex.wrapT = THREE.RepeatWrapping;

    const gMat = new THREE.MeshStandardMaterial({
      color: 0xb5bec6,
      map: gTex,
      roughness: 0.32,
      metalness: 0.88,
    });

    const alMat = new THREE.MeshStandardMaterial({
      color: 0xd2d8de,
      roughness: 0.25,
      metalness: 0.92,
    });

    // 3. Células fotovoltaicas de la placa solar
    const cvS = document.createElement('canvas');
    cvS.width = 512;
    cvS.height = 340;
    const ctxS = cvS.getContext('2d');
    if (ctxS) {
      ctxS.fillStyle = '#101d36';
      ctxS.fillRect(0, 0, 512, 340);
      // Rejilla de celdas solares (4 filas x 9 columnas)
      ctxS.strokeStyle = '#2b4778';
      ctxS.lineWidth = 2;
      for (let r = 0; r <= 4; r++) {
        const y = (r / 4) * 340;
        ctxS.beginPath();
        ctxS.moveTo(0, y);
        ctxS.lineTo(512, y);
        ctxS.stroke();
      }
      for (let c = 0; c <= 9; c++) {
        const x = (c / 9) * 512;
        ctxS.beginPath();
        ctxS.moveTo(x, 0);
        ctxS.lineTo(x, 340);
        ctxS.stroke();
      }
      // Busbars plateados
      ctxS.strokeStyle = '#e9ecef';
      ctxS.lineWidth = 1;
      for (let r = 0; r < 4; r++) {
        const yMid = (r + 0.5) * (340 / 4);
        ctxS.beginPath();
        ctxS.moveTo(0, yMid - 15);
        ctxS.lineTo(512, yMid - 15);
        ctxS.moveTo(0, yMid + 15);
        ctxS.lineTo(512, yMid + 15);
        ctxS.stroke();
      }
    }
    const solarTex = new THREE.CanvasTexture(cvS);
    const sCellMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      color: 0x14213d,
      roughness: 0.18,
      metalness: 0.85,
    });

    const sBackMat = new THREE.MeshStandardMaterial({
      color: 0xe9ecef,
      roughness: 0.5,
    });

    // 4. Chapa del cuadro en RAL 7035
    const r7035 = new THREE.MeshStandardMaterial({
      color: 0xc8ced4,
      roughness: 0.42,
      metalness: 0.18,
    });

    // 5. Vinilo frontal INSECE con bombeo solar
    const cvV = document.createElement('canvas');
    cvV.width = 512;
    cvV.height = 680;
    const ctxV = cvV.getContext('2d');
    if (ctxV) {
      const skyGrad = ctxV.createLinearGradient(0, 0, 0, 480);
      skyGrad.addColorStop(0, '#1c7ed6');
      skyGrad.addColorStop(0.35, '#4dabf7');
      skyGrad.addColorStop(0.7, '#a5d8ff');
      skyGrad.addColorStop(1, '#e7f5ff');
      ctxV.fillStyle = skyGrad;
      ctxV.fillRect(0, 0, 512, 680);

      const sunGrad = ctxV.createRadialGradient(256, 260, 5, 256, 260, 120);
      sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      sunGrad.addColorStop(0.3, 'rgba(255, 243, 191, 0.65)');
      sunGrad.addColorStop(0.7, 'rgba(255, 230, 120, 0.25)');
      sunGrad.addColorStop(1, 'transparent');
      ctxV.fillStyle = sunGrad;
      ctxV.beginPath();
      ctxV.arc(256, 260, 120, 0, Math.PI * 2);
      ctxV.fill();

      // Placas solares y bomba
      ctxV.fillStyle = '#0f2b5c';
      ctxV.beginPath();
      ctxV.moveTo(330, 310);
      ctxV.lineTo(512, 280);
      ctxV.lineTo(512, 530);
      ctxV.lineTo(310, 480);
      ctxV.closePath();
      ctxV.fill();

      ctxV.fillStyle = '#adb5bd';
      ctxV.fillRect(70, 310, 18, 170);

      ctxV.fillStyle = '#5c940d';
      ctxV.fillRect(0, 460, 512, 100);

      ctxV.fillStyle = '#ffffff';
      ctxV.fillRect(0, 520, 512, 160);

      // Logo INSECE
      const centerX = 165;
      const centerY = 565;
      for (let b = 0; b < 10; b++) {
        const angle = (b / 10) * Math.PI * 2;
        ctxV.fillStyle = b % 2 === 0 ? '#00c3ff' : '#00488f';
        ctxV.beginPath();
        ctxV.moveTo(centerX, centerY);
        ctxV.arc(centerX, centerY, 22, angle, angle + 0.35);
        ctxV.closePath();
        ctxV.fill();
      }
      ctxV.fillStyle = '#0a3678';
      ctxV.font = '900 42px Arial, sans-serif';
      ctxV.fillText('INSECE', 198, 580);
      ctxV.fillStyle = '#495057';
      ctxV.font = 'bold 11px Arial, sans-serif';
      ctxV.fillText('ELECTRICIDAD E INNOVACIÓN', 198, 596);

      // Etiqueta blanca de asistencia 24H
      ctxV.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctxV.strokeStyle = '#ced4da';
      ctxV.lineWidth = 1;
      ctxV.beginPath();
      ctxV.roundRect(140, 240, 232, 54, 6);
      ctxV.fill();
      ctxV.stroke();
      ctxV.fillStyle = '#0a3678';
      ctxV.font = 'bold 12px Arial, sans-serif';
      ctxV.textAlign = 'center';
      ctxV.fillText('www.insece.es · ASISTENCIA TÉCNICA 24H', 256, 260);
      ctxV.font = 'bold 15px monospace';
      ctxV.fillStyle = '#1c7ed6';
      ctxV.fillText('967 110 500 · 665 10 22 75', 256, 282);
      ctxV.textAlign = 'left';

      // Franja negra
      ctxV.fillStyle = '#181b1e';
      ctxV.fillRect(0, 630, 512, 50);
      ctxV.fillStyle = '#fab005';
      ctxV.font = 'bold 16px Arial';
      ctxV.fillText('⚡', 47, 661);
      ctxV.fillStyle = '#e9ecef';
      ctxV.font = 'bold 11px Arial';
      ctxV.fillText('ATENCIÓN: RIESGO ELÉCTRICO 400V - USO EXCLUSIVO PERSONAL AUTORIZADO', 85, 655);
      ctxV.strokeStyle = '#181b1e';
      ctxV.lineWidth = 6;
      ctxV.strokeRect(3, 3, 506, 674);
    }
    const vMat = new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(cvV),
      roughness: 0.28,
      metalness: 0.08,
    });

    const swMat = new THREE.MeshStandardMaterial({
      color: 0x111315,
      roughness: 0.3,
      metalness: 0.1,
    });

    const lkMat = new THREE.MeshStandardMaterial({
      color: 0x24282c,
      roughness: 0.35,
      metalness: 0.8,
    });

    const bMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde2,
      metalness: 0.92,
      roughness: 0.2,
    });

    const corrMat = new THREE.MeshStandardMaterial({
      color: 0x15171a,
      roughness: 0.8,
    });

    return {
      concreteMat: cMat,
      galvaMat: gMat,
      aluMat: alMat,
      solarCellMat: sCellMat,
      solarBackMat: sBackMat,
      ral7035Mat: r7035,
      vinylMat: vMat,
      switchBlackMat: swMat,
      lockMat: lkMat,
      boltMat: bMat,
      corrugatedMat: corrMat,
    };
  }, []);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* =================================================================== */}
      {/* 1. BLOQUE DE HORMIGÓN TIPO CONTRAPESO CON TETONES SUPERIORES         */}
      {/* =================================================================== */}
      <group position={[0, blockH / 2, 0]}>
        {/* Cuerpo prismático principal del bloque */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[blockL, blockH, blockW]} />
          <primitive object={concreteMat} />
        </mesh>

        {/* 8 Tetones piramidales superiores de encaje (2 filas de 4) */}
        {[-0.42, -0.14, 0.14, 0.42].map((tx, ix) =>
          [-0.14, 0.14].map((tz, iz) => (
            <mesh
              key={`stud-${ix}-${iz}`}
              position={[tx, blockH / 2 + 0.025, tz]}
              rotation={[0, Math.PI / 4, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.045, 0.065, 0.05, 4]} />
              <primitive object={concreteMat} />
            </mesh>
          ))
        )}

        {/* Cavidades de elevación para grúa / transpaleta */}
        {[-0.28, 0.28].map((hx, idx) => (
          <mesh key={`hole-${idx}`} position={[hx, -blockH / 2 + 0.05, 0]}>
            <boxGeometry args={[0.14, 0.09, blockW + 0.02]} />
            <primitive object={concreteMat} />
          </mesh>
        ))}
      </group>

      {/* =================================================================== */}
      {/* 2. PLACA BASE Y MÁSTIL TUBULAR GALVANIZADO                          */}
      {/* =================================================================== */}
      {/* Placa base cuadrada de acero con pernos de anclaje */}
      <group position={[0.15, mastBaseY + 0.008, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.20, 0.016, 0.20]} />
          <primitive object={galvaMat} />
        </mesh>
        {/* 4 Pernos de fijación al hormigón */}
        {[-0.075, 0.075].map((bx, ix) =>
          [-0.075, 0.075].map((bz, iz) => (
            <group key={`m-bolt-${ix}-${iz}`} position={[bx, 0.018, bz]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.010, 0.010, 0.035, 12]} />
                <primitive object={boltMat} />
              </mesh>
              <mesh position={[0, 0.01, 0]}>
                <cylinderGeometry args={[0.016, 0.016, 0.014, 6]} />
                <primitive object={boltMat} />
              </mesh>
            </group>
          ))
        )}
        {/* 4 Cartabones triangulares de refuerzo */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, idx) => (
          <mesh
            key={`gusset-${idx}`}
            position={[Math.cos(ang) * 0.05, 0.04, Math.sin(ang) * 0.05]}
            rotation={[0, ang, 0]}
          >
            <boxGeometry args={[0.04, 0.07, 0.008]} />
            <primitive object={galvaMat} />
          </mesh>
        ))}
      </group>

      {/* Tubo vertical del mástil */}
      <mesh
        position={[0.15, mastBaseY + mastHeight / 2, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[mastRadius, mastRadius, mastHeight, 24]} />
        <primitive object={galvaMat} />
      </mesh>

      {/* =================================================================== */}
      {/* 3. CUADRO ELÉCTRICO INSECE 60x80cm FIJADO AL MÁSTIL                 */}
      {/* =================================================================== */}
      {/* Ubicado a altura ergonómica media (centro a Y = 1.35 m) */}
      <group position={[0.15, 1.35, 0]}>
        {/* Abrazaderas metálicas en U (Abarcones) abrazando el mástil */}
        {[-0.24, 0.24].map((uy, idx) => (
          <group key={`ubolt-${idx}`} position={[0, uy, 0]}>
            {/* Aro de abrazadera alrededor del mástil */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[mastRadius + 0.005, 0.006, 8, 20, Math.PI]} />
              <primitive object={boltMat} />
            </mesh>
            {/* Pletina horizontal soporte posterior */}
            <mesh position={[0, 0, mastRadius + 0.012]}>
              <boxGeometry args={[0.42, 0.04, 0.008]} />
              <primitive object={galvaMat} />
            </mesh>
          </group>
        ))}

        {/* Cuerpo del cuadro (60 x 80 x 25 cm) proyectado hacia adelante (+Z) */}
        <group position={[0, 0, mastRadius + 0.02 + 0.125]}>
          {/* Caja principal de chapa RAL 7035 */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.60, 0.80, 0.25]} />
            <primitive object={ral7035Mat} />
          </mesh>

          {/* Puerta frontal con cerraduras y selector */}
          <group position={[0, 0, 0.125 + 0.011]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.60, 0.80, 0.022]} />
              <primitive object={ral7035Mat} />
            </mesh>

            {/* Dos cerraduras de doble paletón */}
            {[-0.20, 0.20].map((ly, idx) => (
              <mesh
                key={`q-lock-${idx}`}
                position={[-0.26, ly, 0.013]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.015, 0.015, 0.006, 24]} />
                <primitive object={lockMat} />
              </mesh>
            ))}

            {/* Vinilo serigrafiado oficial INSECE de bombeo solar */}
            <mesh position={[0.015, -0.01, 0.012]} castShadow>
              <planeGeometry args={[0.60 * 0.76, 0.80 * 0.78]} />
              <primitive object={vinylMat} />
            </mesh>

            {/* Selector rotativo central I-0-II */}
            <group position={[0.015, -0.08, 0.015]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.026, 0.026, 0.006, 24]} />
                <primitive object={switchBlackMat} />
              </mesh>
              <mesh position={[0, 0, 0.014]}>
                <boxGeometry args={[0.014, 0.042, 0.022]} />
                <primitive object={switchBlackMat} />
              </mesh>
            </group>
          </group>

          {/* Tubo corrugado flexible de alimentación saliendo de la base */}
          <mesh position={[0, -0.42, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.08, 12]} />
            <primitive object={corrugatedMat} />
          </mesh>
        </group>
      </group>

      {/* =================================================================== */}
      {/* 4. SOPORTE ARTICULADO Y PLACA SOLAR EN CABEZA DE MÁSTIL             */}
      {/* =================================================================== */}
      <group position={[0.15, mastTopY, 0]}>
        {/* Conjunto articulado con ángulo de inclinación solar real hacia el cielo/sur (-tiltRad) */}
        <group rotation={[-tiltRad, 0, 0]}>
          {/* Cruceta horizontal tubular soporte de perfiles */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.032, 0.032, 0.86, 18]} />
            <primitive object={galvaMat} />
          </mesh>
          {/* Abrazadera de unión T entre mástil y cruceta */}
          <mesh position={[0, 0, -0.015]} castShadow>
            <boxGeometry args={[0.10, 0.08, 0.09]} />
            <primitive object={galvaMat} />
          </mesh>

          {/* Dos perfiles Unistrut de fijación (TRAVESAÑOS) en la CARA TRASERA de la placa */}
          {[-0.34, 0.34].map((rx, idx) => (
            <React.Fragment key={`rail-group-${idx}`}>
              <mesh position={[rx, 0, 0.038]} castShadow>
                <boxGeometry args={[0.042, panelH + 0.18, 0.04]} />
                <primitive object={aluMat} />
              </mesh>
              {/* Abrazadera U-bolt uniendo el perfil a la cruceta */}
              <mesh position={[rx, 0, 0.005]}>
                <cylinderGeometry args={[0.008, 0.008, 0.06, 8]} />
                <primitive object={boltMat} />
              </mesh>
            </React.Fragment>
          ))}

          {/* Marco exterior de aluminio de la placa solar montado SOBRE (delante de) los travesaños */}
          <group position={[0, 0, 0.076]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[panelW, panelH, panelThick]} />
              <primitive object={aluMat} />
            </mesh>

            {/* Cara frontal: células solares fotovoltaicas (orientadas hacia el sol y el cielo) */}
            <mesh position={[0, 0, panelThick / 2 + 0.001]} castShadow>
              <planeGeometry args={[panelW - 0.04, panelH - 0.04]} />
              <primitive object={solarCellMat} />
            </mesh>

            {/* Cara trasera: lámina Tedlar blanca orientada hacia los travesaños */}
            <mesh position={[0, 0, -panelThick / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[panelW - 0.04, panelH - 0.04]} />
              <primitive object={solarBackMat} />
            </mesh>

            {/* Caja de conexiones posterior (Junction Box) y cableado */}
            <group position={[panelW * 0.28, panelH * 0.24, -panelThick / 2 - 0.015]}>
              <mesh castShadow>
                <boxGeometry args={[0.11, 0.09, 0.025]} />
                <primitive object={switchBlackMat} />
              </mesh>
              {/* Cable solar negro con curvatura hacia el mástil */}
              <mesh position={[-0.04, -0.06, 0]}>
                <torusGeometry args={[0.04, 0.006, 8, 16]} />
                <primitive object={corrugatedMat} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
