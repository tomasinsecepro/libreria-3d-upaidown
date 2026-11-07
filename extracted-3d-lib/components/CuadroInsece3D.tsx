import React, { useMemo } from 'react';
import * as THREE from 'three';

export interface CuadroInsece3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  hasHmi?: boolean;              // Si incluye pantalla táctil HMI o versión con selector central
  width?: number;               // Ancho (0.60 m según foto)
  height?: number;              // Alto (0.80 m según foto)
  depth?: number;               // Fondo (0.25 m estándar)
  doorAngle?: number;           // Ángulo de apertura de puerta en radianes (0 = cerrada)
  hmiActive?: boolean;          // Pantalla encendida con interfaz SCADA
}

export function CuadroInsece3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  hasHmi = false,
  width = 0.60,
  height = 0.80,
  depth = 0.25,
  doorAngle = 0,
  hmiActive = true,
}: CuadroInsece3DProps) {
  // Dimensiones
  const halfW = width / 2;
  const halfH = height / 2;
  const doorThickness = 0.022;

  // Materiales PBR y texturas procedimentales
  const {
    ral7035Mat,
    darkInteriorMat,
    lockMat,
    vinylMat,
    hmiBezelMat,
    hmiScreenMat,
    switchBlackMat,
    ventGrillMat,
    antennaMat,
    glandMat,
    bracketMat,
  } = useMemo(() => {
    // 1. Chapa de acero pintada en RAL 7035 (Gris claro texturado en polvo)
    const cvMetal = document.createElement('canvas');
    cvMetal.width = 256;
    cvMetal.height = 256;
    const ctxM = cvMetal.getContext('2d');
    if (ctxM) {
      ctxM.fillStyle = '#c8ced4';
      ctxM.fillRect(0, 0, 256, 256);
      // Grano fino de pintura electrostática poliéster
      for (let i = 0; i < 2500; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const v = Math.random() * 16 - 8;
        ctxM.fillStyle = `rgba(${200 + v}, ${206 + v}, ${212 + v}, 0.25)`;
        ctxM.fillRect(x, y, 1.5, 1.5);
      }
    }
    const metalTex = new THREE.CanvasTexture(cvMetal);
    metalTex.wrapS = THREE.RepeatWrapping;
    metalTex.wrapT = THREE.RepeatWrapping;

    const r7035 = new THREE.MeshStandardMaterial({
      color: 0xc8ced4,
      map: metalTex,
      roughness: 0.42,
      metalness: 0.18,
    });

    const dInterior = new THREE.MeshStandardMaterial({
      color: 0x8a929a,
      roughness: 0.6,
      metalness: 0.2,
    });

    const lkMat = new THREE.MeshStandardMaterial({
      color: 0x24282c,
      roughness: 0.35,
      metalness: 0.8,
    });

    const swMat = new THREE.MeshStandardMaterial({
      color: 0x111315,
      roughness: 0.3,
      metalness: 0.1,
    });

    const gMat = new THREE.MeshStandardMaterial({
      color: 0x1a1d20,
      roughness: 0.45,
      metalness: 0.2,
    });

    const antMat = new THREE.MeshStandardMaterial({
      color: 0x121416,
      roughness: 0.5,
      metalness: 0.3,
    });

    const brkMat = new THREE.MeshStandardMaterial({
      color: 0xd0d5db,
      metalness: 0.85,
      roughness: 0.25,
    });

    // 2. Rejilla de ventilación lateral louver
    const cvGrill = document.createElement('canvas');
    cvGrill.width = 128;
    cvGrill.height = 256;
    const ctxG = cvGrill.getContext('2d');
    if (ctxG) {
      ctxG.fillStyle = '#c0c6cc';
      ctxG.fillRect(0, 0, 128, 256);
      ctxG.strokeStyle = '#9aa1a8';
      ctxG.lineWidth = 4;
      ctxG.strokeRect(4, 4, 120, 248);
      // Lamas horizontales de ventilación
      for (let y = 20; y < 240; y += 12) {
        ctxG.fillStyle = '#2b3035';
        ctxG.fillRect(14, y, 100, 5);
        ctxG.fillStyle = '#e2e7ec';
        ctxG.fillRect(14, y + 5, 100, 2);
      }
    }
    const grillTex = new THREE.CanvasTexture(cvGrill);
    const vGrillMat = new THREE.MeshStandardMaterial({
      map: grillTex,
      roughness: 0.5,
      metalness: 0.15,
    });

    // 3. Vinilo serigrafiado frontal INSECE con Bombeo Solar de Alta Resolución
    const cvV = document.createElement('canvas');
    cvV.width = 512;
    cvV.height = 680;
    const ctxV = cvV.getContext('2d');
    if (ctxV) {
      // Cielo azul degradado con sol radiante
      const skyGrad = ctxV.createLinearGradient(0, 0, 0, 480);
      skyGrad.addColorStop(0, '#1c7ed6');
      skyGrad.addColorStop(0.35, '#4dabf7');
      skyGrad.addColorStop(0.7, '#a5d8ff');
      skyGrad.addColorStop(1, '#e7f5ff');
      ctxV.fillStyle = skyGrad;
      ctxV.fillRect(0, 0, 512, 680);

      // Sol radiante en el centro superior
      const sunGrad = ctxV.createRadialGradient(256, 260, 5, 256, 260, 120);
      sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      sunGrad.addColorStop(0.3, 'rgba(255, 243, 191, 0.65)');
      sunGrad.addColorStop(0.7, 'rgba(255, 230, 120, 0.25)');
      sunGrad.addColorStop(1, 'transparent');
      ctxV.fillStyle = sunGrad;
      ctxV.beginPath();
      ctxV.arc(256, 260, 120, 0, Math.PI * 2);
      ctxV.fill();

      // Nubes suaves
      ctxV.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctxV.beginPath();
      ctxV.arc(100, 140, 55, 0, Math.PI * 2);
      ctxV.arc(145, 130, 45, 0, Math.PI * 2);
      ctxV.arc(380, 150, 60, 0, Math.PI * 2);
      ctxV.arc(430, 140, 50, 0, Math.PI * 2);
      ctxV.fill();

      // Placas solares en perspectiva (lateral derecho)
      ctxV.fillStyle = '#0f2b5c';
      ctxV.beginPath();
      ctxV.moveTo(330, 310);
      ctxV.lineTo(512, 280);
      ctxV.lineTo(512, 530);
      ctxV.lineTo(310, 480);
      ctxV.closePath();
      ctxV.fill();

      // Líneas de celdas solares
      ctxV.strokeStyle = '#4dabf7';
      ctxV.lineWidth = 1.5;
      for (let i = 0; i <= 6; i++) {
        const u = i / 6;
        ctxV.beginPath();
        ctxV.moveTo(330 + u * (512 - 330), 310 + u * (280 - 310));
        ctxV.lineTo(310 + u * (512 - 310), 480 + u * (530 - 480));
        ctxV.stroke();
      }

      // Bomba de pozo y chorro de agua cristalina (lateral izquierdo)
      ctxV.fillStyle = '#adb5bd';
      ctxV.fillRect(70, 310, 18, 170); // Camisa bomba inox
      ctxV.fillStyle = '#343a40';
      ctxV.fillRect(68, 305, 22, 10);  // Boca de impulsión
      // Salpicaduras de agua
      const waterGrad = ctxV.createRadialGradient(85, 300, 5, 110, 290, 80);
      waterGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      waterGrad.addColorStop(0.5, 'rgba(77, 171, 247, 0.6)');
      waterGrad.addColorStop(1, 'transparent');
      ctxV.fillStyle = waterGrad;
      ctxV.beginPath();
      ctxV.arc(110, 290, 75, 0, Math.PI * 2);
      ctxV.fill();

      // Campo verde inferior
      ctxV.fillStyle = '#5c940d';
      ctxV.fillRect(0, 460, 512, 100);

      // Franja blanca inferior para el logotipo y mandos
      ctxV.fillStyle = '#ffffff';
      ctxV.fillRect(0, 520, 512, 160);

      // Logotipo oficial INSECE
      // Isotipo aspas (vórtice cyan a azul)
      const centerX = 165;
      const centerY = 565;
      const numBlades = 10;
      for (let b = 0; b < numBlades; b++) {
        const angle = (b / numBlades) * Math.PI * 2;
        ctxV.fillStyle = b % 2 === 0 ? '#00c3ff' : '#00488f';
        ctxV.beginPath();
        ctxV.moveTo(centerX, centerY);
        ctxV.arc(centerX, centerY, 22, angle, angle + 0.35);
        ctxV.closePath();
        ctxV.fill();
      }
      ctxV.fillStyle = '#ffffff';
      ctxV.beginPath();
      ctxV.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctxV.fill();

      // Tipografía INSECE
      ctxV.fillStyle = '#0a3678';
      ctxV.font = '900 42px Arial, sans-serif';
      ctxV.fillText('INSECE', 198, 580);
      ctxV.fillStyle = '#495057';
      ctxV.font = 'bold 11px Arial, sans-serif';
      ctxV.letterSpacing = '2px';
      ctxV.fillText('ELECTRICIDAD E INNOVACIÓN', 198, 596);

      // Etiqueta blanca de asistencia técnica 24h
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

      // Franja negra inferior de advertencia
      ctxV.fillStyle = '#181b1e';
      ctxV.fillRect(0, 630, 512, 50);

      // Triángulo de advertencia riesgo eléctrico
      ctxV.fillStyle = '#fab005';
      ctxV.beginPath();
      ctxV.moveTo(40, 665);
      ctxV.lineTo(55, 638);
      ctxV.lineTo(70, 665);
      ctxV.closePath();
      ctxV.fill();
      ctxV.fillStyle = '#000';
      ctxV.font = 'bold 16px Arial';
      ctxV.fillText('⚡', 47, 661);

      ctxV.fillStyle = '#e9ecef';
      ctxV.font = 'bold 11px Arial';
      ctxV.fillText('ATENCIÓN: RIESGO ELÉCTRICO 400V - USO EXCLUSIVO PERSONAL AUTORIZADO', 85, 655);

      // Marco negro exterior del vinilo
      ctxV.strokeStyle = '#181b1e';
      ctxV.lineWidth = 6;
      ctxV.strokeRect(3, 3, 506, 674);
    }
    const vinTex = new THREE.CanvasTexture(cvV);
    const vMat = new THREE.MeshStandardMaterial({
      map: vinTex,
      roughness: 0.28,
      metalness: 0.08,
    });

    // 4. Pantalla táctil HMI Industrial
    const cvHmi = document.createElement('canvas');
    cvHmi.width = 512;
    cvHmi.height = 320;
    const ctxH = cvHmi.getContext('2d');
    if (ctxH) {
      if (hmiActive) {
        // Fondo UI moderno SCADA
        ctxH.fillStyle = '#111822';
        ctxH.fillRect(0, 0, 512, 320);

        // Barra superior
        ctxH.fillStyle = '#1a2332';
        ctxH.fillRect(0, 0, 512, 38);
        ctxH.fillStyle = '#00c3ff';
        ctxH.font = 'bold 14px Arial';
        ctxH.fillText('INSECE SOLAR CONTROL SCADA', 16, 25);
        ctxH.fillStyle = '#51cf66';
        ctxH.fillText('● MPPT RUNNING', 370, 25);

        // Cajas de valores de monitorización
        const drawMetric = (x: number, y: number, w: number, h: number, title: string, val: string, unit: string) => {
          ctxH.fillStyle = '#182230';
          ctxH.fillRect(x, y, w, h);
          ctxH.strokeStyle = '#2b3a4e';
          ctxH.strokeRect(x, y, w, h);
          ctxH.fillStyle = '#8ca0b8';
          ctxH.font = '11px Arial';
          ctxH.fillText(title, x + 10, y + 20);
          ctxH.fillStyle = '#ffffff';
          ctxH.font = 'bold 24px monospace';
          ctxH.fillText(val, x + 10, y + 54);
          ctxH.fillStyle = '#00c3ff';
          ctxH.font = 'bold 12px Arial';
          ctxH.fillText(unit, x + w - 42, y + 54);
        };

        drawMetric(16, 52, 150, 72, 'POTENCIA SOLAR', '18.4', 'kW');
        drawMetric(180, 52, 150, 72, 'FRECUENCIA BOMBA', '48.5', 'Hz');
        drawMetric(344, 52, 150, 72, 'CAUDAL MEDIDO', '42.0', 'm³/h');

        drawMetric(16, 136, 150, 72, 'PRESIÓN RED', '5.4', 'bar');
        drawMetric(180, 136, 150, 72, 'NIVEL FREÁTICO', '-38.2', 'm');
        drawMetric(344, 136, 150, 72, 'IRRADIANCIA', '985', 'W/m²');

        // Barra de estado inferior con botones de navegación táctil
        ctxH.fillStyle = '#1a2332';
        ctxH.fillRect(0, 276, 512, 44);
        ['INICIO', 'PARÁMETROS', 'CURVAS', 'ALARMAS'].forEach((btn, idx) => {
          ctxH.fillStyle = idx === 0 ? '#0077cc' : '#232d3d';
          ctxH.fillRect(16 + idx * 122, 282, 114, 32);
          ctxH.fillStyle = '#ffffff';
          ctxH.font = 'bold 11px Arial';
          ctxH.textAlign = 'center';
          ctxH.fillText(btn, 16 + idx * 122 + 57, 302);
        });
        ctxH.textAlign = 'left';

        // Gráfico de radiación
        ctxH.strokeStyle = '#fab005';
        ctxH.lineWidth = 2;
        ctxH.beginPath();
        ctxH.moveTo(16, 255);
        ctxH.quadraticCurveTo(150, 220, 256, 218);
        ctxH.quadraticCurveTo(380, 222, 496, 255);
        ctxH.stroke();
      } else {
        ctxH.fillStyle = '#080a0c';
        ctxH.fillRect(0, 0, 512, 320);
      }
    }
    const hmiTex = new THREE.CanvasTexture(cvHmi);
    const hScreenMat = new THREE.MeshStandardMaterial({
      map: hmiTex,
      roughness: 0.12,
      metalness: 0.1,
    });

    const hBezelMat = new THREE.MeshStandardMaterial({
      color: 0x2b3036,
      roughness: 0.38,
      metalness: 0.7,
    });

    return {
      ral7035Mat: r7035,
      darkInteriorMat: dInterior,
      lockMat: lkMat,
      vinylMat: vMat,
      hmiBezelMat: hBezelMat,
      hmiScreenMat: hScreenMat,
      switchBlackMat: swMat,
      ventGrillMat: vGrillMat,
      antennaMat: antMat,
      glandMat: gMat,
      bracketMat: brkMat,
    };
  }, [hmiActive]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* =================================================================== */}
      {/* 1. CUERPO PRINCIPAL DEL ARMARIO METÁLICO (60 x 80 x 25 cm)           */}
      {/* =================================================================== */}
      <mesh position={[0, halfH, -depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <primitive object={ral7035Mat} />
      </mesh>

      {/* Rejilla de ventilación / filtro lateral derecha */}
      <mesh
        position={[halfW + 0.001, halfH * 0.45, -depth / 2]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[0.13, 0.22]} />
        <primitive object={ventGrillMat} />
      </mesh>

      {/* Rejilla de ventilación / filtro lateral izquierda */}
      <mesh
        position={[-halfW - 0.001, halfH * 0.45, -depth / 2]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[0.13, 0.22]} />
        <primitive object={ventGrillMat} />
      </mesh>

      {/* Prensaestopas inferiores en base para paso de cables */}
      {[-0.14, 0, 0.14].map((gx, idx) => (
        <group key={`gland-${idx}`} position={[gx, -0.015, -depth / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.016, 0.016, 0.03, 16]} />
            <primitive object={glandMat} />
          </mesh>
          <mesh position={[0, -0.018, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.008, 6]} />
            <primitive object={glandMat} />
          </mesh>
        </group>
      ))}

      {/* Patas de anclaje mural posteriores (4 escuadras de fijación) */}
      {[
        [-halfW - 0.018, height - 0.04],
        [halfW + 0.018, height - 0.04],
        [-halfW - 0.018, 0.04],
        [halfW + 0.018, 0.04],
      ].map(([bx, by], idx) => (
        <mesh key={`brk-${idx}`} position={[bx, by, -depth - 0.005]}>
          <boxGeometry args={[0.036, 0.06, 0.008]} />
          <primitive object={bracketMat} />
        </mesh>
      ))}

      {/* Antena 4G/LTE / Telemetría superior (típica en armarios con HMI / SCADA) */}
      {hasHmi && (
        <group position={[halfW - 0.08, height + 0.002, -depth / 2]}>
          {/* Base SMA roscada cromada */}
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.009, 0.009, 0.02, 12]} />
            <primitive object={bracketMat} />
          </mesh>
          {/* Varilla de antena articulada negra */}
          <mesh position={[0, 0.10, 0]} castShadow>
            <cylinderGeometry args={[0.006, 0.008, 0.18, 12]} />
            <primitive object={antennaMat} />
          </mesh>
          <mesh position={[0, 0.19, 0]}>
            <sphereGeometry args={[0.006, 8, 8]} />
            <primitive object={antennaMat} />
          </mesh>
        </group>
      )}

      {/* =================================================================== */}
      {/* 2. PUERTA FRONTAL ARTICULADA CON VINILO INSECE Y CIERRES            */}
      {/* =================================================================== */}
      <group
        position={[-halfW, 0, 0.001]} // Eje de bisagras en el lado izquierdo
        rotation={[0, doorAngle, 0]}
      >
        <group position={[halfW, halfH, doorThickness / 2]}>
          {/* Hoja de la puerta de chapa con cantos plegados */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width, height, doorThickness]} />
            <primitive object={ral7035Mat} />
          </mesh>

          {/* Dos cerraduras / cierres de doble barra con huella de llave */}
          {[height * 0.25, -height * 0.25].map((lockY, idx) => (
            <group key={`lock-${idx}`} position={[-halfW + 0.04, lockY, doorThickness / 2 + 0.002]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.006, 24]} />
                <primitive object={lockMat} />
              </mesh>
              {/* Ranura para llave de doble paletón */}
              <mesh position={[0, 0, 0.004]}>
                <boxGeometry args={[0.008, 0.004, 0.003]} />
                <primitive object={darkInteriorMat} />
              </mesh>
            </group>
          ))}

          {/* Vinilo serigrafiado frontal INSECE */}
          <mesh
            position={[0.015, -0.01, doorThickness / 2 + 0.001]}
            castShadow
          >
            <planeGeometry args={[width * 0.76, height * 0.78]} />
            <primitive object={vinylMat} />
          </mesh>

          {/* Versión CON PANTALLA HMI */}
          {hasHmi ? (
            <>
              {/* Marco / Bisel de la pantalla HMI de 7" - 10" */}
              <group position={[0.015, 0.14, doorThickness / 2 + 0.008]}>
                <mesh castShadow>
                  <boxGeometry args={[0.26, 0.17, 0.014]} />
                  <primitive object={hmiBezelMat} />
                </mesh>
                {/* Pantalla de visualización */}
                <mesh position={[0, 0, 0.008]}>
                  <planeGeometry args={[0.23, 0.14]} />
                  <primitive object={hmiScreenMat} />
                </mesh>
              </group>

              {/* Selector rotativo central inferior debajo del logo */}
              <group position={[0.015, -0.165, doorThickness / 2 + 0.004]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.024, 0.024, 0.006, 24]} />
                  <primitive object={switchBlackMat} />
                </mesh>
                {/* Maneta rotativa de mando */}
                <mesh position={[0, 0, 0.014]}>
                  <boxGeometry args={[0.012, 0.038, 0.022]} />
                  <primitive object={switchBlackMat} />
                </mesh>
              </group>
            </>
          ) : (
            /* Versión ESTÁNDAR (Selector central) */
            <group position={[0.015, -0.08, doorThickness / 2 + 0.004]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.026, 0.026, 0.006, 24]} />
                <primitive object={switchBlackMat} />
              </mesh>
              {/* Maneta rotativa de mando */}
              <mesh position={[0, 0, 0.014]}>
                <boxGeometry args={[0.014, 0.042, 0.022]} />
                <primitive object={switchBlackMat} />
              </mesh>
            </group>
          )}
        </group>
      </group>
    </group>
  );
}
