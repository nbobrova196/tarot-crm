@echo off
chcp 65001 >nul
title Таро — обновление
cd /d "%~dp0"

if not exist node.exe (
  echo Не найден файл node.exe. Это архив обновления, а не полная установка.
  echo Для первой установки скачайте полный архив с сайта.
  echo.
  pause
  exit /b 1
)

node.exe update.js
if errorlevel 1 (
  echo.
  echo Обновление не завершено. Записи в папке data не тронуты.
  echo Попробуйте ещё раз или напишите на tarot.feedback@mail.ru.
  echo.
  pause
)
