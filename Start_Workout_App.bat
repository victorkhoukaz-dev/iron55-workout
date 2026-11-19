@echo off
title IRON 55 Workout App Server
cd /d "%~dp0"
echo Starting IRON 55 Workout App...
start "" "http://localhost:5173/"
npm run dev
pause
