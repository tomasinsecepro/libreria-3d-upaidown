import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { writeFile } from 'node:fs/promises';

// Node polyfill for FileReader
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

// Colores clásicos Tractor Ebro (Azul Ebro, Llantas Crema, Chasis Grafito)
const ebroBlue = mat('Ebro Blue', '#0d5ba6', 0.45, 0.32);
const ebroBlueDark = mat('Ebro Blue Dark', '#093f75', 0.5, 0.35);
const creamRim = mat('Cream Wheel Rims', '#ede8da', 0.25, 0.4);
const tireRubber = mat('Tire Rubber', '#181b19', 0.05, 0.88);
const darkChassis = mat('Dark Cast Iron Chassis', '#222527', 0.8, 0.4);
const chrome = mat('Polished Steel & Chrome', '#c0c8cc', 0.95, 0.15);
const exhaustSteel = mat('Matte Exhaust Steel', '#2b2d2f', 0.6, 0.5);
const glass = mat('Cab Glass', '#234455', 0.9, 0.1, { transparent: true, opacity: 0.55 });
const plowSteel = mat('Plow Steel Blades', '#85929e', 0.85, 0.25);
const redTaillight = mat('Taillights', '#d11a1a', 0.2, 0.3, { emissive: new T.Color('#aa1010'), emissiveIntensity: 0.6 });
const amberLight = mat('Amber Indicator', '#ff9900', 0.2, 0.3, { emissive: new T.Color('#ff8800'), emissiveIntensity: 0.7 });
const headlight = mat('Headlight Glass', '#ffffff', 0.1, 0.1, { emissive: new T.Color('#fff2cc'), emissiveIntensity: 0.8 });

function group(parent, name, pos = [0, 0, 0]) {
  const g = new T.Group();
  g.name = name;
  g.position.set(...pos);
  if (parent) parent.add(g);
  return g;
}

function mesh(parent, geo, material, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const m = new T.Mesh(geo, material);
  m.position.set(...pos);
  m.rotation.set(...rot);
  if (parent) parent.add(m);
  return m;
}

function box(parent, size, pos, material, radius = 0.02) {
  const geo = radius > 0.005 ? new RoundedBoxGeometry(...size, 3, radius) : new T.BoxGeometry(...size);
  return mesh(parent, geo, material, pos);
}

function cyl(parent, r, h, pos, material, rot = [0, 0, 0], segs = 24) {
  const geo = new T.CylinderGeometry(r, r, h, segs);
  return mesh(parent, geo, material, pos, rot);
}

export function buildTractorEbro() {
  const root = group(null, 'TRACTOR_EBRO_ROOT');

  // ==========================================
  // 1. CHASIS CENTRAL Y TRANSMISIÓN
  // ==========================================
  const chassis = group(root, 'chassis', [0, 0.6, 0]);
  box(chassis, [0.85, 0.55, 2.8], [0, 0, 0], darkChassis, 0.04);
  box(chassis, [0.95, 0.6, 1.2], [0, 0.05, 0.8], darkChassis, 0.05); // Bloque trasero diferencial

  // ==========================================
  // 2. CAPÓ MOTOR Y FRONTAL ESTILO EBRO
  // ==========================================
  const hood = group(root, 'hood', [0, 1.15, -0.6]);
  // Capó principal alargado
  box(hood, [0.92, 0.65, 1.95], [0, 0, 0], ebroBlue, 0.05);
  // Relieve superior del capó
  box(hood, [0.65, 0.08, 1.85], [0, 0.35, 0], ebroBlueDark, 0.03);

  // Parrilla frontal (radiador)
  const grill = group(hood, 'front_grill', [0, 0, -1.0]);
  box(grill, [0.84, 0.58, 0.06], [0, 0, 0], darkChassis, 0.02);
  // Franjas horizontales de la parrilla
  for (let i = -4; i <= 4; i++) {
    box(grill, [0.72, 0.02, 0.04], [0, i * 0.055, 0.02], chrome, 0.005);
  }

  // Emblema EBRO frontal
  box(grill, [0.38, 0.09, 0.05], [0, 0.16, 0.03], creamRim, 0.01);
  box(grill, [0.34, 0.06, 0.055], [0, 0.16, 0.03], ebroBlueDark, 0.005);

  // Faros delanteros dobles empotrados
  for (const side of [-1, 1]) {
    cyl(grill, 0.1, 0.06, [side * 0.3, 0.02, 0.02], chrome, [Math.PI / 2, 0, 0]);
    cyl(grill, 0.08, 0.07, [side * 0.3, 0.02, 0.03], headlight, [Math.PI / 2, 0, 0]);
  }

  // Tubo de escape vertical vertical icónico con sombrero
  const exhaust = group(hood, 'exhaust', [-0.36, 0.32, -0.4]);
  cyl(exhaust, 0.05, 1.35, [0, 0.67, 0], exhaustSteel, [0, 0, 0], 16);
  cyl(exhaust, 0.07, 0.35, [0, 0.8, 0], exhaustSteel, [0, 0, 0], 16); // silencioso
  cyl(exhaust, 0.055, 0.08, [0, 1.35, 0], chrome, [0, 0, 0], 16); // sombrero

  // Filtro de aire ciclónico (estilo hongo)
  const airFilter = group(hood, 'air_filter', [0.36, 0.32, -0.6]);
  cyl(airFilter, 0.04, 0.85, [0, 0.42, 0], darkChassis, [0, 0, 0], 14);
  cyl(airFilter, 0.11, 0.18, [0, 0.85, 0], darkChassis, [0, 0, 0], 18); // cubeta hongo
  cyl(airFilter, 0.12, 0.04, [0, 0.94, 0], creamRim, [0, 0, 0], 18);

  // ==========================================
  // 3. PUESTO DE CONDUCCIÓN Y CABINA CON ARCO
  // ==========================================
  const cab = group(root, 'cabin', [0, 1.1, 0.7]);
  // Suelo de la plataforma
  box(cab, [1.4, 0.1, 1.3], [0, -0.15, 0], darkChassis, 0.02);

  // Asiento de tractor con suspensión
  const seat = group(cab, 'seat', [0, 0.15, 0.2]);
  cyl(seat, 0.05, 0.3, [0, 0, 0], chrome);
  box(seat, [0.55, 0.08, 0.5], [0, 0.18, 0], darkChassis, 0.03); // cojín
  box(seat, [0.55, 0.45, 0.08], [0, 0.4, 0.22], darkChassis, 0.03); // respaldo

  // Volante y columna de dirección
  const steering = group(cab, 'steering', [0, 0.25, -0.35]);
  cyl(steering, 0.035, 0.55, [0, 0.22, 0], darkChassis, [-0.4, 0, 0]);
  mesh(steering, new T.TorusGeometry(0.2, 0.024, 8, 24), darkChassis, [0, 0.46, -0.1], [1.17, 0, 0]);
  cyl(steering, 0.04, 0.03, [0, 0.46, -0.1], chrome, [1.17, 0, 0]);

  // Arco de seguridad antivuelco (ROPS) con techo
  const arch = group(cab, 'safety_arch', [0, 0, 0]);
  // Pilares verticales
  for (const side of [-1, 1]) {
    for (const z of [-0.45, 0.45]) {
      box(arch, [0.08, 1.55, 0.08], [side * 0.72, 0.7, z], ebroBlueDark, 0.015);
    }
    // Travesaño lateral
    box(arch, [0.08, 0.08, 0.98], [side * 0.72, 1.48, 0], ebroBlueDark, 0.015);
  }
  // Techo blanco / crema característico
  box(arch, [1.65, 0.09, 1.25], [0, 1.54, 0], creamRim, 0.04);
  box(arch, [1.55, 0.05, 1.15], [0, 1.58, 0], creamRim, 0.03);

  // Cristal parabrisas frontal y trasero
  box(arch, [1.36, 0.85, 0.02], [0, 0.95, -0.45], glass);
  box(arch, [1.36, 0.75, 0.02], [0, 1.0, 0.45], glass);
  // Cristales laterales
  for (const side of [-1, 1]) {
    box(arch, [0.02, 0.85, 0.82], [side * 0.72, 0.95, 0], glass);
  }

  // Guardabarros traseros anchos curvados
  for (const side of [-1, 1]) {
    const fender = group(cab, `fender_${side}`, [side * 0.88, 0.4, 0.2]);
    box(fender, [0.42, 0.08, 1.45], [0, 0.35, 0], ebroBlue, 0.04);
    box(fender, [0.42, 0.65, 0.08], [0, 0, 0.68], ebroBlue, 0.03); // faldón trasero
    // Pilotos traseros (rojo y ámbar)
    box(fender, [0.12, 0.16, 0.04], [0, 0.15, 0.73], redTaillight, 0.01);
    box(fender, [0.12, 0.08, 0.04], [0, 0.3, 0.73], amberLight, 0.01);
  }

  // ==========================================
  // 4. RUEDAS DELANTERAS (DIRECTRICES)
  // ==========================================
  const frontAxleY = 0.46;
  const frontAxleZ = -1.25;
  // Barra de eje delantero
  cyl(root, 0.06, 1.6, [0, frontAxleY, frontAxleZ], darkChassis, [0, 0, Math.PI / 2]);

  for (const side of [-1, 1]) {
    const fw = group(root, `front_wheel_${side}`, [side * 0.86, frontAxleY, frontAxleZ]);
    // Neumático
    cyl(fw, 0.46, 0.24, [0, 0, 0], tireRubber, [0, 0, Math.PI / 2], 30);
    // Llanta
    cyl(fw, 0.28, 0.26, [0, 0, 0], creamRim, [0, 0, Math.PI / 2], 24);
    // Tapa de buje central
    cyl(fw, 0.1, 0.28, [0, 0, 0], ebroBlue, [0, 0, Math.PI / 2], 16);
  }

  // ==========================================
  // 5. RUEDAS TRASERAS GIGANTES (DE TRACCIÓN)
  // ==========================================
  const rearAxleY = 0.82;
  const rearAxleZ = 0.88;
  const rearRadius = 0.85;
  const tireWidth = 0.44;

  for (const side of [-1, 1]) {
    const rw = group(root, `rear_wheel_${side}`, [side * 1.08, rearAxleY, rearAxleZ]);

    // Cuerpo principal del neumático
    cyl(rw, rearRadius, tireWidth, [0, 0, 0], tireRubber, [0, 0, Math.PI / 2], 36);

    // Tacos de tracción agrícolas en V (chevron pattern)
    const numLugs = 26;
    for (let i = 0; i < numLugs; i++) {
      const angle = (i / numLugs) * Math.PI * 2;
      const lug = group(rw, `lug_${i}`, [0, 0, 0]);
      lug.rotation.x = angle;
      // Taco inclinado en espiga
      for (const half of [-1, 1]) {
        box(lug, [0.18, 0.08, 0.12], [half * 0.1, rearRadius + 0.035, 0], tireRubber, 0.015);
      }
    }

    // Llanta cóncava blanca/crema de tractor
    cyl(rw, 0.54, tireWidth * 0.9, [0, 0, 0], creamRim, [0, 0, Math.PI / 2], 28);
    // Platillo de llanta con orificios de ventilación / peso de fundición
    cyl(rw, 0.42, tireWidth * 1.02, [side * 0.02, 0, 0], creamRim, [0, 0, Math.PI / 2], 20);
    // Buje central
    cyl(rw, 0.18, tireWidth * 1.1, [side * 0.03, 0, 0], darkChassis, [0, 0, Math.PI / 2], 16);
    // Tuercas de la rueda trasera
    for (let n = 0; n < 8; n++) {
      const a = (n / 8) * Math.PI * 2;
      cyl(rw, 0.025, 0.03, [side * (tireWidth * 0.55), Math.cos(a) * 0.26, Math.sin(a) * 0.26], chrome, [0, 0, Math.PI / 2], 6);
    }
  }

  // ==========================================
  // 6. APERO DE LABRANZA (ARADO DE VERTEDERAS)
  // ==========================================
  const hitch = group(root, 'three_point_hitch', [0, 0.5, 1.55]);

  // Brazos del tripuntal hidráulico
  for (const side of [-1, 1]) {
    cyl(hitch, 0.035, 0.8, [side * 0.32, 0.05, 0.35], darkChassis, [0.5, 0, 0]);
  }
  // Tercer punto superior (tensor central)
  cyl(hitch, 0.03, 0.7, [0, 0.35, 0.3], chrome, [-0.4, 0, 0]);

  // Bastidor del arado (chasis del apero en rojo agrícola o acero)
  const plowFrameMat = mat('Plow Frame Red', '#b8261e', 0.5, 0.35);
  const plow = group(hitch, 'plow_implement', [0, 0, 0.75]);

  // Viga diagonal portante del arado
  cyl(plow, 0.065, 1.8, [0.2, 0.1, 0.65], plowFrameMat, [0.4, -0.3, 0]);

  // 3 Cuerpos de arado (vertederas de labranza curvadas para voltear tierra)
  for (let b = 0; b < 3; b++) {
    const zPos = 0.2 + b * 0.55;
    const xPos = 0.05 + b * 0.22;
    const yPos = 0.2 - b * 0.08;

    const plowBody = group(plow, `plow_body_${b}`, [xPos, yPos, zPos]);
    // Brazo soporte vertical (timón de la reja)
    box(plowBody, [0.06, 0.65, 0.1], [0, -0.15, 0], plowFrameMat, 0.015);

    // Reja cortadora inferior (punta que penetra el suelo)
    box(plowBody, [0.03, 0.15, 0.42], [0.08, -0.42, -0.1], plowSteel, 0.01);

    // Vertedera curvada (chapa helicoidal de volteo de tierra)
    const moldboard = box(plowBody, [0.38, 0.38, 0.04], [0.22, -0.32, 0.08], plowSteel, 0.01);
    moldboard.rotation.set(-0.3, 0.45, 0.35);

    // Rueda de control de profundidad del arado
    if (b === 2) {
      cyl(plowBody, 0.18, 0.08, [-0.22, -0.28, 0.1], darkChassis, [0, 0, Math.PI / 2], 18);
    }
  }

  return root;
}

// Exportar a GLB
const tractor = buildTractorEbro();
tractor.userData = {
  name: 'Tractor de Labranza EBRO con Arado de Vertederas',
  brand: 'EBRO',
  type: 'Agricultural Tillage Tractor',
  author: 'Antigravity 3D Generator',
};

const exporter = new GLTFExporter();
const glbBuffer = await exporter.parseAsync(tractor, { binary: true });

await writeFile('extracted-3d-lib/models/tractor-ebro.glb', Buffer.from(glbBuffer));
console.log('✅ tractor-ebro.glb generado con éxito! Tamaño:', Math.round(glbBuffer.byteLength / 1024), 'KB');
