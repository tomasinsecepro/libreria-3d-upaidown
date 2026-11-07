@echo off
chcp 65001 > nul
echo ========================================================
echo  SUBIENDO LIBRERÍA 3D A GITHUB (tomasinsecepro)
echo ========================================================
echo.

echo 1. Estado actual del repositorio:
git status -s
echo.

echo 2. Añadiendo archivos modificados y nuevos...
git add -A

echo 3. Creando commit con las novedades...
git commit -m "feat: anadidos cuadros electricos INSECE 60x80cm 3D (estandar y con pantalla HMI), cenador rustico 6m y bomba vertical"

echo 4. Subiendo a GitHub (https://github.com/tomasinsecepro/libreria-3d-upaidown)...
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  [EXITO] Todo el proyecto esta actualizado en GitHub!
    echo  Repositorio: https://github.com/tomasinsecepro/libreria-3d-upaidown
    echo ========================================================
) else (
    echo [ERROR / AVISO] Revisa si se requiere iniciar sesion en GitHub.
)
echo.
pause
