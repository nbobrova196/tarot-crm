// Скачивание изображений колоды Rider–Waite–Smith с Wikimedia Commons.
// Колода опубликована в 1909 году и находится в общественном достоянии.
//
// Запуск:  node scripts/fetch-images.js [--force]
//   --force  перекачать уже существующие файлы

import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const seedDir = path.join(rootDir, 'seed');
const outDir = path.join(rootDir, 'public', 'cards');
const force = process.argv.includes('--force');
const width = 400;
const delayMs = 120;

mkdirSync(outDir, { recursive: true });

const cards = readdirSync(seedDir)
  .filter((file) => file.endsWith('.json'))
  .sort()
  .flatMap((file) => JSON.parse(readFileSync(path.join(seedDir, file), 'utf8')));

let downloaded = 0;
let skipped = 0;
const failed = [];

for (const card of cards) {
  const target = path.join(outDir, `${card.slug}.jpg`);

  if (!force && existsSync(target) && statSync(target).size > 1000) {
    skipped += 1;
    continue;
  }

  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(card.source)}?width=${width}`;

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'tarot-crm/0.1 (local tarot journal; educational use)' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) throw new Error(`не изображение: ${contentType}`);

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 1000) throw new Error('слишком маленький файл');

    writeFileSync(target, buffer);
    downloaded += 1;
    console.log(`✓ ${card.slug} (${Math.round(buffer.length / 1024)} КБ)`);
  } catch (error) {
    failed.push(`${card.slug}: ${error.message}`);
    console.error(`✗ ${card.slug}: ${error.message}`);
  }

  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

console.log('');
console.log(`Скачано: ${downloaded}, уже было: ${skipped}, ошибок: ${failed.length} из ${cards.length}`);
if (failed.length > 0) {
  console.log('Проблемные карты:');
  for (const line of failed) console.log(`  - ${line}`);
  process.exitCode = 1;
}
