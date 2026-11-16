#!/bin/bash
# Обновление Таро на macOS и Linux.
cd "$(dirname "$0")" || exit 1

printf '\033]0;Таро — обновление\007'
echo "Обновление Таро. Это окно можно закрыть после завершения."
echo

if [ ! -x ./node ]; then
  echo "Не найден файл node. Это архив обновления, а не полная установка."
  echo "Для первой установки скачайте полный архив с сайта."
  echo
  read -n 1 -s -r -p "Нажмите любую клавишу, чтобы закрыть…"
  echo
  exit 1
fi

./node update.js
status=$?

echo
if [ "$status" -ne 0 ]; then
  echo "Обновление не завершено. Записи в папке data не тронуты."
  echo "Попробуйте ещё раз или напишите на tarot.feedback@mail.ru."
  echo
  read -n 1 -s -r -p "Нажмите любую клавишу, чтобы закрыть…"
  echo
fi
