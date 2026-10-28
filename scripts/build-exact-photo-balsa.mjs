import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { writeFile } from 'node:fs/promises';

// Polyfill FileReader for Node.js
globalThis.FileReader = class {
  readAsArrayBuffer(b) {
    b.arrayBuffer().then(x => { this.result = x; this.onloadend?.(); });
  }
};

function mat(name, color, metalness = 0.05, roughness = 0.8, extra = {}) {
  const m = new T.MeshStandardMaterial({
    color,
    metalness,
    roughness,
    side: T.DoubleSide, // Garantiza que no desaparezca ninguna cara
    ...extra,
  });
  m.name = name;
  return m;
}

// ==========================================
// PALETA: AGUA AZUL ELÉCTRICO Y EXTERIORES VERDE CLARO
// ==========================================
// 1. Geomembrana limpia gris claro (sin rayas)
const linerGrey = mat('Light Grey Geotextile Liner (Talud 45º)', '#b8c0c4', 0.1, 0.7);

// 2. Agua azul eléctrico puro, brillante e impecable (SIN rayas oscuras)
const waterElectricBlue = new T.MeshStandardMaterial({
  color: '#0066ff',
  emissive: '#0033aa',
  emissiveIntensity: 0.35,
  roughness: 0.05,
  metalness: 0.2,
  transparent: true,
  opacity: 0.95,
  side: T.DoubleSide,
});
waterElectricBlue.name = 'Irrigation Water Mirror';

// 3. Exteriores en VERDE CLARO fresco (en vez de marrón)
const crownPath = mat('Crown Access Path Light Sand', '#cfc3a5', 0.02, 0.9);
const outerSlopeGreen = mat('Outer Slope Light Green', '#76b83f', 0.02, 0.92);
const fieldGroundGreen = mat('Surrounding Field Fresh Light Green', '#8bc34a', 0.02, 0.95);

// 4. Vallado metálico continuo
const fencePostMat = mat('Fence Posts Galvanized', '#687278', 0.85, 0.3);
const fenceWireMat = mat('Fence Wire Steel', '#889298', 0.8, 0.35);

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

// Genera un anillo cerrado con lados rectos y esquinas curvas perfectamente distribuidas
function createEquidistantRoundedRing(halfX, halfZ, radius, y, numPoints = 120) {
  const shape = new T.Shape();
  const x = halfX - radius;
  const z = halfZ - radius;

  // Camino cerrado matemáticamente regular
  shape.moveTo(x, halfZ);
  shape.lineTo(-x, halfZ);
  shape.absarc(-x, z, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(-halfX, -z);
  shape.absarc(-x, -z, radius, Math.PI, (3 * Math.PI) / 2, false);
  shape.lineTo(x, -halfZ);
  shape.absarc(x, -z, radius, (3 * Math.PI) / 2, Math.PI * 2, false);
  shape.lineTo(halfX, z);
  shape.absarc(x, z, radius, 0, Math.PI / 2, false);

  // Puntos equidistantes a lo largo de todo el perímetro (rectas y curvas)
  const points2D = shape.getSpacedPoints(numPoints);
  return points2D.map(p => new T.Vector3(p.x, y, p.y));
}

// Conecta dos anillos contiguos en una banda 3D cerrada
function createBandMesh(ring1, ring2, material) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const n = ring1.length;

  for (let i = 0; i < n; i++) {
    positions.push(ring1[i].x, ring1[i].y, ring1[i].z);
    uvs.push(i / n, 0);
  }
  for (let i = 0; i < n; i++) {
    positions.push(ring2[i].x, ring2[i].y, ring2[i].z);
    uvs.push(i / n, 1);
  }

  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const a = i;
    const b = next;
    const c = n + i;
    const d = n + next;

    indices.push(a, b, c);
    indices.push(b, d, c);
  }

  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute('uv', new T.BufferAttribute(new Float32Array(uvs), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const m = new T.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function buildCleanBigBalsa() {
  const root = group(null, 'BIG_BALSA_RIEGO_CLEAN');

  // Dimensiones de gran escala
  const height = 4.8;     // 4.8m de profundidad
  const slopeDelta = 4.8; // Talud interior a 45º EXACTOS

  // 1. Fondo de la balsa
  const bottomHalfX = 26; // 52m de fondo
  const bottomHalfZ = 20; // 40m de fondo
  const bottomR = 3.5;

  // 2. Coronación interior (borde superior del talud a 45º)
  const crownHalfX = bottomHalfX + slopeDelta; // 30.8m
  const crownHalfZ = bottomHalfZ + slopeDelta; // 24.8m
  const crownR = bottomR + slopeDelta; // 8.3m

  // 3. Borde exterior del camino de coronación
  const roadW = 3.6;
  const outerCrownHalfX = crownHalfX + roadW; // 34.4m
  const outerCrownHalfZ = crownHalfZ + roadW; // 28.4m
  const outerCrownR = crownR + roadW;

  // 4. Pie de talud exterior
  const outerSlopeDelta = 4.5;
  const toeHalfX = outerCrownHalfX + outerSlopeDelta; // 38.9m (78m de ancho total)
  const toeHalfZ = outerCrownHalfZ + outerSlopeDelta; // 32.9m (66m de largo total)
  const toeR = outerCrownR + outerSlopeDelta;

  // 5. Límite de parcela verde exterior
  const fieldMargin = 5.0;
  const fieldHalfX = toeHalfX + fieldMargin;
  const fieldHalfZ = toeHalfZ + fieldMargin;
  const fieldR = toeR + fieldMargin;

  const numPoints = 120;

  // Generar anillos cerrados equidistantes (100% regulares sin saltos)
  const ringBottom = createEquidistantRoundedRing(bottomHalfX, bottomHalfZ, bottomR, 0.08, numPoints);
  const ringCrownInner = createEquidistantRoundedRing(crownHalfX, crownHalfZ, crownR, height, numPoints);
  const ringCrownOuter = createEquidistantRoundedRing(outerCrownHalfX, outerCrownHalfZ, outerCrownR, height, numPoints);
  const ringToe = createEquidistantRoundedRing(toeHalfX, toeHalfZ, toeR, 0.04, numPoints);
  const ringField = createEquidistantRoundedRing(fieldHalfX, fieldHalfZ, fieldR, 0.0, numPoints);

  // ==========================================
  // 1. FONDO LIMPIO DE LA BALSA
  // ==========================================
  const bottomPos = [0, 0.08, 0];
  const bottomUvs = [0.5, 0.5];
  const bottomIndices = [];
  for (let i = 0; i < numPoints; i++) {
    bottomPos.push(ringBottom[i].x, ringBottom[i].y, ringBottom[i].z);
    bottomUvs.push(ringBottom[i].x / 60 + 0.5, ringBottom[i].z / 60 + 0.5);
  }
  for (let i = 0; i < numPoints; i++) {
    const next = (i + 1) % numPoints;
    bottomIndices.push(0, i + 1, next + 1);
  }
  const bottomGeo = new T.BufferGeometry();
  bottomGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(bottomPos), 3));
  bottomGeo.setAttribute('uv', new T.BufferAttribute(new Float32Array(bottomUvs), 2));
  bottomGeo.setIndex(bottomIndices);
  bottomGeo.computeVertexNormals();
  const bottomMesh = new T.Mesh(bottomGeo, linerGrey);
  root.add(bottomMesh);

  // ==========================================
  // 2. TALUD A 45º TOTALMENTE LIMPIO (SIN RAYAS OSCURAS)
  // ==========================================
  const innerSlopeMesh = createBandMesh(ringBottom, ringCrownInner, linerGrey);
  root.add(innerSlopeMesh);

  // ==========================================
  // 3. CAMINO DE CORONACIÓN
  // ==========================================
  const crownRoadMesh = createBandMesh(ringCrownInner, ringCrownOuter, crownPath);
  root.add(crownRoadMesh);

  // ==========================================
  // 4. TALUD EXTERIOR EN VERDE CLARO
  // ==========================================
  const outerSlopeMesh = createBandMesh(ringCrownOuter, ringToe, outerSlopeGreen);
  root.add(outerSlopeMesh);

  // ==========================================
  // 5. PARCELA EXTERIOR EN VERDE CLARO FRESCO
  // ==========================================
  const fieldSkirtMesh = createBandMesh(ringToe, ringField, fieldGroundGreen);
  root.add(fieldSkirtMesh);

  // ==========================================
  // 6. AGUA AZUL ELÉCTRICO INTENSO, LIMPIO Y CRISTALINO
  // ==========================================
  const waterHeight = 3.35;
  const waterRatio = waterHeight / height;
  const waterHalfX = bottomHalfX + waterRatio * slopeDelta;
  const waterHalfZ = bottomHalfZ + waterRatio * slopeDelta;
  const waterR = bottomR + waterRatio * slopeDelta;

  const ringWater = createEquidistantRoundedRing(waterHalfX, waterHalfZ, waterR, waterHeight, numPoints);
  const waterPos = [0, waterHeight, 0];
  const waterUvs = [0.5, 0.5];
  const waterIndices = [];
  for (let i = 0; i < numPoints; i++) {
    waterPos.push(ringWater[i].x, ringWater[i].y, ringWater[i].z);
    waterUvs.push(ringWater[i].x / 50 + 0.5, ringWater[i].z / 50 + 0.5);
  }
  for (let i = 0; i < numPoints; i++) {
    const next = (i + 1) % numPoints;
    waterIndices.push(0, i + 1, next + 1);
  }
  const waterGeo = new T.BufferGeometry();
  waterGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(waterPos), 3));
  waterGeo.setAttribute('uv', new T.BufferAttribute(new Float32Array(waterUvs), 2));
  waterGeo.setIndex(waterIndices);
  waterGeo.computeVertexNormals();

  const waterMesh = new T.Mesh(waterGeo, waterElectricBlue);
  waterMesh.name = 'Irrigation Water Mirror';
  root.add(waterMesh);

  // ==========================================
  // 7. VALLADO 100% COMPLETO EN TODO EL PERÍMETRO (SIN HUECOS)
  // ==========================================
  const fencePosts = [];
  // Un poste cada 2 puntos en los 360 grados completos
  for (let i = 0; i < numPoints; i += 2) {
    const p = ringCrownOuter[i];
    const postGeo = new T.CylinderGeometry(0.025, 0.025, 1.35, 6);
    mesh(root, postGeo, fencePostMat, [p.x, height + 0.68, p.z]);
    fencePosts.push(new T.Vector3(p.x, height + 1.25, p.z));
  }

  // Alambre continuo cerrando el circuito completo sin ninguna brecha
  const numPosts = fencePosts.length;
  for (let i = 0; i < numPosts; i++) {
    const p1 = fencePosts[i];
    const p2 = fencePosts[(i + 1) % numPosts];
    const dist = p1.distanceTo(p2);
    const dir = new T.Vector3().subVectors(p2, p1).normalize();
    const mid = new T.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

    const wireGeo = new T.CylinderGeometry(0.007, 0.007, dist, 4);
    const wire = mesh(root, wireGeo, fenceWireMat, mid.toArray());
    wire.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
  }

  return root;
}

// Compilar y guardar GLB
const reservoir = buildCleanBigBalsa();
reservoir.userData = {
  name: 'Balsa de Riego Agrícola Perfeccionada (Verde Claro, Azul Eléctrico Puro, Vallado 360º)',
  author: 'Antigravity 3D Generator',
};

const exporter = new GLTFExporter();
const glbBuffer = await exporter.parseAsync(reservoir, { binary: true });

await writeFile('extracted-3d-lib/models/embalse-riego.glb', Buffer.from(glbBuffer));
console.log('✅ embalse-riego.glb actualizado con éxito (Sin rayas oscuras, vallado 360º completo, exteriores verde claro)! Tamaño:', Math.round(glbBuffer.byteLength / 1024), 'KB');
