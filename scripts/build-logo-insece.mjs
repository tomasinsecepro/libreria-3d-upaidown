import * as T from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import fs from 'node:fs';
import { writeFile } from 'node:fs/promises';

// Polyfill FileReader for Node.js
globalThis.FileReader = class {
  readAsArrayBuffer(b) {
    b.arrayBuffer().then(x => { this.result = x; this.onloadend?.(); });
  }
};

function mat(name, color, metalness = 0.2, roughness = 0.35, extra = {}) {
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
// PALETA EXACTA DEL LOGO CORPORATIVO INSECE
// ==========================================
// Azul Marino Oscuro Corporativo (letras INSECE y aspas derechas/inferiores)
const inseceNavyBlue = mat('INSECE Corporate Navy Blue', '#003380', 0.25, 0.28);

// Azul Cyan / Eléctrico Claro (letras secundarias y aspas superiores/izquierdas)
const inseceCyanBlue = mat('INSECE Electric Cyan Blue', '#00a8e8', 0.25, 0.24);

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

export function buildInseceLogo3D() {
  const root = group(null, 'INSECE_LOGO_3D');

  // Cargar fuente tipográfica
  const fontDataBold = JSON.parse(fs.readFileSync('scripts/helvetiker_bold.json', 'utf8'));
  const fontBold = new FontLoader().parse(fontDataBold);

  // ==========================================
  // 1. TEXTO PRINCIPAL: "INSECE" EN 3D (AZUL MARINO Y CURSIVA)
  // ==========================================
  const textInseceGeo = new TextGeometry('INSECE', {
    font: fontBold,
    size: 1.35,
    depth: 0.22,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelSegments: 5,
  });

  // Slant / Cursiva itálica idéntica al logotipo original
  const shearMatrix = new T.Matrix4().set(
    1, 0.22, 0, 0,
    0, 1,    0, 0,
    0, 0,    1, 0,
    0, 0,    0, 1
  );
  textInseceGeo.applyMatrix4(shearMatrix);
  textInseceGeo.computeBoundingBox();

  const topBox = textInseceGeo.boundingBox;
  const topMinX = topBox.min.x;
  const topMaxX = topBox.max.x;
  const topWidth = topMaxX - topMinX;

  const textGroup = group(root, 'insece_text_group', [0, 0, 0]);
  const inseceMesh = mesh(textGroup, textInseceGeo, inseceNavyBlue, [0, 0.42, 0]);

  // ==========================================
  // 2. TEXTO SECUNDARIO: "ELECTRICIDAD E INNOVACION" EN 3D
  // Alineado con precisión exacta:
  // - Empieza justo bajo la 'I' de INSECE (minX)
  // - Termina EXACTAMENTE alineado con la 'E' final de INSECE (maxX)
  // ==========================================
  const phrase = 'ELECTRICIDAD E INNOVACION';
  const charBoxes = [];
  const charSize = 0.285;
  const charDepth = 0.12;

  for (let i = 0; i < phrase.length; i++) {
    const ch = phrase[i];
    if (ch === ' ') {
      charBoxes.push(null);
    } else {
      const geo = new TextGeometry(ch, {
        font: fontBold,
        size: charSize,
        depth: charDepth,
        curveSegments: 8,
        bevelEnabled: true,
        bevelThickness: 0.014,
        bevelSize: 0.01,
        bevelSegments: 3,
      });
      geo.computeBoundingBox();
      const w = geo.boundingBox.max.x - geo.boundingBox.min.x;
      charBoxes.push({
        char: ch,
        geo,
        width: w,
        minX: geo.boundingBox.min.x,
        maxX: geo.boundingBox.max.x,
      });
    }
  }

  // 22 letras no espacio + 2 espacios entre palabras.
  // 20 transiciones entre letras dentro de palabras, 2 espacios entre palabras.
  // Espacio de palabra = 2.4 * espacio entre letras.
  // topWidth = sumNonSpaceWidth + 20 * gap + 2 * (2.4 * gap) = sumNonSpaceWidth + 24.8 * gap.
  const nonSpaceBoxes = charBoxes.filter(b => b !== null);
  const sumNonSpaceWidth = nonSpaceBoxes.reduce((sum, b) => sum + b.width, 0);
  const effectiveGaps = 20 + 2 * 2.4;
  const gap = (topWidth - sumNonSpaceWidth) / effectiveGaps;
  const spaceWidth = 2.4 * gap;

  let currentX = topMinX;
  const taglineGroup = group(textGroup, 'tagline_electricidad_e_innovacion', [0, -0.06, 0.02]);

  for (let i = 0; i < phrase.length; i++) {
    const ch = phrase[i];
    if (ch === ' ') {
      currentX += spaceWidth;
    } else {
      const box = charBoxes[i];
      const charX = currentX - box.minX;
      mesh(taglineGroup, box.geo, inseceCyanBlue, [charX, 0, 0]);

      if (i < phrase.length - 1 && phrase[i + 1] !== ' ') {
        currentX += box.width + gap;
      } else {
        currentX += box.width;
      }
    }
  }

  // ==========================================
  // 3. ISOTIPO EXACTO SEGÚN EL LOGO REAL OFICIAL DE INSECE
  // Símbolo de 10 aspas en vórtice/espiral logarítmica:
  // - 10 aspas con borde exterior cóncavo (efecto aleta/vela curva)
  // - Aspa más larga en punta fina horizontal hacia la derecha (~15º)
  // - Aspas superiores e izquierdas en Azul Cyan / Eléctrico (#3fb2eb)
  // - Aspas inferiores y derechas en Azul Marino Profundo (#0d3e7e)
  // ==========================================
  const symbolGroup = group(root, 'insece_wheel_symbol', [-1.95, 0.95, 0]);

  const numBlades = 10;
  const innerR = 0.28;
  const step = (Math.PI * 2) / numBlades;
  const bladeAngleSpan = step * 0.76; // 76% anchura de pala, 24% separación limpia entre aspas

  // Radios de punta para las 10 aspas (espiral exacta del logo)
  const tipRadii = [
    1.82, // Aspa 0: larga horizontal a la derecha hacia INSECE (~12°)
    1.36, // Aspa 1: superior derecha (~48°)
    1.12, // Aspa 2: superior (~84°)
    0.95, // Aspa 3: superior izquierda (~120°)
    0.82, // Aspa 4: izquierda (~156°)
    0.78, // Aspa 5: inferior izquierda (~192°)
    0.86, // Aspa 6: inferior izquierda-baja (~228°)
    1.04, // Aspa 7: inferior (~264°)
    1.26, // Aspa 8: inferior derecha (~300°)
    1.52, // Aspa 9: derecha-inferior (~336°)
  ];

  // Colores exactos de las 10 aspas según el logotipo real
  const bladeColors = [
    mat('Navy 0', '#0a356f', 0.25, 0.25), // 0: azul marino oscuro
    mat('Navy 1', '#0d3e7e', 0.25, 0.25), // 1: azul marino
    mat('Cyan 2', '#42b6ee', 0.28, 0.22), // 2: cyan brillante
    mat('Cyan 3', '#49bcf2', 0.28, 0.22), // 3: cyan brillante
    mat('Cyan 4', '#42b6ee', 0.28, 0.22), // 4: cyan brillante
    mat('Cyan 5', '#35a2db', 0.28, 0.24), // 5: cyan medio
    mat('Blue 6', '#1e68b3', 0.26, 0.25), // 6: azul intermedio
    mat('Navy 7', '#0e4386', 0.25, 0.25), // 7: azul marino
    mat('Navy 8', '#0c3b77', 0.25, 0.25), // 8: azul marino oscuro
    mat('Navy 9', '#0a356f', 0.25, 0.25), // 9: azul marino profundo
  ];

  for (let i = 0; i < numBlades; i++) {
    const a1 = i * step + 0.08;
    const a2 = a1 + bladeAngleSpan;
    const aMid = (a1 + a2) / 2;

    const rTip = tipRadii[i];
    const rBase = rTip * 0.70;
    // Punto de control para la curva cóncava (hacia dentro)
    const rConcave = Math.min(rTip, rBase) * 0.78;

    const shape = new T.Shape();
    // 1. Origen en el anillo interior
    shape.moveTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
    // 2. Borde recto radial exterior hacia la punta afilada
    shape.lineTo(Math.cos(a1) * rTip, Math.sin(a1) * rTip);
    // 3. Curvatura CÓNCAVA exterior (se hunde hacia el centro como en el logo real)
    shape.quadraticCurveTo(
      Math.cos(aMid) * rConcave,
      Math.sin(aMid) * rConcave,
      Math.cos(a2) * rBase,
      Math.sin(a2) * rBase
    );
    // 4. Retorno radial recto hacia el orificio interior
    shape.lineTo(Math.cos(a2) * innerR, Math.sin(a2) * innerR);
    // 5. Cierre interior a lo largo del cubo central
    shape.absarc(0, 0, innerR, a2, a1, true);
    shape.closePath();

    // Extrusión 3D con biseles redondeados de alta precisión
    const extrudeGeo = new T.ExtrudeGeometry(shape, {
      depth: 0.20,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.018,
      bevelSegments: 4,
    });

    mesh(symbolGroup, extrudeGeo, bladeColors[i], [0, 0, 0]);
  }

  return root;
}

// Compilar y guardar GLB
const logo = buildInseceLogo3D();
logo.userData = {
  name: 'Logo Oficial 3D INSECE Electricidad e Innovación (Rueda Completa 360º y Letras Alineadas)',
  brand: 'INSECE',
  slogan: 'ELECTRICIDAD E INNOVACION',
  author: 'Antigravity 3D Generator',
};

// Auto centrar modelo para que el visor 3D lo enfoque perfectamente
const box = new T.Box3().setFromObject(logo);
const center = box.getCenter(new T.Vector3());
logo.position.sub(center);

const exporter = new GLTFExporter();
const glbBuffer = await exporter.parseAsync(logo, { binary: true });

await writeFile('extracted-3d-lib/models/logo-insece.glb', Buffer.from(glbBuffer));
console.log('✅ logo-insece.glb generado con éxito (Rueda 360º completa con bloques separados + Letras inferior y superior alineadas a la perfección)! Tamaño:', Math.round(glbBuffer.byteLength / 1024), 'KB');
