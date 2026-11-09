# Публикация проекта на GitHub

Приложение остаётся локальным: GitHub хранит исходники и архивы релизов, но не
запускает сервер и не публикует вашу базу. Пользователи скачивают готовый архив
из раздела Releases и запускают его ярлыком; разработчик может запускать исходники
командой `node server.js`.

## Что уже сделано

- В папке `tarot-crm` создан локальный Git-репозиторий, ветка `main`.
- `.gitignore` исключает базу, резервные копии, `dist/` и `.cache/`.
- Добавлена лицензия MIT (`LICENSE`).
- Настроена сборка портативных архивов: `node scripts/build-release.mjs`.
- Добавлены шаблоны GitHub Issues для багов и идей.

Проверить состояние:

```bash
cd tarot-crm
git status
git log --oneline -1
```

## 1. Создайте пустой репозиторий на GitHub

**Если будете использовать GitHub Desktop** (вариант А ниже), этот раздел можно
пропустить: программа сама создаст репозиторий на GitHub кнопкой **Publish repository**.

1. Войдите на github.com.
2. Нажмите **New repository**.
3. Введите имя, например `tarot-crm`.
4. Выберите **Public** — иначе внешние пользователи не смогут открыть Issues
   и оставить отзыв.
5. **Не** добавляйте README, `.gitignore` и лицензию — они уже есть локально.
6. Нажмите **Create repository**.

## 2. Подключите удалённый репозиторий

Все настройки ниже — в **личном аккаунте**, а не в настройках репозитория.
Открыть их можно через аватар в правом верхнем углу → **Settings**.

### Вариант А. GitHub Desktop — без терминала (самый простой)

1. Установите GitHub Desktop: https://desktop.github.com
2. Войдите в свой аккаунт GitHub.
3. **File → Add local repository** → выберите папку `tarot-crm`.
4. Нажмите **Publish repository**.
   - Имя: `tarot-crm`.
   - Снимите галочку **Keep this code private**, если репозиторий должен быть публичным.
5. Код появится на GitHub. Дальше релиз с архивами оформляется на сайте.

Если пустой репозиторий уже создан на сайте, откройте в GitHub Desktop
**Repository → Repository settings → Remote** и укажите его адрес.

### Вариант Б. HTTPS (терминал, без SSH-ключей)

```bash
git remote add origin https://github.com/USERNAME/tarot-crm.git
```

При первом `push` Git попросит логин и пароль. Вместо пароля нужен **personal access
token**: откройте https://github.com/settings/tokens → **Generate new token (classic)**
→ права `repo`.

### Вариант В. SSH (если ключ уже настроен)

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

Затем на GitHub: аватар → **Settings** → в левом меню раздел **Access** →
**SSH and GPG keys** → **New SSH key**. Вставьте содержимое буфера обмена.

Прямая ссылка: https://github.com/settings/keys

Если раздела не видно, проверьте, что вы в личных настройках (аватар → Settings),
а не в настройках репозитория. Настройки репозитория — это вкладка **Settings**
внутри самого репозитория, SSH-ключей там нет.

## 3. Отправьте первый коммит

**Если выбрали GitHub Desktop**, этот шаг уже выполнен кнопкой **Publish repository** —
переходите к разделу 4.

**Если выбрали HTTPS или SSH**, выполните в терминале:

```bash
git push -u origin main
```

`-u` связывает локальную ветку `main` с удалённой, чтобы потом хватало просто `git push`.

## 4. Проверьте результат

```bash
git remote -v
git status
```

На GitHub должны появиться файлы проекта, но **не** `data/tarot.db`. Откройте страницу
репозитория в браузере и убедитесь, что видите `README.md`, `server.js` и папку `public`.

## 5. Дальнейшая работа

**В GitHub Desktop**: изменения появятся на вкладке **Changes** → впишите описание
→ **Commit to main** → **Push origin**.

**В терминале**, после изменений в коде:

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

## Релиз v0.1 с готовыми архивами

В релиз кладём не исходники, а портативные архивы: внутри лежит Node.js и ярлык
запуска, поэтому человеку не нужно ничего устанавливать.

### 0. Укажите адрес репозитория

В `package.json` замените `USERNAME` на ваш логин GitHub:

```json
"repository": "https://github.com/ваш-логин/tarot-crm"
```

От этого адреса зависят кнопки «Сообщить о проблеме» и «Предложить идею» в разделе
«Сообщения разработчику». Пока стоит `USERNAME`, кнопки просто не показываются.
После замены пересоберите архивы.

### 1. Соберите архивы

```bash
cd tarot-crm
node scripts/build-release.mjs
```

Получится:

```
dist/Tarot-0.1.1-macOS-AppleSilicon.zip
dist/Tarot-0.1.1-macOS-Intel.zip
dist/Tarot-0.1.1-Windows.zip
dist/Tarot-0.1.1-Linux.zip      # если собирали linux-x64
dist/SHA256SUMS.txt
```

Архивы и скачанные бинарники Node в Git не попадают: `dist/` и `.cache/` есть
в `.gitignore`. Их нужно прикрепить к релизу на GitHub.

### 2. Проверьте сборку

Минимум — распакуйте архив, запустите ярлык и убедитесь, что открывается
`http://localhost:3000`. Сборки для Windows и Intel-Mac лучше проверить
на подходящей машине.

### 3. Создайте тег

```bash
git tag -a v0.1.1 -m "Таро v0.1.1"
git push origin v0.1.1
```

### 4. Прикрепите архивы к релизу

Через сайт GitHub: **Releases → Draft a new release** → выберите тег `v0.1.1`,
заголовок «Таро v0.1», опишите изменения и перетащите файлы из `dist/`.

Через GitHub CLI:

```bash
gh release create v0.1.1 dist/*.zip dist/SHA256SUMS.txt \
  --title "Таро v0.1" \
  --notes "Первый публичный выпуск. Скачайте архив для своей системы и распакуйте его."
```

После публикации ссылка `../../releases` в README начнёт вести на страницу релизов.

### 5. Обновление версии

Перед новой сборкой поменяйте `version` в `package.json` — имя архивов возьмётся
оттуда. Пользователям пишите: «замените все файлы, кроме папки `data`».
