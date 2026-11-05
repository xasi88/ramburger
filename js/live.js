// Правки из админки. Ильяс меняет название, цену, состав, фото, показ, «Хит», скидку.
// Правки лежат в Firebase (Firestore, документ menu/live, поле json: строка JSON) и ложатся поверх data/menu.js.
// Здесь: адрес базы, чтение без библиотеки Firebase, сложение правок с меню, что видит гость.
// Файлом пользуются меню (js/boot.js), админка (admin/) и тесты.
//
// Вид правок: { "items": { "<id>": { name, desc, price, options, photo, icon, hidden, off, hit, discount, section, added } },
//               "sections": { "<id>": { "hidden": true } } }
// added: блюдо создано в админке, в data/menu.js его нет.

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
  const FIELDS = ["name", "desc", "price", "options", "photo", "icon", "hidden", "off", "hit", "discount"];

  const copy = (o) => JSON.parse(JSON.stringify(o));

  function apply(it, p) {
    FIELDS.forEach((k) => { if (k in p) it[k] = copy(p[k]); });
    // Цена «от» у блюда с размерами всегда равна меньшему размеру
    if (it.options && it.options.length) it.price = Math.min(...it.options.map((o) => Number(o.price) || 0));
    return it;
  }

  // Меню из файла + правки админки
  function merge(base, live) {
    const data = copy(base);
    if (!live || typeof live !== "object") return data;
    const items = live.items || {}, secs = live.sections || {};
    const sectionOf = (id) => data.menu.find((g) => g.id === id);
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
    return data;
  }

  // Гость видит блюдо, если оно не скрыто, у него есть название и цена
  function priced(it) {
    if (it.options && it.options.length) return it.options.every((o) => Number(o.price) > 0 && String(o.name || "").trim());
    return Number(it.price) > 0;
  }
  const visible = (it) => !it.hidden && !!String(it.name || "").trim() && priced(it);

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

  root.Live = { FB, CACHE, FIELDS, merge, visible, priced, fetchLive };

  // В меню файл стоит в <head> с отметкой data-early: запрос к базе уходит сразу, пока грузится страница.
  // Первый запрос к серверу Google бывает дольше 2 секунд (2026-11-05: 2,5 с, меню взяло старую копию).
  const me = typeof document !== "undefined" && document.currentScript;
  if (me && me.hasAttribute("data-early")) root.Live.pending = fetchLive(10000);
})(typeof window !== "undefined" ? window : globalThis);
