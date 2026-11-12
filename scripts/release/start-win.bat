@echo off
chcp 65001 >nul
title Таро — не закрывайте это окно
cd /d "%~dp0"
if not defined TAROT_OPEN set TAROT_OPEN=1
echo Таро запускается. Это служебное окно, его нельзя закрывать, пока вы работаете.
echo Браузер откроется сам. Чтобы остановить Таро, просто закройте это окно.
echo.
:run
if not defined TAROT_OPEN set TAROT_OPEN=1
node.exe server.js
if %errorlevel% equ 42 (
  echo.
  echo Данные восстановлены. Перезапускаю Таро…
  set TAROT_OPEN=0
  goto run
)
echo.
echo Таро остановлено. Окно можно закрыть.
pause
