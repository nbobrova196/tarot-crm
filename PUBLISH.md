# Публикация проекта на GitHub

Приложение остаётся локальным: GitHub хранит исходники, но не запускает сервер и не
публикует вашу базу. После `git push` проект просто появляется в удалённом репозитории;
запускать его по-прежнему нужно командой `node server.js` на этом компьютере.

## Что уже сделано

- В папке `tarot-crm` создан локальный Git-репозиторий.
- Ветка называется `main`.
- Первый коммит: `77111fe` — код, документация, справочник карт и изображения.
- В `.gitignore` добавлены `data/*.db`, `data/*.db-wal`, `data/*.db-shm`, `.DS_Store`
  и `node_modules/`. Личная база в репозиторий не попадает.
- Автор коммита указан как `nbobrova <nbobrova@localhost>`.

Проверить состояние:

```bash
cd "/Users/nbobrova/vibeCoding/Проект по умолчанию/tarot-crm"
git status
git log --oneline -1
```

## 1. Создайте пустой репозиторий на GitHub

1. Войдите на github.com.
2. Нажмите **New repository**.
3. Введите имя, например `tarot-crm`.
4. Выберите **Private**, если не хотите показывать проект всем.
5. **Не** добавляйте README, `.gitignore` и лицензию — они уже есть локально.
6. Нажмите **Create repository**.

## 2. Подключите удалённый репозиторий

Скопируйте адрес репозитория со страницы GitHub. Дальше выберите один вариант.

### Вариант А. SSH (удобно, если ключ уже настроен)

```bash
git remote add origin git@github.com:USERNAME/tarot-crm.git
```

Проверка, что SSH работает:

```bash
ssh -T git@github.com
```

Если ключа нет, создайте его:

```bash
ssh-keygen -t ed25519 -C "you@example.com"
pbcopy < ~/.ssh/id_ed25519.pub
```

Затем на GitHub: **Settings → SSH and GPG keys → New SSH key**, вставьте содержимое
из буфера обмена.

### Вариант Б. HTTPS (проще, но нужен токен)

```bash
git remote add origin https://github.com/USERNAME/tarot-crm.git
```

При первом `push` Git попросит логин и пароль. Вместо пароля нужен **personal access
token**: GitHub → **Settings → Developer settings → Personal access tokens → Tokens
(classic)** → **Generate new token**, права `repo`.

## 3. Отправьте первый коммит

```bash
git push -u origin main
```

`-u` связывает локальную ветку `main` с удалённой, чтобы потом хватало просто `git push`.

## 4. Проверьте результат

```bash
git remote -v
git status
```

На GitHub должны появиться файлы проекта, но **не** `data/tarot.db`.

## 5. Дальнейшая работа

После изменений в коде:

```bash
git add -A
git commit -m "Коротко, что изменилось"
git push
```

Полезные команды:

```bash
git status                 # что изменено
git diff                   # изменения до коммита
git log --oneline -10      # последние коммиты
git restore файл           # отменить правки в файле
```

## Если нужно поменять автора коммитов

```bash
git config user.name "Ваше имя"
git config user.email "you@example.com"
```

Это меняет автора только для следующих коммитов. Уже созданный коммит можно переписать,
но для первого публичного репозитория это не обязательно.

## Что не попадает в репозиторий

- `data/tarot.db`, `data/tarot.db-wal`, `data/tarot.db-shm` — личные данные.
- `.DS_Store` — служебный файл macOS.
- `node_modules/` — зависимостей у проекта нет, но правило на будущее.

Если случайно добавили базу в индекс, уберите её:

```bash
git rm --cached data/tarot.db data/tarot.db-wal data/tarot.db-shm
```

## Частые проблемы

**`Permission denied (publickey)`** — не настроен SSH-ключ. Проверьте `ssh -T git@github.com`
или используйте HTTPS-вариант.

**`Authentication failed`** — для HTTPS нужен токен, а не пароль от GitHub.

**`src refspec main does not match any`** — вы ещё не сделали коммит или ветка называется
иначе. Проверьте `git branch --show-current` и `git log --oneline -1`.

**`repository not found`** — неверный адрес, репозиторий приватный или у токена нет прав
`repo`.

**`failed to push some refs`** — на GitHub уже есть коммиты (например, вы создали
репозиторий с README). Сначала выполните `git pull --rebase origin main`, затем `git push`.

## Резервная копия данных

Git хранит код, но не вашу практику. Базу копируйте отдельно:

```bash
# при остановленном сервере
cp data/tarot.db ~/Desktop/tarot-backup-$(date +%F).db
```

Если сервер запущен, копируйте все три файла: `tarot.db`, `tarot.db-wal`, `tarot.db-shm`.
