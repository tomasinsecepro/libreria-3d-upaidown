import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { writeFile } from 'node:fs/promises';

// Polyfill FileReader for Node.js
globalThis.FileReader = class {
  readAsArrayBuffer(b) {
    b.arrayBuffer().then(x => { this.result = x; this.onloadend?.(); });
  }
};

function mat(name, color, metalness = 0.1, roughness = 0.5, extra = {}) {
  const m = new T.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  m.name = name;
  return m;
}

// ==========================================
// PALETA DE MATERIALES LIMPIA Y REALISTA
// ==========================================
// Hormigón armado / Muros verticales a 90º de la balsa
const concreteWallMat = mat('Vertical Reinforced Concrete Walls', '#9ea4a8', 0.1, 0.75);
const concreteRimMat = mat('Concrete Top Edge (Coronación)', '#b8bfc4', 0.15, 0.65);
const concreteFloorMat = mat('Reservoir Concrete Floor', '#686f73', 0.05, 0.85);

// Espejo de agua azul cristalino profundo con reflejos
const waterMat = new T.MeshStandardMaterial({
  color: '#0a758f',
  roughness: 0.06,
  metalness: 0.2,
  transparent: true,
  opacity: 0.82,
});
waterMat.name = 'Irrigation Water Mirror';

// Suelo exterior agrícola y camino de coronación
const groundTerrain = mat('Agricultural Orchard Ground', '#5a4935', 0.02, 0.96);
const gravelPath = mat('Gravel Surrounding Path', '#887b68', 0.02, 0.9);

// Vallado perimetral de seguridad
const fencePostMat = mat('Galvanized Fence Posts', '#707a82', 0.85, 0.3);
const fenceWireMat = mat('Perimeter Fence Wire', '#8a949c', 0.8, 0.35);

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

export function buildCleanVerticalReservoir() {
  const root = group(null, 'VERTICAL_WALL_RESERVOIR');

  // Dimensiones interiores del embalse
  const innerLength = 26; // Eje X
  const innerWidth = 18;  // Eje Z
  const wallHeight = 4.2; // Altura vertical a 90º
  const wallThickness = 0.7; // Grosor de los muros de hormigón

  const outerLength = innerLength + wallThickness * 2;
  const outerWidth = innerWidth + wallThickness * 2;

  // Nivel de agua interior (a 80% de la altura)
  const waterLevelY = 3.4;

  // ==========================================
  // 1. TERRENO BASE EXTERIOR Y PLATAFORMA
  // ==========================================
  // Terreno general de la parcela
  mesh(root, new T.BoxGeometry(54, 0.4, 46), groundTerrain, [0, -0.2, 0]);

  // Camino de grava perimetral alrededor de la balsa
  const pathWidth = 3.5;
  mesh(
    root,
    new T.BoxGeometry(outerLength + pathWidth * 2, 0.08, outerWidth + pathWidth * 2),
    gravelPath,
    [0, 0.04, 0]
  );

  // ==========================================
  // 2. FONDO DEL EMBALSE (SOLERA DE HORMIGÓN)
  // ==========================================
  mesh(root, new T.BoxGeometry(innerLength, 0.3, innerWidth), concreteFloorMat, [0, 0.15, 0]);

  // ==========================================
  // 3. PAREDES VERTICALES A 90º DE ARRIBA A ABAJO
  // ==========================================
  const wallCenterY = wallHeight / 2;

  // Muro Norte (+Z) a 90 grados
  mesh(
    root,
    new T.BoxGeometry(outerLength, wallHeight, wallThickness),
    concreteWallMat,
    [0, wallCenterY, innerWidth / 2 + wallThickness / 2]
  );

  // Muro Sur (-Z) a 90 grados
  mesh(
    root,
    new T.BoxGeometry(outerLength, wallHeight, wallThickness),
    concreteWallMat,
    [0, wallCenterY, -(innerWidth / 2 + wallThickness / 2)]
  );

  // Muro Este (+X) a 90 grados
  mesh(
    root,
    new T.BoxGeometry(wallThickness, wallHeight, innerWidth),
    concreteWallMat,
    [innerLength / 2 + wallThickness / 2, wallCenterY, 0]
  );

  // Muro Oeste (-X) a 90 grados
  mesh(
    root,
    new T.BoxGeometry(wallThickness, wallHeight, innerWidth),
    concreteWallMat,
    [-(innerLength / 2 + wallThickness / 2), wallCenterY, 0]
  );

  // Albardilla / Coronación superior limpia de hormigón en la cima de los muros
  mesh(
    root,
    new T.BoxGeometry(outerLength + 0.15, 0.14, wallThickness + 0.15),
    concreteRimMat,
    [0, wallHeight + 0.07, innerWidth / 2 + wallThickness / 2]
  );
  mesh(
    root,
    new T.BoxGeometry(outerLength + 0.15, 0.14, wallThickness + 0.15),
    concreteRimMat,
    [0, wallHeight + 0.07, -(innerWidth / 2 + wallThickness / 2)]
  );
  mesh(
    root,
    new T.BoxGeometry(wallThickness + 0.15, 0.14, innerWidth + 0.15),
    concreteRimMat,
    [innerLength / 2 + wallThickness / 2, wallHeight + 0.07, 0]
  );
  mesh(
    root,
    new T.BoxGeometry(wallThickness + 0.15, 0.14, innerWidth + 0.15),
    concreteRimMat,
    [-(innerLength / 2 + wallThickness / 2), wallHeight + 0.07, 0]
  );

  // ==========================================
  // 4. AGUA REALISTA EN EL INTERIOR DEL EMBALSE
  // ==========================================
  // Bloque y superficie de agua encajada exactamente dentro de las paredes de 90º
  const waterMesh = mesh(
    root,
    new T.BoxGeometry(innerLength - 0.05, waterLevelY, innerWidth - 0.05),
    waterMat,
    [0, waterLevelY / 2 + 0.15, 0]
  );
  waterMesh.name = 'Irrigation Water Mirror';

  // Mira de nivel graduada / regla de medición vertical sobre una de las paredes de 90º
  const staff = group(root, 'staff_gauge', [-innerLength / 2 + 1.2, wallHeight / 2, innerWidth / 2 - 0.02]);
  mesh(staff, new T.BoxGeometry(0.18, wallHeight * 0.9, 0.03), mat('Gauge White', '#f4f6f7', 0.2, 0.3), [0, 0, 0]);
  // Marcas de metro en la regla
  for (let m = -wallHeight * 0.4; m <= wallHeight * 0.4; m += 0.4) {
    mesh(staff, new T.BoxGeometry(0.14, 0.03, 0.035), mat('Gauge Black', '#1a1d20', 0.5, 0.4), [0, m, 0.005]);
  }

  // ==========================================
  // 5. VALLADO PERIMETRAL DE SEGURIDAD LIMPIO
  // ==========================================
  const fenceGroup = group(root, 'perimeter_fence');
  const fenceW = outerLength + pathWidth * 2 - 0.8;
  const fenceL = outerWidth + pathWidth * 2 - 0.8;
  const postH = 1.5;
  const spacing = 3.0;

  const numX = Math.floor(fenceW / spacing);
  const numZ = Math.floor(fenceL / spacing);

  // Postes Norte y Sur
  for (let i = -numX / 2; i <= numX / 2; i++) {
    const px = i * (fenceW / numX);
    mesh(fenceGroup, new T.CylinderGeometry(0.022, 0.022, postH, 6), fencePostMat, [px, postH / 2 + 0.08, fenceL / 2]);
    mesh(fenceGroup, new T.CylinderGeometry(0.022, 0.022, postH, 6), fencePostMat, [px, postH / 2 + 0.08, -fenceL / 2]);
  }

  // Postes Este y Oeste
  for (let j = -numZ / 2; j <= numZ / 2; j++) {
    const pz = j * (fenceL / numZ);
    mesh(fenceGroup, new T.CylinderGeometry(0.022, 0.022, postH, 6), fencePostMat, [fenceW / 2, postH / 2 + 0.08, pz]);
    mesh(fenceGroup, new T.CylinderGeometry(0.022, 0.022, postH, 6), fencePostMat, [-fenceW / 2, postH / 2 + 0.08, pz]);
  }

  // Líneas de alambre tensor
  for (const h of [0.4, 0.8, 1.15, 1.45]) {
    rod(fenceGroup, [-fenceW / 2, h + 0.08, fenceL / 2], [fenceW / 2, h + 0.08, fenceL / 2], 0.007, fenceWireMat);
    rod(fenceGroup, [-fenceW / 2, h + 0.08, -fenceL / 2], [fenceW / 2, h + 0.08, -fenceL / 2], 0.007, fenceWireMat);
    rod(fenceGroup, [fenceW / 2, h + 0.08, -fenceL / 2], [fenceW / 2, h + 0.08, fenceL / 2], 0.007, fenceWireMat);
    rod(fenceGroup, [-fenceW / 2, h + 0.08, -fenceL / 2], [-fenceW / 2, h + 0.08, fenceL / 2], 0.007, fenceWireMat);
  }

  return root;
}

// Compilar y guardar GLB
const reservoir = buildCleanVerticalReservoir();
reservoir.userData = {
  name: 'Embalse / Depósito Agrícola con Paredes Verticales a 90º y Agua Realista',
  type: 'Agricultural Vertical Wall Concrete Water Reservoir',
  dimensions: '26m x 18m x 4.2m',
  author: 'Antigravity 3D Generator',
};

const exporter = new GLTFExporter();
const glbBuffer = await exporter.parseAsync(reservoir, { binary: true });

await writeFile('extracted-3d-lib/models/embalse-riego.glb', Buffer.from(glbBuffer));
console.log('✅ embalse-riego.glb generado con éxito (Paredes 90º, con agua interior, sin caseta, sin pasarela, sin recuadros)! Tamaño:', Math.round(glbBuffer.byteLength / 1024), 'KB');
