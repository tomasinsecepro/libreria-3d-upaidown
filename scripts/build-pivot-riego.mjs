import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { writeFile } from 'node:fs/promises';

// Polyfill FileReader for Node.js
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      const ev = { target: this };
      if (typeof this.onload === 'function') this.onload(ev);
      if (typeof this.onloadend === 'function') this.onloadend(ev);
    }).catch(err => {
      if (typeof this.onerror === 'function') this.onerror(err);
    });
  }
};

function mat(name, color, metalness = 0.85, roughness = 0.25, extra = {}) {
  const m = new T.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  m.name = name;
  return m;
}

// ==========================================
// PALETA DE MATERIALES PÍVOT DE RIEGO INDUSTRIAL
// ==========================================
const galvaSteel = mat('Hot-Dip Galvanized Steel', '#a8b2b8', 0.92, 0.2);
const darkSteel = mat('Structural Framing Steel', '#4a5054', 0.85, 0.35);
const pipeSteel = mat('Galvanized Main Water Pipe', '#b4bec4', 0.9, 0.18);
const concreteBase = mat('Concrete Anchor Pad', '#8c8a82', 0.05, 0.95);
const tireRubber = mat('Agricultural Traction Tire', '#151718', 0.05, 0.92);
const motorYellow = mat('Drive Motor Housing', '#d49b13', 0.4, 0.4);
const controlBoxWhite = mat('Control Panel Enclosure', '#e4e7e8', 0.3, 0.3);
const nozzleGold = mat('Brass / Plastic Spray Nozzles', '#d4af37', 0.7, 0.3);
const dropTubeBlack = mat('UV Polyethylene Drop Tubes', '#1d2124', 0.1, 0.8);
const endGunBrass = mat('High Pressure End Gun', '#b87333', 0.8, 0.25);
const signalLightRed = mat('Tower Alignment & End Beacon', '#ff2222', 0.2, 0.2, {
  emissive: new T.Color('#ff1111'),
  emissiveIntensity: 0.9,
});

function group(parent, name, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const g = new T.Group();
  g.name = name;
  g.position.set(...pos);
  g.rotation.set(...rot);
  if (parent) parent.add(g);
  return g;
}

function mesh(parent, geo, material, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const m = new T.Mesh(geo, material);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

function rod(parent, p1, p2, radius, material) {
  const v1 = new T.Vector3(...p1);
  const v2 = new T.Vector3(...p2);
  const dist = v1.distanceTo(v2);
  const dir = new T.Vector3().subVectors(v2, v1).normalize();
  const mid = new T.Vector3().addVectors(v1, v2).multiplyScalar(0.5);

  const geo = new T.CylinderGeometry(radius, radius, dist, 8);
  const m = mesh(parent, geo, material, mid.toArray());
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
  return m;
}

export function buildCenterPivot(numTowers = 7) {
  const root = group(null, `CENTER_PIVOT_${numTowers}_TOWERS`);

  const spanLength = 4.8;
  const pipeHeight = 3.2;

  // ==========================================
  // 1. PIRÁMIDE CENTRAL DE ANCLAJE (PIVOT POINT)
  // ==========================================
  const centerPoint = group(root, 'central_pivot_point', [0, 0, 0]);

  mesh(centerPoint, new T.BoxGeometry(2.4, 0.35, 2.4), concreteBase, [0, 0.175, 0]);
  mesh(centerPoint, new T.CylinderGeometry(0.8, 1.0, 0.25, 24), concreteBase, [0, 0.42, 0]);

  mesh(centerPoint, new T.CylinderGeometry(0.22, 0.22, 3.1, 20), pipeSteel, [0, 1.6, 0]);
  mesh(centerPoint, new T.TorusGeometry(0.35, 0.18, 12, 24, Math.PI / 2), pipeSteel, [0.35, 3.1, 0], [0, 0, -Math.PI / 2]);

  const legCoords = [
    [-0.9, 0.35, -0.9],
    [0.9, 0.35, -0.9],
    [-0.9, 0.35, 0.9],
    [0.9, 0.35, 0.9],
  ];
  for (const c of legCoords) {
    rod(centerPoint, c, [0, 3.0, 0], 0.05, galvaSteel);
    for (const h of [1.1, 2.0]) {
      const scale = (3.0 - h) / (3.0 - 0.35);
      const hc = [c[0] * scale, h, c[2] * scale];
      mesh(centerPoint, new T.SphereGeometry(0.06, 8, 6), darkSteel, hc);
    }
  }

  const scadaBox = group(centerPoint, 'scada_panel', [0.75, 1.4, 0.4]);
  mesh(scadaBox, new T.BoxGeometry(0.22, 0.75, 0.55), controlBoxWhite, [0, 0, 0]);
  mesh(scadaBox, new T.CylinderGeometry(0.015, 0.015, 0.6, 8), darkSteel, [0, 0.65, 0]);
  mesh(scadaBox, new T.BoxGeometry(0.02, 0.15, 0.22), darkSteel, [0.12, 0.1, 0]);

  mesh(centerPoint, new T.CylinderGeometry(0.28, 0.28, 0.55, 16), motorYellow, [0, 3.45, 0]);

  // ==========================================
  // 2. CONSTRUCCIÓN DE LOS VANO Y LAS TORRES
  // ==========================================
  for (let t = 1; t <= numTowers; t++) {
    const prevX = (t - 1) * spanLength;
    const currX = t * spanLength;

    const spanGroup = group(root, `span_${t}`);
    rod(spanGroup, [prevX, pipeHeight, 0], [currX, pipeHeight, 0], 0.11, pipeSteel);

    const numPanels = 6;
    const trussSag = 0.65;

    for (let p = 0; p <= numPanels; p++) {
      const px = prevX + (p / numPanels) * spanLength;
      const parabola = Math.sin((p / numPanels) * Math.PI) * trussSag;
      const py = pipeHeight - parabola;

      rod(spanGroup, [px, pipeHeight, 0], [px, py, 0], 0.025, galvaSteel);

      for (const zSide of [-0.35, 0.35]) {
        rod(spanGroup, [px, pipeHeight, 0], [px, py + 0.1, zSide * (1 - Math.abs(p - numPanels / 2) / (numPanels / 2))], 0.018, galvaSteel);
      }

      if (p < numPanels) {
        const nextPx = prevX + ((p + 1) / numPanels) * spanLength;
        const nextPy = pipeHeight - Math.sin(((p + 1) / numPanels) * Math.PI) * trussSag;
        rod(spanGroup, [px, py, 0], [nextPx, nextPy, 0], 0.03, galvaSteel);
      }
    }

    const numNozzles = 7;
    for (let n = 1; n <= numNozzles; n++) {
      const nx = prevX + (n / (numNozzles + 1)) * spanLength;
      mesh(spanGroup, new T.TorusGeometry(0.08, 0.018, 6, 12, Math.PI), pipeSteel, [nx, pipeHeight + 0.08, 0], [Math.PI / 2, 0, 0]);
      rod(spanGroup, [nx, pipeHeight + 0.08, 0.08], [nx, 1.1, 0.08], 0.016, dropTubeBlack);
      mesh(spanGroup, new T.CylinderGeometry(0.035, 0.045, 0.12, 10), nozzleGold, [nx, 1.04, 0.08]);
      mesh(spanGroup, new T.ConeGeometry(0.045, 0.03, 10), darkSteel, [nx, 0.98, 0.08], [Math.PI, 0, 0]);
    }

    const towerGroup = group(root, `tower_${t}`, [currX, 0, 0]);

    const legSpreadZ = 1.6;
    for (const zSide of [-1, 1]) {
      const zBase = zSide * legSpreadZ;
      rod(towerGroup, [0, pipeHeight, 0], [0, 0.8, zBase], 0.045, galvaSteel);
      rod(towerGroup, [0, 1.2, 0], [0, 2.2, zBase * 0.7], 0.025, galvaSteel);
      rod(towerGroup, [0, 2.2, 0], [0, 1.2, zBase * 0.7], 0.025, galvaSteel);
    }

    rod(towerGroup, [0, 0.75, -legSpreadZ], [0, 0.75, legSpreadZ], 0.06, darkSteel);

    mesh(towerGroup, new T.CylinderGeometry(0.14, 0.14, 0.45, 14), motorYellow, [0, 0.95, 0], [0, 0, Math.PI / 2]);
    rod(towerGroup, [0, 0.82, -0.2], [0, 0.75, -legSpreadZ + 0.2], 0.03, darkSteel);
    rod(towerGroup, [0, 0.82, 0.2], [0, 0.75, legSpreadZ - 0.2], 0.03, darkSteel);

    mesh(towerGroup, new T.BoxGeometry(0.18, 0.26, 0.22), controlBoxWhite, [0.15, 1.6, 0]);

    // ----------------------------------------
    // D. RUEDAS MOTRICES: ORIENTACIÓN CAMBIADA 90º (AVANCE CIRCULAR TANGENCIAL)
    // ----------------------------------------
    for (const zSide of [-1, 1]) {
      // Misma posición en el eje: [0, 0.75, zSide * legSpreadZ]
      // Orientación cambiada 90° alrededor del eje Y sin desplazarla
      const wheelGroup = group(towerGroup, `wheel_${zSide > 0 ? 'right' : 'left'}`, [0, 0.75, zSide * legSpreadZ], [0, Math.PI / 2, 0]);

      const tireRadius = 0.72;
      const tireWidth = 0.38;
      mesh(wheelGroup, new T.CylinderGeometry(tireRadius, tireRadius, tireWidth, 24), tireRubber, [0, 0, 0], [Math.PI / 2, 0, 0]);

      const numLugs = 18;
      for (let l = 0; l < numLugs; l++) {
        const la = (l / numLugs) * Math.PI * 2;
        const lug = group(wheelGroup, `lug_${l}`);
        lug.rotation.z = la;
        mesh(lug, new T.BoxGeometry(0.08, 0.06, tireWidth * 0.85), tireRubber, [0, tireRadius + 0.025, 0]);
      }

      mesh(wheelGroup, new T.CylinderGeometry(0.42, 0.42, tireWidth * 0.95, 20), galvaSteel, [0, 0, 0], [Math.PI / 2, 0, 0]);
      mesh(wheelGroup, new T.CylinderGeometry(0.16, 0.16, tireWidth * 1.15, 12), darkSteel, [0, 0, 0], [Math.PI / 2, 0, 0]);
    }
  }

  // ==========================================
  // 3. VOLADIZO FINAL (OVERHANG) TRAS LA ÚLTIMA TORRE
  // ==========================================
  const overhangStartX = numTowers * spanLength;
  const overhangLength = 2.4;
  const overhangEndX = overhangStartX + overhangLength;

  rod(root, [overhangStartX, pipeHeight, 0], [overhangEndX, pipeHeight, 0], 0.08, pipeSteel);
  rod(root, [overhangStartX, pipeHeight + 0.9, 0], [overhangEndX, pipeHeight, 0], 0.02, galvaSteel);
  rod(root, [overhangStartX, pipeHeight, 0], [overhangStartX, pipeHeight + 0.9, 0], 0.035, galvaSteel);

  for (let n = 1; n <= 3; n++) {
    const nx = overhangStartX + (n / 4) * overhangLength;
    rod(root, [nx, pipeHeight, 0], [nx, 1.2, 0], 0.016, dropTubeBlack);
    mesh(root, new T.CylinderGeometry(0.03, 0.04, 0.1, 8), nozzleGold, [nx, 1.15, 0]);
  }

  // ==========================================
  // 4. CAÑÓN FINAL DE ALTO ALCANCE (END GUN)
  // ==========================================
  const endGunGroup = group(root, 'end_gun_assembly', [overhangEndX, pipeHeight, 0]);
  mesh(endGunGroup, new T.CylinderGeometry(0.055, 0.055, 0.4, 12), pipeSteel, [0.15, 0.12, 0], [0, 0, -0.42]);
  mesh(endGunGroup, new T.CylinderGeometry(0.04, 0.02, 0.55, 12), endGunBrass, [0.38, 0.32, 0], [0, 0, -0.42]);
  mesh(endGunGroup, new T.CylinderGeometry(0.06, 0.06, 0.15, 12), signalLightRed, [0, 0.25, 0]);

  return root;
}

// Generar los 5 modelos: 3, 4, 5, 6 y 7 torres
const exporter = new GLTFExporter();
for (const towers of [3, 4, 5, 6, 7]) {
  const pivot = buildCenterPivot(towers);
  pivot.userData = {
    name: `Pívot Central de Riego Agrícola (${towers} Torres)`,
    type: 'Agricultural Mechanized Irrigation Machine',
    towers: towers,
    spanLengthMeters: 50,
    author: 'Antigravity 3D Generator',
  };

  const glbBuffer = await exporter.parseAsync(pivot, { binary: true });
  const filename = `extracted-3d-lib/models/pivot-riego-${towers}t.glb`;
  await writeFile(filename, Buffer.from(glbBuffer));
  console.log(`✅ ${filename} generado con éxito! Tamaño: ${Math.round(glbBuffer.byteLength / 1024)} KB`);
}
