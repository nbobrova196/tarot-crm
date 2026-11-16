// Обновление Таро из архива обновления.
//
// Архив обновления распаковывается поверх папки «Таро»: рядом с data
// появляются папка update/ и этот файл. Скрипт делает резервную копию базы,
// заменяет файлы приложения и запускает новую версию.
//
// Папку data он не трогает: все записи остаются на месте.

import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import readline from 'node:readline/promises';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const updateDir = path.join(rootDir, 'update');
const dataDir = path.join(rootDir, 'data');
const backupDir = path.join(dataDir, 'backups');
const dbFile = path.join(dataDir, 'tarot.db');

const interactive = !process.env.TAROT_UPDATE_YES;
const launchAfterUpdate = !process.env.TAROT_UPDATE_NO_LAUNCH;

function pause(message) {
  if (!interactive) return Promise.resolve();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return rl.question(message).finally(() => rl.close());
}

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');
}

function quoteSql(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function backupDatabase() {
  if (!existsSync(dbFile)) return null;

  await mkdir(backupDir, { recursive: true });
  let name = `tarot-before-update-${timestamp()}.db`;
  let target = path.join(backupDir, name);
  let attempt = 1;
  while (existsSync(target)) {
    attempt += 1;
    name = `tarot-before-update-${timestamp()}-${attempt}.db`;
    target = path.join(backupDir, name);
  }

  const db = new DatabaseSync(dbFile);
  try {
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    db.exec(`VACUUM INTO ${quoteSql(target)}`);
  } finally {
    db.close();
  }

  return name;
}

async function copyPayload() {
  const entries = await readdir(updateDir);
  for (const entry of entries) {
    await cp(
      path.join(updateDir, entry),
      path.join(rootDir, entry),
      { recursive: true, force: true },
    );
  }
}

async function cleanup() {
  await rm(updateDir, { recursive: true, force: true });
  for (const name of ['update.js', 'Обновить Таро.command', 'Обновить Таро.bat']) {
    try {
      await rm(path.join(rootDir, name), { force: true });
    } catch {
      // На Windows запущенный файл может быть занят — это не мешает работе.
    }
  }
}

function launchApp() {
  const command = process.platform === 'darwin'
    ? 'open'
    : process.platform === 'win32'
      ? 'cmd'
      : 'bash';
  const args = process.platform === 'darwin'
    ? [path.join(rootDir, 'Запустить Таро.command')]
    : process.platform === 'win32'
      ? ['/c', 'start', '', 'Запустить Таро.bat']
      : [path.join(rootDir, 'Запустить Таро.command')];

  const child = spawn(command, args, {
    cwd: rootDir,
    detached: true,
    stdio: 'ignore',
  });
  child.on('error', () => {});
  child.unref();
}

async function main() {
  if (!existsSync(updateDir)) {
    throw new Error(
      'Не найдена папка update. Распакуйте архив обновления поверх папки «Таро» '
      + 'и запустите «Обновить Таро» ещё раз.',
    );
  }

  if (!existsSync(path.join(rootDir, 'node'))) {
    throw new Error(
      'Не найден файл node. Похоже, это не папка установленного Таро. '
      + 'Для первой установки скачайте полный архив.',
    );
  }

  console.log('Обновление Таро');
  console.log();
  console.log('Сначала закройте служебное окно Таро — то, где написано «не закрывайте».');
  console.log('Браузер можно оставить открытым.');
  await pause('Когда приложение закрыто, нажмите Enter…');
  console.log();

  let backup = null;
  try {
    backup = await backupDatabase();
  } catch (error) {
    throw new Error(
      'Не удалось сохранить резервную копию базы. '
      + 'Закройте окно Таро и запустите обновление ещё раз.\n'
      + `Подробности: ${error.message}`,
    );
  }

  if (backup) {
    console.log(`Резервная копия: data/backups/${backup}`);
  } else {
    console.log('База пока пустая — резервная копия не нужна.');
  }

  await copyPayload();
  console.log('Файлы обновлены. Папка data не тронута.');

  await cleanup();

  if (launchAfterUpdate) {
    console.log('Запускаю Таро…');
    launchApp();
  } else {
    console.log('Готово. Запустите Таро ярлыком «Запустить Таро».');
  }
}

main().catch(async (error) => {
  console.error();
  console.error('Обновление не завершено.');
  console.error(error?.message ?? String(error));
  console.error('Записи в папке data не изменены.');
  if (interactive) await pause('Нажмите Enter, чтобы закрыть…');
  process.exitCode = 1;
});
