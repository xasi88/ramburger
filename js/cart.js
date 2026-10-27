// Корзина: количество, суммы, скидки.
// Ключ строки: "hotdog" (блюдо), "shawarma@2" (блюдо, вариант 2), "combo:x" (комбо со своей ценой).
// Корзина хранится в браузере гостя, чтобы не пропасть при перезагрузке.

window.Cart = (function () {
  const KEY = "ramburger-cart";
  const D = window.Data;
  const byId = D.dish;

  // Что лежит под ключом: название, цена, полная цена до скидки, картинка
  function info(key) {
    if (key.startsWith("combo:")) {
      const c = D.combo(key.slice(6));
      if (!c) return null;
      return { key, name: `Комбо «${c.name}»`, price: c.price, full: D.comboFull(c), art: c, combo: c };
    }
    const [id, o] = key.split("@");
    const it = byId[id];
    if (!it || it.off) return null;
    const hasOpts = it.options && it.options.length;
    if (hasOpts && (o === undefined || !it.options[o])) return null;
    if (!hasOpts && o !== undefined) return null;
    const base = D.optPrice(it, o);
    // «Шаурма, большая»: размер сразу виден и гостю, и менеджеру в WhatsApp
    return { key, id, name: hasOpts ? `${it.name}, ${it.options[o].name.toLowerCase()}` : it.name, price: D.cut(base, it.discount), full: base, art: it, item: it };
  }

  let state = {};
  try { state = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { state = {}; }
  for (const k of Object.keys(state)) if (!info(k) || !(state[k] > 0)) delete state[k];

  const listeners = [];
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* без хранилища корзина живёт до перезагрузки */ }
    listeners.forEach((fn) => fn());
  }

  const rub = (n) => n.toLocaleString("ru-RU") + " ₽";
  const sum = () => Object.keys(state).reduce((s, k) => s + info(k).price * state[k], 0);

  // Итог со скидкой на заказ от суммы
  function summary() {
    const s = sum();
    const b = D.bonus();
    const discount = b && s >= b.min ? Math.round((s * b.percent) / 100) : 0;
    return { sum: s, discount, total: s - discount, bonus: b, need: b && s < b.min ? b.min - s : 0 };
  }

  return {
    byId,
    rub,
    info,
    qty: (key) => state[key] || 0,
    // Сколько порций блюда во всех вариантах
    qtyDish: (id) => Object.keys(state).reduce((s, k) => (k === id || k.startsWith(id + "@") ? s + state[k] : s), 0),
    add(key) { if (!info(key)) return; state[key] = (state[key] || 0) + 1; save(); },
    sub(key) { if (!state[key]) return; state[key] -= 1; if (!state[key]) delete state[key]; save(); },
    clear() { state = {}; save(); },
    lines: () => Object.keys(state).map((k) => ({ key: k, info: info(k), qty: state[k] })),
    count: () => Object.values(state).reduce((a, b) => a + b, 0),
    total: () => summary().total,
    summary,
    onChange(fn) { listeners.push(fn); },
  };
})();
