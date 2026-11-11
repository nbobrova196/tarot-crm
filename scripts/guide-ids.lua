-- Добавляет номер раздела к якорям заголовков: «## 1. Запуск…» → id="1-запуск…".
-- Так ссылки в ручном содержании руководства работают и в PDF.

function Header(el)
  local text = pandoc.utils.stringify(el.content)
  local number = text:match('^(%d+)%.')
  if number and el.identifier ~= '' then
    el.identifier = number .. '-' .. el.identifier
  end
  return el
end
