// Общие детали интерфейса: значки, картинка и цена блюда, счётчик блюда, подсказка,
// полёт блюда в корзину, плавный счёт суммы, окно блюда.

window.UI = (function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const line = (d) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ico = {
    search: line('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
    bag: line('<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
    info: line('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
    back: line('<path d="M15 6l-6 6 6 6"/>'),
    plus: line('<path d="M12 5v14M5 12h14"/>'),
    minus: line('<path d="M5 12h14"/>'),
    clock: line('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    phone: line('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'),
    ig: line('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>'),
    go: line('<path d="m9 6 6 6-6 6"/>'),
    truck: line('<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
    walk: line('<path d="M6 9h12l-1 11H7z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/><path d="m9.5 14 2 2 3.5-4"/>'),
    install: line('<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M12 7v7M9 11l3 3 3-3M10 18h4"/>'),
    menu: line('<path d="M4 7h16M4 12h16M4 17h10"/>'),
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z"/></svg>',
  };

  // Картинка блюда: фото, иначе векторный рисунок
  function art(it, eager) {
    if (it.photo) return `<img src="${esc(it.photo)}" alt="${esc(it.name)}" ${eager ? "" : 'loading="lazy" '}decoding="async" width="408" height="288">`;
    return window.ICONS[it.icon] || window.ICONS.plate;
  }

  // Цена блюда для ценника: «от» для блюда с размерами
  function price(it) {
    const D = window.Data, rub = window.Cart.rub;
    const base = D.minPrice(it), now = D.cut(base, it.discount);
    const from = it.options && it.options.length > 1 ? "от " : "";
    return `<b>${from}${rub(now)}</b>${now < base ? `<s>${rub(base)}</s>` : ""}`;
  }

  // У блюда есть размеры: сначала выбрать размер в окне блюда
  const needsPick = (key) => { const it = window.Cart.byId[key]; return !!(it && it.options && it.options.length); };
  const qtyOf = (key) => (needsPick(key) ? window.Cart.qtyDish(key) : window.Cart.qty(key));

  // Кнопка «Добавить» или счётчик «− 2 +». У блюда с размерами «Добавить» открывает выбор размера.
  function ctl(key, big) {
    const cls = big ? " big" : "";
    const it = window.Cart.byId[key.split("@")[0]];
    if (it && it.off) return `<span class="soldout">Нет в наличии</span>`;
    if (needsPick(key)) {
      const n = window.Cart.qtyDish(key);
      return `<div class="ctl empty${cls}"><button type="button" data-pick="${key}" aria-label="Выбрать размер: ${esc(it.name)}">${ico.plus}<span>${n ? "Ещё" : "Добавить"}</span>${n ? `<i class="ctl-n">${n}</i>` : ""}</button></div>`;
    }
    const q = window.Cart.qty(key);
    if (!q) return `<div class="ctl empty${cls}"><button type="button" data-add="${key}" aria-label="Добавить в корзину">${ico.plus}<span>${big ? "В корзину" : "Добавить"}</span></button></div>`;
    return `<div class="ctl has${cls}"><button type="button" data-sub="${key}" aria-label="Убрать одну порцию">${ico.minus}</button><output aria-live="polite">${q}</output><button type="button" data-add="${key}" aria-label="Добавить ещё порцию">${ico.plus}</button></div>`;
  }

  let toastTimer;
  function toast(text) {
    const t = $("toast");
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  // Блюдо летит дугой от кнопки к корзине: с весом, разгоном и торможением
  function fly(from, photo) {
    if (reduced() || !from) return;
    const to = [$("cartbarBag"), $("sideOrder")].find((el) => el && el.offsetParent);
    if (!to) return;
    const f = $("flyer");
    f.style.backgroundImage = photo ? `url("${photo}")` : "";
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const x0 = a.left + a.width / 2 - 22, y0 = a.top + a.height / 2 - 22;
    const x1 = b.left + Math.min(b.width, 44) / 2 - 22, y1 = b.top + Math.min(b.height, 44) / 2 - 22;
    f.animate([
      { transform: `translate(${x0}px,${y0}px) scale(.6) rotate(0deg)`, opacity: 0 },
      { transform: `translate(${x0}px,${y0 - 24}px) scale(1.15) rotate(-6deg)`, opacity: 1, offset: 0.18 },
      { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 70}px) scale(1) rotate(8deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${x1}px,${y1}px) scale(.35) rotate(0deg)`, opacity: 0.2 },
    ], { duration: 720, easing: "cubic-bezier(.5,0,.4,1)" });
  }

  // Плавный счёт суммы: 980 ₽ → 1 120 ₽
  function countTo(el, value, rub) {
    const from = Number(el.dataset.v || 0);
    el.dataset.v = value;
    if (reduced() || from === value || !from) { el.textContent = rub(value); return; }
    const t0 = performance.now(), dur = 420;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = rub(Math.round(from + (value - from) * e));
      if (k < 1 && Number(el.dataset.v) === value) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    // Браузер мог остановить кадры (вкладка в фоне): точная сумма всё равно встаёт в конце
    setTimeout(() => { if (Number(el.dataset.v) === value) el.textContent = rub(value); }, dur + 60);
  }

  const haptic = () => { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(8); } catch (e) { /* не везде есть вибрация */ } };

  // Карточки поднимаются при прокрутке, по очереди
  const reveal = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); reveal.unobserve(e.target); }
      }), { rootMargin: "0px 0px -6% 0px" })
    : null;
  function observe(el, i) {
    el.style.transitionDelay = `${(i % 2) * 70}ms`;
    if (reveal) reveal.observe(el); else el.classList.add("in");
  }

  // Окно с затемнением: закрывается фоном, крестиком, клавишей Esc и кнопкой «Назад» телефона
  let lastFocus = null;
  function openSheet(el) {
    lastFocus = document.activeElement;
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    setTimeout(() => el.querySelector("[tabindex='-1']").focus({ preventScroll: true }), 50);
  }
  function closeSheet(el) {
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  return { $, esc, ico, art, price, ctl, qtyOf, toast, fly, countTo, haptic, observe, openSheet, closeSheet, reduced };
})();
