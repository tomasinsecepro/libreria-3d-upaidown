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
// PALETA BOTÁNICA REALISTA PISTACIA VERA
// ==========================================
const barkDark = mat('Pistachio Bark Dark', '#3a352d', 0.02, 0.95);
const barkMedium = mat('Pistachio Bark Scaly', '#4a4338', 0.02, 0.9);
const barkGrey = mat('Pistachio Bark Silver-Grey', '#5c5446', 0.02, 0.88);
const leafDarkGreen = mat('Compound Leaf Dark Green', '#27431c', 0.05, 0.45, { side: T.DoubleSide });
const leafLighterGreen = mat('Compound Leaf Medium Green', '#355624', 0.05, 0.5, { side: T.DoubleSide });
const leafBright = mat('Compound Leaf Fresh Shoot', '#4b752f', 0.05, 0.4, { side: T.DoubleSide });
const pistachioPink = mat('Ripe Pistachio Nut Hull Pink', '#d9534f', 0.08, 0.65);
const pistachioCream = mat('Pistachio Shell Cream', '#e6dec8', 0.05, 0.7);
const pistachioGreen = mat('Unripe Pistachio Hull Green', '#8fae54', 0.05, 0.6);
const soilMat = mat('Orchard Dry Soil', '#5c4832', 0.02, 0.98);

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
function createCrookedBranch(parent, points, startRadius, endRadius, material, segs = 10) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
  const geo = new T.TubeGeometry(curve, segs, startRadius, 10, false);
  return mesh(parent, geo, material);
}

// Crea un racimo colgante de pistachos (drupe cluster)
function createPistachioCluster(parent, pos) {
  const cluster = group(parent, 'pistachio_cluster', pos);
  
  // Tallo central leñoso del racimo
  const stemGeo = new T.CylinderGeometry(0.012, 0.006, 0.28, 8);
  mesh(cluster, stemGeo, barkGrey, [0, -0.14, 0]);

  // Nueces de pistacho en racimo (forma ovoidal almendrada)
  const nutGeo = new T.SphereGeometry(0.042, 12, 10);
  nutGeo.scale(0.8, 1.25, 0.75); // alargar como pistacho real

  const numNuts = 18;
  for (let i = 0; i < numNuts; i++) {
    const t = i / numNuts;
    const angle = i * 2.399; // ángulo áureo
    const radius = 0.04 + (1 - t) * 0.08;
    const y = -0.06 - t * 0.22;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Pedúnculo fino
    const stalkGeo = new T.CylinderGeometry(0.003, 0.003, 0.04, 5);
    mesh(cluster, stalkGeo, barkGrey, [x * 0.5, y + 0.02, z * 0.5]);

    // Pistacho con mezcla de color (rubor rosado de maduración + verde)
    const nutMat = i % 3 === 0 ? pistachioPink : (i % 2 === 0 ? pistachioCream : pistachioGreen);
    const nutMesh = mesh(cluster, nutGeo, nutMat, [x, y, z]);
    nutMesh.rotation.set(Math.random() * 0.4, angle, Math.PI / 4 + Math.random() * 0.3);
  }

  return cluster;
}

// Crea un grupo de hojas compuestas imparipinnadas (folíolos 3 a 5 típicos)
function createFoliageTuft(parent, pos, rot, scale = 1.0) {
  const tuft = group(parent, 'foliage_tuft', pos, rot);
  tuft.scale.setScalar(scale);

  // Folíolo elíptico coriáceo
  const leafletGeo = new T.SphereGeometry(0.18, 8, 6);
  leafletGeo.scale(1.0, 0.12, 1.85); // hoja elíptica aplanada

  // Creamos hojas en varias direcciones formando una mata natural
  const leafCount = 7;
  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist = 0.15 + Math.random() * 0.25;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const y = (Math.random() - 0.3) * 0.2;

    const leafMat = i % 2 === 0 ? leafDarkGreen : (i % 3 === 0 ? leafLighterGreen : leafBright);
    const leaf = mesh(tuft, leafletGeo, leafMat, [x, y, z]);
    leaf.rotation.set(
      Math.sin(angle) * 0.3 + 0.1,
      angle + Math.PI / 2,
      Math.cos(angle) * 0.35 + (Math.random() - 0.5) * 0.2
    );
  }

  return tuft;
}

export function buildPistachioTree() {
  const root = group(null, 'PISTACHIA_VERA_TREE');

  // ==========================================
  // 1. BASE DE TIERRA / ALCORQUE DE SECANO
  // ==========================================
  const groundMound = mesh(
    root,
    new T.CylinderGeometry(1.6, 2.2, 0.18, 32),
    soilMat,
    [0, 0.09, 0]
  );
  // Piedras y relieve del alcorque
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = 1.1 + Math.random() * 0.5;
    mesh(
      root,
      new T.DodecahedronGeometry(0.08 + Math.random() * 0.06),
      barkGrey,
      [Math.cos(a) * r, 0.14, Math.sin(a) * r],
      [Math.random(), Math.random(), 0]
    );
  }

  // ==========================================
  // 2. TRONCO PRINCIPAL ROBUSTO Y RETORCIDO
  // ==========================================
  // Raíces superficiales gnosas
  const rootFlairs = [
    [[0, 0.1, 0], [0.45, 0.08, 0.25], [0.85, 0.02, 0.5]],
    [[0, 0.1, 0], [-0.4, 0.08, -0.3], [-0.8, 0.02, -0.6]],
    [[0, 0.1, 0], [-0.5, 0.08, 0.2], [-0.9, 0.02, 0.35]],
    [[0, 0.1, 0], [0.35, 0.08, -0.4], [0.75, 0.02, -0.7]],
  ];
  for (const rf of rootFlairs) {
    createCrookedBranch(root, rf, 0.18, 0.06, barkDark, 8);
  }

  // Fuste / Tronco central corto (hasta bifurcación a ~1.1m estilo vaso español)
  const trunkPoints = [
    [0, 0.05, 0],
    [0.05, 0.35, -0.04],
    [-0.04, 0.72, 0.06],
    [0.02, 1.12, 0.02],
  ];
  createCrookedBranch(root, trunkPoints, 0.28, 0.22, barkDark, 12);

  // Nudos de corteza y protuberancias del tronco
  for (let i = 0; i < 5; i++) {
    const y = 0.3 + i * 0.16;
    const a = i * 1.8;
    mesh(
      root,
      new T.SphereGeometry(0.12, 8, 6),
      barkMedium,
      [Math.cos(a) * 0.18, y, Math.sin(a) * 0.18]
    ).scale.set(1.2, 0.6, 0.8);
  }

  // ==========================================
  // 3. BRAZOS PRIMARIOS (FORMACIÓN EN VASO ABIERTO)
  // ==========================================
  // 3 brazos principales que se abren a 120° formando la cruz del pistachero
  const primaryScaffolds = [
    {
      angle: 0.2,
      points: [
        [0.02, 1.12, 0.02],
        [0.45, 1.45, 0.15],
        [0.95, 1.75, 0.3],
        [1.45, 1.95, 0.45],
      ],
      subBranches: [
        { start: [0.95, 1.75, 0.3], end: [1.3, 2.35, -0.1] },
        { start: [1.45, 1.95, 0.45], end: [1.85, 2.25, 0.8] },
        { start: [1.45, 1.95, 0.45], end: [1.7, 2.4, 0.2] },
      ],
    },
    {
      angle: 2.3,
      points: [
        [0.02, 1.12, 0.02],
        [-0.35, 1.42, 0.4],
        [-0.85, 1.68, 0.8],
        [-1.35, 1.88, 1.2],
      ],
      subBranches: [
        { start: [-0.85, 1.68, 0.8], end: [-1.2, 2.3, 0.5] },
        { start: [-1.35, 1.88, 1.2], end: [-1.8, 2.2, 1.5] },
        { start: [-1.35, 1.88, 1.2], end: [-1.55, 2.45, 0.9] },
      ],
    },
    {
      angle: 4.2,
      points: [
        [0.02, 1.12, 0.02],
        [-0.25, 1.48, -0.45],
        [-0.65, 1.72, -0.95],
        [-1.15, 1.92, -1.4],
      ],
      subBranches: [
        { start: [-0.65, 1.72, -0.95], end: [-0.9, 2.35, -1.35] },
        { start: [-1.15, 1.92, -1.4], end: [-1.55, 2.25, -1.75] },
        { start: [-1.15, 1.92, -1.4], end: [-1.4, 2.42, -1.05] },
      ],
    },
  ];

  // Construir brazos y ramas secundarias
  const clusterSpawnPoints = [];
  const foliageSpawnPoints = [];

  for (const scaffold of primaryScaffolds) {
    createCrookedBranch(root, scaffold.points, 0.16, 0.1, barkMedium, 10);

    for (const sub of scaffold.subBranches) {
      const mid = [
        (sub.start[0] + sub.end[0]) * 0.5 + (Math.random() - 0.5) * 0.15,
        (sub.start[1] + sub.end[1]) * 0.5 + 0.1,
        (sub.start[2] + sub.end[2]) * 0.5 + (Math.random() - 0.5) * 0.15,
      ];
      createCrookedBranch(root, [sub.start, mid, sub.end], 0.09, 0.045, barkGrey, 8);

      // Puntos para colgar racimos de pistacho
      clusterSpawnPoints.push([mid[0], mid[1] - 0.08, mid[2]]);
      foliageSpawnPoints.push(sub.end);
    }
  }

  // ==========================================
  // 4. RACIMOS DE PISTACHO COLGANTES (DETALLE EMBLEMÁTICO)
  // ==========================================
  for (const pos of clusterSpawnPoints) {
    createPistachioCluster(root, pos);
  }
  // Racimos adicionales en ramas secundarias interiores
  createPistachioCluster(root, [0.65, 1.55, 0.22]);
  createPistachioCluster(root, [-0.55, 1.5, 0.55]);
  createPistachioCluster(root, [-0.45, 1.52, -0.65]);

  // ==========================================
  // 5. COPA FOLIAR APARASOLADA (FOLLAJE DENSO Y LUSTRADO)
  // ==========================================
  // Crear nubes de hojas que forman la silueta globosa/aparasolada de Pistacia vera
  const canopyNodes = [
    // Centro superior
    [0.1, 2.7, 0.05, 1.3],
    [-0.15, 2.85, -0.1, 1.25],
    [0.2, 2.65, -0.2, 1.2],

    // Sector Este
    [1.1, 2.4, 0.4, 1.2],
    [1.6, 2.2, 0.6, 1.15],
    [1.85, 2.05, 0.2, 1.1],
    [1.4, 2.5, -0.2, 1.15],

    // Sector Noroeste
    [-1.0, 2.35, 0.8, 1.2],
    [-1.5, 2.15, 1.3, 1.15],
    [-1.75, 2.0, 0.7, 1.1],
    [-1.25, 2.45, 0.3, 1.15],

    // Sector Suroeste
    [-0.9, 2.4, -0.9, 1.2],
    [-1.35, 2.18, -1.45, 1.15],
    [-1.6, 1.98, -1.0, 1.1],
    [-0.75, 2.5, -1.3, 1.15],

    // Follaje perimetral bajo
    [0.85, 1.95, 1.1, 1.05],
    [-0.3, 2.05, 1.55, 1.05],
    [-1.2, 1.9, -0.2, 1.05],
    [0.4, 2.0, -1.35, 1.05],
  ];

  for (const [x, y, z, s] of canopyNodes) {
    createFoliageTuft(
      root,
      [x, y, z],
      [(Math.random() - 0.5) * 0.4, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.4],
      s
    );
  }

  return root;
}

// Compilar y guardar GLB
const tree = buildPistachioTree();
tree.userData = {
  name: 'Árbol Pistachero (Pistacia vera)',
  botanicalFamily: 'Anacardiaceae',
  cultivationStyle: 'Vaso Abierto / Spanish Orchard Training',
  author: 'Antigravity 3D Botanical Generator',
};

const exporter = new GLTFExporter();
const glbBuffer = await exporter.parseAsync(tree, { binary: true });

await writeFile('extracted-3d-lib/models/arbol-pistacho.glb', Buffer.from(glbBuffer));
console.log('✅ arbol-pistacho.glb generado con éxito! Tamaño:', Math.round(glbBuffer.byteLength / 1024), 'KB');
