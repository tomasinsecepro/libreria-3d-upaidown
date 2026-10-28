import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { writeFile } from 'node:fs/promises';

// Polyfill FileReader for Node.js
globalThis.FileReader = class {
  readAsArrayBuffer(b) {
    b.arrayBuffer().then(x => { this.result = x; this.onloadend?.(); });
  }
};

function mat(name, color, metalness = 0.05, roughness = 0.35, extra = {}) {
  const m = new T.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  m.name = name;
  return m;
}

// ==========================================
// PALETA DE MATERIALES DEL PERRO SALCHICHA (TECKEL)
// ==========================================
// Pelaje negro azabache brillante característico del teckel de pelo corto
const furBlack = mat('Black Smooth Coat', '#161514', 0.03, 0.28);
const furBlackBelly = mat('Black Coat Underside', '#1c1b1a', 0.02, 0.38);

// Marcas color fuego (tan / castaño cálido)
const furTan = mat('Tan Rust Markings', '#b86326', 0.02, 0.32);
const furTanLight = mat('Tan Muzzle & Eyebrows', '#c97433', 0.02, 0.35);
const furTanDark = mat('Tan Shaded Transition', '#9c4f1c', 0.02, 0.34);

// Trufa (nariz) y boca
const noseLeather = mat('Moist Black Nose Leather', '#0b0c0d', 0.08, 0.18);
const lipBlack = mat('Dark Lip Margin', '#141312', 0.04, 0.22);
const tonguePink = mat('Mouth Interior Pink', '#b54854', 0.02, 0.25);

// Ojos vivos y expresivos
const eyeWhite = mat('Eye Sclera', '#ece7e1', 0.0, 0.1);
const eyeIris = mat('Dark Hazel Amber Iris', '#3e1e0d', 0.05, 0.08);
const eyePupil = mat('Eye Pupil Black', '#020202', 0.1, 0.05);
const eyeCornea = mat('Glossy Wet Cornea Glint', '#ffffff', 0.2, 0.02);

// Uñas / garras
const clawNail = mat('Keratin Claws', '#201d1a', 0.05, 0.28);
const pawPad = mat('Paw Pads Dark Leather', '#262220', 0.02, 0.5);

// Collar morado/violeta y correa idéntica a la foto
const collarPurple = mat('Violet Nylon Webbing Collar', '#7024c4', 0.02, 0.6);
const leashPurple = mat('Violet Nylon Lead Leash', '#7b2dd6', 0.02, 0.62);
const silverBuckle = mat('Chrome Hardware Buckle & Ring', '#cdd4db', 0.95, 0.18);
const snapHookBlack = mat('Black Carabiner Clip Hook', '#222325', 0.7, 0.35);

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

// ==========================================
// CONSTRUCCIÓN ANATÓMICA HIPERREALISTA
// Orientación: El perro mira hacia +X (perfil como la foto)
// Eje Y: Altura (suelo en Y=0)
// Eje Z: Lateral (ancho simétrico bilateral: +Z izquierdo, -Z derecho)
// ==========================================

export function buildHyperrealisticDachshund() {
  const dog = new T.Group();
  dog.name = 'Perro Salchicha Teckel (Dachshund) Hiperrealista';

  // ----------------------------------------------------
  // 1. CUERPO ALARGADO TUBULAR Y MUSCULOSO (TORSO / TRONCO)
  // Proporciones canónicas de Teckel estándar:
  // Caja torácica profunda en quilla, lomo largo, abdomen recogido
  // ----------------------------------------------------
  const bodyRoot = group(dog, 'Body Torso');

  // Pecho principal y costillar (profundo en forma de quilla, Y=0.10 a 0.26)
  // El esternón (keel) desciende prominentemente entre las patas delanteras
  const ribGeo = new T.CylinderGeometry(0.082, 0.088, 0.28, 32, 16);
  ribGeo.rotateZ(Math.PI / 2);
  // Escalar para que sea ovalado: más alto verticalmente (Y) que ancho transversal (Z)
  const ribMesh = mesh(bodyRoot, ribGeo, furBlack, [0.03, 0.178, 0], [0, 0, -0.04], [1.08, 1.12, 0.92]);

  // Quilla esternal prominente (Keel / Esternón sobresaliente típico en salchicha)
  const keelGeo = new T.SphereGeometry(0.065, 24, 20);
  mesh(bodyRoot, keelGeo, furBlack, [0.18, 0.155, 0], [0, 0, 0], [1.3, 0.85, 0.72]);

  // Pecho delantero frontal (antebrazo y quilla vista frontal)
  const chestFrontGeo = new T.SphereGeometry(0.075, 24, 20);
  mesh(bodyRoot, chestFrontGeo, furBlack, [0.15, 0.175, 0], [0, 0, 0], [1.1, 1.15, 0.95]);

  // Marcas Tan en el pecho (dos parches triangulares / ovalados color fuego a ambos lados del esternón)
  const tanChestLGeo = new T.SphereGeometry(0.035, 16, 16);
  mesh(bodyRoot, tanChestLGeo, furTan, [0.165, 0.155, 0.042], [0.2, 0.3, -0.2], [1.1, 1.2, 0.45]);
  mesh(bodyRoot, tanChestLGeo, furTan, [0.165, 0.155, -0.042], [-0.2, -0.3, -0.2], [1.1, 1.2, 0.45]);

  // Lomo medio alargado ("salchicha" cilíndrico firme)
  const loinGeo = new T.CylinderGeometry(0.081, 0.075, 0.19, 32, 16);
  loinGeo.rotateZ(Math.PI / 2);
  mesh(bodyRoot, loinGeo, furBlack, [-0.09, 0.185, 0], [0, 0, 0.03], [1.02, 1.05, 0.88]);

  // Zona pélvica / caderas musculosas redondeadas
  const pelvisGeo = new T.SphereGeometry(0.078, 28, 24);
  mesh(bodyRoot, pelvisGeo, furBlack, [-0.19, 0.185, 0], [0, 0, 0], [1.15, 1.05, 0.94]);

  // Pliegue inguinal / abdomen recogido inferior
  const bellyFlankGeo = new T.CapsuleGeometry(0.062, 0.14, 16, 24);
  bellyFlankGeo.rotateZ(Math.PI / 2);
  mesh(bodyRoot, bellyFlankGeo, furBlackBelly, [-0.07, 0.165, 0], [0, 0, 0.08], [0.95, 0.85, 0.8]);

  // Suave curvatura muscular en la línea superior de la espalda (Topline)
  const backRidgeGeo = new T.CapsuleGeometry(0.045, 0.32, 16, 24);
  backRidgeGeo.rotateZ(Math.PI / 2);
  mesh(bodyRoot, backRidgeGeo, furBlack, [-0.02, 0.222, 0], [0, 0, -0.02], [1.0, 0.65, 0.85]);

  // ----------------------------------------------------
  // 2. CUELLO ELEGANTE Y ARQUEADO
  // Sale del pecho hacia adelante y arriba en ángulo de 45-50°
  // ----------------------------------------------------
  const neckRoot = group(dog, 'Neck', [0.16, 0.20, 0]);

  // Cuello cónico muscular
  const neckGeo = new T.CylinderGeometry(0.055, 0.076, 0.15, 28, 16);
  mesh(neckRoot, neckGeo, furBlack, [0.065, 0.065, 0], [0, 0, -0.78], [1.1, 1.0, 0.88]);

  // Nuca / cresta del cuello arqueada
  const napeGeo = new T.CapsuleGeometry(0.042, 0.13, 16, 16);
  mesh(neckRoot, napeGeo, furBlack, [0.055, 0.085, 0], [0, 0, -0.72], [1.0, 0.8, 0.8]);

  // Garganta inferior (tan / fuego suave debajo de la mandíbula)
  const throatGeo = new T.CapsuleGeometry(0.038, 0.11, 16, 16);
  mesh(neckRoot, throatGeo, furTanDark, [0.075, 0.035, 0], [0, 0, -0.85], [1.0, 0.7, 0.75]);

  // ----------------------------------------------------
  // 3. CABEZA CÓNICA NOBLE Y EXPRESIVA (TECKEL TÍPICO)
  // Cráneo alargado, stop ligero, hocico cónico, trufa negra
  // ----------------------------------------------------
  const headRoot = group(dog, 'Head', [0.28, 0.315, 0], [0, 0, 0.05]);

  // Bóveda craneal (ligeramente aplanada arriba, ovalada hacia los lados)
  const skullGeo = new T.SphereGeometry(0.056, 30, 24);
  mesh(headRoot, skullGeo, furBlack, [0.02, 0.015, 0], [0, 0, 0], [1.25, 0.98, 0.88]);

  // Stop moderado (depresión naso-frontal entre ojos)
  const stopGeo = new T.SphereGeometry(0.038, 20, 16);
  mesh(headRoot, stopGeo, furBlack, [0.06, 0.012, 0], [0, 0, 0], [1.1, 0.85, 0.82]);

  // Caña nasal larga y estilizada (parte superior del hocico)
  const muzzleTopGeo = new T.ConeGeometry(0.035, 0.13, 28, 16);
  muzzleTopGeo.rotateZ(-Math.PI / 2);
  mesh(headRoot, muzzleTopGeo, furBlack, [0.105, 0.005, 0], [0, 0, 0.06], [0.85, 0.95, 0.75]);

  // Laterales y base del hocico COLOR FUEGO (Tan / Castaño)
  const muzzleTanGeo = new T.ConeGeometry(0.034, 0.125, 28, 16);
  muzzleTanGeo.rotateZ(-Math.PI / 2);
  mesh(headRoot, muzzleTanTanGeo(muzzleTanGeo), furTanLight, [0.10, -0.012, 0], [0, 0, 0.05], [0.85, 0.85, 0.76]);

  function muzzleTanTanGeo(baseGeo) {
    return baseGeo;
  }

  // Quijada inferior / Mandíbula estilizada color fuego
  const jawGeo = new T.ConeGeometry(0.026, 0.11, 24);
  jawGeo.rotateZ(-Math.PI / 2);
  mesh(headRoot, jawGeo, furTan, [0.095, -0.022, 0], [0, 0, 0.03], [0.9, 0.65, 0.65]);

  // Trufa negra (nariz con forma húmeda canina y orificios nasales)
  const noseRoot = group(headRoot, 'Nose Leather', [0.172, -0.002, 0]);
  const noseGeo = new T.SphereGeometry(0.014, 20, 16);
  mesh(noseRoot, noseGeo, noseLeather, [0, 0, 0], [0, 0, 0], [0.95, 0.85, 1.25]);

  // Orificios nasales (narinas)
  const nostrilGeo = new T.CylinderGeometry(0.0025, 0.0035, 0.007, 12);
  nostrilGeo.rotateZ(Math.PI / 2);
  mesh(noseRoot, nostrilGeo, noseLeather, [0.006, -0.002, 0.0048], [0, 0.25, 0]);
  mesh(noseRoot, nostrilGeo, noseLeather, [0.006, -0.002, -0.0048], [0, -0.25, 0]);

  // Labios finos negros
  const lipLineGeo = new T.CylinderGeometry(0.0018, 0.0018, 0.08, 12);
  lipLineGeo.rotateZ(Math.PI / 2);
  mesh(headRoot, lipLineGeo, lipBlack, [0.11, -0.015, 0.023], [0, 0.15, 0]);
  mesh(headRoot, lipLineGeo, lipBlack, [0.11, -0.015, -0.023], [0, -0.15, 0]);

  // ----------------------------------------------------
  // OJOS ALMENDRADOS EXPRESIVOS Y MANCHAS DE CEJAS (TAN PIPS)
  // Como en la foto: mirada viva, inteligente y leal
  // ----------------------------------------------------
  for (const side of [1, -1]) {
    const eyeSideRoot = group(headRoot, `Eye_${side > 0 ? 'L' : 'R'}`, [0.052, 0.014, side * 0.032]);

    // Esclera / Globo ocular
    const eyeBall = new T.SphereGeometry(0.009, 18, 16);
    mesh(eyeSideRoot, eyeBall, eyeWhite, [0, 0, 0], [0, side * 0.2, 0], [1.1, 0.95, 0.8]);

    // Iris color avellana profundo
    const irisGeo = new T.CylinderGeometry(0.0055, 0.0055, 0.003, 16);
    irisGeo.rotateX(Math.PI / 2);
    mesh(eyeSideRoot, irisGeo, eyeIris, [0.002, 0, side * 0.006], [0, side * 0.25, 0]);

    // Pupila negra
    const pupilGeo = new T.CylinderGeometry(0.0032, 0.0032, 0.0035, 16);
    pupilGeo.rotateX(Math.PI / 2);
    mesh(eyeSideRoot, pupilGeo, eyePupil, [0.0022, 0, side * 0.0068], [0, side * 0.25, 0]);

    // Brillo de luz en córnea (reflejo especular vivo)
    const glintGeo = new T.SphereGeometry(0.0014, 8, 8);
    mesh(eyeSideRoot, glintGeo, eyeCornea, [0.0035, 0.0025, side * 0.0078]);

    // Párpados finos negros
    const lidGeo = new T.TorusGeometry(0.0082, 0.0022, 8, 16, Math.PI * 1.1);
    lidGeo.rotateY(Math.PI / 2);
    mesh(eyeSideRoot, lidGeo, lipBlack, [0, 0.001, side * 0.001], [0, side * 0.2, side * 0.1]);

    // MANCHA COLOR FUEGO EN LA CEJA (Distinctive tan spot above eye)
    // Típica marca del Dachshund Black & Tan visible claramente en la foto
    const eyebrowPipGeo = new T.SphereGeometry(0.007, 16, 12);
    mesh(headRoot, eyebrowPipGeo, furTanLight, [0.048, 0.029, side * 0.027], [0, 0, -0.3], [1.4, 0.7, 0.6]);

    // Mancha tan en la mejilla
    const cheekTanGeo = new T.SphereGeometry(0.018, 16, 12);
    mesh(headRoot, cheekTanGeo, furTan, [0.045, -0.012, side * 0.038], [0, side * 0.2, 0], [1.3, 0.9, 0.45]);
  }

  // ----------------------------------------------------
  // OREJAS LARGAS PENDULARES ATERCIOPELADAS (FLAP EARS)
  // Caídas elegantemente a los lados de la cabeza bordeando las mejillas
  // ----------------------------------------------------
  for (const side of [1, -1]) {
    const earRoot = group(headRoot, `Ear_${side > 0 ? 'L' : 'R'}`, [0.01, 0.025, side * 0.045]);

    // Pliegue de inserción alto en el cráneo
    const earBaseGeo = new T.CylinderGeometry(0.016, 0.022, 0.025, 16);
    mesh(earRoot, earBaseGeo, furBlack, [0, -0.008, side * 0.005], [0, 0, side * 0.25]);

    // Pabellón de la oreja: ancho, aplanado y curvado cayendo suavemente
    // Modelado orgánico con CatmullRomCurve3 para caída natural
    const earCurve = new T.CatmullRomCurve3([
      new T.Vector3(0, 0, 0),
      new T.Vector3(0.005, -0.035, side * 0.014),
      new T.Vector3(0.002, -0.075, side * 0.015),
      new T.Vector3(-0.008, -0.108, side * 0.008),
      new T.Vector3(-0.016, -0.128, 0)
    ]);

    // Oreja ancha con grosor suave y puntas redondeadas
    const earShape = new T.Shape();
    earShape.moveTo(-0.025, 0);
    earShape.bezierCurveTo(-0.032, -0.04, -0.036, -0.08, -0.022, -0.12);
    earShape.bezierCurveTo(-0.01, -0.14, 0.01, -0.14, 0.022, -0.12);
    earShape.bezierCurveTo(0.034, -0.08, 0.03, -0.04, 0.024, 0);
    earShape.closePath();

    const earGeo = new T.ExtrudeGeometry(earShape, {
      depth: 0.0045,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 2,
      bevelSize: 0.0025,
      bevelThickness: 0.0025
    });
    earGeo.rotateY(side > 0 ? -Math.PI / 2 : Math.PI / 2);
    earGeo.rotateZ(side * 0.08);

    const earMesh = mesh(earRoot, earGeo, furBlack, [0.005, 0.002, side * 0.008], [0.08, side * 0.12, -0.08], [0.88, 0.95, 0.9]);
  }

  // ----------------------------------------------------
  // 4. PATAS DELANTERAS CORTAS Y MUSCULOSAS (FORELEGS)
  // Con arqueo canónico de Teckel (brazos rodeando el esternón) y patas tan
  // ----------------------------------------------------
  for (const side of [1, -1]) {
    const legFRoot = group(dog, `Foreleg_${side > 0 ? 'L' : 'R'}`, [0.155, 0.15, side * 0.085]);

    // Hombro / Escápula musculosa negra
    const shoulderGeo = new T.SphereGeometry(0.042, 20, 16);
    mesh(legFRoot, shoulderGeo, furBlack, [0, 0, 0], [0, 0, 0], [1.1, 1.25, 0.75]);

    // Brazo superior (Húmero) oblicuo
    const upperArmGeo = new T.CylinderGeometry(0.028, 0.024, 0.065, 18);
    mesh(legFRoot, upperArmGeo, furBlack, [0, -0.04, side * -0.006], [side * -0.15, 0, 0.12]);

    // Mancha de transición fuego en el codo / antebrazo
    const elbowTanGeo = new T.SphereGeometry(0.023, 16, 12);
    mesh(legFRoot, elbowTanGeo, furTanDark, [0.004, -0.055, side * 0.002], [0, 0, 0], [0.85, 1.2, 0.9]);

    // Antebrazo corto y robusto (Radio/Cúbito) COLOR FUEGO
    // Ligeramente curvado hacia adentro abrazando la caja torácica profunda
    const forearmGeo = new T.CylinderGeometry(0.022, 0.020, 0.065, 18);
    mesh(legFRoot, forearmGeo, furTan, [0.002, -0.095, side * -0.008], [side * 0.12, 0, -0.08]);

    // Muñeca / Carpo fuerte
    const wristGeo = new T.SphereGeometry(0.021, 16, 14);
    mesh(legFRoot, wristGeo, furTan, [0.003, -0.125, side * -0.009], [0, 0, 0], [1.05, 0.85, 0.95]);

    // Pie / Mano delantera (Palmeada, ancha para cavar, orientada 12-15° hacia afuera)
    const pawRoot = group(legFRoot, 'Front Paw', [0.012, -0.145, side * -0.006], [0, side * 0.22, 0]);

    // Almohadilla y empeine tan
    const pawBaseGeo = new T.CylinderGeometry(0.026, 0.032, 0.018, 20);
    mesh(pawRoot, pawBaseGeo, furTanLight, [0.008, 0.009, 0], [0, 0, 0], [1.25, 0.9, 1.05]);

    // 4 Dedos individuales con almohadillas
    for (let toe = -1.5; toe <= 1.5; toe += 1) {
      const toeGeo = new T.SphereGeometry(0.0085, 12, 10);
      mesh(pawRoot, toeGeo, furTanLight, [0.026, 0.006, toe * 0.011], [0, 0, 0], [1.2, 0.85, 0.9]);

      // Uña negra en cada dedo
      const nailGeo = new T.ConeGeometry(0.0024, 0.009, 10);
      nailGeo.rotateZ(-Math.PI / 2.3);
      mesh(pawRoot, nailGeo, clawNail, [0.038, 0.003, toe * 0.011], [0, toe * 0.08, 0]);
    }
  }

  // ----------------------------------------------------
  // 5. PATAS TRASERAS CORTAS Y BIEN ANGULADAS (HIND LEGS)
  // Muslos anchos y musculosos, corvejón bajo y patas fuego
  // ----------------------------------------------------
  for (const side of [1, -1]) {
    const legRRoot = group(dog, `Hindleg_${side > 0 ? 'L' : 'R'}`, [-0.175, 0.165, side * 0.085]);

    // Muslo superior ancho y musculoso (Fémur/Glúteos) negro
    const thighGeo = new T.SphereGeometry(0.052, 22, 18);
    mesh(legRRoot, thighGeo, furBlack, [0.005, -0.01, 0], [0, 0, 0], [1.05, 1.35, 0.72]);

    // Rodilla / Babilla (Stifle) bien angulada
    const stifleGeo = new T.SphereGeometry(0.028, 16, 14);
    mesh(legRRoot, stifleGeo, furBlack, [0.032, -0.052, side * 0.004], [0, 0, 0], [0.95, 1.1, 0.85]);

    // Pierna (Tibia) con transición tan
    const shinGeo = new T.CylinderGeometry(0.022, 0.019, 0.065, 16);
    mesh(legRRoot, shinGeo, furTan, [0.018, -0.085, side * 0.002], [0, 0, 0.38]);

    // Corvejón marcado (Hock joint)
    const hockGeo = new T.SphereGeometry(0.018, 14, 12);
    mesh(legRRoot, hockGeo, furTanDark, [-0.002, -0.115, side * 0.002], [0, 0, 0], [0.9, 1.1, 0.8]);

    // Metatarso vertical tan
    const metatarsusGeo = new T.CylinderGeometry(0.016, 0.015, 0.045, 14);
    mesh(legRRoot, metatarsusGeo, furTanLight, [0.002, -0.138, side * 0.002]);

    // Pie trasero compacto
    const rearPawRoot = group(legRRoot, 'Rear Paw', [0.008, -0.158, side * 0.002]);
    const rearPawBaseGeo = new T.CylinderGeometry(0.021, 0.025, 0.016, 18);
    mesh(rearPawRoot, rearPawBaseGeo, furTanLight, [0.004, 0.008, 0], [0, 0, 0], [1.15, 0.9, 0.95]);

    // Dedos traseros y uñas
    for (let toe = -1.5; toe <= 1.5; toe += 1) {
      const toeGeo = new T.SphereGeometry(0.0075, 12, 10);
      mesh(rearPawRoot, toeGeo, furTanLight, [0.020, 0.005, toe * 0.009], [0, 0, 0], [1.15, 0.85, 0.9]);

      const nailGeo = new T.ConeGeometry(0.0022, 0.008, 10);
      nailGeo.rotateZ(-Math.PI / 2.3);
      mesh(rearPawRoot, nailGeo, clawNail, [0.030, 0.002, toe * 0.009], [0, toe * 0.06, 0]);
    }
  }

  // ----------------------------------------------------
  // 6. COLA ELEGANTE Y FINA (TAIL)
  // En prolongación de la línea dorsal con suave curvatura hacia abajo/atrás
  // ----------------------------------------------------
  const tailPoints = [
    new T.Vector3(-0.24, 0.205, 0),
    new T.Vector3(-0.29, 0.198, 0),
    new T.Vector3(-0.35, 0.172, 0.005),
    new T.Vector3(-0.41, 0.132, 0.01),
    new T.Vector3(-0.45, 0.095, 0.015)
  ];
  const tailCurve = new T.CatmullRomCurve3(tailPoints);
  const tailGeo = new T.TubeGeometry(tailCurve, 28, 0.014, 16, false);
  mesh(dog, tailGeo, furBlack);

  // Punta fina de la cola
  const tailTipGeo = new T.SphereGeometry(0.006, 12, 10);
  mesh(dog, tailTipGeo, furBlack, [-0.45, 0.095, 0.015]);

  // Mancha tan bajo la base de la cola (perianal)
  const tailTanGeo = new T.SphereGeometry(0.022, 14, 12);
  mesh(dog, tailTanGeo, furTanDark, [-0.23, 0.165, 0], [0, 0, 0], [0.6, 0.9, 0.8]);

  // ----------------------------------------------------
  // 7. COLLAR MORADO AJUSTADO (ACCESORIO DE LA FOTO)
  // Collar de nylon violeta ceñido al cuello con su hebilla plateada
  // (Cuerda / correa retirada según indicación)
  // ----------------------------------------------------
  const collarCenter = [0.22, 0.258, 0];
  const collarRot = [0, 0, -0.72]; // Perpendicular al ángulo del cuello

  const collarGroup = group(dog, 'Purple Collar', collarCenter, collarRot);

  // Banda de collar morado
  const collarGeo = new T.TorusGeometry(0.062, 0.0085, 16, 36);
  mesh(collarGroup, collarGeo, collarPurple, [0, 0, 0], [Math.PI / 2, 0, 0], [1.0, 1.25, 1.0]);

  // Hebilla metálica plateada y pasador
  const buckleGeo = new T.BoxGeometry(0.012, 0.024, 0.022);
  mesh(collarGroup, buckleGeo, silverBuckle, [0, 0.063, 0]);

  // ----------------------------------------------------
  // CALIBRACIÓN DE ALTURA AL SUELO (GROUND CONTACT)
  // Las 4 patas tocan exactamente el plano Y=0
  // ----------------------------------------------------
  dog.position.y += 0.002;

  return dog;
}

// Generar modelo GLB
const dogModel = buildHyperrealisticDachshund();
dogModel.userData = {
  name: 'Perro Salchicha Teckel Hiperrealista (Black and Tan con Correa Violeta)',
  breed: 'Dachshund / Teckel de pelo corto',
  colorPattern: 'Black & Tan (Negro y Fuego)',
  photoMatch: 'media_1793132481069_a5a41f95.png',
  author: 'Antigravity 3D Hyperrealistic Biological Engine'
};

const exporter = new GLTFExporter();
const glbBuffer = await exporter.parseAsync(dogModel, { binary: true });

await writeFile('extracted-3d-lib/models/perro-salchicha.glb', Buffer.from(glbBuffer));
console.log('✅ perro-salchicha.glb generado con éxito! Tamaño:', Math.round(glbBuffer.byteLength / 1024), 'KB');
