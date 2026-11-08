// Данные для сайта: меню из data/menu.js с правками админки (js/live.js) и общие расчёты цен.
// Гость видит только блюда с названием и ценой, не скрытые, из включённых разделов.
// Блюда с отметкой «Хит» дополнительно стоят в разделе «Хиты» вверху меню.
// В разделе сначала то, что можно заказать, «нет в наличии» в конце (Live.sortItems, 2026-11-08).
// Комбо со своей ценой из нескольких блюд (promos.combos) у кафе нет: корзина их понимает.
// Заказ у гостя (ночью, с собой, сёла, оплата): window.ORDER, вид в js/live.js.

(function () {
  const src = window.MENU_DATA;
  const promos = Object.assign({ banners: [], combos: [], bonus: { active: false, min: 0, percent: 0 } }, src.promos || {});
  const shown = src.menu
    .filter((g) => !g.hidden)
    .map((g) => Object.assign({}, g, { items: window.Live.sortItems(g.items.filter(window.Live.visible)) }))
    .filter((g) => g.items.length);
  const hits = window.Live.sortItems(shown.flatMap((g) => g.items).filter((it) => it.hit));

  window.CAFE = src.cafe;
  window.ORDER = window.Live.orderOf(src.order);
  window.MENU = hits.length ? [{ id: "hits", title: "Хиты", note: "", items: hits }].concat(shown) : shown;
  window.PROMOS = promos;
  const O = window.ORDER;

  // Доставка коротко: «Доставка 150 ₽», «Доставка от 150 ₽» или просто «Доставка», если цен нет
  function deliveryText() {
    const known = O.places.filter((p) => p.price !== null).map((p) => p.price);
    if (!known.length) return "Доставка";
    const min = Math.min(...known), one = O.places.every((p) => p.price === min);
    if (min === 0) return one ? "Бесплатная доставка" : "Доставка от 0 ₽";
    return `Доставка ${one ? "" : "от "}${min.toLocaleString("ru-RU")} ₽`;
  }

  const dish = {};
  shown.forEach((g) => g.items.forEach((it) => { dish[it.id] = it; }));

  // Цена со скидкой блюда. Рубли без копеек.
  const cut = (price, discount) => (discount > 0 ? Math.round((price * (100 - discount)) / 100) : price);
  const optPrice = (it, i) => (it.options && it.options[i] ? it.options[i].price : it.price);
  const minPrice = (it) => (it.options && it.options.length ? Math.min(...it.options.map((o) => o.price)) : it.price);

  // Акция действует, если включена и срок не прошёл (until: "2026-12-31" включительно)
  const today = () => new Date().toISOString().slice(0, 10);
  const live = (x) => x && x.active !== false && (!x.until || x.until >= today());

  function comboFull(c) {
    return c.items.reduce((s, x) => (dish[x.id] ? s + optPrice(dish[x.id], x.opt) * (x.qty || 1) : s), 0);
  }
  const comboOk = (c) => live(c) && c.items.length > 0 && c.items.every((x) => dish[x.id] && !dish[x.id].off);

  window.Data = {
    dish,
    cut,
    optPrice,
    minPrice,
    live,
    comboFull,
    combos: () => promos.combos.filter(comboOk),
    combo: (id) => promos.combos.find((c) => c.id === id && comboOk(c)),
    bonus: () => (live(promos.bonus) && promos.bonus.percent > 0 ? promos.bonus : null),
    deliveryText,
    // Заказ можно отправить: кафе открыто или ночью заказы принимают
    openNow: (date) => window.Live.openNow(window.CAFE, date),
    canOrder: (date) => O.night || window.Live.openNow(window.CAFE, date),
  };
})();
