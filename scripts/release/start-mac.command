#!/bin/bash
# Ярлык для запуска Таро на macOS и Linux.
cd "$(dirname "$0")" || exit 1

printf '\033]0;Таро — не закрывайте это окно\007'
echo "Таро запускается. Это служебное окно, его нельзя закрывать, пока вы работаете."
echo "Браузер откроется сам. Чтобы остановить Таро, просто закройте это окно."
echo

chmod +x ./node 2>/dev/null

TAROT_OPEN="${TAROT_OPEN:-1}"
while true; do
  TAROT_OPEN="$TAROT_OPEN" ./node server.js
  status=$?

  if [ "$status" -eq 42 ]; then
    echo
    echo "Данные восстановлены. Перезапускаю Таро…"
    TAROT_OPEN=0
    continue
  fi

  break
done

echo
if [ "$status" -ne 0 ]; then
  echo "Таро остановилось с ошибкой (код $status)."
  echo "Попробуйте запустить ещё раз. Если не помогает — напишите разработчику."
else
  echo "Таро остановлено. Окно можно закрыть."
fi

read -n 1 -s -r -p "Нажмите любую клавишу, чтобы закрыть…"
echo
