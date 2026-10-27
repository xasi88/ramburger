// Данные для сайта: меню из data/menu.js и общие расчёты цен.
// Акций и комбо со своей ценой у кафе пока нет: поля оставлены пустыми, корзина их понимает.

(function () {
  const src = window.MENU_DATA;
  const promos = Object.assign({ banners: [], combos: [], bonus: { active: false, min: 0, percent: 0 } }, src.promos || {});
  window.CAFE = src.cafe;
  window.MENU = src.menu;
  window.PROMOS = promos;

  const dish = {};
  src.menu.forEach((g) => g.items.forEach((it) => { dish[it.id] = it; }));

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
  };
})();
