import React, { useMemo } from 'react';
import * as THREE from 'three';

export interface CenadorMadera3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  diameter?: number; // Diámetro total (6.0 metros según foto)
  height?: number;   // Altura total hasta la cumbrera (~3.75 metros)
  includeFloor?: boolean; // Suelo opcional (false para que quede limpio y aislado sin fondo)
  bench?: boolean;   // Banco corrido perimetral interior
}

export function CenadorMadera3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  diameter = 6.0,
  height = 3.75,
  includeFloor = false,
  bench = true,
}: CenadorMadera3DProps) {
  // Parámetros geométricos exactos del cenador octogonal
  const radius = diameter / 2; // 3.0 m
  const eavesHeight = 2.35;    // Altura libre hasta vigas de cubierta
  const roofHeight = height - eavesHeight; // 1.4 m
  const roofOverhang = 0.38;   // Vuelo exterior del tejado
  const roofRadius = radius + roofOverhang; // 3.38 m
  const railHeight = 1.08;     // Altura de la empalizada de rollizos
  const numSides = 8;          // Estructura octogonal

  // Generación de texturas PBR procedimentales hiperrealistas
  const {
    timberMat,
    palisadeMat,
    heatherRoofMat,
    roofUndersideMat,
    metalBoltMat,
    benchMat,
    deckingMat,
  } = useMemo(() => {
    // 1. Textura de madera rústica tratada (Postes, vigas y jabalcones)
    const cvTimber = document.createElement('canvas');
    cvTimber.width = 512;
    cvTimber.height = 512;
    const ctxT = cvTimber.getContext('2d');
    if (ctxT) {
      ctxT.fillStyle = '#3e2d1f';
      ctxT.fillRect(0, 0, 512, 512);
      // Vetas longitudinales de pino tratado al autoclave / lasur oscuro
      for (let y = 0; y < 512; y += 2) {
        const v = Math.sin(y * 0.08) * 15;
        ctxT.fillStyle = `rgba(${50 + v}, ${35 + v * 0.7}, ${22 + v * 0.5}, ${0.15 + Math.random() * 0.25})`;
        ctxT.fillRect(0, y, 512, 1 + Math.random() * 2);
      }
      // Nudos naturales de madera
      for (let k = 0; k < 6; k++) {
        const kx = Math.random() * 512;
        const ky = Math.random() * 512;
        const grad = ctxT.createRadialGradient(kx, ky, 2, kx, ky, 25);
        grad.addColorStop(0, '#1c130c');
        grad.addColorStop(0.5, '#2e1f13');
        grad.addColorStop(1, 'transparent');
        ctxT.fillStyle = grad;
        ctxT.beginPath();
        ctxT.arc(kx, ky, 25, 0, Math.PI * 2);
        ctxT.fill();
      }
    }
    const timberTex = new THREE.CanvasTexture(cvTimber);
    timberTex.wrapS = THREE.RepeatWrapping;
    timberTex.wrapT = THREE.RepeatWrapping;
    timberTex.repeat.set(2, 4);

    const tMat = new THREE.MeshStandardMaterial({
      map: timberTex,
      color: 0x4a3625,
      roughness: 0.88,
      metalness: 0.04,
    });

    // 2. Textura de empalizada / rollizos verticales
    const pMat = new THREE.MeshStandardMaterial({
      map: timberTex,
      color: 0x423020,
      roughness: 0.92,
      metalness: 0.03,
    });

    // 3. Textura hiperrealista de cubierta de brezo rústico oscuro (Heather Thatch)
    const cvRoof = document.createElement('canvas');
    cvRoof.width = 512;
    cvRoof.height = 512;
    const ctxR = cvRoof.getContext('2d');
    if (ctxR) {
      // Base de brezo oscuro envejecido
      ctxR.fillStyle = '#221c17';
      ctxR.fillRect(0, 0, 512, 512);

      // Entramado de ramitas de brezo densas
      for (let i = 0; i < 3500; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const len = 15 + Math.random() * 45;
        const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.45; // fibras orientadas hacia abajo
        const colVal = Math.floor(45 + Math.random() * 65);
        ctxR.strokeStyle = `rgba(${colVal + 15}, ${colVal + 5}, ${colVal - 10}, ${0.4 + Math.random() * 0.5})`;
        ctxR.lineWidth = 1 + Math.random() * 2;
        ctxR.beginPath();
        ctxR.moveTo(x, y);
        ctxR.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctxR.stroke();
      }

      // Hebras doradas y pajizas secas sobrepuestas (tal como se ve en la foto)
      for (let j = 0; j < 650; j++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const len = 10 + Math.random() * 30;
        const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.7;
        ctxR.strokeStyle = `rgba(${135 + Math.random() * 45}, ${115 + Math.random() * 35}, ${75 + Math.random() * 25}, 0.75)`;
        ctxR.lineWidth = 1.2;
        ctxR.beginPath();
        ctxR.moveTo(x, y);
        ctxR.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctxR.stroke();
      }
    }
    const roofTex = new THREE.CanvasTexture(cvRoof);
    roofTex.wrapS = THREE.RepeatWrapping;
    roofTex.wrapT = THREE.RepeatWrapping;
    roofTex.repeat.set(4, 3);

    const hRoofMat = new THREE.MeshStandardMaterial({
      map: roofTex,
      color: 0x322a22,
      roughness: 0.96,
      metalness: 0.02,
    });

    const rUndersideMat = new THREE.MeshStandardMaterial({
      map: timberTex,
      color: 0x3d2b1c,
      roughness: 0.85,
    });

    const mBoltMat = new THREE.MeshStandardMaterial({
      color: 0x1d1e20,
      metalness: 0.85,
      roughness: 0.4,
    });

    const bMat = new THREE.MeshStandardMaterial({
      map: timberTex,
      color: 0x5a412c,
      roughness: 0.75,
      metalness: 0.05,
    });

    const dMat = new THREE.MeshStandardMaterial({
      map: timberTex,
      color: 0x473424,
      roughness: 0.85,
    });

    return {
      timberMat: tMat,
      palisadeMat: pMat,
      heatherRoofMat: hRoofMat,
      roofUndersideMat: rUndersideMat,
      metalBoltMat: mBoltMat,
      benchMat: bMat,
      deckingMat: dMat,
    };
  }, []);

  // Vértices del octógono
  const vertices = useMemo(() => {
    const list: [number, number][] = [];
    for (let i = 0; i < numSides; i++) {
      const angle = (i / numSides) * Math.PI * 2;
      list.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
    }
    return list;
  }, [radius, numSides]);

  // Vértices con vuelo exterior para el alero del tejado
  const roofEavesVertices = useMemo(() => {
    const list: [number, number][] = [];
    for (let i = 0; i < numSides; i++) {
      const angle = (i / numSides) * Math.PI * 2;
      list.push([Math.cos(angle) * roofRadius, Math.sin(angle) * roofRadius]);
    }
    return list;
  }, [roofRadius, numSides]);

  // Geometría del faldón de cubierta octogonal (8 triángulos unidos)
  const roofGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const apex: [number, number, number] = [0, height, 0];

    for (let i = 0; i < numSides; i++) {
      const next = (i + 1) % numSides;
      const [x1, z1] = roofEavesVertices[i];
      const [x2, z2] = roofEavesVertices[next];
      const yEaves = eavesHeight - 0.12;

      // Triángulo de cada cara de la cubierta
      positions.push(apex[0], apex[1], apex[2]);
      positions.push(x1, yEaves, z1);
      positions.push(x2, yEaves, z2);

      // Normal aproximada del faldón
      const vA = new THREE.Vector3(x1 - apex[0], yEaves - apex[1], z1 - apex[2]);
      const vB = new THREE.Vector3(x2 - apex[0], yEaves - apex[1], z2 - apex[2]);
      const norm = new THREE.Vector3().crossVectors(vA, vB).normalize();

      normals.push(norm.x, norm.y, norm.z);
      normals.push(norm.x, norm.y, norm.z);
      normals.push(norm.x, norm.y, norm.z);

      uvs.push(0.5, 1.0);
      uvs.push(0.0, 0.0);
      uvs.push(1.0, 0.0);
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    return geom;
  }, [roofEavesVertices, height, eavesHeight, numSides]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* =================================================================== */}
      {/* 1. SUELO DE MADERA EN TARIMA (OPCIONAL / LIMPIO SIN FONDO)          */}
      {/* =================================================================== */}
      {includeFloor && (
        <group position={[0, 0.03, 0]}>
          <mesh receiveShadow>
            <cylinderGeometry args={[radius - 0.05, radius, 0.06, numSides]} />
            <primitive object={deckingMat} />
          </mesh>
        </group>
      )}

      {/* =================================================================== */}
      {/* 2. PILARES / POSTES DE MADERA ROLLIZA TRATADA (8 COLUMNAS)         */}
      {/* =================================================================== */}
      {vertices.map(([px, pz], i) => (
        <group key={`post-${i}`} position={[px, eavesHeight / 2, pz]}>
          {/* Poste vertical de pino tratado */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.085, 0.09, eavesHeight, 20]} />
            <primitive object={timberMat} />
          </mesh>

          {/* Zapata / casquillo metálico discreto inferior */}
          <mesh position={[0, -eavesHeight / 2 + 0.03, 0]}>
            <cylinderGeometry args={[0.095, 0.10, 0.06, 16]} />
            <primitive object={metalBoltMat} />
          </mesh>

          {/* Tornapuntas / Jabalcones a 45° a izquierda y derecha */}
          {[-1, 1].map((dir, dIdx) => {
            const nextIdx = (i + dir + numSides) % numSides;
            const [nx, nz] = vertices[nextIdx];
            const dx = nx - px;
            const dz = nz - pz;
            const dist = Math.hypot(dx, dz);
            const midAngle = Math.atan2(dz, dx);

            return (
              <group
                key={`brace-${dIdx}`}
                position={[0, eavesHeight / 2 - 0.35, 0]}
                rotation={[0, -midAngle, 0]}
              >
                <mesh
                  position={[0.32, 0.18, 0]}
                  rotation={[0, 0, -Math.PI / 4]}
                  castShadow
                >
                  <boxGeometry args={[0.52, 0.085, 0.08]} />
                  <primitive object={timberMat} />
                </mesh>
                {/* Perno de fijación pasante */}
                <mesh position={[0.12, 0.03, 0]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.10, 8]} />
                  <primitive object={metalBoltMat} />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}

      {/* =================================================================== */}
      {/* 3. VIGAS SOLERAS DE CORONACIÓN (ANILLO PERIMETRAL SUPERIOR)         */}
      {/* =================================================================== */}
      {vertices.map(([x1, z1], i) => {
        const next = (i + 1) % numSides;
        const [x2, z2] = vertices[next];
        const mx = (x1 + x2) / 2;
        const mz = (z1 + z2) / 2;
        const length = Math.hypot(x2 - x1, z2 - z1);
        const angle = Math.atan2(z2 - z1, x2 - x1);

        return (
          <group
            key={`beam-${i}`}
            position={[mx, eavesHeight, mz]}
            rotation={[0, -angle, 0]}
          >
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
              <cylinderGeometry args={[0.075, 0.075, length, 16]} />
              <primitive object={timberMat} />
            </mesh>
          </group>
        );
      })}

      {/* =================================================================== */}
      {/* 4. VALLADO PERIMETRAL DE ROLLIZOS (EMPALIZADA CON ENTRADA ABIERTA)  */}
      {/* =================================================================== */}
      {vertices.map(([x1, z1], i) => {
        // Dejamos el tramo 0 abierto como puerta de acceso (entrada amplia)
        if (i === 0) return null;

        const next = (i + 1) % numSides;
        const [x2, z2] = vertices[next];
        const dx = x2 - x1;
        const dz = z2 - z1;
        const segmentLength = Math.hypot(dx, dz);
        const segmentAngle = Math.atan2(dz, dx);
        const numPickets = 22; // ~10 cm por rollizo

        return (
          <group
            key={`palisade-${i}`}
            position={[x1, 0, z1]}
            rotation={[0, -segmentAngle, 0]}
          >
            {/* Travesaños horizontales de apoyo interior */}
            <mesh position={[segmentLength / 2, 0.28, -0.06]} castShadow>
              <boxGeometry args={[segmentLength - 0.12, 0.05, 0.04]} />
              <primitive object={timberMat} />
            </mesh>
            <mesh position={[segmentLength / 2, 0.88, -0.06]} castShadow>
              <boxGeometry args={[segmentLength - 0.12, 0.05, 0.04]} />
              <primitive object={timberMat} />
            </mesh>

            {/* Rollizos verticales de madera rústica torneada */}
            {Array.from({ length: numPickets }).map((_, pIdx) => {
              const u = (pIdx + 0.5) / numPickets;
              const px = u * segmentLength;
              // Micro-variaciones realistas de altura y ángulo como en la foto
              const hVar = Math.sin(pIdx * 1.7 + i) * 0.025;
              const curH = railHeight + hVar;
              const tilt = Math.cos(pIdx * 2.3) * 0.008;

              return (
                <group
                  key={`picket-${pIdx}`}
                  position={[px, curH / 2, 0]}
                  rotation={[0, 0, tilt]}
                >
                  <mesh castShadow receiveShadow>
                    <cylinderGeometry args={[0.048, 0.05, curH, 14]} />
                    <primitive object={palisadeMat} />
                  </mesh>
                  {/* Remate superior redondeado del rollizo */}
                  <mesh position={[0, curH / 2, 0]}>
                    <sphereGeometry args={[0.048, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <primitive object={palisadeMat} />
                  </mesh>
                  {/* Clavazón metálica visible */}
                  <mesh position={[0, 0.88 - curH / 2, 0.048]}>
                    <cylinderGeometry args={[0.004, 0.004, 0.015, 6]} />
                    <primitive object={metalBoltMat} />
                  </mesh>
                  <mesh position={[0, 0.28 - curH / 2, 0.048]}>
                    <cylinderGeometry args={[0.004, 0.004, 0.015, 6]} />
                    <primitive object={metalBoltMat} />
                  </mesh>
                </group>
              );
            })}

            {/* Banco corrido perimetral interior */}
            {bench && (
              <group position={[segmentLength / 2, 0.46, -0.22]}>
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[segmentLength - 0.15, 0.04, 0.32]} />
                  <primitive object={benchMat} />
                </mesh>
                {/* Soportes del banco */}
                {[-segmentLength * 0.3, segmentLength * 0.3].map((sx, sIdx) => (
                  <mesh key={`b-sup-${sIdx}`} position={[sx, -0.20, 0]}>
                    <boxGeometry args={[0.06, 0.38, 0.28]} />
                    <primitive object={timberMat} />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        );
      })}

      {/* =================================================================== */}
      {/* 5. ESTRUCTURA DE LA CUBIERTA (LIMATESAS, PENDOLÓN Y ENTABLADO)     */}
      {/* =================================================================== */}
      {/* Pendolón central octogonal */}
      <mesh position={[0, height - roofHeight * 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.12, roofHeight * 0.8, 8]} />
        <primitive object={timberMat} />
      </mesh>

      {/* 8 Pares de limatesas (Vigas maestras de limatesa desde cumbrera a pilares) */}
      {roofEavesVertices.map(([ex, ez], i) => {
        const yTop = height - 0.08;
        const yBot = eavesHeight - 0.12;
        const midX = ex / 2;
        const midY = (yTop + yBot) / 2;
        const midZ = ez / 2;
        const len = Math.hypot(ex, yTop - yBot, ez);
        const pitchAngle = Math.atan2(yTop - yBot, roofRadius);
        const yawAngle = Math.atan2(ez, ex);

        return (
          <group
            key={`rafter-${i}`}
            position={[midX, midY, midZ]}
            rotation={[0, -yawAngle, 0]}
          >
            <mesh rotation={[0, 0, pitchAngle]} castShadow>
              <boxGeometry args={[len, 0.10, 0.09]} />
              <primitive object={timberMat} />
            </mesh>
          </group>
        );
      })}

      {/* =================================================================== */}
      {/* 6. CUBIERTA EXTERIOR HIPERREALISTA DE BREZO RÚSTICO Y ASLÁNTICA     */}
      {/* =================================================================== */}
      <mesh geometry={roofGeometry} castShadow receiveShadow>
        <primitive object={heatherRoofMat} />
      </mesh>

      {/* Cara interior del faldón de cubierta (entablado visto de madera) */}
      <mesh geometry={roofGeometry}>
        <primitive object={roofUndersideMat} />
      </mesh>

      {/* Caballetes de limatesa protectores en cada una de las 8 aristas */}
      {roofEavesVertices.map(([ex, ez], i) => {
        const yTop = height;
        const yBot = eavesHeight - 0.10;
        const midX = ex / 2;
        const midY = (yTop + yBot) / 2;
        const midZ = ez / 2;
        const len = Math.hypot(ex, yTop - yBot, ez);
        const pitchAngle = Math.atan2(yTop - yBot, roofRadius);
        const yawAngle = Math.atan2(ez, ex);

        return (
          <group
            key={`ridge-${i}`}
            position={[midX, midY + 0.02, midZ]}
            rotation={[0, -yawAngle, 0]}
          >
            <mesh rotation={[0, 0, pitchAngle]} castShadow>
              <cylinderGeometry args={[0.038, 0.045, len, 8]} />
              <primitive object={heatherRoofMat} />
            </mesh>
          </group>
        );
      })}

      {/* Remate / Caperuza cónica de cumbrera superior */}
      <mesh position={[0, height + 0.06, 0]} castShadow>
        <coneGeometry args={[0.32, 0.22, 16]} />
        <primitive object={heatherRoofMat} />
      </mesh>
    </group>
  );
}
