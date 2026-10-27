// Статистика: что делают гости. Уходит в Яндекс Метрику (счётчик 113827061) параметрами визита.
// Цифры показывает «Статистика проектов», раздел «Рамбургер». Имя группы меняешь здесь: меняешь и там (RB_GROUPS).
// В Метрику уходят только блюда, размеры, суммы и нажатия. Адрес, время и пожелания гостя не уходят.
// Свой телефон не считать: открыть меню с #ne-schitat в конце адреса. Вернуть: #schitat.

window.Stats = (function () {
  const YM = 113827061, SKIP = "ramburger-ne-schitat";
  let skip = false;
  try {
    const h = location.hash;
    if (h === "#ne-schitat" || h === "#schitat") {
      if (h === "#ne-schitat") localStorage.setItem(SKIP, "1"); else localStorage.removeItem(SKIP);
      history.replaceState(null, "", location.pathname + location.search);
      window.UI.toast(h === "#ne-schitat" ? "Этот телефон больше не считается в статистике" : "Этот телефон снова считается в статистике");
    }
    skip = localStorage.getItem(SKIP) === "1";
  } catch (e) { /* без хранилища считаем как обычно */ }

  // Код счётчика от Яндекса. Вебвизора и карты кликов нет: запись экрана гостя не нужна.
  // На компьютере (localhost) счётчик молчит: Метрика берёт данные только с адреса сайта.
  if (!skip && location.protocol === "https:") {
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://mc.yandex.ru/metrika/tag.js";
    document.head.appendChild(s);
    window.ym(YM, "init", { clickmap: false, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }

  // Одна посылка в Метрику. Ошибка статистики не мешает заказу.
  function send(params) {
    if (skip || typeof window.ym !== "function") return;
    try { window.ym(YM, "params", params); } catch (e) { /* молча */ }
  }

  // Блюдо по ключу корзины: название и размер. «shawarma@1» -> ["Шаурма", "Большая"], без размера: ["Пепси", ""]
  function dish(key) {
    const i = window.Cart.info(key);
    if (!i) return null;
    const o = key.split("@")[1];
    return i.item ? [i.item.name, o !== undefined ? i.item.options[o].name : ""] : [i.name, ""];
  }

  // Поиск уходит, когда гость 1,5 с не печатает: так в статистику попадает слово целиком
  let typing = 0, lastQ = "";
  function search(q, found) {
    clearTimeout(typing);
    q = q.trim().toLowerCase();
    if (q.length < 2) return;
    typing = setTimeout(() => {
      if (q === lastQ) return;
      lastQ = q;
      send({ "Поиск в меню": { [q]: found ? "Нашли" : "Не нашли" } });
    }, 1500);
  }

  // Экраны #search, #order, #cafe: отдельные просмотры. Самый первый экран Метрика считает сама.
  const TITLES = { menu: "Меню", search: "Поиск", order: "Ваш заказ", cafe: "О кафе" };
  let first = true;
  function screen(view) {
    if (view === "order") send({ "Открыли корзину": "Экран заказа" });
    if (first) { first = false; return; }
    if (!skip && typeof window.ym === "function") window.ym(YM, "hit", location.href, { title: `${TITLES[view] || view} · Рамбургер` });
  }

  // Звонок, Instagram, WhatsApp без заказа, «Установить»: нажатия на всей странице
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href], [data-install]");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    const what = a.matches("[data-install]") ? "Нажали «Установить»"
      : href.startsWith("tel:") ? "Позвонили"
      : href.includes("instagram.com") ? "Открыли Instagram"
      : href.startsWith("https://wa.me/") && !a.matches("[data-send]") ? "Написали в WhatsApp без заказа" : "";
    if (what) send({ "Связь с кафе": what });
  });
  addEventListener("appinstalled", () => send({ "Связь с кафе": "Установили на телефон" }));
  if (matchMedia("(display-mode: standalone)").matches || navigator.standalone === true) send({ "Как открыли": "Значок на телефоне" });

  return {
    screen,
    search,
    section: (title) => send({ "Раздел меню": title }),
    opened: (id) => { const it = window.Cart.byId[id]; if (it) send({ "Открыли блюдо": it.name }); },
    added(key) {
      const d = dish(key);
      if (d) send({ "Добавили в корзину": d[1] ? { [d[0]]: d[1] } : d[0] });
    },
    // Заказ: блюдо, размер и порции («×2»), способ получения, итог с доставкой
    order(lines, mode, total) {
      const dishes = {};
      for (const { key, qty } of lines) {
        const d = dish(key);
        if (!d) continue;
        const [name, size] = d;
        dishes[name] = size ? { ...(dishes[name] || {}), [size]: `×${qty}` } : `×${qty}`;
      }
      send({ "Заказ в WhatsApp": dishes, "Получение": mode === "delivery" ? "Доставка" : "С собой", "Сумма заказа": String(total) });
    },
  };
})();
