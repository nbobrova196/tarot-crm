// HTTP-сервер: отдаёт интерфейс из public/ и JSON-API по адресам /api/*.
// Новые разделы добавляются в массив routes.

import http from 'node:http';
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCHEMA_VERSION, db, dbFile, getStats } from './db.js';
import { seedCards } from './seed.js';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(rootDir, 'public');
const backupDir = path.join(path.dirname(dbFile), 'backups');
const firstPort = Number(process.env.PORT ?? 3000);

// Версия и адрес репозитория нужны интерфейсу: по ним строится ссылка
// на GitHub Issues для публичных отзывов.
const pkg = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const CARD_ORDER = `
  ORDER BY
    CASE arcana WHEN 'major' THEN 0 ELSE 1 END,
    CASE suit
      WHEN 'wands' THEN 0
      WHEN 'cups' THEN 1
      WHEN 'swords' THEN 2
      WHEN 'pentacles' THEN 3
      ELSE 4
    END,
    number
`;

function parseCard(row) {
  return {
    ...row,
    keywords: safeJson(row.keywords),
    themes: safeJson(row.themes),
  };
}

function interpretationsByCard(cardIds) {
  if (cardIds.length === 0) return new Map();

  const placeholders = cardIds.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT * FROM card_interpretations
    WHERE card_id IN (${placeholders})
    ORDER BY
      CASE orientation WHEN 'upright' THEN 0 ELSE 1 END,
      created_at,
      id
  `).all(...cardIds);

  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.card_id)) map.set(row.card_id, []);
    map.get(row.card_id).push(row);
  }
  return map;
}

function withInterpretations(card, map) {
  const interpretations = map.get(card.id) ?? [];
  return {
    ...card,
    interpretations,
    has_personal: interpretations.length > 0 || Boolean(card.notes),
  };
}

function safeJson(value) {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function httpError(message, status) {
  return Object.assign(new Error(message), { status });
}

function readJsonBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(httpError('Слишком большой запрос', 413));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(httpError('Некорректные данные в запросе', 400));
      }
    });

    req.on('error', reject);
  });
}

function normalizeClient(input) {
  const name = String(input?.name ?? '').trim();
  if (!name) throw httpError('Укажите имя клиента', 400);
  if (name.length > 200) throw httpError('Имя слишком длинное (максимум 200 символов)', 400);

  const contact = String(input?.contact ?? '').trim();
  if (contact.length > 300) throw httpError('Контакт слишком длинный (максимум 300 символов)', 400);

  const birthDate = String(input?.birth_date ?? '').trim();
  if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw httpError('Дата рождения должна быть в формате ГГГГ-ММ-ДД', 400);
  }

  const notes = String(input?.notes ?? '').trim();
  if (notes.length > 5000) throw httpError('Заметки слишком длинные (максимум 5000 символов)', 400);

  return {
    name,
    contact: contact || null,
    birth_date: birthDate || null,
    notes: notes || null,
  };
}

const READING_STATUSES = ['draft', 'done', 'archived'];

function limitText(value, max, field) {
  const text = String(value ?? '').trim();
  if (text.length > max) {
    throw httpError(`Поле «${field}» слишком длинное (максимум ${max} символов)`, 400);
  }
  return text;
}

const CARD_ORIENTATIONS = ['upright', 'reversed'];

// Пока ограничиваем тексты расклада двумя тысячами символов.
const READING_TEXT_MAX = 2000;

// Своя трактовка карты — до тысячи символов.
const CARD_INTERPRETATION_TEXT_MAX = 1000;

// Запись дневника: заголовок короткий, текст — до трёх тысяч символов.
const JOURNAL_TITLE_MAX = 200;
const JOURNAL_TEXT_MAX = 3000;
const JOURNAL_TAG_MAX = 40;
const JOURNAL_TAGS_MAX = 20;

const EVENT_STATUSES = ['planned', 'in_progress', 'done', 'cancelled', 'archived'];
const EVENT_TITLE_MAX = 200;
const EVENT_CATEGORY_MAX = 100;
const EVENT_TEXT_MAX = 5000;

const OUTCOME_RATINGS = ['matched', 'partial', 'not_matched', 'insufficient', 'pending'];
const OUTCOME_TEXT_MAX = 5000;
const OUTCOME_CONFIDENCES = ['low', 'medium', 'high'];

const FEEDBACK_TOPICS = ['bug', 'inaccuracy', 'suggestion', 'other'];
const FEEDBACK_MESSAGE_MAX = 5000;
const FEEDBACK_PAGE_MAX = 500;
const FEEDBACK_PAGE_TITLE_MAX = 300;
const FEEDBACK_USER_AGENT_MAX = 500;

const DAILY_ORIENTATIONS = ['upright', 'reversed'];

function normalizeInterpretation(input) {
  const orientation = String(input?.orientation ?? 'upright').trim() || 'upright';
  if (!CARD_ORIENTATIONS.includes(orientation)) {
    throw httpError('Положение карты должно быть «прямое» или «перевёрнутое»', 400);
  }

  const title = limitText(input?.title ?? '', 200, 'Название');
  const body = limitText(input?.body ?? '', CARD_INTERPRETATION_TEXT_MAX, 'Трактовка');
  if (!body) throw httpError('Трактовка не может быть пустой', 400);

  const spreadName = limitText(input?.spread_name ?? '', 120, 'Расклад') || null;

  return { orientation, title: title || null, body, spread_name: spreadName };
}

function todayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function normalizeReading(input) {
  const readingDate = String(input?.reading_date ?? '').trim() || todayIso();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(readingDate)) {
    throw httpError('Дата расклада должна быть в формате ГГГГ-ММ-ДД', 400);
  }

  let clientId = null;
  const rawClientId = input?.client_id;
  if (rawClientId !== null && rawClientId !== undefined && rawClientId !== '') {
    clientId = Number(rawClientId);
    if (!Number.isInteger(clientId) || clientId <= 0) {
      throw httpError('Неверный идентификатор клиента', 400);
    }
    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId);
    if (!client) throw httpError('Клиент не найден', 400);
  }

  const status = String(input?.status ?? 'draft').trim() || 'draft';
  if (!READING_STATUSES.includes(status)) {
    throw httpError('Неизвестный статус расклада', 400);
  }

  const spreadName = limitText(input?.spread_name, 100, 'тип расклада') || null;

  const rawCards = input?.cards ?? [];
  if (!Array.isArray(rawCards)) throw httpError('Список карт должен быть массивом', 400);
  if (rawCards.length > 25) throw httpError('Слишком много карт в раскладе (максимум 25)', 400);

  const findCard = db.prepare('SELECT id FROM cards WHERE id = ?');
  const findInterpretation = db.prepare('SELECT id, card_id, orientation, spread_name FROM card_interpretations WHERE id = ?');

  const cards = rawCards.map((item, index) => {
    const cardId = Number(item?.card_id);
    if (!Number.isInteger(cardId) || cardId <= 0) {
      throw httpError(`Карта №${index + 1}: неверный идентификатор`, 400);
    }
    if (!findCard.get(cardId)) {
      throw httpError(`Карта №${index + 1} не найдена`, 400);
    }

    const positionIndex = item?.position_index === undefined
      ? index + 1
      : Number(item.position_index);
    if (!Number.isInteger(positionIndex) || positionIndex < 1) {
      throw httpError(`Карта №${index + 1}: неверный номер позиции`, 400);
    }

    const isReversed = item?.is_reversed ? 1 : 0;

    let interpretationId = null;
    const rawInterpretationId = item?.interpretation_id;
    if (rawInterpretationId !== null && rawInterpretationId !== undefined && rawInterpretationId !== '') {
      interpretationId = Number(rawInterpretationId);
      if (!Number.isInteger(interpretationId) || interpretationId <= 0) {
        throw httpError(`Карта №${index + 1}: неверная трактовка`, 400);
      }
      const interpretation = findInterpretation.get(interpretationId);
      if (!interpretation) {
        throw httpError(`Карта №${index + 1}: трактовка не найдена`, 400);
      }
      if (interpretation.card_id !== cardId) {
        throw httpError(`Карта №${index + 1}: трактовка относится к другой карте`, 400);
      }
      if (interpretation.orientation !== (isReversed ? 'reversed' : 'upright')) {
        throw httpError(`Карта №${index + 1}: трактовка не подходит к положению карты`, 400);
      }
      if (interpretation.spread_name && interpretation.spread_name !== spreadName) {
        throw httpError(`Карта №${index + 1}: трактовка относится к другому раскладу`, 400);
      }
    }

    return {
      card_id: cardId,
      position_index: positionIndex,
      position_name: limitText(item?.position_name, 120, 'позиция') || null,
      is_reversed: isReversed,
      interpretation_id: interpretationId,
      note: limitText(item?.note, 2000, 'заметка к карте') || null,
    };
  });

  if (new Set(cards.map((card) => card.position_index)).size !== cards.length) {
    throw httpError('Номера позиций карт не должны повторяться', 400);
  }

  return {
    reading: {
      client_id: clientId,
      title: limitText(input?.title, 200, 'заголовок') || null,
      question: limitText(input?.question, 1000, 'вопрос') || null,
      spread_name: spreadName,
      reading_date: readingDate,
      status,
      interpretation: limitText(input?.interpretation, READING_TEXT_MAX, 'трактовка') || null,
      summary: limitText(input?.summary, READING_TEXT_MAX, 'выводы') || null,
    },
    cards,
  };
}

const insertReadingCard = db.prepare(`
  INSERT INTO reading_cards
    (reading_id, card_id, position_index, position_name, is_reversed, interpretation_id, note)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

function withTransaction(callback) {
  db.exec('BEGIN');
  try {
    const result = callback();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function replaceReadingCards(readingId, cards) {
  db.prepare('DELETE FROM reading_cards WHERE reading_id = ?').run(readingId);
  for (const card of cards) {
    insertReadingCard.run(
      readingId,
      card.card_id,
      card.position_index,
      card.position_name,
      card.is_reversed,
      card.interpretation_id ?? null,
      card.note,
    );
  }
}

function getReadingDetail(id) {
  const reading = db.prepare(`
    SELECT r.*, c.name AS client_name
    FROM readings r
    LEFT JOIN clients c ON c.id = r.client_id
    WHERE r.id = ?
  `).get(id);

  if (!reading) throw httpError('Расклад не найден', 404);

  const cards = db.prepare(`
    SELECT
      rc.id AS reading_card_id,
      rc.position_index,
      rc.position_name,
      rc.is_reversed,
      rc.interpretation_id,
      rc.note,
      ci.title AS interpretation_title,
      ci.body AS interpretation_body,
      c.id AS card_id,
      c.slug,
      c.name_ru,
      c.name_en,
      c.image,
      c.arcana,
      c.suit,
      c.upright,
      c.reversed
    FROM reading_cards rc
    JOIN cards c ON c.id = rc.card_id
    LEFT JOIN card_interpretations ci ON ci.id = rc.interpretation_id
    WHERE rc.reading_id = ?
    ORDER BY rc.position_index
  `).all(id);

  const events = db.prepare(`
    SELECT
      e.id,
      e.title,
      e.category,
      e.planned_date,
      e.actual_date,
      e.status,
      e.result
    FROM reading_events re
    JOIN events e ON e.id = re.event_id
    WHERE re.reading_id = ?
    ORDER BY COALESCE(e.actual_date, e.planned_date) DESC, e.id DESC
  `).all(id);

  const outcomes = db.prepare(`
    SELECT o.*, e.title AS event_title
    FROM outcome_reviews o
    LEFT JOIN events e ON e.id = o.event_id
    WHERE o.reading_id = ?
    ORDER BY o.reviewed_at DESC, o.id DESC
  `).all(id);

  const positionOutcomes = db.prepare(`
    SELECT po.*, e.title AS event_title
    FROM position_outcomes po
    LEFT JOIN events e ON e.id = po.event_id
    WHERE po.reading_id = ?
    ORDER BY po.position_index, po.reviewed_at DESC, po.id DESC
  `).all(id);

  const versions = db.prepare(`
    SELECT *
    FROM reading_versions
    WHERE reading_id = ?
    ORDER BY id
  `).all(id);

  return {
    ...reading,
    cards,
    events,
    outcomes,
    outcome: outcomes[0] ?? null,
    position_outcomes: positionOutcomes,
    versions,
  };
}

/* ---------- Дневник ---------- */

const JOURNAL_SELECT = `
  SELECT
    j.*,
    c.name AS client_name,
    r.title AS reading_title,
    r.reading_date AS reading_date,
    card.name_ru AS card_name_ru,
    card.name_en AS card_name_en,
    card.image AS card_image
  FROM journal j
  LEFT JOIN clients c ON c.id = j.client_id
  LEFT JOIN readings r ON r.id = j.reading_id
  LEFT JOIN cards card ON card.id = j.card_id
`;

function parseJournalTags(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((tag) => String(tag).trim()).filter(Boolean);
    }
  } catch {
    // старые записи могли хранить теги строкой через запятую
  }
  return String(value)
    .split(/[,;]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeJournalTags(value) {
  const raw = Array.isArray(value)
    ? value
    : String(value ?? '').split(/[,;]/);

  const tags = [];
  const seen = new Set();

  for (const item of raw) {
    const tag = String(item ?? '').trim().replace(/^#+/, '').trim();
    if (!tag) continue;
    if (tag.length > JOURNAL_TAG_MAX) {
      throw httpError(`Тег «${tag.slice(0, JOURNAL_TAG_MAX)}…» слишком длинный (максимум ${JOURNAL_TAG_MAX} символов)`, 400);
    }
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }

  if (tags.length > JOURNAL_TAGS_MAX) {
    throw httpError(`Слишком много тегов (максимум ${JOURNAL_TAGS_MAX})`, 400);
  }

  return tags;
}

function journalReference(value, label, table, notFoundMessage) {
  if (value === null || value === undefined || value === '') return null;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(`Неверный идентификатор: ${label}`, 400);
  }
  if (!db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(id)) {
    throw httpError(notFoundMessage, 400);
  }
  return id;
}

function normalizeJournal(input) {
  const entryDate = String(input?.entry_date ?? '').trim() || todayIso();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    throw httpError('Дата записи должна быть в формате ГГГГ-ММ-ДД', 400);
  }
  const parsedDate = new Date(`${entryDate}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== entryDate) {
    throw httpError('Такой даты не существует', 400);
  }

  const title = limitText(input?.title, JOURNAL_TITLE_MAX, 'заголовок') || null;
  const body = limitText(input?.body, JOURNAL_TEXT_MAX, 'текст записи') || null;
  if (!title && !body) {
    throw httpError('Заполните заголовок или текст записи', 400);
  }

  return {
    entry_date: entryDate,
    title,
    body,
    card_id: journalReference(input?.card_id, 'карта', 'cards', 'Карта не найдена'),
    reading_id: journalReference(input?.reading_id, 'расклад', 'readings', 'Расклад не найден'),
    client_id: journalReference(input?.client_id, 'клиент', 'clients', 'Клиент не найден'),
    tags: normalizeJournalTags(input?.tags),
  };
}

function journalDetail(id) {
  const row = db.prepare(`${JOURNAL_SELECT} WHERE j.id = ?`).get(id);
  if (!row) throw httpError('Запись дневника не найдена', 404);
  return { ...row, tags: parseJournalTags(row.tags) };
}

function journalHaystack(row) {
  return [
    row.title,
    row.body,
    row.client_name,
    row.reading_title,
    row.card_name_ru,
    row.card_name_en,
    ...(row.tags ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
}

/* ---------- События ---------- */

function normalizeEventDate(value, label) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw httpError(`${label} должна быть в формате ГГГГ-ММ-ДД`, 400);
  }
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) {
    throw httpError('Такой даты не существует', 400);
  }
  return raw;
}

function normalizeEvent(input) {
  const title = limitText(input?.title, EVENT_TITLE_MAX, 'название события');
  if (!title) throw httpError('Укажите название события', 400);

  const status = String(input?.status ?? 'planned').trim() || 'planned';
  if (!EVENT_STATUSES.includes(status)) {
    throw httpError('Неизвестный статус события', 400);
  }

  return {
    title,
    description: limitText(input?.description, EVENT_TEXT_MAX, 'описание') || null,
    category: limitText(input?.category, EVENT_CATEGORY_MAX, 'категория') || null,
    planned_date: normalizeEventDate(input?.planned_date, 'Планируемая дата'),
    actual_date: normalizeEventDate(input?.actual_date, 'Фактическая дата'),
    status,
    result: limitText(input?.result, EVENT_TEXT_MAX, 'фактический результат') || null,
    notes: limitText(input?.notes, EVENT_TEXT_MAX, 'заметки') || null,
  };
}

const EVENT_SELECT = `
  SELECT
    e.*,
    (SELECT COUNT(*) FROM reading_events re WHERE re.event_id = e.id) AS readings_count,
    (SELECT GROUP_CONCAT(r.title, ' ')
       FROM reading_events re
       JOIN readings r ON r.id = re.reading_id
      WHERE re.event_id = e.id) AS reading_titles,
    (SELECT GROUP_CONCAT(c.name, ' ')
       FROM reading_events re
       JOIN readings r ON r.id = re.reading_id
       LEFT JOIN clients c ON c.id = r.client_id
      WHERE re.event_id = e.id) AS client_names,
    (SELECT GROUP_CONCAT(DISTINCT r.client_id)
       FROM reading_events re
       JOIN readings r ON r.id = re.reading_id
      WHERE re.event_id = e.id AND r.client_id IS NOT NULL) AS client_ids
  FROM events e
`;

function eventDetail(id) {
  const event = db.prepare(`${EVENT_SELECT} WHERE e.id = ?`).get(id);
  if (!event) throw httpError('Событие не найдено', 404);

  const readings = db.prepare(`
    SELECT
      r.id,
      r.title,
      r.question,
      r.reading_date,
      r.status,
      c.name AS client_name,
      (SELECT COUNT(*) FROM reading_cards rc WHERE rc.reading_id = r.id) AS cards_count,
      (SELECT o.rating FROM outcome_reviews o
        WHERE o.reading_id = r.id
        ORDER BY o.reviewed_at DESC, o.id DESC LIMIT 1) AS outcome_rating,
      (SELECT o.reviewed_at FROM outcome_reviews o
        WHERE o.reading_id = r.id
        ORDER BY o.reviewed_at DESC, o.id DESC LIMIT 1) AS outcome_reviewed_at,
      (SELECT o.follow_up_date FROM outcome_reviews o
        WHERE o.reading_id = r.id
        ORDER BY o.reviewed_at DESC, o.id DESC LIMIT 1) AS outcome_follow_up_date,
      (SELECT o.result FROM outcome_reviews o
        WHERE o.reading_id = r.id
        ORDER BY o.reviewed_at DESC, o.id DESC LIMIT 1) AS outcome_result
    FROM reading_events re
    JOIN readings r ON r.id = re.reading_id
    LEFT JOIN clients c ON c.id = r.client_id
    WHERE re.event_id = ?
    ORDER BY r.reading_date DESC, r.id DESC
  `).all(id);

  return { ...event, readings };
}

function eventHaystack(event) {
  return [
    event.title,
    event.description,
    event.category,
    event.result,
    event.notes,
    event.reading_titles,
    event.client_names,
  ].filter(Boolean).join(' ').toLowerCase();
}

/* ---------- Итоги и история трактовок ---------- */

function normalizeOutcome(input) {
  const rating = String(input?.rating ?? 'pending').trim() || 'pending';
  if (!OUTCOME_RATINGS.includes(rating)) {
    throw httpError('Неизвестная оценка итога', 400);
  }

  const confidence = String(input?.confidence ?? '').trim() || null;
  if (confidence && !OUTCOME_CONFIDENCES.includes(confidence)) {
    throw httpError('Неизвестная уверенность в оценке', 400);
  }

  let eventId = null;
  const rawEventId = input?.event_id;
  if (rawEventId !== null && rawEventId !== undefined && rawEventId !== '') {
    eventId = Number(rawEventId);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      throw httpError('Неверный идентификатор события', 400);
    }
    if (!db.prepare('SELECT id FROM events WHERE id = ?').get(eventId)) {
      throw httpError('Событие не найдено', 400);
    }
  }

  return {
    event_id: eventId,
    result: limitText(input?.result, OUTCOME_TEXT_MAX, 'фактический результат') || null,
    rating,
    comment: limitText(input?.comment, OUTCOME_TEXT_MAX, 'комментарий') || null,
    reviewed_at: normalizeEventDate(input?.reviewed_at, 'Дата оценки') || todayIso(),
    follow_up_date: normalizeEventDate(input?.follow_up_date, 'Дата возврата к раскладу'),
    followup_interpretation: limitText(
      input?.followup_interpretation,
      OUTCOME_TEXT_MAX,
      'последующая трактовка',
    ) || null,
    confidence,
  };
}

function normalizeFeedback(input) {
  const topic = String(input?.topic ?? 'other').trim() || 'other';
  if (!FEEDBACK_TOPICS.includes(topic)) {
    throw httpError('Неизвестная тема сообщения', 400);
  }

  const message = limitText(input?.message, FEEDBACK_MESSAGE_MAX, 'сообщение');
  if (!message) {
    throw httpError('Опишите, что случилось или что хочется улучшить', 400);
  }

  const clip = (value, max) => {
    const text = String(value ?? '').trim();
    return text ? text.slice(0, max) : null;
  };

  return {
    topic,
    message,
    page: clip(input?.page, FEEDBACK_PAGE_MAX),
    page_title: clip(input?.page_title, FEEDBACK_PAGE_TITLE_MAX),
    user_agent: clip(input?.user_agent, FEEDBACK_USER_AGENT_MAX),
  };
}

/* ---------- Карта дня ---------- */

function dailyCardDetail(date) {
  const row = db.prepare(`
    SELECT c.*, dc.draw_date, dc.orientation, dc.created_at AS drawn_at
    FROM daily_cards dc
    JOIN cards c ON c.id = dc.card_id
    WHERE dc.draw_date = ?
  `).get(date);

  if (!row) return { date, card: null };

  const { draw_date, orientation, drawn_at, ...card } = row;
  return {
    date: draw_date,
    orientation,
    drawn_at,
    card: parseCard(card),
  };
}

function drawDailyCard(input) {
  const date = normalizeEventDate(input?.date, 'Дата карты дня') || todayIso();
  const existing = dailyCardDetail(date);
  if (existing.card) return existing;

  const card = db.prepare('SELECT * FROM cards ORDER BY RANDOM() LIMIT 1').get();
  if (!card) throw httpError('В справочнике нет карт', 500);

  const orientation = DAILY_ORIENTATIONS[Math.floor(Math.random() * DAILY_ORIENTATIONS.length)];

  try {
    db.prepare(`
      INSERT INTO daily_cards (draw_date, card_id, orientation)
      VALUES (?, ?, ?)
    `).run(date, card.id, orientation);
  } catch (error) {
    // Если параллельный запрос уже вытянул карту на эту дату, показываем её.
    if (!dailyCardDetail(date).card) throw error;
  }

  return dailyCardDetail(date);
}

function insertReadingVersion(readingId, kind, interpretation, summary, comment) {
  const body = interpretation || null;
  const summaryText = summary || null;
  if (!body && !summaryText && !comment) return null;

  const latest = db.prepare(`
    SELECT kind, interpretation, summary
    FROM reading_versions
    WHERE reading_id = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(readingId);

  if (latest
    && latest.kind === kind
    && (latest.interpretation ?? '') === (body ?? '')
    && (latest.summary ?? '') === (summaryText ?? '')) {
    return null;
  }

  const result = db.prepare(`
    INSERT INTO reading_versions (reading_id, kind, interpretation, summary, comment)
    VALUES (?, ?, ?, ?, ?)
  `).run(readingId, kind, body, summaryText, comment || null);

  return Number(result.lastInsertRowid);
}

function ensureInitialVersion(readingId, reading) {
  if (!reading.interpretation && !reading.summary) return;

  const existing = db.prepare(`
    SELECT id FROM reading_versions
    WHERE reading_id = ? AND kind = 'initial'
    LIMIT 1
  `).get(readingId);
  if (existing) return;

  insertReadingVersion(
    readingId,
    'initial',
    reading.interpretation,
    reading.summary,
    'Снимок при завершении расклада',
  );
}

function outcomeForReading(readingId) {
  return db.prepare(`
    SELECT o.*, e.title AS event_title
    FROM outcome_reviews o
    LEFT JOIN events e ON e.id = o.event_id
    WHERE o.reading_id = ?
    ORDER BY o.reviewed_at DESC, o.id DESC
    LIMIT 1
  `).get(readingId) ?? null;
}

function pendingOutcomes() {
  const rows = db.prepare(`
    SELECT
      r.id,
      r.title,
      r.question,
      r.reading_date,
      c.name AS client_name,
      (SELECT COUNT(*) FROM outcome_reviews o WHERE o.reading_id = r.id) AS outcomes_count,
      (SELECT o.rating FROM outcome_reviews o
        WHERE o.reading_id = r.id
        ORDER BY o.reviewed_at DESC, o.id DESC LIMIT 1) AS latest_rating,
      (SELECT o.follow_up_date FROM outcome_reviews o
        WHERE o.reading_id = r.id
        ORDER BY o.reviewed_at DESC, o.id DESC LIMIT 1) AS follow_up_date,
      (SELECT GROUP_CONCAT(e.title, ' · ')
         FROM reading_events re
         JOIN events e ON e.id = re.event_id
        WHERE re.reading_id = r.id) AS event_titles
    FROM readings r
    LEFT JOIN clients c ON c.id = r.client_id
    WHERE r.status = 'done'
    ORDER BY r.reading_date DESC, r.id DESC
  `).all();

  const today = todayIso();

  return rows
    .filter((row) => {
      if (row.outcomes_count === 0) return true;
      return ['pending', 'insufficient'].includes(row.latest_rating)
        && Boolean(row.follow_up_date)
        && row.follow_up_date <= today;
    })
    .map((row) => ({
      ...row,
      reason: row.outcomes_count === 0 ? 'no_outcome' : 'follow_up',
    }));
}

function getStatistics() {
  const statusRows = db.prepare('SELECT status, COUNT(*) AS n FROM readings GROUP BY status').all();
  const statusCounts = { draft: 0, done: 0, archived: 0 };
  for (const row of statusRows) {
    statusCounts[row.status] = row.n;
  }

  const cards = db.prepare(`
    SELECT
      c.id,
      c.name_ru,
      c.name_en,
      c.image,
      c.arcana,
      c.suit,
      COUNT(rc.id) AS total,
      SUM(CASE WHEN rc.is_reversed = 0 THEN 1 ELSE 0 END) AS upright,
      SUM(CASE WHEN rc.is_reversed = 1 THEN 1 ELSE 0 END) AS reversed
    FROM reading_cards rc
    JOIN cards c ON c.id = rc.card_id
    GROUP BY c.id
    ORDER BY total DESC, c.name_ru
  `).all();

  const clients = db.prepare(`
    SELECT
      cl.id,
      cl.name,
      (SELECT COUNT(*) FROM readings r WHERE r.client_id = cl.id) AS readings,
      (SELECT COUNT(*) FROM journal j WHERE j.client_id = cl.id) AS journal,
      (SELECT COUNT(*) FROM reading_cards rc
         JOIN readings r ON r.id = rc.reading_id
        WHERE r.client_id = cl.id) AS cards,
      (SELECT MAX(r.reading_date) FROM readings r WHERE r.client_id = cl.id) AS last_reading
    FROM clients cl
    ORDER BY readings DESC, journal DESC, cl.name
  `).all();

  const themeMap = new Map();
  const themeRows = db.prepare(`
    SELECT c.themes, COUNT(rc.id) AS total
    FROM reading_cards rc
    JOIN cards c ON c.id = rc.card_id
    GROUP BY c.id
  `).all();

  for (const row of themeRows) {
    const list = safeJson(row.themes);
    if (!Array.isArray(list)) continue;
    for (const theme of list) {
      const label = String(theme ?? '').trim();
      if (!label) continue;
      const key = label.toLowerCase();
      const existing = themeMap.get(key);
      if (existing) existing.count += row.total;
      else themeMap.set(key, { theme: label, count: row.total });
    }
  }

  const themes = [...themeMap.values()]
    .sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme, 'ru'));

  const tagMap = new Map();
  for (const row of db.prepare('SELECT tags FROM journal').all()) {
    for (const tag of parseJournalTags(row.tags)) {
      const key = tag.toLowerCase();
      const existing = tagMap.get(key);
      if (existing) existing.count += 1;
      else tagMap.set(key, { tag, count: 1 });
    }
  }

  const journalTags = [...tagMap.values()]
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'ru'));

  const selfReadings = db.prepare('SELECT COUNT(*) AS n FROM readings WHERE client_id IS NULL').get().n;

  const latestOutcomes = db.prepare(`
    SELECT o.rating
    FROM outcome_reviews o
    WHERE o.id = (
      SELECT o2.id
      FROM outcome_reviews o2
      WHERE o2.reading_id = o.reading_id
      ORDER BY o2.reviewed_at DESC, o2.id DESC
      LIMIT 1
    )
  `).all();

  const outcomeCounts = { matched: 0, partial: 0, not_matched: 0, insufficient: 0, pending: 0 };
  for (const row of latestOutcomes) {
    outcomeCounts[row.rating] = (outcomeCounts[row.rating] ?? 0) + 1;
  }

  const outcomeDistribution = ['matched', 'partial', 'not_matched', 'insufficient', 'pending']
    .map((rating) => ({ rating, count: outcomeCounts[rating] ?? 0 }));

  const totalReadings = statusCounts.draft + statusCounts.done + statusCounts.archived;
  const totalOutcomes = db.prepare('SELECT COUNT(*) AS n FROM outcome_reviews').get().n;
  const doneWithOutcome = db.prepare(`
    SELECT COUNT(DISTINCT o.reading_id) AS n
    FROM outcome_reviews o
    JOIN readings r ON r.id = o.reading_id
    WHERE r.status = 'done'
  `).get().n;

  const eventStatusRows = db.prepare('SELECT status, COUNT(*) AS n FROM events GROUP BY status').all();
  const eventStatusCounts = {
    planned: 0,
    in_progress: 0,
    done: 0,
    cancelled: 0,
    archived: 0,
  };
  let totalEvents = 0;
  for (const row of eventStatusRows) {
    eventStatusCounts[row.status] = row.n;
    totalEvents += row.n;
  }

  const eventCategories = db.prepare(`
    SELECT
      COALESCE(NULLIF(TRIM(category), ''), 'без категории') AS category,
      COUNT(*) AS count
    FROM events
    GROUP BY COALESCE(NULLIF(TRIM(category), ''), 'без категории')
    ORDER BY count DESC, category
  `).all();

  const eventsWithResult = db.prepare(`
    SELECT COUNT(*) AS n
    FROM events
    WHERE result IS NOT NULL AND TRIM(result) <> ''
  `).get().n;

  return {
    totals: { ...getStats(), ...statusCounts, selfReadings, events: totalEvents },
    cards,
    clients,
    themes,
    journalTags,
    outcomes: {
      totalOutcomes,
      sampleSize: latestOutcomes.length,
      totalReadings,
      doneReadings: statusCounts.done,
      doneWithOutcome,
      distribution: outcomeDistribution,
    },
    events: {
      total: totalEvents,
      withResult: eventsWithResult,
      byStatus: eventStatusCounts,
      byCategory: eventCategories,
    },
  };
}

/* ---------- Резервные копии ---------- */

function backupName(now = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
    + `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  let name = `tarot-${stamp}.db`;
  let counter = 2;
  while (existsSync(path.join(backupDir, name))) {
    name = `tarot-${stamp}-${counter}.db`;
    counter += 1;
  }
  return name;
}

async function backupInfo(name) {
  const filePath = path.join(backupDir, name);
  const info = await stat(filePath);
  return {
    name,
    file: path.relative(rootDir, filePath),
    size: info.size,
    created_at: info.mtime.toISOString(),
  };
}

async function createBackup() {
  mkdirSync(backupDir, { recursive: true });
  const name = backupName();
  const filePath = path.join(backupDir, name);

  // VACUUM INTO делает целостный снимок базы вместе с данными из WAL,
  // не останавливая сервер.
  db.exec(`VACUUM INTO '${filePath.replace(/'/g, "''")}'`);

  return backupInfo(name);
}

async function listBackups() {
  let names = [];
  try {
    names = await readdir(backupDir);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    return { directory: path.relative(rootDir, backupDir), backups: [] };
  }

  const backups = [];
  for (const name of names.filter((item) => item.endsWith('.db'))) {
    try {
      backups.push(await backupInfo(name));
    } catch {
      // файл могли удалить или перенести между чтением папки и проверкой
    }
  }
  backups.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return {
    directory: path.relative(rootDir, backupDir),
    backups: backups.slice(0, 20),
  };
}

const routes = [
  ['GET', /^\/api\/health$/, () => ({
    ok: true,
    schemaVersion: SCHEMA_VERSION,
    version: pkg.version,
    repository: typeof pkg.repository === 'string' ? pkg.repository : null,
    feedbackEmail: typeof pkg.feedbackEmail === 'string' ? pkg.feedbackEmail : null,
    dbFile,
    uptime: Math.round(process.uptime()),
  })],

  ['GET', /^\/api\/stats$/, () => getStats()],

  ['GET', /^\/api\/backups$/, () => listBackups()],

  ['POST', /^\/api\/backup$/, () => createBackup()],

  ['GET', /^\/api\/daily-card$/, (req, url) => {
    const date = normalizeEventDate(url.searchParams.get('date'), 'Дата карты дня') || todayIso();
    return dailyCardDetail(date);
  }],

  ['POST', /^\/api\/daily-card$/, async (req) => {
    return drawDailyCard(await readJsonBody(req));
  }],

  ['GET', /^\/api\/feedback$/, (req, url) => {
    const topic = url.searchParams.get('topic');
    if (topic && !FEEDBACK_TOPICS.includes(topic)) {
      throw httpError('Неизвестная тема сообщения', 400);
    }

    return topic
      ? db.prepare(`
          SELECT * FROM feedback_messages
          WHERE topic = ?
          ORDER BY created_at DESC, id DESC
        `).all(topic)
      : db.prepare(`
          SELECT * FROM feedback_messages
          ORDER BY created_at DESC, id DESC
        `).all();
  }],

  ['POST', /^\/api\/feedback$/, async (req) => {
    const feedback = normalizeFeedback(await readJsonBody(req));
    const result = db.prepare(`
      INSERT INTO feedback_messages (topic, message, page, page_title, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      feedback.topic,
      feedback.message,
      feedback.page,
      feedback.page_title,
      feedback.user_agent,
    );

    return db.prepare('SELECT * FROM feedback_messages WHERE id = ?')
      .get(Number(result.lastInsertRowid));
  }],

  ['GET', /^\/api\/statistics$/, () => getStatistics()],

  ['GET', /^\/api\/outcomes\/pending$/, () => pendingOutcomes()],

  ['GET', /^\/api\/cards$/, (req, url) => {
    const conditions = [];
    const params = [];

    const arcana = url.searchParams.get('arcana');
    if (arcana) {
      conditions.push('arcana = ?');
      params.push(arcana);
    }

    const suit = url.searchParams.get('suit');
    if (suit) {
      conditions.push('suit = ?');
      params.push(suit);
    }

    const query = url.searchParams.get('q')?.trim().toLowerCase();

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    let cards = db.prepare(`SELECT * FROM cards ${where} ${CARD_ORDER}`).all(...params).map(parseCard);
    const interpretationMap = interpretationsByCard(cards.map((card) => card.id));

    if (query) {
      cards = cards.filter((card) => {
        const personal = (interpretationMap.get(card.id) ?? [])
          .map((item) => `${item.title ?? ''} ${item.body}`)
          .join(' ');
        const haystack = [
          card.name_ru,
          card.name_en,
          card.slug,
          card.keywords.join(' '),
          card.notes ?? '',
          personal,
        ].join(' ');
        return haystack.toLowerCase().includes(query);
      });
    }

    return cards.map((card) => withInterpretations(card, interpretationMap));
  }],

  ['GET', /^\/api\/cards\/(\d+)$/, (req, url, match) => {
    const id = Number(match[1]);
    const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
    if (!row) throw httpError('Карта не найдена', 404);
    return withInterpretations(parseCard(row), interpretationsByCard([id]));
  }],

  ['PATCH', /^\/api\/cards\/(\d+)$/, async (req, url, match) => {
    const id = Number(match[1]);
    const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
    if (!row) throw httpError('Карта не найдена', 404);

    const body = await readJsonBody(req);
    const notes = limitText(body?.notes ?? '', 10000, 'Личные заметки');

    db.prepare(`
      UPDATE cards
      SET notes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(notes || null, id);

    const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
    return withInterpretations(parseCard(updated), interpretationsByCard([id]));
  }],

  ['POST', /^\/api\/cards\/(\d+)\/interpretations$/, async (req, url, match) => {
    const cardId = Number(match[1]);
    const card = db.prepare('SELECT id FROM cards WHERE id = ?').get(cardId);
    if (!card) throw httpError('Карта не найдена', 404);

    const data = normalizeInterpretation(await readJsonBody(req));
    const result = db.prepare(`
      INSERT INTO card_interpretations (card_id, orientation, title, body, spread_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(cardId, data.orientation, data.title, data.body, data.spread_name);

    return db.prepare('SELECT * FROM card_interpretations WHERE id = ?')
      .get(Number(result.lastInsertRowid));
  }],

  ['PUT', /^\/api\/interpretations\/(\d+)$/, async (req, url, match) => {
    const id = Number(match[1]);
    const row = db.prepare('SELECT * FROM card_interpretations WHERE id = ?').get(id);
    if (!row) throw httpError('Трактовка не найдена', 404);

    const data = normalizeInterpretation(await readJsonBody(req));
    db.prepare(`
      UPDATE card_interpretations
      SET orientation = ?, title = ?, body = ?, spread_name = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(data.orientation, data.title, data.body, data.spread_name, id);

    return db.prepare('SELECT * FROM card_interpretations WHERE id = ?').get(id);
  }],

  ['DELETE', /^\/api\/interpretations\/(\d+)$/, (req, url, match) => {
    const id = Number(match[1]);
    const result = db.prepare('DELETE FROM card_interpretations WHERE id = ?').run(id);
    if (result.changes === 0) throw httpError('Трактовка не найдена', 404);
    return { ok: true, deleted: id };
  }],

  ['GET', /^\/api\/clients$/, (req, url) => {
    const query = url.searchParams.get('q')?.trim().toLowerCase();
    let clients = db.prepare('SELECT * FROM clients ORDER BY name').all();

    if (query) {
      clients = clients.filter((client) =>
        `${client.name} ${client.contact ?? ''}`.toLowerCase().includes(query),
      );
    }

    return clients;
  }],

  ['GET', /^\/api\/clients\/(\d+)$/, (req, url, match) => {
    const id = Number(match[1]);
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) throw httpError('Клиент не найден', 404);

    const readings = db.prepare(`
      SELECT id, title, question, spread_name, reading_date, status
      FROM readings
      WHERE client_id = ?
      ORDER BY reading_date DESC, id DESC
    `).all(id);

    const events = db.prepare(`
      SELECT DISTINCT
        e.id,
        e.title,
        e.category,
        e.planned_date,
        e.actual_date,
        e.status,
        e.result,
        (SELECT COUNT(*) FROM reading_events re2 WHERE re2.event_id = e.id) AS readings_count
      FROM events e
      JOIN reading_events re ON re.event_id = e.id
      JOIN readings r ON r.id = re.reading_id
      WHERE r.client_id = ?
      ORDER BY COALESCE(e.actual_date, e.planned_date) DESC, e.id DESC
    `).all(id);

    return { ...client, readings, events };
  }],

  ['POST', /^\/api\/clients$/, async (req) => {
    const client = normalizeClient(await readJsonBody(req));
    const result = db.prepare(`
      INSERT INTO clients (name, contact, birth_date, notes)
      VALUES (?, ?, ?, ?)
    `).run(client.name, client.contact, client.birth_date, client.notes);

    return db.prepare('SELECT * FROM clients WHERE id = ?').get(Number(result.lastInsertRowid));
  }],

  ['PUT', /^\/api\/clients\/(\d+)$/, async (req, url, match) => {
    const id = Number(match[1]);
    const existing = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
    if (!existing) throw httpError('Клиент не найден', 404);

    const client = normalizeClient(await readJsonBody(req));
    db.prepare(`
      UPDATE clients
      SET name = ?, contact = ?, birth_date = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(client.name, client.contact, client.birth_date, client.notes, id);

    return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  }],

  ['DELETE', /^\/api\/clients\/(\d+)$/, (req, url, match) => {
    const id = Number(match[1]);
    const result = db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    if (result.changes === 0) throw httpError('Клиент не найден', 404);
    return { ok: true, deleted: id };
  }],

  ['GET', /^\/api\/readings$/, (req, url) => {
    const conditions = [];
    const params = [];

    const status = url.searchParams.get('status');
    if (status) {
      if (!READING_STATUSES.includes(status)) throw httpError('Неизвестный статус расклада', 400);
      conditions.push('r.status = ?');
      params.push(status);
    }

    const clientId = url.searchParams.get('client_id');
    if (clientId) {
      conditions.push('r.client_id = ?');
      params.push(Number(clientId));
    }

    const from = url.searchParams.get('from');
    if (from) {
      conditions.push('r.reading_date >= ?');
      params.push(from);
    }

    const to = url.searchParams.get('to');
    if (to) {
      conditions.push('r.reading_date <= ?');
      params.push(to);
    }

    const query = url.searchParams.get('q')?.trim().toLowerCase();

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    let rows = db.prepare(`
      SELECT
        r.*,
        c.name AS client_name,
        (SELECT COUNT(*) FROM reading_cards rc WHERE rc.reading_id = r.id) AS cards_count,
        (SELECT o.rating FROM outcome_reviews o
          WHERE o.reading_id = r.id
          ORDER BY o.reviewed_at DESC, o.id DESC LIMIT 1) AS outcome_rating,
        (SELECT o.result FROM outcome_reviews o
          WHERE o.reading_id = r.id
          ORDER BY o.reviewed_at DESC, o.id DESC LIMIT 1) AS outcome_result,
        (SELECT o.comment FROM outcome_reviews o
          WHERE o.reading_id = r.id
          ORDER BY o.reviewed_at DESC, o.id DESC LIMIT 1) AS outcome_comment,
        (SELECT o.reviewed_at FROM outcome_reviews o
          WHERE o.reading_id = r.id
          ORDER BY o.reviewed_at DESC, o.id DESC LIMIT 1) AS outcome_reviewed_at
      FROM readings r
      LEFT JOIN clients c ON c.id = r.client_id
      ${where}
      ORDER BY r.reading_date DESC, r.id DESC
    `).all(...params);

    if (query) {
      rows = rows.filter((row) => {
        const haystack = [
          row.title,
          row.question,
          row.interpretation,
          row.summary,
          row.client_name,
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    return rows;
  }],

  ['GET', /^\/api\/readings\/(\d+)$/, (req, url, match) => {
    return getReadingDetail(Number(match[1]));
  }],

  ['POST', /^\/api\/readings$/, async (req) => {
    const { reading, cards } = normalizeReading(await readJsonBody(req));

    const id = withTransaction(() => {
      const result = db.prepare(`
        INSERT INTO readings (
          client_id, title, question, spread_name, reading_date,
          status, interpretation, summary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        reading.client_id,
        reading.title,
        reading.question,
        reading.spread_name,
        reading.reading_date,
        reading.status,
        reading.interpretation,
        reading.summary,
      );

      const readingId = Number(result.lastInsertRowid);
      replaceReadingCards(readingId, cards);
      if (reading.status === 'done') ensureInitialVersion(readingId, reading);
      return readingId;
    });

    return getReadingDetail(id);
  }],

  ['PUT', /^\/api\/readings\/(\d+)$/, async (req, url, match) => {
    const id = Number(match[1]);
    const existing = db.prepare('SELECT * FROM readings WHERE id = ?').get(id);
    if (!existing) throw httpError('Расклад не найден', 404);

    const { reading, cards } = normalizeReading(await readJsonBody(req));

    withTransaction(() => {
      db.prepare(`
        UPDATE readings
        SET client_id = ?, title = ?, question = ?, spread_name = ?, reading_date = ?,
            status = ?, interpretation = ?, summary = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(
        reading.client_id,
        reading.title,
        reading.question,
        reading.spread_name,
        reading.reading_date,
        reading.status,
        reading.interpretation,
        reading.summary,
        id,
      );

      replaceReadingCards(id, cards);

      if (reading.status === 'done') {
        if (existing.status !== 'done') {
          ensureInitialVersion(id, reading);
        } else {
          ensureInitialVersion(id, existing);
          const textChanged = (existing.interpretation ?? '') !== (reading.interpretation ?? '')
            || (existing.summary ?? '') !== (reading.summary ?? '');
          if (textChanged) {
            insertReadingVersion(
              id,
              'update',
              reading.interpretation,
              reading.summary,
              'Правка после завершения',
            );
          }
        }
      }
    });

    return getReadingDetail(id);
  }],

  ['PATCH', /^\/api\/readings\/(\d+)$/, async (req, url, match) => {
    const id = Number(match[1]);
    const row = db.prepare('SELECT * FROM readings WHERE id = ?').get(id);
    if (!row) throw httpError('Расклад не найден', 404);

    const body = await readJsonBody(req);

    // Меняем только переданные текстовые поля, карты и остальное не трогаем.
    const interpretation = body?.interpretation === undefined
      ? row.interpretation
      : limitText(body.interpretation, READING_TEXT_MAX, 'трактовка') || null;
    const summary = body?.summary === undefined
      ? row.summary
      : limitText(body.summary, READING_TEXT_MAX, 'выводы') || null;

    db.prepare(`
      UPDATE readings
      SET interpretation = ?, summary = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(interpretation, summary, id);

    if (row.status === 'done') {
      ensureInitialVersion(id, row);
      const textChanged = (row.interpretation ?? '') !== (interpretation ?? '')
        || (row.summary ?? '') !== (summary ?? '');
      if (textChanged) {
        insertReadingVersion(id, 'update', interpretation, summary, 'Правка после завершения');
      }
    }

    return getReadingDetail(id);
  }],

  ['GET', /^\/api\/readings\/(\d+)\/outcomes$/, (req, url, match) => {
    const readingId = Number(match[1]);
    const reading = db.prepare('SELECT id FROM readings WHERE id = ?').get(readingId);
    if (!reading) throw httpError('Расклад не найден', 404);

    return db.prepare(`
      SELECT o.*, e.title AS event_title
      FROM outcome_reviews o
      LEFT JOIN events e ON e.id = o.event_id
      WHERE o.reading_id = ?
      ORDER BY o.reviewed_at DESC, o.id DESC
    `).all(readingId);
  }],

  ['POST', /^\/api\/readings\/(\d+)\/outcomes$/, async (req, url, match) => {
    const readingId = Number(match[1]);
    const reading = db.prepare('SELECT * FROM readings WHERE id = ?').get(readingId);
    if (!reading) throw httpError('Расклад не найден', 404);

    const outcome = normalizeOutcome(await readJsonBody(req));

    db.prepare(`
      INSERT INTO outcome_reviews (
        reading_id, event_id, result, rating, comment, reviewed_at,
        follow_up_date, followup_interpretation, confidence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      readingId,
      outcome.event_id,
      outcome.result,
      outcome.rating,
      outcome.comment,
      outcome.reviewed_at,
      outcome.follow_up_date,
      outcome.followup_interpretation,
      outcome.confidence,
    );

    ensureInitialVersion(readingId, reading);

    if (outcome.followup_interpretation) {
      insertReadingVersion(
        readingId,
        'final',
        outcome.followup_interpretation,
        null,
        'Итоговая трактовка после события',
      );
    }

    return getReadingDetail(readingId);
  }],

  ['POST', /^\/api\/readings\/(\d+)\/position-outcomes$/, async (req, url, match) => {
    const readingId = Number(match[1]);
    const reading = db.prepare('SELECT * FROM readings WHERE id = ?').get(readingId);
    if (!reading) throw httpError('Расклад не найден', 404);

    const body = await readJsonBody(req);
    const positionIndex = Number(body?.position_index);
    if (!Number.isInteger(positionIndex) || positionIndex < 1) {
      throw httpError('Неверный номер позиции', 400);
    }

    const position = db.prepare(`
      SELECT rc.position_index, rc.position_name, rc.card_id
      FROM reading_cards rc
      WHERE rc.reading_id = ? AND rc.position_index = ?
    `).get(readingId, positionIndex);
    if (!position) throw httpError('Позиция не найдена в раскладе', 400);

    const outcome = normalizeOutcome(body);

    db.prepare(`
      INSERT INTO position_outcomes (
        reading_id, position_index, position_name, card_id, event_id,
        result, rating, comment, reviewed_at, follow_up_date,
        followup_interpretation, confidence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      readingId,
      position.position_index,
      position.position_name,
      position.card_id,
      outcome.event_id,
      outcome.result,
      outcome.rating,
      outcome.comment,
      outcome.reviewed_at,
      outcome.follow_up_date,
      outcome.followup_interpretation,
      outcome.confidence,
    );

    return getReadingDetail(readingId);
  }],

  ['DELETE', /^\/api\/readings\/(\d+)$/, (req, url, match) => {
    const id = Number(match[1]);
    const result = db.prepare('DELETE FROM readings WHERE id = ?').run(id);
    if (result.changes === 0) throw httpError('Расклад не найден', 404);
    return { ok: true, deleted: id };
  }],

  ['GET', /^\/api\/events$/, (req, url) => {
    const conditions = [];
    const params = [];

    const status = url.searchParams.get('status');
    if (status) {
      if (!EVENT_STATUSES.includes(status)) throw httpError('Неизвестный статус события', 400);
      conditions.push('e.status = ?');
      params.push(status);
    }

    const category = url.searchParams.get('category')?.trim();
    if (category) {
      conditions.push('e.category = ?');
      params.push(category);
    }

    const from = url.searchParams.get('from');
    if (from) {
      conditions.push('e.planned_date >= ?');
      params.push(from);
    }

    const to = url.searchParams.get('to');
    if (to) {
      conditions.push('e.planned_date <= ?');
      params.push(to);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    let rows = db.prepare(`
      ${EVENT_SELECT}
      ${where}
      ORDER BY COALESCE(e.actual_date, e.planned_date) DESC, e.id DESC
    `).all(...params);

    const query = url.searchParams.get('q')?.trim().toLowerCase();
    if (query) rows = rows.filter((row) => eventHaystack(row).includes(query));

    return rows;
  }],

  ['GET', /^\/api\/events\/(\d+)$/, (req, url, match) => {
    return eventDetail(Number(match[1]));
  }],

  ['POST', /^\/api\/events$/, async (req) => {
    const event = normalizeEvent(await readJsonBody(req));

    const result = db.prepare(`
      INSERT INTO events (
        title, description, category, planned_date, actual_date, status, result, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.title,
      event.description,
      event.category,
      event.planned_date,
      event.actual_date,
      event.status,
      event.result,
      event.notes,
    );

    return eventDetail(Number(result.lastInsertRowid));
  }],

  ['PUT', /^\/api\/events\/(\d+)$/, async (req, url, match) => {
    const id = Number(match[1]);
    const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(id);
    if (!existing) throw httpError('Событие не найдено', 404);

    const event = normalizeEvent(await readJsonBody(req));

    db.prepare(`
      UPDATE events
      SET title = ?, description = ?, category = ?, planned_date = ?, actual_date = ?,
          status = ?, result = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      event.title,
      event.description,
      event.category,
      event.planned_date,
      event.actual_date,
      event.status,
      event.result,
      event.notes,
      id,
    );

    return eventDetail(id);
  }],

  ['DELETE', /^\/api\/events\/(\d+)$/, (req, url, match) => {
    const id = Number(match[1]);
    const result = db.prepare('DELETE FROM events WHERE id = ?').run(id);
    if (result.changes === 0) throw httpError('Событие не найдено', 404);
    return { ok: true, deleted: id };
  }],

  ['POST', /^\/api\/events\/(\d+)\/readings$/, async (req, url, match) => {
    const eventId = Number(match[1]);
    const event = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
    if (!event) throw httpError('Событие не найдено', 404);

    const body = await readJsonBody(req);
    const readingId = Number(body?.reading_id);
    if (!Number.isInteger(readingId) || readingId <= 0) {
      throw httpError('Неверный идентификатор расклада', 400);
    }
    if (!db.prepare('SELECT id FROM readings WHERE id = ?').get(readingId)) {
      throw httpError('Расклад не найден', 400);
    }

    db.prepare(`
      INSERT OR IGNORE INTO reading_events (reading_id, event_id)
      VALUES (?, ?)
    `).run(readingId, eventId);

    return eventDetail(eventId);
  }],

  ['DELETE', /^\/api\/events\/(\d+)\/readings\/(\d+)$/, (req, url, match) => {
    const eventId = Number(match[1]);
    const readingId = Number(match[2]);
    const event = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
    if (!event) throw httpError('Событие не найдено', 404);

    const result = db.prepare(`
      DELETE FROM reading_events WHERE event_id = ? AND reading_id = ?
    `).run(eventId, readingId);
    if (result.changes === 0) throw httpError('Связь не найдена', 404);

    return eventDetail(eventId);
  }],

  ['GET', /^\/api\/journal$/, (req, url) => {
    const conditions = [];
    const params = [];

    const from = url.searchParams.get('from');
    if (from) {
      conditions.push('j.entry_date >= ?');
      params.push(from);
    }

    const to = url.searchParams.get('to');
    if (to) {
      conditions.push('j.entry_date <= ?');
      params.push(to);
    }

    for (const [param, column] of [
      ['card_id', 'j.card_id'],
      ['reading_id', 'j.reading_id'],
      ['client_id', 'j.client_id'],
    ]) {
      const raw = url.searchParams.get(param);
      if (raw) {
        const value = Number(raw);
        if (!Number.isInteger(value) || value <= 0) {
          throw httpError(`Неверный фильтр: ${param}`, 400);
        }
        conditions.push(`${column} = ?`);
        params.push(value);
      }
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db.prepare(`${JOURNAL_SELECT} ${where} ORDER BY j.entry_date DESC, j.id DESC`)
      .all(...params)
      .map((row) => ({ ...row, tags: parseJournalTags(row.tags) }));

    // Поиск по кириллице надёжнее делать в JS: LIKE в SQLite регистронезависим только для латиницы.
    const query = url.searchParams.get('q')?.trim().toLowerCase();
    const tag = url.searchParams.get('tag')?.trim().toLowerCase();

    return rows
      .filter((row) => (query ? journalHaystack(row).includes(query) : true))
      .filter((row) => (tag ? row.tags.some((item) => item.toLowerCase() === tag) : true));
  }],

  ['GET', /^\/api\/journal\/(\d+)$/, (req, url, match) => {
    return journalDetail(Number(match[1]));
  }],

  ['POST', /^\/api\/journal$/, async (req) => {
    const entry = normalizeJournal(await readJsonBody(req));

    const result = db.prepare(`
      INSERT INTO journal (entry_date, title, body, card_id, reading_id, client_id, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.entry_date,
      entry.title,
      entry.body,
      entry.card_id,
      entry.reading_id,
      entry.client_id,
      entry.tags.length > 0 ? JSON.stringify(entry.tags) : null,
    );

    return journalDetail(Number(result.lastInsertRowid));
  }],

  ['PUT', /^\/api\/journal\/(\d+)$/, async (req, url, match) => {
    const id = Number(match[1]);
    journalDetail(id);

    const entry = normalizeJournal(await readJsonBody(req));

    db.prepare(`
      UPDATE journal
      SET entry_date = ?, title = ?, body = ?, card_id = ?, reading_id = ?, client_id = ?,
          tags = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      entry.entry_date,
      entry.title,
      entry.body,
      entry.card_id,
      entry.reading_id,
      entry.client_id,
      entry.tags.length > 0 ? JSON.stringify(entry.tags) : null,
      id,
    );

    return journalDetail(id);
  }],

  ['DELETE', /^\/api\/journal\/(\d+)$/, (req, url, match) => {
    const id = Number(match[1]);
    const result = db.prepare('DELETE FROM journal WHERE id = ?').run(id);
    if (result.changes === 0) throw httpError('Запись дневника не найдена', 404);
    return { ok: true, deleted: id };
  }],
];

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

async function serveStatic(res, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400).end('Некорректный адрес');
    return;
  }

  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const filePath = path.resolve(publicDir, relative);

  if (filePath !== publicDir && !filePath.startsWith(publicDir + path.sep)) {
    res.writeHead(403).end('Доступ запрещён');
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('не файл');

    res.writeHead(200, {
      'content-type': MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'content-length': info.size,
      'cache-control': 'no-cache',
    });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Не найдено');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const pathname = url.pathname;

  if (pathname.startsWith('/api/')) {
    const route = routes.find(([method, pattern]) => {
      return method === req.method && pattern.test(pathname);
    });
    if (!route) {
      sendJson(res, 404, { error: 'Неизвестный метод API' });
      return;
    }
    try {
      const match = pathname.match(route[1]);
      sendJson(res, 200, await route[2](req, url, match));
    } catch (error) {
      const status = error?.status ?? 500;
      if (status === 500) console.error('[api]', error);
      sendJson(res, status, { error: error?.message ?? String(error) });
    }
    return;
  }

  await serveStatic(res, pathname);
});

const seeded = seedCards();
if (seeded.inserted > 0) {
  console.log(`Справочник карт загружен: ${seeded.inserted} карт`);
}

// Если порт занят, пробуем следующие — так приложение запустится даже
// когда 3000 уже занят другим процессом.
let listenPort = Number.isInteger(firstPort) && firstPort > 0 ? firstPort : 3000;
let portAttempts = 0;

function openBrowser(url) {
  const [command, args] = process.platform === 'darwin'
    ? ['open', [url]]
    : process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : ['xdg-open', [url]];

  try {
    const child = spawn(command, args, { detached: true, stdio: 'ignore' });
    child.on('error', () => {});
    child.unref();
  } catch {
    // Браузер не открылся — адрес всё равно напечатан ниже.
  }
}

function onListening() {
  const actualPort = server.address().port;
  console.log(`Таро-мастерская запущена: http://localhost:${actualPort}`);
  console.log(`База данных: ${dbFile}`);
  if (process.env.TAROT_OPEN === '1') {
    openBrowser(`http://localhost:${actualPort}`);
  }
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && portAttempts < 20) {
    portAttempts += 1;
    listenPort += 1;
    server.listen(listenPort, '127.0.0.1');
    return;
  }
  console.error('Не удалось запустить сервер:', error.message);
  process.exit(1);
});

server.on('listening', onListening);
server.listen(listenPort, '127.0.0.1');
