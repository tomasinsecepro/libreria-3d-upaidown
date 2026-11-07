import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

export interface Filtromatic3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  inletPressureBar?: number;
  differentialPressureBar?: number;
  flushing?: boolean;
}

export function Filtromatic3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  inletPressureBar = 4.2,
  differentialPressureBar = 0.4,
  flushing = false,
}: Filtromatic3DProps) {
  // Generación de texturas procedurales para placa y manómetros
  const { labelTexture, dialTexture, arrowUpTexture, arrowRightTexture } = useMemo(() => {
    // 1. Placa FILTROMATIC
    const cvL = document.createElement('canvas');
    cvL.width = 512;
    cvL.height = 256;
    const ctxL = cvL.getContext('2d')!;
    ctxL.fillStyle = '#ffffff';
    ctxL.fillRect(0, 0, 512, 256);
    ctxL.strokeStyle = '#2980b9';
    ctxL.lineWidth = 8;
    ctxL.strokeRect(8, 8, 496, 240);
    ctxL.fillStyle = '#1462a6';
    ctxL.font = 'bold italic 68px Arial, Helvetica, sans-serif';
    ctxL.textAlign = 'center';
    ctxL.textBaseline = 'middle';
    ctxL.fillText('FILTROMATIC', 256, 95);
    ctxL.fillStyle = '#2980b9';
    ctxL.font = 'bold 30px Arial, Helvetica, sans-serif';
    ctxL.fillText('Sistemas de Filtrado', 256, 175);
    const lTex = new THREE.CanvasTexture(cvL);

    // 2. Esfera de manómetro con escala bar/psi
    const cvG = document.createElement('canvas');
    cvG.width = 256;
    cvG.height = 256;
    const ctxG = cvG.getContext('2d')!;
    ctxG.fillStyle = '#ffffff';
    ctxG.beginPath();
    ctxG.arc(128, 128, 124, 0, Math.PI * 2);
    ctxG.fill();
    ctxG.strokeStyle = '#1e2429';
    ctxG.lineWidth = 4;
    ctxG.stroke();
    ctxG.save();
    ctxG.translate(128, 128);
    for (let i = 0; i <= 20; i++) {
      const a = Math.PI * 0.75 + (i / 20) * (Math.PI * 1.5);
      ctxG.strokeStyle = i % 2 === 0 ? '#111827' : '#6b7280';
      ctxG.lineWidth = i % 2 === 0 ? 3 : 1.5;
      const r1 = 114;
      const r2 = i % 2 === 0 ? 98 : 104;
      ctxG.beginPath();
      ctxG.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctxG.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctxG.stroke();
    }
    ctxG.fillStyle = '#1f2937';
    ctxG.font = 'bold 18px Arial';
    ctxG.textAlign = 'center';
    ctxG.fillText('bar', 0, 42);
    ctxG.fillStyle = '#dc2626';
    ctxG.font = '14px Arial';
    ctxG.fillText('psi', 0, 62);
    // Aguja indicadora
    const needleA = Math.PI * 0.75 + (8.5 / 20) * (Math.PI * 1.5);
    ctxG.strokeStyle = '#111827';
    ctxG.lineWidth = 3.5;
    ctxG.beginPath();
    ctxG.moveTo(0, 0);
    ctxG.lineTo(Math.cos(needleA) * 92, Math.sin(needleA) * 92);
    ctxG.stroke();
    ctxG.fillStyle = '#dc2626';
    ctxG.beginPath();
    ctxG.arc(0, 0, 6, 0, Math.PI * 2);
    ctxG.fill();
    ctxG.restore();
    const dTex = new THREE.CanvasTexture(cvG);

    // 3. Flechas de flujo
    function makeArrow(dir: 'up' | 'right') {
      const cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 128;
      const ctx = cv.getContext('2d')!;
      ctx.clearRect(0, 0, 256, 128);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (dir === 'up') {
        ctx.moveTo(128, 20);
        ctx.lineTo(170, 70);
        ctx.lineTo(144, 70);
        ctx.lineTo(144, 110);
        ctx.lineTo(112, 110);
        ctx.lineTo(112, 70);
        ctx.lineTo(86, 70);
      } else {
        ctx.moveTo(180, 64);
        ctx.lineTo(130, 22);
        ctx.lineTo(130, 48);
        ctx.lineTo(80, 48);
        ctx.lineTo(80, 80);
        ctx.lineTo(130, 80);
        ctx.lineTo(130, 106);
      }
      ctx.closePath();
      ctx.fill();
      return new THREE.CanvasTexture(cv);
    }

    return {
      labelTexture: lTex,
      dialTexture: dTex,
      arrowUpTexture: makeArrow('up'),
      arrowRightTexture: makeArrow('right'),
    };
  }, []);

  // Materiales PBR
  const blueEpoxyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x146ec7, roughness: 0.28, metalness: 0.16 }),
    []
  );
  const chromePistonMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xf4f7fa, metalness: 0.98, roughness: 0.1 }),
    []
  );
  const stainlessMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xd6dde4, metalness: 0.92, roughness: 0.22 }),
    []
  );
  const boltMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xdde3ea, metalness: 0.95, roughness: 0.2 }),
    []
  );
  const blackPlasticMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.42, metalness: 0.08 }),
    []
  );
  const brassMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xd8a23d, metalness: 0.88, roughness: 0.28 }),
    []
  );
  const hoseMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x121416, roughness: 0.65, metalness: 0.05 }),
    []
  );
  const controllerBoxMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xe5e9ec, roughness: 0.48, metalness: 0.05 }),
    []
  );
  const labelMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: labelTexture, roughness: 0.35, metalness: 0.05 }),
    [labelTexture]
  );
  const dialMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: dialTexture, roughness: 0.25 }),
    [dialTexture]
  );

  // Dimensiones
  const bodyRadius = 0.29;
  const bodyHeight = 1.05;
  const bodyBaseY = 0.35;
  const splitY = bodyBaseY + bodyHeight; // 1.40m
  const domeH = 0.35;
  const pistonBaseY = splitY + 0.032 + domeH + 0.02; // ~1.80m
  const pistonH = 0.64;
  const pistonR = 0.052;
  const pistonCapY = pistonBaseY + 0.022 + pistonH;

  // Curvas de mangueras hidráulicas
  const hosePistonGeo = useMemo(() => {
    const pts = [
      new THREE.Vector3(-0.04, pistonCapY + 0.065, 0),
      new THREE.Vector3(-0.16, pistonCapY - 0.15, 0.08),
      new THREE.Vector3(-0.25, pistonBaseY + 0.1, 0.2),
      new THREE.Vector3(-0.24, 1.45, 0.26),
      new THREE.Vector3(-0.12, 1.15, 0.28),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.007, 8, false);
  }, [pistonCapY, pistonBaseY]);

  const p1HoseGeo = useMemo(() => {
    const pts = [
      new THREE.Vector3(-bodyRadius * 0.92, 0.33, bodyRadius * 0.38),
      new THREE.Vector3(-bodyRadius * 0.85, 0.28, bodyRadius * 0.55),
      new THREE.Vector3(-0.15, 0.3, bodyRadius + 0.03),
      new THREE.Vector3(-0.06, 0.7, bodyRadius + 0.04),
      new THREE.Vector3(0.02, 0.81, bodyRadius + 0.04),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0055, 8, false);
  }, [bodyRadius]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. CUERPO PRINCIPAL CILÍNDRICO (VESSEL) */}
      <mesh position={[0, bodyBaseY + bodyHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[bodyRadius, bodyRadius, bodyHeight, 48]} />
        <primitive object={blueEpoxyMat} />
      </mesh>

      {/* Fondo toriesférico inferior */}
      <mesh
        position={[0, bodyBaseY, 0]}
        rotation={[Math.PI, 0, 0]}
        castShadow
      >
        <sphereGeometry args={[bodyRadius, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <primitive object={blueEpoxyMat} />
      </mesh>

      {/* 2. ENTRADA INFERIOR VERTICAL DN150 */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.16, 32]} />
          <primitive object={blueEpoxyMat} />
        </mesh>
        <mesh position={[0, 0.12, 0.092]}>
          <planeGeometry args={[0.09, 0.09]} />
          <meshBasicMaterial map={arrowUpTexture} transparent />
        </mesh>
        <mesh position={[0, 0.025, 0]} castShadow>
          <cylinderGeometry args={[0.155, 0.155, 0.035, 32]} />
          <primitive object={blueEpoxyMat} />
        </mesh>
        <mesh position={[0, 0.055, 0]}>
          <cylinderGeometry args={[0.11, 0.15, 0.025, 32]} />
          <primitive object={blueEpoxyMat} />
        </mesh>
        {/* Pernos brida inferior */}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={`b-in-${i}`} position={[Math.cos(a) * 0.13, 0.025, Math.sin(a) * 0.13]}>
              <cylinderGeometry args={[0.011, 0.011, 0.045, 6]} />
              <primitive object={boltMat} />
            </mesh>
          );
        })}
      </group>

      {/* 3. SALIDA LATERAL DERECHA DN150 */}
      <group position={[0, 0.72, 0]}>
        <mesh position={[bodyRadius + 0.1, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.28, 32]} />
          <primitive object={blueEpoxyMat} />
        </mesh>
        <mesh position={[bodyRadius + 0.24, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.155, 0.155, 0.035, 32]} />
          <primitive object={blueEpoxyMat} />
        </mesh>
        <mesh position={[bodyRadius + 0.1, 0, 0.092]}>
          <planeGeometry args={[0.1, 0.07]} />
          <meshBasicMaterial map={arrowRightTexture} transparent />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={`b-out-${i}`}
              position={[bodyRadius + 0.24, Math.cos(a) * 0.13, Math.sin(a) * 0.13]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.011, 0.011, 0.045, 6]} />
              <primitive object={boltMat} />
            </mesh>
          );
        })}
      </group>

      {/* 4. BRIDAS INTERMEDIAS Y 16 PERNOS DE CIERRE */}
      <mesh position={[0, splitY - 0.016, 0]} castShadow>
        <cylinderGeometry args={[bodyRadius + 0.055, bodyRadius + 0.055, 0.032, 48]} />
        <primitive object={blueEpoxyMat} />
      </mesh>
      <mesh position={[0, splitY + 0.016, 0]} castShadow>
        <cylinderGeometry args={[bodyRadius + 0.055, bodyRadius + 0.055, 0.032, 48]} />
        <primitive object={blueEpoxyMat} />
      </mesh>
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <mesh
            key={`bolt-mid-${i}`}
            position={[Math.cos(a) * (bodyRadius + 0.035), splitY, Math.sin(a) * (bodyRadius + 0.035)]}
            castShadow
          >
            <cylinderGeometry args={[0.01, 0.01, 0.099, 6]} />
            <primitive object={boltMat} />
          </mesh>
        );
      })}

      {/* 5. CÚPULA SUPERIOR */}
      <group position={[0, splitY + 0.032, 0]}>
        <mesh scale={[1, domeH / bodyRadius, 1]} castShadow>
          <sphereGeometry args={[bodyRadius, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <primitive object={blueEpoxyMat} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[bodyRadius, bodyRadius, 0.12, 48]} />
          <primitive object={blueEpoxyMat} />
        </mesh>
      </group>

      {/* 6. PISTÓN HIDRÁULICO VERTICAL CROMADO */}
      <mesh position={[0, pistonBaseY, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.045, 32]} />
        <primitive object={blueEpoxyMat} />
      </mesh>
      <mesh position={[0, pistonBaseY + 0.022 + pistonH / 2, 0]} castShadow>
        <cylinderGeometry args={[pistonR, pistonR, pistonH, 32]} />
        <primitive object={chromePistonMat} />
      </mesh>
      <mesh position={[0, pistonCapY + 0.032, 0]} castShadow>
        <cylinderGeometry args={[pistonR + 0.008, pistonR + 0.008, 0.065, 32]} />
        <primitive object={stainlessMat} />
      </mesh>
      <mesh position={[-0.02, pistonCapY + 0.065, 0]}>
        <boxGeometry args={[0.03, 0.03, 0.04]} />
        <primitive object={brassMat} />
      </mesh>
      <mesh geometry={hosePistonGeo} castShadow>
        <primitive object={hoseMat} />
      </mesh>

      {/* 7. VÁLVULA DE LAVADO A CONTRACORRIENTE (ÁNGULO 2") */}
      <group position={[-bodyRadius + 0.02, splitY + 0.18, 0.04]} rotation={[0, Math.PI * 0.15, 0]}>
        <mesh position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.1, 24]} />
          <primitive object={blueEpoxyMat} />
        </mesh>
        <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.075, 0.075, 0.024, 24]} />
          <primitive object={blueEpoxyMat} />
        </mesh>
        <mesh position={[-0.19, 0, 0]} castShadow>
          <boxGeometry args={[0.14, 0.14, 0.14]} />
          <primitive object={blackPlasticMat} />
        </mesh>
        <group position={[-0.22, 0.06, 0]} rotation={[0, 0, 0.45]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.09, 0.09, 24]} />
            <primitive object={blackPlasticMat} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.05, 16]} />
            <primitive object={blackPlasticMat} />
          </mesh>
        </group>
        <mesh position={[-0.29, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.12, 24]} />
          <primitive object={blackPlasticMat} />
        </mesh>
      </group>

      {/* 8. TRES MANÓMETROS DE GLICERINA */}
      {/* P1 Inferior */}
      <group
        position={[-bodyRadius * 0.92, 0.38, bodyRadius * 0.38]}
        rotation={[0, -Math.PI * 0.35, 0]}
      >
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.009, 0.009, 0.05, 12]} />
          <primitive object={brassMat} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.025, 32]} />
          <primitive object={stainlessMat} />
        </mesh>
        <mesh position={[0, 0, 0.013]}>
          <circleGeometry args={[0.042, 32]} />
          <primitive object={dialMat} />
        </mesh>
      </group>

      {/* P2 Intermedio */}
      <group
        position={[-bodyRadius * 0.92, 0.88, bodyRadius * 0.38]}
        rotation={[0, -Math.PI * 0.35, 0]}
      >
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.009, 0.009, 0.05, 12]} />
          <primitive object={brassMat} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.025, 32]} />
          <primitive object={stainlessMat} />
        </mesh>
        <mesh position={[0, 0, 0.013]}>
          <circleGeometry args={[0.042, 32]} />
          <primitive object={dialMat} />
        </mesh>
      </group>

      {/* P3 Superior */}
      <group
        position={[-bodyRadius * 0.78, 1.62, bodyRadius * 0.45]}
        rotation={[0, -Math.PI * 0.35, 0]}
      >
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.009, 0.009, 0.05, 12]} />
          <primitive object={brassMat} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.025, 32]} />
          <primitive object={stainlessMat} />
        </mesh>
        <mesh position={[0, 0, 0.013]}>
          <circleGeometry args={[0.042, 32]} />
          <primitive object={dialMat} />
        </mesh>
      </group>

      {/* 9. CAJA DE CONTROL ELECTRÓNICA IP65 CON SOLENOIDE */}
      <group position={[0.08, 0.94, bodyRadius + 0.01]}>
        <mesh position={[0, 0, 0.045]} castShadow>
          <boxGeometry args={[0.2, 0.24, 0.09]} />
          <primitive object={controllerBoxMat} />
        </mesh>
        {/* Solenoide de pilotaje */}
        <group position={[0.14, -0.02, 0.045]}>
          <mesh>
            <boxGeometry args={[0.035, 0.045, 0.035]} />
            <primitive object={brassMat} />
          </mesh>
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.065, 16]} />
            <primitive object={blackPlasticMat} />
          </mesh>
          <mesh position={[0, 0.055, 0.02]}>
            <boxGeometry args={[0.025, 0.025, 0.035]} />
            <primitive object={blackPlasticMat} />
          </mesh>
        </group>
      </group>

      {/* 10. PLACA LOGOTIPO FILTROMATIC */}
      <mesh position={[0.06, 1.25, bodyRadius + 0.005]} castShadow>
        <planeGeometry args={[0.36, 0.15]} />
        <primitive object={labelMat} />
      </mesh>

      {/* 11. MANGUERA INFERIOR P1 */}
      <mesh geometry={p1HoseGeo}>
        <primitive object={hoseMat} />
      </mesh>
    </group>
  );
}
