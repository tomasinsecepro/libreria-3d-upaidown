import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { writeFile } from 'node:fs/promises';

// Polyfill FileReader for Node.js
globalThis.FileReader = class {
  readAsArrayBuffer(b) {
    b.arrayBuffer().then(x => { this.result = x; this.onloadend?.(); });
  }
};

function mat(name, color, metalness = 0.5, roughness = 0.3, extra = {}) {
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
// PALETA DE MATERIALES SOLAR FOTOVOLTAICO PBR
// ==========================================
const siliconBlue = mat('Photovoltaic Silicon Wafer Blue', '#13284f', 0.15, 0.12);
const busbarSilver = mat('Photovoltaic Busbar Grid Silver', '#d4dde6', 0.85, 0.25);
const aluFrame = mat('Anodized Aluminum Module Frame', '#b6c0c9', 0.88, 0.22);
const clampMat = mat('Mounting Middle & End Clamps', '#2c3136', 0.65, 0.35);

const galvaSteel = mat('Hot-Dip Galvanized Steel Structure', '#9aa4ad', 0.82, 0.32);
const galvaJoints = mat('Galvanized Braces and Baseplates', '#838e97', 0.85, 0.36);

const inverterHousing = mat('String Inverter Enclosure White', '#e4e8ec', 0.2, 0.3);
const inverterFins = mat('Inverter Aluminum Heat Sink', '#4a5056', 0.8, 0.35);
const inverterScreen = mat('Inverter Status Display Dark', '#0a1622', 0.1, 0.05);

const groundGrass = mat('Agricultural Solar Meadow Grass', '#486334', 0.02, 0.95);
const gravelPath = mat('Gravel Service Track', '#857c6d', 0.02, 0.96);

export function buildSolarFarm() {
  const root = new T.Group();
  root.name = 'Parque Solar Fotovoltaico (4 Mesas × 100 Placas = 400 Placas)';

  // ==========================================
  // ESPECIFICACIONES EXACTAS DE CADA MESA:
  // - 2 filas a lo largo de la pendiente (1 placa abajo, 1 placa arriba)
  // - 50 placas abajo + 50 placas arriba = 100 placas por mesa
  // - 4 mesas en paralelo con sus patas y correas de acero galvanizado
  // - Módulos colocados perfectamente PLANOS ENCIMA de la estructura
  // ==========================================
  const numTables = 4;
  const panelsPerRow = 50;
  const numRows = 2; // 2 filas (abajo y arriba)
  const tiltDeg = 28;
  const tiltRad = (tiltDeg * Math.PI) / 180;
  const sinT = Math.sin(tiltRad);
  const cosT = Math.cos(tiltRad);

  // Dimensiones estándar de módulo fotovoltaico de 550W / 600W:
  const modWidth = 1.04;  // Ancho (eje X)
  const modLength = 2.08; // Largo a lo largo de la pendiente (eje slope)
  const modDepth = 0.035; // Grosor marco aluminio
  const gapX = 0.02;      // Separación entre placas contiguas (grapa intermedia)
  const pitchX = modWidth + gapX; // 1.06m por columna
  const totalLengthX = panelsPerRow * pitchX; // 53.0 metros de largo

  const gapSlope = 0.03;  // Separación longitudinal entre fila superior e inferior
  const lowerEdgeH = 0.85; // Altura libre del borde inferior respecto al suelo

  // Separación entre mesas paralelas (7.5 metros de pitch para evitar sombras)
  const tablePitchZ = 7.5;

  // Espesores estructurales para apoyar las placas exactamente ENCIMA:
  const purlinHeight = 0.08; // Altura de las correas longitudinales
  const purlinWidth = 0.06;  // Anchura de las correas
  const rafterDepth = 0.12;  // Altura del dintel/viga inclinada
  const rafterWidth = 0.08;  // Anchura del dintel

  // -------------------------------------------------------------------------
  // MATRIZ DE ORIENTACIÓN COMÚN (Garantiza que placas y vigas compartan el 100%
  // del mismo plano inclinado, eliminando cualquier desalineación o cruce):
  // Local X: Ancho de la mesa [1, 0, 0]
  // Local Y: Pendiente ascendente [0, sinT, cosT] (slope)
  // Local Z: Normal perpendicular hacia el cielo/frente [0, cosT, -sinT] (normal)
  // -------------------------------------------------------------------------
  function createSlopeMatrix(worldX, worldBaseY, worldBaseZ, slopeS, normalN) {
    // Coordenada del punto en el espacio del mundo:
    const posX = worldX;
    const posY = worldBaseY + slopeS * sinT + normalN * cosT;
    const posZ = worldBaseZ + slopeS * cosT - normalN * sinT;

    return new T.Matrix4().set(
      1, 0,     0,      posX,
      0, sinT,  cosT,   posY,
      0, cosT, -sinT,   posZ,
      0, 0,     0,      1
    );
  }

  // =========================================================================
  // GEOMETRÍAS BASE DE 1 MÓDULO SOLAR EN COORDENADAS LOCALES (X, Y=Slope, Z=Normal)
  // La placa se modela apoyada en Z ∈ [0, modDepth], es decir, ENCIMA de Z=0.
  // =========================================================================

  // 1. Marco exterior de aluminio perimetral
  const frameParts = [];
  const fw = 0.025; // ancho perfil
  // Borde superior e inferior
  const topBar = new T.BoxGeometry(modWidth, fw, modDepth);
  topBar.translate(0, modLength / 2 - fw / 2, modDepth / 2);
  frameParts.push(topBar);

  const botBar = new T.BoxGeometry(modWidth, fw, modDepth);
  botBar.translate(0, -modLength / 2 + fw / 2, modDepth / 2);
  frameParts.push(botBar);

  // Bordes laterales
  const sideBarL = new T.BoxGeometry(fw, modLength - fw * 2, modDepth);
  sideBarL.translate(-modWidth / 2 + fw / 2, 0, modDepth / 2);
  frameParts.push(sideBarL);

  const sideBarR = new T.BoxGeometry(fw, modLength - fw * 2, modDepth);
  sideBarR.translate(modWidth / 2 - fw / 2, 0, modDepth / 2);
  frameParts.push(sideBarR);

  const singlePanelFrameGeo = BufferGeometryUtils.mergeGeometries(frameParts);

  // 2. Oblea de silicio monocristalino (panel azul oscuro)
  const singlePanelSiliconGeo = new T.BoxGeometry(modWidth - fw * 1.8, modLength - fw * 1.8, modDepth * 0.4);
  singlePanelSiliconGeo.translate(0, 0, modDepth * 0.45);

  // 3. Rejilla de busbars solares (líneas plateadas sobre el panel)
  const busbarLines = [];
  const numCols = 6;
  const numCellsY = 12;
  const cellW = (modWidth - fw * 2.2) / numCols;
  const cellH = (modLength - fw * 2.2) / numCellsY;

  for (let c = 1; c < numCols; c++) {
    const lx = -modWidth / 2 + fw * 1.1 + c * cellW;
    const line = new T.BoxGeometry(0.003, modLength - fw * 2.2, 0.002);
    line.translate(lx, 0, modDepth * 0.68);
    busbarLines.push(line);
  }
  for (let r = 1; r < numCellsY; r++) {
    const ly = -modLength / 2 + fw * 1.1 + r * cellH;
    const line = new T.BoxGeometry(modWidth - fw * 2.2, 0.002, 0.002);
    line.translate(0, ly, modDepth * 0.68);
    busbarLines.push(line);
  }
  const singlePanelGridGeo = BufferGeometryUtils.mergeGeometries(busbarLines);

  // Grapa de fijación (clamp)
  const singleClampGeo = new T.BoxGeometry(0.03, 0.05, 0.015);

  // Acumuladores de geometrías
  const allFramesGeos = [];
  const allSiliconsGeos = [];
  const allGridsGeos = [];
  const allClampsGeos = [];
  const allSteelGeos = [];
  const allInvertersGeos = [];

  // =========================================================================
  // BUCLE DE CONSTRUCCIÓN: 4 MESAS PARALELAS
  // =========================================================================
  const startX = -totalLengthX / 2 + pitchX / 2;

  for (let tableIdx = 0; tableIdx < numTables; tableIdx++) {
    // Posición Z central de cada mesa en el terreno
    const tableBaseZ = (tableIdx - (numTables - 1) / 2) * tablePitchZ;

    // ----------------------------------------------------
    // A) MÓDULOS FOTOVOLTAICOS (50 placas abajo + 50 placas arriba = 100 por mesa)
    // Se colocan en normalN = 0 (descansando perfectamente sobre las correas)
    // ----------------------------------------------------
    for (let col = 0; col < panelsPerRow; col++) {
      const posX = startX + col * pitchX;

      for (let row = 0; row < numRows; row++) {
        // Distancia a lo largo de la pendiente (slope):
        // row 0: Fila inferior (abajo) -> de s = 0 a s = modLength
        // row 1: Fila superior (arriba) -> de s = modLength + gapSlope a s = 2*modLength + gapSlope
        const slopeS = (row === 0)
          ? modLength / 2
          : modLength + gapSlope + modLength / 2;

        // Matriz de colocación para colocar la placa plana ENCIMA de la estructura
        const panelMat = createSlopeMatrix(posX, lowerEdgeH, tableBaseZ, slopeS, 0);

        allFramesGeos.push(singlePanelFrameGeo.clone().applyMatrix4(panelMat));
        allSiliconsGeos.push(singlePanelSiliconGeo.clone().applyMatrix4(panelMat));
        allGridsGeos.push(singlePanelGridGeo.clone().applyMatrix4(panelMat));

        // Grapas de fijación fijadas en el plano superior
        for (const cx of [-modWidth / 2, modWidth / 2]) {
          for (const cy of [-modLength * 0.32, modLength * 0.32]) {
            const clampMat4 = createSlopeMatrix(posX + cx, lowerEdgeH, tableBaseZ, slopeS + cy, modDepth);
            allClampsGeos.push(singleClampGeo.clone().applyMatrix4(clampMat4));
          }
        }
      }
    }

    // ----------------------------------------------------
    // B) ESTRUCTURA METÁLICA DE SOPORTE (PATAS, VIGAS Y CORREAS)
    // ----------------------------------------------------
    // 1. Correas longitudinales de apoyo (Purlins de 53m)
    // Están situadas inmediatamente DEBAJO de las placas (normalN = -purlinHeight / 2)
    // 4 correas por mesa (2 bajo la fila inferior, 2 bajo la fila superior)
    const purlinSlopePositions = [
      modLength * 0.25,
      modLength * 0.75,
      modLength + gapSlope + modLength * 0.25,
      modLength + gapSlope + modLength * 0.75,
    ];

    for (const pS of purlinSlopePositions) {
      const purlinMat = createSlopeMatrix(0, lowerEdgeH, tableBaseZ, pS, -purlinHeight / 2);
      const purlinGeo = new T.BoxGeometry(totalLengthX + 0.3, purlinWidth, purlinHeight);
      allSteelGeos.push(purlinGeo.applyMatrix4(purlinMat));
    }

    // 2. Patas (bípodes) y vigas inclinadas (dinteles) cada ~4.4m (13 pórticos por mesa)
    const numLegPosts = 13;
    const postSpacingX = totalLengthX / (numLegPosts - 1);

    // Posiciones slope de la pata delantera y pata trasera:
    const sFront = 0.65;
    const sRear = 3.55;
    const totalSlopeLength = numRows * modLength + gapSlope;

    for (let p = 0; p < numLegPosts; p++) {
      const legX = -totalLengthX / 2 + p * postSpacingX;

      // Viga inclinada (Rafter / Dintel):
      // Va inmediatamente debajo de las correas: normalN = -purlinHeight - rafterDepth / 2
      const rafterMidS = totalSlopeLength / 2;
      const rafterLength = totalSlopeLength + 0.15;
      const rafterMat = createSlopeMatrix(legX, lowerEdgeH, tableBaseZ, rafterMidS, -purlinHeight - rafterDepth / 2);
      const rafterGeo = new T.BoxGeometry(rafterWidth, rafterLength, rafterDepth);
      allSteelGeos.push(rafterGeo.applyMatrix4(rafterMat));

      // Pata delantera vertical (corta):
      // Su extremo superior conecta directamente con la parte inferior del dintel
      const underRafterN = -purlinHeight - rafterDepth;
      const frontTopY = lowerEdgeH + sFront * sinT + underRafterN * cosT;
      const frontTopZ = tableBaseZ + sFront * cosT - underRafterN * sinT;

      const frontLegH = frontTopY;
      const frontLegGeo = new T.CylinderGeometry(0.045, 0.045, frontLegH, 12);
      frontLegGeo.translate(legX, frontLegH / 2, frontTopZ);
      allSteelGeos.push(frontLegGeo);

      // Placa base / zapata delantera anclada al suelo
      const fPlate = new T.BoxGeometry(0.24, 0.04, 0.24);
      fPlate.translate(legX, 0.02, frontTopZ);
      allSteelGeos.push(fPlate);

      // Pata trasera vertical (alta):
      const rearTopY = lowerEdgeH + sRear * sinT + underRafterN * cosT;
      const rearTopZ = tableBaseZ + sRear * cosT - underRafterN * sinT;

      const rearLegH = rearTopY;
      const rearLegGeo = new T.CylinderGeometry(0.045, 0.045, rearLegH, 12);
      rearLegGeo.translate(legX, rearLegH / 2, rearTopZ);
      allSteelGeos.push(rearLegGeo);

      // Placa base / zapata trasera anclada al suelo
      const rPlate = new T.BoxGeometry(0.24, 0.04, 0.24);
      rPlate.translate(legX, 0.02, rearTopZ);
      allSteelGeos.push(rPlate);

      // Tirante diagonal de arriostramiento contra viento:
      // Conecta la pata trasera con el punto medio de la viga
      const strutLength = Math.hypot(rearTopY * 0.7, Math.abs(rearTopZ - frontTopZ));
      const strutGeo = new T.CylinderGeometry(0.028, 0.028, strutLength, 10);
      const strutAngle = Math.atan2(Math.abs(rearTopZ - frontTopZ), rearTopY * 0.7);
      strutGeo.rotateX(strutAngle);
      strutGeo.translate(legX, rearTopY * 0.45, (frontTopZ + rearTopZ) / 2);
      allSteelGeos.push(strutGeo);
    }

    // ----------------------------------------------------
    // C) INVERSOR DE STRING (Caja técnica en la parte trasera de cada mesa)
    // Montado sobre la estructura trasera
    // ----------------------------------------------------
    const invX = totalLengthX / 2 - 3.2;
    const invS = 3.5;
    const invN = -purlinHeight - rafterDepth - 0.22;
    const invY = lowerEdgeH + invS * sinT + invN * cosT;
    const invZ = tableBaseZ + invS * cosT - invN * sinT;

    const invBody = new T.BoxGeometry(0.72, 0.88, 0.28);
    invBody.translate(invX, invY, invZ);
    allInvertersGeos.push(invBody);

    const invHeatSink = new T.BoxGeometry(0.64, 0.80, 0.06);
    invHeatSink.translate(invX, invY, invZ + 0.17);
    allSteelGeos.push(invHeatSink);

    const invDisp = new T.BoxGeometry(0.25, 0.15, 0.02);
    invDisp.translate(invX, invY + 0.16, invZ - 0.145);
    allInvertersGeos.push(invDisp);

    const conduitGeo = new T.CylinderGeometry(0.028, 0.028, invY, 12);
    conduitGeo.translate(invX - 0.22, invY / 2, invZ);
    allSteelGeos.push(conduitGeo);
  }

  // =========================================================================
  // UNIFICACIÓN EFICIENTE DE MALLAS
  // =========================================================================
  console.log('Compilando parque solar con placas apoyadas perfectamente encima de la estructura...');

  const mergedFrames = BufferGeometryUtils.mergeGeometries(allFramesGeos);
  const meshFrames = new T.Mesh(mergedFrames, aluFrame);
  meshFrames.castShadow = true;
  meshFrames.receiveShadow = true;
  root.add(meshFrames);

  const mergedSilicon = BufferGeometryUtils.mergeGeometries(allSiliconsGeos);
  const meshSilicon = new T.Mesh(mergedSilicon, siliconBlue);
  meshSilicon.castShadow = true;
  meshSilicon.receiveShadow = true;
  root.add(meshSilicon);

  const mergedGrids = BufferGeometryUtils.mergeGeometries(allGridsGeos);
  const meshGrids = new T.Mesh(mergedGrids, busbarSilver);
  root.add(meshGrids);

  const mergedClamps = BufferGeometryUtils.mergeGeometries(allClampsGeos);
  const meshClamps = new T.Mesh(mergedClamps, clampMat);
  meshClamps.castShadow = true;
  root.add(meshClamps);

  const mergedSteel = BufferGeometryUtils.mergeGeometries(allSteelGeos);
  const meshSteel = new T.Mesh(mergedSteel, galvaSteel);
  meshSteel.castShadow = true;
  meshSteel.receiveShadow = true;
  root.add(meshSteel);

  const mergedInverters = BufferGeometryUtils.mergeGeometries(allInvertersGeos);
  const meshInverters = new T.Mesh(mergedInverters, inverterHousing);
  meshInverters.castShadow = true;
  meshInverters.receiveShadow = true;
  root.add(meshInverters);

  // =========================================================================
  // TERRENO AGRÍCOLA
  // =========================================================================
  const groundW = totalLengthX + 16.0;
  const groundD = numTables * tablePitchZ + 18.0;

  const meadowGeo = new T.PlaneGeometry(groundW, groundD);
  meadowGeo.rotateX(-Math.PI / 2);
  const meadowMesh = new T.Mesh(meadowGeo, groundGrass);
  meadowMesh.position.set(0, -0.01, 0);
  meadowMesh.receiveShadow = true;
  root.add(meadowMesh);

  const roadGeo = new T.PlaneGeometry(groundW, 4.5);
  roadGeo.rotateX(-Math.PI / 2);
  const roadMesh = new T.Mesh(roadGeo, gravelPath);
  roadMesh.position.set(0, 0.005, (numTables * tablePitchZ) / 2 + 5.0);
  roadMesh.receiveShadow = true;
  root.add(roadMesh);

  return root;
}

// Generar modelo GLB
const solarPark = buildSolarFarm();
solarPark.userData = {
  name: 'Parque Solar Fotovoltaico de 4 Mesas (400 Placas Encima de Estructura)',
  tablesCount: 4,
  panelsPerTable: 100,
  layout: '2 filas por mesa (50 arriba + 50 abajo)',
  totalPanels: 400,
  installedPowerKwp: 220,
  tiltAngleDeg: 28,
  author: 'Antigravity 3D Photovoltaic Engineering'
};

const exporter = new GLTFExporter();
const glbBuffer = await exporter.parseAsync(solarPark, { binary: true });

await writeFile('extracted-3d-lib/models/placas-solares.glb', Buffer.from(glbBuffer));
console.log('✅ placas-solares.glb generado con éxito (4 mesas × 100 placas con placas planas encima de la estructura)! Tamaño:', Math.round(glbBuffer.byteLength / 1024), 'KB');
