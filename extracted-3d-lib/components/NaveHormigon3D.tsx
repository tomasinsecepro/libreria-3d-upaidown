import React, { useMemo } from 'react';
import * as THREE from 'three';

export interface NaveHormigon3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  width?: number; // Ancho fachada (25m por defecto)
  length?: number; // Largo lateral (40m por defecto)
  wallHeight?: number; // Altura a cumbrera/alero (8m por defecto)
  ridgeHeight?: number; // Altura máxima en cumbrera (10.5m por defecto)
  gateOpen?: boolean;
}

export function NaveHormigon3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  width = 25,
  length = 40,
  wallHeight = 7.8,
  ridgeHeight = 10.4,
  gateOpen = true,
}: NaveHormigon3DProps) {
  // Texturas procedimentales para hormigón, cubierta y portadas
  const { concreteTexture, roofTexture, gateTexture } = useMemo(() => {
    // 1. Textura de hormigón prefabricado con llagas horizontales y poro (gris hormigón auténtico)
    const cvC = document.createElement('canvas');
    cvC.width = 512;
    cvC.height = 512;
    const ctxC = cvC.getContext('2d')!;

    ctxC.fillStyle = '#8f959b';
    ctxC.fillRect(0, 0, 512, 512);

    // Ruido fino de poro y árido
    const imgData = ctxC.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 22;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctxC.putImageData(imgData, 0, 0);

    // Llagas / juntas horizontales entre placas alveolares
    for (let y of [128, 256, 384]) {
      ctxC.strokeStyle = '#5b6167';
      ctxC.lineWidth = 5;
      ctxC.beginPath();
      ctxC.moveTo(0, y);
      ctxC.lineTo(512, y);
      ctxC.stroke();

      ctxC.strokeStyle = '#b2b8be';
      ctxC.lineWidth = 1.5;
      ctxC.beginPath();
      ctxC.moveTo(0, y + 3);
      ctxC.lineTo(512, y + 3);
      ctxC.stroke();
    }
    const cTex = new THREE.CanvasTexture(cvC);
    cTex.wrapS = THREE.RepeatWrapping;
    cTex.wrapT = THREE.RepeatWrapping;
    cTex.repeat.set(4, 2);

    // 2. Textura panel sándwich de cubierta blanco Pirineo (RAL 9010)
    const cvR = document.createElement('canvas');
    cvR.width = 256;
    cvR.height = 256;
    const ctxR = cvR.getContext('2d')!;
    ctxR.fillStyle = '#ffffff';
    ctxR.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 32) {
      ctxR.fillStyle = '#e2e7ec';
      ctxR.fillRect(x, 0, 8, 256);
      ctxR.fillStyle = '#cbd2d9';
      ctxR.fillRect(x + 7, 0, 1.5, 256);
      ctxR.fillStyle = '#ffffff';
      ctxR.fillRect(x > 0 ? x - 1 : 0, 0, 1, 256);
    }
    const rTex = new THREE.CanvasTexture(cvR);
    rTex.wrapS = THREE.RepeatWrapping;
    rTex.wrapT = THREE.RepeatWrapping;
    rTex.repeat.set(14, 8);

    // 3. Textura chapa perfilada para portadas verdes oscuras
    const cvG = document.createElement('canvas');
    cvG.width = 256;
    cvG.height = 256;
    const ctxG = cvG.getContext('2d')!;
    ctxG.fillStyle = '#153a28';
    ctxG.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 16) {
      ctxG.fillStyle = '#1d4c35';
      ctxG.fillRect(x, 0, 6, 256);
      ctxG.fillStyle = '#0e261a';
      ctxG.fillRect(x + 5, 0, 1.5, 256);
    }
    const gTex = new THREE.CanvasTexture(cvG);
    gTex.wrapS = THREE.RepeatWrapping;
    gTex.wrapT = THREE.RepeatWrapping;
    gTex.repeat.set(6, 6);

    return { concreteTexture: cTex, roofTexture: rTex, gateTexture: gTex };
  }, []);

  // Materiales PBR
  const concreteMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: concreteTexture,
        roughness: 0.94,
        metalness: 0.03,
      }),
    [concreteTexture]
  );

  // Verde carruaje oscuro característico de remates, cumbrera y portadas
  const trimGreenMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x153b29,
        roughness: 0.38,
        metalness: 0.35,
      }),
    []
  );

  const gateSheetMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x18422e,
        map: gateTexture,
        roughness: 0.42,
        metalness: 0.32,
      }),
    [gateTexture]
  );

  const steelDarkMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x22262a,
        roughness: 0.5,
        metalness: 0.75,
      }),
    []
  );

  const roofMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xfcffff,
        map: roofTexture,
        roughness: 0.32,
        metalness: 0.15,
      }),
    [roofTexture]
  );

  const skylightMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.65,
      }),
    []
  );

  const floorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x827d74,
        roughness: 0.95,
        metalness: 0.02,
      }),
    []
  );

  // Parámetros geométricos
  const halfW = width / 2; // 12.5m
  const halfL = length / 2; // 20m
  const gateW = 6.2;
  const gateH = 5.8;
  const numBays = 6; // 6 pórticos / 5 vanos de 8 metros
  const baySpacing = length / (numBays - 1); // 8m

  // Geometría del testero delantero a dos aguas con hueco de portón
  const { frontWallGeo, rearWallGeo } = useMemo(() => {
    // Testero con portón
    const shape = new THREE.Shape();
    shape.moveTo(-halfW, 0);
    shape.lineTo(halfW, 0);
    shape.lineTo(halfW, wallHeight);
    shape.lineTo(0, ridgeHeight);
    shape.lineTo(-halfW, wallHeight);
    shape.closePath();

    // Hueco del portón central
    const hole = new THREE.Path();
    hole.moveTo(-gateW / 2, 0);
    hole.lineTo(gateW / 2, 0);
    hole.lineTo(gateW / 2, gateH);
    hole.lineTo(-gateW / 2, gateH);
    hole.closePath();
    shape.holes.push(hole);

    const fGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });

    // Testero trasero con hueco de portón para paso de maquinaria
    const rearShape = new THREE.Shape();
    rearShape.moveTo(-halfW, 0);
    rearShape.lineTo(halfW, 0);
    rearShape.lineTo(halfW, wallHeight);
    rearShape.lineTo(0, ridgeHeight);
    rearShape.lineTo(-halfW, wallHeight);
    rearShape.closePath();

    const rearHole = new THREE.Path();
    rearHole.moveTo(-gateW / 2, 0);
    rearHole.lineTo(gateW / 2, 0);
    rearHole.lineTo(gateW / 2, gateH);
    rearHole.lineTo(-gateW / 2, gateH);
    rearHole.closePath();
    rearShape.holes.push(rearHole);

    const rGeo = new THREE.ExtrudeGeometry(rearShape, { depth: 0.3, bevelEnabled: false });

    return { frontWallGeo: fGeo, rearWallGeo: rGeo };
  }, [halfW, wallHeight, ridgeHeight, gateW, gateH]);

  // Pendiente de cubierta y cálculo de faldón
  const slopeLen = useMemo(
    () => Math.hypot(halfW + 0.45, ridgeHeight - wallHeight),
    [halfW, ridgeHeight, wallHeight]
  );
  const pitchAngle = useMemo(
    () => Math.atan2(ridgeHeight - wallHeight, halfW + 0.45),
    [ridgeHeight, wallHeight, halfW]
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* ================================================================= */}
      {/* 1. SOLERA INTERIOR Y LECHO DE CIMENTACIÓN                        */}
      {/* ================================================================= */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[width + 3, 0.12, length + 3]} />
        <primitive object={floorMat} />
      </mesh>

      {/* ================================================================= */}
      {/* 2. PAREDES DE PANELES PREFABRICADOS DE HORMIGÓN                  */}
      {/* ================================================================= */}
      {/* Testero frontal con portón */}
      <mesh geometry={frontWallGeo} position={[0, 0, halfL - 0.3]} castShadow receiveShadow>
        <primitive object={concreteMat} />
      </mesh>

      {/* Testero trasero */}
      <mesh geometry={rearWallGeo} position={[0, 0, -halfL]} castShadow receiveShadow>
        <primitive object={concreteMat} />
      </mesh>

      {/* Pared lateral izquierda (40 metros) */}
      <mesh position={[-halfW + 0.15, wallHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, wallHeight, length]} />
        <primitive object={concreteMat} />
      </mesh>

      {/* Pared lateral derecha (40 metros) */}
      <mesh position={[halfW - 0.15, wallHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, wallHeight, length]} />
        <primitive object={concreteMat} />
      </mesh>

      {/* ================================================================= */}
      {/* 3. PERFILES DE REMATE Y ESQUINAS EN VERDE CARRUAJE (DE LA FOTO)   */}
      {/* ================================================================= */}
      {/* Remates de esquina verticales verde oscuro */}
      {[
        [-halfW, halfL],
        [halfW, halfL],
        [-halfW, -halfL],
        [halfW, -halfL],
      ].map(([cx, cz], idx) => (
        <mesh key={`corner-${idx}`} position={[cx, wallHeight / 2, cz]} castShadow>
          <boxGeometry args={[0.38, wallHeight + 0.05, 0.38]} />
          <primitive object={trimGreenMat} />
        </mesh>
      ))}

      {/* Perfiles de fachada vertical que modulan los paneles prefabricados */}
      {[-halfW + 5.5, halfW - 5.5].map((fx, idx) => (
        <mesh key={`front-trim-${idx}`} position={[fx, wallHeight / 2 + 0.5, halfL + 0.02]} castShadow>
          <boxGeometry args={[0.16, wallHeight + 1.2, 0.08]} />
          <primitive object={trimGreenMat} />
        </mesh>
      ))}

      {/* Portadas verdes oscuras correderas en fachada frontal y trasera */}
      {[true, false].map((isFront) => (
        <group
          key={`sliding-gate-${isFront ? 'front' : 'rear'}`}
          position={[0, 0, isFront ? halfL + 0.03 : -halfL - 0.03]}
          rotation={[0, isFront ? 0 : Math.PI, 0]}
        >
          {/* Jambas y Dintel perimetrales */}
          <mesh position={[-gateW / 2 - 0.08, gateH / 2, 0]} castShadow>
            <boxGeometry args={[0.18, gateH, 0.12]} />
            <primitive object={trimGreenMat} />
          </mesh>
          <mesh position={[gateW / 2 + 0.08, gateH / 2, 0]} castShadow>
            <boxGeometry args={[0.18, gateH, 0.12]} />
            <primitive object={trimGreenMat} />
          </mesh>
          <mesh position={[0, gateH + 0.08, 0]} castShadow>
            <boxGeometry args={[gateW + 0.34, 0.18, 0.12]} />
            <primitive object={trimGreenMat} />
          </mesh>

          {/* Guía superior de deslizamiento */}
          <mesh position={[0, gateH + 0.22, 0.08]}>
            <boxGeometry args={[gateW * 1.8, 0.08, 0.08]} />
            <primitive object={trimGreenMat} />
          </mesh>

          {/* Hoja izquierda (Portadas verdes oscuras de chapa grecada y marco reforzado) */}
          <group position={[-(gateW / 2 + 0.12) / 2 + 0.06, (gateH - 0.04) / 2, 0.04]}>
            <mesh castShadow>
              <boxGeometry args={[gateW / 2 + 0.12, gateH - 0.04, 0.04]} />
              <primitive object={gateSheetMat} />
            </mesh>
            {/* Marco perimetral */}
            <mesh position={[-(gateW / 2 + 0.12) / 2 + 0.04, 0, 0]}>
              <boxGeometry args={[0.08, gateH - 0.04, 0.08]} />
              <primitive object={trimGreenMat} />
            </mesh>
            <mesh position={[(gateW / 2 + 0.12) / 2 - 0.05, 0, 0]}>
              <boxGeometry args={[0.1, gateH - 0.04, 0.08]} />
              <primitive object={trimGreenMat} />
            </mesh>
            {[-(gateH - 0.04) / 2 + 0.05, 0, (gateH - 0.04) / 2 - 0.05].map((py, i) => (
              <mesh key={`fh-l-${i}`} position={[0, py, 0]}>
                <boxGeometry args={[gateW / 2 + 0.12, 0.1, 0.08]} />
                <primitive object={trimGreenMat} />
              </mesh>
            ))}
            {/* Tirador vertical */}
            <mesh position={[(gateW / 2 + 0.12) / 2 - 0.28, -0.6, 0.06]}>
              <cylinderGeometry args={[0.02, 0.02, 0.9, 12]} />
              <primitive object={steelDarkMat} />
            </mesh>
          </group>

          {/* Hoja derecha */}
          <group position={[(gateW / 2 + 0.12) / 2 - 0.06, (gateH - 0.04) / 2, 0.11]}>
            <mesh castShadow>
              <boxGeometry args={[gateW / 2 + 0.12, gateH - 0.04, 0.04]} />
              <primitive object={gateSheetMat} />
            </mesh>
            {/* Marco perimetral */}
            <mesh position={[-(gateW / 2 + 0.12) / 2 + 0.05, 0, 0]}>
              <boxGeometry args={[0.1, gateH - 0.04, 0.08]} />
              <primitive object={trimGreenMat} />
            </mesh>
            <mesh position={[(gateW / 2 + 0.12) / 2 - 0.04, 0, 0]}>
              <boxGeometry args={[0.08, gateH - 0.04, 0.08]} />
              <primitive object={trimGreenMat} />
            </mesh>
            {[-(gateH - 0.04) / 2 + 0.05, 0, (gateH - 0.04) / 2 - 0.05].map((py, i) => (
              <mesh key={`fh-r-${i}`} position={[0, py, 0]}>
                <boxGeometry args={[gateW / 2 + 0.12, 0.1, 0.08]} />
                <primitive object={trimGreenMat} />
              </mesh>
            ))}
            {/* Tirador vertical */}
            <mesh position={[-(gateW / 2 + 0.12) / 2 + 0.28, -0.6, 0.06]}>
              <cylinderGeometry args={[0.02, 0.02, 0.9, 12]} />
              <primitive object={steelDarkMat} />
            </mesh>
          </group>

          {/* Rodamientos superiores sobre la guía */}
          {[-(gateW / 2 + 0.12) / 2 + 0.4, (gateW / 2 + 0.12) / 2 - 0.4].map((rx, rIdx) => (
            <React.Fragment key={`rollers-${rIdx}`}>
              <mesh position={[-(gateW / 2 + 0.12) / 2 + 0.06 + rx, gateH + 0.14, 0.04]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
                <primitive object={steelDarkMat} />
              </mesh>
              <mesh position={[(gateW / 2 + 0.12) / 2 - 0.06 + rx, gateH + 0.14, 0.11]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
                <primitive object={steelDarkMat} />
              </mesh>
            </React.Fragment>
          ))}
        </group>
      ))}

      {/* Remate en cumbrera y aleros frontales a dos aguas */}
      {[-halfL, halfL].map((z, idx) => (
        <group key={`gable-trim-${idx}`} position={[0, 0, z + (idx === 1 ? 0.02 : -0.32)]}>
          {/* Faldón izquierdo testero */}
          <mesh
            position={[-halfW / 2, (wallHeight + ridgeHeight) / 2 + 0.04, 0]}
            rotation={[0, 0, pitchAngle]}
          >
            <boxGeometry args={[slopeLen, 0.18, 0.12]} />
            <primitive object={trimGreenMat} />
          </mesh>
          {/* Faldón derecho testero */}
          <mesh
            position={[halfW / 2, (wallHeight + ridgeHeight) / 2 + 0.04, 0]}
            rotation={[0, 0, -pitchAngle]}
          >
            <boxGeometry args={[slopeLen, 0.18, 0.12]} />
            <primitive object={trimGreenMat} />
          </mesh>
        </group>
      ))}

      {/* Canalones de recogida de pluviales en aleros laterales */}
      {[-halfW - 0.1, halfW + 0.1].map((gx, idx) => (
        <mesh key={`gutter-${idx}`} position={[gx, wallHeight - 0.05, 0]} castShadow>
          <boxGeometry args={[0.22, 0.18, length + 0.4]} />
          <primitive object={trimGreenMat} />
        </mesh>
      ))}

      {/* Bajantes de pluviales en esquinas */}
      {[
        [-halfW - 0.12, halfL - 0.5],
        [halfW + 0.12, halfL - 0.5],
        [-halfW - 0.12, -halfL + 0.5],
        [halfW + 0.12, -halfL + 0.5],
      ].map(([dx, dz], idx) => (
        <mesh key={`downpipe-${idx}`} position={[dx, wallHeight / 2, dz]}>
          <cylinderGeometry args={[0.07, 0.07, wallHeight, 14]} />
          <primitive object={trimGreenMat} />
        </mesh>
      ))}

      {/* ================================================================= */}
      {/* 4. CUBIERTA A DOS AGUAS CON PANELES SÁNDWICH Y LUCERNARIOS        */}
      {/* ================================================================= */}
      {/* Faldón izquierdo */}
      <group
        position={[-halfW / 2, (wallHeight + ridgeHeight) / 2, 0]}
        rotation={[0, 0, pitchAngle]}
      >
        <mesh receiveShadow castShadow>
          <boxGeometry args={[slopeLen, 0.14, length + 0.3]} />
          <primitive object={roofMat} />
        </mesh>
        {/* Lucernarios translúcidos cenitales en franjas */}
        {[-12, -4, 4, 12].map((sz, idx) => (
          <mesh key={`skylight-l-${idx}`} position={[0, 0.08, sz]}>
            <boxGeometry args={[slopeLen * 0.75, 0.02, 1.4]} />
            <primitive object={skylightMat} />
          </mesh>
        ))}
      </group>

      {/* Faldón derecho */}
      <group
        position={[halfW / 2, (wallHeight + ridgeHeight) / 2, 0]}
        rotation={[0, 0, -pitchAngle]}
      >
        <mesh receiveShadow castShadow>
          <boxGeometry args={[slopeLen, 0.14, length + 0.3]} />
          <primitive object={roofMat} />
        </mesh>
        {/* Lucernarios translúcidos cenitales en franjas */}
        {[-12, -4, 4, 12].map((sz, idx) => (
          <mesh key={`skylight-r-${idx}`} position={[0, 0.08, sz]}>
            <boxGeometry args={[slopeLen * 0.75, 0.02, 1.4]} />
            <primitive object={skylightMat} />
          </mesh>
        ))}
      </group>

      {/* Remate de cumbrera longitudinal en verde */}
      <mesh position={[0, ridgeHeight + 0.1, 0]}>
        <boxGeometry args={[0.55, 0.14, length + 0.4]} />
        <primitive object={trimGreenMat} />
      </mesh>

      {/* ================================================================= */}
      {/* 5. ESTRUCTURA INTERIOR VISIBLE: PÓRTICOS METÁLICOS IPE/HEA        */}
      {/* ================================================================= */}
      {Array.from({ length: numBays }).map((_, bIdx) => {
        const bZ = -halfL + bIdx * baySpacing;
        return (
          <group key={`portal-${bIdx}`} position={[0, 0, bZ]}>
            {/* Pilar IPE izquierdo */}
            <mesh position={[-halfW + 0.45, wallHeight / 2, 0]} castShadow>
              <boxGeometry args={[0.42, wallHeight, 0.22]} />
              <primitive object={steelDarkMat} />
            </mesh>
            {/* Pilar IPE derecho */}
            <mesh position={[halfW - 0.45, wallHeight / 2, 0]} castShadow>
              <boxGeometry args={[0.42, wallHeight, 0.22]} />
              <primitive object={steelDarkMat} />
            </mesh>
            {/* Dintel izquierdo en ángulo */}
            <mesh
              position={[-halfW / 2, (wallHeight + ridgeHeight) / 2 - 0.2, 0]}
              rotation={[0, 0, pitchAngle]}
              castShadow
            >
              <boxGeometry args={[slopeLen, 0.38, 0.2]} />
              <primitive object={steelDarkMat} />
            </mesh>
            {/* Dintel derecho en ángulo */}
            <mesh
              position={[halfW / 2, (wallHeight + ridgeHeight) / 2 - 0.2, 0]}
              rotation={[0, 0, -pitchAngle]}
              castShadow
            >
              <boxGeometry args={[slopeLen, 0.38, 0.2]} />
              <primitive object={steelDarkMat} />
            </mesh>
            {/* Cartela de unión de cumbrera */}
            <mesh position={[0, ridgeHeight - 0.45, 0]}>
              <boxGeometry args={[0.6, 0.4, 0.2]} />
              <primitive object={steelDarkMat} />
            </mesh>
          </group>
        );
      })}

      {/* Correas longitudinales de cubierta (purlins) */}
      {[-8, -4, 0, 4, 8].map((px, idx) => {
        const py = wallHeight + (1 - Math.abs(px) / halfW) * (ridgeHeight - wallHeight) - 0.42;
        return (
          <mesh key={`purlin-${idx}`} position={[px, py, 0]}>
            <boxGeometry args={[0.12, 0.16, length - 0.8]} />
            <primitive object={steelDarkMat} />
          </mesh>
        );
      })}
    </group>
  );
}
