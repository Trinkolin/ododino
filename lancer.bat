@echo off
rem Lance le site Ododino en local : double-cliquer sur ce fichier.
cd /d "%~dp0"
start "" http://localhost:8765
where py >nul 2>nul && (py -m http.server 8765 & goto :eof)
where python >nul 2>nul && (python -m http.server 8765 & goto :eof)
echo Python est introuvable. Installez-le depuis https://www.python.org/downloads/
pause
