@echo off
title Visor 3D Interactivo - Puerto 3333
cd /d "%~dp0"

echo ======================================================
echo  Iniciando Visor 3D en http://localhost:3333
echo ======================================================

start http://localhost:3333

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    node viewer-server.mjs
) else if exist "C:\Program Files\nodejs\node.exe" (
    "C:\Program Files\nodejs\node.exe" viewer-server.mjs
) else (
    echo Node.js no encontrado. Abriendo directamente en el navegador...
    start "" "%~dp0viewer.html"
)
pause
