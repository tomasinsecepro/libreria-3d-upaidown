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
// PALETA BOTÁNICA REALISTA PRUNUS DULCIS
// ==========================================
const barkOldTrunk = mat('Almond Aged Dark Bark', '#23201b', 0.04, 0.96);
const barkFissure = mat('Almond Bark Deep Crevices', '#181613', 0.02, 0.98);
const barkYoungBranch = mat('Almond Scaffold Branch', '#3d372e', 0.03, 0.88);
const barkTwig = mat('Almond Twig Olive Brown', '#524b3e', 0.03, 0.82);

// Hojas lanceoladas simples de almendro (más alargadas y con brillo satinado)
const leafTop = mat('Almond Lanceolate Leaf Top', '#3c6e28', 0.04, 0.42, { side: T.DoubleSide });
const leafUnder = mat('Almond Lanceolate Leaf Underside', '#568f3a', 0.04, 0.5, { side: T.DoubleSide });
const leafFresh = mat('Almond Lanceolate Fresh Leaf', '#67a840', 0.04, 0.38, { side: T.DoubleSide });

// Almendra (Drupa con hollejo afelpado verde-grisáceo y cáscara de madera en sutura)
const almondHullVelvet = mat('Almond Velvety Green Hull', '#728c5a', 0.02, 0.92);
const almondHullSplit = mat('Almond Mature Split Hull', '#869466', 0.03, 0.88);
const almondWoodyShell = mat('Almond Pitted Woody Endocarp', '#9c6f3d', 0.1, 0.75); // cáscara canela leñosa
const soilDry = mat('Dry Mediterranean Orchard Soil', '#584936', 0.02, 0.98);

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

// Crea una rama nudosa retorcida entre puntos
function createCrookedBranch(parent, points, startRadius, endRadius, material, segs = 12) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
  const geo = new T.TubeGeometry(curve, segs, startRadius, 12, false);
  return mesh(parent, geo, material);
}

// ==========================================
// 1. MODELADO DE LA ALMENDRA INDIVIDUAL (DRUPA)
// ==========================================
function createAlmondFruit(parent, pos, rot, isSplit = false) {
  const fruitGroup = group(parent, 'almond_drupe', pos, rot);

  // Pedúnculo corto y leñoso
  const peduncle = new T.CylinderGeometry(0.005, 0.005, 0.05, 6);
  mesh(fruitGroup, peduncle, barkTwig, [0, 0.025, 0]);

  // Geometría asimétrica de la almendra
  const almondGeo = new T.SphereGeometry(0.045, 14, 12);
  almondGeo.scale(0.7, 1.4, 0.85); // forma almendrada alargada con punta

  if (!isSplit) {
    // Almendra cerrada verde afelpada
    mesh(fruitGroup, almondGeo, almondHullVelvet, [0, -0.05, 0]);
  } else {
    // Almendra madura con sutura abierta dejando ver la cáscara leñosa marrón
    // Mitad izquierda de la piel verde abierta
    const leftHull = mesh(fruitGroup, almondGeo.clone(), almondHullSplit, [-0.012, -0.05, 0]);
    leftHull.scale.set(0.65, 1.35, 0.8);
    leftHull.rotation.z = -0.15;

    // Mitad derecha de la piel verde abierta
    const rightHull = mesh(fruitGroup, almondGeo.clone(), almondHullSplit, [0.012, -0.05, 0]);
    rightHull.scale.set(0.65, 1.35, 0.8);
    rightHull.rotation.z = 0.15;

    // Núcleo leñoso canela visible en la hendidura
    const shellGeo = new T.SphereGeometry(0.038, 12, 10);
    shellGeo.scale(0.65, 1.3, 0.78);
    mesh(fruitGroup, shellGeo, almondWoodyShell, [0, -0.05, 0]);
  }

  return fruitGroup;
}

// ==========================================
// 2. RAMILLETE DE HOJAS LANCEOLADAS (ALMENDRO)
// ==========================================
function createAlmondFoliageCluster(parent, pos, rot, scale = 1.0) {
  const cluster = group(parent, 'almond_foliage', pos, rot);
  cluster.scale.setScalar(scale);

  // Hoja lanceolada estrecha (estrechándose en ambos extremos con nervio central)
  const leafGeo = new T.BufferGeometry();
  // Vértices de una hoja lanceolada curvada
  const positions = new Float32Array([
    // Cara superior e inferior
    0, 0, 0,              // base
    0.045, 0.008, 0.12,   // ensanchamiento medio derecho
    -0.045, 0.008, 0.12,  // ensanchamiento medio izquierdo
    0, 0.012, 0.26,       // punta estrecha alargada
    0, -0.004, 0.13,      // curvatura del nervio central
  ]);
  const indices = [
    0, 1, 4,
    0, 4, 2,
    4, 1, 3,
    4, 3, 2,
    // reverso
    0, 4, 1,
    0, 2, 4,
    4, 3, 1,
    4, 2, 3,
  ];
  leafGeo.setAttribute('position', new T.BufferAttribute(positions, 3));
  leafGeo.setIndex(indices);
  leafGeo.computeVertexNormals();

  // Distribuir 9 a 12 hojas lanceoladas alternas
  const count = 10;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const dist = 0.12 + (i / count) * 0.18;
    const y = 0.02 + Math.sin(angle * 2) * 0.08;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    const m = mesh(cluster, leafGeo, i % 3 === 0 ? leafFresh : (i % 2 === 0 ? leafTop : leafUnder), [x, y, z]);
    m.scale.setScalar(1.1 + Math.random() * 0.4);
    m.rotation.set(
      0.3 + Math.sin(angle) * 0.4,
      angle + Math.PI / 2,
      -0.2 + Math.cos(angle) * 0.4
    );
  }

  return cluster;
}

export function buildAlmondTree() {
  const root = group(null, 'PRUNUS_DULCIS_ALMOND_TREE');

  // ==========================================
  // 1. ALCORQUE DE SECANO Y SUELO MEDITERRÁNEO
  // ==========================================
  mesh(root, new T.CylinderGeometry(1.8, 2.5, 0.18, 36), soilDry, [0, 0.09, 0]);

  // Piedras calcáreas dispersas
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const r = 1.2 + Math.random() * 0.7;
    const stone = mesh(root, new T.DodecahedronGeometry(0.07 + Math.random() * 0.08), barkTwig, [
      Math.cos(a) * r,
      0.14,
      Math.sin(a) * r,
    ]);
    stone.scale.set(1.4, 0.6, 1.1);
  }

  // ==========================================
  // 2. TRONCO PRINCIPAL AÑOSO, RETORCIDO Y AGRIETADO
  // ==========================================
  // Raíces gruesas de soporte
  const roots = [
    [[0, 0.1, 0], [0.5, 0.08, 0.3], [0.95, 0.02, 0.55]],
    [[0, 0.1, 0], [-0.45, 0.08, -0.35], [-0.9, 0.02, -0.65]],
    [[0, 0.1, 0], [-0.55, 0.08, 0.25], [-1.0, 0.02, 0.45]],
    [[0, 0.1, 0], [0.4, 0.08, -0.45], [0.85, 0.02, -0.8]],
  ];
  for (const r of roots) {
    createCrookedBranch(root, r, 0.19, 0.05, barkOldTrunk, 8);
  }

  // Fuste principal con torsión orgánica típica del almendro adulto
  const mainTrunk = [
    [0, 0.05, 0],
    [-0.05, 0.4, 0.04],
    [0.06, 0.8, -0.05],
    [-0.02, 1.25, 0.03],
    [0.04, 1.55, 0.0],
  ];
  createCrookedBranch(root, mainTrunk, 0.31, 0.22, barkOldTrunk, 16);

  // Fisuras longitudinales del tronco (estrías oscuras en relieve)
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const y = 0.3 + (i % 3) * 0.35;
    const b = mesh(
      root,
      new T.CylinderGeometry(0.04, 0.045, 0.65, 6),
      barkFissure,
      [Math.cos(a) * 0.26, y, Math.sin(a) * 0.26],
      [0.15 * Math.sin(a), 0, -0.15 * Math.cos(a)]
    );
    b.scale.set(0.6, 1, 1.8);
  }

  // ==========================================
  // 3. ESTRUCTURA DE RAMAS PRINCIPALES (CRUZ Y BRAZOS)
  // ==========================================
  // El almendro abre su copa con ramas robustas que ascienden y luego se arquean hacia afuera
  const scaffoldBranches = [
    {
      points: [
        [0.04, 1.55, 0.0],
        [0.55, 1.95, 0.3],
        [1.15, 2.35, 0.55],
        [1.75, 2.65, 0.75],
      ],
      twigs: [
        { start: [1.15, 2.35, 0.55], end: [1.5, 3.05, 0.2] },
        { start: [1.75, 2.65, 0.75], end: [2.2, 2.95, 1.1] },
        { start: [1.75, 2.65, 0.75], end: [2.05, 3.15, 0.4] },
      ],
    },
    {
      points: [
        [0.04, 1.55, 0.0],
        [-0.45, 1.9, 0.45],
        [-1.05, 2.25, 0.95],
        [-1.65, 2.55, 1.35],
      ],
      twigs: [
        { start: [-1.05, 2.25, 0.95], end: [-1.35, 2.95, 0.6] },
        { start: [-1.65, 2.55, 1.35], end: [-2.1, 2.85, 1.7] },
        { start: [-1.65, 2.55, 1.35], end: [-1.85, 3.1, 1.05] },
      ],
    },
    {
      points: [
        [0.04, 1.55, 0.0],
        [-0.35, 1.95, -0.5],
        [-0.8, 2.3, -1.1],
        [-1.35, 2.6, -1.6],
      ],
      twigs: [
        { start: [-0.8, 2.3, -1.1], end: [-1.15, 3.05, -0.8] },
        { start: [-1.35, 2.6, -1.6], end: [-1.75, 2.9, -2.0] },
        { start: [-1.35, 2.6, -1.6], end: [-1.5, 3.12, -1.25] },
      ],
    },
    {
      points: [
        [0.04, 1.55, 0.0],
        [0.35, 2.05, -0.45],
        [0.75, 2.45, -0.95],
        [1.25, 2.75, -1.4],
      ],
      twigs: [
        { start: [0.75, 2.45, -0.95], end: [0.95, 3.15, -0.6] },
        { start: [1.25, 2.75, -1.4], end: [1.65, 3.05, -1.75] },
        { start: [1.25, 2.75, -1.4], end: [1.4, 3.25, -1.05] },
      ],
    },
  ];

  const fruitPositions = [];

  for (const sc of scaffoldBranches) {
    createCrookedBranch(root, sc.points, 0.17, 0.09, barkYoungBranch, 10);

    for (const tw of sc.twigs) {
      const mid = [
        (tw.start[0] + tw.end[0]) * 0.5 + (Math.random() - 0.5) * 0.15,
        (tw.start[1] + tw.end[1]) * 0.5 + 0.1,
        (tw.start[2] + tw.end[2]) * 0.5 + (Math.random() - 0.5) * 0.15,
      ];
      createCrookedBranch(root, [tw.start, mid, tw.end], 0.08, 0.035, barkTwig, 8);

      // Puntos para frutos
      fruitPositions.push([mid[0], mid[1] - 0.06, mid[2]]);
      fruitPositions.push([tw.end[0], tw.end[1] - 0.08, tw.end[2]]);
    }
  }

  // ==========================================
  // 4. FRUTOS DE ALMENDRA (DRUPAS COLGANTES)
  // ==========================================
  // Distribuir almendras individuales y en parejas, con sutura abierta visible
  for (let i = 0; i < fruitPositions.length; i++) {
    const pos = fruitPositions[i];
    const isSplit = i % 2 === 0; // el 50% muestran la sutura abierta dejando ver la cáscara
    createAlmondFruit(root, pos, [0.2, (i * 1.5) % Math.PI, 0.1], isSplit);

    // Añadir una segunda almendra gemela en algunos puntos
    if (i % 3 === 0) {
      createAlmondFruit(
        root,
        [pos[0] + 0.06, pos[1] - 0.03, pos[2] + 0.05],
        [-0.15, (i * 2.1) % Math.PI, -0.2],
        !isSplit
      );
    }
  }

  // ==========================================
  // 5. FOLLAJE LANCEOLADO EN COPA REDONDEADA
  // ==========================================
  const foliageNodes = [
    // Vértice superior
    [0.0, 3.45, 0.0, 1.25],
    [0.2, 3.3, 0.3, 1.2],
    [-0.25, 3.35, -0.2, 1.2],

    // Cuadrante Este
    [1.2, 3.1, 0.45, 1.2],
    [1.8, 2.9, 0.8, 1.15],
    [2.1, 2.7, 0.3, 1.1],
    [1.5, 3.25, -0.2, 1.15],

    // Cuadrante Oeste
    [-1.15, 3.05, 0.8, 1.2],
    [-1.75, 2.85, 1.4, 1.15],
    [-2.0, 2.65, 0.9, 1.1],
    [-1.4, 3.15, 0.35, 1.15],

    // Cuadrante Sur
    [-0.95, 3.1, -1.0, 1.2],
    [-1.5, 2.9, -1.6, 1.15],
    [-1.8, 2.7, -1.2, 1.1],
    [-0.8, 3.2, -1.4, 1.15],

    // Cuadrante Norte
    [0.85, 3.15, -0.9, 1.2],
    [1.4, 2.95, -1.5, 1.15],
    [1.7, 2.75, -1.1, 1.1],
    [0.75, 3.3, -1.3, 1.15],

    // Ramaje bajo perimetral
    [1.1, 2.5, 1.2, 1.05],
    [-0.4, 2.6, 1.7, 1.05],
    [-1.3, 2.45, -0.3, 1.05],
    [0.5, 2.55, -1.5, 1.05],
  ];

  for (const [x, y, z, s] of foliageNodes) {
    createAlmondFoliageCluster(
      root,
      [x, y, z],
      [(Math.random() - 0.5) * 0.4, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.4],
      s
    );
  }

  return root;
}

// Compilar y guardar GLB
const tree = buildAlmondTree();
tree.userData = {
  name: 'Árbol Almendro Hiperrealista (Prunus dulcis)',
  botanicalFamily: 'Rosaceae',
  fruitType: 'Drupe with splitting pubescent hull and woody endocarp',
  leafType: 'Alternate lanceolate leaves with serrated margins',
  author: 'Antigravity 3D Botanical Generator',
};

const exporter = new GLTFExporter();
const glbBuffer = await exporter.parseAsync(tree, { binary: true });

await writeFile('extracted-3d-lib/models/arbol-almendro.glb', Buffer.from(glbBuffer));
console.log('✅ arbol-almendro.glb generado con éxito! Tamaño:', Math.round(glbBuffer.byteLength / 1024), 'KB');
