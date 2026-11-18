import {
  getState,
  subscribe,
  today,
  dayOffset,
  saveStay,
  cancelStay,
  setHousekeeping,
  updateInquiry,
} from "./store.js";
import { stayDialog, refreshStay, otherDialog } from "./adminDialogs.js";
import {
  escapeHtml as h,
  icon,
  emark,
  shortDate,
  fullDate,
  statusPill,
} from "./adminView.js";
import { hotel } from "./hotelData.js";

const sections = [
  ["desk", "bell", "Журнал смены"],
  ["rooms", "key", "Готовность номеров"],
  ["inquiries", "inbox", "Обращения"],
  ["contacts", "phone", "Контакты"],
];
const filters = [
  ["moves", "Все движения"],
  ["arrivals", "Заезды"],
  ["departures", "Выезды"],
  ["living", "Проживают"],
];
const roomsFilter = [
  ["all", "Все номера"],
  ["attention", "К подготовке"],
  ["dirty", "Нужна уборка"],
  ["cleaning", "На уборке"],
  ["ready", "Готовы"],
];
const inquiryFilter = [
  ["active", "Открытые"],
  ["new", "Новые"],
  ["in-progress", "В работе"],
  ["closed", "Закрытые"],
  ["all", "Все"],
];
const byId = (items, id) => items.find((r) => r.id === id);
const route = () =>
  sections.some(([key]) => "#" + key === location.hash)
    ? location.hash.slice(1)
    : "desk";
const tabs = (list, active, key) =>
  '<div class="rx-tabs" role="group" aria-label="Фильтр">' +
  list
    .map(
      ([id, label]) =>
        `<button type="button" data-rx-filter="${key}" data-id="${id}" aria-pressed="${active === id}">${label}</button>`,
    )
    .join("") +
  "</div>";
const noItems = (label) =>
  `<div class="rx-blank">${icon("list", 24)}<p>${h(label)}</p></div>`;
const dateText = (d) =>
  shortDate(d, { weekday: "long", day: "numeric", month: "long" });
function searchMatches(fields, value) {
  const words = value.trim().toLocaleLowerCase("ru");
  return (
    fields.some((field) =>
      String(field ?? "")
        .toLocaleLowerCase("ru")
        .includes(words),
    ) ||
    (/^[+\d\s()-]+$/.test(words) &&
      words.replace(/\D/g, "").length >= 3 &&
      fields.some((f) =>
        String(f || "")
          .replace(/\D/g, "")
          .includes(words.replace(/\D/g, "")),
      ))
  );
}
const endOfStay = (stay) => stay.checkedOutOn || stay.checkOut;
const arrives = (s, d) => s.status !== "cancelled" && s.checkIn === d;
const departs = (s, d) => s.status !== "cancelled" && endOfStay(s) === d;
function lives(s, date) {
  if (s.checkIn > date) return false;
  if (date === today()) return s.status === "checked-in";
  if (date > today())
    return ["booked", "checked-in"].includes(s.status) && s.checkOut > date;
  return (
    ["checked-in", "checked-out"].includes(s.status) && endOfStay(s) > date
  );
}
const datePicker = (date) =>
  `<div class="rx-date"><button data-rx="previous" aria-label="Предыдущий день">${icon("left", 16)}</button><input data-rx-date type="date" aria-label="Дата журнала" value="${h(date)}"><button data-rx="next" aria-label="Следующий день">${icon("right", 16)}</button><button data-rx="today" class="rx-today">Сегодня</button></div>`;
const labelForRoom = (s, stay) => byId(s.rooms, stay.roomId)?.number || "—";
const groupName = (s, record) =>
  byId(s.categories, record.categoryId)?.shortTitle ||
  byId(s.categories, record.categoryId)?.title ||
  "";
const emptyText = "На выбранную дату записей в этой группе нет.";

function staysView(s, ui) {
  const { date, moves, query } = ui;
  const searching = Boolean(query.trim());
  const records = s.stays
    .filter((stay) => {
      if (searching)
        return searchMatches(
          [stay.name, stay.phone, stay.email, stay.id, labelForRoom(s, stay)],
          query,
        );
      if (moves === "arrivals") return arrives(stay, date);
      if (moves === "departures") return departs(stay, date);
      if (moves === "living") return lives(stay, date);
      return arrives(stay, date) || departs(stay, date);
    })
    .sort(
      (a, b) =>
        a.checkIn.localeCompare(b.checkIn) ||
        a.name.localeCompare(b.name, "ru"),
    );
  return (
    `<div class="rx-list-cap"><h3>${searching ? "Результаты по всем датам" : "Гости на выбранную дату"}</h3><span>${records.length}</span></div>` +
    (records.length
      ? records
          .map((r) => {
            const pendingIn =
              r.status === "booked" &&
              r.checkIn <= today() &&
              today() < r.checkOut;
            const inHouse = r.status === "checked-in";
            const next = pendingIn
              ? ["arrival", "Заселить"]
              : inHouse
                ? ["departure", "Выселить"]
                : null;
            return `<article class="rx-stay" data-rx-stay="${h(r.id)}"><button class="rx-stay-main" data-rx="stay" data-id="${h(r.id)}"><span class="rx-room-no"><small>Номер</small>${h(labelForRoom(s, r))}</span><span class="rx-name"><b>${h(r.name)}</b><small>${h(shortDate(r.checkIn))} — ${h(shortDate(endOfStay(r)))} · ${h(r.id)}</small></span></button><div class="rx-stay-state">${statusPill(r.status)}</div>${next ? `<button class="rx-simple" data-rx="${next[0]}" data-id="${h(r.id)}">${next[1]} ${icon("right", 14)}</button>` : `<button class="rx-simple" data-rx="stay" data-id="${h(r.id)}">Открыть ${icon("right", 14)}</button>`}</article>`;
          })
          .join("")
      : noItems(
          searching
            ? "Бронь не найдена. Проверьте имя, телефон или номер брони."
            : emptyText,
        ))
  );
}

function roomsView(s, ui) {
  const list = s.rooms.filter(
    (room) =>
      (ui.clean === "all" ||
        (ui.clean === "attention"
          ? room.housekeeping !== "ready"
          : room.housekeeping === ui.clean)) &&
      searchMatches([room.number, groupName(s, room)], ui.roomQuery),
  );
  return (
    `<div class="rx-list-cap"><h3>Номера</h3><span>${list.length}</span></div>` +
    (list.length
      ? `<div class="rx-room-grid">${list
          .map((room) => {
            const guest = s.stays.find(
              (r) => r.roomId === room.id && r.status === "checked-in",
            );
            return `<button data-rx="room" data-id="${h(room.id)}" class="rx-room-card"><span class="rx-room-head"><b>№ ${h(room.number)}</b>${icon("key", 19)}</span><span>${h(groupName(s, room))}</span>${statusPill(room.housekeeping)}<small>${guest ? "Проживает · " + h(guest.name) : "Сейчас не заселён"}</small></button>`;
          })
          .join("")}</div>`
      : noItems("Номеров по выбранным условиям нет."))
  );
}

function inquiriesView(s, ui) {
  const list = s.inquiries
    .filter(
      (q) =>
        ui.inbox === "all" ||
        (ui.inbox === "active" ? q.status !== "closed" : q.status === ui.inbox),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    `<div class="rx-list-cap"><h3>Сообщения гостей</h3><span>${list.length}</span></div>` +
    (list.length
      ? list
          .map(
            (q) =>
              `<button data-rx="inquiry" data-id="${h(q.id)}" class="rx-inquiry"><span><small>${h(q.topic)} · ${h(fullDate(q.date.slice(0, 10)))}</small><b>${h(q.name)}</b><span>${h(q.message)}</span></span>${statusPill(q.status)}${icon("right", 16)}</button>`,
          )
          .join("")
      : noItems("Обращений с таким статусом нет."))
  );
}

function contactsView() {
  const contacts = [
    ["Служба бронирования", [...hotel.phones, hotel.email]],
    ["Служба продаж", ["sales@uhtl.ru"]],
    ["Кафе и банкеты", ["+7 (499) 147-79-74", "+7 (499) 147-59-60"]],
    ["Экскурсионное бюро", ["+7 (495) 363-35-84"]],
  ];
  return `<div class="rx-directory">${contacts.map(([name, values]) => `<article><h3>${h(name)}</h3>${values.map((v) => `<a href="${v.includes("@") ? "mailto:" + h(v) : "tel:" + v.replace(/[^\d+]/g, "")}">${h(v)} ${icon("outward", 14)}</a>`).join("")}</article>`).join("")}</div>`;
}

const searchField = (name, value, label) =>
  `<label class="rx-search">${icon("search", 18)}<input type="search" data-rx-search="${name}" placeholder="${label}" aria-label="${label}" value="${h(value)}"></label>`;
export function mountReception(root) {
  let state = getState(),
    section = route(),
    focused = null,
    expected = null,
    locked = false,
    toastTimer,
    savedDate = today();
  const ui = {
    date: savedDate,
    moves: "moves",
    query: "",
    clean: "all",
    roomQuery: "",
    inbox: "active",
  };
  root.innerHTML = `<div class="rx-app"><a class="rx-skip" href="#rx-main">К содержанию</a><header class="rx-mast"><div class="rx-width"><div class="rx-brand">${emark}<div><strong>Университетская</strong><span>Служба размещения</span></div></div><a class="rx-site" href="../universitetskaya-hotel-demo/">Сайт гостиницы ${icon("outward", 15)}</a></div></header><main class="rx-width rx-main" id="rx-main" tabindex="-1"><section class="rx-hero"><div class="rx-hero-copy"><p>Гостиница · Москва</p><h1>Стойка регистрации</h1><div class="rx-clock">${icon("clock", 15)}<time></time><span>МСК</span></div></div><div class="rx-hero-image" aria-hidden="true"></div></section><nav class="rx-nav" aria-label="Разделы стойки">${sections.map(([id, g, label]) => `<a data-rx-nav="${id}" href="#${id}">${icon(g, 17)}${label}${id === "inquiries" ? "<span data-rx-unread></span>" : ""}</a>`).join("")}</nav><div class="rx-body"></div></main><dialog class="ad-dialog rx-dialog" aria-label="Действие стойки"></dialog><div role="status" aria-live="polite" class="rx-toast" hidden></div></div>`;
  const app = root.querySelector(".rx-app"),
    body = root.querySelector(".rx-body"),
    modal = root.querySelector("dialog"),
    toast = root.querySelector(".rx-toast");
  function renderClock() {
    root.querySelector("time").textContent = new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
    if (savedDate !== today()) {
      if (ui.date === savedDate) ui.date = today();
      savedDate = today();
      render();
    }
  }
  function notice(str) {
    clearTimeout(toastTimer);
    toast.textContent = str;
    toast.hidden = false;
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 5200);
  }
  function renderList() {
    const list = body.querySelector("[data-rx-list]");
    if (list)
      list.innerHTML =
        section === "desk"
          ? staysView(state, ui)
          : section === "rooms"
            ? roomsView(state, ui)
            : inquiriesView(state, ui);
  }
  function render() {
    const previous = document.activeElement;
    const preserve =
      body.contains(previous) && previous.matches("input,button,a");
    const filterFocus = preserve
      ? previous.outerHTML.match(/data-rx(?:-[\w-]+)?="[^"]*"/)?.[0]
      : null;
    const focusId = previous?.dataset.id;
    const cursor = previous?.type === "search" ? previous.selectionStart : null;
    const dirty = state.rooms.filter((r) => r.housekeeping !== "ready").length,
      unread = state.inquiries.filter((q) => q.status === "new").length;
    root.querySelector("[data-rx-unread]").textContent = unread || "";
    for (const link of root.querySelectorAll("[data-rx-nav]")) {
      if (link.dataset.rxNav === section)
        link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    if (section === "desk") {
      const counts = [
        [
          "arrivals",
          "in",
          "Заезды",
          state.stays.filter((s) => arrives(s, ui.date)).length,
        ],
        [
          "departures",
          "out",
          "Выезды",
          state.stays.filter((s) => departs(s, ui.date)).length,
        ],
        [
          "living",
          "bed",
          "Проживают",
          state.stays.filter((s) => lives(s, ui.date)).length,
        ],
      ];
      body.innerHTML = `<section class="rx-panel rx-log"><div class="rx-title"><div><p class="rx-overline">${h(dateText(ui.date))}</p><h2>Журнал смены</h2></div>${datePicker(ui.date)}</div><div class="rx-counts">${counts.map(([type, glyph, label, n]) => `<button data-rx-filter="moves" data-id="${type}" aria-pressed="${ui.moves === type}">${icon(glyph, 19)}<span>${label}</span><b>${n}</b></button>`).join("")}</div>${searchField("query", ui.query, "Имя, телефон, бронь или номер комнаты")}${tabs(filters, ui.moves, "moves")}<div data-rx-list></div></section><aside class="rx-aside"><section class="rx-key-card">${icon("key", 32)}<h2>Новая бронь</h2><p>Оформите проживание для гостя на стойке.</p><button class="rx-primary" data-rx="new">${icon("plus", 16)} Оформить бронь</button></section><section class="rx-panel rx-status"><h2>Задачи стойки</h2><a href="#rooms" data-rx-task="clean">${icon("clean", 19)}<span>Номера к подготовке</span><b>${dirty}</b></a><a href="#inquiries" data-rx-task="inbox">${icon("inbox", 19)}<span>Новые обращения</span><b>${unread}</b></a></section></aside>`;
    } else if (section === "rooms") {
      body.innerHTML = `<section class="rx-panel rx-wide"><div class="rx-title"><div><p class="rx-overline">Номерной фонд</p><h2>Готовность номеров</h2></div></div>${searchField("roomQuery", ui.roomQuery, "Номер комнаты или категория")}${tabs(roomsFilter, ui.clean, "clean")}<div data-rx-list></div></section>`;
    } else if (section === "inquiries") {
      body.innerHTML = `<section class="rx-panel rx-wide"><div class="rx-title"><div><p class="rx-overline">Гостевой сайт</p><h2>Обращения</h2></div></div>${tabs(inquiryFilter, ui.inbox, "inbox")}<div data-rx-list></div></section>`;
    } else {
      body.innerHTML = `<section class="rx-panel rx-wide"><div class="rx-title"><div><p class="rx-overline">Справочная стойки</p><h2>Контакты гостиницы</h2></div></div>${contactsView()}<p class="rx-address">${icon("pin", 17)}${h(hotel.address)} · метро «${h(hotel.metro)}»</p></section>`;
    }
    renderList();
    if (filterFocus) {
      const el = body.querySelector(
        "[" +
          filterFocus +
          "]" +
          (focusId ? '[data-id="' + CSS.escape(focusId) + '"]' : ""),
      );
      el?.focus({ preventScroll: true });
      if (el && cursor !== null && el.type === "search")
        el.setSelectionRange(cursor, cursor);
    }
  }
  function close() {
    if (modal.open) modal.close();
    if (focused?.isConnected) focused.focus({ preventScroll: true });
    else if (focused?.dataset.rx) {
      const replacement = body.querySelector(
        '[data-rx="' +
          CSS.escape(focused.dataset.rx) +
          '"]' +
          (focused.dataset.id
            ? '[data-id="' + CSS.escape(focused.dataset.id) + '"]'
            : ""),
      );
      (replacement || root.querySelector('[aria-current="page"]'))?.focus({
        preventScroll: true,
      });
    }
    focused = null;
    expected = null;
  }
  function open(kind, id = "", origin = null) {
    state = getState();
    const item =
      kind === "inquiry"
        ? byId(state.inquiries, id)
        : kind === "room"
          ? byId(state.rooms, id)
          : byId(state.stays, id);
    if (id && !item) {
      notice("Запись больше не доступна.");
      return;
    }
    if (!modal.open) {
      focused = origin || document.activeElement;
      expected = item ? { ...item } : null;
    }
    let markup;
    if (kind === "stay" || kind === "new")
      markup = stayDialog(state, id, {
        date: ui.date < today() ? today() : ui.date,
      });
    else if (kind === "arrival" || kind === "departure") {
      const arriving = kind === "arrival",
        title = arriving ? "Заселить гостя?" : "Оформить выезд?",
        action = arriving ? "Заселить" : "Подтвердить выезд",
        room = byId(state.rooms, item.roomId);
      const details = arriving
        ? "После подтверждения гость появится в списке проживающих."
        : "После выезда номер будет отмечен для уборки.";
      markup = `<div class="ad-dialog-head"><div><h2>${title}</h2><p>Бронь ${h(item.id)}</p></div><button type="button" class="ad-icon-btn" data-ad-action="close" aria-label="Закрыть окно">${icon("close")}</button></div><form data-ad-form="${kind}" data-id="${h(id)}"><div class="rx-confirm"><b>${h(item.name)}</b><p>Номер ${h(room?.number)} · ${h(fullDate(item.checkIn))} — ${h(fullDate(item.checkOut))}</p><p>${details}</p>${arriving && room?.housekeeping !== "ready" ? "<p>Перед заселением отметьте номер готовым в разделе «Готовность номеров».</p>" : ""}</div><p class="ad-form-error" role="alert" hidden></p><div class="ad-dialog-foot"><button type="button" data-ad-action="close" class="ad-quiet">Назад</button><button type="submit" class="ad-btn ad-primary">${action}</button></div></form>`;
    } else markup = otherDialog(state, kind, id, {});
    modal.innerHTML = markup;
    const header = modal.querySelector("h2");
    if (header) {
      header.id = "rx-dialog-name";
      modal.setAttribute("aria-labelledby", header.id);
    }
    const form = modal.querySelector("form");
    if (form?.dataset.adForm === "stay") refreshStay(form, state);
    if (!modal.open) modal.showModal();
    else
      (
        form?.querySelector("input:not([type=hidden]),button[type=submit]") ||
        modal.querySelector("button")
      )?.focus();
  }
  function handleClick(e) {
    if (e.target.closest(".rx-skip")) {
      e.preventDefault();
      root.querySelector("#rx-main").focus();
      return;
    }
    const task = e.target.closest("[data-rx-task]")?.dataset.rxTask;
    if (task === "clean") {
      ui.clean = "attention";
      ui.roomQuery = "";
    }
    if (task === "inbox") ui.inbox = "new";
    const el = e.target.closest("button");
    if (!el || !app.contains(el)) return;
    const { rx: act, rxFilter, adAction, id } = el.dataset;
    if (adAction === "close") {
      close();
      return;
    }
    if (adAction === "back-edit") {
      open("stay", modal.querySelector("form").dataset.id);
      return;
    }
    if (adAction === "confirm-cancel-stay") {
      open("confirm-cancel-stay", id);
      return;
    }
    if (rxFilter) {
      ui[rxFilter] = id;
      if (rxFilter === "moves") ui.query = "";
      render();
      return;
    }
    if (["previous", "next", "today"].includes(act)) {
      ui.date =
        act === "today" ? today() : dayOffset(act === "next" ? 1 : -1, ui.date);
      ui.query = "";
      render();
      return;
    }
    if (
      ["stay", "new", "arrival", "departure", "inquiry", "room"].includes(act)
    )
      open(act, id, el);
  }
  function handleInput(e) {
    if (e.target.dataset.rxSearch) {
      ui[e.target.dataset.rxSearch] = e.target.value;
      renderList();
    }
  }
  function handleChange(e) {
    if (e.target.matches("[data-rx-date]") && e.target.value) {
      ui.date = e.target.value;
      ui.query = "";
      render();
      return;
    }
    const form = e.target.closest('[data-ad-form="stay"]');
    if (!form) return;
    if (
      e.target.name === "checkIn" &&
      form.elements.checkOut.value <= e.target.value &&
      e.target.value
    )
      form.elements.checkOut.value = dayOffset(1, e.target.value);
    if (
      ["checkIn", "checkOut", "categoryId", "guests", "roomId"].includes(
        e.target.name,
      )
    )
      refreshStay(form, getState());
  }
  async function submit(e) {
    const f = e.target.closest("form[data-ad-form]");
    if (!f) return;
    e.preventDefault();
    if (locked) return;
    locked = true;
    const submit = f.querySelector("[type=submit]"),
      error = f.querySelector(".ad-form-error"),
      { adForm: kind, id } = f.dataset,
      values = Object.fromEntries(new FormData(f));
    submit.disabled = true;
    error.hidden = true;
    try {
      let msg;
      if (kind === "stay") {
        const result = await saveStay(
          { ...values, ...(id ? { id } : {}) },
          expected,
        );
        msg = id ? "Бронь обновлена" : "Создана бронь " + result.id;
      } else if (kind === "confirm-cancel-stay") {
        await cancelStay(id, expected);
        msg = "Бронь отменена";
      } else if (kind === "room") {
        if (byId(getState().rooms, id)?.housekeeping !== expected?.housekeeping)
          throw Error("Состояние номера изменилось. Откройте его ещё раз.");
        await setHousekeeping(id, values.housekeeping);
        msg = "Состояние номера обновлено";
      } else if (kind === "inquiry") {
        await updateInquiry(id, values, expected);
        msg = "Обращение обновлено";
      } else if (kind === "arrival" || kind === "departure") {
        const arriving = kind === "arrival";
        await saveStay(
          { id, status: arriving ? "checked-in" : "checked-out" },
          expected,
        );
        msg = arriving
          ? "Гость заселён"
          : "Выезд оформлен. Номер передан на уборку.";
      } else return;
      close();
      notice(msg);
    } catch (err) {
      error.textContent = err.message || "Изменения не сохранены.";
      error.hidden = false;
    } finally {
      locked = false;
      submit.disabled = false;
    }
  }
  function hashChange() {
    section = route();
    if (modal.open) close();
    render();
  }
  function escape(e) {
    e.preventDefault();
    close();
  }
  app.addEventListener("click", handleClick);
  app.addEventListener("input", handleInput);
  app.addEventListener("change", handleChange);
  app.addEventListener("submit", submit);
  modal.addEventListener("cancel", escape);
  window.addEventListener("hashchange", hashChange);
  const off = subscribe(() => {
    state = getState();
    render();
  });
  render();
  renderClock();
  const interval = setInterval(renderClock, 30000);
  return () => {
    off();
    clearTimeout(toastTimer);
    clearInterval(interval);
    window.removeEventListener("hashchange", hashChange);
    modal.removeEventListener("cancel", escape);
    app.removeEventListener("click", handleClick);
    app.removeEventListener("input", handleInput);
    app.removeEventListener("change", handleChange);
    app.removeEventListener("submit", submit);
  };
}
