import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { writeFile } from 'node:fs/promises';

// Polyfill FileReader for Node.js
globalThis.FileReader = class {
  readAsArrayBuffer(b) {
    b.arrayBuffer().then(x => { this.result = x; this.onloadend?.(); });
  }
};

function mat(name, color, metalness = 0.05, roughness = 0.85, extra = {}) {
  const m = new T.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  m.name = name;
  return m;
}

// ==========================================
// PALETA BOTÁNICA REALISTA OLEA EUROPAEA
// ==========================================
const barkOliveTrunk = mat('Olive Aged Gnarled Trunk', '#38342c', 0.04, 0.95);
const barkCrevice = mat('Olive Deep Bark Fissure', '#1f1c17', 0.02, 0.98);
const barkBranch = mat('Olive Scaffold Branch Grey', '#4a443a', 0.03, 0.88);
const barkTwig = mat('Olive Thin Pendulous Twig', '#5c5446', 0.03, 0.82);

// Follaje bicolor inconfundible del olivo:
const leafTop = mat('Olive Leaf Dark Grey-Green (Haz)', '#34452e', 0.06, 0.45, { side: T.DoubleSide });
const leafUnderside = mat('Olive Leaf Silvery Shimmer (Envés)', '#b8c4b2', 0.15, 0.35, { side: T.DoubleSide });
const leafShoot = mat('Olive Leaf Young Green', '#4b5e3d', 0.06, 0.42, { side: T.DoubleSide });

const oliveBlack = mat('Ripe Black Olive (Picual)', '#151218', 0.25, 0.2, { roughness: 0.18 });
const olivePurple = mat('Turning Olive (Envero)', '#3a202d', 0.2, 0.25, { roughness: 0.22 });
const oliveGreen = mat('Green Olive (Manzanilla)', '#5a6838', 0.15, 0.3, { roughness: 0.28 });
const soilMediterranean = mat('Dry Stony Olive Grove Soil', '#524332', 0.02, 0.98);

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

function createCrookedBranch(parent, points, startRadius, endRadius, material, segs = 12) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
  const geo = new T.TubeGeometry(curve, segs, startRadius, 12, false);
  return mesh(parent, geo, material);
}

function createOliveFruit(parent, pos, rot, ripeness = 'black') {
  const fruitGroup = group(parent, 'olive_drupe', pos, rot);

  const peduncle = new T.CylinderGeometry(0.003, 0.003, 0.045, 6);
  mesh(fruitGroup, peduncle, barkTwig, [0, 0.022, 0]);

  const oliveGeo = new T.SphereGeometry(0.038, 12, 10);
  oliveGeo.scale(0.78, 1.25, 0.78);

  const fruitMat = ripeness === 'black' ? oliveBlack : (ripeness === 'purple' ? olivePurple : oliveGreen);
  const oliveMesh = mesh(fruitGroup, oliveGeo, fruitMat, [0, -0.04, 0]);
  oliveMesh.rotation.set(0.1, 0, 0.15);

  return fruitGroup;
}

// ==========================================
// RAMILLETE FOLIAR BICOLOR PLATEADO CON EL DOBLE DE HOJAS
// ==========================================
function createOliveFoliageCluster(parent, pos, rot, scale = 1.0) {
  const cluster = group(parent, 'olive_foliage', pos, rot);
  cluster.scale.setScalar(scale);

  const leafGeo = new T.BufferGeometry();
  const positions = new Float32Array([
    // Haz superior
    0, 0, 0,
    0.038, 0.005, 0.09,
    -0.038, 0.005, 0.09,
    0, 0.008, 0.20,
    0, -0.003, 0.09,
    // Envés plateado inferior
    0, -0.002, 0,
    0.038, 0.003, 0.09,
    -0.038, 0.003, 0.09,
    0, 0.006, 0.20,
  ]);
  const indices = [
    // Haz
    0, 1, 4,
    0, 4, 2,
    4, 1, 3,
    4, 3, 2,
    // Envés
    5, 7, 6,
    7, 8, 6,
  ];
  leafGeo.setAttribute('position', new T.BufferAttribute(positions, 3));
  leafGeo.setIndex(indices);
  leafGeo.computeVertexNormals();

  // DUPLICADO: 28 hojas por racimo (en lugar de 14) con distribución volumétrica
  const count = 28;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist = 0.07 + (i / count) * 0.26;
    const y = -0.08 + Math.sin(angle * 3) * 0.16;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    const leaf = mesh(cluster, leafGeo, i % 2 === 0 ? leafTop : (i % 3 === 0 ? leafUnderside : leafShoot), [x, y, z]);
    leaf.scale.setScalar(1.0 + Math.random() * 0.4);
    leaf.rotation.set(
      Math.sin(angle) * 0.5 + (Math.random() - 0.5) * 0.3,
      angle + Math.PI / 2,
      Math.cos(angle) * 0.55 + Math.PI * (i % 2 === 0 ? 0 : 0.45)
    );
  }

  return cluster;
}

export function buildOliveTree() {
  const root = group(null, 'OLEA_EUROPAEA_OLIVE_TREE');

  // ==========================================
  // 1. SUELO MEDITERRÁNEO Y ALCORQUE PEDREGOSO
  // ==========================================
  mesh(root, new T.CylinderGeometry(2.1, 2.8, 0.18, 36), soilMediterranean, [0, 0.09, 0]);

  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + 0.15;
    const r = 1.3 + Math.random() * 0.8;
    const stone = mesh(root, new T.DodecahedronGeometry(0.08 + Math.random() * 0.08), barkTwig, [
      Math.cos(a) * r,
      0.14,
      Math.sin(a) * r,
    ]);
    stone.scale.set(1.3, 0.55, 1.1);
  }

  // ==========================================
  // 2. TRONCO CENTENARIO RETORCIDO
  // ==========================================
  const rootButtresses = [
    [[0, 0.1, 0], [0.6, 0.08, 0.35], [1.1, 0.02, 0.6]],
    [[0, 0.1, 0], [-0.55, 0.08, -0.4], [-1.05, 0.02, -0.7]],
    [[0, 0.1, 0], [-0.65, 0.08, 0.3], [-1.15, 0.02, 0.5]],
    [[0, 0.1, 0], [0.5, 0.08, -0.5], [0.95, 0.02, -0.9]],
    [[0, 0.1, 0], [0.15, 0.08, 0.7], [0.25, 0.02, 1.15]],
  ];
  for (const rb of rootButtresses) {
    createCrookedBranch(root, rb, 0.24, 0.07, barkOliveTrunk, 8);
  }

  const trunkRibs = [
    [
      [0.08, 0.05, 0.08],
      [-0.1, 0.45, 0.12],
      [0.15, 0.85, -0.05],
      [-0.05, 1.25, 0.08],
    ],
    [
      [-0.12, 0.05, -0.05],
      [0.12, 0.42, -0.1],
      [-0.1, 0.82, 0.14],
      [0.1, 1.28, -0.04],
    ],
    [
      [0.02, 0.05, -0.15],
      [-0.14, 0.44, 0.02],
      [0.05, 0.86, -0.16],
      [-0.08, 1.24, 0.02],
    ],
  ];

  for (const rib of trunkRibs) {
    createCrookedBranch(root, rib, 0.22, 0.16, barkOliveTrunk, 14);
  }

  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.4;
    const y = 0.25 + (i % 4) * 0.25;
    const burl = mesh(
      root,
      new T.SphereGeometry(0.14 + Math.random() * 0.06, 8, 8),
      barkCrevice,
      [Math.cos(a) * 0.28, y, Math.sin(a) * 0.28]
    );
    burl.scale.set(1.4, 0.7, 0.9);
  }

  mesh(root, new T.CylinderGeometry(0.1, 0.14, 0.6, 8), barkCrevice, [0, 0.7, 0]).scale.set(0.6, 1, 1.2);

  // ==========================================
  // 3. BRAZOS MAESTROS Y RAMAS PÉNDULAS
  // ==========================================
  const mainArms = [
    {
      points: [
        [-0.05, 1.25, 0.08],
        [0.55, 1.55, 0.4],
        [1.15, 1.85, 0.65],
        [1.7, 2.05, 0.85],
      ],
      pendulousTwigs: [
        { start: [1.15, 1.85, 0.65], end: [1.45, 2.45, 0.25] },
        { start: [1.7, 2.05, 0.85], end: [2.15, 2.25, 1.15] },
        { start: [1.7, 2.05, 0.85], end: [1.95, 2.4, 0.4] },
      ],
    },
    {
      points: [
        [0.1, 1.28, -0.04],
        [-0.45, 1.52, 0.5],
        [-1.05, 1.78, 0.95],
        [-1.6, 1.95, 1.35],
      ],
      pendulousTwigs: [
        { start: [-1.05, 1.78, 0.95], end: [-1.35, 2.4, 0.55] },
        { start: [-1.6, 1.95, 1.35], end: [-2.05, 2.15, 1.65] },
        { start: [-1.6, 1.95, 1.35], end: [-1.8, 2.35, 0.95] },
      ],
    },
    {
      points: [
        [-0.08, 1.24, 0.02],
        [-0.25, 1.55, -0.5],
        [-0.65, 1.82, -1.05],
        [-1.15, 2.02, -1.5],
      ],
      pendulousTwigs: [
        { start: [-0.65, 1.82, -1.05], end: [-0.95, 2.45, -0.85] },
        { start: [-1.15, 2.02, -1.5], end: [-1.55, 2.22, -1.85] },
        { start: [-1.15, 2.02, -1.5], end: [-1.35, 2.42, -1.15] },
      ],
    },
  ];

  const fruitPositions = [];

  for (const arm of mainArms) {
    createCrookedBranch(root, arm.points, 0.17, 0.09, barkBranch, 10);

    for (const tw of arm.pendulousTwigs) {
      const mid = [
        (tw.start[0] + tw.end[0]) * 0.5 + (Math.random() - 0.5) * 0.15,
        (tw.start[1] + tw.end[1]) * 0.5 + 0.08,
        (tw.start[2] + tw.end[2]) * 0.5 + (Math.random() - 0.5) * 0.15,
      ];
      createCrookedBranch(root, [tw.start, mid, tw.end], 0.08, 0.035, barkTwig, 8);

      fruitPositions.push([mid[0], mid[1] - 0.06, mid[2]]);
      fruitPositions.push([tw.end[0], tw.end[1] - 0.07, tw.end[2]]);
    }
  }

  // ==========================================
  // 4. ACEITUNAS COLGANTES
  // ==========================================
  for (let i = 0; i < fruitPositions.length; i++) {
    const pos = fruitPositions[i];
    const ripeness = i % 3 === 0 ? 'black' : (i % 2 === 0 ? 'purple' : 'green');
    createOliveFruit(root, pos, [0.1, (i * 1.7) % Math.PI, 0.1], ripeness);

    if (i % 2 === 0) {
      createOliveFruit(
        root,
        [pos[0] + 0.05, pos[1] - 0.02, pos[2] + 0.04],
        [-0.1, (i * 2.3) % Math.PI, -0.15],
        ripeness === 'black' ? 'purple' : 'black'
      );
    }
  }

  // ==========================================
  // 5. COPA FOLIAR DUPLICADA: 38 GRUPOS VOLUMÉTRICOS DENSOS
  // ==========================================
  const canopyNodes = [
    // Centro y cúpula superior
    [0.05, 2.65, 0.05, 1.3],
    [-0.12, 2.8, -0.08, 1.25],
    [0.18, 2.55, -0.18, 1.2],
    [0.0, 3.0, 0.0, 1.35],
    [0.22, 2.85, 0.15, 1.25],
    [-0.2, 2.9, 0.12, 1.2],

    // Brazo 1 (Este) - Capas exterior e interior
    [1.1, 2.35, 0.45, 1.2],
    [1.65, 2.15, 0.7, 1.15],
    [1.95, 1.95, 0.3, 1.1],
    [1.4, 2.45, -0.15, 1.15],
    [1.3, 2.65, 0.35, 1.25],
    [1.8, 2.3, 0.5, 1.2],
    [2.1, 1.85, 0.65, 1.1],
    [1.55, 2.05, 0.1, 1.15],

    // Brazo 2 (Noroeste) - Capas exterior e interior
    [-1.05, 2.3, 0.75, 1.2],
    [-1.55, 2.1, 1.25, 1.15],
    [-1.85, 1.92, 0.7, 1.1],
    [-1.3, 2.4, 0.3, 1.15],
    [-1.25, 2.65, 0.65, 1.25],
    [-1.7, 2.25, 1.0, 1.2],
    [-2.05, 1.8, 1.15, 1.1],
    [-1.45, 1.98, 0.45, 1.15],

    // Brazo 3 (Suroeste) - Capas exterior e interior
    [-0.85, 2.35, -0.85, 1.2],
    [-1.35, 2.12, -1.35, 1.15],
    [-1.65, 1.95, -0.95, 1.1],
    [-0.75, 2.45, -1.25, 1.15],
    [-1.1, 2.6, -1.05, 1.25],
    [-1.5, 2.22, -1.15, 1.2],
    [-1.85, 1.85, -1.2, 1.1],
    [-0.95, 2.1, -0.65, 1.15],

    // Follaje perimetral péndulo bajo
    [0.9, 1.85, 1.05, 1.1],
    [-0.35, 1.95, 1.45, 1.1],
    [-1.15, 1.82, -0.25, 1.1],
    [0.45, 1.9, -1.25, 1.1],
    [1.2, 1.7, 0.9, 1.05],
    [-0.6, 1.75, 1.3, 1.05],
    [-1.4, 1.7, -0.6, 1.05],
    [0.8, 1.75, -1.1, 1.05],
  ];

  for (const [x, y, z, s] of canopyNodes) {
    createOliveFoliageCluster(
      root,
      [x, y, z],
      [(Math.random() - 0.5) * 0.4, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.4],
      s
    );
  }

  return root;
}

// Compilar y guardar GLB
const tree = buildOliveTree();
tree.userData = {
  name: 'Árbol Olivo Centenario Hiperrealista (Doble Follaje Frondoso)',
  botanicalFamily: 'Oleaceae',
  foliageDensity: 'Ultra-Dense Double Bicolored Canopy',
  author: 'Antigravity 3D Botanical Generator',
};

const exporter = new GLTFExporter();
const glbBuffer = await exporter.parseAsync(tree, { binary: true });

await writeFile('extracted-3d-lib/models/arbol-olivo.glb', Buffer.from(glbBuffer));
console.log('✅ arbol-olivo.glb actualizado con éxito! Tamaño:', Math.round(glbBuffer.byteLength / 1024), 'KB');
