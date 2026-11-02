@echo off
chcp 65001 >nul
title Taro
cd /d "%~dp0"
if not defined TAROT_OPEN set TAROT_OPEN=1
echo Таро запускается. Браузер откроется автоматически.
echo Не закрывайте это окно, пока работаете.
echo Чтобы остановить Таро, просто закройте окно.
echo.
node.exe server.js
echo.
echo Таро остановлено. Окно можно закрыть.
pause
