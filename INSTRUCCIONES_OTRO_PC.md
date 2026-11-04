# 🚀 Cómo descargar y usar esta Librería 3D en otro PC o proyecto

El repositorio oficial de GitHub de tu proyecto es:
👉 **[https://github.com/tomasinsecepro/libreria-3d-upaidown](https://github.com/tomasinsecepro/libreria-3d-upaidown)**

---

## 📦 Método 1: Clonar el repositorio completo en el otro PC (Recomendado)

En la terminal de tu otro ordenador:
```bash
git clone https://github.com/tomasinsecepro/libreria-3d-upaidown.git
cd libreria-3d-upaidown
```

Una vez clonado tienes:
1. **El Visor 3D interactivo inmediato:**
   - Ejecuta `node viewer-server.mjs` o simplemente abre `viewer.html` con Live Server o `npx serve .` y navega a `http://localhost:3333`.
2. **Todos los componentes 3D React Three Fiber:**
   - Ubicados en `extracted-3d-lib/components/` listos para copiar a tu otro proyecto o importar directamente.
3. **Modelos binarios `.glb`:**
   - En la carpeta `extracted-3d-lib/models/`.

---

## ⚡ Método 2: Instalar directamente como paquete en otro proyecto React / Next.js / Vite

Si en tu otro PC ya tienes un proyecto funcionando y solo quieres usar los componentes 3D, puedes instalar este repositorio directamente desde GitHub sin tener que copiar archivos a mano:

### Con npm:
```bash
npm install github:tomasinsecepro/libreria-3d-upaidown
```

### Con pnpm:
```bash
pnpm add github:tomasinsecepro/libreria-3d-upaidown
```

### Uso en tu código (React Three Fiber):
```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { 
  Liebre3D, 
  GalgoEspanol3D, 
  TorreCti3D, 
  PivotRiego3D,
  IngeteamInverter3D 
} from 'libreria-3d-upaidown';

export default function MiEscena3D() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [2, 2, 4], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
        
        {/* Liebre Ibérica hiperrealista en carrera */}
        <Liebre3D position={[-1, 0, 0]} scale={1} />

        {/* Galgo Español barcino hiperrealista */}
        <GalgoEspanol3D position={[1, 0, 0]} scale={1} />

        {/* Torre CTI de alta tensión */}
        {/* <TorreCti3D position={[0, 0, 0]} scale={0.5} /> */}

        {/* Pívot de riego con ruedas orientadas 90° */}
        {/* <PivotRiego3D towers={4} autoRotate={true} /> */}

        <OrbitControls />
      </Canvas>
    </div>
  );
}
```

---

## 📥 Método 3: Descarga de archivos binarios `.GLB` (para Blender, Three.js puro, Unity, etc.)

Desde el visor 3D interactivo (`http://localhost:3333`):
1. Selecciona cualquier modelo (Liebre, Galgo, Torre CTI, Pívot, Tractor, etc.).
2. Haz clic en el botón verde **📥 Exportar .GLB**.
3. Se descargará el archivo binario estándar `.glb` que puedes arrastrar a cualquier software 3D o cargar con Three.js estándar:

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('liebre-iberica.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

---

## 🔄 Cómo subir los últimos cambios desde este PC a GitHub:

En este PC tienes un acceso directo listo:
- Haz doble clic en el archivo **`subir-a-github.bat`** en la carpeta del proyecto.
- O ejecuta en la consola:
  ```bash
  git add -A
  git commit -m "feat: modelos hiperrealistas liebre, galgo, torres CTI y pivots"
  git push origin main
  ```
