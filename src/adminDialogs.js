import { allMasters, allServices, masterArchiveBody } from './adminTeam.js';
import { today, dayOffset, availableRooms, slots, getShift } from './store.js';
import {
  escapeHtml as e,
  icon,
  fullDate,
  money,
  button as btn,
  selectOptions,
  person,
  statusPill,
  empty,
  groupedGuests,
  daysBetween,
} from './adminView.js';
const summaryLine = (label, value) =>
  value !== undefined && value !== null && String(value) !== ''
    ? '<div><span>' + e(label) + '</span><b>' + e(value) + '</b></div>'
    : '';
const byId = (items, id) => items.find((x) => x.id === id);
const label = (title, control, cls = '') =>
  '<label class="ad-field ' + cls + '"><span>' + title + '</span>' + control + '</label>';
const input = (name, val = '', type = 'text', extra = '') =>
  '<input type="' + type + '" name="' + name + '" value="' + e(val) + '" ' + extra + '>';
const select = (name, options, extra = '') =>
  '<select name="' + name + '" ' + extra + '>' + options + '</select>';
const area = (name, val, extra = '') =>
  '<textarea name="' + name + '" rows="3" ' + extra + '>' + e(val) + '</textarea>';
const option = (val, title, chosen) =>
  '<option value="' +
  e(val) +
  '" ' +
  (String(val) === String(chosen) ? 'selected' : '') +
  '>' +
  e(title) +
  '</option>';
const head = (title, sub = '') =>
  '<div class="ad-dialog-head"><div><h2>' +
  e(title) +
  '</h2>' +
  (sub ? '<p>' + e(sub) + '</p>' : '') +
  '</div><button type="button" data-ad-action="close" aria-label="Закрыть окно" class="ad-icon-btn">' +
  icon('close', 20) +
  '</button></div>';
const foot = (submit = 'Сохранить', aux = '') =>
  '<p class="ad-form-error" role="alert" hidden></p><div class="ad-dialog-foot">' +
  aux +
  '<button type="submit" class="ad-btn ad-primary">' +
  icon('check', 16) +
  e(submit) +
  '</button></div>';
const wrapper = (kind, id, title, body, button, aux = '', sub = '') =>
  head(title, sub) +
  '<form data-ad-form="' +
  kind +
  '" data-id="' +
  e(id) +
  '"><div class="ad-form-grid">' +
  body +
  '</div>' +
  foot(button, aux) +
  '</form>';
const msg = (text) =>
  '<p class="ad-form-note ad-wide">' + icon('info', 15) + '<span>' + e(text) + '</span></p>';
export function stayDialog(s, id, opts = {}) {
  const prev = byId(s.stays, id),
    room = byId(s.rooms, opts.roomId),
    category = prev?.categoryId || room?.categoryId || s.categories[0]?.id;
  const r = prev || {
    categoryId: category,
    checkIn: opts.date || today(),
    checkOut: dayOffset(1, opts.date || today()),
    guests: 1,
    status: 'booked',
    roomId: opts.roomId,
  };
  const oldStatus = prev?.status;
  const statusOpts =
    oldStatus === 'checked-out' || oldStatus === 'cancelled'
      ? [[oldStatus, oldStatus === 'cancelled' ? 'Отменено' : 'Выехал']]
      : oldStatus === 'checked-in'
        ? [
            ['checked-in', 'Проживает'],
            ['checked-out', 'Выехал'],
          ]
        : [
            ['booked', 'Подтверждено'],
            ['checked-in', 'Заселить'],
          ];
  const disabled = oldStatus === 'cancelled' || oldStatus === 'checked-out';
  const body =
    label(
      'Имя гостя',
      input('name', r.name, 'text', 'required maxlength="90" autocomplete="name"'),
      'ad-wide',
    ) +
    label('Телефон', input('phone', r.phone, 'tel', 'required maxlength="40" autocomplete="tel"')) +
    label(
      'Электронная почта',
      input('email', r.email, 'email', 'maxlength="120" autocomplete="email"'),
    ) +
    label('Заезд', input('checkIn', r.checkIn, 'date', 'required')) +
    label('Выезд', input('checkOut', r.checkOut, 'date', 'required')) +
    label(
      'Категория',
      select('categoryId', selectOptions(s.categories, 'id', 'title', r.categoryId)),
      'ad-wide',
    ) +
    label('Число гостей', input('guests', r.guests, 'number', 'required min="1" max="12" step="1"')) +
    label('Номер', select('roomId', '', 'required data-selected="' + e(r.roomId || '') + '"')) +
    label('Статус', select('status', statusOpts.map((x) => option(x[0], x[1], r.status)).join(''))) +
    label('Стоимость в демоверсии', '<output data-ad-cost></output>') +
    label('Комментарий для стойки', area('notes', r.notes, 'maxlength="1000"'), 'ad-wide') +
    '<p class="ad-form-note ad-wide" data-room-hint></p>';
  const cancel =
    prev && oldStatus === 'booked'
      ? btn('confirm-cancel-stay', 'Отменить бронь', '', 'ad-danger-link', id)
      : '';
  if (disabled) {
    const end = r.checkedOutOn && r.checkedOutOn < r.checkOut ? r.checkedOutOn : r.checkOut;
    const lines = [
      ['Номер брони', r.id],
      ['Даты брони', fullDate(r.checkIn) + ' — ' + fullDate(r.checkOut)],
      ['Фактический выезд', r.checkedOutOn && fullDate(r.checkedOutOn)],
      ['Номер', byId(s.rooms, r.roomId)?.number],
      ['Категория', byId(s.categories, r.categoryId)?.title],
      ['Гостей', r.guests],
      ['Тариф за ночь', money(r.price)],
      ['Стоимость по тарифу', money(Math.max(0, daysBetween(r.checkIn, end)) * r.price)],
      ['Почта', r.email],
      ['Комментарий', r.notes],
    ];
    return (
      head('Бронь гостя', r.name) +
      '<div class="ad-dialog-summary">' +
      person(r.name, r.phone) +
      statusPill(r.status) +
      '</div><div class="ad-summary-lines">' +
      lines.map(([key, value]) => summaryLine(key, value)).join('') +
      '</div>'
    );
  }
  return wrapper(
    'stay',
    id || '',
    prev ? 'Бронь гостя' : 'Новая бронь',
    body,
    prev ? 'Сохранить изменения' : 'Создать бронь',
    cancel,
    prev ? '№ ' + id : '',
  );
}
export function refreshStay(form, s) {
  const f = form.elements,
    c = byId(s.categories, f.categoryId.value),
    prev = byId(s.stays, form.dataset.id);
  f.checkOut.min = dayOffset(1, f.checkIn.value || today());
  f.guests.max = c?.capacity || 12;
  const desired = f.roomId.value || f.roomId.dataset.selected;
  let choices = [];
  if (f.checkIn.value && f.checkOut.value && f.checkOut.value > f.checkIn.value) {
    choices = availableRooms({
      categoryId: f.categoryId.value,
      checkIn: f.checkIn.value,
      checkOut: f.checkOut.value,
      guests: Number(f.guests.value),
      excludeId: prev?.id,
    });
  }
  if (
    prev &&
    prev.categoryId === f.categoryId.value &&
    prev.roomId &&
    prev.checkIn === f.checkIn.value &&
    prev.checkOut === f.checkOut.value &&
    Number(f.guests.value) === Number(prev.guests) &&
    !choices.some((x) => x.id === prev.roomId)
  ) {
    const assigned = byId(s.rooms, prev.roomId);
    if (assigned) choices.push(assigned);
  }
  f.roomId.innerHTML = choices.length
    ? selectOptions(choices, 'id', (x) => '№ ' + x.number, desired)
    : '<option value="">Свободных номеров нет</option>';
  f.roomId.dataset.selected = f.roomId.value;
  const selected = byId(s.rooms, f.roomId.value),
    hint = form.querySelector('[data-room-hint]');
  hint.textContent = !choices.length
    ? 'Измените даты, категорию или число гостей.'
    : selected?.housekeeping !== 'ready'
      ? 'В выбранном номере требуется уборка перед заселением.'
      : '';
  hint.hidden = !hint.textContent;
  const n = daysBetween(f.checkIn.value, f.checkOut.value),
    rate = prev && prev.categoryId === f.categoryId.value ? prev.price : c?.price;
  form.querySelector('[data-ad-cost]').textContent = n > 0 ? money(rate * n) : '—';
}
export function visitDialog(s, id, opts = {}) {
  const prev = byId(s.visits, id),
    v = prev || {
      date: opts.date || today(),
      serviceId: s.services[0]?.id,
      masterId: opts.masterId || '',
      status: 'booked',
    };
  if (!prev && (!s.masters.length || !s.services.length))
    return (
      head('Запись в салон') +
      '<p class="ad-confirm-copy">' +
      (!s.masters.length
        ? 'Сначала примите мастера в разделе «Команда салона».'
        : 'Добавьте услугу в разделе «Редактор сайта».') +
      '</p><div class="ad-dialog-foot">' +
      (!s.masters.length
        ? btn('new-master', 'Принять мастера', 'plus', 'ad-btn ad-primary')
        : btn('new-service', 'Добавить услугу', 'plus', 'ad-btn ad-primary')) +
      '</div>'
    );
  const visitServices = prev
    ? allServices(s).filter(
        (item) => item.id === prev.serviceId || s.services.some((active) => active.id === item.id),
      )
    : s.services;
  if (prev?.status === 'cancelled' || prev?.status === 'done') {
    const svc = byId(allServices(s), v.serviceId);
    const lines = [
      ['Номер записи', v.id],
      ['Дата и время', fullDate(v.date) + ', ' + v.time],
      ['Услуга', svc?.title],
      ['Длительность', v.duration + ' мин'],
      ['Стоимость по записи', money(v.price ?? svc?.price)],
      ['Мастер', byId(allMasters(s), v.masterId)?.name],
      ['Бронь проживания', v.stayId],
      ['Пожелания', v.notes],
    ];
    return (
      head('Визит в салон', v.name) +
      '<div class="ad-dialog-summary">' +
      person(v.name, v.phone) +
      statusPill(v.status) +
      '</div><div class="ad-summary-lines">' +
      lines.map(([key, value]) => summaryLine(key, value)).join('') +
      '</div>'
    );
  }
  const body =
    label('Имя клиента', input('name', v.name, 'text', 'required maxlength="90"'), 'ad-wide') +
    label('Телефон', input('phone', v.phone, 'tel', 'required maxlength="40"')) +
    label('Дата', input('date', v.date, 'date', 'required')) +
    label(
      'Услуга',
      select(
        'serviceId',
        selectOptions(
          visitServices,
          'id',
          (x) =>
            x.title +
            ' · ' +
            (prev?.serviceId === x.id ? prev.duration : x.duration) +
            ' мин' +
            (s.services.some((active) => active.id === x.id) ? '' : ' · в архиве'),
          v.serviceId,
        ),
      ),
      'ad-wide',
    ) +
    label(
      'Мастер',
      select(
        'masterId',
        option('', 'Любой мастер', v.masterId) + selectOptions(s.masters, 'id', 'name', v.masterId),
      ),
    ) +
    label(
      'Свободное время',
      select(
        'slot',
        '',
        'required data-selected="' + e(prev ? prev.time + '|' + prev.masterId : '') + '"',
      ),
    ) +
    label('Пожелания клиента', area('notes', v.notes, 'maxlength="1000"'), 'ad-wide') +
    (prev
      ? label(
          'Статус',
          select(
            'status',
            option('booked', 'Запланирован', v.status) + option('done', 'Завершить визит', v.status),
          ),
          'ad-wide',
        )
      : '') +
    '<p class="ad-form-note ad-wide" data-visit-hint></p>';
  return wrapper(
    'visit',
    id || '',
    prev ? 'Запись в салон' : 'Записать клиента',
    body,
    prev ? 'Сохранить изменения' : 'Создать запись',
    prev ? btn('confirm-cancel-visit', 'Отменить запись', '', 'ad-danger-link', id) : '',
  );
}
export function refreshVisit(form, s) {
  const f = form.elements,
    prev = byId(s.visits, form.dataset.id),
    desired = f.slot.value || f.slot.dataset.selected;
  let choices = f.date.value
    ? slots({
        date: f.date.value,
        serviceId: f.serviceId.value,
        masterId: f.masterId.value || undefined,
        excludeId: prev?.id,
      })
    : [];
  if (
    prev &&
    prev.date === f.date.value &&
    prev.serviceId === f.serviceId.value &&
    (!f.masterId.value || prev.masterId === f.masterId.value) &&
    !choices.some((x) => x.time === prev.time && x.masterId === prev.masterId)
  )
    choices = [{ time: prev.time, masterId: prev.masterId }, ...choices];
  f.slot.innerHTML = choices.length
    ? choices
        .map((x) =>
          option(
            x.time + '|' + x.masterId,
            x.time + (!f.masterId.value ? ' · ' + (byId(s.masters, x.masterId)?.name || '') : ''),
            desired,
          ),
        )
        .join('')
    : '<option value="">Нет доступного времени</option>';
  f.slot.dataset.selected = f.slot.value;
  const hint = form.querySelector('[data-visit-hint]');
  hint.hidden = !!choices.length;
  hint.textContent = choices.length ? '' : 'Выберите другого мастера, услугу или день.';
}
export function otherDialog(s, type, id, ui) {
  if (type === 'create')
    return (
      head('Создать запись') +
      '<div class="ad-chooser">' +
      btn('new-stay', 'Забронировать номер', 'bed', 'ad-choice') +
      btn('new-visit', 'Записать клиента в салон', 'scissors', 'ad-choice') +
      '</div>'
    );
  if (type === 'inquiry') {
    const entry = byId(s.inquiries, id);
    const body =
      '<div class="ad-wide ad-inquiry-read"><div>' +
      person(entry.name, fullDate(entry.date.slice(0, 10))) +
      '</div><p>' +
      e(entry.message) +
      '</p><small>' +
      [entry.phone, entry.email].filter(Boolean).map(e).join(' · ') +
      '</small></div>' +
      label(
        'Статус',
        select(
          'status',
          [
            ['new', 'Новое'],
            ['in-progress', 'В работе'],
            ['closed', 'Закрыто'],
          ]
            .map((pair) => option(pair[0], pair[1], entry.status))
            .join(''),
        ),
        'ad-wide',
      ) +
      label('Внутренняя заметка', area('note', entry.note, 'maxlength="900"'), 'ad-wide');
    return wrapper(
      'inquiry',
      id,
      entry.topic,
      body,
      'Сохранить обращение',
      '',
      'Обращение № ' + entry.id,
    );
  }
  if (type === 'shift') {
    const m = byId(s.masters, id),
      date = ui.salonDate,
      shift = getShift(id, date);
    const body =
      '<input type="hidden" name="date" value="' +
      e(date) +
      '">' +
      label(
        'Рабочий день',
        select(
          'mode',
          option('working', 'Рабочая смена', shift.off ? 'off' : 'working') +
            option('off', 'Выходной', shift.off ? 'off' : 'working'),
        ),
        'ad-wide',
      ) +
      label(
        'Начало смены',
        input('start', shift.start, 'time', 'required min="14:00" max="22:00" step="900"'),
      ) +
      label(
        'Конец смены',
        input('end', shift.end, 'time', 'required min="14:00" max="22:00" step="900"'),
      ) +
      msg('Изменение смены сразу обновит доступное время для клиентов.');
    return wrapper(
      'shift',
      id,
      'Смена мастера',
      body,
      'Сохранить смену',
      '',
      m.name + ' · ' + fullDate(date),
    );
  }
  if (type === 'room') {
    const room = byId(s.rooms, id);
    const body = label(
      'Состояние номера',
      select(
        'housekeeping',
        [
          ['ready', 'Готов к заселению'],
          ['dirty', 'Нужна уборка'],
          ['cleaning', 'Идёт уборка'],
        ]
          .map((x) => option(x[0], x[1], room.housekeeping))
          .join(''),
      ),
      'ad-wide',
    );
    return wrapper(
      'room',
      id,
      'Номер ' + room.number,
      body,
      'Обновить состояние',
      '',
      'Категория · ' + byId(s.categories, room.categoryId)?.title,
    );
  }
  if (type === 'category') {
    const c = byId(s.categories, id);
    const body =
      label('Название', input('title', c.title, 'text', 'required maxlength="140"'), 'ad-wide') +
      label(
        'Описание для гостя',
        area('description', c.description, 'required maxlength="2200"'),
        'ad-wide',
      ) +
      label(
        'Тариф за ночь в демоверсии, ₽',
        input('price', c.price, 'number', 'min="1" required'),
        'ad-wide',
      ) +
      msg('Изменения появятся на гостевом сайте после сохранения.');
    return wrapper('category', id, 'Редактировать категорию', body, 'Сохранить на сайте');
  }
  if (type === 'service' || type === 'new-service') {
    const service = byId(s.services, id) || { title: '', duration: 60, price: '' };
    const body =
      label(
        'Название услуги',
        input('title', service.title, 'text', 'required maxlength="140"'),
        'ad-wide',
      ) +
      label(
        'Длительность, мин',
        input('duration', service.duration, 'number', 'min="15" max="480" step="15" required'),
      ) +
      label('Демо-цена, ₽', input('price', service.price, 'number', 'min="0" required')) +
      msg('Новые записи используют обновлённую длительность.');
    return wrapper(
      type,
      id || '',
      type === 'new-service' ? 'Добавить услугу' : 'Услуга салона',
      body,
      type === 'new-service' ? 'Добавить в каталог' : 'Сохранить услугу',
    );
  }
  if (type === 'archive-master') {
    const master = byId(s.masters, id);
    return master
      ? wrapper(
          'archive-master',
          id,
          'Уволить мастера',
          masterArchiveBody(s, id, ui.archivePlan || {}) +
            '<div hidden class="ad-wide ad-plan-stale" role="status">Расписание изменилось. Обновите свободные окна перед подтверждением. ' +
            btn('refresh-archive', 'Обновить список', 'reset', 'ad-quiet') +
            '</div>',
          'Подтвердить увольнение',
          '',
          master.name,
        )
      : '';
  }
  if (type === 'restore-master' || type === 'archive-service' || type === 'restore-service') {
    const master = type === 'restore-master',
      restore = type !== 'archive-service',
      item = byId(master ? allMasters(s) : allServices(s), id);
    if (!item) return '';
    const text = master
      ? 'Мастер снова появится в расписании и будет доступен для записи.'
      : restore
        ? 'Гости и сотрудники смогут снова выбирать эту услугу для новой записи.'
        : 'Услуга исчезнет из новой записи. Ранее оформленные визиты останутся в расписании.';
    const title = master
      ? 'Вернуть мастера в команду'
      : restore
        ? 'Вернуть услугу в каталог'
        : 'Снять услугу с записи';
    return wrapper(
      type,
      id,
      title,
      msg(text),
      master ? 'Вернуть в команду' : restore ? 'Вернуть услугу' : 'Снять с записи',
      '',
      '' + (item.name || item.title),
    );
  }
  if (type === 'master' || type === 'new-master') {
    const m = byId(s.masters, id) || { name: '', role: '' };
    const body =
      label(
        'Имя мастера',
        input('name', m.name, 'text', 'required minlength="2" maxlength="90"'),
        'ad-wide',
      ) + label('Специализация', input('role', m.role, 'text', 'required maxlength="90"'), 'ad-wide');
    return wrapper(
      type,
      id || '',
      type === 'new-master' ? 'Принять мастера' : 'Профиль мастера',
      body,
      type === 'new-master' ? 'Принять в команду' : 'Сохранить профиль',
    );
  }
  if (type === 'guest-edit') {
    const g = groupedGuests(s).find((x) => x.key === id);
    const body =
      label('Имя гостя', input('name', g.name, 'text', 'required maxlength="90"'), 'ad-wide') +
      label('Телефон', input('phone', g.phone, 'tel', 'required maxlength="35"')) +
      label('Почта', input('email', g.email, 'email', 'maxlength="120"')) +
      msg('Контакты обновятся в бронях и записях этого гостя.');
    return wrapper('guest-edit', id, 'Контакты гостя', body, 'Сохранить контакты');
  }
  if (type === 'guest') {
    const g = groupedGuests(s).find((x) => x.key === id);
    return (
      head(g.name, 'Карточка гостя') +
      '<div class="ad-profile-action">' +
      btn('guest-edit', 'Изменить контакты', 'edit', 'ad-quiet', g.key) +
      '</div><div class="ad-summary-lines"><div><span>Телефон</span><b>' +
      e(g.phone || '—') +
      '</b></div><div><span>Почта</span><b>' +
      e(g.email || 'Не указана') +
      '</b></div></div><div class="ad-history"><h3>Проживание</h3>' +
      (g.stays
        .map((r) =>
          btn(
            'stay',
            fullDate(r.checkIn) +
              ' — ' +
              fullDate(r.checkOut) +
              ' · ' +
              (byId(s.rooms, r.roomId)?.number || '№ —'),
            'bed',
            'ad-choice',
            r.id,
          ),
        )
        .join('') || empty('История проживания пуста.', 'bed')) +
      '<h3>Салон</h3>' +
      (g.visits
        .map((v) =>
          btn(
            'visit',
            fullDate(v.date) + ', ' + v.time + ' · ' + byId(allServices(s), v.serviceId)?.title,
            'scissors',
            'ad-choice',
            v.id,
          ),
        )
        .join('') || empty('История визитов пуста.', 'scissors')) +
      '</div>'
    );
  }
  if (type === 'reset' || type === 'confirm-cancel-stay' || type === 'confirm-cancel-visit') {
    const reset = type === 'reset',
      hasLinked =
        type === 'confirm-cancel-stay' && s.visits.some((v) => v.stayId === id && v.status === 'booked');
    return (
      head(
        reset
          ? 'Восстановить демоданные?'
          : type === 'confirm-cancel-stay'
            ? 'Отменить бронирование?'
            : 'Отменить визит?',
      ) +
      '<p class="ad-confirm-copy">' +
      (reset
        ? 'Будут восстановлены исходные номера, смены, настройки и гости. Ваши тестовые изменения во всех трёх интерфейсах будут удалены.'
        : type === 'confirm-cancel-stay'
          ? hasLinked
            ? 'Номер снова станет доступен на эти даты. Запланированные визиты в салон по этой брони также будут отменены.'
            : 'Номер снова станет доступен на эти даты.'
          : 'Это время снова станет доступно для записи.') +
      '</p><form data-ad-form="' +
      e(type) +
      '" data-id="' +
      e(id) +
      '">' +
      foot(
        reset
          ? 'Восстановить'
          : type === 'confirm-cancel-stay'
            ? 'Да, отменить бронь'
            : 'Да, отменить визит',
        btn(
          reset ? 'close' : 'back-edit',
          reset ? 'Отмена' : type === 'confirm-cancel-stay' ? 'Вернуться к брони' : 'Вернуться к визиту',
          '',
          'ad-quiet',
        ),
      ) +
      '</form>'
    );
  }
  return '';
}

export { wrapper as adminForm, label as formLabel, input as formInput, select as formSelect, area as formArea, option as formOption };
