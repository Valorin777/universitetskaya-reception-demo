import { rooms as catalog } from './hotelData.js';

const KEY = 'pages.universitetskaya-hotel-demo:universitetskaya.local.v1';
const listeners = new Set();
const terminal = ['checked-out', 'cancelled'];
const statuses = ['booked', 'checked-in', 'checked-out', 'cancelled'];
const hm = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '');
export const minutes = (value) =>
  Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
export const clockTime = (minutes) =>
  [Math.floor(minutes / 60), minutes % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
const moscowClock = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Moscow',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
function moscowParts(date = new Date()) {
  const parts = moscowClock.formatToParts(date);
  return Object.fromEntries(parts.map((v) => [v.type, v.value]));
}
export function today() {
  const { year, month, day } = moscowParts();
  return [year, month, day].join('-');
}
export function dayOffset(days, base = today()) {
  const date = new Date(base + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
const validDate = (v) =>
  typeof v === 'string' &&
  /^\d{4}-\d\d-\d\d$/.test(v) &&
  Number.isFinite(Date.parse(v + 'T12:00:00Z')) &&
  new Date(v + 'T12:00:00Z').toISOString().slice(0, 10) === v;
const overlaps = (a, b, c, d) => a < d && c < b;
const fail = (msg) => {
  throw new Error(msg);
};
const ensure = (truth, msg) => {
  if (!truth) fail(msg);
};
function byId(list, id, label) {
  const item = list.find((item) => item.id === id);
  ensure(item, label + ' не найдено. Обновите страницу.');
  return item;
}
const id = (prefix) =>
  prefix + '-' + crypto.randomUUID().slice(0, 8).toUpperCase();
const phone = (n) => '+7 000 000 ' + String(10 + n).padStart(2, '0') + ' 00';
function seed() {
  const categories = catalog.map((room, i) => ({
    ...room,
    price:
      Number(room.price) || [4100, 3200, 4800, 3800, 4900, 3900, 6800, 8600][i],
    capacity: Number(room.capacity) || 2,
  }));
  const rooms = categories.flatMap((cat, i) =>
    Array.from({ length: 4 }, (_, j) => ({
      id: 'room-' + (i + 3) + (j + 1),
      categoryId: cat.id,
      number: String((i + 3) * 100 + j + 1),
      housekeeping:
        j === 3 && i % 3 === 1
          ? 'cleaning'
          : j === 3 && i % 2 === 0
            ? 'dirty'
            : 'ready',
    })),
  );
  const masters = [
    {
      id: 'm1',
      name: 'Анна Лебедева',
      role: 'Парикмахер-стилист',
      color: '#702440',
    },
    { id: 'm2', name: 'Ирина Соколова', role: 'Колорист', color: '#2a675f' },
    { id: 'm3', name: 'Денис Орлов', role: 'Парикмахер', color: '#384e74' },
  ];
  const services = [
    { id: 'cut', title: 'Стрижка', duration: 60, price: 2100 },
    { id: 'style', title: 'Укладка', duration: 45, price: 1700 },
    { id: 'color', title: 'Окрашивание', duration: 120, price: 4900 },
  ];
  const names = [
    'Марина Романова',
    'Леонид Павлов',
    'Вера Миронова',
    'Павел Петров',
    'Алиса Белова',
    'Григорий Власов',
    'Лидия Макарова',
    'Юрий Быков',
    'Дарья Ильина',
    'Тимур Котов',
    'Михаил Титов',
    'Ксения Ларина',
    'Игорь Захаров',
    'Нина Волкова',
    'Татьяна Новикова',
    'Елена Синицына',
  ];
  const stays = names.slice(0, 14).map((name, i) => {
    const room = rooms[(i * 5) % rooms.length],
      cat = categories.find((c) => c.id === room.categoryId);
    const [start, end] = [
      [0, 2],
      [-2, 0],
      [-1, 3],
      [1, 4],
      [0, 1],
      [-3, 1],
      [2, 4],
    ][i % 7];
    if (start <= 0) room.housekeeping = 'ready';
    return {
      id: 'U-' + (2011 + i),
      categoryId: cat.id,
      roomId: room.id,
      name,
      phone: phone(i),
      email: '',
      notes: '',
      checkIn: dayOffset(start),
      checkOut: dayOffset(end),
      guests: Math.min((i % 2) + 1, cat.capacity),
      price: cat.price,
      status: start < 0 ? 'checked-in' : 'booked',
    };
  });
  const visits = [];
  for (const delta of [-1, 0, 1, 2, 3])
    for (const [i, [masterId, time, serviceId]] of [
      ['m1', '14:00', 'cut'],
      ['m1', '15:15', 'color'],
      ['m1', '18:00', 'style'],
      ['m1', '19:30', 'cut'],
      ['m2', '14:30', 'color'],
      ['m2', '18:00', 'cut'],
      ['m3', '15:00', 'style'],
    ].entries()) {
      const idx = (i * 3 + delta + names.length) % names.length,
        stay =
          i === 0
            ? stays.find(
                (s) =>
                  s.checkIn <= dayOffset(delta) &&
                  s.checkOut > dayOffset(delta),
              )
            : null;
      visits.push({
        id: 'S-' + (2300 + (delta + 1) * 15 + i),
        masterId,
        serviceId,
        date: dayOffset(delta),
        time,
        duration: services.find((s) => s.id === serviceId).duration,
        price: services.find((s) => s.id === serviceId).price,
        name: stay?.name || names[idx],
        phone: stay?.phone || phone(idx),
        stayId: stay?.id || '',
        notes:
          i === 0
            ? 'Предпочитает укладку без лака.'
            : i === 1
              ? 'Обсудить оттенок перед началом.'
              : '',
        status: delta < 0 ? 'done' : 'booked',
      });
    }
  const initial = {
    categories,
    rooms,
    masters,
    archivedMasters: [],
    services,
    archivedServices: [],
    stays,
    visits,
    blocks: [],
    shifts: [],
    inquiries: [
      {
        id: 'Q-1084',
        topic: 'Конференц-зал',
        name: 'Алиса Белова',
        phone: phone(4),
        email: '',
        date: today(),
        message:
          'Планируем семинар на 18 человек. Подскажите, можно ли объединить аренду зала с обедом в кафе?',
        status: 'new',
        note: '',
      },
      {
        id: 'Q-1083',
        topic: 'Проживание',
        name: 'Юрий Быков',
        phone: phone(7),
        email: '',
        date: dayOffset(-1),
        message: 'Приеду раньше заселения. Где можно оставить чемодан?',
        status: 'in-progress',
        note: 'Уточнить у гостя время прибытия.',
      },
    ],
  };
  initializeCrm(initial);
  initial.crmDeals.push(
    {
      id: 'D-1201',
      title: 'Размещение участников семинара',
      name: names[1],
      phone: phone(1),
      email: '',
      source: 'phone',
      sourceInquiryId: '',
      stage: 'proposal',
      amount: 48000,
      description:
        'Предложение на восемь номеров для участников семинара. Ожидаем ответ по датам.',
      createdAt: dayOffset(-2),
      updatedAt: today(),
    },
    {
      id: 'D-1202',
      title: 'Укладка для гостьи',
      name: names[8],
      phone: phone(8),
      email: '',
      source: 'desk',
      sourceInquiryId: '',
      stage: 'won',
      amount: 1700,
      description: 'Гостья подтвердила услугу на стойке регистрации.',
      createdAt: dayOffset(-2),
      updatedAt: dayOffset(-1),
    },
  );
  initial.crmTasks.push({
    id: 'T-Q-1084',
    dealId: 'D-Q-1084',
    title: 'Уточнить дату семинара и состав группы',
    name: names[4],
    phone: phone(4),
    dueDate: dayOffset(1),
    status: 'open',
    createdAt: today(),
    updatedAt: today(),
  });
  return initial;
}

function dealFromInquiry(inquiry) {
  const createdAt = inquiry.createdAt || inquiry.date;
  return {
    id: 'D-' + inquiry.id,
    title: inquiry.topic,
    name: inquiry.name,
    phone: inquiry.phone,
    email: inquiry.email || '',
    source: 'website',
    sourceInquiryId: inquiry.id,
    stage: inquiry.status === 'new' ? 'new' : 'working',
    amount: 0,
    description: inquiry.message,
    createdAt,
    updatedAt: createdAt,
  };
}
function initializeCrm(state) {
  state.crmDeals ??= [];
  state.crmContacts ??= [];
  state.crmTasks ??= [];
  state.crmNotes ??= [];
  const linked = new Set(state.crmDeals.map((deal) => deal.sourceInquiryId));
  for (const inquiry of state.inquiries) {
    if (!linked.has(inquiry.id)) state.crmDeals.push(dealFromInquiry(inquiry));
  }
}
function read() {
  const value = localStorage.getItem(KEY);
  if (value) {
    const state = JSON.parse(value);
    state.inquiries ??= [];
    state.archivedMasters ??= [];
    state.archivedServices ??= [];
    initializeCrm(state);
    for (const visit of state.visits) {
      if (!Number.isFinite(visit.price)) {
        const original = getAllServices(state).find(
          (s) => s.id === visit.serviceId,
        );
        if (original) visit.price = original.price;
      }
    }
    return state;
  }
  const initial = seed();
  localStorage.setItem(KEY, JSON.stringify(initial));
  return initial;
}
export const getState = read;
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  for (const fn of listeners) {
    try {
      fn();
    } catch (error) {
      console.error(error);
    }
  }
}
window.addEventListener('storage', (e) => {
  if (e.key === KEY || e.key === null) emit();
});
async function change(fn) {
  const run = () => {
    const state = read();
    const result = fn(state);
    localStorage.setItem(KEY, JSON.stringify(state));
    queueMicrotask(emit);
    return result;
  };
  return navigator.locks ? navigator.locks.request(KEY, run) : run();
}
export function resetDemo() {
  return change((state) => Object.assign(state, seed()));
}
function clean(value, limit = 240) {
  return String(value ?? '')
    .trim()
    .slice(0, limit);
}
function contact(record) {
  record.name = clean(record.name, 90);
  record.phone = clean(record.phone, 35);
  record.notes = clean(record.notes, 900);
  ensure(record.name.length >= 2, 'Укажите имя гостя.');
  ensure(
    /^[+\s()\d.-]+$/.test(record.phone) &&
      /^\d{7,15}$/.test(record.phone.replace(/\D/g, '')),
    'Проверьте номер телефона.',
  );
}
function matchingRooms(
  state,
  { categoryId, checkIn, checkOut, guests = 1, excludeId = '' },
) {
  if (!validDate(checkIn) || !validDate(checkOut) || checkOut <= checkIn)
    return [];
  return state.rooms.filter((room) => {
    const cat = state.categories.find((c) => c.id === room.categoryId);
    return (
      (!categoryId || room.categoryId === categoryId) &&
      cat &&
      cat.capacity >= Number(guests) &&
      !state.stays.some(
        (s) =>
          s.id !== excludeId &&
          s.roomId === room.id &&
          !terminal.includes(s.status) &&
          overlaps(checkIn, checkOut, s.checkIn, s.checkOut),
      )
    );
  });
}
export const availableRooms = (options) => matchingRooms(read(), options);
function assertUnchanged(record, expected, keys) {
  if (!record || !expected) return;
  const modified = keys.some(
    (key) => Object.hasOwn(expected, key) && expected[key] !== record[key],
  );
  ensure(
    !modified,
    'Запись уже изменена в другой вкладке. Откройте её заново.',
  );
}
const stayFields = [
  'roomId',
  'categoryId',
  'status',
  'checkIn',
  'checkOut',
  'guests',
  'name',
  'phone',
  'email',
  'notes',
  'price',
];
const visitFields = [
  'masterId',
  'serviceId',
  'status',
  'date',
  'time',
  'duration',
  'name',
  'phone',
  'notes',
  'stayId',
  'price',
];
export function saveStay(input, expected) {
  return change((state) => {
    const old = input.id ? byId(state.stays, input.id, 'Бронирование') : null;
    assertUnchanged(old, expected, stayFields);
    if (old && terminal.includes(old.status))
      fail('Бронирование уже закрыто. Обновите список.');
    const item = {
      status: 'booked',
      email: '',
      notes: '',
      guests: 1,
      ...old,
      ...input,
      id: old?.id || id('U'),
    };
    contact(item);
    item.email = clean(item.email, 160);
    ensure(
      !item.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email),
      'Проверьте адрес электронной почты.',
    );
    item.guests = Number(item.guests);
    const cat = byId(state.categories, item.categoryId, 'Размещение');
    ensure(
      validDate(item.checkIn) &&
        validDate(item.checkOut) &&
        item.checkOut > item.checkIn,
      'Проверьте даты заезда и выезда.',
    );
    ensure(
      (old && old.checkIn === item.checkIn) || item.checkIn >= today(),
      'Заезд можно оформить с сегодняшнего дня.',
    );
    ensure(
      Number.isInteger(item.guests) &&
        item.guests >= 1 &&
        item.guests <= cat.capacity,
      'Проверьте количество гостей.',
    );
    ensure(statuses.includes(item.status), 'Проверьте статус бронирования.');
    ensure(
      old || !terminal.includes(item.status),
      'Сначала оформите бронирование.',
    );
    if (old && old.status !== item.status) {
      const next = {
        booked: ['checked-in', 'cancelled'],
        'checked-in': ['checked-out'],
      };
      ensure(
        next[old.status]?.includes(item.status),
        'Бронирование уже изменилось. Проверьте его статус.',
      );
      if (terminal.includes(item.status))
        ensure(
          ['roomId', 'categoryId', 'checkIn', 'checkOut'].every(
            (key) => old[key] === item[key],
          ),
          'Сначала сохраните изменение номера или дат проживания отдельно.',
        );
    }
    let selected = state.rooms.find((r) => r.id === item.roomId);
    if (!terminal.includes(item.status)) {
      const options = matchingRooms(state, { ...item, excludeId: item.id });
      if (input.roomId)
        ensure(
          options.some((r) => r.id === input.roomId),
          'Этот номер уже занят на выбранные даты.',
        );
      selected = options.find((r) => r.id === item.roomId) || options[0];
      ensure(
        selected,
        'Свободные номера закончились. Выберите другую категорию или даты.',
      );
      const movingInHouse =
        old?.status === 'checked-in' && old.roomId !== selected.id;
      if (
        item.status === 'checked-in' &&
        (old?.status !== 'checked-in' || movingInHouse)
      ) {
        ensure(
          item.checkIn <= today() && item.checkOut > today(),
          'Заселение доступно только в период проживания.',
        );
        ensure(
          !state.stays.some(
            (other) =>
              other.roomId === selected.id &&
              other.id !== item.id &&
              other.status === 'checked-in',
          ),
          'Сначала оформите выезд предыдущего гостя.',
        );
        ensure(
          selected.housekeeping === 'ready',
          'Сначала отметьте номер готовым после уборки.',
        );
      }
      if (movingInHouse)
        byId(state.rooms, old.roomId, 'Размещение').housekeeping = 'dirty';
      if (
        old?.status === 'checked-in' &&
        item.status === 'checked-in' &&
        (old.checkIn !== item.checkIn || old.checkOut !== item.checkOut)
      )
        ensure(
          item.checkIn <= today() && item.checkOut >= today(),
          'Даты проживания заселённого гостя должны включать сегодняшний день.',
        );
      item.roomId = selected.id;
    }
    const linked = state.visits.filter(
      (v) => v.stayId === item.id && v.status === 'booked',
    );
    if (old && (old.checkIn !== item.checkIn || old.checkOut !== item.checkOut))
      ensure(
        linked.every((v) => v.date >= item.checkIn && v.date <= item.checkOut),
        'Сначала перенесите связанный визит в салон на даты нового проживания.',
      );
    if (item.status === 'cancelled')
      for (const visit of linked) visit.status = 'cancelled';
    if (
      item.status === 'checked-out' &&
      old?.status !== 'checked-out' &&
      selected
    ) {
      selected.housekeeping = 'dirty';
      item.checkedOutOn = today();
    }
    item.price = old && old.categoryId === cat.id ? old.price : cat.price;
    if (old) Object.assign(old, item);
    else state.stays.push(item);
    return item;
  });
}
export const cancelStay = (id, expected) =>
  saveStay({ id, status: 'cancelled' }, expected);
function shiftFor(state, masterId, date) {
  return (
    state.shifts.find((s) => s.date === date && s.masterId === masterId) || {
      masterId,
      date,
      start: '14:00',
      end: '22:00',
      off: false,
    }
  );
}
export const getShift = (masterId, date) => shiftFor(read(), masterId, date);
function free(state, masterId, date, start, duration, excludeId) {
  const shift = shiftFor(state, masterId, date);
  if (
    shift.off ||
    start < minutes(shift.start) ||
    start + duration > minutes(shift.end)
  )
    return false;
  return ![...state.visits, ...state.blocks].some(
    (v) =>
      v.id !== excludeId &&
      v.masterId === masterId &&
      v.date === date &&
      v.status !== 'cancelled' &&
      overlaps(
        start,
        start + duration,
        minutes(v.time),
        minutes(v.time) + v.duration,
      ),
  );
}
function slotList(state, { date, serviceId, masterId, excludeId = '' }) {
  if (!validDate(date) || date < today()) return [];
  const original =
    excludeId &&
    state.visits.find(
      (v) =>
        v.id === excludeId &&
        v.serviceId === serviceId &&
        v.status === 'booked',
    );
  const service = (original ? getAllServices(state) : state.services).find(
    (s) => s.id === serviceId,
  );
  if (!service) return [];
  const duration = original?.duration || service.duration;
  const now = moscowParts(),
    minStart =
      date === today() ? Number(now.hour) * 60 + Number(now.minute) : 0;
  const result = [];
  for (let start = 14 * 60; start < 22 * 60; start += 15) {
    if (start < minStart) continue;
    for (const master of state.masters) {
      if (masterId && master.id !== masterId) continue;
      if (free(state, master.id, date, start, duration, excludeId))
        result.push({ time: clockTime(start), masterId: master.id });
    }
  }
  return result;
}
export const slots = (options) => slotList(read(), options);
export function saveVisit(input, expected) {
  return change((state) => writeVisit(state, input, expected));
}
function writeVisit(state, input, expected) {
  const old = input.id ? byId(state.visits, input.id, 'Посещение') : null;
  assertUnchanged(old, expected, visitFields);
  if (old && old.status !== 'booked')
    fail('Посещение уже завершено или отменено. Обновите список.');
  const item = {
    status: 'booked',
    stayId: '',
    notes: '',
    ...old,
    ...input,
    id: old?.id || id('S'),
  };
  contact(item);
  const sameService = old?.serviceId === item.serviceId;
  const svc = (sameService ? getAllServices(state) : state.services).find(
    (s) => s.id === item.serviceId,
  );
  ensure(svc, 'Услуга больше недоступна. Выберите другую услугу.');
  ensure(
    state.masters.some((m) => m.id === item.masterId),
    'Мастер больше не принимает записи. Выберите другого мастера.',
  );
  ensure(
    ['booked', 'done', 'cancelled'].includes(item.status) &&
      (old || item.status === 'booked'),
    'Сначала оформите запись на визит.',
  );
  ensure(validDate(item.date) && hm(item.time), 'Проверьте дату и время.');
  item.duration =
    old?.serviceId === item.serviceId ? old.duration : svc.duration;
  item.price =
    old?.serviceId === item.serviceId && Number.isFinite(old.price)
      ? old.price
      : svc.price;
  if (
    item.stayId &&
    (!old || old.stayId !== item.stayId || old.date !== item.date)
  ) {
    const stay = byId(state.stays, item.stayId, 'Проживание');
    ensure(
      !terminal.includes(stay.status) &&
        item.date >= stay.checkIn &&
        item.date <= stay.checkOut,
      'Выберите день визита в пределах проживания.',
    );
  }
  const moved =
    !old ||
    ['date', 'time', 'serviceId', 'masterId'].some((k) => item[k] !== old[k]);
  ensure(
    !moved || item.status === 'booked',
    'Сначала сохраните изменение времени, услуги или мастера отдельно.',
  );
  if (item.status === 'booked' && moved)
    ensure(
      slotList(state, { ...item, excludeId: item.id }).some(
        (t) => t.time === item.time,
      ),
      'Это время уже недоступно. Выберите другое окно.',
    );
  if (item.status === 'done')
    ensure(
      !inFuture(item.date, item.time),
      'Визит ещё не начался. Проверьте дату и время.',
    );
  if (old) Object.assign(old, item);
  else state.visits.push(item);
  return item;
}
function moscowMinute() {
  const now = moscowParts();
  return (
    [now.year, now.month, now.day].join('-') + 'T' + now.hour + ':' + now.minute
  );
}
function inFuture(date, time) {
  return date + 'T' + time > moscowMinute();
}
export const cancelVisit = (id, expected) =>
  saveVisit({ id, status: 'cancelled' }, expected);
export function saveBlock(input) {
  return change((state) => {
    const record = {
      id: id('B'),
      masterId: input.masterId,
      date: input.date,
      time: input.time,
      duration: Number(input.duration),
      title: clean(input.title || 'Перерыв', 100),
    };
    byId(state.masters, record.masterId, 'Место в графике');
    ensure(
      validDate(record.date) &&
        hm(record.time) &&
        minutes(record.time) % 15 === 0 &&
        record.date + 'T' + record.time >= moscowMinute() &&
        Number.isInteger(record.duration) &&
        record.duration >= 15 &&
        record.duration % 15 === 0,
      'Проверьте день и продолжительность перерыва.',
    );
    ensure(
      free(
        state,
        record.masterId,
        record.date,
        minutes(record.time),
        record.duration,
      ),
      'Перерыв пересекается с записью или выходит за пределы смены.',
    );
    state.blocks.push(record);
    return record;
  });
}
export function removeBlock(blockId) {
  return change((s) => {
    byId(s.blocks, blockId, 'Время');
    s.blocks = s.blocks.filter((b) => b.id !== blockId);
  });
}
export function saveShift(input, expected) {
  return change((state) => {
    const { masterId, date, start, end } = input,
      off = Boolean(input.off);
    byId(state.masters, masterId, 'Место в графике');
    assertUnchanged(shiftFor(state, masterId, date), expected, [
      'off',
      'start',
      'end',
    ]);
    ensure(
      validDate(date) && date >= today(),
      'Выберите сегодняшний или будущий день.',
    );
    ensure(
      off ||
        (hm(start) &&
          hm(end) &&
          start >= '14:00' &&
          end <= '22:00' &&
          start < end &&
          minutes(start) % 15 === 0 &&
          minutes(end) % 15 === 0),
      'Укажите часы смены в пределах 14:00–22:00.',
    );
    const existing = [...state.visits, ...state.blocks].filter(
      (v) =>
        v.masterId === masterId && v.date === date && v.status !== 'cancelled',
    );
    ensure(
      existing.every(
        (v) =>
          !off &&
          v.time >= start &&
          minutes(v.time) + v.duration <= minutes(end),
      ),
      'На это время уже есть визит или перерыв. Сначала перенесите его.',
    );
    const item = {
      masterId,
      date,
      start: off ? '14:00' : start,
      end: off ? '22:00' : end,
      off,
    };
    state.shifts = state.shifts.filter(
      (s) => s.masterId !== masterId || s.date !== date,
    );
    state.shifts.push(item);
    return item;
  });
}
export function setHousekeeping(id, status) {
  return change((s) => {
    ensure(
      ['ready', 'dirty', 'cleaning'].includes(status),
      'Проверьте состояние номера.',
    );
    const room = byId(s.rooms, id, 'Размещение');
    room.housekeeping = status;
    return room;
  });
}
export function updateCategory(id, fields, expected) {
  return change((s) => {
    const cat = byId(s.categories, id, 'Размещение');
    assertUnchanged(cat, expected, ['title', 'description', 'price']);
    if ('title' in fields) {
      const v = clean(fields.title, 140);
      ensure(v, 'Укажите название.');
      cat.title = v;
    }
    if ('description' in fields) {
      const v = clean(fields.description, 2200);
      ensure(v, 'Укажите описание.');
      cat.description = v;
    }
    if ('price' in fields) {
      const v = Number(fields.price);
      ensure(Number.isFinite(v) && v > 0, 'Проверьте стоимость.');
      cat.price = v;
      cat.priceIsDemo = true;
    }
    return cat;
  });
}
export function getAllMasters(state = read()) {
  return [...state.masters, ...(state.archivedMasters || [])];
}
export function getAllServices(state = read()) {
  return [...state.services, ...(state.archivedServices || [])];
}
function serviceDetails(fields, active, skipId) {
  const title = clean(fields.title, 80),
    duration = Number(fields.duration),
    price = Number(fields.price);
  ensure(title.length >= 1, 'Укажите название услуги.');
  ensure(
    Number.isInteger(duration) &&
      duration >= 15 &&
      duration <= 480 &&
      duration % 15 === 0,
    'Длительность должна быть кратна 15 минутам, от 15 до 480 минут.',
  );
  ensure(
    fields.price !== '' && Number.isFinite(price) && price >= 0,
    'Укажите цену от 0 ₽.',
  );
  ensure(
    !active.some(
      (s) =>
        s.id !== skipId &&
        s.title.toLocaleLowerCase('ru') === title.toLocaleLowerCase('ru'),
    ),
    'Услуга с таким названием уже есть.',
  );
  return { title, duration, price };
}
export function addService(fields) {
  return change((state) => {
    const service = { id: id('SV'), ...serviceDetails(fields, state.services) };
    state.services.push(service);
    return service;
  });
}
export function updateService(id, fields, expected) {
  return change((state) => {
    const record = byId(state.services, id, 'Предложение');
    assertUnchanged(record, expected, ['title', 'duration', 'price']);
    return Object.assign(
      record,
      serviceDetails({ ...record, ...fields }, state.services, id),
    );
  });
}
export function archiveService(serviceId) {
  return change((state) =>
    archiveEntry(
      state.services,
      state.archivedServices,
      serviceId,
      'Предложение',
    ),
  );
}
export function restoreService(serviceId) {
  return change((state) => {
    const service = byId(state.archivedServices, serviceId, 'Предложение');
    serviceDetails(service, state.services, serviceId);
    return restoreEntry(
      state.archivedServices,
      state.services,
      serviceId,
      'Предложение',
    );
  });
}
function masterDetails(fields) {
  const name = clean(fields.name, 90),
    role = clean(fields.role, 90);
  ensure(
    name.length >= 2 && role.length >= 1,
    'Укажите имя мастера и специализацию.',
  );
  return { name, role };
}
export function addMaster(fields) {
  return change((state) => {
    const colors = ['#702440', '#2a675f', '#384e74', '#77562c'];
    const master = {
      id: id('M'),
      ...masterDetails(fields),
      color: colors[getAllMasters(state).length % colors.length],
    };
    state.masters.push(master);
    return master;
  });
}
export function updateMaster(id, fields, expected) {
  return change((state) => {
    const record = byId(state.masters, id, 'Рабочее место');
    assertUnchanged(record, expected, ['name', 'role']);
    return Object.assign(record, masterDetails({ ...record, ...fields }));
  });
}
function archiveEntry(active, archive, recordId, label) {
  const item = byId(active, recordId, label);
  active.splice(active.indexOf(item), 1);
  item.archivedOn = today();
  archive.push(item);
  return item;
}
function restoreEntry(archive, active, recordId, label) {
  const item = byId(archive, recordId, label);
  archive.splice(archive.indexOf(item), 1);
  delete item.archivedOn;
  active.push(item);
  return item;
}
export function getMasterArchiveVisits(masterId, state = read()) {
  return state.visits
    .filter((visit) => visit.masterId === masterId && visit.status === 'booked')
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
export function archiveMaster(masterId, { transfers = {} } = {}) {
  return change((state) => {
    byId(state.masters, masterId, 'Рабочее место');
    const pending = getMasterArchiveVisits(masterId, state);
    const plannedIds = Object.keys(transfers);
    ensure(
      pending.length === plannedIds.length &&
        pending.every((v) => Object.hasOwn(transfers, v.id)),
      'Список визитов изменился или заполнен не полностью. Проверьте каждую запись.',
    );
    for (const visit of pending) {
      const move = transfers[visit.id];
      ensure(
        move &&
          state.masters.some(
            (m) => m.id === move.masterId && m.id !== masterId,
          ),
        'Для каждого визита выберите другого действующего мастера.',
      );
      try {
        writeVisit(
          state,
          {
            id: visit.id,
            masterId: move.masterId,
            date: move.date,
            time: move.time,
          },
          move.expected,
        );
      } catch (error) {
        throw new Error(
          visit.name +
            ' · ' +
            visit.date +
            ' ' +
            visit.time +
            '. ' +
            error.message,
        );
      }
    }
    // A returning employee starts with a clean schedule. Past shifts and breaks keep their original owner.
    const cutoff = today();
    state.shifts = state.shifts.filter(
      (s) => s.masterId !== masterId || s.date < cutoff,
    );
    state.blocks = state.blocks.filter(
      (b) =>
        b.masterId !== masterId ||
        b.date < cutoff ||
        (b.date === cutoff &&
          !inFuture(b.date, clockTime(minutes(b.time) + b.duration))),
    );
    return archiveEntry(
      state.masters,
      state.archivedMasters,
      masterId,
      'Рабочее место',
    );
  });
}
export function restoreMaster(masterId) {
  return change((state) =>
    restoreEntry(
      state.archivedMasters,
      state.masters,
      masterId,
      'Рабочее место',
    ),
  );
}

const normalizedPhone = (value) =>
  String(value)
    .replace(/\D/g, '')
    .replace(/^8(?=\d{10}$)/, '7');
const crmIdentity = (row) =>
  normalizedPhone(row.phone) +
  '|' +
  clean(row.name, 90).toLocaleLowerCase('ru');
const contactSources = (state) => [
  ...state.crmContacts,
  ...state.stays,
  ...state.visits,
  ...state.inquiries,
  ...state.crmDeals,
  ...state.crmTasks,
  ...state.crmNotes,
];
function contactFields(fields) {
  const draft = { name: fields.name, phone: fields.phone };
  contact(draft);
  const email = clean(fields.email, 160);
  ensure(
    !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    'Проверьте адрес электронной почты.',
  );
  return { name: draft.name, phone: draft.phone, email };
}
function updateContactRecords(state, previous, fields) {
  const identity = crmIdentity(previous);
  const records = contactSources(state);
  const matched = records.filter((row) => crmIdentity(row) === identity);
  ensure(matched.length, 'Контакт уже изменился. Откройте карточку заново.');
  if (!previous.id && Object.hasOwn(previous, 'email')) {
    const currentEmail = matched.find((row) => row.email)?.email || '';
    assertUnchanged({ email: currentEmail }, previous, ['email']);
  }
  const next = contactFields(fields);
  if (identity !== crmIdentity(next)) {
    ensure(
      !records.some((row) => crmIdentity(row) === crmIdentity(next)),
      'Контакт с таким именем и телефоном уже есть.',
    );
  }
  const now = new Date().toISOString();
  for (const row of matched) {
    row.name = next.name;
    row.phone = next.phone;
    if (!state.crmTasks.includes(row) && !state.crmNotes.includes(row))
      row.email = next.email;
    if (Object.hasOwn(row, 'updatedAt')) row.updatedAt = now;
  }
  return next;
}
export function updateGuestContact(previous, fields) {
  return change((state) => updateContactRecords(state, previous, fields));
}
export function saveCrmContact(input, expected) {
  return change((state) => {
    const old = input.id ? byId(state.crmContacts, input.id, 'Лицо') : null;
    assertUnchanged(old, expected, ['name', 'phone', 'email', 'updatedAt']);
    const fields = contactFields({ ...old, ...input });
    if (old) {
      updateContactRecords(state, old, fields);
      return old;
    }
    ensure(
      !contactSources(state).some(
        (row) => crmIdentity(row) === crmIdentity(fields),
      ),
      'Контакт с таким именем и телефоном уже есть.',
    );
    const now = new Date().toISOString();
    const row = { id: id('CL'), ...fields, createdAt: now, updatedAt: now };
    state.crmContacts.push(row);
    return row;
  });
}
const dealFields = [
  'name',
  'phone',
  'email',
  'title',
  'amount',
  'description',
  'stage',
  'source',
  'sourceInquiryId',
  'updatedAt',
];
export function saveCrmDeal(input, expected) {
  return change((state) => {
    const old = input.id ? byId(state.crmDeals, input.id, 'Предложение') : null;
    assertUnchanged(old, expected, dealFields);
    const now = new Date().toISOString();
    const draft = { stage: 'new', source: 'desk', amount: 0, ...old, ...input };
    const title = clean(draft.title, 160);
    ensure(title.length > 1, 'Укажите название сделки.');
    ensure(
      ['new', 'working', 'proposal', 'won', 'lost'].includes(draft.stage),
      'Проверьте этап сделки.',
    );
    ensure(
      ['website', 'phone', 'email', 'desk', 'other'].includes(draft.source),
      'Укажите источник сделки.',
    );
    const amount = Number(draft.amount);
    ensure(
      Number.isFinite(amount) &&
        amount >= 0 &&
        amount <= Number.MAX_SAFE_INTEGER,
      'Проверьте сумму сделки.',
    );
    const inquiryId = old?.sourceInquiryId || clean(draft.sourceInquiryId, 60);
    if (inquiryId) {
      byId(state.inquiries, inquiryId, 'Обращение');
      ensure(
        !state.crmDeals.some(
          (row) => row.id !== old?.id && row.sourceInquiryId === inquiryId,
        ),
        'По обращению уже создана сделка.',
      );
    }
    const person = contactFields(draft);
    const row = {
      id: old?.id || id('D'),
      ...person,
      title,
      amount,
      stage: draft.stage,
      source: draft.source,
      sourceInquiryId: inquiryId,
      description: clean(draft.description, 2000),
      createdAt: old?.createdAt || now,
      updatedAt: now,
    };
    if (old) {
      Object.assign(old, row);
      for (const task of state.crmTasks.filter(
        (task) => task.dealId === row.id,
      )) {
        if (task.phone !== person.phone || task.name !== person.name)
          Object.assign(task, {
            name: person.name,
            phone: person.phone,
            updatedAt: now,
          });
      }
    } else state.crmDeals.unshift(row);
    return row;
  });
}
const taskFields = [
  'title',
  'dueDate',
  'status',
  'dealId',
  'name',
  'phone',
  'updatedAt',
];
export function saveCrmTask(input, expected) {
  return change((state) => {
    const old = input.id ? byId(state.crmTasks, input.id, 'Задание') : null;
    assertUnchanged(old, expected, taskFields);
    const draft = {
      status: 'open',
      dealId: '',
      name: '',
      phone: '',
      ...old,
      ...input,
    };
    const title = clean(draft.title, 180);
    ensure(title.length > 1, 'Укажите задачу.');
    ensure(validDate(draft.dueDate), 'Проверьте срок задачи.');
    ensure(['open', 'done'].includes(draft.status), 'Проверьте статус задачи.');
    const deal = draft.dealId
      ? byId(state.crmDeals, draft.dealId, 'Предложение')
      : null;
    let name = '',
      phone = '';
    if (deal) ({ name, phone } = deal);
    else if (draft.name || draft.phone)
      ({ name, phone } = contactFields(draft));
    const now = new Date().toISOString();
    const row = {
      id: old?.id || id('T'),
      title,
      dealId: deal?.id || '',
      name,
      phone,
      dueDate: draft.dueDate,
      status: draft.status,
      createdAt: old?.createdAt || now,
      updatedAt: now,
    };
    if (old) Object.assign(old, row);
    else state.crmTasks.unshift(row);
    return row;
  });
}
export function addCrmNote(input) {
  return change((state) => {
    const { name, phone } = contactFields(input);
    ensure(
      contactSources(state).some(
        (row) => crmIdentity(row) === crmIdentity({ name, phone }),
      ),
      'Откройте актуальную карточку клиента.',
    );
    const text = clean(input.text, 2000);
    ensure(text.length > 0, 'Введите текст заметки.');
    const row = {
      id: id('N'),
      name,
      phone,
      text,
      createdAt: new Date().toISOString(),
    };
    state.crmNotes.unshift(row);
    return row;
  });
}
export function saveInquiry(input) {
  return change((state) => {
    const record = {
      id: id('Q'),
      name: input.name,
      phone: input.phone,
      email: clean(input.email, 160),
      topic: clean(input.topic, 120),
      createdAt: new Date().toISOString(),
      message: clean(input.message, 2000),
      date: today(),
      status: 'new',
      note: '',
    };
    contact(record);
    delete record.notes;
    ensure(record.topic, 'Выберите тему обращения.');
    ensure(record.message.length >= 3, 'Опишите ваш вопрос.');
    ensure(
      !record.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email),
      'Проверьте адрес электронной почты.',
    );
    state.inquiries.unshift(record);
    state.crmDeals.unshift(dealFromInquiry(record));
    return record;
  });
}
export function updateInquiry(inquiryId, { status, note }, expected) {
  return change((state) => {
    const record = byId(state.inquiries, inquiryId, 'Обращение');
    assertUnchanged(record, expected, ['status', 'note']);
    ensure(
      ['new', 'in-progress', 'closed'].includes(status),
      'Проверьте статус обращения.',
    );
    record.status = status;
    record.note = clean(note, 1400);
    return record;
  });
}
