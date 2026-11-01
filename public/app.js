// Интерфейс: навигация по разделам и отрисовка страниц.
// Разделы, которые ещё не готовы, показывают заглушки с планом.

const SECTIONS = [
  {
    id: 'overview',
    label: 'Обзор',
    title: 'Обзор',
    subtitle: 'Состояние рабочего места',
  },
  {
    id: 'cards',
    label: 'Карты',
    title: 'База знаний',
    subtitle: 'Значения карт и личные трактовки',
  },
  {
    id: 'readings',
    label: 'Расклады',
    title: 'Расклады',
    subtitle: 'История раскладов и клиентских вопросов',
  },
  {
    id: 'events',
    label: 'События',
    title: 'События',
    subtitle: 'Что запланировано и чем закончилось',
  },
  {
    id: 'clients',
    label: 'Клиенты',
    title: 'Клиенты',
    subtitle: 'Карточки и история обращений',
  },
  {
    id: 'journal',
    label: 'Дневник',
    title: 'Дневник',
    subtitle: 'Наблюдения, карта дня, заметки',
  },
  {
    id: 'search',
    label: 'Поиск',
    title: 'Поиск и статистика',
    subtitle: 'Найти нужное и увидеть закономерности',
  },
];

const TILES = [
  { key: 'readings', label: 'Расклады' },
  { key: 'clients', label: 'Клиенты' },
  { key: 'cards', label: 'Карты в базе' },
  { key: 'journal', label: 'Записи дневника' },
  { key: 'events', label: 'События' },
];

const SUITS = {
  wands: 'Жезлы',
  cups: 'Кубки',
  swords: 'Мечи',
  pentacles: 'Пентакли',
};

const CARD_FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'major', label: 'Старшие арканы' },
  { id: 'wands', label: 'Жезлы' },
  { id: 'cups', label: 'Кубки' },
  { id: 'swords', label: 'Мечи' },
  { id: 'pentacles', label: 'Пентакли' },
];

const READING_STATUS_LABELS = {
  draft: 'черновик',
  done: 'завершён',
  archived: 'архив',
};

const READING_STATUS_FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'draft', label: 'Черновики' },
  { id: 'done', label: 'Завершённые' },
  { id: 'archived', label: 'Архив' },
];

const EVENT_STATUS_LABELS = {
  planned: 'запланировано',
  in_progress: 'в процессе',
  done: 'завершено',
  cancelled: 'отменено',
  archived: 'архив',
};

const EVENT_STATUS_FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'planned', label: 'Запланированные' },
  { id: 'in_progress', label: 'В процессе' },
  { id: 'done', label: 'Завершённые' },
  { id: 'cancelled', label: 'Отменённые' },
  { id: 'archived', label: 'Архив' },
];

const EVENT_STATUS_FORM_LABELS = {
  planned: 'Запланировано',
  in_progress: 'В процессе',
  done: 'Завершено',
  cancelled: 'Отменено',
  archived: 'Архив',
};

const OUTCOME_RATING_LABELS = {
  matched: 'совпало',
  partial: 'частично',
  not_matched: 'не совпало',
  insufficient: 'недостаточно информации',
  pending: 'пока нельзя оценить',
};

const OUTCOME_RATING_FORM_LABELS = {
  matched: 'Совпало',
  partial: 'Частично совпало',
  not_matched: 'Не совпало',
  insufficient: 'Недостаточно информации',
  pending: 'Пока нельзя оценить',
};

const OUTCOME_RATING_ORDER = ['matched', 'partial', 'not_matched', 'insufficient', 'pending'];

const OUTCOME_CONFIDENCE_LABELS = {
  low: 'низкая',
  medium: 'средняя',
  high: 'высокая',
};

const VERSION_KIND_LABELS = {
  initial: 'первоначальная',
  update: 'после правки',
  final: 'итоговая',
};

const FEEDBACK_TOPIC_LABELS = {
  bug: 'Баг',
  inaccuracy: 'Неточность',
  suggestion: 'Предложение',
  other: 'Другое',
};

function outcomeRatingClass(rating) {
  return `rating-${String(rating ?? 'pending').replace(/_/g, '-')}`;
}

function eventStatusClass(status) {
  return `status-${String(status ?? '').replace(/_/g, '-')}`;
}

const TRIPLETS = [
  {
    name: '3 карты: прошлое–настоящее–будущее',
    positions: ['Прошлое', 'Настоящее', 'Будущее'],
  },
  {
    name: '3 карты: что придёт–как разовьётся–к чему приведёт',
    positions: ['Что придёт', 'Как разовьётся', 'К чему приведёт'],
  },
  {
    name: '3 карты: ситуация–препятствие–совет',
    positions: ['Ситуация', 'Препятствие', 'Совет'],
  },
  {
    name: '3 карты: причина–развитие–итог',
    positions: ['Причина', 'Развитие', 'Итог'],
  },
];

const SPREAD_TYPES = [
  '1 карта',
  'Да/Нет',
  ...TRIPLETS.map((triplet) => triplet.name),
  'Кельтский крест',
];

const SPREAD_POSITIONS = {
  '1 карта': ['Карта'],
  'Да/Нет': ['Ответ'],
  ...Object.fromEntries(TRIPLETS.map((triplet) => [triplet.name, triplet.positions])),
  'Кельтский крест': [
    'Суть вопроса',
    'Пересечение',
    'Основа',
    'Недавнее прошлое',
    'Цель',
    'Ближайшее будущее',
    'Позиция спрашивающего',
    'Окружение',
    'Надежды и страхи',
    'Итог',
  ],
};

const navEl = document.getElementById('nav');
const viewEl = document.getElementById('view');
const titleEl = document.getElementById('page-title');
const subtitleEl = document.getElementById('page-subtitle');

let cardsCache = null;

function renderNav(activeId) {
  navEl.innerHTML = SECTIONS.map((section) => `
    <a class="nav-item${section.id === activeId ? ' is-active' : ''}" href="#/${section.id}">
      <span class="nav-mark" aria-hidden="true"></span>
      <span>${section.label}</span>
    </a>
  `).join('');
}

function plural(count, forms) {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

async function api(pathname, options = {}) {
  const response = await fetch(pathname, {
    headers: options.body ? { 'content-type': 'application/json' } : undefined,
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // тело может быть пустым — не считаем это ошибкой
  }

  if (!response.ok) {
    throw new Error(data?.error ?? `Ошибка запроса (${response.status})`);
  }
  return data;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (symbol) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[symbol]));
}

function formatDate(value) {
  if (!value) return '';
  const datePart = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-');
    return `${day}.${month}.${year}`;
  }
  return String(value);
}

function todayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return '';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!match) return formatDate(value);

  const date = new Date(Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
  ));
  const pad = (number) => String(number).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/* ---------- Выпадающие списки ---------- */

let activeCustomSelect = null;

function customSelectOptionHtml(option, select) {
  const selected = option.index === select.selectedIndex;
  return `
    <button type="button" class="custom-select-option${selected ? ' is-selected' : ''}"
            role="option" aria-selected="${selected}" data-option-index="${option.index}"
            ${option.disabled ? 'disabled' : ''}>
      ${escapeHtml(option.textContent.trim())}
    </button>
  `;
}

function customSelectMenuHtml(select) {
  const items = [];
  for (const child of select.children) {
    if (child.tagName === 'OPTGROUP') {
      items.push(`<div class="custom-select-group" role="presentation">${escapeHtml(child.label)}</div>`);
      for (const option of child.children) {
        if (option.tagName === 'OPTION') items.push(customSelectOptionHtml(option, select));
      }
    } else if (child.tagName === 'OPTION') {
      items.push(customSelectOptionHtml(child, select));
    }
  }

  if (select.options.length <= 8) return items.join('');

  const searchLabel = select.name === 'card_id'
    ? 'Поиск карты'
    : select.name === 'reading_id'
      ? 'Поиск расклада'
      : select.name === 'event_id'
        ? 'Поиск события'
        : select.name === 'client_id'
          ? 'Поиск клиента'
          : 'Поиск по списку';

  return `
    <div class="custom-select-search-wrap">
      <input class="custom-select-search" type="search" placeholder="${searchLabel}"
             autocomplete="off" aria-label="${searchLabel}">
    </div>
    ${items.join('')}
    <div class="custom-select-empty" hidden>Ничего не найдено</div>
  `;
}

function filterCustomSelectOptions(wrapper, query) {
  const menu = wrapper.querySelector('.custom-select-menu');
  if (!menu) return;

  const normalized = query.trim().toLowerCase();
  const groups = [];
  let currentGroup = null;
  let visible = 0;

  for (const node of menu.children) {
    if (node.classList.contains('custom-select-search-wrap')
      || node.classList.contains('custom-select-empty')) continue;

    if (node.classList.contains('custom-select-group')) {
      currentGroup = { node, matched: false };
      groups.push(currentGroup);
      continue;
    }

    if (!node.classList.contains('custom-select-option')) continue;

    const matches = !normalized || node.textContent.toLowerCase().includes(normalized);
    node.hidden = !matches;
    if (matches) {
      visible += 1;
      if (currentGroup) currentGroup.matched = true;
    }
  }

  for (const group of groups) group.node.hidden = !group.matched;

  const empty = menu.querySelector('.custom-select-empty');
  if (empty) empty.hidden = visible > 0;
}

function syncCustomSelect(select) {
  const wrapper = select.closest('.custom-select');
  if (!wrapper) return;

  const option = select.options[select.selectedIndex];
  const label = wrapper.querySelector('.custom-select-label');
  if (label) label.textContent = option ? option.textContent.trim() : '';
  wrapper.classList.toggle('is-active', select.classList.contains('is-active'));

  for (const item of wrapper.querySelectorAll('.custom-select-option')) {
    const isSelected = Number(item.dataset.optionIndex) === select.selectedIndex;
    item.classList.toggle('is-selected', isSelected);
    item.setAttribute('aria-selected', String(isSelected));
  }
}

function setSelectValue(select, value) {
  if (!select) return;
  select.value = value;
  syncCustomSelect(select);
}

function setSelectActive(select, active) {
  if (!select) return;
  select.classList.toggle('is-active', active);
  select.closest('.custom-select')?.classList.toggle('is-active', active);
}

function closeCustomSelect(wrapper = activeCustomSelect) {
  if (!wrapper) return;
  wrapper.classList.remove('is-open');
  wrapper.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
  if (activeCustomSelect === wrapper) activeCustomSelect = null;
}

function positionCustomSelectMenu(wrapper) {
  const trigger = wrapper.querySelector('.custom-select-trigger');
  const menu = wrapper.querySelector('.custom-select-menu');
  if (!trigger || !menu) return;

  menu.classList.remove('is-up', 'is-right');
  const rect = trigger.getBoundingClientRect();
  const menuHeight = Math.min(menu.scrollHeight, 300);
  const menuWidth = menu.getBoundingClientRect().width
    || Math.min(Math.max(rect.width, 220), 320);

  if (rect.bottom + menuHeight + 12 > window.innerHeight && rect.top > menuHeight + 12) {
    menu.classList.add('is-up');
  }
  if (rect.left + menuWidth + 12 > window.innerWidth) {
    menu.classList.add('is-right');
  }
}

function openCustomSelectMenu(wrapper) {
  if (activeCustomSelect && activeCustomSelect !== wrapper) closeCustomSelect(activeCustomSelect);
  if (!document.contains(wrapper)) return;

  wrapper.classList.add('is-open');
  wrapper.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'true');
  activeCustomSelect = wrapper;

  const search = wrapper.querySelector('.custom-select-search');
  if (search) {
    search.value = '';
    filterCustomSelectOptions(wrapper, '');
  }

  positionCustomSelectMenu(wrapper);

  if (search) {
    search.focus();
  } else {
    const selected = wrapper.querySelector('.custom-select-option.is-selected');
    selected?.scrollIntoView({ block: 'nearest' });
  }
}

function enhanceSelects(root = document) {
  for (const select of root.querySelectorAll('select:not([data-custom-ready])')) {
    if (select.dataset.customReady) continue;
    select.dataset.customReady = '1';

    const isChip = select.classList.contains('chip-select');
    const isBlock = Boolean(select.closest('.form')) || select.classList.contains('interp-pick');
    const isInterp = select.classList.contains('interp-pick');

    const wrapper = document.createElement('span');
    wrapper.className = 'custom-select';
    if (isChip) wrapper.classList.add('custom-select--chip');
    if (isBlock) wrapper.classList.add('custom-select--block');
    if (isInterp) wrapper.classList.add('custom-select--interp');

    select.parentNode.insertBefore(wrapper, select);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', select.getAttribute('aria-label') || select.name || 'Выпадающий список');
    trigger.innerHTML = `
      <span class="custom-select-label"></span>
      <span class="custom-select-arrow" aria-hidden="true"></span>
    `;

    const menu = document.createElement('div');
    menu.className = 'custom-select-menu';
    menu.setAttribute('role', 'listbox');
    menu.innerHTML = customSelectMenuHtml(select);

    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);
    wrapper.appendChild(select);
    select.hidden = true;
    select.tabIndex = -1;

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (wrapper.classList.contains('is-open')) closeCustomSelect(wrapper);
      else openCustomSelectMenu(wrapper);
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      openCustomSelectMenu(wrapper);
      if (menu.querySelector('.custom-select-search')) return;
      const options = [...menu.querySelectorAll('.custom-select-option:not(:disabled)')];
      const selected = options.find((option) => option.classList.contains('is-selected')) ?? options[0];
      selected?.focus();
    });

    menu.addEventListener('click', (event) => {
      const option = event.target.closest('.custom-select-option');
      if (!option || option.disabled) return;
      event.preventDefault();
      event.stopPropagation();

      select.selectedIndex = Number(option.dataset.optionIndex);
      syncCustomSelect(select);
      closeCustomSelect(wrapper);
      trigger.focus();
      select.dispatchEvent(new Event('change', { bubbles: true }));
      select.dispatchEvent(new Event('input', { bubbles: true }));
    });

    menu.addEventListener('keydown', (event) => {
      const search = menu.querySelector('.custom-select-search');
      const isSearch = event.target === search;
      const options = [...menu.querySelectorAll('.custom-select-option:not(:disabled):not([hidden])')];
      const currentIndex = options.indexOf(document.activeElement);

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (isSearch) {
          const target = event.key === 'ArrowDown' ? options[0] : options[options.length - 1];
          target?.focus();
          return;
        }
        const nextIndex = event.key === 'ArrowDown'
          ? Math.min(options.length - 1, currentIndex + 1)
          : Math.max(0, currentIndex - 1);
        options[nextIndex]?.focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        if (isSearch) return;
        event.preventDefault();
        options[event.key === 'Home' ? 0 : options.length - 1]?.focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        if (isSearch) {
          if (event.key === 'Enter' && search.value.trim() && options.length > 0) {
            event.preventDefault();
            options[0].click();
          }
          return;
        }
        event.preventDefault();
        if (document.activeElement?.classList.contains('custom-select-option')) {
          document.activeElement.click();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeCustomSelect(wrapper);
        trigger.focus();
      } else if (event.key === 'Tab') {
        closeCustomSelect(wrapper);
      }
    });

    const searchInput = menu.querySelector('.custom-select-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        filterCustomSelectOptions(wrapper, searchInput.value);
        menu.scrollTop = 0;
      });
    }

    select.addEventListener('change', () => syncCustomSelect(select));
    syncCustomSelect(select);
  }
}

document.addEventListener('click', (event) => {
  if (activeCustomSelect && !activeCustomSelect.contains(event.target)) {
    closeCustomSelect(activeCustomSelect);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !activeCustomSelect) return;
  const wrapper = activeCustomSelect;
  closeCustomSelect(wrapper);
  wrapper.querySelector('.custom-select-trigger')?.focus();
});

// Отвязка событий и раскладов: один делегированный обработчик на всё приложение,
// чтобы повторные перерисовки не накапливали слушатели.
viewEl.addEventListener('click', async (clickEvent) => {
  const eventButton = clickEvent.target.closest('[data-unlink-event]');
  if (eventButton && !eventButton.disabled) {
    clickEvent.preventDefault();
    eventButton.disabled = true;
    const eventId = Number(eventButton.dataset.unlinkEvent);
    const readingId = Number(eventButton.dataset.readingId);
    try {
      await api(`/api/events/${eventId}/readings/${readingId}`, { method: 'DELETE' });
      renderReadingView(readingId);
    } catch (error) {
      eventButton.disabled = false;
      alert(error.message);
    }
    return;
  }

  const readingButton = clickEvent.target.closest('[data-unlink-reading]');
  if (readingButton && !readingButton.disabled) {
    clickEvent.preventDefault();
    readingButton.disabled = true;
    const eventId = Number(readingButton.dataset.eventId);
    const readingId = Number(readingButton.dataset.unlinkReading);
    try {
      await api(`/api/events/${eventId}/readings/${readingId}`, { method: 'DELETE' });
      renderEventView(eventId);
    } catch (error) {
      readingButton.disabled = false;
      alert(error.message);
    }
  }
});

/* ---------- Обзор ---------- */

function statTile(tile) {
  return `
    <div class="stat">
      <div class="stat-value" data-stat="${tile.key}">—</div>
      <div class="stat-label">${tile.label}</div>
    </div>
  `;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

async function loadBackupStatus() {
  const node = document.getElementById('backup-status');
  if (!node) return;

  try {
    const data = await api('/api/backups');
    const latest = data.backups?.[0];
    node.textContent = latest ? `копия: ${formatDateTime(latest.created_at)}` : 'копий пока нет';
    node.title = latest ? `${latest.file} · ${formatBytes(latest.size)}` : 'Резервных копий пока нет';
  } catch {
    node.textContent = 'не удалось проверить копии';
    node.title = '';
  }
}

async function makeBackup() {
  const button = document.getElementById('backup-now');
  const status = document.getElementById('backup-status');
  const label = document.getElementById('backup-label');
  if (!button || button.disabled) return;

  button.disabled = true;
  if (label) label.textContent = 'Создаю копию…';
  if (status) status.textContent = 'сохраняю базу…';

  try {
    const backup = await api('/api/backup', { method: 'POST' });
    if (label) label.textContent = 'Резервная копия';
    if (status) {
      status.textContent = `копия: ${formatDateTime(backup.created_at)}`;
      status.title = `${backup.file} · ${formatBytes(backup.size)}`;
    }
  } catch (error) {
    if (label) label.textContent = 'Резервная копия';
    if (status) {
      status.textContent = 'не удалось создать копию';
      status.title = error.message;
    }
  } finally {
    button.disabled = false;
  }
}

function setupBackup() {
  const button = document.getElementById('backup-now');
  if (!button) return;
  button.addEventListener('click', makeBackup);
  loadBackupStatus();
}

function dailyCardMarkup(data) {
  if (!data.card) {
    return `
      <div class="daily-card-empty">
        <p class="muted">Карта дня ещё не вытянута. Это не расклад — просто карта-настройка на сегодня.</p>
        <button class="btn btn-primary" type="button" id="daily-card-draw">Вытянуть карту дня</button>
      </div>
    `;
  }

  const card = data.card;
  const reversed = data.orientation === 'reversed';
  const meaning = reversed ? card.reversed : card.upright;

  return `
    <div class="daily-card">
      <a class="daily-card-image${reversed ? ' is-reversed' : ''}" href="#/cards/${card.id}">
        <img src="${escapeHtml(card.image || 'cards/placeholder.svg')}" alt="${escapeHtml(card.name_ru)}"
             onerror="this.onerror=null;this.src='cards/placeholder.svg'">
      </a>
      <div class="daily-card-body">
        <div class="daily-card-head">
          <div>
            <div class="daily-card-name"><a href="#/cards/${card.id}">${escapeHtml(card.name_ru)}</a></div>
            <div class="muted daily-card-en">${escapeHtml(card.name_en)}</div>
          </div>
          <span class="daily-card-orientation${reversed ? ' is-reversed' : ''}">${reversed ? 'перевёрнутая' : 'прямая'}</span>
        </div>
        <p class="daily-card-meaning">${escapeHtml(meaning || 'Значение для этого положения пока не заполнено.')}</p>
        ${card.keywords?.length
          ? `<div class="daily-card-keywords">${card.keywords.map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join('')}</div>`
          : ''}
        <div class="daily-card-actions">
          <a class="btn btn-small" href="#/journal/new?card=${card.id}&date=${data.date}">Записать в дневник</a>
          <a class="btn btn-small" href="#/cards/${card.id}">Открыть карту</a>
        </div>
      </div>
    </div>
  `;
}

async function loadDailyCard() {
  const host = document.getElementById('daily-card');
  if (!host) return;

  try {
    const data = await api(`/api/daily-card?date=${todayIso()}`);
    host.innerHTML = dailyCardMarkup(data);
  } catch (error) {
    host.innerHTML = `<p class="muted">Не удалось загрузить карту дня: ${escapeHtml(error.message)}</p>`;
  }
}

function setupDailyCard() {
  const host = document.getElementById('daily-card');
  if (!host) return;

  host.addEventListener('click', async (event) => {
    const button = event.target.closest('#daily-card-draw');
    if (!button || button.disabled) return;

    button.disabled = true;
    button.textContent = 'Тянем карту…';

    try {
      const data = await api('/api/daily-card', {
        method: 'POST',
        body: JSON.stringify({ date: todayIso() }),
      });
      host.innerHTML = dailyCardMarkup(data);
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Вытянуть карту дня';
      alert(error.message);
    }
  });
}

async function renderOverview() {
  viewEl.innerHTML = `
    <div class="stats">${TILES.map(statTile).join('')}</div>

    <div class="panel daily-card-panel">
      <div class="panel-head">
        <h2>Карта дня</h2>
        <a class="panel-link" href="#/journal">дневник →</a>
      </div>
      <div id="daily-card"><p class="muted">Загрузка…</p></div>
    </div>

    <div id="overview-calendar" class="overview-calendar"><p class="muted">Загрузка…</p></div>

    <div class="quick-actions">
      <a class="btn btn-primary" href="#/events/new">+ Создать событие</a>
      <a class="btn" href="#/readings/new">+ Создать расклад</a>
    </div>

    <div class="panel" id="pending-outcomes-panel">
      <div class="panel-head">
        <h2>Ожидают оценки</h2>
        <a class="panel-link" href="#/readings?status=done">завершённые расклады →</a>
      </div>
      <div id="pending-outcomes"><p class="muted">Загрузка…</p></div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>Последние события</h2>
        <a class="panel-link" href="#/events">все события →</a>
      </div>
      <div class="latest-readings" id="latest-events"><p class="muted">Загрузка…</p></div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>Последние расклады</h2>
        <a class="panel-link" href="#/readings">все расклады →</a>
      </div>
      <div class="latest-readings" id="latest-readings"><p class="muted">Загрузка…</p></div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>Последние записи</h2>
        <a class="panel-link" href="#/journal">весь дневник →</a>
      </div>
      <div class="latest-readings" id="latest-journal"><p class="muted">Загрузка…</p></div>
    </div>
  `;

  setupDailyCard();
  loadDailyCard();

  try {
    const [statsResponse, readingsResponse, journalResponse, pendingResponse, eventsResponse] = await Promise.all([
      fetch('/api/stats'),
      fetch('/api/readings'),
      fetch('/api/journal'),
      fetch('/api/outcomes/pending'),
      fetch('/api/events'),
    ]);
    if (!statsResponse.ok) throw new Error(`HTTP ${statsResponse.status}`);

    const stats = await statsResponse.json();
    for (const tile of TILES) {
      const node = viewEl.querySelector(`[data-stat="${tile.key}"]`);
      if (node) node.textContent = stats[tile.key] ?? 0;
    }

    const host = document.getElementById('latest-readings');
    const readings = readingsResponse.ok ? await readingsResponse.json() : [];
    const latest = readings.slice(0, 5);

    host.innerHTML = latest.length === 0
      ? '<div class="empty">Раскладов пока нет. <a href="#/readings/new">Создать первый</a></div>'
      : latest.map((reading) => `
          <a class="list-row" href="#/readings/${reading.id}">
            <div class="list-main">
              <div class="list-title">${escapeHtml(reading.title || reading.question || 'Расклад')}</div>
              <div class="list-sub">${formatDate(reading.reading_date)} · ${escapeHtml(reading.client_name || 'для себя')}${reading.spread_name ? ` · ${escapeHtml(reading.spread_name)}` : ''}</div>
            </div>
            <span class="status-badge status-${reading.status}">${READING_STATUS_LABELS[reading.status] ?? reading.status}</span>
          </a>
        `).join('');

    const journalHost = document.getElementById('latest-journal');
    const entries = journalResponse.ok ? await journalResponse.json() : [];
    const latestEntries = entries.slice(0, 3);

    journalHost.innerHTML = latestEntries.length === 0
      ? '<div class="empty">Записей пока нет. <a href="#/journal/new">Добавить первую</a></div>'
      : latestEntries.map((entry) => `
          <a class="list-row" href="#/journal/${entry.id}">
            <div class="list-main">
              <div class="list-title">${escapeHtml(journalTitle(entry))}</div>
              <div class="list-sub">${formatLongDate(entry.entry_date)}${entry.tags?.length ? ` · ${entry.tags.map((tag) => `#${escapeHtml(tag)}`).join(' ')}` : ''}</div>
            </div>
          </a>
        `).join('');

    const pendingHost = document.getElementById('pending-outcomes');
    const pending = pendingResponse.ok ? await pendingResponse.json() : [];

    pendingHost.innerHTML = pending.length === 0
      ? '<div class="empty">Все завершённые расклады оценены. Так держать.</div>'
      : pending.map((reading) => {
          const reason = reading.reason === 'follow_up'
            ? `вернуться ${formatDate(reading.follow_up_date)}`
            : 'итог не записан';

          return `
            <a class="list-row pending-outcome-row" href="#/readings/${reading.id}">
              <div class="list-main">
                <div class="list-title">${escapeHtml(reading.title || reading.question || 'Расклад')}</div>
                <div class="list-sub">${formatDate(reading.reading_date)} · ${escapeHtml(reading.client_name || 'для себя')}${reading.event_titles ? ` · ${escapeHtml(reading.event_titles)}` : ''}</div>
              </div>
              <span class="outcome-badge ${reading.latest_rating ? outcomeRatingClass(reading.latest_rating) : 'rating-pending'}">
                ${reading.latest_rating
                  ? OUTCOME_RATING_LABELS[reading.latest_rating] ?? reading.latest_rating
                  : 'нет оценки'}
              </span>
              <span class="muted pending-reason">${escapeHtml(reason)}</span>
            </a>
          `;
        }).join('');

    const events = eventsResponse.ok ? await eventsResponse.json() : [];

    const latestEventsHost = document.getElementById('latest-events');
    const latestEvents = events.slice(0, 5);
    latestEventsHost.innerHTML = latestEvents.length === 0
      ? '<div class="empty">Событий пока нет. <a href="#/events/new">Создать первое</a></div>'
      : latestEvents.map((event) => `
          <a class="list-row" href="#/events/${event.id}">
            <div class="list-main">
              <div class="list-title">${escapeHtml(event.title)}</div>
              <div class="list-sub">${[eventDateLabel(event), event.category].filter(Boolean).map(escapeHtml).join(' · ')}</div>
            </div>
            <span class="status-badge ${eventStatusClass(event.status)}">${EVENT_STATUS_LABELS[event.status] ?? event.status}</span>
          </a>
        `).join('');

    const calendarHost = document.getElementById('overview-calendar');
    let overviewMonth = todayIso().slice(0, 7);

    const paintOverviewCalendar = () => {
      calendarHost.innerHTML = calendarMarkup({
        month: overviewMonth,
        entries,
        events,
        compact: true,
      });
    };

    calendarHost.addEventListener('click', (event) => {
      const shift = event.target.closest('[data-calendar-shift]');
      if (shift) {
        overviewMonth = shiftMonth(overviewMonth, Number(shift.dataset.calendarShift));
        paintOverviewCalendar();
        return;
      }

      if (event.target.closest('[data-calendar-today]')) {
        overviewMonth = todayIso().slice(0, 7);
        paintOverviewCalendar();
        return;
      }

      const add = event.target.closest('[data-calendar-add]');
      if (add) {
        event.preventDefault();
        openCalendarMenu(add, add.dataset.calendarAdd);
        return;
      }

      const day = event.target.closest('[data-calendar-date]');
      if (day) {
        const date = day.dataset.calendarDate;
        location.hash = `#/journal?view=calendar&month=${date.slice(0, 7)}&date=${date}`;
      }
    });

    paintOverviewCalendar();
  } catch (error) {
    console.error('Не удалось загрузить статистику:', error);
  }
}

/* ---------- Карты ---------- */

async function getCards() {
  if (!cardsCache) {
    const response = await fetch('/api/cards');
    if (!response.ok) throw new Error('Не удалось загрузить справочник карт');
    cardsCache = await response.json();
  }
  return cardsCache;
}

function cardTile(card) {
  return `
    <a class="card-tile" href="#/cards/${card.id}">
      <div class="card-image">
        <img src="${card.image}" alt="${card.name_ru}" loading="lazy"
             onerror="this.onerror=null;this.src='cards/placeholder.svg'">
        ${card.has_personal ? '<span class="card-personal-dot" title="Есть моя трактовка или заметки"></span>' : ''}
      </div>
      <div class="card-tile-name">${card.name_ru}</div>
      <div class="card-tile-sub">${card.name_en}</div>
    </a>
  `;
}

async function renderCards(params = new URLSearchParams()) {
  const initialQuery = (params.get('q') ?? '').trim();
  const requestedFilter = params.get('filter');
  const initialFilter = CARD_FILTERS.some((filter) => filter.id === requestedFilter)
    ? requestedFilter
    : 'all';

  viewEl.innerHTML = `
    <div class="cards-toolbar">
      <div class="chips" id="card-filters">
        ${CARD_FILTERS.map((filter) => `
          <button type="button" class="chip${filter.id === initialFilter ? ' is-active' : ''}" data-filter="${filter.id}">
            ${filter.label}
          </button>
        `).join('')}
      </div>
      <span class="search-field">
        <input class="search" id="card-search" type="search" autocomplete="off"
               placeholder="Поиск по названию или ключевому слову" value="${escapeHtml(initialQuery)}">
        <button class="search-clear" id="card-search-clear" type="button"
                aria-label="Очистить поиск" title="Очистить поиск" hidden>×</button>
      </span>
      <button class="btn btn-small reset-filters" type="button" id="cards-reset" hidden>Сбросить фильтры</button>
    </div>
    <p class="result-count muted" id="cards-count"></p>
    <div class="cards-grid" id="cards-grid"><p class="muted">Загрузка…</p></div>
  `;

  const grid = document.getElementById('cards-grid');
  const counter = document.getElementById('cards-count');

  let cards;
  try {
    cards = await getCards();
  } catch (error) {
    grid.innerHTML = `<p class="muted">${error.message}</p>`;
    return;
  }

  const state = { filter: initialFilter, query: initialQuery };
  const resetButton = document.getElementById('cards-reset');
  const clearSearchButton = document.getElementById('card-search-clear');

  function paint() {
    const query = state.query.trim().toLowerCase();
    resetButton.hidden = state.filter === 'all' && !state.query.trim();
    clearSearchButton.hidden = !state.query.trim();
    const list = cards.filter((card) => {
      if (state.filter === 'major' && card.arcana !== 'major') return false;
      if (state.filter !== 'all' && state.filter !== 'major' && card.suit !== state.filter) return false;
      if (!query) return true;
      const personal = (card.interpretations ?? [])
        .map((item) => `${item.title ?? ''} ${item.body}`)
        .join(' ');
      const haystack = [
        card.name_ru,
        card.name_en,
        (card.keywords ?? []).join(' '),
        (card.themes ?? []).join(' '),
        card.notes ?? '',
        personal,
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });

    grid.innerHTML = list.length > 0
      ? list.map(cardTile).join('')
      : '<p class="muted">Ничего не найдено. Попробуйте другое слово или фильтр.</p>';

    counter.textContent = `${list.length} ${plural(list.length, ['карта', 'карты', 'карт'])}`;
  }

  document.getElementById('card-filters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    state.filter = button.dataset.filter;
    for (const chip of document.querySelectorAll('#card-filters .chip')) {
      chip.classList.toggle('is-active', chip === button);
    }
    paint();
  });

  const search = document.getElementById('card-search');
  search.addEventListener('input', () => {
    state.query = search.value;
    paint();
  });

  clearSearchButton.addEventListener('click', () => {
    state.query = '';
    search.value = '';
    history.replaceState(null, '', '#/cards');
    paint();
    search.focus();
  });

  resetButton.addEventListener('click', () => {
    state.filter = 'all';
    state.query = '';
    search.value = '';
    history.replaceState(null, '', '#/cards');
    for (const chip of document.querySelectorAll('#card-filters .chip')) {
      chip.classList.toggle('is-active', chip.dataset.filter === 'all');
    }
    paint();
  });

  paint();
}

async function renderCardDetail(id) {
  viewEl.innerHTML = '<p class="muted">Загрузка карты…</p>';

  let card;
  try {
    card = await api(`/api/cards/${encodeURIComponent(id)}`);
  } catch (error) {
    viewEl.innerHTML = `
      <div class="panel">
        <p>${escapeHtml(error.message)}</p>
        <p class="hint"><a href="#/cards">← ко всем картам</a></p>
      </div>
    `;
    return;
  }

  titleEl.textContent = card.name_ru;
  subtitleEl.textContent = card.name_en;
  document.title = `${card.name_ru} · Таро`;

  const meta = [
    card.arcana === 'major' ? 'Старший аркан' : SUITS[card.suit] ?? 'Младший аркан',
    card.element ? `Стихия: ${card.element.toLowerCase()}` : null,
    card.astrology ? `Астрология: ${card.astrology}` : null,
  ].filter(Boolean);

  const notes = (card.notes ?? '').trim();
  const interpretations = card.interpretations ?? [];

  const interpRow = (item) => `
    <div class="interp-item">
      <div class="interp-head">
        <span class="interp-orientation ${item.orientation}">
          ${item.orientation === 'upright' ? 'прямое' : 'перевёрнутое'}
        </span>
        <span class="interp-spread${item.spread_name ? '' : ' is-all'}">${escapeHtml(item.spread_name || 'Для всех')}</span>
        ${item.title ? `<span class="interp-title">${escapeHtml(item.title)}</span>` : ''}
      </div>
      <div class="interp-body">${escapeHtml(item.body)}</div>
    </div>
  `;

  viewEl.innerHTML = `
    <a class="back-link" href="#/cards">← все карты</a>

    <div class="card-detail">
      <figure class="card-detail-image">
        <img src="${card.image}" alt="${card.name_ru}"
             onerror="this.onerror=null;this.src='cards/placeholder.svg'">
      </figure>

      <div class="card-detail-body">
        <div class="meta-row">
          ${meta.map((item) => `<span class="meta-chip">${item}</span>`).join('')}
        </div>

        <div class="keywords">
          ${(card.keywords ?? []).map((word) => `
            <a class="keyword keyword-link" href="#/cards?q=${encodeURIComponent(word)}"
               title="Показать карты с этим ключевым словом">${escapeHtml(word)}</a>
          `).join('')}
        </div>

        <section class="meaning">
          <h3>Прямое положение</h3>
          <p>${escapeHtml(card.upright ?? '')}</p>
        </section>

        <section class="meaning is-reversed">
          <h3>Перевёрнутое положение</h3>
          <p>${escapeHtml(card.reversed ?? '')}</p>
        </section>

        <div class="themes-row">
          <span class="muted">Темы:</span>
          ${(card.themes ?? []).map((theme) => `
            <a class="theme theme-link" href="#/cards?q=${encodeURIComponent(theme)}"
               title="Показать карты с этой темой">${escapeHtml(theme)}</a>
          `).join('')}
        </div>

        <div class="card-detail-actions">
          <a class="btn" href="#/cards/${card.id}/edit">
            ${interpretations.length > 0 ? `Мои трактовки (${interpretations.length})` : 'Добавить свою трактовку'}
          </a>
          <a class="btn" href="#/journal/new?card=${card.id}">Запись в дневник</a>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>Мои трактовки</h2>
        <a class="panel-link" href="#/cards/${card.id}/edit">добавить или изменить →</a>
      </div>
      ${interpretations.length > 0
        ? `<div class="interp-list">${interpretations.map(interpRow).join('')}</div>`
        : '<p class="muted notes-empty">Своих трактовок пока нет — выше исходные тексты из справочника.</p>'}
    </div>

    ${notes
      ? `<div class="panel">
           <h2>Личные заметки</h2>
           <div class="notes">${escapeHtml(notes)}</div>
         </div>`
      : ''}
  `;
}

async function renderCardEdit(id, options = {}) {
  viewEl.innerHTML = '<p class="muted">Загрузка карты…</p>';

  let card;
  try {
    card = await api(`/api/cards/${encodeURIComponent(id)}`);
  } catch (error) {
    viewEl.innerHTML = `
      <div class="panel">
        <p>${escapeHtml(error.message)}</p>
        <p class="hint"><a href="#/cards">← ко всем картам</a></p>
      </div>
    `;
    return;
  }

  titleEl.textContent = 'Мои трактовки';
  subtitleEl.textContent = `${card.name_ru} (${card.name_en})`;
  document.title = `Мои трактовки: ${card.name_ru} · Таро`;

  // null — форма закрыта; иначе черновик формы (id = null для новой записи).
  const initialSpread = String(options.spread ?? '').trim();
  let formState = initialSpread
    ? {
        id: null,
        orientation: options.orientation === 'reversed' ? 'reversed' : 'upright',
        title: '',
        body: '',
        spread_name: initialSpread,
      }
    : null;

  viewEl.innerHTML = `
    <a class="back-link" href="#/cards/${card.id}">← к карте</a>

    <div class="panel">
      <div class="card-edit-head">
        <span class="card-edit-thumb">
          <img src="${card.image}" alt="" loading="lazy"
               onerror="this.onerror=null;this.src='cards/placeholder.svg'">
        </span>
        <div>
          <div class="card-edit-name">${escapeHtml(card.name_ru)}</div>
          <div class="muted card-edit-en">${escapeHtml(card.name_en)}</div>
        </div>
      </div>

      <h2 class="section-title">Исходные тексты</h2>
      <details class="original-text">
        <summary>Прямое положение</summary>
        <p>${escapeHtml(card.upright ?? '')}</p>
      </details>
      <details class="original-text">
        <summary>Перевёрнутое положение</summary>
        <p>${escapeHtml(card.reversed ?? '')}</p>
      </details>
      <p class="field-hint muted original-note">Исходные тексты не меняются — свои трактовки добавляются ниже.</p>
    </div>

    <div class="panel" id="interp-panel"></div>

    <form class="form panel" id="notes-form" novalidate>
      <h2 class="section-title">Личные заметки</h2>
      <label>Заметки к карте
        <textarea name="notes" rows="5" maxlength="10000"
                  placeholder="Наблюдения, свои ассоциации, как карта проявлялась в раскладах">${escapeHtml(card.notes ?? '')}</textarea>
      </label>
      <p class="form-error" id="notes-error"></p>
      <p class="form-ok" id="notes-ok" hidden></p>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">Сохранить заметки</button>
      </div>
    </form>
  `;

  const panel = document.getElementById('interp-panel');

  function interpRow(item) {
    return `
      <div class="interp-item">
        <div class="interp-head">
          <span class="interp-orientation ${item.orientation}">
            ${item.orientation === 'upright' ? 'прямое' : 'перевёрнутое'}
          </span>
          <span class="interp-spread${item.spread_name ? '' : ' is-all'}">${escapeHtml(item.spread_name || 'Для всех')}</span>
          ${item.title ? `<span class="interp-title">${escapeHtml(item.title)}</span>` : ''}
          <span class="interp-actions">
            <button class="icon-btn" type="button" data-action="edit" data-id="${item.id}"
                    title="Изменить">✎</button>
            <button class="icon-btn danger" type="button" data-action="delete" data-id="${item.id}"
                    title="Удалить">×</button>
          </span>
        </div>
        <div class="interp-body">${escapeHtml(item.body)}</div>
      </div>
    `;
  }

  function paintInterps() {
    const list = card.interpretations ?? [];
    const spreadNames = [...SPREAD_TYPES];
    if (formState?.spread_name && !spreadNames.includes(formState.spread_name)) {
      spreadNames.push(formState.spread_name);
    }

    const formHtml = formState ? `
      <form class="form interp-form" id="interp-form" novalidate>
        <label>Расклад
          <select name="spread_name">
            <option value="">Для всех раскладов</option>
            ${spreadNames.map((name) => `
              <option value="${escapeHtml(name)}"${formState.spread_name === name ? ' selected' : ''}>
                ${escapeHtml(name)}
              </option>
            `).join('')}
          </select>
        </label>
        <div class="form-row">
          <label>Положение
            <select name="orientation">
              <option value="upright"${formState.orientation === 'upright' ? ' selected' : ''}>Прямое</option>
              <option value="reversed"${formState.orientation === 'reversed' ? ' selected' : ''}>Перевёрнутое</option>
            </select>
          </label>
          <label>Название <span class="muted">(необязательно)</span>
            <input name="title" maxlength="200" value="${escapeHtml(formState.title)}"
                   placeholder="Например: для работы">
          </label>
        </div>
        <label>Трактовка
          <textarea name="body" rows="5" maxlength="1000"
                    placeholder="Как вы читаете эту карту в этом положении">${escapeHtml(formState.body)}</textarea>
        </label>
        <p class="field-hint muted">Максимум 1000 символов.</p>
        <p class="form-error" id="interp-error"></p>
        <div class="form-actions">
          <button class="btn btn-primary" type="submit">${formState.id ? 'Сохранить изменения' : 'Добавить'}</button>
          <button class="btn" type="button" data-action="cancel">Отмена</button>
        </div>
      </form>
    ` : '';

    panel.innerHTML = `
      <div class="panel-head">
        <h2>Мои трактовки</h2>
        ${formState ? '' : '<button class="btn" type="button" data-action="add">Добавить трактовку</button>'}
      </div>
      ${formHtml}
      ${list.length > 0
        ? `<div class="interp-list">${list.map(interpRow).join('')}</div>`
        : '<p class="muted notes-empty">Пока нет своих трактовок. Исходные тексты — выше.</p>'}
    `;
    enhanceSelects(panel);
  }

  async function reloadCard() {
    card = await api(`/api/cards/${card.id}`);
    formState = null;
    cardsCache = null;
    paintInterps();
  }

  panel.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;

    if (action === 'add') {
      formState = { id: null, orientation: 'upright', title: '', body: '', spread_name: '' };
      paintInterps();
      document.querySelector('#interp-form textarea')?.focus();
      return;
    }

    if (action === 'cancel') {
      formState = null;
      paintInterps();
      return;
    }

    if (action === 'edit') {
      const item = (card.interpretations ?? []).find(
        (row) => row.id === Number(button.dataset.id),
      );
      if (!item) return;
      formState = {
        id: item.id,
        orientation: item.orientation,
        title: item.title ?? '',
        body: item.body,
        spread_name: item.spread_name ?? '',
      };
      paintInterps();
      document.querySelector('#interp-form textarea')?.focus();
      return;
    }

    if (action === 'delete') {
      const item = (card.interpretations ?? []).find(
        (row) => row.id === Number(button.dataset.id),
      );
      if (!item) return;
      if (!confirm('Удалить эту трактовку? Исходный текст карты останется.')) return;

      try {
        await api(`/api/interpretations/${item.id}`, { method: 'DELETE' });
        await reloadCard();
      } catch (error) {
        alert(error.message);
      }
    }
  });

  panel.addEventListener('submit', async (event) => {
    const form = event.target.closest('#interp-form');
    if (!form) return;
    event.preventDefault();

    const errorEl = document.getElementById('interp-error');
    errorEl.textContent = '';

    const data = new FormData(form);
    const payload = {
      orientation: data.get('orientation'),
      title: data.get('title'),
      body: data.get('body'),
      spread_name: data.get('spread_name'),
    };

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;

    try {
      if (formState?.id) {
        await api(`/api/interpretations/${formState.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/api/cards/${card.id}/interpretations`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      await reloadCard();
    } catch (error) {
      errorEl.textContent = error.message;
      submit.disabled = false;
    }
  });

  const notesForm = document.getElementById('notes-form');
  notesForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const errorEl = document.getElementById('notes-error');
    const okEl = document.getElementById('notes-ok');
    const submit = notesForm.querySelector('button[type="submit"]');
    errorEl.textContent = '';
    okEl.hidden = true;
    submit.disabled = true;

    try {
      const updated = await api(`/api/cards/${card.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: new FormData(notesForm).get('notes') }),
      });
      card = updated;
      cardsCache = null;
      okEl.textContent = 'Заметки сохранены';
      okEl.hidden = false;
    } catch (error) {
      errorEl.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });

  paintInterps();
}

/* ---------- Клиенты ---------- */

async function renderClients() {
  viewEl.innerHTML = `
    <div class="cards-toolbar">
      <input class="search" id="client-search" type="search" autocomplete="off"
             placeholder="Поиск по имени или контакту">
      <button class="btn btn-small reset-filters" type="button" id="clients-reset" hidden>Сбросить фильтры</button>
      <a class="btn btn-primary" href="#/clients/new">Добавить клиента</a>
    </div>
    <p class="result-count muted" id="clients-count"></p>
    <div class="panel list-panel" id="clients-list"><p class="muted">Загрузка…</p></div>
  `;

  const list = document.getElementById('clients-list');
  const counter = document.getElementById('clients-count');

  let clients;
  try {
    clients = await api('/api/clients');
  } catch (error) {
    list.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
    return;
  }

  const state = { query: '' };
  const resetButton = document.getElementById('clients-reset');

  function paint() {
    const query = state.query.trim().toLowerCase();
    resetButton.hidden = !state.query.trim();
    const visible = clients.filter((client) => {
      if (!query) return true;
      return `${client.name} ${client.contact ?? ''}`.toLowerCase().includes(query);
    });

    counter.textContent = `${visible.length} ${plural(visible.length, ['клиент', 'клиента', 'клиентов'])}`;

    if (visible.length === 0) {
      list.innerHTML = query
        ? '<div class="empty">Никого не нашли. Попробуйте другое слово.</div>'
        : '<div class="empty">Пока ни одного клиента.<br><a href="#/clients/new">Добавить первого</a></div>';
      return;
    }

    list.innerHTML = visible.map((client) => {
      const details = [
        client.contact,
        client.birth_date ? `д.р. ${formatDate(client.birth_date)}` : null,
      ].filter(Boolean).map(escapeHtml).join(' · ');

      return `
        <a class="list-row" href="#/clients/${client.id}">
          <div class="list-main">
            <div class="list-title">${escapeHtml(client.name)}</div>
            <div class="list-sub">${details || 'нет контактов'}</div>
          </div>
          <div class="list-meta">добавлен ${formatDate(client.created_at)}</div>
        </a>
      `;
    }).join('');
  }

  const search = document.getElementById('client-search');
  search.addEventListener('input', () => {
    state.query = search.value;
    paint();
  });

  resetButton.addEventListener('click', () => {
    state.query = '';
    search.value = '';
    search.focus();
    paint();
  });

  paint();
}

async function renderClientDetail(id) {
  viewEl.innerHTML = '<p class="muted">Загрузка…</p>';

  let client;
  let journal = [];
  try {
    [client, journal] = await Promise.all([
      api(`/api/clients/${encodeURIComponent(id)}`),
      api(`/api/journal?client_id=${encodeURIComponent(id)}`).catch(() => []),
    ]);
  } catch (error) {
    viewEl.innerHTML = `
      <div class="panel">
        <p>${escapeHtml(error.message)}</p>
        <p class="hint"><a href="#/clients">← ко всем клиентам</a></p>
      </div>
    `;
    return;
  }

  titleEl.textContent = client.name;
  subtitleEl.textContent = client.contact || 'карточка клиента';
  document.title = `${client.name} · Таро`;

  const readings = client.readings ?? [];
  const readingsHtml = readings.length > 0
    ? readings.map((reading) => `
        <a class="list-row" href="#/readings/${reading.id}">
          <div class="list-main">
            <div class="list-title">${escapeHtml(reading.title || reading.question || 'Расклад')}</div>
            <div class="list-sub">${formatDate(reading.reading_date)}${reading.spread_name ? ` · ${escapeHtml(reading.spread_name)}` : ''}</div>
          </div>
          <span class="status-badge status-${reading.status}">${READING_STATUS_LABELS[reading.status] ?? reading.status}</span>
        </a>
      `).join('')
    : `<div class="empty">Раскладов пока нет.<br><a href="#/readings/new?client=${client.id}">Создать первый</a></div>`;

  const info = [
    client.contact ? `Контакт: ${escapeHtml(client.contact)}` : null,
    client.birth_date ? `Дата рождения: ${formatDate(client.birth_date)}` : null,
    `Добавлен: ${formatDate(client.created_at)}`,
  ].filter(Boolean);

  const journalHtml = journal.length > 0
    ? journal.map((entry) => `
        <a class="list-row" href="#/journal/${entry.id}">
          <div class="list-main">
            <div class="list-title">${escapeHtml(journalTitle(entry))}</div>
            <div class="list-sub">${formatLongDate(entry.entry_date)}${entry.tags?.length ? ` · ${entry.tags.map((tag) => `#${escapeHtml(tag)}`).join(' ')}` : ''}</div>
          </div>
        </a>
      `).join('')
    : `<div class="empty">Записей пока нет.<br><a href="#/journal/new?client=${client.id}">Добавить первую</a></div>`;

  const clientEvents = client.events ?? [];
  const eventsHtml = clientEvents.length > 0
    ? clientEvents.map((event) => `
        <a class="list-row" href="#/events/${event.id}">
          <div class="list-main">
            <div class="list-title">${escapeHtml(event.title)}</div>
            <div class="list-sub">${eventDateLabel(event)}${event.category ? ` · ${escapeHtml(event.category)}` : ''}</div>
          </div>
          <span class="status-badge ${eventStatusClass(event.status)}">${EVENT_STATUS_LABELS[event.status] ?? event.status}</span>
        </a>
      `).join('')
    : '<div class="empty">Событий пока нет. Они появятся, когда вы свяжете событие с раскладом клиента.</div>';

  viewEl.innerHTML = `
    <a class="back-link" href="#/clients">← все клиенты</a>

    <div class="panel">
      <div class="detail-head">
        <p class="muted detail-info">${info.join(' · ')}</p>
        <div class="actions">
          <a class="btn btn-primary" href="#/readings/new?client=${client.id}">Новый расклад</a>
          <a class="btn" href="#/clients/${client.id}/edit">Редактировать</a>
          <button class="btn btn-danger" type="button" id="client-delete">Удалить</button>
        </div>
      </div>
      ${client.notes
        ? `<div class="notes">${escapeHtml(client.notes)}</div>`
        : '<p class="muted notes-empty">Заметок пока нет.</p>'}
    </div>

    <div class="panel">
      <h2>Расклады</h2>
      ${readingsHtml}
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>Записи дневника</h2>
        <a class="panel-link" href="#/journal/new?client=${client.id}">новая запись →</a>
      </div>
      ${journalHtml}
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>События</h2>
        <a class="panel-link" href="#/events">все события →</a>
      </div>
      ${eventsHtml}
    </div>
  `;

  document.getElementById('client-delete').addEventListener('click', async () => {
    if (!confirm(`Удалить клиента «${client.name}»? Это действие нельзя отменить.`)) return;
    try {
      await api(`/api/clients/${client.id}`, { method: 'DELETE' });
      location.hash = '#/clients';
    } catch (error) {
      alert(error.message);
    }
  });
}

async function renderClientForm(id) {
  const isEdit = Boolean(id);
  let client = { name: '', contact: '', birth_date: '', notes: '' };

  if (isEdit) {
    viewEl.innerHTML = '<p class="muted">Загрузка…</p>';
    try {
      client = await api(`/api/clients/${encodeURIComponent(id)}`);
    } catch (error) {
      viewEl.innerHTML = `
        <div class="panel">
          <p>${escapeHtml(error.message)}</p>
          <p class="hint"><a href="#/clients">← ко всем клиентам</a></p>
        </div>
      `;
      return;
    }
  }

  titleEl.textContent = isEdit ? 'Редактирование клиента' : 'Новый клиент';
  subtitleEl.textContent = isEdit ? client.name : 'Заполните карточку';
  document.title = `${titleEl.textContent} · Таро`;

  const backHref = isEdit ? `#/clients/${client.id}` : '#/clients';

  viewEl.innerHTML = `
    <a class="back-link" href="${backHref}">← назад</a>
    <form class="panel form" id="client-form" novalidate>
      <label><span>Имя<span class="req">*</span></span>
        <input name="name" maxlength="200" required placeholder="Например, Анна"
               value="${escapeHtml(client.name)}">
      </label>
      <label>Контакт
        <input name="contact" maxlength="300" placeholder="Телефон, мессенджер, почта"
               value="${escapeHtml(client.contact)}">
      </label>
      <label>Дата рождения
        <input name="birth_date" type="date" value="${client.birth_date ?? ''}">
      </label>
      <label>Заметки
        <textarea name="notes" rows="6"
                  placeholder="Что важно помнить об этом человеке">${escapeHtml(client.notes)}</textarea>
      </label>
      <p class="form-error" id="form-error"></p>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">${isEdit ? 'Сохранить' : 'Добавить'}</button>
        <a class="btn" href="${backHref}">Отмена</a>
      </div>
    </form>
  `;

  const form = document.getElementById('client-form');
  const errorEl = document.getElementById('form-error');
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    if (!String(data.name ?? '').trim()) {
      errorEl.textContent = 'Имя обязательно.';
      return;
    }

    submitButton.disabled = true;
    errorEl.textContent = '';

    try {
      const saved = isEdit
        ? await api(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) })
        : await api('/api/clients', { method: 'POST', body: JSON.stringify(data) });
      location.hash = `#/clients/${saved.id}`;
    } catch (error) {
      errorEl.textContent = error.message;
      submitButton.disabled = false;
    }
  });
}

/* ---------- Расклады ---------- */

async function renderReadings() {
  viewEl.innerHTML = `
    <div class="cards-toolbar">
      <input class="search" id="reading-search" type="search" autocomplete="off"
             placeholder="Поиск по вопросу, заголовку или клиенту">
      <a class="btn btn-primary" href="#/readings/new">Новый расклад</a>
    </div>

    <div class="filters-row">
      <div class="chips" id="reading-status">
        ${READING_STATUS_FILTERS.map((filter, index) => `
          <button type="button" class="chip${index === 0 ? ' is-active' : ''}" data-status="${filter.id}">
            ${filter.label}
          </button>
        `).join('')}
      </div>
      <select class="select chip-select" id="reading-client">
        <option value="">Все клиенты</option>
      </select>
      <div class="date-range">
        <label class="date-filter">с <input class="select" type="date" id="reading-from"></label>
        <label class="date-filter">по <input class="select" type="date" id="reading-to"></label>
      </div>
      <button class="btn btn-small reset-filters" type="button" id="readings-reset" hidden>Сбросить фильтры</button>
    </div>

    <p class="result-count muted" id="readings-count"></p>
    <div class="panel list-panel" id="readings-list"><p class="muted">Загрузка…</p></div>
  `;

  const list = document.getElementById('readings-list');
  const counter = document.getElementById('readings-count');

  let readings;
  let clients;
  try {
    [readings, clients] = await Promise.all([api('/api/readings'), api('/api/clients')]);
  } catch (error) {
    list.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
    return;
  }

  const clientSelect = document.getElementById('reading-client');
  clientSelect.insertAdjacentHTML('beforeend', clients
    .map((client) => `<option value="${client.id}">${escapeHtml(client.name)}</option>`)
    .join(''));
  enhanceSelects(viewEl);

  const state = { status: 'all', clientId: '', from: '', to: '', query: '' };
  const resetButton = document.getElementById('readings-reset');

  function updateReset() {
    resetButton.hidden = state.status === 'all'
      && !state.clientId
      && !state.from
      && !state.to
      && !state.query.trim();
  }

  function resetFilters() {
    state.status = 'all';
    state.clientId = '';
    state.from = '';
    state.to = '';
    state.query = '';

    for (const chip of document.querySelectorAll('#reading-status .chip')) {
      chip.classList.toggle('is-active', chip.dataset.status === 'all');
    }
    setSelectValue(clientSelect, '');
    setSelectActive(clientSelect, false);
    document.getElementById('reading-from').value = '';
    document.getElementById('reading-to').value = '';
    document.getElementById('reading-search').value = '';
    paint();
  }

  function paint() {
    const query = state.query.trim().toLowerCase();

    const visible = readings.filter((reading) => {
      if (state.status !== 'all' && reading.status !== state.status) return false;
      if (state.clientId && String(reading.client_id) !== state.clientId) return false;
      if (state.from && reading.reading_date < state.from) return false;
      if (state.to && reading.reading_date > state.to) return false;
      if (!query) return true;

      const haystack = [
        reading.title,
        reading.question,
        reading.client_name,
        reading.interpretation,
        reading.summary,
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(query);
    });

    counter.textContent = `${visible.length} ${plural(visible.length, ['расклад', 'расклада', 'раскладов'])}`;
    updateReset();

    if (visible.length === 0) {
      list.innerHTML = readings.length === 0
        ? '<div class="empty">Пока ни одного расклада.<br><a href="#/readings/new">Создать первый</a></div>'
        : '<div class="empty">Ничего не найдено. Попробуйте изменить фильтры.</div>';
      return;
    }

    list.innerHTML = visible.map((reading) => {
      const title = reading.title || reading.question || 'Без названия';
      const question = reading.question && reading.question !== title ? reading.question : '';
      const cardsLabel = `${reading.cards_count} ${plural(reading.cards_count, ['карта', 'карты', 'карт'])}`;
      const spreadName = reading.spread_name || '';
      const spreadCount = Number((spreadName.match(/^(\d+)\s+карт/) ?? [])[1]);
      const meta = [
        reading.client_name || 'для себя',
        spreadName,
        spreadCount === reading.cards_count ? '' : cardsLabel,
      ].filter(Boolean).join(' · ');

      return `
        <div class="reading-row">
          <a class="reading-row-link" href="#/readings/${reading.id}">
            <div class="reading-date">${formatDate(reading.reading_date)}</div>
            <div class="list-main">
              <div class="list-title">${escapeHtml(title)}</div>
              ${question ? `<div class="reading-question">${escapeHtml(question)}</div>` : ''}
              <div class="list-sub">${escapeHtml(meta)}</div>
            </div>
            <span class="status-badge status-${reading.status}">${READING_STATUS_LABELS[reading.status] ?? reading.status}</span>
          </a>
          <button class="icon-btn danger reading-row-delete" type="button"
                  data-delete-reading="${reading.id}" title="Удалить расклад"
                  aria-label="Удалить расклад «${escapeHtml(title)}»">×</button>
        </div>
      `;
    }).join('');
  }

  document.getElementById('reading-status').addEventListener('click', (event) => {
    const button = event.target.closest('[data-status]');
    if (!button) return;
    state.status = button.dataset.status;
    for (const chip of document.querySelectorAll('#reading-status .chip')) {
      chip.classList.toggle('is-active', chip === button);
    }
    paint();
  });

  clientSelect.addEventListener('change', () => {
    state.clientId = clientSelect.value;
    setSelectActive(clientSelect, Boolean(clientSelect.value));
    paint();
  });

  document.getElementById('reading-from').addEventListener('change', (event) => {
    state.from = event.target.value;
    paint();
  });

  document.getElementById('reading-to').addEventListener('change', (event) => {
    state.to = event.target.value;
    paint();
  });

  const search = document.getElementById('reading-search');
  search.addEventListener('input', () => {
    state.query = search.value;
    paint();
  });

  resetButton.addEventListener('click', resetFilters);

  list.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-reading]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();

    const reading = readings.find((item) => String(item.id) === button.dataset.deleteReading);
    if (!reading) return;
    const label = reading.title || reading.question || 'Без названия';
    if (!confirm(`Удалить расклад «${label}»? Это действие нельзя отменить.`)) return;

    button.disabled = true;
    try {
      await api(`/api/readings/${reading.id}`, { method: 'DELETE' });
      readings = readings.filter((item) => item.id !== reading.id);
      paint();
    } catch (error) {
      button.disabled = false;
      alert(error.message);
    }
  });

  paint();
}

async function renderReadingForm(id, options = {}) {
  let isEdit = Boolean(id);
  const isNewReading = !isEdit;
  let reading = {
    id: null,
    reading_date: todayIso(),
    client_id: null,
    title: '',
    question: '',
    spread_name: '',
    status: 'draft',
    interpretation: null,
    summary: null,
    cards: [],
  };
  let clients = [];
  let deck = [];

  viewEl.innerHTML = '<p class="muted">Загрузка…</p>';

  try {
    const [clientRows, loaded, deckCards] = await Promise.all([
      api('/api/clients'),
      isEdit ? api(`/api/readings/${encodeURIComponent(id)}`) : Promise.resolve(null),
      getCards(),
    ]);
    clients = clientRows;
    deck = deckCards;
    if (loaded) reading = loaded;
    if (!isEdit && options.clientId) reading.client_id = Number(options.clientId);
  } catch (error) {
    viewEl.innerHTML = `
      <div class="panel">
        <p>${escapeHtml(error.message)}</p>
        <p class="hint"><a href="#/readings">← к списку раскладов</a></p>
      </div>
    `;
    return;
  }

  if (!isEdit && options.eventId) {
    try {
      const sourceEvent = await api(`/api/events/${encodeURIComponent(options.eventId)}`);
      reading.title = sourceEvent.title;
      reading.question = sourceEvent.description || '';
    } catch {
      // событие могло быть удалено — расклад всё равно можно создать
    }
  }

  titleEl.textContent = isEdit ? 'Редактирование расклада' : 'Новый расклад';
  subtitleEl.textContent = isEdit
    ? (reading.title || reading.question || 'Без названия')
    : 'Дата, клиент, вопрос и тип';
  document.title = `${titleEl.textContent} · Таро`;

  const spreadOptions = [...SPREAD_TYPES];
  if (reading.spread_name && !spreadOptions.includes(reading.spread_name)) {
    spreadOptions.push(reading.spread_name);
  }

  viewEl.innerHTML = `
    <a class="back-link" href="#/readings">← к списку раскладов</a>
    <form class="panel form" id="reading-form" novalidate>
      <div class="form-row">
        <label><span>Дата<span class="req">*</span></span>
          <input name="reading_date" type="date" required value="${escapeHtml(reading.reading_date)}">
        </label>
        <label>Клиент
          <select name="client_id">
            <option value="">Для себя</option>
            ${clients.map((client) => `
              <option value="${client.id}"${Number(reading.client_id) === client.id ? ' selected' : ''}>
                ${escapeHtml(client.name)}
              </option>
            `).join('')}
          </select>
        </label>
      </div>

      <label>Заголовок
        <input name="title" maxlength="200" placeholder="Короткое название, например «Отношения: что происходит»"
               value="${escapeHtml(reading.title)}">
      </label>

      <label>Вопрос
        <textarea name="question" rows="4" maxlength="1000"
                  placeholder="С чем пришёл человек, что спрашиваем у карт">${escapeHtml(reading.question)}</textarea>
      </label>

      <label>Тип расклада
        <select name="spread_name">
          <option value="">Не выбран</option>
          ${spreadOptions.map((name) => `
            <option value="${escapeHtml(name)}"${reading.spread_name === name ? ' selected' : ''}>
              ${escapeHtml(name)}
            </option>
          `).join('')}
        </select>
      </label>
      <p class="field-hint muted" id="spread-hint"></p>

      <div class="reading-cards">
        <div class="reading-cards-head">
          <h3>Карты <span class="reading-cards-count" id="reading-cards-count"></span></h3>
          <button type="button" class="btn" id="toggle-picker">Добавить карту</button>
        </div>
        <div class="reading-cards-tools">
          <button type="button" class="btn" id="draw-cards">Вытянуть карты</button>
          <button type="button" class="btn" id="draw-one">Вытянуть одну</button>
          <button type="button" class="btn" id="refresh-interps"
                  title="Подтянуть трактовки, добавленные в другой вкладке">Обновить трактовки</button>
          <span class="muted" id="draw-hint"></span>
        </div>
        <div class="cards-editor" id="reading-cards-list"></div>
        <div class="card-picker" id="card-picker" hidden>
          <input class="search" id="card-picker-search" type="search" autocomplete="off"
                 placeholder="Поиск карты по названию или ключевому слову">
          <div class="card-picker-note muted" id="card-picker-note"></div>
          <div class="card-picker-grid" id="card-picker-grid"></div>
        </div>
      </div>

      <label>Трактовка расклада
        <textarea name="interpretation" rows="8" maxlength="2000"
                  placeholder="Что показывает расклад: карта за картой, связи между позициями">${escapeHtml(reading.interpretation ?? '')}</textarea>
      </label>
      <p class="field-hint muted">Максимум 2000 символов.</p>

      <label>Выводы
        <textarea name="summary" rows="4" maxlength="2000"
                  placeholder="Короткий итог, совет, к чему пришли">${escapeHtml(reading.summary ?? '')}</textarea>
      </label>
      <p class="field-hint muted">Максимум 2000 символов.</p>

      <label>Статус
        <select name="status">
          <option value="draft"${reading.status === 'draft' ? ' selected' : ''}>Черновик</option>
          <option value="done"${reading.status === 'done' ? ' selected' : ''}>Завершён</option>
          <option value="archived"${reading.status === 'archived' ? ' selected' : ''}>В архиве</option>
        </select>
      </label>

      <p class="form-error" id="form-error"></p>
      <p class="form-ok" id="form-ok" hidden>Черновик сохранён</p>

      <div class="form-actions">
        <button class="btn btn-primary" type="submit">${isEdit ? 'Сохранить изменения' : 'Сохранить черновик'}</button>
        <button class="btn" type="button" id="finish-reading">Завершить</button>
        <a class="btn" href="#/readings">Отмена</a>
      </div>
    </form>
  `;

  const form = document.getElementById('reading-form');
  const errorEl = document.getElementById('form-error');
  const okEl = document.getElementById('form-ok');
  const submitButton = form.querySelector('button[type="submit"]');
  enhanceSelects(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    if (!data.reading_date) {
      errorEl.textContent = 'Укажите дату расклада.';
      return;
    }

    errorEl.textContent = '';
    okEl.hidden = true;
    submitButton.disabled = true;

    const payload = {
      reading_date: data.reading_date,
      client_id: data.client_id ? Number(data.client_id) : null,
      title: data.title,
      question: data.question,
      spread_name: data.spread_name,
      status: data.status || 'draft',
      interpretation: data.interpretation ?? '',
      summary: data.summary ?? '',
      cards: (reading.cards ?? []).map((card, index) => ({
        card_id: card.card_id,
        position_index: index + 1,
        position_name: String(card.position_name ?? '').trim() || null,
        is_reversed: card.is_reversed ? 1 : 0,
        interpretation_id: card.interpretation_id ?? null,
        note: card.note ?? null,
      })),
    };

    try {
      const saved = isEdit
        ? await api(`/api/readings/${reading.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api('/api/readings', { method: 'POST', body: JSON.stringify(payload) });

      if (isNewReading && options.eventId) {
        try {
          await api(`/api/events/${encodeURIComponent(options.eventId)}/readings`, {
            method: 'POST',
            body: JSON.stringify({ reading_id: saved.id }),
          });
        } catch {
          // расклад уже создан; связь с событием можно добавить вручную
        }
      }

      reading = saved;
      isEdit = true;

      if (!location.hash.endsWith(`/readings/${saved.id}/edit`)) {
        history.replaceState(null, '', `#/readings/${saved.id}/edit`);
      }

      titleEl.textContent = 'Редактирование расклада';
      subtitleEl.textContent = saved.title || saved.question || 'Без названия';
      document.title = 'Редактирование расклада · Таро';
      submitButton.textContent = 'Сохранить изменения';
      okEl.textContent = saved.status === 'done'
        ? 'Расклад завершён'
        : saved.status === 'archived'
          ? 'Расклад в архиве'
          : 'Черновик сохранён';
      okEl.hidden = false;
      paintReadingCards();
    } catch (error) {
      errorEl.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });

  document.getElementById('finish-reading').addEventListener('click', () => {
    setSelectValue(form.elements.status, 'done');
    form.requestSubmit();
  });

  /* ----- Карты в раскладе ----- */

  const cardsHost = document.getElementById('reading-cards-list');
  const cardsCount = document.getElementById('reading-cards-count');
  const picker = document.getElementById('card-picker');
  const pickerGrid = document.getElementById('card-picker-grid');
  const pickerNote = document.getElementById('card-picker-note');
  const pickerSearch = document.getElementById('card-picker-search');
  const togglePicker = document.getElementById('toggle-picker');
  const spreadSelect = form.elements.spread_name;
  const spreadHint = document.getElementById('spread-hint');
  const drawHint = document.getElementById('draw-hint');
  const drawCardsButton = document.getElementById('draw-cards');
  const drawOneButton = document.getElementById('draw-one');
  const deckById = new Map(deck.map((card) => [card.id, card]));

  function currentPositions() {
    return SPREAD_POSITIONS[spreadSelect.value] ?? [];
  }

  function paintHints() {
    const positions = currentPositions();

    spreadHint.textContent = spreadSelect.value === 'Да/Нет'
      ? 'Вопрос, на который можно ответить «да» или «нет» · одна карта'
      : positions.length === 0
        ? 'Выберите шаблон — названия позиций подставятся автоматически.'
        : positions.length <= 3
          ? positions.join(' · ')
          : `${positions.length} ${plural(positions.length, ['позиция', 'позиции', 'позиций'])}`;

    if (positions.length === 0) {
      drawHint.textContent = 'Без шаблона — 3 карты';
      return;
    }

    const free = positions.length - reading.cards.length;
    drawHint.textContent = free > 0
      ? `Свободно ${free} ${plural(free, ['позиция', 'позиции', 'позиций'])}`
      : 'Все позиции шаблона заняты';
  }

  function makeCard(card, positionName, isReversed = Math.random() < 0.3 ? 1 : 0) {
    return {
      card_id: card.id,
      name_ru: card.name_ru,
      name_en: card.name_en,
      image: card.image,
      slug: card.slug,
      position_name: positionName ?? '',
      is_reversed: isReversed,
      interpretation_id: null,
      note: null,
    };
  }

  function interpretationsFor(card) {
    const source = deckById.get(card.card_id)?.interpretations ?? [];
    const orientation = card.is_reversed ? 'reversed' : 'upright';
    const spread = spreadSelect.value;
    return source.filter((item) => {
      if (item.orientation !== orientation) return false;
      if (!item.spread_name) return true;
      return Boolean(spread) && item.spread_name === spread;
    });
  }

  function hasValidInterpretation(card) {
    return interpretationsFor(card).some((item) => item.id === card.interpretation_id);
  }

  function shortText(value, max = 48) {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }

  async function refreshInterpretations() {
    try {
      const fresh = await api('/api/cards');
      deck = fresh;
      deckById.clear();
      for (const item of fresh) deckById.set(item.id, item);
      cardsCache = fresh;
      errorEl.textContent = '';
      paintReadingCards();
    } catch (error) {
      errorEl.textContent = error.message;
    }
  }

  function randomFreeCard() {
    const used = new Set(reading.cards.map((card) => card.card_id));
    const free = deck.filter((card) => !used.has(card.id));
    if (free.length === 0) return null;
    return free[Math.floor(Math.random() * free.length)];
  }

  function cardThumb(card, className = '') {
    return `<span class="reading-card-thumb${card.is_reversed ? ' is-reversed' : ''}${className ? ` ${className}` : ''}">
      <img src="${card.image || 'cards/placeholder.svg'}" alt="" loading="lazy"
           onerror="this.onerror=null;this.src='cards/placeholder.svg'">
    </span>`;
  }

  function paintReadingCards() {
    cardsCount.textContent = reading.cards.length > 0 ? String(reading.cards.length) : '';
    paintHints();

    if (reading.cards.length === 0) {
      cardsHost.innerHTML = '<p class="cards-editor-empty muted">Карт пока нет. Нажмите «Добавить карту» или «Вытянуть карты».</p>';
      paintPicker();
      return;
    }

    const template = currentPositions();

    cardsHost.innerHTML = reading.cards.map((card, index) => {
      const interps = interpretationsFor(card);
      const selected = interps.find((item) => item.id === card.interpretation_id) ?? null;
      if (!selected) card.interpretation_id = null;
      const source = deckById.get(card.card_id);
      const original = (card.is_reversed ? source?.reversed : source?.upright) ?? '';
      const spreadSpecific = interps.filter((item) => item.spread_name);
      const universalInterps = interps.filter((item) => !item.spread_name);
      const interpOption = (item) => `
        <option value="${item.id}"${selected?.id === item.id ? ' selected' : ''}>
          ${escapeHtml(item.title || shortText(item.body, 40))}
        </option>
      `;
      const interpGroups = [
        spreadSpecific.length > 0
          ? `<optgroup label="Для «${escapeHtml(spreadSelect.value)}»">${spreadSpecific.map(interpOption).join('')}</optgroup>`
          : '',
        universalInterps.length > 0
          ? `<optgroup label="Общие">${universalInterps.map(interpOption).join('')}</optgroup>`
          : '',
      ].join('');

      const addParams = new URLSearchParams();
      if (spreadSelect.value) addParams.set('spread', spreadSelect.value);
      addParams.set('orientation', card.is_reversed ? 'reversed' : 'upright');
      const addHref = `#/cards/${card.card_id}/edit?${addParams.toString()}`;
      const spreadSuffix = spreadSelect.value
        ? ` в раскладе «${escapeHtml(spreadSelect.value)}»`
        : '';

      return `
      <div class="reading-card-row" data-index="${index}">
        <span class="position-index">${index + 1}</span>
        ${cardThumb(card)}
        <div class="reading-card-main">
          <div class="reading-card-name">
            ${escapeHtml(card.name_ru)}
            <span class="muted">(${escapeHtml(card.name_en)})</span>
          </div>
          <div class="reading-card-controls">
            <input class="position-name" data-field="position_name" maxlength="120"
                   value="${escapeHtml(card.position_name ?? '')}"
                   placeholder="${escapeHtml(template[index] || `Позиция ${index + 1}: название`)}">
            <button type="button" class="reverse-toggle${card.is_reversed ? ' is-on' : ''}"
                    data-action="reverse" aria-pressed="${Boolean(card.is_reversed)}">
              ${card.is_reversed ? 'Перевёрнутая' : 'Прямая'}
            </button>
          </div>
          <div class="reading-card-interp">
            ${interps.length > 0
              ? `<select class="interp-pick" data-field="interpretation_id">
                   <option value="">Без своей трактовки</option>
                   ${interpGroups}
                 </select>
                 <p class="interp-preview"${selected ? '' : ' hidden'}>${selected
                   ? escapeHtml(shortText(selected.body, 180))
                   : ''}</p>
                 ${spreadSelect.value && spreadSpecific.length === 0
                   ? `<p class="interp-add"><a href="${escapeHtml(addHref)}" target="_blank" rel="noopener">Добавить трактовку для «${escapeHtml(spreadSelect.value)}»</a></p>`
                   : ''}`
              : `<p class="interp-none">
                   Нет своих трактовок для ${card.is_reversed ? 'перевёрнутого' : 'прямого'} положения${spreadSuffix}.
                   <a href="${escapeHtml(addHref)}" target="_blank" rel="noopener">Добавить</a>
                   <button type="button" class="icon-btn" data-action="refresh-interps"
                           title="Обновить список трактовок">↻</button>
                 </p>`}
          </div>
          ${original
            ? `<details class="reading-card-original">
                 <summary>Описание карты · ${card.is_reversed ? 'перевёрнутое' : 'прямое'} положение</summary>
                 <p>${escapeHtml(original)}</p>
               </details>`
            : ''}
        </div>
        <div class="reading-card-actions">
          <button type="button" class="icon-btn" data-action="up" title="Выше"
                  ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="icon-btn" data-action="down" title="Ниже"
                  ${index === reading.cards.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="icon-btn danger" data-action="remove" title="Убрать карту">×</button>
        </div>
      </div>
    `;
    }).join('');

    enhanceSelects(cardsHost);
    paintPicker();
  }

  function paintPicker() {
    if (picker.hidden) return;

    const query = pickerSearch.value.trim().toLowerCase();
    const used = new Set(reading.cards.map((card) => card.card_id));
    const list = deck.filter((card) => {
      if (!query) return true;
      const haystack = `${card.name_ru} ${card.name_en} ${(card.keywords ?? []).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });

    pickerNote.textContent = `${list.length} ${plural(list.length, ['карта', 'карты', 'карт'])} · в раскладе ${used.size}`;
    pickerGrid.innerHTML = list.length > 0
      ? list.map((card) => `
          <button type="button" class="picker-card" data-card-id="${card.id}"
                  ${used.has(card.id) ? 'disabled title="Уже в раскладе"' : ''}>
            <img src="${card.image || 'cards/placeholder.svg'}" alt="" loading="lazy"
                 onerror="this.onerror=null;this.src='cards/placeholder.svg'">
            <span class="picker-card-name">${escapeHtml(card.name_ru)}</span>
          </button>
        `).join('')
      : '<p class="muted">Ничего не найдено.</p>';
  }

  function addCard(cardId) {
    if (reading.cards.length >= 25) {
      errorEl.textContent = 'В раскладе уже максимум 25 карт.';
      return;
    }
    const card = deckById.get(cardId);
    if (!card) return;

    errorEl.textContent = '';
    const template = currentPositions();
    reading.cards.push(makeCard(card, template[reading.cards.length] ?? '', 0));
    paintReadingCards();
  }

  function drawAll() {
    const template = currentPositions();
    const target = template.length || 3;
    let free = target - reading.cards.length;

    if (free <= 0) {
      if (!confirm('Все позиции заняты. Заменить карты новыми?')) return;
      reading.cards = [];
      free = target;
    }

    if (reading.cards.length + free > 25) free = 25 - reading.cards.length;

    for (let index = 0; index < free; index += 1) {
      const card = randomFreeCard();
      if (!card) break;
      reading.cards.push(makeCard(card, template[reading.cards.length] ?? ''));
    }

    errorEl.textContent = '';
    paintReadingCards();
  }

  function drawOne() {
    if (reading.cards.length >= 25) {
      errorEl.textContent = 'В раскладе уже максимум 25 карт.';
      return;
    }

    const card = randomFreeCard();
    if (!card) {
      errorEl.textContent = 'Все 78 карт уже в раскладе.';
      return;
    }

    const template = currentPositions();
    reading.cards.push(makeCard(card, template[reading.cards.length] ?? ''));
    errorEl.textContent = '';
    paintReadingCards();
  }

  spreadSelect.addEventListener('change', () => {
    const template = currentPositions();
    const hasCustomNames = reading.cards.some((card, index) => {
      const name = String(card.position_name ?? '').trim();
      return name && name !== template[index];
    });

    if (template.length > 0 && hasCustomNames) {
      if (!confirm('Заменить названия позиций по шаблону?')) {
        paintHints();
        paintReadingCards();
        return;
      }
    }

    reading.cards.forEach((card, index) => {
      if (template[index]) card.position_name = template[index];
    });
    paintReadingCards();
  });

  drawCardsButton.addEventListener('click', drawAll);
  drawOneButton.addEventListener('click', drawOne);
  document.getElementById('refresh-interps').addEventListener('click', refreshInterpretations);

  cardsHost.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const row = button.closest('[data-index]');
    if (!row) return;

    const index = Number(row.dataset.index);
    const action = button.dataset.action;

    if (action === 'up' && index > 0) {
      [reading.cards[index - 1], reading.cards[index]] = [reading.cards[index], reading.cards[index - 1]];
    } else if (action === 'down' && index < reading.cards.length - 1) {
      [reading.cards[index + 1], reading.cards[index]] = [reading.cards[index], reading.cards[index + 1]];
    } else if (action === 'reverse') {
      const card = reading.cards[index];
      card.is_reversed = card.is_reversed ? 0 : 1;
      // Трактовка привязана к положению: если оно изменилось — сбрасываем.
      if (!hasValidInterpretation(card)) card.interpretation_id = null;
    } else if (action === 'refresh-interps') {
      refreshInterpretations();
      return;
    } else if (action === 'remove') {
      reading.cards.splice(index, 1);
    } else {
      return;
    }

    paintReadingCards();
  });

  cardsHost.addEventListener('input', (event) => {
    const input = event.target.closest('[data-field="position_name"]');
    if (!input) return;
    const row = input.closest('[data-index]');
    if (!row) return;
    reading.cards[Number(row.dataset.index)].position_name = input.value;
  });

  cardsHost.addEventListener('change', (event) => {
    const select = event.target.closest('[data-field="interpretation_id"]');
    if (!select) return;
    const row = select.closest('[data-index]');
    if (!row) return;

    const card = reading.cards[Number(row.dataset.index)];
    card.interpretation_id = select.value ? Number(select.value) : null;

    const item = interpretationsFor(card).find((row2) => row2.id === card.interpretation_id) ?? null;
    const preview = row.querySelector('.interp-preview');
    if (preview) {
      preview.textContent = item ? shortText(item.body, 180) : '';
      preview.hidden = !item;
    }
  });

  togglePicker.addEventListener('click', () => {
    const willOpen = picker.hidden;
    picker.hidden = !willOpen;
    togglePicker.textContent = willOpen ? 'Скрыть' : 'Добавить карту';
    if (willOpen) {
      paintPicker();
      pickerSearch.focus();
    }
  });

  pickerSearch.addEventListener('input', paintPicker);

  pickerGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-card-id]');
    if (!button || button.disabled) return;
    addCard(Number(button.dataset.cardId));
  });

  paintReadingCards();
}

/* ---------- Страница расклада ---------- */

function absoluteAssetUrl(path) {
  try {
    return new URL(path, location.href).href;
  } catch {
    return path;
  }
}

function readingPrintHtml(reading) {
  const title = reading.title || reading.question || 'Расклад';
  const client = reading.client_name ? escapeHtml(reading.client_name) : 'для себя';
  const status = READING_STATUS_LABELS[reading.status] ?? reading.status;
  const cardsCount = reading.cards.length;
  const cardsLabel = `${cardsCount} ${plural(cardsCount, ['карта', 'карты', 'карт'])}`;
  const rawSpreadName = reading.spread_name || '';
  const spreadName = rawSpreadName ? escapeHtml(rawSpreadName) : '';
  const spreadCount = Number((rawSpreadName.match(/^(\d+)\s+карт/) ?? [])[1]);
  const cardClass = cardsCount <= 1
    ? 'count-1'
    : cardsCount === 2
      ? 'count-2'
      : cardsCount === 3
        ? 'count-3'
        : cardsCount <= 6
          ? 'count-4'
          : 'count-5';

  const cardsHtml = cardsCount > 0
    ? reading.cards.map((card) => `
        <figure class="card">
          <div class="card-image${card.is_reversed ? ' is-reversed' : ''}">
            <img src="${escapeHtml(absoluteAssetUrl(card.image || 'cards/placeholder.svg'))}"
                 alt="${escapeHtml(card.name_ru)}">
          </div>
          <figcaption>
            <div class="card-position">${card.position_index}. ${escapeHtml(card.position_name || `Позиция ${card.position_index}`)}</div>
            <div class="card-name">${escapeHtml(card.name_ru)} <span class="en">(${escapeHtml(card.name_en)})</span></div>
            ${card.is_reversed ? '<span class="card-reversed">перевёрнутая</span>' : ''}
          </figcaption>
        </figure>
      `).join('')
    : '<p class="empty">В раскладе пока нет карт.</p>';

  const interpCards = reading.cards.filter((card) => card.interpretation_id && card.interpretation_body);
  const interpsHtml = interpCards.map((card) => `
    <div class="interp-item">
      <div class="interp-head">
        <strong>${card.position_index}. ${escapeHtml(card.position_name || `Позиция ${card.position_index}`)}</strong>
        <span>${escapeHtml(card.name_ru)}${card.is_reversed ? ' · перевёрнутая' : ''}</span>
      </div>
      ${card.interpretation_title ? `<div class="interp-title">${escapeHtml(card.interpretation_title)}</div>` : ''}
      <div class="prose">${escapeHtml(card.interpretation_body)}</div>
    </div>
  `).join('');

  const originalsHtml = reading.cards.map((card) => {
    const text = (card.is_reversed ? card.reversed : card.upright) ?? '';
    if (!text) return '';
    return `
      <div class="original-item">
        <div class="interp-head">
          <strong>${card.position_index}. ${escapeHtml(card.position_name || `Позиция ${card.position_index}`)}</strong>
          <span>${escapeHtml(card.name_ru)} (${escapeHtml(card.name_en)})${card.is_reversed ? ' · перевёрнутая' : ''}</span>
        </div>
        <div class="prose">${escapeHtml(text)}</div>
      </div>
    `;
  }).join('');

  const sections = [
    reading.interpretation
      ? `<section class="text-block"><h2>Трактовка расклада</h2><div class="prose">${escapeHtml(reading.interpretation)}</div></section>`
      : '',
    reading.summary
      ? `<section class="text-block"><h2>Выводы</h2><div class="prose">${escapeHtml(reading.summary)}</div></section>`
      : '',
    interpsHtml
      ? `<section class="text-block"><h2>Мои трактовки к картам</h2>${interpsHtml}</section>`
      : '',
    originalsHtml
      ? `<section class="text-block"><h2>Значения выпавших карт</h2>${originalsHtml}</section>`
      : '',
  ].filter(Boolean).join('');

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} — Таро</title>
  <base href="${escapeHtml(location.origin)}/">
  <link rel="stylesheet" href="print.css">
</head>
<body>
  <div class="print-toolbar">
    <button type="button" onclick="window.print()">Сохранить в PDF</button>
    <span>В диалоге печати выберите «Сохранить как PDF».</span>
    <button type="button" class="ghost" onclick="window.close()">Закрыть</button>
  </div>

  <main class="sheet">
    <header class="doc-head">
      <div class="brand">
        <img src="logo.png" alt="">
        <div>
          <div class="brand-title">Таро</div>
          <div class="brand-sub">рабочее место</div>
        </div>
      </div>
      <div class="doc-meta">
        <span>${escapeHtml(formatLongDate(reading.reading_date))}</span>
        <span>${client}</span>
        <span class="status">${escapeHtml(status)}</span>
      </div>
    </header>

    <h1>${escapeHtml(title)}</h1>
    ${reading.question ? `<blockquote class="question">${escapeHtml(reading.question)}</blockquote>` : ''}
    <div class="meta-row">${[spreadName, spreadCount === cardsCount ? null : escapeHtml(cardsLabel)].filter(Boolean).join(' · ')}</div>

    <section class="cards ${cardClass}">${cardsHtml}</section>

    ${sections}

    <footer class="doc-foot">
      <span>Таро · рабочее место</span>
      <span>${escapeHtml(formatLongDate(reading.reading_date))}</span>
    </footer>
  </main>
</body>
</html>`;
}

function exportReadingPdf(reading) {
  const printWindow = window.open('', 'tarot-reading-print');
  if (!printWindow) {
    alert('Браузер заблокировал новое окно. Разрешите всплывающие окна для этой страницы и попробуйте снова.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(readingPrintHtml(reading));
  printWindow.document.close();
  printWindow.focus();
}

function outcomeMetaLine(outcome) {
  return [
    outcome.reviewed_at ? formatDate(outcome.reviewed_at) : null,
    outcome.event_id && outcome.event_title
      ? `<a href="#/events/${outcome.event_id}">${escapeHtml(outcome.event_title)}</a>`
      : null,
    outcome.confidence
      ? `уверенность: ${OUTCOME_CONFIDENCE_LABELS[outcome.confidence] ?? outcome.confidence}`
      : null,
  ].filter(Boolean).join(' · ');
}

function outcomeCurrentMarkup(outcome) {
  if (!outcome) {
    return '<div class="empty">Итог пока не записан. Когда станет понятно, чем всё закончилось, добавьте его здесь.</div>';
  }

  return `
    <div class="outcome-current">
      <div class="outcome-head">
        <span class="outcome-badge ${outcomeRatingClass(outcome.rating)}">${OUTCOME_RATING_LABELS[outcome.rating] ?? outcome.rating}</span>
        <span class="muted outcome-meta">${outcomeMetaLine(outcome)}</span>
      </div>
      ${outcome.result
        ? `<div class="event-block"><h3>Что произошло</h3><div class="notes event-notes">${escapeHtml(outcome.result)}</div></div>`
        : ''}
      ${outcome.comment
        ? `<div class="event-block"><h3>Комментарий</h3><div class="notes event-notes">${escapeHtml(outcome.comment)}</div></div>`
        : ''}
      ${outcome.followup_interpretation
        ? `<div class="event-block"><h3>Трактовка после события</h3><div class="notes event-notes">${escapeHtml(outcome.followup_interpretation)}</div></div>`
        : ''}
      ${outcome.follow_up_date
        ? `<p class="outcome-followup">Вернуться к раскладу: <strong>${formatDate(outcome.follow_up_date)}</strong></p>`
        : ''}
    </div>
  `;
}

function outcomePanelMarkup(reading) {
  const outcomes = reading.outcomes ?? [];
  const latest = outcomes[0] ?? null;
  const earlier = outcomes.slice(1);

  return `
    <div class="panel" id="reading-outcome-panel">
      <div class="panel-head">
        <h2>Итог</h2>
        <button class="btn btn-small" type="button" id="outcome-edit">
          ${latest ? 'Изменить' : 'Добавить итог'}
        </button>
      </div>
      <div id="outcome-body">${outcomeCurrentMarkup(latest)}</div>
      ${earlier.length > 0
        ? `<details class="outcome-history">
             <summary>Предыдущие оценки (${earlier.length})</summary>
             ${earlier.map((outcome) => `
               <div class="outcome-history-item">
                 <div class="outcome-head">
                   <span class="outcome-badge ${outcomeRatingClass(outcome.rating)}">${OUTCOME_RATING_LABELS[outcome.rating] ?? outcome.rating}</span>
                   <span class="muted outcome-meta">${outcomeMetaLine(outcome)}</span>
                 </div>
                 ${outcome.result ? `<div class="interp-body">${escapeHtml(outcome.result)}</div>` : ''}
                 ${outcome.comment ? `<div class="muted outcome-comment">${escapeHtml(outcome.comment)}</div>` : ''}
               </div>
             `).join('')}
           </details>`
        : ''}
    </div>
  `;
}

function positionOutcomeCurrentMarkup(outcome, earlier = []) {
  if (!outcome) {
    return '<p class="muted notes-empty">Пока не оценена. После события отметьте, насколько сбылась эта позиция.</p>';
  }

  return `
    <div class="outcome-current position-outcome-current">
      ${outcomeMetaLine(outcome)
        ? `<div class="outcome-head"><span class="muted outcome-meta">${outcomeMetaLine(outcome)}</span></div>`
        : ''}
      ${outcome.result
        ? `<div class="event-block"><h3>Что произошло</h3><div class="notes event-notes">${escapeHtml(outcome.result)}</div></div>`
        : ''}
      ${outcome.comment
        ? `<div class="event-block"><h3>Комментарий</h3><div class="notes event-notes">${escapeHtml(outcome.comment)}</div></div>`
        : ''}
      ${outcome.followup_interpretation
        ? `<div class="event-block"><h3>Трактовка после события</h3><div class="notes event-notes">${escapeHtml(outcome.followup_interpretation)}</div></div>`
        : ''}
      ${outcome.follow_up_date
        ? `<p class="outcome-followup">Вернуться к позиции: <strong>${formatDate(outcome.follow_up_date)}</strong></p>`
        : ''}
      ${earlier.length > 0
        ? `<details class="outcome-history">
             <summary>Предыдущие оценки позиции (${earlier.length})</summary>
             ${earlier.map((item) => `
               <div class="outcome-history-item">
                 <div class="outcome-head">
                   <span class="outcome-badge ${outcomeRatingClass(item.rating)}">${OUTCOME_RATING_LABELS[item.rating] ?? item.rating}</span>
                   <span class="muted outcome-meta">${outcomeMetaLine(item)}</span>
                 </div>
                 ${item.result ? `<div class="interp-body">${escapeHtml(item.result)}</div>` : ''}
                 ${item.comment ? `<div class="muted outcome-comment">${escapeHtml(item.comment)}</div>` : ''}
               </div>
             `).join('')}
           </details>`
        : ''}
    </div>
  `;
}

function positionOutcomesPanelMarkup(reading) {
  const cards = reading.cards ?? [];
  const all = reading.position_outcomes ?? [];

  const rows = cards.map((card) => {
    const list = all.filter((item) => (
      item.position_index === card.position_index && item.card_id === card.card_id
    ));
    const latest = list[0] ?? null;

    return `
      <div class="position-outcome-row" data-position-index="${card.position_index}">
        <div class="position-outcome-head">
          <div class="position-outcome-title">
            <span class="reading-interp-position">${card.position_index}. ${escapeHtml(card.position_name || `Позиция ${card.position_index}`)}</span>
            <a href="#/cards/${card.card_id}">${escapeHtml(card.name_ru)}</a>
            ${card.is_reversed ? '<span class="view-card-reversed">перевёрнутая</span>' : ''}
          </div>
          <div class="position-outcome-actions">
            <span class="outcome-badge ${latest ? outcomeRatingClass(latest.rating) : 'rating-pending'}">${latest
              ? (OUTCOME_RATING_LABELS[latest.rating] ?? latest.rating)
              : 'не оценена'}</span>
            <button class="btn btn-small" type="button" data-position-edit="${card.position_index}">
              ${latest ? 'Изменить' : 'Оценить'}
            </button>
          </div>
        </div>
        <div class="position-outcome-body" data-position-body="${card.position_index}">
          ${positionOutcomeCurrentMarkup(latest, list.slice(1))}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="panel" id="reading-position-outcomes-panel">
      <div class="panel-head">
        <h2>Оценки позиций</h2>
      </div>
      <p class="muted reading-originals-note">Можно оценить каждую позицию отдельно. Это дополняет общий итог и не меняет его.</p>
      ${cards.length > 0
        ? `<div class="position-outcomes">${rows}</div>`
        : '<div class="empty">Сначала добавьте карты в расклад.</div>'}
    </div>
  `;
}

function positionOutcomeFormMarkup(card, latest, linkedEvents = []) {
  const eventSelect = linkedEvents.length > 0
    ? `
      <label>Событие
        <select name="event_id">
          <option value="">Без события</option>
          ${linkedEvents.map((event) => `
            <option value="${event.id}"${latest?.event_id === event.id ? ' selected' : ''}>
              ${escapeHtml(event.title)}
            </option>
          `).join('')}
        </select>
      </label>
    `
    : '<p class="field-hint muted">С раскладом не связано ни одно событие — оценку можно сохранить и без него.</p>';

  return `
    <form class="form inline-edit outcome-form position-outcome-form" novalidate>
      <input type="hidden" name="position_index" value="${card.position_index}">
      <p class="position-outcome-form-title">${card.position_index}. ${escapeHtml(card.position_name || `Позиция ${card.position_index}`)} · ${escapeHtml(card.name_ru)}</p>
      ${eventSelect}

      <div class="form-row">
        <label><span>Оценка<span class="req">*</span></span>
          <select name="rating">
            ${OUTCOME_RATING_ORDER.map((rating) => `
              <option value="${rating}"${(latest?.rating ?? 'pending') === rating ? ' selected' : ''}>
                ${OUTCOME_RATING_FORM_LABELS[rating]}
              </option>
            `).join('')}
          </select>
        </label>
        <label>Уверенность
          <select name="confidence">
            <option value="">Не указана</option>
            ${Object.entries(OUTCOME_CONFIDENCE_LABELS).map(([value, label]) => `
              <option value="${value}"${latest?.confidence === value ? ' selected' : ''}>${label}</option>
            `).join('')}
          </select>
        </label>
      </div>

      <div class="form-row">
        <label>Дата оценки
          <input type="date" name="reviewed_at" value="${latest?.reviewed_at ?? todayIso()}">
        </label>
        <label>Вернуться к позиции
          <input type="date" name="follow_up_date" value="${latest?.follow_up_date ?? ''}">
        </label>
      </div>

      <label>Что произошло по этой позиции
        <textarea name="result" rows="3" maxlength="5000"
                  placeholder="Фактический результат именно по этой позиции">${escapeHtml(latest?.result ?? '')}</textarea>
      </label>

      <label>Комментарий
        <textarea name="comment" rows="3" maxlength="5000"
                  placeholder="Насколько трактовка позиции попала в точку и почему">${escapeHtml(latest?.comment ?? '')}</textarea>
      </label>

      <label>Трактовка после события
        <textarea name="followup_interpretation" rows="3" maxlength="5000"
                  placeholder="Что стало понятно по этой позиции теперь">${escapeHtml(latest?.followup_interpretation ?? '')}</textarea>
      </label>

      <p class="form-error"></p>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">Сохранить оценку позиции</button>
        <button class="btn" type="button" data-cancel>Отмена</button>
      </div>
    </form>
  `;
}

function exportReadingJson(reading) {
  const payload = {
    format: 'tarot-reading',
    version: 1,
    exported_at: new Date().toISOString(),
    reading: {
      id: reading.id,
      title: reading.title,
      question: reading.question,
      spread_name: reading.spread_name,
      reading_date: reading.reading_date,
      status: reading.status,
      interpretation: reading.interpretation,
      summary: reading.summary,
      tags: reading.tags,
      client_id: reading.client_id,
      client_name: reading.client_name,
      created_at: reading.created_at,
      updated_at: reading.updated_at,
    },
    cards: (reading.cards ?? []).map((card) => ({
      position_index: card.position_index,
      position_name: card.position_name,
      card_id: card.card_id,
      slug: card.slug,
      name_ru: card.name_ru,
      name_en: card.name_en,
      is_reversed: Boolean(card.is_reversed),
      note: card.note,
      interpretation: card.interpretation_id
        ? {
            id: card.interpretation_id,
            title: card.interpretation_title,
            body: card.interpretation_body,
          }
        : null,
      upright: card.upright,
      reversed: card.reversed,
    })),
    outcomes: reading.outcomes ?? [],
    position_outcomes: reading.position_outcomes ?? [],
    versions: reading.versions ?? [],
    events: reading.events ?? [],
  };

  const date = reading.reading_date || new Date().toISOString().slice(0, 10);
  const filename = `reading-${reading.id}-${date}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function versionsPanelMarkup(reading) {
  const versions = reading.versions ?? [];
  if (versions.length === 0) return '';

  const lastId = versions[versions.length - 1].id;

  return `
    <div class="panel" id="reading-versions-panel">
      <h2>История трактовок</h2>
      <p class="muted reading-originals-note">Что вы думали до события и как трактовка менялась.</p>
      <div class="version-list">
        ${versions.map((version) => `
          <details class="version-item"${version.id === lastId ? ' open' : ''}>
            <summary>
              <span class="version-kind">${VERSION_KIND_LABELS[version.kind] ?? version.kind}</span>
              <span class="muted">${formatDateTime(version.created_at)}</span>
            </summary>
            ${version.interpretation
              ? `<div class="event-block"><h3>Трактовка</h3><div class="notes event-notes">${escapeHtml(version.interpretation)}</div></div>`
              : ''}
            ${version.summary
              ? `<div class="event-block"><h3>Выводы</h3><div class="notes event-notes">${escapeHtml(version.summary)}</div></div>`
              : ''}
            ${version.comment
              ? `<p class="muted version-comment">${escapeHtml(version.comment)}</p>`
              : ''}
          </details>
        `).join('')}
      </div>
    </div>
  `;
}

async function renderReadingView(id) {
  viewEl.innerHTML = '<p class="muted">Загрузка расклада…</p>';

  let reading;
  try {
    reading = await api(`/api/readings/${encodeURIComponent(id)}`);
  } catch (error) {
    viewEl.innerHTML = `
      <div class="panel">
        <p>${escapeHtml(error.message)}</p>
        <p class="hint"><a href="#/readings">← ко всем раскладам</a></p>
      </div>
    `;
    return;
  }

  let journal = [];
  let allEvents = [];
  try {
    journal = await api(`/api/journal?reading_id=${reading.id}`);
  } catch {
    // дневник не должен мешать открытию расклада
  }
  try {
    allEvents = await api('/api/events');
  } catch {
    // список событий не должен мешать открытию расклада
  }

  const title = reading.title || reading.question || 'Расклад';
  titleEl.textContent = title;
  subtitleEl.textContent = `${formatDate(reading.reading_date)} · ${reading.client_name || 'для себя'}`;
  document.title = `${title} · Таро`;

  const cardsLabel = `${reading.cards.length} ${plural(reading.cards.length, ['карта', 'карты', 'карт'])}`;
  const spreadName = reading.spread_name || '';
  const spreadCount = Number((spreadName.match(/^(\d+)\s+карт/) ?? [])[1]);
  const meta = [
    reading.client_id
      ? `<a href="#/clients/${reading.client_id}">${escapeHtml(reading.client_name)}</a>`
      : 'для себя',
    spreadName ? escapeHtml(spreadName) : null,
    spreadCount === reading.cards.length ? null : cardsLabel,
  ].filter(Boolean).join(' · ');

  const cardsHtml = reading.cards.length > 0
    ? `<div class="view-cards">${reading.cards.map((card) => `
        <a class="view-card" href="#/cards/${card.card_id}">
          <span class="view-card-thumb${card.is_reversed ? ' is-reversed' : ''}">
            <img src="${card.image || 'cards/placeholder.svg'}" alt="${escapeHtml(card.name_ru)}" loading="lazy"
                 onerror="this.onerror=null;this.src='cards/placeholder.svg'">
          </span>
          <span class="view-card-position">${card.position_index}. ${escapeHtml(card.position_name || `Позиция ${card.position_index}`)}</span>
          <span class="view-card-name">${escapeHtml(card.name_ru)}
            <span class="muted">(${escapeHtml(card.name_en)})</span>
          </span>
          ${card.is_reversed ? '<span class="view-card-reversed">перевёрнутая</span>' : ''}
        </a>
      `).join('')}</div>`
    : '<div class="empty">В раскладе пока нет карт. <a href="#/readings/' + reading.id + '/edit">Добавить карты</a></div>';

  const interpCards = reading.cards.filter((card) => card.interpretation_id && card.interpretation_body);

  const interpsHtml = interpCards.length > 0
    ? `<div class="reading-interps">${interpCards.map((card) => `
        <div class="reading-interp">
          <div class="reading-interp-head">
            <span class="reading-interp-position">${card.position_index}. ${escapeHtml(card.position_name || `Позиция ${card.position_index}`)}</span>
            <a href="#/cards/${card.card_id}">${escapeHtml(card.name_ru)}</a>
            ${card.is_reversed ? '<span class="view-card-reversed">перевёрнутая</span>' : ''}
          </div>
          ${card.interpretation_title
            ? `<div class="interp-title">${escapeHtml(card.interpretation_title)}</div>`
            : ''}
          <div class="interp-body">${escapeHtml(card.interpretation_body)}</div>
        </div>
      `).join('')}</div>`
    : '';

  const originalsTitle = reading.cards.length === 1 ? 'Описание карты' : 'Описание карт';

  const journalLink = `#/journal/new?reading=${reading.id}${reading.client_id ? `&client=${reading.client_id}` : ''}`;
  const journalHtml = `
    <div class="panel">
      <div class="panel-head">
        <h2>Записи дневника</h2>
        <a class="panel-link" href="${journalLink}">новая запись →</a>
      </div>
      ${journal.length > 0
        ? journal.map((entry) => `
            <a class="list-row" href="#/journal/${entry.id}">
              <div class="list-main">
                <div class="list-title">${escapeHtml(journalTitle(entry))}</div>
                <div class="list-sub">${formatLongDate(entry.entry_date)}${entry.tags?.length ? ` · ${entry.tags.map((tag) => `#${escapeHtml(tag)}`).join(' ')}` : ''}</div>
              </div>
            </a>
          `).join('')
        : `<div class="empty">Записей по этому раскладу пока нет. <a href="${journalLink}">Добавить</a></div>`}
    </div>
  `;

  const linkedEvents = reading.events ?? [];
  const linkedEventIds = new Set(linkedEvents.map((event) => event.id));
  const availableEvents = allEvents.filter((event) => !linkedEventIds.has(event.id));

  const eventsHtml = linkedEvents.length > 0
    ? linkedEvents.map((event) => `
        <div class="reading-row">
          <a class="reading-row-link" href="#/events/${event.id}">
            <div class="reading-date">${event.planned_date || event.actual_date
              ? formatDate(event.planned_date || event.actual_date)
              : '—'}</div>
            <div class="list-main">
              <div class="list-title">${escapeHtml(event.title)}</div>
              <div class="list-sub">${escapeHtml(event.category || 'без категории')} · ${eventDateLabel(event)}</div>
            </div>
            <span class="status-badge ${eventStatusClass(event.status)}">${EVENT_STATUS_LABELS[event.status] ?? event.status}</span>
          </a>
          <button class="icon-btn danger" type="button" data-unlink-event="${event.id}"
                  data-reading-id="${reading.id}"
                  title="Отвязать событие" aria-label="Отвязать событие «${escapeHtml(event.title)}»">×</button>
        </div>
      `).join('')
    : `<div class="empty">С этим раскладом пока не связано ни одно событие.
         <a href="#/events/new?reading=${reading.id}">Создать событие</a>
       </div>`;

  const addEventHtml = allEvents.length === 0
    ? `<p class="muted event-link-hint">Событий пока нет.
         <a href="#/events/new?reading=${reading.id}">Создать первое</a>.
       </p>`
    : availableEvents.length > 0
      ? `
        <div class="event-link-row">
          <select class="select" id="reading-event-add" aria-label="Событие для связи">
            <option value="">Выберите событие</option>
            ${availableEvents.map((event) => `
              <option value="${event.id}">
                ${escapeHtml(event.title)}${event.planned_date ? ` · ${formatDate(event.planned_date)}` : ''}
              </option>
            `).join('')}
          </select>
          <button class="btn" type="button" id="reading-event-add-btn">Связать</button>
        </div>
      `
      : '<p class="muted event-link-hint">Все события уже связаны с этим раскладом.</p>';

  const eventsPanelHtml = `
    <div class="panel" id="reading-events-panel">
      <div class="panel-head">
        <h2>Связанные события</h2>
        <a class="panel-link" href="#/events/new?reading=${reading.id}">новое событие →</a>
      </div>
      ${eventsHtml}
      ${addEventHtml}
    </div>
  `;

  const editablePanel = (field, title, emptyText) => `
    <div class="panel" data-panel="${field}">
      <div class="panel-head">
        <h2>${title}</h2>
        <button class="btn btn-small" type="button" data-edit="${field}">Редактировать</button>
      </div>
      <div class="panel-body">
        ${reading[field]
          ? `<div class="notes">${escapeHtml(reading[field])}</div>`
          : `<p class="muted notes-empty">${emptyText}</p>`}
      </div>
    </div>
  `;

  const originalsHtml = reading.cards.length > 0
    ? `<div class="reading-originals">${reading.cards.map((card) => {
        const text = (card.is_reversed ? card.reversed : card.upright) ?? '';
        if (!text) return '';
        return `
          <details class="reading-original">
            <summary>
              <span class="reading-interp-position">${card.position_index}. ${escapeHtml(card.position_name || `Позиция ${card.position_index}`)}</span>
              · ${escapeHtml(card.name_ru)}
              <span class="muted">(${escapeHtml(card.name_en)})</span>
              ${card.is_reversed ? '<span class="view-card-reversed">перевёрнутая</span>' : ''}
            </summary>
            <div class="interp-body">${escapeHtml(text)}</div>
          </details>
        `;
      }).join('')}</div>`
    : '';

  viewEl.innerHTML = `
    <a class="back-link" href="#/readings">← все расклады</a>

    <div class="panel">
      <div class="detail-head">
        <div class="reading-view-head">
          <p class="muted detail-info">${meta}</p>
          <span class="status-badge status-${reading.status}">${READING_STATUS_LABELS[reading.status] ?? reading.status}</span>
        </div>
        <div class="actions">
          <a class="btn" href="#/readings/${reading.id}/edit">Редактировать</a>
          <button class="btn" type="button" id="reading-pdf"
                  title="Откроется предпросмотр — сохраните его как PDF">Экспорт в PDF</button>
          <button class="btn" type="button" id="reading-json"
                  title="Скачать расклад со всеми оценками в формате JSON">Экспорт в JSON</button>
          <button class="btn btn-danger" type="button" id="reading-delete">Удалить</button>
        </div>
      </div>

      ${reading.question
        ? `<blockquote class="reading-question-box">${escapeHtml(reading.question)}</blockquote>`
        : ''}

      ${cardsHtml}
    </div>

    ${interpsHtml
      ? `<div class="panel">
           <h2>Мои трактовки к картам</h2>
           ${interpsHtml}
         </div>`
      : ''}

    ${originalsHtml
      ? `<div class="panel">
           <h2>${originalsTitle}</h2>
           <p class="muted reading-originals-note">Тексты из справочника — для положения, в котором выпала каждая карта.</p>
           ${originalsHtml}
         </div>`
      : ''}

    ${editablePanel('interpretation', 'Трактовка расклада', 'Пока не заполнена.')}

    ${editablePanel('summary', 'Выводы', 'Пока не заполнены.')}

    ${outcomePanelMarkup(reading)}

    ${positionOutcomesPanelMarkup(reading)}

    ${versionsPanelMarkup(reading)}

    ${eventsPanelHtml}

    ${journalHtml}
  `;

  enhanceSelects(viewEl);

  function setupInlineEdit(field, rows, placeholder, emptyText) {
    const panel = viewEl.querySelector(`[data-panel="${field}"]`);
    if (!panel) return;

    const button = panel.querySelector(`[data-edit="${field}"]`);
    const body = panel.querySelector('.panel-body');

    function paintValue() {
      body.innerHTML = reading[field]
        ? `<div class="notes">${escapeHtml(reading[field])}</div>`
        : `<p class="muted notes-empty">${emptyText}</p>`;
      button.hidden = false;
    }

    button.addEventListener('click', () => {
      button.hidden = true;
      body.innerHTML = `
        <form class="form inline-edit" novalidate>
          <textarea name="value" rows="${rows}" maxlength="2000"
                    placeholder="${escapeHtml(placeholder)}">${escapeHtml(reading[field] ?? '')}</textarea>
          <p class="field-hint muted">Максимум 2000 символов.</p>
          <p class="form-error"></p>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit">Сохранить</button>
            <button class="btn" type="button" data-cancel>Отмена</button>
          </div>
        </form>
      `;

      const form = body.querySelector('form');
      const textarea = form.elements.value;
      const errorEl = form.querySelector('.form-error');
      const submit = form.querySelector('button[type="submit"]');
      textarea.focus();

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorEl.textContent = '';
        submit.disabled = true;

        try {
          const saved = await api(`/api/readings/${reading.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ [field]: textarea.value }),
          });
          reading = saved;
          paintValue();
        } catch (error) {
          errorEl.textContent = error.message;
          submit.disabled = false;
        }
      });

      form.querySelector('[data-cancel]').addEventListener('click', paintValue);
    });
  }

  setupInlineEdit(
    'interpretation',
    8,
    'Что показывает расклад: карта за картой, связи между позициями',
    'Пока не заполнена.',
  );
  setupInlineEdit(
    'summary',
    4,
    'Короткий итог, совет, к чему пришли',
    'Пока не заполнены.',
  );

  function outcomeFormMarkup(outcome) {
    const eventSelect = linkedEvents.length > 0
      ? `
        <label>Событие
          <select name="event_id">
            <option value="">Без события</option>
            ${linkedEvents.map((event) => `
              <option value="${event.id}"${outcome?.event_id === event.id ? ' selected' : ''}>
                ${escapeHtml(event.title)}
              </option>
            `).join('')}
          </select>
        </label>
      `
      : '<p class="field-hint muted">С раскладом не связано ни одно событие — итог можно сохранить и без него.</p>';

    return `
      <form class="form inline-edit outcome-form" id="outcome-form" novalidate>
        ${eventSelect}

        <div class="form-row">
          <label><span>Оценка<span class="req">*</span></span>
            <select name="rating">
              ${OUTCOME_RATING_ORDER.map((rating) => `
                <option value="${rating}"${(outcome?.rating ?? 'pending') === rating ? ' selected' : ''}>
                  ${OUTCOME_RATING_FORM_LABELS[rating]}
                </option>
              `).join('')}
            </select>
          </label>
          <label>Уверенность
            <select name="confidence">
              <option value="">Не указана</option>
              ${Object.entries(OUTCOME_CONFIDENCE_LABELS).map(([value, label]) => `
                <option value="${value}"${outcome?.confidence === value ? ' selected' : ''}>${label}</option>
              `).join('')}
            </select>
          </label>
        </div>

        <div class="form-row">
          <label>Дата оценки
            <input type="date" name="reviewed_at" value="${outcome?.reviewed_at ?? todayIso()}">
          </label>
          <label>Вернуться к раскладу
            <input type="date" name="follow_up_date" value="${outcome?.follow_up_date ?? ''}">
          </label>
        </div>

        <label>Что произошло
          <textarea name="result" rows="4" maxlength="5000"
                    placeholder="Фактический результат: что случилось на самом деле">${escapeHtml(outcome?.result ?? '')}</textarea>
        </label>

        <label>Комментарий
          <textarea name="comment" rows="3" maxlength="5000"
                    placeholder="Насколько трактовка попала в точку и почему">${escapeHtml(outcome?.comment ?? '')}</textarea>
        </label>

        <label>Трактовка после события
          <textarea name="followup_interpretation" rows="4" maxlength="5000"
                    placeholder="Что стало понятно теперь, с высоты прошедшего времени">${escapeHtml(outcome?.followup_interpretation ?? '')}</textarea>
        </label>

        <p class="form-error"></p>
        <div class="form-actions">
          <button class="btn btn-primary" type="submit">Сохранить итог</button>
          <button class="btn" type="button" data-cancel>Отмена</button>
        </div>
      </form>
    `;
  }

  function bindOutcomePanel() {
    const panel = document.getElementById('reading-outcome-panel');
    if (!panel) return;

    const button = panel.querySelector('#outcome-edit');
    const body = panel.querySelector('#outcome-body');
    if (!button || !body) return;

    function paintCurrent() {
      body.innerHTML = outcomeCurrentMarkup((reading.outcomes ?? [])[0] ?? null);
      button.hidden = false;
    }

    button.addEventListener('click', () => {
      const latest = (reading.outcomes ?? [])[0] ?? null;
      button.hidden = true;
      body.innerHTML = outcomeFormMarkup(latest);
      enhanceSelects(body);

      const form = body.querySelector('form');
      const errorEl = form.querySelector('.form-error');
      const submit = form.querySelector('button[type="submit"]');
      form.elements.result.focus();

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorEl.textContent = '';
        submit.disabled = true;

        try {
          const saved = await api(`/api/readings/${reading.id}/outcomes`, {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
          });
          reading = saved;

          document.getElementById('reading-outcome-panel').outerHTML = outcomePanelMarkup(reading);

          const versionsHost = document.getElementById('reading-versions-panel');
          const versionsHtml = versionsPanelMarkup(reading);
          if (versionsHost) {
            versionsHost.outerHTML = versionsHtml;
          } else if (versionsHtml) {
            document.getElementById('reading-outcome-panel')
              ?.insertAdjacentHTML('afterend', versionsHtml);
          }

          bindOutcomePanel();
        } catch (error) {
          errorEl.textContent = error.message;
          submit.disabled = false;
        }
      });

      form.querySelector('[data-cancel]').addEventListener('click', paintCurrent);
    });
  }

  bindOutcomePanel();

  function paintPositionOutcomesPanel() {
    const host = document.getElementById('reading-position-outcomes-panel');
    if (!host) return;
    host.outerHTML = positionOutcomesPanelMarkup(reading);
    bindPositionOutcomesPanel();
  }

  function bindPositionOutcomesPanel() {
    const panel = document.getElementById('reading-position-outcomes-panel');
    if (!panel) return;

    panel.addEventListener('click', (event) => {
      const button = event.target.closest('[data-position-edit]');
      if (!button) return;

      const positionIndex = Number(button.dataset.positionEdit);
      const card = (reading.cards ?? []).find((item) => item.position_index === positionIndex);
      if (!card) return;

      const list = (reading.position_outcomes ?? [])
        .filter((item) => (
          item.position_index === positionIndex && item.card_id === card.card_id
        ));
      const latest = list[0] ?? null;
      const body = panel.querySelector(`[data-position-body="${positionIndex}"]`);
      if (!body) return;

      button.hidden = true;
      body.innerHTML = positionOutcomeFormMarkup(card, latest, reading.events ?? []);
      enhanceSelects(body);

      const form = body.querySelector('form');
      const errorEl = form.querySelector('.form-error');
      const submit = form.querySelector('button[type="submit"]');
      form.elements.result.focus();

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorEl.textContent = '';
        submit.disabled = true;

        try {
          reading = await api(`/api/readings/${reading.id}/position-outcomes`, {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
          });
          paintPositionOutcomesPanel();
        } catch (error) {
          errorEl.textContent = error.message;
          submit.disabled = false;
        }
      });

      form.querySelector('[data-cancel]').addEventListener('click', paintPositionOutcomesPanel);
    });
  }

  bindPositionOutcomesPanel();

  const addEventSelect = document.getElementById('reading-event-add');
  const addEventButton = document.getElementById('reading-event-add-btn');
  if (addEventSelect && addEventButton) {
    addEventButton.addEventListener('click', async () => {
      if (!addEventSelect.value) return;
      addEventButton.disabled = true;
      try {
        await api(`/api/events/${addEventSelect.value}/readings`, {
          method: 'POST',
          body: JSON.stringify({ reading_id: reading.id }),
        });
        renderReadingView(reading.id);
      } catch (error) {
        addEventButton.disabled = false;
        alert(error.message);
      }
    });
  }

  document.getElementById('reading-pdf').addEventListener('click', () => {
    exportReadingPdf(reading);
  });

  document.getElementById('reading-json').addEventListener('click', () => {
    exportReadingJson(reading);
  });

  document.getElementById('reading-delete').addEventListener('click', async () => {
    if (!confirm(`Удалить расклад «${title}»? Это действие нельзя отменить.`)) return;
    try {
      await api(`/api/readings/${reading.id}`, { method: 'DELETE' });
      location.hash = '#/readings';
    } catch (error) {
      alert(error.message);
    }
  });
}

/* ---------- События ---------- */

function eventDateLabel(event) {
  if (event.actual_date) return `факт ${formatDate(event.actual_date)}`;
  if (event.planned_date) return `план ${formatDate(event.planned_date)}`;
  return 'без даты';
}

function eventReadingsLabel(count) {
  return `${count} ${plural(count, ['расклад', 'расклада', 'раскладов'])}`;
}

async function renderEvents() {
  viewEl.innerHTML = `
    <div class="cards-toolbar">
      <input class="search" id="event-search" type="search" autocomplete="off"
             placeholder="Поиск по названию, описанию или результату">
      <a class="btn btn-primary" href="#/events/new">Новое событие</a>
    </div>

    <div class="filters-row">
      <div class="chips" id="event-status">
        ${EVENT_STATUS_FILTERS.map((filter, index) => `
          <button type="button" class="chip${index === 0 ? ' is-active' : ''}" data-status="${filter.id}">
            ${filter.label}
          </button>
        `).join('')}
      </div>
      <select class="select chip-select" id="event-category">
        <option value="">Все категории</option>
      </select>
      <div class="date-range">
        <label class="date-filter">с <input class="select" type="date" id="event-from"></label>
        <label class="date-filter">по <input class="select" type="date" id="event-to"></label>
      </div>
      <button class="btn btn-small reset-filters" type="button" id="events-reset" hidden>Сбросить фильтры</button>
    </div>

    <p class="result-count muted" id="events-count"></p>
    <div class="panel list-panel" id="events-list"><p class="muted">Загрузка…</p></div>
  `;

  const list = document.getElementById('events-list');
  const counter = document.getElementById('events-count');

  let events;
  try {
    events = await api('/api/events');
  } catch (error) {
    list.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
    return;
  }

  const categorySelect = document.getElementById('event-category');
  const categories = [...new Set(events.map((event) => event.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'ru'));
  categorySelect.insertAdjacentHTML('beforeend', categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join(''));
  enhanceSelects(viewEl);

  const state = { status: 'all', category: '', from: '', to: '', query: '' };
  const resetButton = document.getElementById('events-reset');

  function updateReset() {
    resetButton.hidden = state.status === 'all'
      && !state.category
      && !state.from
      && !state.to
      && !state.query.trim();
  }

  function resetFilters() {
    state.status = 'all';
    state.category = '';
    state.from = '';
    state.to = '';
    state.query = '';

    for (const chip of document.querySelectorAll('#event-status .chip')) {
      chip.classList.toggle('is-active', chip.dataset.status === 'all');
    }
    setSelectValue(categorySelect, '');
    setSelectActive(categorySelect, false);
    document.getElementById('event-from').value = '';
    document.getElementById('event-to').value = '';
    document.getElementById('event-search').value = '';
    paint();
  }

  function paint() {
    const query = state.query.trim().toLowerCase();

    const visible = events.filter((event) => {
      if (state.status !== 'all' && event.status !== state.status) return false;
      if (state.category && event.category !== state.category) return false;
      if (state.from && (!event.planned_date || event.planned_date < state.from)) return false;
      if (state.to && (!event.planned_date || event.planned_date > state.to)) return false;
      if (!query) return true;

      const haystack = [
        event.title,
        event.description,
        event.category,
        event.result,
        event.notes,
        event.reading_titles,
        event.client_names,
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(query);
    });

    counter.textContent = `${visible.length} ${plural(visible.length, ['событие', 'события', 'событий'])}`;
    updateReset();

    if (visible.length === 0) {
      list.innerHTML = events.length === 0
        ? '<div class="empty">Пока ни одного события.<br><a href="#/events/new">Добавить первое</a></div>'
        : '<div class="empty">Ничего не найдено. Попробуйте изменить фильтры.</div>';
      return;
    }

    list.innerHTML = visible.map((event) => {
      const meta = [
        event.category,
        event.actual_date && event.planned_date ? `факт ${formatDate(event.actual_date)}` : null,
        eventReadingsLabel(event.readings_count ?? 0),
      ].filter(Boolean).join(' · ');

      return `
        <div class="reading-row">
          <a class="reading-row-link" href="#/events/${event.id}">
            <div class="reading-date">${event.planned_date || event.actual_date
              ? formatDate(event.planned_date || event.actual_date)
              : '—'}</div>
            <div class="list-main">
              <div class="list-title">${escapeHtml(event.title)}</div>
              <div class="list-sub">${escapeHtml(meta)}</div>
            </div>
            <span class="status-badge ${eventStatusClass(event.status)}">${EVENT_STATUS_LABELS[event.status] ?? event.status}</span>
          </a>
        </div>
      `;
    }).join('');
  }

  document.getElementById('event-status').addEventListener('click', (event) => {
    const button = event.target.closest('[data-status]');
    if (!button) return;
    state.status = button.dataset.status;
    for (const chip of document.querySelectorAll('#event-status .chip')) {
      chip.classList.toggle('is-active', chip === button);
    }
    paint();
  });

  categorySelect.addEventListener('change', () => {
    state.category = categorySelect.value;
    setSelectActive(categorySelect, Boolean(categorySelect.value));
    paint();
  });

  document.getElementById('event-from').addEventListener('change', (event) => {
    state.from = event.target.value;
    paint();
  });

  document.getElementById('event-to').addEventListener('change', (event) => {
    state.to = event.target.value;
    paint();
  });

  const search = document.getElementById('event-search');
  search.addEventListener('input', () => {
    state.query = search.value;
    paint();
  });

  resetButton.addEventListener('click', resetFilters);
  paint();
}

async function renderEventView(id) {
  viewEl.innerHTML = '<p class="muted">Загрузка события…</p>';

  let event;
  let readings = [];
  try {
    [event, readings] = await Promise.all([
      api(`/api/events/${encodeURIComponent(id)}`),
      api('/api/readings'),
    ]);
  } catch (error) {
    viewEl.innerHTML = `
      <div class="panel">
        <p>${escapeHtml(error.message)}</p>
        <p class="hint"><a href="#/events">← ко всем событиям</a></p>
      </div>
    `;
    return;
  }

  titleEl.textContent = event.title;
  subtitleEl.textContent = [
    event.category,
    eventDateLabel(event),
  ].filter(Boolean).join(' · ') || 'событие';
  document.title = `${event.title} · Таро`;

  const linkedIds = new Set((event.readings ?? []).map((reading) => reading.id));
  const availableReadings = readings.filter((reading) => !linkedIds.has(reading.id));

  const linkedHtml = event.readings?.length > 0
    ? event.readings.map((reading) => `
        <div class="reading-row">
          <a class="reading-row-link" href="#/readings/${reading.id}">
            <div class="reading-date">${formatDate(reading.reading_date)}</div>
            <div class="list-main">
              <div class="list-title">${escapeHtml(reading.title || reading.question || 'Расклад')}</div>
              <div class="list-sub">${escapeHtml(reading.client_name || 'для себя')}${reading.spread_name ? ` · ${escapeHtml(reading.spread_name)}` : ''}${reading.outcome_result ? ` · ${escapeHtml(journalExcerpt(reading.outcome_result, 70))}` : ''}</div>
            </div>
            <span class="row-badges">
              <span class="status-badge status-${reading.status}">${READING_STATUS_LABELS[reading.status] ?? reading.status}</span>
              ${reading.outcome_rating
                ? `<span class="outcome-badge ${outcomeRatingClass(reading.outcome_rating)}">${OUTCOME_RATING_LABELS[reading.outcome_rating] ?? reading.outcome_rating}</span>`
                : ''}
            </span>
          </a>
          <button class="icon-btn danger" type="button" data-unlink-reading="${reading.id}"
                  data-event-id="${event.id}"
                  title="Отвязать расклад" aria-label="Отвязать расклад «${escapeHtml(reading.title || reading.question || 'Расклад')}»">×</button>
        </div>
      `).join('')
    : `<div class="empty">С этим событием пока не связан ни один расклад.
         <a href="#/readings/new?event=${event.id}">Создать расклад по событию</a>
       </div>`;

  const linkedReadings = event.readings ?? [];
  const ratedReadings = linkedReadings.filter((reading) => reading.outcome_rating);
  const ratingCounts = OUTCOME_RATING_ORDER
    .map((rating) => ({
      rating,
      count: ratedReadings.filter((reading) => reading.outcome_rating === rating).length,
    }))
    .filter((item) => item.count > 0);

  const outcomeSummaryHtml = linkedReadings.length > 0
    ? `
      <div class="outcome-summary">
        ${ratedReadings.length > 0
          ? `<span class="outcome-summary-count">Оценено ${ratedReadings.length} из ${linkedReadings.length}</span>
             ${ratingCounts.map((item) => `
               <span class="outcome-badge ${outcomeRatingClass(item.rating)}">${OUTCOME_RATING_LABELS[item.rating]}: ${item.count}</span>
             `).join('')}`
          : '<span class="muted">Итоги по связанным раскладам пока не записаны.</span>'}
      </div>
    `
    : '';

  const addReadingHtml = readings.length === 0
    ? `<p class="muted event-link-hint">Раскладов пока нет.
         <a href="#/readings/new?event=${event.id}">Создать расклад по событию</a>.
       </p>`
    : availableReadings.length > 0
      ? `
        <div class="event-link-row">
          <select class="select" id="event-reading-add" aria-label="Расклад для связи">
            <option value="">Выберите расклад</option>
            ${availableReadings.map((reading) => `
              <option value="${reading.id}">
                ${escapeHtml(reading.title || reading.question || 'Расклад')} · ${formatDate(reading.reading_date)}
              </option>
            `).join('')}
          </select>
          <button class="btn" type="button" id="event-reading-add-btn">Связать</button>
        </div>
      `
      : '<p class="muted event-link-hint">Все расклады уже связаны с этим событием.</p>';

  const facts = [
    event.planned_date ? `План: ${formatDate(event.planned_date)}` : null,
    event.actual_date ? `Факт: ${formatDate(event.actual_date)}` : null,
    event.category ? `Категория: ${escapeHtml(event.category)}` : null,
  ].filter(Boolean);

  viewEl.innerHTML = `
    <a class="back-link" href="#/events">← все события</a>

    <div class="panel">
      <div class="detail-head">
        <div class="reading-view-head">
          <p class="muted detail-info">${facts.join(' · ') || 'даты и категория не указаны'}</p>
          <span class="status-badge ${eventStatusClass(event.status)}">${EVENT_STATUS_LABELS[event.status] ?? event.status}</span>
        </div>
        <div class="actions">
          <a class="btn" href="#/events/${event.id}/edit">Редактировать</a>
          <button class="btn btn-danger" type="button" id="event-delete">Удалить</button>
        </div>
      </div>

      ${event.description
        ? `<div class="notes">${escapeHtml(event.description)}</div>`
        : '<p class="muted notes-empty">Описания пока нет.</p>'}
    </div>

    ${event.result || event.notes
      ? `<div class="panel">
           <h2>Результат и заметки</h2>
           ${event.result ? `<div class="event-block"><h3>Фактический результат</h3><div class="notes event-notes">${escapeHtml(event.result)}</div></div>` : ''}
           ${event.notes ? `<div class="event-block"><h3>Заметки</h3><div class="notes event-notes">${escapeHtml(event.notes)}</div></div>` : ''}
         </div>`
      : ''}

    <div class="panel" id="event-readings-panel">
      <div class="panel-head">
        <h2>Связанные расклады</h2>
        <a class="panel-link" href="#/readings/new?event=${event.id}">создать расклад →</a>
      </div>
      ${outcomeSummaryHtml}
      ${linkedHtml}
      ${addReadingHtml}
    </div>
  `;

  enhanceSelects(viewEl);

  document.getElementById('event-delete').addEventListener('click', async () => {
    if (!confirm(`Удалить событие «${event.title}»? Связи с раскладами удалятся, сами расклады останутся.`)) return;
    try {
      await api(`/api/events/${event.id}`, { method: 'DELETE' });
      location.hash = '#/events';
    } catch (error) {
      alert(error.message);
    }
  });

  const addSelect = document.getElementById('event-reading-add');
  const addButton = document.getElementById('event-reading-add-btn');
  if (addSelect && addButton) {
    addButton.addEventListener('click', async () => {
      if (!addSelect.value) return;
      addButton.disabled = true;
      try {
        await api(`/api/events/${event.id}/readings`, {
          method: 'POST',
          body: JSON.stringify({ reading_id: Number(addSelect.value) }),
        });
        renderEventView(event.id);
      } catch (error) {
        addButton.disabled = false;
        alert(error.message);
      }
    });
  }

}

async function renderEventForm(id, options = {}) {
  const isEdit = Boolean(id);
  const calendarDate = !isEdit && /^\d{4}-\d{2}-\d{2}$/.test(String(options.date ?? ''))
    ? options.date
    : '';
  let event = {
    title: '',
    description: '',
    category: '',
    planned_date: calendarDate || todayIso(),
    actual_date: '',
    status: 'planned',
    result: '',
    notes: '',
  };
  let linkedReading = null;

  if (isEdit) {
    viewEl.innerHTML = '<p class="muted">Загрузка…</p>';
    try {
      event = await api(`/api/events/${encodeURIComponent(id)}`);
    } catch (error) {
      viewEl.innerHTML = `
        <div class="panel">
          <p>${escapeHtml(error.message)}</p>
          <p class="hint"><a href="#/events">← ко всем событиям</a></p>
        </div>
      `;
      return;
    }
  } else if (options.readingId) {
    try {
      linkedReading = await api(`/api/readings/${encodeURIComponent(options.readingId)}`);
    } catch {
      linkedReading = null;
    }
  }

  titleEl.textContent = isEdit ? 'Редактирование события' : 'Новое событие';
  subtitleEl.textContent = isEdit ? event.title : 'Что произойдёт и чем закончилось';
  document.title = `${titleEl.textContent} · Таро`;

  const calendarHref = calendarDate
    ? `#/journal?view=calendar&month=${calendarDate.slice(0, 7)}&date=${calendarDate}`
    : '';
  const backHref = isEdit
    ? `#/events/${event.id}`
    : calendarHref || '#/events';

  viewEl.innerHTML = `
    <a class="back-link" href="${backHref}">← ${calendarHref ? 'в календарь' : 'назад'}</a>
    ${linkedReading
      ? `<p class="event-link-note">Событие будет связано с раскладом
           <a href="#/readings/${linkedReading.id}">«${escapeHtml(linkedReading.title || linkedReading.question || 'Расклад')}»</a>.</p>`
      : ''}
    <form class="panel form" id="event-form" novalidate>
      <label><span>Название<span class="req">*</span></span>
        <input name="title" maxlength="200" required placeholder="Например, «Собеседование» или «Поездка»"
               value="${escapeHtml(event.title)}">
      </label>

      <div class="form-row">
        <label>Категория
          <input name="category" maxlength="100" placeholder="Работа, отношения, поездка"
                 value="${escapeHtml(event.category ?? '')}">
        </label>
        <label>Статус
          <select name="status">
            ${EVENT_STATUS_FILTERS.filter((status) => status.id !== 'all').map((status) => `
              <option value="${status.id}"${event.status === status.id ? ' selected' : ''}>${EVENT_STATUS_FORM_LABELS[status.id]}</option>
            `).join('')}
          </select>
        </label>
      </div>

      <div class="form-row">
        <label>Планируемая дата
          <input name="planned_date" type="date" value="${event.planned_date ?? ''}">
        </label>
        <label>Фактическая дата
          <input name="actual_date" type="date" value="${event.actual_date ?? ''}">
        </label>
      </div>

      <label>Описание
        <textarea name="description" rows="5" maxlength="5000"
                  placeholder="Что за событие, что важно учесть">${escapeHtml(event.description ?? '')}</textarea>
      </label>

      <label>Фактический результат
        <textarea name="result" rows="5" maxlength="5000"
                  placeholder="Что произошло на самом деле">${escapeHtml(event.result ?? '')}</textarea>
      </label>

      <label>Заметки
        <textarea name="notes" rows="4" maxlength="5000"
                  placeholder="Наблюдения, выводы, что сделать дальше">${escapeHtml(event.notes ?? '')}</textarea>
      </label>

      <p class="form-error" id="form-error"></p>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">${isEdit ? 'Сохранить изменения' : 'Добавить событие'}</button>
        <a class="btn" href="${backHref}">Отмена</a>
      </div>
    </form>
  `;

  const form = document.getElementById('event-form');
  const errorEl = document.getElementById('form-error');
  const submitButton = form.querySelector('button[type="submit"]');
  enhanceSelects(form);

  form.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    if (!String(data.title ?? '').trim()) {
      errorEl.textContent = 'Название события обязательно.';
      return;
    }

    errorEl.textContent = '';
    submitButton.disabled = true;

    try {
      const saved = isEdit
        ? await api(`/api/events/${event.id}`, { method: 'PUT', body: JSON.stringify(data) })
        : await api('/api/events', { method: 'POST', body: JSON.stringify(data) });

      if (!isEdit && linkedReading) {
        try {
          await api(`/api/events/${saved.id}/readings`, {
            method: 'POST',
            body: JSON.stringify({ reading_id: linkedReading.id }),
          });
        } catch {
          // событие уже сохранено; связь можно добавить вручную
        }
      }

      if (calendarHref) {
        location.hash = calendarHref;
      } else {
        location.hash = `#/events/${saved.id}`;
      }
    } catch (error) {
      errorEl.textContent = error.message;
      submitButton.disabled = false;
    }
  });
}

/* ---------- Дневник ---------- */

const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const MONTHS_NOMINATIVE = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

function parseMonth(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value ?? '')) ? value : todayIso().slice(0, 7);
}

function monthLabel(value) {
  const [year, month] = String(value).split('-').map(Number);
  return `${MONTHS_NOMINATIVE[month - 1]} ${year}`;
}

function shiftMonth(value, delta) {
  const [year, month] = String(value).split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isoFromParts(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatLongDate(value) {
  const datePart = String(value ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return formatDate(value);
  const [year, month, day] = datePart.split('-').map(Number);
  return `${day} ${MONTHS_GENITIVE[month - 1]} ${year}`;
}

function journalExcerpt(value, max = 200) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function journalTitle(entry) {
  return entry.title || journalExcerpt(entry.body, 80) || 'Без заголовка';
}

function journalTagsHtml(tags, linkable = false) {
  if (!Array.isArray(tags) || tags.length === 0) return '';
  const items = tags.map((tag) => (linkable
    ? `<a class="tag" href="#/journal?tag=${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`
    : `<span class="tag">#${escapeHtml(tag)}</span>`)).join('');
  return `<div class="journal-tags">${items}</div>`;
}

function journalLinksHtml(entry, options = {}) {
  const links = [];

  if (entry.client_id) {
    links.push(`
      <a class="journal-link" href="#/clients/${entry.client_id}">
        <span class="journal-link-label">Клиент</span>
        ${escapeHtml(entry.client_name || `#${entry.client_id}`)}
      </a>
    `);
  }

  if (entry.reading_id) {
    const label = entry.reading_title
      || (entry.reading_date ? formatDate(entry.reading_date) : `#${entry.reading_id}`);
    links.push(`
      <a class="journal-link" href="#/readings/${entry.reading_id}">
        <span class="journal-link-label">Расклад</span>
        ${escapeHtml(label)}
      </a>
    `);
  }

  if (entry.card_id) {
    const image = options.withImage && entry.card_image
      ? `<img src="${escapeHtml(entry.card_image)}" alt=""
              onerror="this.onerror=null;this.src='cards/placeholder.svg'">`
      : '';
    links.push(`
      <a class="journal-link journal-link-card" href="#/cards/${entry.card_id}">
        ${image}
        <span>
          <span class="journal-link-label">Карта</span>
          ${escapeHtml(entry.card_name_ru || `#${entry.card_id}`)}
        </span>
      </a>
    `);
  }

  return links.length > 0 ? `<div class="journal-links">${links.join('')}</div>` : '';
}

function journalEntryRow(entry) {
  const hasTitle = Boolean(entry.title);
  const title = journalTitle(entry);
  const excerpt = entry.body && (hasTitle || String(entry.body).trim().length > 80)
    ? journalExcerpt(entry.body, 220)
    : '';

  const meta = [
    entry.client_name,
    entry.reading_title,
    entry.card_name_ru,
  ].filter(Boolean).map(escapeHtml).join(' · ');

  return `
    <a class="journal-entry" href="#/journal/${entry.id}">
      <div class="journal-entry-main">
        <div class="journal-entry-title">${escapeHtml(title)}</div>
        ${excerpt ? `<div class="journal-entry-excerpt">${escapeHtml(excerpt)}</div>` : ''}
        ${journalTagsHtml(entry.tags)}
      </div>
      <div class="journal-entry-side">
        ${meta ? `<div class="journal-entry-meta">${meta}</div>` : ''}
        <span class="journal-entry-arrow" aria-hidden="true">→</span>
      </div>
    </a>
  `;
}

function journalEventRow(event) {
  const excerpt = event.description || event.result || '';
  const meta = [
    event.category,
    event.client_names,
    event.readings_count ? eventReadingsLabel(event.readings_count) : '',
  ].filter(Boolean).map(escapeHtml).join(' · ');

  return `
    <a class="journal-entry journal-entry-event" href="#/events/${event.id}">
      <div class="journal-entry-main">
        <div class="journal-entry-title">
          <span class="journal-event-mark">Событие</span>
          ${escapeHtml(event.title)}
        </div>
        ${excerpt ? `<div class="journal-entry-excerpt">${escapeHtml(journalExcerpt(excerpt, 220))}</div>` : ''}
        ${meta ? `<div class="journal-entry-event-meta">${meta}</div>` : ''}
      </div>
      <div class="journal-entry-side">
        <span class="status-badge ${eventStatusClass(event.status)}">${EVENT_STATUS_LABELS[event.status] ?? event.status}</span>
        <span class="journal-entry-arrow" aria-hidden="true">→</span>
      </div>
    </a>
  `;
}

function journalGroupSummary(entryCount, eventCount) {
  const parts = [];
  if (entryCount > 0) {
    parts.push(`${entryCount} ${plural(entryCount, ['запись', 'записи', 'записей'])}`);
  }
  if (eventCount > 0) {
    parts.push(`${eventCount} ${plural(eventCount, ['событие', 'события', 'событий'])}`);
  }
  return parts.join(' · ');
}

/* ---------- Календарь ---------- */

const CALENDAR_WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const CALENDAR_HIDDEN_EVENT_STATUSES = ['cancelled', 'archived'];

let calendarMenuState = null;

function calendarEventDate(event) {
  return event.actual_date || event.planned_date || '';
}

function closeCalendarMenu() {
  if (!calendarMenuState) return;
  const { menu, anchor } = calendarMenuState;
  const restoreFocus = menu.contains(document.activeElement);
  menu.remove();
  anchor?.classList.remove('is-open');
  anchor?.setAttribute('aria-expanded', 'false');
  calendarMenuState = null;
  if (restoreFocus) anchor?.focus({ preventScroll: true });
}

function openCalendarMenu(anchor, date) {
  closeCalendarMenu();

  const menu = document.createElement('div');
  menu.className = 'calendar-add-popover';
  menu.setAttribute('role', 'menu');
  menu.innerHTML = `
    <a role="menuitem" href="#/journal/new?date=${encodeURIComponent(date)}">
      <span class="calendar-add-icon" aria-hidden="true">✎</span>
      Запись в дневнике
    </a>
    <a role="menuitem" href="#/events/new?date=${encodeURIComponent(date)}">
      <span class="calendar-add-icon" aria-hidden="true">◈</span>
      Событие
    </a>
  `;

  document.body.appendChild(menu);

  const rect = anchor.getBoundingClientRect();
  const width = menu.offsetWidth || 210;
  const height = menu.offsetHeight || 96;
  const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
  const top = rect.bottom + 6 + height > window.innerHeight - 8
    ? Math.max(8, rect.top - height - 6)
    : rect.bottom + 6;

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  anchor.classList.add('is-open');
  anchor.setAttribute('aria-expanded', 'true');
  calendarMenuState = { menu, anchor };
  menu.querySelector('a')?.focus({ preventScroll: true });
}

document.addEventListener('click', (event) => {
  if (!calendarMenuState) return;
  if (calendarMenuState.menu.contains(event.target) || calendarMenuState.anchor.contains(event.target)) return;
  closeCalendarMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeCalendarMenu();
});

window.addEventListener('resize', closeCalendarMenu);
window.addEventListener('scroll', closeCalendarMenu, true);
window.addEventListener('hashchange', closeCalendarMenu);

function calendarEventRow(event) {
  return `
    <a class="calendar-event-row" href="#/events/${event.id}">
      <div class="list-main">
        <div class="list-title">${escapeHtml(event.title)}</div>
        <div class="list-sub">${[
          event.category,
          event.actual_date ? `факт ${formatDate(event.actual_date)}` : null,
        ].filter(Boolean).map(escapeHtml).join(' · ') || 'без категории'}</div>
      </div>
      <span class="status-badge ${eventStatusClass(event.status)}">${EVENT_STATUS_LABELS[event.status] ?? event.status}</span>
    </a>
  `;
}

function calendarMarkup({
  month,
  selectedDate = '',
  entries = [],
  events = [],
  showEvents = true,
  includeArchived = false,
  compact = false,
}) {
  const [year, monthNumber] = month.split('-').map(Number);
  const monthIndex = monthNumber - 1;
  const firstDay = new Date(year, monthIndex, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
  const today = todayIso();

  const visibleEvents = showEvents
    ? events.filter((event) => {
        if (!calendarEventDate(event)) return false;
        if (!includeArchived && CALENDAR_HIDDEN_EVENT_STATUSES.includes(event.status)) return false;
        return true;
      })
    : [];

  const entriesByDate = new Map();
  for (const entry of entries) {
    const list = entriesByDate.get(entry.entry_date) ?? [];
    list.push(entry);
    entriesByDate.set(entry.entry_date, list);
  }

  const eventsByDate = new Map();
  for (const event of visibleEvents) {
    const date = calendarEventDate(event);
    const list = eventsByDate.get(date) ?? [];
    list.push(event);
    eventsByDate.set(date, list);
  }

  const monthEntries = entries.filter((entry) => entry.entry_date.startsWith(`${month}-`));
  const monthEvents = visibleEvents.filter((event) => calendarEventDate(event).startsWith(`${month}-`));

  const cells = [];
  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - offset + 1;
    const date = new Date(year, monthIndex, dayNumber);
    const iso = isoFromParts(date.getFullYear(), date.getMonth(), date.getDate());
    const inMonth = date.getMonth() === monthIndex;
    const dayEntries = entriesByDate.get(iso) ?? [];
    const dayEvents = eventsByDate.get(iso) ?? [];
    const selected = selectedDate === iso;

    const labelParts = [formatLongDate(iso)];
    if (dayEntries.length > 0) {
      labelParts.push(`${dayEntries.length} ${plural(dayEntries.length, ['запись', 'записи', 'записей'])}`);
    }
    if (dayEvents.length > 0) {
      labelParts.push(`${dayEvents.length} ${plural(dayEvents.length, ['событие', 'события', 'событий'])}`);
    }

    cells.push(`
      <div class="calendar-day${inMonth ? '' : ' is-outside'}${selected ? ' is-selected' : ''}${iso === today ? ' is-today' : ''}">
        <button type="button" class="calendar-day-btn" data-calendar-date="${iso}"
                aria-label="${escapeHtml(labelParts.join(', '))}">
          <span class="calendar-day-num">${date.getDate()}</span>
          <span class="calendar-day-marks">
            ${dayEntries.length > 0 ? `<span class="calendar-mark calendar-mark-entry" title="${dayEntries.length} ${plural(dayEntries.length, ['запись', 'записи', 'записей'])}">${dayEntries.length}</span>` : ''}
            ${dayEvents.length > 0 ? `<span class="calendar-mark calendar-mark-event" title="${dayEvents.length} ${plural(dayEvents.length, ['событие', 'события', 'событий'])}">${dayEvents.length}</span>` : ''}
          </span>
        </button>
        <button type="button" class="calendar-add" data-calendar-add="${iso}"
                aria-haspopup="menu" aria-expanded="false"
                title="Добавить на ${escapeHtml(formatLongDate(iso))}"
                aria-label="Добавить на ${escapeHtml(formatLongDate(iso))}">+</button>
      </div>
    `);
  }

  const monthSummary = [
    `${monthEntries.length} ${plural(monthEntries.length, ['запись', 'записи', 'записей'])}`,
    showEvents
      ? `${monthEvents.length} ${plural(monthEvents.length, ['событие', 'события', 'событий'])}`
      : 'события скрыты',
  ].join(' · ');

  const selectedEntries = selectedDate ? (entriesByDate.get(selectedDate) ?? []) : [];
  const selectedEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];
  const selectedParts = [
    `${selectedEntries.length} ${plural(selectedEntries.length, ['запись', 'записи', 'записей'])}`,
    `${selectedEvents.length} ${plural(selectedEvents.length, ['событие', 'события', 'событий'])}`,
  ].join(' · ');

  const selectedHtml = compact
    ? ''
    : selectedDate
      ? `
        <div class="calendar-selected">
          <div class="calendar-selected-head">
            <div>
              <div class="calendar-selected-title">${formatLongDate(selectedDate)}</div>
              <div class="muted">${selectedParts}</div>
            </div>
            <div class="calendar-selected-actions">
              <a class="btn btn-small" href="#/journal?from=${selectedDate}&to=${selectedDate}&view=list">Показать в списке</a>
              <button class="btn btn-primary btn-small" type="button" data-calendar-add="${selectedDate}"
                      aria-haspopup="menu" aria-expanded="false">Добавить</button>
            </div>
          </div>
          ${selectedEntries.length > 0
            ? `<div class="calendar-list-label">Записи</div>
               <div class="panel journal-entries">${selectedEntries.map(journalEntryRow).join('')}</div>`
            : ''}
          ${selectedEvents.length > 0
            ? `<div class="calendar-list-label">События</div>
               <div class="panel calendar-event-list">${selectedEvents.map(calendarEventRow).join('')}</div>`
            : ''}
          ${selectedEntries.length === 0 && selectedEvents.length === 0
            ? `<div class="panel empty">На этот день ничего нет.
                 <button class="link-button" type="button" data-calendar-add="${selectedDate}">Добавить запись или событие</button>
               </div>`
            : ''}
        </div>
      `
      : '<p class="calendar-hint">Нажмите на день, чтобы увидеть записи и события, или на «+» в углу дня, чтобы добавить новое.</p>';

  return `
    <div class="panel journal-calendar${compact ? ' calendar-compact' : ''}">
      <div class="calendar-head">
        <div>
          <h2 class="calendar-title">${monthLabel(month)}</h2>
          <div class="muted calendar-summary">${monthSummary}</div>
        </div>
        <div class="calendar-nav">
          ${compact
            ? `<a class="panel-link calendar-full-link" href="#/journal?view=calendar&month=${month}">весь календарь →</a>`
            : ''}
          <button class="btn btn-small" type="button" data-calendar-shift="-1" title="Предыдущий месяц">‹</button>
          <button class="btn btn-small" type="button" data-calendar-today>Сегодня</button>
          <button class="btn btn-small" type="button" data-calendar-shift="1" title="Следующий месяц">›</button>
        </div>
      </div>
      <div class="calendar-legend">
        <span class="calendar-legend-item"><span class="calendar-mark calendar-mark-entry"></span>записи</span>
        ${showEvents ? '<span class="calendar-legend-item"><span class="calendar-mark calendar-mark-event"></span>события</span>' : ''}
      </div>
      <div class="calendar-grid">
        ${CALENDAR_WEEKDAYS.map((weekday) => `<div class="calendar-weekday">${weekday}</div>`).join('')}
        ${cells.join('')}
      </div>
      ${selectedHtml}
    </div>
  `;
}

async function renderJournal(params = new URLSearchParams()) {
  const today = todayIso();
  const state = {
    query: params.get('q') ?? '',
    clientId: params.get('client') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    tag: params.get('tag') ?? '',
    view: params.get('view') === 'calendar' ? 'calendar' : 'list',
    month: parseMonth(params.get('month')),
    selectedDate: '',
    showEvents: params.get('events') !== '0',
    includeArchived: params.get('archived') === '1',
  };

  const dateParam = params.get('date') ?? '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    state.selectedDate = dateParam;
    if (state.view === 'calendar' && !params.get('month')) state.month = dateParam.slice(0, 7);
  }
  if (state.view === 'calendar' && !state.selectedDate && today.startsWith(state.month)) {
    state.selectedDate = today;
  }

  viewEl.innerHTML = `
    <div class="cards-toolbar">
      <input class="search" id="journal-search" type="search" autocomplete="off"
             placeholder="Поиск по заголовку, тексту, тегам, клиенту"
             value="${escapeHtml(state.query)}">
      <a class="btn btn-primary" href="#/journal/new">Новая запись</a>
    </div>

    <div class="filters-row">
      <div class="journal-view-toggle" id="journal-view" role="group" aria-label="Вид дневника">
        <button type="button" data-view="list" aria-pressed="${state.view === 'list'}">Список</button>
        <button type="button" data-view="calendar" aria-pressed="${state.view === 'calendar'}">Календарь</button>
      </div>
      <select class="select chip-select" id="journal-client">
        <option value="">Все клиенты</option>
      </select>
      <div class="date-range">
        <label class="date-filter">с <input class="select" type="date" id="journal-from" value="${escapeHtml(state.from)}"></label>
        <label class="date-filter">по <input class="select" type="date" id="journal-to" value="${escapeHtml(state.to)}"></label>
      </div>
      <button class="btn btn-small reset-filters" type="button" id="journal-reset" hidden>Сбросить фильтры</button>
    </div>

    <div class="calendar-filters" id="journal-calendar-filters" hidden>
      <button type="button" class="chip" data-calendar-toggle="events" aria-pressed="true">Показывать события</button>
      <button type="button" class="chip" data-calendar-toggle="archived" aria-pressed="false">Отменённые и архивные</button>
    </div>

    <div class="chips journal-tag-filter" id="journal-tags"></div>

    <p class="result-count muted" id="journal-count"></p>
    <div id="journal-list"><p class="muted">Загрузка…</p></div>
  `;

  const list = document.getElementById('journal-list');
  const counter = document.getElementById('journal-count');
  const tagHost = document.getElementById('journal-tags');
  const search = document.getElementById('journal-search');
  const fromInput = document.getElementById('journal-from');
  const toInput = document.getElementById('journal-to');
  const resetButton = document.getElementById('journal-reset');
  const viewHost = document.getElementById('journal-view');
  const calendarFilters = document.getElementById('journal-calendar-filters');

  let entries;
  let clients;
  let events;
  try {
    [entries, clients, events] = await Promise.all([
      api('/api/journal'),
      api('/api/clients'),
      api('/api/events'),
    ]);
  } catch (error) {
    list.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
    return;
  }

  const clientSelect = document.getElementById('journal-client');
  clientSelect.insertAdjacentHTML('beforeend', clients
    .map((client) => `<option value="${client.id}">${escapeHtml(client.name)}</option>`)
    .join(''));

  if (state.clientId && !clients.some((client) => String(client.id) === state.clientId)) {
    state.clientId = '';
  }
  if (state.clientId) setSelectValue(clientSelect, state.clientId);
  enhanceSelects(viewEl);
  setSelectActive(clientSelect, Boolean(state.clientId));

  const allTags = [...new Set(entries.flatMap((entry) => entry.tags ?? []))]
    .sort((a, b) => a.localeCompare(b, 'ru'));

  function paintTags() {
    if (allTags.length === 0) {
      tagHost.innerHTML = '';
      tagHost.hidden = true;
      return;
    }

    tagHost.hidden = false;
    tagHost.innerHTML = [
      `<button type="button" class="chip${state.tag ? '' : ' is-active'}" data-tag="">Все теги</button>`,
      ...allTags.map((tag) => `
        <button type="button" class="chip${state.tag.toLowerCase() === tag.toLowerCase() ? ' is-active' : ''}"
                data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>
      `),
    ].join('');
  }

  function paintViewToggle() {
    for (const button of viewHost.querySelectorAll('[data-view]')) {
      const active = button.dataset.view === state.view;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    calendarFilters.hidden = false;

    for (const button of calendarFilters.querySelectorAll('[data-calendar-toggle]')) {
      const active = button.dataset.calendarToggle === 'events'
        ? state.showEvents
        : state.includeArchived;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    }
  }

  function updateReset() {
    resetButton.hidden = !(
      state.query.trim()
      || state.clientId
      || state.from
      || state.to
      || state.tag
      || !state.showEvents
      || state.includeArchived
    );
  }

  function syncUrl() {
    const next = new URLSearchParams();
    if (state.view === 'calendar') {
      next.set('view', 'calendar');
      next.set('month', state.month);
      if (state.selectedDate) next.set('date', state.selectedDate);
    }
    if (!state.showEvents) next.set('events', '0');
    if (state.includeArchived) next.set('archived', '1');
    if (state.query.trim()) next.set('q', state.query.trim());
    if (state.clientId) next.set('client', state.clientId);
    if (state.from) next.set('from', state.from);
    if (state.to) next.set('to', state.to);
    if (state.tag) next.set('tag', state.tag);

    const queryString = next.toString();
    history.replaceState(null, '', `#/journal${queryString ? `?${queryString}` : ''}`);
  }

  function filteredEntries() {
    const query = state.query.trim().toLowerCase();

    return entries.filter((entry) => {
      if (state.clientId && String(entry.client_id) !== state.clientId) return false;
      if (state.from && entry.entry_date < state.from) return false;
      if (state.to && entry.entry_date > state.to) return false;
      if (state.tag && !(entry.tags ?? []).some((tag) => tag.toLowerCase() === state.tag.toLowerCase())) {
        return false;
      }
      if (!query) return true;

      const haystack = [
        entry.title,
        entry.body,
        entry.client_name,
        entry.reading_title,
        entry.card_name_ru,
        entry.card_name_en,
        ...(entry.tags ?? []),
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  function filteredEvents() {
    if (!state.showEvents || state.tag) return [];

    const query = state.query.trim().toLowerCase();

    return events.filter((event) => {
      if (!state.includeArchived && CALENDAR_HIDDEN_EVENT_STATUSES.includes(event.status)) {
        return false;
      }

      const date = calendarEventDate(event);
      if (state.from && (!date || date < state.from)) return false;
      if (state.to && (!date || date > state.to)) return false;

      if (state.clientId) {
        const clientIds = String(event.client_ids ?? '').split(',').filter(Boolean);
        if (!clientIds.includes(state.clientId)) return false;
      }

      if (!query) return true;

      const haystack = [
        event.title,
        event.description,
        event.category,
        event.result,
        event.notes,
        event.reading_titles,
        event.client_names,
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  function paintList(visibleEntries, visibleEvents) {
    const total = visibleEntries.length + visibleEvents.length;
    counter.textContent = journalGroupSummary(visibleEntries.length, visibleEvents.length);

    if (total === 0) {
      list.innerHTML = entries.length === 0 && events.length === 0
        ? '<div class="empty">Пока ни одной записи или события.<br><a href="#/journal/new">Добавить запись</a> · <a href="#/events/new">Создать событие</a></div>'
        : '<div class="empty">Ничего не найдено. Попробуйте изменить фильтры.</div>';
      return;
    }

    const buckets = new Map();
    const bucketFor = (date) => {
      const key = date || '';
      if (!buckets.has(key)) buckets.set(key, { date: key, entries: [], events: [] });
      return buckets.get(key);
    };

    for (const entry of visibleEntries) {
      bucketFor(entry.entry_date).entries.push(entry);
    }
    for (const event of visibleEvents) {
      bucketFor(calendarEventDate(event)).events.push(event);
    }

    const groups = [...buckets.values()].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });

    list.innerHTML = groups.map((group) => `
      <div class="journal-day">
        <span class="journal-day-date">${group.date ? formatLongDate(group.date) : 'Без даты'}</span>
        <span class="journal-day-count">${journalGroupSummary(group.entries.length, group.events.length)}</span>
      </div>
      <div class="panel journal-entries">
        ${group.entries.map(journalEntryRow).join('')}
        ${group.events.map(journalEventRow).join('')}
      </div>
    `).join('');
  }

  function paintCalendar(visible) {
    counter.textContent = '';
    list.innerHTML = calendarMarkup({
      month: state.month,
      selectedDate: state.selectedDate,
      entries: visible,
      events,
      showEvents: state.showEvents,
      includeArchived: state.includeArchived,
    });
  }

  function paint() {
    updateReset();
    const visibleEntries = filteredEntries();
    const visibleEvents = filteredEvents();
    if (state.view === 'calendar') paintCalendar(visibleEntries);
    else paintList(visibleEntries, visibleEvents);
    syncUrl();
  }

  tagHost.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tag]');
    if (!button) return;
    state.tag = button.dataset.tag;
    paintTags();
    paint();
  });

  viewHost.addEventListener('click', (event) => {
    const button = event.target.closest('[data-view]');
    if (!button || button.dataset.view === state.view) return;
    state.view = button.dataset.view;
    if (state.view === 'calendar' && !state.selectedDate && today.startsWith(state.month)) {
      state.selectedDate = today;
    }
    paintViewToggle();
    paint();
  });

  calendarFilters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-calendar-toggle]');
    if (!button) return;
    if (button.dataset.calendarToggle === 'events') {
      state.showEvents = !state.showEvents;
    } else {
      state.includeArchived = !state.includeArchived;
    }
    paintViewToggle();
    paint();
  });

  clientSelect.addEventListener('change', () => {
    state.clientId = clientSelect.value;
    setSelectActive(clientSelect, Boolean(clientSelect.value));
    paint();
  });

  fromInput.addEventListener('change', (event) => {
    state.from = event.target.value;
    paint();
  });

  toInput.addEventListener('change', (event) => {
    state.to = event.target.value;
    paint();
  });

  search.addEventListener('input', () => {
    state.query = search.value;
    paint();
  });

  resetButton.addEventListener('click', () => {
    state.query = '';
    state.clientId = '';
    state.from = '';
    state.to = '';
    state.tag = '';
    state.showEvents = true;
    state.includeArchived = false;
    search.value = '';
    fromInput.value = '';
    toInput.value = '';
    setSelectValue(clientSelect, '');
    setSelectActive(clientSelect, false);
    paintTags();
    paintViewToggle();
    paint();
  });

  list.addEventListener('click', (event) => {
    const shift = event.target.closest('[data-calendar-shift]');
    if (shift) {
      state.month = shiftMonth(state.month, Number(shift.dataset.calendarShift));
      if (!state.selectedDate.startsWith(state.month)) state.selectedDate = '';
      paint();
      return;
    }

    if (event.target.closest('[data-calendar-today]')) {
      state.month = today.slice(0, 7);
      state.selectedDate = today;
      paint();
      return;
    }

    const add = event.target.closest('[data-calendar-add]');
    if (add) {
      event.preventDefault();
      openCalendarMenu(add, add.dataset.calendarAdd);
      return;
    }

    const day = event.target.closest('[data-calendar-date]');
    if (!day) return;
    state.selectedDate = day.dataset.calendarDate;
    state.month = state.selectedDate.slice(0, 7);
    paint();
  });

  paintTags();
  paintViewToggle();
  paint();
}

async function renderJournalView(id) {
  viewEl.innerHTML = '<p class="muted">Загрузка…</p>';

  let entry;
  try {
    entry = await api(`/api/journal/${encodeURIComponent(id)}`);
  } catch (error) {
    viewEl.innerHTML = `
      <div class="panel">
        <p>${escapeHtml(error.message)}</p>
        <p class="hint"><a href="#/journal">← ко всем записям</a></p>
      </div>
    `;
    return;
  }

  const title = journalTitle(entry);
  titleEl.textContent = title;
  subtitleEl.textContent = formatLongDate(entry.entry_date);
  document.title = `${title} · Таро`;

  viewEl.innerHTML = `
    <a class="back-link" href="#/journal">← все записи</a>

    <div class="panel journal-view">
      <div class="detail-head">
        <p class="muted detail-info">${formatLongDate(entry.entry_date)}</p>
        <div class="actions">
          <a class="btn" href="#/journal/${entry.id}/edit">Редактировать</a>
          <button class="btn btn-danger" type="button" id="journal-delete">Удалить</button>
        </div>
      </div>

      ${journalLinksHtml(entry, { withImage: true })}
      ${journalTagsHtml(entry.tags, true)}
      ${entry.body ? `<div class="notes journal-body">${escapeHtml(entry.body)}</div>` : ''}
    </div>
  `;

  document.getElementById('journal-delete').addEventListener('click', async () => {
    if (!confirm('Удалить запись дневника? Это действие нельзя отменить.')) return;
    try {
      await api(`/api/journal/${entry.id}`, { method: 'DELETE' });
      location.hash = '#/journal';
    } catch (error) {
      alert(error.message);
    }
  });
}

async function renderJournalForm(id, options = {}) {
  const isEdit = Boolean(id);
  let entry = {
    entry_date: todayIso(),
    title: '',
    body: '',
    tags: [],
    card_id: '',
    reading_id: '',
    client_id: '',
  };

  viewEl.innerHTML = '<p class="muted">Загрузка…</p>';

  let clients;
  let readings;
  let cards;
  try {
    const tasks = [api('/api/clients'), api('/api/readings'), getCards()];
    if (isEdit) tasks.push(api(`/api/journal/${encodeURIComponent(id)}`));

    const [clientsData, readingsData, cardsData, entryData] = await Promise.all(tasks);
    clients = clientsData;
    readings = readingsData;
    cards = cardsData;
    if (isEdit) entry = entryData;

    if (!isEdit) {
      if (options.client && clients.some((client) => String(client.id) === String(options.client))) {
        entry.client_id = Number(options.client);
      }
      if (options.reading && readings.some((reading) => String(reading.id) === String(options.reading))) {
        entry.reading_id = Number(options.reading);
      }
      if (options.card && cards.some((card) => String(card.id) === String(options.card))) {
        entry.card_id = Number(options.card);
      }
      if (options.date && /^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
        entry.entry_date = options.date;
      }
      if (!entry.client_id && entry.reading_id) {
        const linked = readings.find((reading) => String(reading.id) === String(entry.reading_id));
        if (linked?.client_id) entry.client_id = linked.client_id;
      }
    }
  } catch (error) {
    viewEl.innerHTML = `
      <div class="panel">
        <p>${escapeHtml(error.message)}</p>
        <p class="hint"><a href="#/journal">← ко всем записям</a></p>
      </div>
    `;
    return;
  }

  titleEl.textContent = isEdit ? 'Редактирование записи' : 'Новая запись';
  subtitleEl.textContent = isEdit ? formatLongDate(entry.entry_date) : 'Дневник практики';
  document.title = `${titleEl.textContent} · Таро`;

  const calendarDate = !isEdit && /^\d{4}-\d{2}-\d{2}$/.test(String(options.date ?? ''))
    ? options.date
    : '';
  const calendarHref = calendarDate
    ? `#/journal?view=calendar&month=${calendarDate.slice(0, 7)}&date=${calendarDate}`
    : '';
  const backHref = isEdit
    ? `#/journal/${entry.id}`
    : calendarHref || '#/journal';

  const clientOptions = clients.map((client) => `
    <option value="${client.id}"${String(entry.client_id ?? '') === String(client.id) ? ' selected' : ''}>
      ${escapeHtml(client.name)}
    </option>
  `).join('');

  const readingOptions = readings.map((reading) => {
    const label = [
      formatDate(reading.reading_date),
      reading.title || reading.question || 'Без названия',
      reading.client_name,
    ].filter(Boolean).join(' · ');
    return `
      <option value="${reading.id}"${String(entry.reading_id ?? '') === String(reading.id) ? ' selected' : ''}>
        ${escapeHtml(label)}
      </option>
    `;
  }).join('');

  const cardGroups = [
    { label: 'Старшие арканы', items: cards.filter((card) => card.arcana === 'major') },
    { label: 'Жезлы', items: cards.filter((card) => card.suit === 'wands') },
    { label: 'Кубки', items: cards.filter((card) => card.suit === 'cups') },
    { label: 'Мечи', items: cards.filter((card) => card.suit === 'swords') },
    { label: 'Пентакли', items: cards.filter((card) => card.suit === 'pentacles') },
  ];

  const cardOptions = cardGroups.map((group) => `
    <optgroup label="${group.label}">
      ${group.items.map((card) => `
        <option value="${card.id}"${String(entry.card_id ?? '') === String(card.id) ? ' selected' : ''}>
          ${escapeHtml(card.name_ru)} (${escapeHtml(card.name_en)})
        </option>
      `).join('')}
    </optgroup>
  `).join('');

  viewEl.innerHTML = `
    <a class="back-link" href="${backHref}">← ${calendarHref ? 'в календарь' : 'назад'}</a>

    <form class="panel form journal-form" id="journal-form" novalidate>
      <div class="form-row">
        <label><span>Дата<span class="req">*</span></span>
          <input name="entry_date" type="date" required value="${entry.entry_date ?? todayIso()}">
        </label>
        <label>Заголовок
          <input name="title" maxlength="200" placeholder="О чём запись"
                 value="${escapeHtml(entry.title ?? '')}">
        </label>
      </div>

      <label>Текст
        <textarea name="body" rows="12" maxlength="3000"
                  placeholder="Наблюдения, мысли, повторяющиеся символы">${escapeHtml(entry.body ?? '')}</textarea>
      </label>
      <p class="field-hint muted">Максимум 3000 символов. Нужен заголовок или текст.</p>

      <label>Теги
        <input name="tags" maxlength="1000" placeholder="например: карта дня, работа, повторяется"
               value="${escapeHtml((entry.tags ?? []).join(', '))}">
      </label>
      <p class="field-hint muted">Через запятую. До 20 тегов, каждый до 40 символов.</p>

      <div class="form-row">
        <label>Клиент
          <select name="client_id">
            <option value="">Без клиента</option>
            ${clientOptions}
          </select>
        </label>
        <label>Расклад
          <select name="reading_id">
            <option value="">Без расклада</option>
            ${readingOptions}
          </select>
        </label>
      </div>

      <label>Карта
        <select name="card_id">
          <option value="">Без карты</option>
          ${cardOptions}
        </select>
      </label>

      <p class="form-error" id="form-error"></p>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">${isEdit ? 'Сохранить' : 'Добавить'}</button>
        <a class="btn" href="${backHref}">Отмена</a>
        ${isEdit ? '<button class="btn btn-danger" type="button" id="journal-delete">Удалить</button>' : ''}
      </div>
    </form>
  `;

  const form = document.getElementById('journal-form');
  const errorEl = document.getElementById('form-error');
  const submitButton = form.querySelector('button[type="submit"]');
  enhanceSelects(form);

  form.elements.reading_id.addEventListener('change', () => {
    if (form.elements.client_id.value) return;
    const linked = readings.find((reading) => String(reading.id) === form.elements.reading_id.value);
    if (linked?.client_id) setSelectValue(form.elements.client_id, String(linked.client_id));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    if (!String(data.entry_date ?? '').trim()) {
      errorEl.textContent = 'Укажите дату записи.';
      return;
    }
    if (!String(data.title ?? '').trim() && !String(data.body ?? '').trim()) {
      errorEl.textContent = 'Заполните заголовок или текст записи.';
      return;
    }

    submitButton.disabled = true;
    errorEl.textContent = '';

    try {
      const saved = isEdit
        ? await api(`/api/journal/${id}`, { method: 'PUT', body: JSON.stringify(data) })
        : await api('/api/journal', { method: 'POST', body: JSON.stringify(data) });
      if (calendarHref) {
        location.hash = calendarHref;
      } else {
        location.hash = `#/journal/${saved.id}`;
      }
    } catch (error) {
      errorEl.textContent = error.message;
      submitButton.disabled = false;
    }
  });

  const deleteButton = document.getElementById('journal-delete');
  if (deleteButton) {
    deleteButton.addEventListener('click', async () => {
      if (!confirm('Удалить запись дневника? Это действие нельзя отменить.')) return;
      try {
        await api(`/api/journal/${entry.id}`, { method: 'DELETE' });
        location.hash = '#/journal';
      } catch (error) {
        alert(error.message);
      }
    });
  }
}

/* ---------- Поиск и статистика ---------- */

const SEARCH_SCOPES = [
  { id: 'all', label: 'Всё' },
  { id: 'cards', label: 'Карты' },
  { id: 'clients', label: 'Клиенты' },
  { id: 'readings', label: 'Расклады' },
  { id: 'events', label: 'События' },
  { id: 'journal', label: 'Дневник' },
];

function normalizeSearchText(value) {
  return String(value ?? '').toLowerCase().replace(/ё/g, 'е');
}

function searchSnippet(value, query, max = 150) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return '';

  const haystack = normalizeSearchText(text);
  const index = haystack.indexOf(normalizeSearchText(query));
  if (index === -1) return journalExcerpt(text, max);

  const start = Math.max(0, index - Math.floor(max / 3));
  const end = Math.min(text.length, start + max);
  const part = text.slice(start, end).trim();
  return `${start > 0 ? '…' : ''}${part}${end < text.length ? '…' : ''}`;
}

function matchesSearch(values, query) {
  return normalizeSearchText(values.filter(Boolean).join(' ')).includes(normalizeSearchText(query));
}

function pickSnippet(values, query, max = 150) {
  const needle = normalizeSearchText(query);
  const source = values
    .filter(Boolean)
    .map((value) => String(value))
    .find((text) => normalizeSearchText(text).includes(needle));
  return source ? searchSnippet(source, query, max) : '';
}

function searchTabs(active) {
  return `
    <div class="section-tabs">
      <a class="tab${active === 'search' ? ' is-active' : ''}" href="#/search">Поиск</a>
      <a class="tab${active === 'stats' ? ' is-active' : ''}" href="#/search?tab=stats">Статистика</a>
    </div>
  `;
}

function statCard(value, label) {
  return `
    <div class="stat">
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}

function cardSearchRow(card, query) {
  const personal = (card.interpretations ?? [])
    .map((item) => `${item.title ?? ''} ${item.body}`)
    .join(' ');
  const keywords = (card.keywords ?? []).join(' · ');
  const themes = (card.themes ?? []).join(' · ');

  const haystack = [
    card.name_ru,
    card.name_en,
    card.slug,
    keywords,
    themes,
    card.upright,
    card.reversed,
    card.notes,
    personal,
  ];

  if (!matchesSearch(haystack, query)) return null;

  const arcana = card.arcana === 'major' ? 'Старший аркан' : SUITS[card.suit] ?? 'Младший аркан';
  const snippet = pickSnippet([card.notes, personal, card.upright, card.reversed, keywords, themes], query)
    || journalExcerpt(card.upright ?? card.notes ?? '', 150);
  const shortKeywords = (card.keywords ?? []).slice(0, 5).join(' · ');

  return `
    <a class="search-row" href="#/cards/${card.id}">
      <img class="search-thumb" src="${card.image}" alt="" loading="lazy"
           onerror="this.onerror=null;this.src='cards/placeholder.svg'">
      <div class="search-row-main">
        <div class="search-row-title">
          ${escapeHtml(card.name_ru)}
          <span class="search-row-alt">(${escapeHtml(card.name_en)})</span>
        </div>
        ${snippet ? `<div class="search-snippet">${escapeHtml(snippet)}</div>` : ''}
        <div class="search-row-meta">${escapeHtml([arcana, shortKeywords].filter(Boolean).join(' · '))}</div>
      </div>
    </a>
  `;
}

function clientSearchRow(client, query, counts = { readings: 0, journal: 0 }) {
  const birth = client.birth_date ? `д.р. ${formatDate(client.birth_date)}` : '';
  const haystack = [client.name, client.contact, birth, client.notes];
  if (!matchesSearch(haystack, query)) return null;

  const snippet = pickSnippet([client.notes, client.contact, birth], query)
    || journalExcerpt(client.notes ?? client.contact ?? '', 150);
  const meta = [
    `${counts.readings} ${plural(counts.readings, ['расклад', 'расклада', 'раскладов'])}`,
    `${counts.journal} ${plural(counts.journal, ['запись', 'записи', 'записей'])}`,
    client.contact ? `контакт: ${client.contact}` : '',
  ].filter(Boolean).join(' · ');
  const initial = (client.name ?? '?').trim().charAt(0).toUpperCase() || '?';

  return `
    <a class="search-row" href="#/clients/${client.id}">
      <span class="search-avatar" aria-hidden="true">${escapeHtml(initial)}</span>
      <div class="search-row-main">
        <div class="search-row-title">${escapeHtml(client.name)}</div>
        ${snippet ? `<div class="search-snippet">${escapeHtml(snippet)}</div>` : ''}
        <div class="search-row-meta">${escapeHtml(meta)}</div>
      </div>
    </a>
  `;
}

function readingSearchRow(reading, query) {
  const statusLabel = READING_STATUS_LABELS[reading.status] ?? reading.status;
  const outcomeLabel = reading.outcome_rating
    ? OUTCOME_RATING_LABELS[reading.outcome_rating] ?? reading.outcome_rating
    : '';
  const haystack = [
    reading.title,
    reading.question,
    reading.client_name,
    reading.spread_name,
    reading.interpretation,
    reading.summary,
    reading.outcome_result,
    reading.outcome_comment,
    outcomeLabel,
    statusLabel,
    reading.reading_date,
    formatDate(reading.reading_date),
  ];
  if (!matchesSearch(haystack, query)) return null;

  const title = reading.title || reading.question || 'Без названия';
  const snippetSources = [];
  if (reading.question && reading.question !== title) snippetSources.push(reading.question);
  snippetSources.push(reading.interpretation, reading.summary, reading.outcome_result, reading.outcome_comment);
  const snippet = pickSnippet(snippetSources, query);

  const spreadCount = Number((reading.spread_name?.match(/^(\d+)\s+карт/) ?? [])[1]);
  const cardsLabel = reading.cards_count > 0
    ? `${reading.cards_count} ${plural(reading.cards_count, ['карта', 'карты', 'карт'])}`
    : '';
  const meta = [
    reading.client_name || 'для себя',
    reading.spread_name,
    spreadCount === reading.cards_count ? '' : cardsLabel,
    reading.outcome_result ? journalExcerpt(reading.outcome_result, 80) : '',
  ].filter(Boolean).join(' · ');

  return `
    <a class="search-row" href="#/readings/${reading.id}">
      <span class="search-date">${formatDate(reading.reading_date)}</span>
      <div class="search-row-main">
        <div class="search-row-title">${escapeHtml(title)}</div>
        ${snippet ? `<div class="search-snippet">${escapeHtml(snippet)}</div>` : ''}
        <div class="search-row-meta">${escapeHtml(meta)}</div>
      </div>
      <span class="row-badges">
        <span class="status-badge status-${reading.status}">${statusLabel}</span>
        ${reading.outcome_rating
          ? `<span class="outcome-badge ${outcomeRatingClass(reading.outcome_rating)}">${escapeHtml(outcomeLabel)}</span>`
          : ''}
      </span>
    </a>
  `;
}

function eventSearchRow(event, query) {
  const statusLabel = EVENT_STATUS_LABELS[event.status] ?? event.status;
  const haystack = [
    event.title,
    event.description,
    event.category,
    event.result,
    event.notes,
    event.reading_titles,
    event.client_names,
    statusLabel,
    event.planned_date,
    event.actual_date,
    event.planned_date ? formatDate(event.planned_date) : '',
    event.actual_date ? formatDate(event.actual_date) : '',
  ];
  if (!matchesSearch(haystack, query)) return null;

  const snippet = pickSnippet([event.result, event.description, event.notes], query)
    || journalExcerpt(event.description ?? event.result ?? '', 150);
  const meta = [
    eventDateLabel(event),
    event.category,
    event.readings_count ? eventReadingsLabel(event.readings_count) : '',
    event.client_names,
  ].filter(Boolean).join(' · ');
  const date = event.actual_date || event.planned_date;

  return `
    <a class="search-row" href="#/events/${event.id}">
      <span class="search-date">${date ? formatDate(date) : '—'}</span>
      <div class="search-row-main">
        <div class="search-row-title">${escapeHtml(event.title)}</div>
        ${snippet ? `<div class="search-snippet">${escapeHtml(snippet)}</div>` : ''}
        <div class="search-row-meta">${escapeHtml(meta)}</div>
      </div>
      <span class="status-badge ${eventStatusClass(event.status)}">${statusLabel}</span>
    </a>
  `;
}

function journalSearchRow(entry, query) {
  const title = journalTitle(entry);
  const haystack = [
    entry.title,
    entry.body,
    entry.client_name,
    entry.reading_title,
    entry.card_name_ru,
    entry.card_name_en,
    ...(entry.tags ?? []),
  ];
  if (!matchesSearch(haystack, query)) return null;

  const snippet = pickSnippet([entry.body, entry.title], query)
    || journalExcerpt(entry.body ?? '', 150);
  const meta = [
    formatLongDate(entry.entry_date),
    entry.client_name ? `клиент: ${entry.client_name}` : '',
    entry.card_name_ru
      ? `карта: ${entry.card_name_ru}${entry.card_name_en ? ` (${entry.card_name_en})` : ''}`
      : '',
    ...(entry.tags ?? []).map((tag) => `#${tag}`),
  ].filter(Boolean).join(' · ');

  return `
    <a class="search-row" href="#/journal/${entry.id}">
      <span class="search-date">${formatDate(entry.entry_date)}</span>
      <div class="search-row-main">
        <div class="search-row-title">${escapeHtml(title)}</div>
        ${snippet ? `<div class="search-snippet">${escapeHtml(snippet)}</div>` : ''}
        <div class="search-row-meta">${escapeHtml(meta)}</div>
      </div>
    </a>
  `;
}

function searchGroup(title, rows, noun) {
  if (rows.length === 0) return '';
  return `
    <section class="search-group">
      <div class="search-group-head">
        <h2>${title}</h2>
        <span class="muted">${rows.length} ${plural(rows.length, noun)}</span>
      </div>
      <div class="panel list-panel">${rows.join('')}</div>
    </section>
  `;
}

async function renderSearch(params = new URLSearchParams()) {
  const initialQuery = params.get('q') ?? '';

  titleEl.textContent = 'Поиск и статистика';
  subtitleEl.textContent = 'Поиск по всей мастерской';
  document.title = 'Поиск · Таро';

  viewEl.innerHTML = `
    ${searchTabs('search')}
    <div class="panel search-box">
      <input class="search search-global" id="global-search" type="search" autocomplete="off"
             placeholder="Карта, клиент, вопрос, событие, итог, запись или тег"
             value="${escapeHtml(initialQuery)}">
      <div class="search-box-foot">
        <div class="chips" id="search-scope">
          ${SEARCH_SCOPES.map((scope, index) => `
            <button type="button" class="chip${index === 0 ? ' is-active' : ''}" data-scope="${scope.id}">
              ${scope.label}
            </button>
          `).join('')}
        </div>
        <span class="hint">Ищет по названиям, заметкам, трактовкам, событиям, итогам, тегам и привязкам</span>
        <button class="btn btn-small reset-filters" type="button" id="search-reset" hidden>Сбросить фильтры</button>
      </div>
    </div>
    <div id="search-output"><p class="muted">Загрузка…</p></div>
  `;

  const input = document.getElementById('global-search');
  const output = document.getElementById('search-output');
  const scopeHost = document.getElementById('search-scope');
  const resetButton = document.getElementById('search-reset');

  let data;
  try {
    const [cards, clients, readings, journal, events] = await Promise.all([
      getCards(),
      api('/api/clients'),
      api('/api/readings'),
      api('/api/journal'),
      api('/api/events'),
    ]);
    data = { cards, clients, readings, journal, events };
  } catch (error) {
    output.innerHTML = `<div class="panel"><p>${escapeHtml(error.message)}</p></div>`;
    return;
  }

  const clientCounts = new Map();
  for (const client of data.clients) clientCounts.set(client.id, { readings: 0, journal: 0 });
  for (const reading of data.readings) {
    if (reading.client_id && clientCounts.has(reading.client_id)) {
      clientCounts.get(reading.client_id).readings += 1;
    }
  }
  for (const entry of data.journal) {
    if (entry.client_id && clientCounts.has(entry.client_id)) {
      clientCounts.get(entry.client_id).journal += 1;
    }
  }

  const state = { scope: 'all' };

  function setScope(scope) {
    state.scope = scope;
    for (const chip of scopeHost.querySelectorAll('[data-scope]')) {
      chip.classList.toggle('is-active', chip.dataset.scope === scope);
    }
  }

  function updateUrl() {
    const value = input.value.trim();
    const hash = value ? `#/search?q=${encodeURIComponent(value)}` : '#/search';
    history.replaceState(null, '', hash);
  }

  function paint() {
    resetButton.hidden = state.scope === 'all' && !input.value.trim();
    const query = input.value.trim();
    const normalized = normalizeSearchText(query);

    if (!normalized) {
      const scopeCards = [
        { id: 'cards', label: 'Карты', count: data.cards.length, noun: ['карта', 'карты', 'карт'] },
        { id: 'clients', label: 'Клиенты', count: data.clients.length, noun: ['клиент', 'клиента', 'клиентов'] },
        { id: 'readings', label: 'Расклады', count: data.readings.length, noun: ['расклад', 'расклада', 'раскладов'] },
        { id: 'events', label: 'События', count: data.events.length, noun: ['событие', 'события', 'событий'] },
        { id: 'journal', label: 'Дневник', count: data.journal.length, noun: ['запись', 'записи', 'записей'] },
      ];

      output.innerHTML = `
        <div class="panel search-intro">
          <h2>Что можно найти</h2>
          <p class="muted">Названия и значения карт, имена и заметки клиентов, вопросы и трактовки раскладов, события и их результаты, итоговые оценки, записи дневника и теги.</p>
          <div class="search-scope-cards">
            ${scopeCards.map((item) => `
              <button type="button" class="scope-card" data-scope="${item.id}">
                <strong>${item.count}</strong>
                <span>${plural(item.count, item.noun)}</span>
              </button>
            `).join('')}
          </div>
          <p class="hint">Например: «деньги», «Надежда», «собеседование», «совпало».</p>
        </div>
      `;
      return;
    }

    const cards = state.scope === 'all' || state.scope === 'cards'
      ? data.cards.map((card) => cardSearchRow(card, normalized)).filter(Boolean)
      : [];
    const clients = state.scope === 'all' || state.scope === 'clients'
      ? data.clients.map((client) => clientSearchRow(client, normalized, clientCounts.get(client.id))).filter(Boolean)
      : [];
    const readings = state.scope === 'all' || state.scope === 'readings'
      ? data.readings.map((reading) => readingSearchRow(reading, normalized)).filter(Boolean)
      : [];
    const events = state.scope === 'all' || state.scope === 'events'
      ? data.events.map((event) => eventSearchRow(event, normalized)).filter(Boolean)
      : [];
    const journal = state.scope === 'all' || state.scope === 'journal'
      ? data.journal.map((entry) => journalSearchRow(entry, normalized)).filter(Boolean)
      : [];

    const total = cards.length + clients.length + readings.length + events.length + journal.length;

    if (total === 0) {
      output.innerHTML = `
        <div class="panel">
          <div class="empty">
            По запросу «${escapeHtml(query)}» ничего не найдено.<br>
            Попробуйте другое слово или выберите другой раздел.
          </div>
        </div>
      `;
      return;
    }

    output.innerHTML = `
      <p class="result-count muted">${total} ${plural(total, ['совпадение', 'совпадения', 'совпадений'])} по запросу «${escapeHtml(query)}»</p>
      ${searchGroup('Карты', cards, ['карта', 'карты', 'карт'])}
      ${searchGroup('Клиенты', clients, ['клиент', 'клиента', 'клиентов'])}
      ${searchGroup('Расклады', readings, ['расклад', 'расклада', 'раскладов'])}
      ${searchGroup('События', events, ['событие', 'события', 'событий'])}
      ${searchGroup('Дневник', journal, ['запись', 'записи', 'записей'])}
    `;
  }

  scopeHost.addEventListener('click', (event) => {
    const button = event.target.closest('[data-scope]');
    if (!button) return;
    setScope(button.dataset.scope);
    paint();
  });

  output.addEventListener('click', (event) => {
    const card = event.target.closest('.scope-card');
    if (!card) return;
    setScope(card.dataset.scope);
    input.focus();
  });

  input.addEventListener('input', () => {
    updateUrl();
    paint();
  });

  resetButton.addEventListener('click', () => {
    state.scope = 'all';
    input.value = '';
    setScope('all');
    updateUrl();
    input.focus();
    paint();
  });

  paint();
}

async function renderStatistics() {
  titleEl.textContent = 'Поиск и статистика';
  subtitleEl.textContent = 'Закономерности практики';
  document.title = 'Статистика · Таро';

  viewEl.innerHTML = `${searchTabs('stats')}<p class="muted">Считаем…</p>`;

  let stats;
  try {
    stats = await api('/api/statistics');
  } catch (error) {
    viewEl.innerHTML = `${searchTabs('stats')}<div class="panel"><p>${escapeHtml(error.message)}</p></div>`;
    return;
  }

  const totals = stats.totals;
  const maxCard = stats.cards[0]?.total ?? 1;
  const maxTheme = stats.themes[0]?.count ?? 1;
  const maxTag = stats.journalTags[0]?.count ?? 1;

  const cardRows = stats.cards.map((card) => {
    const width = Math.max(4, Math.round((card.total / maxCard) * 100));
    const meta = [
      card.upright ? `${card.upright} прям.` : '',
      card.reversed ? `${card.reversed} перев.` : '',
    ].filter(Boolean).join(' · ');

    return `
      <a class="freq-row" href="#/cards/${card.id}">
        <img class="freq-thumb" src="${card.image}" alt="" loading="lazy"
             onerror="this.onerror=null;this.src='cards/placeholder.svg'">
        <div class="freq-main">
          <div class="freq-top">
            <span class="freq-name">
              ${escapeHtml(card.name_ru)}
              <span class="freq-name-en">(${escapeHtml(card.name_en)})</span>
            </span>
            <span class="freq-count">${card.total}</span>
          </div>
          <div class="freq-bar"><span style="width:${width}%"></span></div>
          <div class="freq-meta">${escapeHtml(meta || '—')}</div>
        </div>
      </a>
    `;
  }).join('');

  const clientRows = stats.clients.map((client) => {
    const meta = [
      `${client.readings} ${plural(client.readings, ['расклад', 'расклада', 'раскладов'])}`,
      `${client.cards} ${plural(client.cards, ['карта', 'карты', 'карт'])}`,
      `${client.journal} ${plural(client.journal, ['запись', 'записи', 'записей'])}`,
    ].join(' · ');
    const last = client.last_reading ? `последний ${formatDate(client.last_reading)}` : 'раскладов нет';

    return `
      <a class="stat-row" href="#/clients/${client.id}">
        <div class="stat-row-main">
          <div class="list-title">${escapeHtml(client.name)}</div>
          <div class="list-sub">${meta}</div>
        </div>
        <div class="stat-row-side">${last}</div>
      </a>
    `;
  }).join('');

  const themeRows = stats.themes.map((item) => {
    const width = Math.max(4, Math.round((item.count / maxTheme) * 100));
    return `
      <div class="theme-stat">
        <span class="theme">${escapeHtml(item.theme)}</span>
        <span class="theme-bar"><span style="width:${width}%"></span></span>
        <span class="theme-count">${item.count}</span>
      </div>
    `;
  }).join('');

  const tagRows = stats.journalTags.map((item) => {
    const width = Math.max(4, Math.round((item.count / maxTag) * 100));
    return `
      <a class="theme-stat theme-stat-link" href="#/journal?tag=${encodeURIComponent(item.tag)}">
        <span class="theme">#${escapeHtml(item.tag)}</span>
        <span class="theme-bar"><span style="width:${width}%"></span></span>
        <span class="theme-count">${item.count}</span>
      </a>
    `;
  }).join('');

  const unusedCards = totals.cards - stats.cards.length;

  const outcomeStats = stats.outcomes ?? {
    totalOutcomes: 0,
    sampleSize: 0,
    totalReadings: totals.readings,
    doneReadings: totals.done,
    doneWithOutcome: 0,
    distribution: [],
  };
  const eventStats = stats.events ?? {
    total: totals.events ?? 0,
    withResult: 0,
    byStatus: {},
    byCategory: [],
  };

  const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
  const outcomeShare = percent(outcomeStats.sampleSize, outcomeStats.totalReadings);
  const doneOutcomeShare = percent(outcomeStats.doneWithOutcome, outcomeStats.doneReadings);
  const maxOutcome = Math.max(1, ...outcomeStats.distribution.map((item) => item.count));
  const outcomeRows = outcomeStats.distribution
    .filter((item) => item.count > 0)
    .map((item) => {
      const width = Math.max(4, Math.round((item.count / maxOutcome) * 100));
      return `
        <div class="theme-stat">
          <span class="outcome-badge ${outcomeRatingClass(item.rating)}">${OUTCOME_RATING_LABELS[item.rating] ?? item.rating}</span>
          <span class="theme-bar"><span style="width:${width}%"></span></span>
          <span class="theme-count">${item.count}</span>
        </div>
      `;
    }).join('');

  const maxCategory = Math.max(1, ...eventStats.byCategory.map((item) => item.count));
  const categoryRows = eventStats.byCategory.map((item) => {
    const width = Math.max(4, Math.round((item.count / maxCategory) * 100));
    return `
      <div class="theme-stat">
        <span class="theme">${escapeHtml(item.category)}</span>
        <span class="theme-bar"><span style="width:${width}%"></span></span>
        <span class="theme-count">${item.count}</span>
      </div>
    `;
  }).join('');

  const eventStatusBadges = EVENT_STATUS_FILTERS
    .filter((status) => status.id !== 'all')
    .map((status) => `
      <span class="status-badge ${eventStatusClass(status.id)}">${EVENT_STATUS_LABELS[status.id]} · ${eventStats.byStatus[status.id] ?? 0}</span>
    `).join('');

  viewEl.innerHTML = `
    ${searchTabs('stats')}

    <div class="stats">
      ${statCard(totals.cards, 'Карт в базе')}
      ${statCard(totals.clients, 'Клиентов')}
      ${statCard(totals.readings, 'Раскладов')}
      ${statCard(totals.journal, 'Записей дневника')}
      ${statCard(eventStats.total, 'Событий')}
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>Расклады по статусам</h2>
        <span class="muted">${totals.readings} ${plural(totals.readings, ['расклад', 'расклада', 'раскладов'])}</span>
      </div>
      <div class="status-summary">
        <span class="status-badge status-draft">черновики · ${totals.draft}</span>
        <span class="status-badge status-done">завершённые · ${totals.done}</span>
        <span class="status-badge status-archived">архив · ${totals.archived}</span>
      </div>
      <p class="hint">Расклады для себя: ${totals.selfReadings}.</p>
    </div>

    <div class="panel">
      <div class="panel-head">
        <h2>Итоги и оценки</h2>
        <span class="muted">${outcomeStats.totalOutcomes} ${plural(outcomeStats.totalOutcomes, ['оценка', 'оценки', 'оценок'])}</span>
      </div>
      <div class="outcome-shares">
        <div class="outcome-share">
          <span class="outcome-share-value">${outcomeShare}%</span>
          <span class="outcome-share-label">раскладов с итогом</span>
        </div>
        <div class="outcome-share">
          <span class="outcome-share-value">${doneOutcomeShare}%</span>
          <span class="outcome-share-label">завершённых с оценкой</span>
        </div>
        <div class="outcome-share">
          <span class="outcome-share-value">${outcomeStats.sampleSize}</span>
          <span class="outcome-share-label">в выборке</span>
        </div>
      </div>
      ${outcomeRows
        ? `<div class="theme-stats">${outcomeRows}</div>`
        : '<div class="empty">Пока нет итоговых оценок.<br>Оцените завершённый расклад в его карточке.</div>'}
      <p class="hint">Оценка есть у ${outcomeStats.doneWithOutcome} из ${outcomeStats.doneReadings} завершённых раскладов. Считается последняя оценка каждого расклада.</p>
    </div>

    <div class="stats-columns">
      <div class="panel">
        <div class="panel-head">
          <h2>События по статусам</h2>
          <a class="panel-link" href="#/events">все события →</a>
        </div>
        ${eventStats.total
          ? `<div class="status-summary">${eventStatusBadges}</div>
             <p class="hint">С фактическим результатом: ${eventStats.withResult} из ${eventStats.total}.</p>`
          : '<div class="empty">Событий пока нет. <a href="#/events/new">Создать первое</a></div>'}
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>События по категориям</h2>
          <span class="muted">${eventStats.byCategory.length}</span>
        </div>
        ${categoryRows
          ? `<div class="theme-stats">${categoryRows}</div>`
          : '<div class="empty">Пока нет событий с категориями.</div>'}
      </div>
    </div>

    <div class="stats-columns">
      <div class="panel">
        <div class="panel-head">
          <h2>Частота карт</h2>
          <span class="muted">${stats.cards.length} из ${totals.cards}</span>
        </div>
        ${stats.cards.length
          ? `<div class="freq-list">${cardRows}</div>`
          : '<div class="empty">Пока ни одна карта не выпадала.<br>Добавьте карты в расклад.</div>'}
        ${unusedCards > 0 && stats.cards.length > 0
          ? `<p class="hint">Ещё ${unusedCards} ${plural(unusedCards, ['карта', 'карты', 'карт'])} пока не выпадали.</p>`
          : ''}
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>Клиенты</h2>
          <a class="panel-link" href="#/clients">все клиенты →</a>
        </div>
        ${stats.clients.length
          ? `<div class="stat-list">${clientRows}</div>`
          : '<div class="empty">Пока нет клиентов. <a href="#/clients/new">Добавить первого</a></div>'}
      </div>
    </div>

    <div class="stats-columns">
      <div class="panel">
        <div class="panel-head">
          <h2>Темы карт</h2>
          <span class="muted">по выпавшим картам</span>
        </div>
        ${stats.themes.length
          ? `<div class="theme-stats">${themeRows}</div>`
          : '<div class="empty">Пока нет данных — темы считаются по картам из раскладов.</div>'}
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>Теги дневника</h2>
          <a class="panel-link" href="#/journal">весь дневник →</a>
        </div>
        ${stats.journalTags.length
          ? `<div class="theme-stats">${tagRows}</div>`
          : '<div class="empty">Пока нет тегов. <a href="#/journal/new">Добавить запись</a></div>'}
      </div>
    </div>
  `;
}

/* ---------- Заглушки ---------- */

function renderStub(section) {
  const items = (section.planned ?? []).map((text) => `<li>${text}</li>`).join('');
  viewEl.innerHTML = `
    <div class="panel stub">
      <span class="stub-badge">раздел в разработке</span>
      <h2>${section.title}</h2>
      <p class="muted">Появится на одном из следующих шагов. Вот что здесь будет:</p>
      <ul class="stub-list">${items}</ul>
    </div>
    <p class="hint">А пока можно вернуться в <a href="#/overview">Обзор</a>.</p>
  `;
}

/* ---------- Обратная связь ---------- */

function openFeedbackDialog() {
  const dialog = document.getElementById('feedback-dialog');
  const form = document.getElementById('feedback-form');
  if (!dialog || !form) return;

  form.reset();
  form.elements.topic.value = 'bug';
  syncCustomSelect(form.elements.topic);

  const errorEl = document.getElementById('feedback-error');
  const okEl = document.getElementById('feedback-ok');
  const submit = form.querySelector('button[type="submit"]');
  const pageHint = document.getElementById('feedback-page-hint');

  if (errorEl) errorEl.textContent = '';
  if (okEl) okEl.hidden = true;
  if (submit) submit.disabled = false;
  if (pageHint) {
    pageHint.textContent = `Страница: ${location.hash || '#/'} · ${document.title}`;
  }

  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }

  setTimeout(() => form.elements.message.focus(), 60);
}

function setupFeedback() {
  const openButton = document.getElementById('developer-mail');
  const dialog = document.getElementById('feedback-dialog');
  const form = document.getElementById('feedback-form');
  if (!openButton || !dialog || !form) return;

  enhanceSelects(form);

  const closeDialog = () => {
    if (dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  };

  openButton.addEventListener('click', openFeedbackDialog);
  document.getElementById('feedback-close')?.addEventListener('click', closeDialog);
  document.getElementById('feedback-cancel')?.addEventListener('click', closeDialog);
  document.getElementById('feedback-view-all')?.addEventListener('click', () => {
    closeDialog();
    location.hash = '#/feedback';
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const errorEl = document.getElementById('feedback-error');
    const okEl = document.getElementById('feedback-ok');
    const submit = form.querySelector('button[type="submit"]');
    const message = form.elements.message.value.trim();

    if (errorEl) errorEl.textContent = '';
    if (okEl) okEl.hidden = true;

    if (!message) {
      if (errorEl) errorEl.textContent = 'Опишите, что случилось или что хочется улучшить.';
      form.elements.message.focus();
      return;
    }

    if (submit) submit.disabled = true;

    try {
      await api('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          topic: form.elements.topic.value,
          message,
          page: location.hash || '#/',
          page_title: document.title,
          user_agent: navigator.userAgent,
        }),
      });

      if (okEl) okEl.hidden = false;
      form.reset();
      form.elements.topic.value = 'bug';
      syncCustomSelect(form.elements.topic);
      if (submit) submit.disabled = false;

      setTimeout(closeDialog, 900);
    } catch (error) {
      if (errorEl) errorEl.textContent = error.message;
      if (submit) submit.disabled = false;
    }
  });
}

async function renderFeedbackList() {
  viewEl.innerHTML = '<p class="muted">Загрузка сообщений…</p>';

  let messages = [];
  try {
    messages = await api('/api/feedback');
  } catch (error) {
    viewEl.innerHTML = `
      <div class="panel">
        <p>${escapeHtml(error.message)}</p>
        <p class="hint"><a href="#/">← на главную</a></p>
      </div>
    `;
    return;
  }

  const rows = messages.map((item) => `
    <div class="feedback-row">
      <div class="feedback-row-head">
        <span class="feedback-topic feedback-topic-${item.topic}">${FEEDBACK_TOPIC_LABELS[item.topic] ?? item.topic}</span>
        <span class="muted">${formatDateTime(item.created_at)}</span>
      </div>
      <div class="feedback-message">${escapeHtml(item.message)}</div>
      <div class="feedback-meta muted">
        ${item.page ? `Страница: <code>${escapeHtml(item.page)}</code>` : ''}
        ${item.page_title ? ` · ${escapeHtml(item.page_title)}` : ''}
      </div>
    </div>
  `).join('');

  viewEl.innerHTML = `
    <a class="back-link" href="#/">← на главную</a>
    <div class="cards-toolbar">
      <p class="muted">Всего сообщений: ${messages.length}. Новые сверху.</p>
      <button class="btn btn-primary" type="button" id="feedback-new">Написать сообщение</button>
    </div>
    ${messages.length > 0
      ? `<div class="panel feedback-list">${rows}</div>`
      : '<div class="empty">Пока сообщений нет. Нажмите «Написать сообщение», чтобы отправить первое.</div>'}
  `;

  document.getElementById('feedback-new')?.addEventListener('click', openFeedbackDialog);
}

/* ---------- Маршрутизация ---------- */

function route() {
  const hash = location.hash.replace(/^#\/?/, '') || 'overview';
  const [raw, queryString = ''] = hash.split('?');
  const params = new URLSearchParams(queryString);
  const [id, action, sub] = raw.split('/');
  const section = SECTIONS.find((item) => item.id === id)
    ?? (id === 'feedback'
      ? { id: 'feedback', title: 'Сообщения разработчику', subtitle: 'Баги, неточности и предложения' }
      : SECTIONS[0]);

  titleEl.textContent = section.title;
  subtitleEl.textContent = section.subtitle;
  document.title = `${section.title} · Таро`;
  renderNav(section.id);

  if (id === 'feedback') {
    renderFeedbackList();
  } else if (section.id === 'overview') {
    renderOverview();
  } else if (section.id === 'cards' && action && sub === 'edit') {
    renderCardEdit(action, {
      spread: params.get('spread'),
      orientation: params.get('orientation'),
    });
  } else if (section.id === 'cards' && action) {
    renderCardDetail(action);
  } else if (section.id === 'cards') {
    renderCards(params);
  } else if (section.id === 'events' && action === 'new') {
    renderEventForm(null, {
      readingId: params.get('reading'),
      date: params.get('date'),
    });
  } else if (section.id === 'events' && action && sub === 'edit') {
    renderEventForm(action);
  } else if (section.id === 'events' && action) {
    renderEventView(action);
  } else if (section.id === 'events') {
    renderEvents();
  } else if (section.id === 'clients' && action === 'new') {
    renderClientForm(null);
  } else if (section.id === 'clients' && action && sub === 'edit') {
    renderClientForm(action);
  } else if (section.id === 'clients' && action) {
    renderClientDetail(action);
  } else if (section.id === 'clients') {
    renderClients();
  } else if (section.id === 'readings' && action === 'new') {
    renderReadingForm(null, {
      clientId: params.get('client'),
      eventId: params.get('event'),
    });
  } else if (section.id === 'readings' && action && sub === 'edit') {
    renderReadingForm(action);
  } else if (section.id === 'readings' && action) {
    renderReadingView(action);
  } else if (section.id === 'readings') {
    renderReadings();
  } else if (section.id === 'journal' && action === 'new') {
    renderJournalForm(null, {
      client: params.get('client'),
      reading: params.get('reading'),
      card: params.get('card'),
      date: params.get('date'),
    });
  } else if (section.id === 'journal' && action && sub === 'edit') {
    renderJournalForm(action);
  } else if (section.id === 'journal' && action) {
    renderJournalView(action);
  } else if (section.id === 'journal') {
    renderJournal(params);
  } else if (section.id === 'search') {
    if (params.get('tab') === 'stats') renderStatistics();
    else renderSearch(params);
  } else {
    renderStub(section);
  }

  viewEl.classList.remove('is-entering');
  void viewEl.offsetWidth;
  viewEl.classList.add('is-entering');
}

async function checkServer() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  try {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const health = await response.json();
    dot.classList.add('is-ok');
    text.textContent = `сервер работает · схема v${health.schemaVersion}`;
  } catch {
    dot.classList.add('is-error');
    text.textContent = 'сервер не отвечает';
  }
}

setupFeedback();
setupBackup();

window.addEventListener('hashchange', route);
route();
checkServer();
