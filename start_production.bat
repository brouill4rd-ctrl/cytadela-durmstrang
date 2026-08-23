@echo off
title CYTADELA DURMSTRANG - PRODUKCJA
echo ===================================================
echo   BUDOWANIE I URUCHAMIANIE WERSJI PRODUKCYJNEJ
echo ===================================================
call npm run build
set NODE_ENV=production
node server/index.js
pause
