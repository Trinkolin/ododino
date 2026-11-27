@echo off
rem Lance le site Ododino en local : double-cliquer sur ce fichier.
cd /d "%~dp0"
start "" http://localhost:8765
where py >nul 2>nul && (py tools/serve.py & goto :eof)
where python >nul 2>nul && (python tools/serve.py & goto :eof)
echo Python est introuvable. Installez-le depuis https://www.python.org/downloads/
pause
