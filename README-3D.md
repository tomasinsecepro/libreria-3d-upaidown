# Librería 3D Agrovoltaica e Industrial · INSECE & Ingeteam

Colección completa de modelos 3D interactivos PBR (Three.js y React Three Fiber) para gemelos digitales, plantas fotovoltaicas y proyectos agrícolas.

## 🌟 Modelos 3D Incluidos

1. **Inversor Ingeteam INGECON SUN 3Play 110TL M9 (110 kW):**
   - Chasis gris claro RAL 7035 con 10 tornillos perimetrales M8.
   - Compartimento AC independiente con hendidura técnica.
   - 18 conectores MC4 para 9 seguidores MPPT (2 strings c/u).
   - Glándula de comunicaciones con precinto rojo y tornillo de tierra de latón.
   - Desconectador rotativo DC y disipador trasero de 28 aletas.
   - Placa identificativa Ingeteam con LED verde de estado emissive.
2. **Placas Solares Bi-fila:** 4 mesas de 100 placas fotovoltaicas cada una (50 arriba y 50 abajo = 400 placas totales) con estructura de perfiles galvanizados y tirantes arriostrados.
3. **Logo INSECE 3D:** Isotipo de rueda dividida completa y tipografía extruida.
4. **Perro Salchicha (Teckel):** Modelo realista en color negro y fuego.
5. **Bomba de Pozo Solar:** Cabezal de impulsión, motor sumergible y cuadro eléctrico.
6. **Embalse de Riego:** Con geomembrana de polietileno PEAD texturizada y agua procedural.
7. **Olivo Picual Centenario:** Tronco retorcido y follaje realista.
8. **Pivot Central de Riego:** Tramo pivotante con torres metálicas y aspersores.
9. **Almendro y Pistachero:** Modelos de arbolado agrícola.
10. **Tractor Ebro 684E, Rover UGV, Satélite Sentinel-2 y Dron Multiespectral.**

---

## 🚀 Cómo Iniciar el Visor (Puerto 3333)

### Opción 1: Un solo clic (Windows)
Haz doble clic en:
👉 `iniciar-visor-3d.bat`
*(Arranca el servidor local y abre automáticamente `http://localhost:3333` en tu navegador)*

### Opción 2: Docker
Si prefieres ejecutarlo encapsulado en un contenedor Docker:
* Con un clic: doble clic en `iniciar-visor-docker.bat`
* O por terminal:
  ```bash
  docker compose -f docker-compose.viewer.yml up -d --build
  ```
  Accede a: `http://localhost:3333`

### Opción 3: Visor directo sin servidor
Abre directamente en tu navegador el archivo `viewer.html`:
`c:\Users\Tomas\Desktop\ANTIGRAVITY\libreria 3d upaidown\viewer.html`

---

## 🐙 Cómo Subir a tu Repositorio de GitHub

Abre una terminal en esta carpeta y ejecuta:

```bash
# 1. Asegurar todos los cambios
git add .
git commit -m "feat: inversor Ingeteam 110kW, visor 3D en puerto 3333 y soporte Docker"

# 2. Vincular con tu nuevo repositorio en GitHub (crea uno vacío en github.com/new)
git remote set-url origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 3. Subir el proyecto
git branch -M main
git push -u origin main
```
