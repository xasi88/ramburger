// Правки из админки. Ильяс меняет название, цену, состав, фото, показ, «Хит», скидку.
// Правки лежат в Firebase (Firestore, документ menu/live, поле json: строка JSON) и ложатся поверх data/menu.js.
// Здесь: адрес базы, чтение без библиотеки Firebase, сложение правок с меню, что видит гость.
// Файлом пользуются меню (js/boot.js), админка (admin/) и тесты.
//
// Вид правок: { "items": { "<id>": { name, desc, price, options, photo, icon, hidden, off, hit, discount, section, added, deleted } },
//               "sections": { "<id>": { hidden, title, added } },
//               "order": { night, pickup, places: [{ name, price }], pay: ["..."] },
//               "sort": { "sections": ["<id>", ...], "items": { "<id раздела>": ["<id блюда>", ...] } } }
// added: блюдо или раздел создан в админке, в data/menu.js его нет. Новый раздел встаёт в конец меню.
// deleted: блюдо удалено (админка или бот, 2026-11-08). Гость его не видит, правка остаётся: блюдо можно вернуть.
// order: заказ у гостя. night: ночью заказы принимаем. pickup: можно забрать самому.
// price null: цена доставки по тексту noPrice (data/menu.js, у Рамбургера «по тарифу такси»), его нет: «цену скажет кафе».
// sort: порядок разделов и блюд, который кафе задало вручную в админке (2026-11-09). Чего нет в списке, стоит после, в прежнем порядке.

(function (root) {
  // Адрес проекта Firebase. Это не секрет: доступ решают правила базы (firestore.rules).
  const FB = {
    apiKey: "AIzaSyA0buOuB5kFWkP_D_GPRhEsceYOSkSIwdY",
    authDomain: "ramburger-menu.firebaseapp.com",
    projectId: "ramburger-menu",
    appId: "1:148045170591:web:b09d6d64c5f7534d9adfaa",
  };
  const DOC_URL = `https://firestore.googleapis.com/v1/projects/${FB.projectId}/databases/(default)/documents/menu/live?key=${FB.apiKey}`;
  const CACHE = "ramburger-live";

  // Что можно менять у блюда
  const FIELDS = ["name", "desc", "price", "options", "photo", "icon", "hidden", "off", "hit", "discount", "deleted"];

  const copy = (o) => JSON.parse(JSON.stringify(o));

  function apply(it, p) {
    FIELDS.forEach((k) => { if (k in p) it[k] = copy(p[k]); });
    // Цена «от» у блюда с размерами всегда равна меньшему размеру
    if (it.options && it.options.length) it.price = Math.min(...it.options.map((o) => Number(o.price) || 0));
    return it;
  }

  // Цена доставки: число от 0 или null (цену скажет кафе)
  const fee = (v) => (v === null || v === undefined || v === "" || !isFinite(Number(v)) ? null : Math.max(0, Math.round(Number(v))));

  // Заказ у гостя: из файла, поверх правки админки
  function orderOf(base, p) {
    const o = Object.assign({ night: false, pickup: true, places: [], pay: [], noPrice: "" }, copy(base || {}));
    p = p && typeof p === "object" ? p : {};
    if (typeof p.night === "boolean") o.night = p.night;
    if (typeof p.pickup === "boolean") o.pickup = p.pickup;
    if (Array.isArray(p.places)) o.places = p.places;
    if (Array.isArray(p.pay)) o.pay = p.pay;
    o.places = o.places.filter((x) => x && String(x.name || "").trim()).map((x) => ({ name: String(x.name).trim(), price: fee(x.price) }));
    o.pay = o.pay.map((x) => String(x || "").trim()).filter(Boolean);
    o.noPrice = String(o.noPrice || "").trim() || "цену скажет кафе";
    return o;
  }

  // Открыто ли кафе сейчас: часы по Москве
  function openNow(cafe, date) {
    const h = Number(new Intl.DateTimeFormat("ru-RU", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Moscow" }).format(date || new Date()));
    return h >= cafe.open && h < cafe.close;
  }

  // Меню из файла + правки админки. Удалённые блюда убираются; keep.deleted оставляет их (админка, бот).
  function merge(base, live, keep) {
    const data = copy(base);
    live = live && typeof live === "object" ? live : {};
    data.order = orderOf(data.order, live.order);
    const items = live.items || {}, secs = live.sections || {};
    const sectionOf = (id) => data.menu.find((g) => g.id === id);
    // Новые разделы из админки: в конец меню, до блюд, чтобы блюда нашли свой раздел
    Object.keys(secs).forEach((id) => {
      const s = secs[id];
      if (s && s.added && String(s.title || "").trim() && !sectionOf(id)) data.menu.push({ id, title: String(s.title).trim(), note: "", items: [], added: true });
    });
    Object.keys(items).forEach((id) => {
      const p = items[id];
      if (!p || typeof p !== "object") return;
      const from = data.menu.find((g) => g.items.some((x) => x.id === id));
      let it;
      if (from) {
        it = apply(from.items.find((x) => x.id === id), p);
        const to = p.section && p.section !== from.id && sectionOf(p.section);
        if (to) { from.items.splice(from.items.indexOf(it), 1); to.items.push(it); }
      } else if (p.added) {
        it = apply({ id, name: "", desc: "", price: 0, icon: "plate" }, p);
        (sectionOf(p.section) || data.menu[data.menu.length - 1]).items.push(it);
      }
    });
    data.menu.forEach((g) => { if (secs[g.id] && typeof secs[g.id].hidden === "boolean") g.hidden = secs[g.id].hidden; });
    // Порядок, заданный вручную: разделы, потом блюда в каждом разделе
    const sort = live.sort && typeof live.sort === "object" ? live.sort : {};
    data.menu = byList(data.menu, sort.sections);
    const its = sort.items && typeof sort.items === "object" ? sort.items : {};
    data.menu.forEach((g) => { g.items = byList(g.items, its[g.id]); });
    if (!(keep && keep.deleted)) data.menu.forEach((g) => { g.items = g.items.filter((it) => !it.deleted); });
    return data;
  }

  // Порядок по списку id: что в списке, по списку; чего нет, после, в прежнем порядке
  function byList(list, ids) {
    if (!Array.isArray(ids) || !ids.length) return list;
    const at = new Map(ids.map((id, i) => [String(id), i]));
    const pos = (x) => (at.has(x.id) ? at.get(x.id) : ids.length);
    return list.map((x, i) => [x, i]).sort((a, b) => pos(a[0]) - pos(b[0]) || a[1] - b[1]).map((x) => x[0]);
  }

  // Гость видит блюдо, если оно не скрыто и не удалено, у него есть название и цена
  function priced(it) {
    if (it.options && it.options.length) return it.options.every((o) => Number(o.price) > 0 && String(o.name || "").trim());
    return Number(it.price) > 0;
  }
  const named = (it) => !!String(it.name || "").trim();
  const visible = (it) => !it.hidden && !it.deleted && named(it) && priced(it);

  // Порядок показа (2026-11-08, решение автора): в разделе сначала блюда в меню, потом «нет в наличии»,
  // скрытые с названием, фото без названия или цены, удалённые. Внутри группы порядок меню.
  // Блюдо, которое снова показали, встаёт на прежнее место. Порядок внутри группы кафе задаёт вручную (sort).
  const rank = (it) => (it.deleted ? 4 : !named(it) || !priced(it) ? 3 : it.hidden ? 2 : it.off ? 1 : 0);
  const byRank = (list, r) => list.map((x, i) => [x, i]).sort((a, b) => r(a[0]) - r(b[0]) || a[1] - b[1]).map((x) => x[0]);
  const sortItems = (items) => byRank(items, rank);
  // Разделы: видимые, потом скрытые (админка и бот; гость скрытых разделов не видит)
  const sortSections = (menu) => byRank(menu, (g) => (g.hidden ? 1 : 0));

  // Правки из базы. Документа ещё нет: правок нет (live: null).
  async function fetchLive(ms) {
    if (!FB.projectId) return { live: null };
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = setTimeout(() => ctrl && ctrl.abort(), ms);
    try {
      const res = await fetch(DOC_URL, { cache: "no-store", signal: ctrl && ctrl.signal });
      if (res.status === 404) return { live: null };
      if (!res.ok) throw new Error("Firestore " + res.status);
      const doc = await res.json();
      const s = doc.fields && doc.fields.json && doc.fields.json.stringValue;
      return { live: s ? JSON.parse(s) : null };
    } finally {
      clearTimeout(timer);
    }
  }

  root.Live = { FB, CACHE, FIELDS, merge, visible, priced, rank, sortItems, sortSections, fetchLive, orderOf, openNow, fee };

  // В меню файл стоит в <head> с отметкой data-early: запрос к базе уходит сразу, пока грузится страница.
  // Первый запрос к серверу Google бывает дольше 2 секунд (2026-11-05: 2,5 с, меню взяло старую копию).
  const me = typeof document !== "undefined" && document.currentScript;
  if (me && me.hasAttribute("data-early")) root.Live.pending = fetchLive(10000);
})(typeof window !== "undefined" ? window : globalThis);
