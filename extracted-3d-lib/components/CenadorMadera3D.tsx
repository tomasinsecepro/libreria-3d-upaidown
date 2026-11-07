import React, { useMemo } from 'react';
import * as THREE from 'three';

export interface CenadorMadera3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  diameter?: number;      // Diámetro 6.0 m
  height?: number;        // Altura total cumbrera 3.65 m
  includeFloor?: boolean; // Suelo opcional
  bench?: boolean;        // Banco interior corrido
}

export function CenadorMadera3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  diameter = 6.0,
  height = 3.65,
  includeFloor = false,
  bench = true,
}: CenadorMadera3DProps) {
  const radius = diameter / 2; // 3.0 m
  const eavesHeight = 2.25;
  const roofHeight = height - eavesHeight; // 1.40 m
  const roofRadius = radius + 0.45; // 3.45 m (alero)
  const railHeight = 1.15;
  const numSides = 8;

  const {
    timberMat,
    palisadeMat,
    heatherRoofMat,
    metalBoltMat,
    benchMat,
    deckingMat,
  } = useMemo(() => {
    // 1. Textura de madera tratada
    const cvTimber = document.createElement('canvas');
    cvTimber.width = 512;
    cvTimber.height = 512;
    const ctxT = cvTimber.getContext('2d');
    if (ctxT) {
      ctxT.fillStyle = '#6e4c30';
      ctxT.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 512; y += 2) {
        const v = Math.sin(y * 0.08) * 18;
        ctxT.fillStyle = `rgba(${90 + v}, ${60 + v * 0.7}, ${38 + v * 0.5}, ${0.18 + Math.random() * 0.25})`;
        ctxT.fillRect(0, y, 512, 1 + Math.random() * 2);
      }
      for (let k = 0; k < 6; k++) {
        const kx = Math.random() * 512;
        const ky = Math.random() * 512;
        const grad = ctxT.createRadialGradient(kx, ky, 2, kx, ky, 25);
        grad.addColorStop(0, '#2b1c11');
        grad.addColorStop(0.5, '#4a321e');
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
      color: 0x7a5537,
      roughness: 0.76,
      metalness: 0.04,
    });

    const pMat = new THREE.MeshStandardMaterial({
      map: timberTex,
      color: 0x6e4a2d,
      roughness: 0.80,
      metalness: 0.04,
    });

    // 2. Textura hiperrealista de cubierta de brezo
    const cvRoof = document.createElement('canvas');
    cvRoof.width = 512;
    cvRoof.height = 512;
    const ctxR = cvRoof.getContext('2d');
    if (ctxR) {
      ctxR.fillStyle = '#42362b';
      ctxR.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const len = 12 + Math.random() * 40;
        const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        const colVal = Math.floor(65 + Math.random() * 60);
        ctxR.strokeStyle = `rgba(${colVal + 20}, ${colVal + 8}, ${colVal - 10}, ${0.35 + Math.random() * 0.45})`;
        ctxR.lineWidth = 1 + Math.random() * 2;
        ctxR.beginPath();
        ctxR.moveTo(x, y);
        ctxR.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctxR.stroke();
      }
      for (let j = 0; j < 900; j++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const len = 12 + Math.random() * 32;
        const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.7;
        ctxR.strokeStyle = `rgba(${175 + Math.random() * 55}, ${145 + Math.random() * 45}, ${95 + Math.random() * 35}, 0.85)`;
        ctxR.lineWidth = 1.3;
        ctxR.beginPath();
        ctxR.moveTo(x, y);
        ctxR.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctxR.stroke();
      }
    }
    const roofTex = new THREE.CanvasTexture(cvRoof);
    roofTex.wrapS = THREE.RepeatWrapping;
    roofTex.wrapT = THREE.RepeatWrapping;
    roofTex.repeat.set(4, 2);

    const hRoofMat = new THREE.MeshStandardMaterial({
      map: roofTex,
      color: 0x58483b,
      roughness: 0.78,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });

    const mBoltMat = new THREE.MeshStandardMaterial({
      color: 0x24282c,
      metalness: 0.85,
      roughness: 0.4,
    });

    const bMat = new THREE.MeshStandardMaterial({
      map: timberTex,
      color: 0x745033,
      roughness: 0.72,
      metalness: 0.05,
    });

    const dMat = new THREE.MeshStandardMaterial({
      map: timberTex,
      color: 0x5a3e26,
      roughness: 0.82,
    });

    return {
      timberMat: tMat,
      palisadeMat: pMat,
      heatherRoofMat: hRoofMat,
      metalBoltMat: mBoltMat,
      benchMat: bMat,
      deckingMat: dMat,
    };
  }, []);

  // Vértices del octógono base y del alero
  const { postVertices, roofEaveVertices } = useMemo(() => {
    const pV: THREE.Vector3[] = [];
    const rV: THREE.Vector3[] = [];
    for (let i = 0; i < numSides; i++) {
      const a = (i / numSides) * Math.PI * 2;
      pV.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
      rV.push(new THREE.Vector3(Math.cos(a) * roofRadius, eavesHeight, Math.sin(a) * roofRadius));
    }
    return { postVertices: pV, roofEaveVertices: rV };
  }, [radius, roofRadius, eavesHeight, numSides]);

  // Helper para crear vigas entre dos puntos
  const makeBeamProps = (pA: THREE.Vector3, pB: THREE.Vector3) => {
    const dir = new THREE.Vector3().subVectors(pB, pA);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { position: mid.toArray() as [number, number, number], quaternion: quat, length: len };
  };

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. Suelo de madera opcional */}
      {includeFloor && (
        <mesh position={[0, 0.03, 0]} receiveShadow>
          <cylinderGeometry args={[radius - 0.05, radius, 0.06, numSides]} />
          <primitive object={deckingMat} />
        </mesh>
      )}

      {/* 2. Pilares de madera verticales */}
      {postVertices.map((pV, i) => (
        <group key={`post-${i}`} position={[pV.x, eavesHeight / 2, pV.z]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.088, 0.095, eavesHeight, 20]} />
            <primitive object={timberMat} />
          </mesh>
          <mesh position={[0, -eavesHeight / 2 + 0.03, 0]}>
            <cylinderGeometry args={[0.098, 0.105, 0.06, 16]} />
            <primitive object={metalBoltMat} />
          </mesh>
        </group>
      ))}

      {/* 3. Vigas soleras perimetrales */}
      {Array.from({ length: numSides }).map((_, i) => {
        const next = (i + 1) % numSides;
        const pA = new THREE.Vector3(postVertices[i].x, eavesHeight, postVertices[i].z);
        const pB = new THREE.Vector3(postVertices[next].x, eavesHeight, postVertices[next].z);
        const b = makeBeamProps(pA, pB);

        return (
          <mesh
            key={`beam-${i}`}
            position={b.position}
            quaternion={b.quaternion}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[0.075, 0.075, b.length, 14]} />
            <primitive object={timberMat} />
          </mesh>
        );
      })}

      {/* 4. Tornapuntas / Jabalcones a 45° en cada pilar */}
      {Array.from({ length: numSides }).map((_, i) => {
        const next = (i + 1) % numSides;
        const prev = (i - 1 + numSides) % numSides;

        const pTop = new THREE.Vector3(postVertices[i].x, eavesHeight, postVertices[i].z);
        const pOrigin = new THREE.Vector3(postVertices[i].x, eavesHeight - 0.60, postVertices[i].z);

        const pNextTop = new THREE.Vector3(postVertices[next].x, eavesHeight, postVertices[next].z);
        const dirNext = new THREE.Vector3().subVectors(pNextTop, pTop).normalize();
        const pNextTarget = new THREE.Vector3().addVectors(pTop, dirNext.multiplyScalar(0.50));
        const bNext = makeBeamProps(pOrigin, pNextTarget);

        const pPrevTop = new THREE.Vector3(postVertices[prev].x, eavesHeight, postVertices[prev].z);
        const dirPrev = new THREE.Vector3().subVectors(pPrevTop, pTop).normalize();
        const pPrevTarget = new THREE.Vector3().addVectors(pTop, dirPrev.multiplyScalar(0.50));
        const bPrev = makeBeamProps(pOrigin, pPrevTarget);

        return (
          <React.Fragment key={`braces-${i}`}>
            <mesh position={bNext.position} quaternion={bNext.quaternion} castShadow>
              <boxGeometry args={[0.08, bNext.length, 0.08]} />
              <primitive object={timberMat} />
            </mesh>
            <mesh position={bPrev.position} quaternion={bPrev.quaternion} castShadow>
              <boxGeometry args={[0.08, bPrev.length, 0.08]} />
              <primitive object={timberMat} />
            </mesh>
          </React.Fragment>
        );
      })}

      {/* 5. Vallado perimetral de rollizos (Tramo 0 abierto para acceso) */}
      {Array.from({ length: numSides }).map((_, i) => {
        if (i === 0) return null;

        const next = (i + 1) % numSides;
        const p1 = postVertices[i];
        const p2 = postVertices[next];
        const segVec = new THREE.Vector3().subVectors(p2, p1);
        const segLen = segVec.length();
        const segDir = segVec.clone().normalize();
        const numPickets = 20;

        const inOffset = new THREE.Vector3(-segDir.z, 0, segDir.x).multiplyScalar(0.06);
        const r1A = new THREE.Vector3().addVectors(p1, inOffset).setY(0.32);
        const r1B = new THREE.Vector3().addVectors(p2, inOffset).setY(0.32);
        const bR1 = makeBeamProps(r1A, r1B);

        const r2A = new THREE.Vector3().addVectors(p1, inOffset).setY(0.92);
        const r2B = new THREE.Vector3().addVectors(p2, inOffset).setY(0.92);
        const bR2 = makeBeamProps(r2A, r2B);

        const bOffset = new THREE.Vector3(-segDir.z, 0, segDir.x).multiplyScalar(0.24);
        const bSeat1 = new THREE.Vector3().addVectors(p1, bOffset).setY(0.46);
        const bSeat2 = new THREE.Vector3().addVectors(p2, bOffset).setY(0.46);
        const bSeat = makeBeamProps(bSeat1, bSeat2);

        return (
          <React.Fragment key={`palisade-${i}`}>
            {/* Travesaños de sujeción */}
            <mesh position={bR1.position} quaternion={bR1.quaternion} castShadow>
              <boxGeometry args={[0.05, bR1.length, 0.04]} />
              <primitive object={timberMat} />
            </mesh>
            <mesh position={bR2.position} quaternion={bR2.quaternion} castShadow>
              <boxGeometry args={[0.05, bR2.length, 0.04]} />
              <primitive object={timberMat} />
            </mesh>

            {/* Rollizos verticales */}
            {Array.from({ length: numPickets }).map((_, pIdx) => {
              const t = (pIdx + 0.5) / numPickets;
              const pos = new THREE.Vector3().addVectors(p1, segDir.clone().multiplyScalar(t * segLen));
              const hVar = Math.sin(pIdx * 1.7 + i) * 0.025;
              const curH = railHeight + hVar;

              return (
                <group key={`picket-${pIdx}`} position={[pos.x, 0, pos.z]}>
                  <mesh position={[0, curH / 2, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.048, 0.052, curH, 14]} />
                    <primitive object={palisadeMat} />
                  </mesh>
                  <mesh position={[0, curH, 0]}>
                    <sphereGeometry args={[0.048, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <primitive object={palisadeMat} />
                  </mesh>
                </group>
              );
            })}

            {/* Banco interior */}
            {bench && (
              <>
                <mesh position={bSeat.position} quaternion={bSeat.quaternion} castShadow receiveShadow>
                  <boxGeometry args={[0.30, bSeat.length, 0.04]} />
                  <primitive object={benchMat} />
                </mesh>
                {[0.28, 0.72].map((bt, legIdx) => {
                  const legPos = new THREE.Vector3().addVectors(p1, segDir.clone().multiplyScalar(bt * segLen)).add(bOffset);
                  return (
                    <mesh key={`leg-${legIdx}`} position={[legPos.x, 0.22, legPos.z]} castShadow>
                      <boxGeometry args={[0.07, 0.44, 0.25]} />
                      <primitive object={timberMat} />
                    </mesh>
                  );
                })}
              </>
            )}
          </React.Fragment>
        );
      })}

      {/* 6. Cubierta octogonal de brezo (ConeGeometry perfecto y simétrico) */}
      <mesh position={[0, eavesHeight + roofHeight / 2, 0]} castShadow receiveShadow>
        <coneGeometry args={[roofRadius, roofHeight, numSides, 1, false]} />
        <primitive object={heatherRoofMat} />
      </mesh>

      {/* Fascia / remate perimetral de aleros */}
      {Array.from({ length: numSides }).map((_, i) => {
        const next = (i + 1) % numSides;
        const b = makeBeamProps(roofEaveVertices[i], roofEaveVertices[next]);
        return (
          <mesh key={`fascia-${i}`} position={b.position} quaternion={b.quaternion} castShadow>
            <cylinderGeometry args={[0.045, 0.045, b.length, 10]} />
            <primitive object={timberMat} />
          </mesh>
        );
      })}

      {/* 8 Caballetes de limatesa */}
      {roofEaveVertices.map((rV, i) => {
        const apexPt = new THREE.Vector3(0, height, 0);
        const b = makeBeamProps(apexPt, rV);
        return (
          <mesh key={`ridge-${i}`} position={b.position} quaternion={b.quaternion} castShadow>
            <cylinderGeometry args={[0.042, 0.042, b.length, 10]} />
            <primitive object={heatherRoofMat} />
          </mesh>
        );
      })}

      {/* Sombrerete de cumbrera */}
      <mesh position={[0, height + 0.08, 0]} castShadow>
        <coneGeometry args={[0.38, 0.26, 16]} />
        <primitive object={heatherRoofMat} />
      </mesh>

      {/* Estructura interior del techo (Bajo la cubierta) */}
      <mesh position={[0, eavesHeight + 0.50, 0]}>
        <cylinderGeometry args={[0.10, 0.11, 0.85, 8]} />
        <primitive object={timberMat} />
      </mesh>
      {postVertices.map((pV, i) => {
        const ceilingApex = new THREE.Vector3(0, eavesHeight + 0.80, 0);
        const pTop = new THREE.Vector3(pV.x, eavesHeight, pV.z);
        const b = makeBeamProps(ceilingApex, pTop);
        return (
          <mesh key={`rafter-${i}`} position={b.position} quaternion={b.quaternion}>
            <cylinderGeometry args={[0.045, 0.045, b.length, 8]} />
            <primitive object={timberMat} />
          </mesh>
        );
      })}
    </group>
  );
}
