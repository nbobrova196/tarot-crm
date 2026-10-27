// Первичное наполнение справочника карт из seed/*.json.
// Выполняется один раз — когда таблица cards пуста, чтобы не перезатирать
// правки, сделанные вручную.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';

const seedDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed');

const insertCard = db.prepare(`
  INSERT INTO cards (
    slug, arcana, suit, rank, number, name_ru, name_en, image,
    element, astrology, keywords, upright, reversed, themes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

export function seedCards() {
  const existing = db.prepare('SELECT COUNT(*) AS n FROM cards').get().n;
  if (existing > 0) return { inserted: 0, total: existing };

  const files = readdirSync(seedDir).filter((file) => file.endsWith('.json')).sort();
  const cards = files.flatMap((file) =>
    JSON.parse(readFileSync(path.join(seedDir, file), 'utf8')),
  );

  db.exec('BEGIN');
  try {
    for (const card of cards) {
      insertCard.run(
        card.slug,
        card.arcana,
        card.suit,
        card.rank,
        card.number,
        card.name_ru,
        card.name_en,
        `cards/${card.slug}.jpg`,
        card.element,
        card.astrology,
        JSON.stringify(card.keywords ?? []),
        card.upright,
        card.reversed,
        JSON.stringify(card.themes ?? []),
      );
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return { inserted: cards.length, total: cards.length };
}
