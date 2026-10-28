# Colección y Librería 3D de up-eye-dawn-demo

Esta carpeta recopila **todo el sistema 3D** del proyecto, tanto los componentes procedurales para React como los **modelos 3D exportados en formato binario GLB**, texturas PBR y scripts generadores.

---

## 📂 Contenido del paquete

```text
extracted-3d-lib/
├── models/                     # Modelos 3D listos para usar en cualquier visor / Three.js / Blender / Web
│   ├── rover.glb               # Modelo 3D detallado del Rover (1.2 MB)
│   ├── sentinel.glb            # Modelo 3D de la torre mástil telescópica (430 KB)
│   └── drone.glb               # Modelo 3D del cuadricóptero agrícola (143 KB)
├── textures/                   # Texturas PBR y mapa ambiental HDR
│   ├── ground-color.jpg        # Textura difusa de suelo agrícola
│   ├── ground-normal.jpg       # Mapa de normales de relieve del suelo
│   ├── ground-roughness.jpg    # Mapa de rugosidad
│   ├── grapevine-leaf.png      # Textura con canal alfa para hojas/viñedo
│   └── sky.hdr                 # Iluminación ambiental y cielo 360° en alto rango dinámico (HDR)
├── scripts/
│   └── build-models.mjs        # Script generador procedural con Three.js que exporta a GLB
├── components/                 # Componentes React Three Fiber listos para importar
│   ├── Rover3D.tsx             # Modelo procedural en React
│   ├── Sentinel3D.tsx          # Torre mástil procedural
│   ├── Drone3D.tsx             # Dron procedural con rotores animados
│   ├── FieldScene3D.tsx        # Escena completa de campo agrícola
│   ├── NdviSurface3D.tsx       # Superficie topográfica NDVI (mapa de calor 3D)
│   └── ModelViewer3D.tsx       # Visor orbital universal para cualquier archivo .glb
├── index.ts                    # Exportaciones TypeScript
└── package.json
```

---

## 🚀 1. Cómo usar los modelos 3D (`.glb`) en cualquier proyecto

Los archivos dentro de `models/` son archivos estándar **glTF binarios (`.glb`)**. Puedes abrirlos directamente con:
- Cualquier visor 3D de Windows / macOS (Visor 3D de Windows, etc.).
- [gltf-viewer.donmccurdy.com](https://gltf-viewer.donmccurdy.com/)
- Blender, Maya, Unreal Engine o Unity.
- En tu proyecto web con Three.js o el visor `ModelViewer3D`:

```tsx
import { ModelViewer3D } from './extracted-3d-lib';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* Carga directamente el modelo GLB */}
      <ModelViewer3D modelUrl="/models/rover.glb" autoRotate={true} />
    </div>
  );
}
```

---

## ⚙️ 2. Generador de modelos (`scripts/build-models.mjs`)

El archivo `scripts/build-models.mjs` es un script autónomo de Node.js que construye cada modelo 3D por código utilizando primitivas de Three.js (`RoundedBoxGeometry`, `CylinderGeometry`, `TorusGeometry`, materiales PBR) y los empaqueta en `.glb` mediante `GLTFExporter`.

Puedes ejecutarlo o modificarlo para generar variaciones de los modelos:
```bash
node scripts/build-models.mjs
```

---

## 🌾 3. Componentes React Procedurales (`FieldScene3D` y `NdviSurface3D`)

Si prefieres no cargar ficheros binarios y renderizar todo mediante componentes puros de React:

```tsx
import { FieldScene3D, NdviSurface3D } from './extracted-3d-lib';

export default function Dashboard() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100vh' }}>
      {/* Escena interactiva del campo con Rover, Sentinel y Dron */}
      <FieldScene3D
        roverProbing={false}
        sentinelHeight={0.8}
        sentinelBayOpen={true}
        droneActive={true}
      />

      {/* Terreno topográfico WebGL con gradiente de vegetación NDVI */}
      <NdviSurface3D />
    </div>
  );
}
```

---

## 🎬 4. Aplicación completa `apps/field-cinema`

En el repositorio se ha incorporado la aplicación `apps/field-cinema` extraída de la rama de desarrollo del proyecto. Contiene:
- Visor cinemático 3D en tiempo real con órbita y cámaras de inspección.
- Shader de simulación de cámara térmica infrarroja en WebGL.
- Integración de los modelos `.glb` con sombras PCF y oclusión ambiental (GTAO).
- Para lanzarla:
  ```bash
  cd apps/field-cinema
  pnpm install  # o npm install
  pnpm dev      # o npm run dev
  ```
