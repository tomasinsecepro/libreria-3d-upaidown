import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import fs from 'node:fs';
import { writeFile } from 'node:fs/promises';

// Polyfill FileReader for Node.js
globalThis.FileReader = class {
  readAsArrayBuffer(b) {
    b.arrayBuffer().then(x => { this.result = x; this.onloadend?.(); });
  }
};

function mat(name, color, metalness = 0.3, roughness = 0.35, extra = {}) {
  const m = new T.MeshStandardMaterial({
    color,
    metalness,
    roughness,
    ...extra,
  });
  m.name = name;
  return m;
}

// ==========================================
// PALETA OFICIAL INGETEAM INGECON SUN 110TL M9
// ==========================================
const frontPanelGrey = mat('Ingeteam RAL 7035 Light Grey Front', '#d8dcde', 0.22, 0.38);
const chassisAnthracite = mat('Ingeteam Dark Anthracite Chassis', '#26292d', 0.35, 0.42);
const chassisRecess = mat('Ingeteam Recessed Bay Dark', '#1a1c1e', 0.25, 0.52);

const badgeBlack = mat('Status Display Polycarbonate Bezel', '#141618', 0.15, 0.22);
const badgeLogoWhite = mat('Ingeteam Screen-printed Logo White', '#f0f3f5', 0.1, 0.3);

const ledGreen = new T.MeshStandardMaterial({
  color: '#00ff66',
  emissive: '#00ff66',
  emissiveIntensity: 2.5,
  roughness: 0.1,
  metalness: 0.1,
});
ledGreen.name = 'Inverter Status LED Green';

const stainlessScrew = mat('Stainless Steel M8 Hex Bolts', '#bcc4cc', 0.92, 0.18);
const groundLugBrass = mat('Grounding Stud Brass', '#c8a858', 0.88, 0.25);
const sealRed = mat('Communications Gland Red Seal', '#b8261e', 0.05, 0.4);

const mc4Black = mat('Staubli MC4 Solar Connectors Black', '#111213', 0.12, 0.45);
const glandBlack = mat('IP68 Cable Gland Black Plastic', '#191b1d', 0.15, 0.5);
const heatSinkAlu = mat('Extruded Aluminum Heat Sink Fins', '#3a3f45', 0.78, 0.32);

function group(parent, name, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const g = new T.Group();
  g.name = name;
  g.position.set(...pos);
  g.rotation.set(...rot);
  if (parent) parent.add(g);
  return g;
}

function mesh(parent, geo, material, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new T.Mesh(geo, material);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.scale.set(...scale);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

// Tornillo hexagonal con arandela integrada
function addHexBolt(parent, pos, r = 0.0075, h = 0.005) {
  // Arandela
  const wGeo = new T.CylinderGeometry(r * 1.5, r * 1.5, 0.0015, 12);
  wGeo.rotateX(Math.PI / 2);
  mesh(parent, wGeo, stainlessScrew, [pos[0], pos[1], pos[2] + 0.0008]);

  // Cabeza hexagonal
  const hGeo = new T.CylinderGeometry(r, r, h, 6);
  hGeo.rotateX(Math.PI / 2);
  mesh(parent, hGeo, stainlessScrew, [pos[0], pos[1], pos[2] + 0.0015 + h / 2]);
}

export function buildIngeteamInverter() {
  const root = new T.Group();
  root.name = 'Ingeteam INGECON SUN 3Play 110TL M9 (110 kW)';

  // Dimensiones oficiales
  const totalW = 0.936;
  const totalH = 0.678;
  const totalD = 0.365;

  const mainW = 0.740;
  const acBayW = 0.165;
  const frontDoorD = 0.024;
  const mainChassisD = 0.220;
  const rearSinkD = totalD - frontDoorD - mainChassisD; // 0.121 m

  const centerY = totalH / 2 + 0.085;
  const originZ = 0;

  // ----------------------------------------------------
  // 1. CHASIS PRINCIPAL DE POTENCIA (GRIS ANTRACITA)
  // ----------------------------------------------------
  const mainX = -totalW / 2 + mainW / 2;
  mesh(root, new T.BoxGeometry(mainW, totalH, mainChassisD), chassisAnthracite, [mainX, centerY, originZ]);

  // Tejadillo superior protector voladizo
  mesh(root, new T.BoxGeometry(mainW + 0.015, 0.022, mainChassisD + frontDoorD + 0.015), chassisAnthracite, [mainX, centerY + totalH / 2 + 0.011, originZ + frontDoorD / 2]);

  // ----------------------------------------------------
  // 2. TAPA / PUERTA FRONTAL PRINCIPAL (RAL 7035 GRIS CLARO)
  // ----------------------------------------------------
  const doorFrontZ = originZ + mainChassisD / 2 + frontDoorD / 2;
  mesh(root, new T.BoxGeometry(mainW - 0.006, totalH - 0.012, frontDoorD), frontPanelGrey, [mainX, centerY, doorFrontZ]);

  // Junta de estanqueidad negra perimetral
  mesh(root, new T.BoxGeometry(mainW, totalH - 0.006, 0.004), chassisRecess, [mainX, centerY, doorFrontZ - frontDoorD / 2 - 0.002]);

  // 10 TORNILLOS HEXAGONALES PERIMETRALES DE LA FOTO
  const screwZ = doorFrontZ + frontDoorD / 2;
  const topScrewY = centerY + totalH / 2 - 0.038;
  const botScrewY = centerY - totalH / 2 + 0.038;
  const midScrewY = centerY;

  const screwXCoords = [
    mainX - mainW / 2 + 0.035,
    mainX - mainW * 0.18,
    mainX + mainW * 0.18,
    mainX + mainW / 2 - 0.035
  ];

  for (const sx of screwXCoords) {
    addHexBolt(root, [sx, topScrewY, screwZ]);
    addHexBolt(root, [sx, botScrewY, screwZ]);
  }
  addHexBolt(root, [mainX - mainW / 2 + 0.035, midScrewY, screwZ]);
  addHexBolt(root, [mainX + mainW / 2 - 0.035, midScrewY, screwZ]);

  // ----------------------------------------------------
  // 3. PLACA CENTRAL DE ESTADO CON LOGO Y LED VERDE
  // ----------------------------------------------------
  const badgeW = 0.125;
  const badgeH = 0.145;
  const badgeZ = screwZ + 0.003;
  const badgeCenter = [mainX, centerY + 0.02, badgeZ];

  // Placa central de policarbonato negro con bisel
  mesh(root, new T.BoxGeometry(badgeW, badgeH, 0.006), badgeBlack, [badgeCenter[0], badgeCenter[1], badgeCenter[2] + 0.003]);

  // LED de estado verde brillante
  const ledGeo = new T.CylinderGeometry(0.006, 0.006, 0.004, 16);
  ledGeo.rotateX(Math.PI / 2);
  mesh(root, ledGeo, ledGreen, [badgeCenter[0], badgeCenter[1] - 0.026, badgeCenter[2] + 0.007]);

  // Rótulo Ingeteam en la placa
  const logoPlacard = new T.BoxGeometry(0.068, 0.016, 0.002);
  mesh(root, logoPlacard, badgeLogoWhite, [badgeCenter[0], badgeCenter[1] + 0.024, badgeCenter[2] + 0.007]);

  // ----------------------------------------------------
  // 4. COMPARTIMENTO LATERAL DERECHO (CAJA AC)
  // ----------------------------------------------------
  const acX = totalW / 2 - acBayW / 2;
  mesh(root, new T.BoxGeometry(acBayW, totalH, mainChassisD), chassisAnthracite, [acX, centerY, originZ]);

  // Hueco / receso oscuro entre cuerpo principal y caja AC
  const recessGapW = 0.042;
  const recessX = mainX + mainW / 2 + recessGapW / 2;
  mesh(root, new T.BoxGeometry(recessGapW, totalH - 0.02, mainChassisD - 0.04), chassisRecess, [recessX, centerY, originZ - 0.01]);

  // Tapa frontal gris claro de la caja AC
  mesh(root, new T.BoxGeometry(acBayW - 0.01, totalH - 0.012, frontDoorD), frontPanelGrey, [acX, centerY, doorFrontZ]);

  // Tornillos de la tapa AC
  addHexBolt(root, [acX, topScrewY, screwZ]);
  addHexBolt(root, [acX, botScrewY, screwZ]);
  addHexBolt(root, [acX + acBayW / 2 - 0.022, midScrewY, screwZ]);

  // Prensaestopas AC inferior
  const acGlandGeo = new T.CylinderGeometry(0.038, 0.042, 0.055, 18);
  mesh(root, acGlandGeo, glandBlack, [acX, centerY - totalH / 2 - 0.025, originZ]);

  // ----------------------------------------------------
  // 5. CAMPO INFERIOR DE CONEXIONES DC (18 CONECTORES MC4 PARA 9 MPPTs)
  // ----------------------------------------------------
  const bottomPlateY = centerY - totalH / 2;
  const numMC4 = 18;
  const mc4StartX = mainX - mainW / 2 + 0.095;
  const mc4EndX = mainX + mainW / 2 - 0.125;
  const mc4SpacingX = (mc4EndX - mc4StartX) / (numMC4 - 1);

  for (let i = 0; i < numMC4; i++) {
    const cx = mc4StartX + i * mc4SpacingX;
    const cz = originZ + 0.02;

    const baseGeo = new T.CylinderGeometry(0.010, 0.011, 0.035, 12);
    mesh(root, baseGeo, mc4Black, [cx, bottomPlateY - 0.018, cz]);

    const sleeveGeo = new T.CylinderGeometry(0.0075, 0.0085, 0.022, 10);
    mesh(root, sleeveGeo, mc4Black, [cx, bottomPlateY - 0.040, cz]);
  }

  // Módulo de comunicaciones y borne de tierra
  const commX = mainX + mainW / 2 - 0.055;
  mesh(root, new T.BoxGeometry(0.036, 0.042, 0.036), chassisAnthracite, [commX, bottomPlateY - 0.021, originZ + 0.02]);

  const redRingGeo = new T.CylinderGeometry(0.012, 0.012, 0.006, 14);
  mesh(root, redRingGeo, sealRed, [commX, bottomPlateY - 0.045, originZ + 0.02]);

  const groundStudGeo = new T.CylinderGeometry(0.007, 0.008, 0.040, 12);
  mesh(root, groundStudGeo, groundLugBrass, [commX, bottomPlateY - 0.065, originZ + 0.02]);

  // Seccionador rotativo DC
  mesh(root, new T.CylinderGeometry(0.028, 0.028, 0.018, 16), chassisAnthracite, [mainX - mainW / 2 + 0.055, bottomPlateY - 0.009, originZ + 0.02]);
  mesh(root, new T.BoxGeometry(0.042, 0.015, 0.016), mc4Black, [mainX - mainW / 2 + 0.055, bottomPlateY - 0.022, originZ + 0.02]);

  // ----------------------------------------------------
  // 6. PATAS DE APOYO Y TRANSPORTE INFERIORES
  // ----------------------------------------------------
  const footW = 0.055;
  const footH = 0.085;
  const footD = mainChassisD + 0.04;

  for (const footSide of [-1, 1]) {
    const footX = footSide < 0 ? mainX - mainW / 2 + footW / 2 + 0.015 : mainX + mainW / 2 - footW / 2 - 0.015;
    const footY = bottomPlateY - footH / 2;

    mesh(root, new T.BoxGeometry(footW, footH, footD), chassisAnthracite, [footX, footY, originZ]);
    mesh(root, new T.BoxGeometry(footW + 0.01, 0.012, footD + 0.02), chassisAnthracite, [footX, footY - footH / 2 + 0.006, originZ]);
  }

  // ----------------------------------------------------
  // 7. SOPORTE LATERAL IZQUIERDO DE FIJACIÓN MURAL (BRACKET CON COLISOS)
  // ----------------------------------------------------
  const leftBracketX = mainX - mainW / 2 - 0.018;
  const bracketH = totalH * 0.88;
  mesh(root, new T.BoxGeometry(0.022, bracketH, 0.12), chassisAnthracite, [leftBracketX, centerY, originZ - mainChassisD / 2 + 0.06]);

  for (const holeY of [-0.22, 0, 0.22]) {
    const holeGeo = new T.CylinderGeometry(0.009, 0.009, 0.025, 12);
    holeGeo.rotateZ(Math.PI / 2);
    mesh(root, holeGeo, chassisRecess, [leftBracketX, centerY + holeY, originZ - mainChassisD / 2 + 0.06]);
  }

  // ----------------------------------------------------
  // 8. DISIPADOR TÉRMICO TRASERO DE ALUMINIO EXTRUIDO
  // ----------------------------------------------------
  const sinkZ = originZ - mainChassisD / 2 - rearSinkD / 2;
  const numFins = 28;
  const finW = mainW * 0.88;
  const finH = totalH * 0.82;
  const finThickness = 0.004;
  const finSpacing = finW / (numFins - 1);

  mesh(root, new T.BoxGeometry(finW, finH, 0.025), chassisAnthracite, [mainX, centerY, originZ - mainChassisD / 2 - 0.012]);

  const singleFinGeo = new T.BoxGeometry(finThickness, finH, rearSinkD - 0.025);
  for (let f = 0; f < numFins; f++) {
    const fx = mainX - finW / 2 + f * finSpacing;
    mesh(root, singleFinGeo, heatSinkAlu, [fx, centerY, sinkZ - 0.01]);
  }

  mesh(root, new T.BoxGeometry(finW, 0.015, rearSinkD), chassisAnthracite, [mainX, centerY + finH / 2 + 0.01, sinkZ]);

  // ----------------------------------------------------
  // 9. BASE DE PRESENTACIÓN DE ESTUDIO
  // ----------------------------------------------------
  const baseFloorGeo = new T.CylinderGeometry(0.85, 0.90, 0.025, 36);
  const floorMat = mat('Studio Presentation Pedestal', '#1c1f24', 0.15, 0.85);
  const baseFloor = mesh(root, baseFloorGeo, floorMat, [0, -0.012, 0]);
  baseFloor.receiveShadow = true;

  return root;
}

// Generar modelo GLB
const inverter = buildIngeteamInverter();
inverter.userData = {
  name: 'Inversor Fotovoltaico Ingeteam INGECON SUN 3Play 110TL M9 (110 kW)',
  brand: 'Ingeteam',
  model: 'INGECON SUN 3Play 110TL M9',
  powerKw: 110,
  maxAcPowerKva: 123,
  mpptCount: 9,
  dcInputs: 18,
  efficiency: '98.4%',
  protection: 'IP66',
  dimensions: '936 x 678 x 365 mm',
  weightKg: 92,
  author: 'Antigravity 3D Photovoltaic Engineering'
};

const exporter = new GLTFExporter();
const glbBuffer = await exporter.parseAsync(inverter, { binary: true });

await writeFile('extracted-3d-lib/models/inversor-ingeteam-110kw.glb', Buffer.from(glbBuffer));
console.log('✅ inversor-ingeteam-110kw.glb generado con éxito! Tamaño:', Math.round(glbBuffer.byteLength / 1024), 'KB');

