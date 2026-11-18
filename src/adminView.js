export const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
const glyphs = {
  today:
    '<path d="M3 12a9 9 0 1 1 18 0v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="m12 12 4-4M7 16h10"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-14 4h3m4 0h3"/>',
  guests:
    '<circle cx="10" cy="8" r="3.3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m.5-15a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3.5 5"/>',
  rooms: '<path d="M4 21h16M6 21V4l11-1v18M17 5h2v16m-6-8v1"/>',
  scissors:
    '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8 8 12 12M8 16 20 4"/>',
  chart: '<path d="M4 3v17h17M8 16v-4m5 4V7m5 9v-6"/>',
  content: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18m-14 4h4m-4 3h8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  outward: '<path d="M6 18 18 6M7 6h11v11"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  in: '<path d="M11 4h8v16h-8m-8-8h11m-4-4 4 4-4 4"/>',
  out: '<path d="M12 4H4v16h8m-3-8h12m-4-4 4 4-4 4"/>',
  key: '<circle cx="8" cy="8" r="4"/><path d="m11 11 9 9m-2-2 3-3m-6 0 2-2"/>',
  bed: '<path d="M3 18V7m18 11v-7a2 2 0 0 0-2-2H9v6M3 15h18M3 18v2m18-2v2"/><circle cx="6.5" cy="10.5" r="2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  clean:
    '<path d="M8 3c0 4-1 5-5 6 4 1 5 2 5 6 1-4 2-5 6-6-4-1-5-2-6-6Zm10 9c0 3-1 4-4 5 3 0 4 1 4 4 1-3 2-4 4-4-2-1-3-2-4-5Z"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  reset: '<path d="M3 11a9 9 0 1 1 3 8M3 5v6h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  star: '<path d="m12 3 2.7 5.5 6 .8-4.3 4.2 1 5.9-5.4-2.8-5.4 2.8 1-5.9-4.3-4.2 6-.8z"/>',
  edit: '<path d="m14 5 5 5M4 20l4.5-1 12-12-3.5-3.5-12 12z"/>',
  phone: '<path d="m6 3 3 5-2 2a14 14 0 0 0 7 7l2-2 5 3-1.5 3C10 21 3 14 3 5z"/>',
  tag: '<path d="m3 4 8-1 10 10-8 8L3 11Z"/><circle cx="7.5" cy="7.5" r="1"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  team: '<path d="M4 20v-2a5 5 0 0 1 10 0v2m3-7a5 5 0 0 1 4 5v2"/><circle cx="9" cy="7" r="3"/><path d="M16 4a3 3 0 0 1 0 6"/>',
  list: '<path d="M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V8a4 4 0 0 1 8 0v2"/>',
  inbox: '<path d="m3 6 3-3h12l3 3v13H3zM3 12h5l2 3h4l2-3h5"/>',
  bell: '<path d="M3 17h18M5 14a7 7 0 0 1 14 0m-7-9v2m-2-3h4"/>',
};
export const icon = (name, size = 18) =>
  '<svg aria-hidden="true" width="' +
  size +
  '" height="' +
  size +
  '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">' +
  (glyphs[name] || '') +
  '</svg>';
export const emark =
  '<svg viewBox="0 0 44 44" width="38" height="38" aria-hidden="true" fill="none"><path d="M4 37h36M8 36V19h6V8l8-4 8 4v11h6v17M14 36V12m16 24V12M18 35V13m4 22V11m4 24V13M10.8 33v-9m22.4 9v-9" stroke="currentColor" stroke-width="1.7" stroke-linecap="square"/></svg>';
export const navItems = [
  ['today', 'today', 'Сегодня'],
  ['calendar', 'calendar', 'Календарь броней'],
  ['guests', 'guests', 'Гости'],
  ['rooms', 'rooms', 'Номерной фонд'],
  ['salon', 'scissors', 'Парикмахерская'],
  ['team', 'team', 'Команда салона'],
  ['inquiries', 'inbox', 'Обращения'],
  ['crm', 'tag', 'CRM · Клиенты'],
  ['reports', 'chart', 'Отчёты'],
  ['content', 'content', 'Редактор сайта'],
];
export const titleOf = (id) => navItems.find((item) => item[0] === id)?.[2] || 'Сегодня';
export const shortDate = (date, opts = { day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat('ru-RU', opts).format(new Date(date + 'T12:00:00'));
export const fullDate = (date) => shortDate(date, { day: 'numeric', month: 'long' });
export const money = (value) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(value) || 0) + ' ₽';
export const num = (n, a, b, c) =>
  n +
  ' ' +
  (n % 10 === 1 && n % 100 !== 11
    ? a
    : n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)
      ? b
      : c);
export const initials = (name) =>
  String(name || 'Гость')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] || '')
    .join('')
    .toUpperCase();
export const pill = (label, color = 'neutral') =>
  '<span class="ad-pill ad-' + color + '"><i></i>' + escapeHtml(label) + '</span>';
export const statInfo = {
  new: ['Новое', 'blue'],
  'in-progress': ['В работе', 'amber'],
  closed: ['Закрыто', 'green'],
  booked: ['Подтверждено', 'blue'],
  'checked-in': ['Проживает', 'green'],
  'checked-out': ['Выехал', 'neutral'],
  cancelled: ['Отменено', 'red'],
  done: ['Завершено', 'green'],
  ready: ['Готов', 'green'],
  dirty: ['Нужна уборка', 'amber'],
  cleaning: ['На уборке', 'blue'],
};
export const statusPill = (status) => pill(...(statInfo[status] || [status]));
export const button = (action, label, iconName = '', cls = 'ad-btn', id = '') =>
  '<button type="button" data-ad-action="' +
  escapeHtml(action) +
  '" ' +
  (id ? 'data-id="' + escapeHtml(id) + '"' : '') +
  ' class="' +
  cls +
  '">' +
  (iconName ? icon(iconName) : '') +
  '<span>' +
  escapeHtml(label) +
  '</span></button>';
export const selectOptions = (items, id, label, current) =>
  items
    .map(
      (item) =>
        '<option value="' +
        escapeHtml(item[id]) +
        '" ' +
        (String(item[id]) === String(current) ? 'selected' : '') +
        '>' +
        escapeHtml(typeof label === 'function' ? label(item) : item[label]) +
        '</option>',
    )
    .join('');
export const empty = (label, iconName = 'list') =>
  '<div class="ad-empty">' + icon(iconName, 25) + '<span>' + escapeHtml(label) + '</span></div>';
export const person = (name, detail = '') =>
  '<span class="ad-person"><span class="ad-avatar tone-' +
  (String(name || '').length % 5) +
  '">' +
  escapeHtml(initials(name)) +
  '</span><span class="ad-name">' +
  escapeHtml(name) +
  (detail ? '<small>' + escapeHtml(detail) + '</small>' : '') +
  '</span></span>';
export const searchBox = (name, query, placeholder) =>
  '<label class="ad-search">' +
  icon('search', 17) +
  '<input type="search" aria-label="' +
  escapeHtml(placeholder) +
  '" data-search="' +
  name +
  '" placeholder="' +
  escapeHtml(placeholder) +
  '" value="' +
  escapeHtml(query) +
  '"></label>';
export const rangeDays = (base, n, dayOffset) => Array.from({ length: n }, (_, i) => dayOffset(i, base));
export const daysBetween = (a, b) =>
  Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
export const contactKey = (record) =>
  (record.phone || '').replace(/\D/g, '').replace(/^8(?=\d{10}$)/, '7') +
  '|' + (record.name || '').trim().toLocaleLowerCase('ru');
export const groupedGuests = (state) => {
  const people = new Map();
  for (const record of [...state.stays, ...state.visits]) {
    const key = contactKey(record);
    if (!people.has(key))
      people.set(key, { key, name: record.name, phone: record.phone, email: '', stays: [], visits: [] });
    const guest = people.get(key);
    guest.email = record.email || guest.email;
    if (record.checkIn) guest.stays.push(record);
    else guest.visits.push(record);
  }
  return [...people.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
};
