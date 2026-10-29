// Подключение к SQLite и схема базы.
// Схема версионируется через PRAGMA user_version: при каждом изменении
// структуры увеличиваем SCHEMA_VERSION и добавляем блок миграции.

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(rootDir, 'data');
mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.TAROT_DB ?? path.join(dataDir, 'tarot.db');

export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA busy_timeout = 5000');

export const SCHEMA_VERSION = 6;

const schemaV1 = `
CREATE TABLE IF NOT EXISTS cards (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  arcana      TEXT NOT NULL CHECK (arcana IN ('major', 'minor')),
  suit        TEXT CHECK (suit IN ('wands', 'cups', 'swords', 'pentacles')),
  rank        TEXT,
  number      INTEGER,
  name_ru     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  image       TEXT,
  element     TEXT,
  astrology   TEXT,
  keywords    TEXT,
  upright     TEXT,
  reversed    TEXT,
  themes      TEXT,
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clients (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  contact     TEXT,
  birth_date  TEXT,
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS readings (
  id             INTEGER PRIMARY KEY,
  client_id      INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  title          TEXT,
  question       TEXT,
  spread_name    TEXT,
  reading_date   TEXT NOT NULL DEFAULT (date('now')),
  status         TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'done', 'archived')),
  interpretation TEXT,
  summary        TEXT,
  tags           TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reading_cards (
  id             INTEGER PRIMARY KEY,
  reading_id     INTEGER NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
  card_id        INTEGER NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
  position_index INTEGER NOT NULL,
  position_name  TEXT,
  is_reversed    INTEGER NOT NULL DEFAULT 0,
  note           TEXT,
  UNIQUE (reading_id, position_index)
);

CREATE TABLE IF NOT EXISTS journal (
  id          INTEGER PRIMARY KEY,
  entry_date  TEXT NOT NULL DEFAULT (date('now')),
  title       TEXT,
  body        TEXT,
  card_id     INTEGER REFERENCES cards(id) ON DELETE SET NULL,
  reading_id  INTEGER REFERENCES readings(id) ON DELETE SET NULL,
  client_id   INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  tags        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cards_suit        ON cards(suit, number);
CREATE INDEX IF NOT EXISTS idx_readings_date     ON readings(reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_readings_client   ON readings(client_id);
CREATE INDEX IF NOT EXISTS idx_reading_cards     ON reading_cards(reading_id, position_index);
CREATE INDEX IF NOT EXISTS idx_journal_date      ON journal(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_client    ON journal(client_id);
`;

const currentVersion = db.prepare('PRAGMA user_version').get().user_version;

if (currentVersion < 1) {
  db.exec('BEGIN');
  try {
    db.exec(schemaV1);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// Версия 3: справочник своих трактовок.
// У карты может быть сколько угодно личных трактовок — отдельно для прямого
// и перевёрнутого положения. Исходные тексты (upright/reversed) не меняются.
// Старые одиночные поля upright_personal/reversed_personal переносятся в новую
// таблицу и удаляются.
const schemaV3 = `
CREATE TABLE IF NOT EXISTS card_interpretations (
  id          INTEGER PRIMARY KEY,
  card_id     INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  orientation TEXT NOT NULL CHECK (orientation IN ('upright', 'reversed')),
  title       TEXT,
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_card_interp ON card_interpretations(card_id, orientation);
`;

if (currentVersion < 3) {
  db.exec('BEGIN');
  try {
    db.exec(schemaV3);

    const columns = new Set(
      db.prepare('PRAGMA table_info(cards)').all().map((column) => column.name),
    );

    if (columns.has('upright_personal') || columns.has('reversed_personal')) {
      const select = ['id'];
      if (columns.has('upright_personal')) select.push('upright_personal');
      if (columns.has('reversed_personal')) select.push('reversed_personal');

      const rows = db.prepare(`SELECT ${select.join(', ')} FROM cards`).all();
      const insert = db.prepare(`
        INSERT INTO card_interpretations (card_id, orientation, title, body)
        VALUES (?, ?, NULL, ?)
      `);

      for (const row of rows) {
        if (row.upright_personal) insert.run(row.id, 'upright', row.upright_personal);
        if (row.reversed_personal) insert.run(row.id, 'reversed', row.reversed_personal);
      }

      if (columns.has('upright_personal')) {
        db.exec('ALTER TABLE cards DROP COLUMN upright_personal');
      }
      if (columns.has('reversed_personal')) {
        db.exec('ALTER TABLE cards DROP COLUMN reversed_personal');
      }
    }

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// Версия 4: выбор своей трактовки для карты в раскладе.
// Ссылка на запись справочника; если трактовку удалить, у расклада останется
// только сама карта (ON DELETE SET NULL).
if (currentVersion < 4) {
  const columns = new Set(
    db.prepare('PRAGMA table_info(reading_cards)').all().map((column) => column.name),
  );

  db.exec('BEGIN');
  try {
    if (!columns.has('interpretation_id')) {
      db.exec(`
        ALTER TABLE reading_cards
        ADD COLUMN interpretation_id INTEGER REFERENCES card_interpretations(id) ON DELETE SET NULL
      `);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// Версия 5: события и их связь с раскладами.
// Событие живёт отдельно от расклада: один расклад может быть связан с
// несколькими событиями и наоборот. При удалении события или расклада
// удаляются только связи, сами записи остаются.
const schemaV5 = `
CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  planned_date  TEXT,
  actual_date   TEXT,
  status        TEXT NOT NULL DEFAULT 'planned'
                CHECK (status IN ('planned', 'in_progress', 'done', 'cancelled', 'archived')),
  result        TEXT,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reading_events (
  reading_id  INTEGER NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
  event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (reading_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_events_date     ON events(planned_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_status   ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_reading_events  ON reading_events(event_id);
`;

if (currentVersion < 5) {
  db.exec('BEGIN');
  try {
    db.exec(schemaV5);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

// Версия 6: итоги раскладов и история трактовок.
// Итог можно записывать несколько раз: каждая запись — новая версия оценки,
// последняя считается актуальной. Первоначальная трактовка сохраняется
// отдельным снимком и больше не перезаписывается.
const schemaV6 = `
CREATE TABLE IF NOT EXISTS outcome_reviews (
  id                      INTEGER PRIMARY KEY,
  reading_id              INTEGER NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
  event_id                INTEGER REFERENCES events(id) ON DELETE SET NULL,
  result                  TEXT,
  rating                  TEXT NOT NULL DEFAULT 'pending'
                          CHECK (rating IN ('matched', 'partial', 'not_matched', 'insufficient', 'pending')),
  comment                 TEXT,
  reviewed_at             TEXT NOT NULL DEFAULT (date('now')),
  follow_up_date          TEXT,
  followup_interpretation TEXT,
  confidence              TEXT CHECK (confidence IS NULL OR confidence IN ('low', 'medium', 'high')),
  created_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reading_versions (
  id             INTEGER PRIMARY KEY,
  reading_id     INTEGER NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
  kind           TEXT NOT NULL CHECK (kind IN ('initial', 'update', 'final')),
  interpretation TEXT,
  summary        TEXT,
  comment        TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_outcomes_reading ON outcome_reviews(reading_id, reviewed_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_outcomes_event   ON outcome_reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_versions_reading ON reading_versions(reading_id, id);
`;

if (currentVersion < 6) {
  db.exec('BEGIN');
  try {
    db.exec(schemaV6);

    // Для уже завершённых раскладов сохраняем текущий текст как первоначальный
    // снимок: иначе история начнётся только со следующей правки.
    db.exec(`
      INSERT INTO reading_versions (reading_id, kind, interpretation, summary, comment)
      SELECT r.id, 'initial', r.interpretation, r.summary, 'Снимок при обновлении приложения'
      FROM readings r
      WHERE r.status = 'done'
        AND (r.interpretation IS NOT NULL OR r.summary IS NOT NULL)
        AND NOT EXISTS (
          SELECT 1 FROM reading_versions v
          WHERE v.reading_id = r.id AND v.kind = 'initial'
        )
    `);

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

if (currentVersion < SCHEMA_VERSION) {
  db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

export function nowIso() {
  return new Date().toISOString();
}

export function getStats() {
  const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
  return {
    cards: count('cards'),
    clients: count('clients'),
    readings: count('readings'),
    journal: count('journal'),
    events: count('events'),
  };
}

export const dbFile = dbPath;
