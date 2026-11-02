// Сборка портативных архивов для GitHub Releases.
//
// Внутри архива лежит папка «Таро» с самим приложением, официальным
// бинарником Node.js и ярлыком запуска. Человеку не нужно ничего
// устанавливать: распаковал и дважды щёлкнул.
//
// Запуск:
//   node scripts/build-release.mjs
//   node scripts/build-release.mjs mac-arm64 win-x64
//
// Версию Node можно закрепить через NODE_VERSION=v24.22.2.

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { chmod, cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));
const nodeVersion = process.env.NODE_VERSION ?? 'v24.22.2';
const cacheDir = path.join(rootDir, '.cache', 'node');
const distDir = path.join(rootDir, 'dist');
const templatesDir = path.join(rootDir, 'scripts', 'release');

const targets = {
  'mac-arm64': {
    nodePlatform: 'darwin-arm64',
    archive: 'tar.gz',
    binary: 'bin/node',
    launcher: 'start-mac.command',
    launcherName: 'Запустить Таро.command',
    label: 'macOS-AppleSilicon',
  },
  'mac-x64': {
    nodePlatform: 'darwin-x64',
    archive: 'tar.gz',
    binary: 'bin/node',
    launcher: 'start-mac.command',
    launcherName: 'Запустить Таро.command',
    label: 'macOS-Intel',
  },
  'win-x64': {
    nodePlatform: 'win-x64',
    archive: 'zip',
    binary: 'node.exe',
    launcher: 'start-win.bat',
    launcherName: 'Запустить Таро.bat',
    label: 'Windows',
  },
  'linux-x64': {
    nodePlatform: 'linux-x64',
    archive: 'tar.gz',
    binary: 'bin/node',
    launcher: 'start-mac.command',
    launcherName: 'Запустить Таро.command',
    label: 'Linux',
  },
};

const selected = process.argv.slice(2);
const names = selected.length > 0 ? selected : Object.keys(targets);
for (const name of names) {
  if (!targets[name]) {
    throw new Error(`Неизвестная цель «${name}». Доступно: ${Object.keys(targets).join(', ')}`);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} завершился с кодом ${result.status}`);
  }
}

async function download(url, file) {
  if (existsSync(file)) return;
  console.log(`Скачиваю ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Не удалось скачать ${url}: HTTP ${response.status}`);
  }
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
}

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

// Info-ZIP на macOS записывает имена в UTF-8, но не выставляет флаг UTF-8.
// Без этого флага Windows читает имена как CP866 и показывает «кракозябры».
// Проставляем бит 11 в локальных заголовках и центральном каталоге.
async function markZipUtf8(file) {
  const buffer = await readFile(file);
  const eocdSignature = 0x06054b50;
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 22 - 65535); i -= 1) {
    if (buffer.readUInt32LE(i) === eocdSignature) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error(`Не найден EOCD в ${file}`);

  const entries = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);

  for (let index = 0; index < entries; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error(`Повреждён центральный каталог ${file}`);
    }

    const flags = buffer.readUInt16LE(offset + 8);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength);

    let nonAscii = false;
    for (const byte of name) {
      if (byte >= 0x80) {
        nonAscii = true;
        break;
      }
    }

    if (nonAscii) {
      buffer.writeUInt16LE(flags | 0x800, offset + 8);
      if (buffer.readUInt32LE(localOffset) !== 0x04034b50) {
        throw new Error(`Повреждён локальный заголовок ${file}`);
      }
      buffer.writeUInt16LE(buffer.readUInt16LE(localOffset + 6) | 0x800, localOffset + 6);
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  await writeFile(file, buffer);
}

await mkdir(cacheDir, { recursive: true });
await mkdir(distDir, { recursive: true });

const shasumsFile = path.join(cacheDir, `SHASUMS256-${nodeVersion}.txt`);
await download(`https://nodejs.org/dist/${nodeVersion}/SHASUMS256.txt`, shasumsFile);
const shasums = await readFile(shasumsFile, 'utf8');

for (const name of names) {
  const target = targets[name];
  const archiveName = `node-${nodeVersion}-${target.nodePlatform}.${target.archive}`;
  const archiveFile = path.join(cacheDir, archiveName);
  await download(`https://nodejs.org/dist/${nodeVersion}/${archiveName}`, archiveFile);

  const expected = shasums
    .split('\n')
    .find((line) => line.trim().endsWith(`  ${archiveName}`))
    ?.split(/\s+/)[0];
  if (!expected) throw new Error(`В SHASUMS256.txt нет строки для ${archiveName}`);
  const actual = await sha256(archiveFile);
  if (actual !== expected) {
    throw new Error(`Контрольная сумма не совпала для ${archiveName}`);
  }

  const unpacked = path.join(cacheDir, `node-${nodeVersion}-${target.nodePlatform}`);
  if (!existsSync(unpacked)) {
    console.log(`Распаковываю ${archiveName}`);
    if (target.archive === 'zip') {
      run('unzip', ['-q', archiveFile, '-d', cacheDir]);
    } else {
      run('tar', ['-xzf', archiveFile, '-C', cacheDir]);
    }
  }

  const stageRoot = path.join(distDir, '.stage', name);
  const appDir = path.join(stageRoot, 'Таро');
  await rm(stageRoot, { recursive: true, force: true });
  await mkdir(appDir, { recursive: true });

  const appFiles = ['server.js', 'db.js', 'seed.js', 'package.json', 'README.md', 'РУКОВОДСТВО.md'];
  if (existsSync(path.join(rootDir, 'LICENSE'))) appFiles.push('LICENSE');

  for (const file of appFiles) {
    await cp(path.join(rootDir, file), path.join(appDir, file));
  }
  for (const dir of ['public', 'seed', 'docs']) {
    await cp(path.join(rootDir, dir), path.join(appDir, dir), { recursive: true });
  }

  const nodeBinaryName = target.binary === 'node.exe' ? 'node.exe' : 'node';
  const nodeBinary = path.join(unpacked, target.binary);
  if (!existsSync(nodeBinary)) {
    throw new Error(`В архиве Node не найден файл ${target.binary}`);
  }
  await cp(nodeBinary, path.join(appDir, nodeBinaryName));
  await chmod(path.join(appDir, nodeBinaryName), 0o755);

  let launcher = await readFile(path.join(templatesDir, target.launcher), 'utf8');
  if (target.launcherName.endsWith('.bat')) {
    launcher = launcher.replace(/\r?\n/g, '\r\n');
  }
  const launcherFile = path.join(appDir, target.launcherName);
  await writeFile(launcherFile, launcher);
  if (target.launcherName.endsWith('.command')) await chmod(launcherFile, 0o755);

  await cp(
    path.join(templatesDir, 'ПРОЧТИ МЕНЯ.txt'),
    path.join(appDir, 'ПРОЧТИ МЕНЯ.txt'),
  );

  const zipName = `Tarot-${pkg.version}-${target.label}.zip`;
  const zipFile = path.join(distDir, zipName);
  await rm(zipFile, { force: true });
  run('zip', ['-q', '-r', zipFile, 'Таро'], { cwd: stageRoot });
  await markZipUtf8(zipFile);

  const size = (await stat(zipFile)).size;
  console.log(`Готово: dist/${zipName} — ${(size / 1024 / 1024).toFixed(1)} МБ`);
}

await rm(path.join(distDir, '.stage'), { recursive: true, force: true });

const archives = (await readdir(distDir)).filter((file) => file.endsWith('.zip')).sort();
if (archives.length > 0) {
  const lines = [];
  for (const file of archives) {
    lines.push(`${await sha256(path.join(distDir, file))}  ${file}`);
  }
  await writeFile(path.join(distDir, 'SHA256SUMS.txt'), `${lines.join('\n')}\n`);
  console.log('Готово: dist/SHA256SUMS.txt');
}
