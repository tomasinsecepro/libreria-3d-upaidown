import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { writeFile } from 'node:fs/promises';

// Polyfill FileReader for Node.js
globalThis.FileReader = class {
  readAsArrayBuffer(b) {
    b.arrayBuffer().then(x => { this.result = x; this.onloadend?.(); });
  }
};

function mat(name, color, metalness = 0.8, roughness = 0.3, extra = {}) {
  const m = new T.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  m.name = name;
  return m;
}

// ==========================================
// PALETA EXACTA DE LA FOTOGRAFÍA DEL POZO
// ==========================================
const pipeBlue = mat('Agricultural Pump Pipe Blue', '#1971b8', 0.5, 0.28);
const valveBlue = mat('Gate Valve Ductile Iron Blue', '#15619f', 0.55, 0.3);

const galvaSteel = mat('Galvanized Elbow & Flanges', '#a2abb0', 0.88, 0.25);
const stainlessBolt = mat('Stainless Bolts & Studs', '#c4ccd1', 0.95, 0.15);

const wellCasingRed = mat('Oxidized Steel Well Casing', '#822822', 0.55, 0.65);
const steelPlate = mat('Heavy Steel Wellhead Baseplate', '#50565a', 0.8, 0.4);

const brassValve = mat('Brass Ball Valve', '#c99b38', 0.85, 0.25);
const ventBlack = mat('Air Vent Fitting Black', '#1a1d1e', 0.2, 0.7);
const ventRedCap = mat('Air Vent Safety Cap Red', '#c4281b', 0.2, 0.4);
const handwheelBlack = mat('Valve Operating Handwheel Black', '#141618', 0.3, 0.75);

const cableBlack = mat('Submersible Power Cable', '#111314', 0.05, 0.9);
const gravelGround = mat('Gravel & Pebble Wellhead Surround', '#827869', 0.02, 0.95);
const dirtTrench = mat('Excavated Trench Earth', '#5a4632', 0.02, 0.98);

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

// Crea un codo curvo continuo a 90 grados sin huecos usando TubeGeometry
function createCurvedElbow(parent, arcPoints, pipeRadius, material, segments = 24) {
  const curve = new T.CatmullRomCurve3(arcPoints.map(p => new T.Vector3(...p)));
  const geo = new T.TubeGeometry(curve, segments, pipeRadius, 20, false);
  return mesh(parent, geo, material);
}

// Crea una brida con corona de tornillos circulares
function createFlange(parent, pos, radius = 0.23, thickness = 0.035, pipeR = 0.125) {
  const fGroup = group(parent, 'flange', pos);

  mesh(fGroup, new T.CylinderGeometry(radius, radius, thickness, 24), galvaSteel, [0, 0, 0], [0, 0, Math.PI / 2]);

  const numBolts = 8;
  for (let b = 0; b < numBolts; b++) {
    const a = (b / numBolts) * Math.PI * 2;
    const br = (radius + pipeR) * 0.52;
    const by = Math.cos(a) * br;
    const bz = Math.sin(a) * br;
    mesh(fGroup, new T.CylinderGeometry(0.015, 0.015, thickness * 1.6, 6), stainlessBolt, [0, by, bz], [0, 0, Math.PI / 2]);
  }
  return fGroup;
}

export function buildDeepWellPumpHead() {
  const root = group(null, 'DEEP_WELL_PUMP_HEAD');

  // ==========================================
  // 1. TERRENO DE GRAVA Y ZANJA (SIN CASETA)
  // ==========================================
  mesh(root, new T.BoxGeometry(6.2, 0.3, 3.6), gravelGround, [0.8, -0.15, 0]);
  mesh(root, new T.BoxGeometry(1.6, 0.42, 1.1), dirtTrench, [2.5, -0.22, 0]);

  // ==========================================
  // 2. BOCA DEL POZO / CAMISA DE SONDEO (ROJO ÓXIDO)
  // ==========================================
  const wellX = -1.1;
  const wellZ = 0;
  const casingRadius = 0.42;
  const casingHeight = 0.8;
  const plateY = casingHeight + 0.02;

  mesh(root, new T.CylinderGeometry(casingRadius, casingRadius, casingHeight, 28), wellCasingRed, [wellX, casingHeight / 2, wellZ]);

  // Placa cuadrada de acero
  mesh(root, new T.BoxGeometry(1.05, 0.04, 1.05), steelPlate, [wellX, plateY, wellZ]);

  // Orejeta triangular de izado a la izquierda
  const lugShape = new T.Shape();
  lugShape.moveTo(-0.18, 0);
  lugShape.lineTo(0.18, 0);
  lugShape.lineTo(0.12, 0.22);
  lugShape.lineTo(-0.12, 0.22);
  lugShape.closePath();
  const holePath = new T.Path();
  holePath.absarc(0, 0.15, 0.045, 0, Math.PI * 2, true);
  lugShape.holes.push(holePath);
  const lugGeo = new T.ExtrudeGeometry(lugShape, { depth: 0.025, bevelEnabled: false });
  mesh(root, lugGeo, steelPlate, [wellX - 0.28, plateY + 0.02, wellZ - 0.25]);

  // Tapa circular de registro auxiliar
  mesh(root, new T.CylinderGeometry(0.18, 0.18, 0.02, 16), steelPlate, [wellX + 0.2, plateY + 0.03, wellZ + 0.2]);

  // Mangueras eléctricas de potencia negras
  const cablePath1 = [
    [wellX + 0.15, plateY + 0.02, wellZ - 0.15],
    [wellX + 0.25, plateY + 0.35, wellZ - 0.1],
    [wellX + 0.4, plateY + 0.25, wellZ - 0.05],
    [wellX + 0.55, 0.05, wellZ + 0.1],
  ];
  const curve1 = new T.CatmullRomCurve3(cablePath1.map(p => new T.Vector3(...p)));
  mesh(root, new T.TubeGeometry(curve1, 16, 0.022, 8, false), cableBlack);

  const cablePath2 = [
    [wellX - 0.35, plateY + 0.02, wellZ + 0.1],
    [wellX - 0.5, plateY + 0.38, wellZ + 0.18],
    [wellX - 0.65, 0.05, wellZ + 0.2],
  ];
  const curve2 = new T.CatmullRomCurve3(cablePath2.map(p => new T.Vector3(...p)));
  mesh(root, new T.TubeGeometry(curve2, 12, 0.016, 8, false), cableBlack);

  // ==========================================
  // 3. CODO DE SALIDA GALVANIZADO A 90º (100% UNIDO Y CONTINUO)
  // ==========================================
  const pipeRadius = 0.125;
  const elbowRadius = 0.48;
  const pipeY = plateY + 0.02 + elbowRadius; // Altura del eje horizontal = 1.32m

  // Brida base atornillada a la placa del pozo
  mesh(root, new T.CylinderGeometry(0.24, 0.24, 0.04, 24), galvaSteel, [wellX, plateY + 0.04, wellZ]);

  // Curva continua a 90 grados: sube verticalmente desde la placa y gira a la derecha (+X)
  const leftElbowPoints = [];
  const numSteps = 16;
  for (let s = 0; s <= numSteps; s++) {
    const a = (s / numSteps) * (Math.PI / 2); // 0 a 90 grados
    // A 0 rad: X = wellX, Y = plateY + 0.04 (sale vertical)
    // A 90 rad: X = wellX + elbowRadius, Y = pipeY (sale horizontal)
    const ex = wellX + elbowRadius - Math.cos(a) * elbowRadius;
    const ey = plateY + 0.04 + Math.sin(a) * elbowRadius;
    leftElbowPoints.push([ex, ey, wellZ]);
  }
  createCurvedElbow(root, leftElbowPoints, pipeRadius, galvaSteel, 20);

  // ==========================================
  // 4. VENTOSA TRIFUNCIONAL DE AIRE (TORRETA VERTICAL)
  // ==========================================
  const ventX = wellX;
  // Tubo vertical soldado directamente en la curva del codo
  mesh(root, new T.CylinderGeometry(0.045, 0.045, 0.48, 14), galvaSteel, [ventX, pipeY + 0.05, wellZ]);
  mesh(root, new T.CylinderGeometry(0.09, 0.09, 0.03, 14), galvaSteel, [ventX, pipeY + 0.28, wellZ]);

  // Válvula de bola de latón con maneta dorada
  mesh(root, new T.CylinderGeometry(0.035, 0.035, 0.12, 10), brassValve, [ventX, pipeY + 0.36, wellZ]);
  mesh(root, new T.BoxGeometry(0.025, 0.02, 0.12), brassValve, [ventX, pipeY + 0.36, wellZ + 0.06]);

  // Cuerpo de la ventosa negra y capuchón rojo
  mesh(root, new T.CylinderGeometry(0.042, 0.042, 0.18, 12), ventBlack, [ventX, pipeY + 0.5, wellZ]);
  mesh(root, new T.CylinderGeometry(0.052, 0.038, 0.08, 12), ventRedCap, [ventX, pipeY + 0.62, wellZ]);

  // Manguera negra flexible de purga
  const ventHose = [
    [ventX, pipeY + 0.58, wellZ],
    [ventX - 0.08, pipeY + 0.55, wellZ - 0.06],
    [ventX - 0.1, pipeY + 0.25, wellZ - 0.08],
    [ventX - 0.08, pipeY - 0.15, wellZ - 0.06],
  ];
  const hoseCurve = new T.CatmullRomCurve3(ventHose.map(p => new T.Vector3(...p)));
  mesh(root, new T.TubeGeometry(hoseCurve, 14, 0.014, 8, false), cableBlack);

  // ==========================================
  // 5. TRAMO RECTO HORIZONTAL AZUL CON BRIDAS
  // ==========================================
  const startX = wellX + elbowRadius; // Final exacto del codo izquierdo

  // Doble brida de conexión galvanizada
  createFlange(root, [startX, pipeY, wellZ]);
  createFlange(root, [startX + 0.04, pipeY, wellZ]);

  // Tubo azul recto
  const pipe1Length = 0.82;
  const p1Center = startX + 0.04 + pipe1Length / 2;
  mesh(root, new T.CylinderGeometry(pipeRadius, pipeRadius, pipe1Length, 24), pipeBlue, [p1Center, pipeY, wellZ], [0, 0, Math.PI / 2]);

  // Brida a válvula de retención
  const checkStartX = startX + 0.04 + pipe1Length;
  createFlange(root, [checkStartX, pipeY, wellZ]);

  // ==========================================
  // 6. VÁLVULA DE RETENCIÓN / CLAPETA CON TAPA SUPERIOR
  // ==========================================
  const checkLength = 0.52;
  const checkCenterX = checkStartX + 0.04 + checkLength / 2;

  mesh(root, new T.CylinderGeometry(pipeRadius * 1.15, pipeRadius * 1.15, checkLength, 20), pipeBlue, [checkCenterX, pipeY, wellZ], [0, 0, Math.PI / 2]);
  mesh(root, new T.BoxGeometry(0.32, 0.04, 0.24), valveBlue, [checkCenterX, pipeY + pipeRadius * 1.18, wellZ]);
  for (const bx of [-0.11, 0.11]) {
    for (const bz of [-0.08, 0.08]) {
      mesh(root, new T.CylinderGeometry(0.012, 0.012, 0.03, 6), stainlessBolt, [checkCenterX + bx, pipeY + pipeRadius * 1.2 + 0.015, wellZ + bz]);
    }
  }

  // Brida de salida
  const checkEndX = checkStartX + 0.04 + checkLength;
  createFlange(root, [checkEndX, pipeY, wellZ]);

  // ==========================================
  // 7. VÁLVULA DE COMPUERTA CON VOLANTE NEGRO
  // ==========================================
  const gateX = checkEndX + 0.04 + 0.16;
  createFlange(root, [gateX - 0.12, pipeY, wellZ]);

  mesh(root, new T.BoxGeometry(0.24, 0.42, 0.32), valveBlue, [gateX, pipeY + 0.06, wellZ]);
  mesh(root, new T.CylinderGeometry(0.08, 0.1, 0.28, 14), valveBlue, [gateX, pipeY + 0.36, wellZ]);
  mesh(root, new T.CylinderGeometry(0.024, 0.024, 0.22, 10), stainlessBolt, [gateX, pipeY + 0.58, wellZ]);

  // Volante negro
  const wheelY = pipeY + 0.69;
  mesh(root, new T.TorusGeometry(0.18, 0.024, 8, 24), handwheelBlack, [gateX, wheelY, wellZ], [Math.PI / 2, 0, 0]);
  mesh(root, new T.BoxGeometry(0.34, 0.02, 0.03), handwheelBlack, [gateX, wheelY, wellZ]);
  mesh(root, new T.BoxGeometry(0.03, 0.02, 0.34), handwheelBlack, [gateX, wheelY, wellZ]);
  mesh(root, new T.CylinderGeometry(0.04, 0.04, 0.04, 10), handwheelBlack, [gateX, wheelY, wellZ]);

  // ==========================================
  // 8. CARRETE DE DESMONTAJE TELESCÓPICO (CON ESPÁRRAGOS)
  // ==========================================
  const spoolStartX = gateX + 0.12;
  createFlange(root, [spoolStartX, pipeY, wellZ]);

  const spoolLength = 0.26;
  const spoolCenterX = spoolStartX + 0.04 + spoolLength / 2;
  mesh(root, new T.CylinderGeometry(pipeRadius * 1.05, pipeRadius * 1.05, spoolLength, 20), pipeBlue, [spoolCenterX, pipeY, wellZ], [0, 0, Math.PI / 2]);

  const spoolEndX = spoolStartX + 0.04 + spoolLength;
  createFlange(root, [spoolEndX, pipeY, wellZ]);

  // 6 espárragos roscados pasantes de acero
  for (let b = 0; b < 6; b++) {
    const a = (b / 6) * Math.PI * 2;
    const by = Math.cos(a) * 0.19;
    const bz = Math.sin(a) * 0.19;
    mesh(root, new T.CylinderGeometry(0.009, 0.009, spoolLength + 0.1, 6), stainlessBolt, [spoolCenterX, pipeY + by, wellZ + bz], [0, 0, Math.PI / 2]);
  }

  // ==========================================
  // 9. CODO DESCENDENTE AZUL A 90º (100% UNIDO Y CONTINUO)
  // ==========================================
  // Tramo recto corto que une el carrete de desmontaje con el codo
  const shortPipeLength = 0.28;
  const shortPipeCenterX = spoolEndX + 0.04 + shortPipeLength / 2;
  mesh(root, new T.CylinderGeometry(pipeRadius, pipeRadius, shortPipeLength, 24), pipeBlue, [shortPipeCenterX, pipeY, wellZ], [0, 0, Math.PI / 2]);

  const elbowStartX = spoolEndX + 0.04 + shortPipeLength;
  const downBendRadius = 0.48;

  // Curva continua a 90 grados hacia abajo: empieza horizontal y gira hacia el suelo
  const rightElbowPoints = [];
  for (let s = 0; s <= numSteps; s++) {
    const a = (s / numSteps) * (Math.PI / 2); // 0 a 90 grados
    // A 0 rad: X = elbowStartX, Y = pipeY (horizontal)
    // A 90 rad: X = elbowStartX + downBendRadius, Y = pipeY - downBendRadius (vertical apuntando al suelo)
    const ex = elbowStartX + Math.sin(a) * downBendRadius;
    const ey = pipeY - downBendRadius + Math.cos(a) * downBendRadius;
    rightElbowPoints.push([ex, ey, wellZ]);
  }
  createCurvedElbow(root, rightElbowPoints, pipeRadius, pipeBlue, 20);

  // Tubo vertical recto azul que continúa exactamente desde el codo y se entierra en la zanja
  const plungeX = elbowStartX + downBendRadius;
  const plungeTopY = pipeY - downBendRadius;
  const plungeBottomY = -0.3; // bien enterrado en la zanja
  const plungeHeight = plungeTopY - plungeBottomY;
  const plungeCenterY = (plungeTopY + plungeBottomY) / 2;

  mesh(root, new T.CylinderGeometry(pipeRadius, pipeRadius, plungeHeight, 24), pipeBlue, [plungeX, plungeCenterY, wellZ]);

  return root;
}

// Compilar y guardar GLB
const wellPump = buildDeepWellPumpHead();
wellPump.userData = {
  name: 'Bomba de Pozo Agrícola 100% Continua (Sin Caseta, Codos Unidos)',
  author: 'Antigravity 3D Engineering Generator',
};

const exporter = new GLTFExporter();
const glbBuffer = await exporter.parseAsync(wellPump, { binary: true });

await writeFile('extracted-3d-lib/models/bomba-pozo.glb', Buffer.from(glbBuffer));
console.log('✅ bomba-pozo.glb generado con éxito (Sin caseta, codos unidos y continuos)! Tamaño:', Math.round(glbBuffer.byteLength / 1024), 'KB');
