import * as store from './store.js';
import {
  escapeHtml as e,
  button as btn,
  icon,
  person,
  pill,
  empty,
  num,
  money,
  fullDate,
} from './adminView.js';

export const allMasters = (state) => store.getAllMasters(state);
export const allServices = (state) => store.getAllServices(state);
const option = (value, label, selected = '') =>
  `<option value="${e(value)}" ${value === selected ? 'selected' : ''}>${e(label)}</option>`;
const toggle = (action, active, first, second) =>
  `<div class="ad-tabs" role="group" aria-label="Статус"><button type="button" data-ad-action="${action}" data-id="active" aria-pressed="${active}" class="${active ? 'selected' : ''}">${e(first)}</button><button type="button" data-ad-action="${action}" data-id="archive" aria-pressed="${!active}" class="${active ? '' : 'selected'}">${e(second)}</button></div>`;

export function teamPage(state, ui) {
  const active = ui.teamTab !== 'archive';
  const roster = active ? state.masters : state.archivedMasters || [];
  const rows = roster
    .map((master) => {
      const visits = state.visits.filter((v) => v.masterId === master.id),
        open = visits.filter((v) => v.status === 'booked').length,
        done = visits.filter((v) => v.status === 'done').length;
      const edit = btn('master', 'Профиль', 'edit', 'ad-quiet', master.id);
      const manage = active
        ? btn('archive-master', 'Уволить мастера', '', 'ad-danger-link', master.id)
        : btn('restore-master', 'Вернуть в команду', 'plus', 'ad-quiet', master.id);
      return `<article class="ad-team-card"><header>${person(master.name, master.role)}${pill(active ? 'В команде' : 'В архиве', active ? 'green' : 'neutral')}</header><div class="ad-team-numbers"><span><b>${open}</b>Запланировано</span><span><b>${done}</b>Завершено</span></div><footer>${active ? edit : ''}${manage}</footer></article>`;
    })
    .join('');
  return (
    `<div class="ad-toolbar">${toggle('team-tab', active, 'В команде · ' + state.masters.length, 'Архив · ' + (state.archivedMasters || []).length)}${ui.page === 'content' ? btn('new-master', 'Принять мастера', 'plus', 'ad-btn ad-primary') : ''}</div>` +
    (rows
      ? `<div class="ad-team-grid">${rows}</div>`
      : `<section class="ad-panel">${empty(active ? 'Добавьте первого мастера, чтобы открыть запись в салон.' : 'Здесь появятся мастера, выведенные из команды.', 'team')}</section>`)
  );
}
export function serviceManagement(state, ui) {
  const active = ui.servicesTab !== 'archive',
    catalog = active ? state.services : state.archivedServices || [];
  const rows = catalog
    .map((service) => {
      const bookings = state.visits.filter(
        (v) => v.serviceId === service.id && v.status === 'booked',
      ).length;
      return `<article class="ad-service-manage"><div><strong>${e(service.title)}</strong><small>${service.duration} мин · ${money(service.price)} в демо · ${num(bookings, 'запись', 'записи', 'записей')}</small></div><div>${active ? btn('service', 'Изменить', 'edit', 'ad-quiet', service.id) + btn('archive-service', 'Снять с записи', '', 'ad-danger-link', service.id) : btn('restore-service', 'Вернуть в каталог', 'plus', 'ad-quiet', service.id)}</div></article>`;
    })
    .join('');
  return `<div class="ad-toolbar ad-team-subnav">${toggle('services-tab', active, 'Доступны · ' + state.services.length, 'Архив · ' + (state.archivedServices || []).length)}</div><section class="ad-panel">${rows || empty(active ? 'Добавьте услугу, чтобы гости могли выбрать её при записи.' : 'Архив услуг пуст.', 'scissors')}</section>`;
}

export function masterArchiveBody(state, id, plan) {
  const master = state.masters.find((m) => m.id === id),
    other = state.masters.filter((m) => m.id !== id),
    visits = store.getMasterArchiveVisits(id);
  if (!master) return '';
  const lookup = allServices(state);
  const masterOptions = (selected) =>
    option('', 'Выберите мастера', selected) + other.map((m) => option(m.id, m.name, selected)).join('');
  const rows = visits
    .map((visit, index) => {
      const proposed = plan[visit.id] || {},
        inPast = visit.date < store.today(),
        stay = visit.stayId && state.stays.find((s) => s.id === visit.stayId);
      const expected =
        proposed.expected ||
        Object.fromEntries(
          ['masterId', 'date', 'time', 'serviceId', 'duration'].map((k) => [k, visit[k]]),
        );
      const name = lookup.find((x) => x.id === visit.serviceId)?.title || 'Услуга';
      const min = stay && stay.checkIn > store.today() ? stay.checkIn : store.today(),
        max = stay?.checkOut || '';
      return `<details class="ad-transfer-row" data-visit-id="${e(visit.id)}" data-expected="${e(JSON.stringify(expected))}" ${visits.length <= 3 || index === 0 ? 'open' : ''}><summary><span><strong>${e(visit.name)}</strong><small>${fullDate(visit.date)} · ${e(visit.time)} · ${e(name)}</small></span><b data-plan-result>Требует решения</b></summary><div class="ad-transfer-body">${inPast ? `<p>Уточните результат прошедшего визита.</p>` : `<label>Новый мастер<select data-plan-master>${masterOptions(proposed.masterId || '')}</select></label><label>Дата<input type="date" data-plan-date value="${e(proposed.date || visit.date)}" min="${e(min)}" ${max ? 'max="' + e(max) + '"' : ''}></label><label>Время<select data-plan-time data-initial="${e(proposed.time || '')}"></select></label><small data-plan-hint></small>`}${btn('resolve-archive-visit', 'Открыть запись', 'calendar', 'ad-link', visit.id)}</div></details>`;
    })
    .join('');
  const bulk =
    visits.some((v) => v.date >= store.today()) && other.length
      ? `<div class="ad-bulk-plan"><label>Замена для свободных окон<select data-plan-bulk>${masterOptions('')}</select></label>${btn('match-archive-times', 'Подобрать в то же время', 'calendar', 'ad-quiet')}</div>`
      : '';
  let intro = visits.length
    ? `До увольнения нужно обработать ${num(visits.length, 'запись', 'записи', 'записей')}. Для будущих визитов выберите замену. У прошедших укажите результат в карточке.`
    : 'Запланированных визитов нет. Мастер перейдёт в архив, его история сохранится.';
  if (!other.length && !visits.length)
    intro += ' Новая запись откроется, когда в команде появится мастер.';
  return `<div class="ad-wide ad-archive-body"><p>${e(intro)}</p>${visits.length && !other.length ? '<p>В команде нет другого мастера. Чтобы сохранить будущие визиты, сначала примите сотрудника или верните его из архива.</p>' : ''}${bulk}${rows}${visits.length ? '<p data-plan-total></p>' : ''}</div>`;
}
export function readArchivePlan(form) {
  const plan = {};
  for (const row of form.querySelectorAll('[data-visit-id]')) {
    plan[row.dataset.visitId] = {
      expected: JSON.parse(row.dataset.expected),
      masterId: row.querySelector('[data-plan-master]')?.value || '',
      date: row.querySelector('[data-plan-date]')?.value || '',
      time: row.querySelector('[data-plan-time]')?.value || '',
    };
  }
  return plan;
}
function overlaps(a, alen, b, blen) {
  return a < b + blen && b < a + alen;
}
function availableFor(visit, masterId, date, plan, visits) {
  if (!masterId || !date) return [];
  return store
    .slots({ date, masterId, serviceId: visit.serviceId, excludeId: visit.id })
    .filter((slot) => {
      const start = store.minutes(slot.time);
      return !visits.some((other) => {
        const move = plan[other.id];
        return (
          other.id !== visit.id &&
          move?.time &&
          move.masterId === masterId &&
          move.date === date &&
          overlaps(start, visit.duration, store.minutes(move.time), other.duration)
        );
      });
    });
}
export function refreshArchivePlan(form, state, bulk = false) {
  const visits = store.getMasterArchiveVisits(form.dataset.id),
    plan = readArchivePlan(form);
  const replacement = form.querySelector('[data-plan-bulk]')?.value;
  let resolved = 0;
  for (const row of form.querySelectorAll('[data-visit-id]')) {
    const visit = visits.find((v) => v.id === row.dataset.visitId),
      master = row.querySelector('[data-plan-master]'),
      result = row.querySelector('[data-plan-result]');
    if (!visit) {
      result.textContent = 'Уже обработано';
      continue;
    }
    if (!master) {
      result.textContent = 'Уточнить итог';
      continue;
    }
    const when = row.querySelector('[data-plan-date]'),
      time = row.querySelector('[data-plan-time]'),
      hint = row.querySelector('[data-plan-hint]');
    const draft = plan[visit.id],
      selected = time.value || time.dataset.initial || '';
    const sameTimeAvailable =
      bulk &&
      replacement &&
      !selected &&
      availableFor(visit, replacement, visit.date, plan, visits).some((t) => t.time === visit.time);
    if (sameTimeAvailable) {
      master.value = replacement;
      when.value = visit.date;
    }
    const times =
      when.value && when.validity.valid
        ? availableFor(visit, master.value, when.value, plan, visits)
        : [];
    const desired = sameTimeAvailable ? visit.time : selected;
    time.innerHTML =
      option('', 'Выберите время', '') +
      times.map((slot) => option(slot.time, slot.time, desired)).join('');
    time.disabled = !times.length;
    time.dataset.initial = '';
    Object.assign(draft, { masterId: master.value, date: when.value, time: time.value });
    const ready = Boolean(time.value);
    row.classList.toggle('ad-plan-ready', ready);
    result.textContent = ready ? 'Подобрано' : 'Требует решения';
    if (ready) resolved++;
    hint.textContent = !master.value
      ? ''
      : !when.value || !when.validity.valid
        ? 'Укажите доступную дату в пределах проживания.'
        : !times.length
          ? 'Свободных окон нет. Измените мастера или дату.'
          : when.value === visit.date && !times.some((t) => t.time === visit.time)
            ? 'Исходное время недоступно. Выберите другое окно.'
            : '';
  }
  const total = form.querySelector('[data-plan-total]');
  if (total) total.textContent = `Выбрана замена для ${resolved} из ${visits.length} записей.`;
  form.querySelector('[type="submit"]').disabled = resolved !== visits.length;
  return plan;
}
export function archiveSignature(state, id) {
  return JSON.stringify([
    state.masters.map((m) => [m.id, m.name]),
    state.visits
      .filter((v) => v.status === 'booked')
      .map((v) => [v.id, v.masterId, v.serviceId, v.date, v.time, v.duration, v.stayId]),
    state.blocks,
    state.shifts,
    state.stays
      .filter((stay) =>
        state.visits.some((v) => v.stayId === stay.id && v.masterId === id && v.status === 'booked'),
      )
      .map((s) => [s.id, s.checkIn, s.checkOut, s.status]),
  ]);
}
export function currentDraft(form, state) {
  const stored = readArchivePlan(form),
    fresh = {};
  for (const v of state.visits.filter((v) => v.masterId === form.dataset.id && v.status === 'booked')) {
    const candidate = stored[v.id];
    if (
      candidate &&
      Object.keys(candidate.expected).every((k) => v[k] === candidate.expected[k]) &&
      (!candidate.masterId || state.masters.some((m) => m.id === candidate.masterId))
    )
      fresh[v.id] = candidate;
  }
  return fresh;
}
