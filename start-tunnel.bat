@echo off
REM we:好き API 서버를 Cloudflare Tunnel로 실행
REM 이 파일을 더블클릭하거나 시작 프로그램에 등록하세요

echo Starting we:suki server...
start "we-suki server" /min cmd /c "cd /d C:\Users\rlarb\.gemini\antigravity\scratch\we-suki && node server/index.js"

timeout /t 2 /nobreak > nul

echo Starting Cloudflare Tunnel...
C:\Users\rlarb\cloudflared.exe tunnel --url http://localhost:3001

pause
