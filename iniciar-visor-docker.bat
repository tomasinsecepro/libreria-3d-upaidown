@echo off
title Visor 3D Interactivo en Docker (Puerto 3333)
cd /d "%~dp0"
echo ======================================================
echo  Levantando contenedor Docker en http://localhost:3333
echo ======================================================
docker compose -f docker-compose.viewer.yml up -d --build
start http://localhost:3333
echo Contenedor iniciado correctamente.
pause
