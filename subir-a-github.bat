@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo   SUBIENDO LIBRERIA 3D A GITHUB: tomasinsecepro
echo ========================================================
echo.

git config user.name "tomasinsecepro"
git config user.email "tomasinsecepro@users.noreply.github.com"

echo [1/3] Anadiendo archivos...
git add -A

echo.
echo [2/3] Registrando commit con todas las mejoras 3D...
git commit -m "feat: libreria 3D interactiva completa para tomasinsecepro"

echo.
echo [3/3] Enviando a https://github.com/tomasinsecepro/libreria-3d-upaidown ...
git push -u origin main --force

echo.
echo ========================================================
echo   PROCESO COMPLETADO
echo ========================================================
echo.
pause
