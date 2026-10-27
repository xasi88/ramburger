// Запуск: экраны по адресу, кнопка корзины внизу, поиск, экран «Кафе», связь с корзиной.
// Путь гостя: меню → «+» → кнопка «Корзина» внизу → «Отправить заказ в WhatsApp».

(function () {
  const { $, esc, ico, ctl, qtyOf, toast, fly, countTo, haptic, closeSheet } = window.UI;
  const C = window.CAFE, M = window.MENU, cart = window.Cart;
  const Menu = window.MenuView, Order = window.OrderView;
  const VIEWS = ["menu", "search", "order", "cafe"];

  $("brandMark").innerHTML = window.LOGO;
  Menu.render();
  Order.mount($("orderPage"), false);
  Order.mount($("sideOrder"), true);

  // Открыто ли кафе сейчас: часы по Москве
  function status() {
    const h = Number(new Intl.DateTimeFormat("ru-RU", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Moscow" }).format(new Date()));
    const open = h >= C.open && h < C.close;
    const el = $("status");
    el.innerHTML = open ? `Открыто<span class="st-more"> до ${C.close}:00</span>` : `Закрыто<span class="st-more">, откроется в ${C.open}:00</span>`;
    el.classList.toggle("closed", !open);
  }
  status();
  setInterval(status, 60000);

  // Экран «Кафе»
  const row = (href, icon, title, sub, ext) => `<a class="row" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""}><i>${icon}</i><div><b>${title}</b><span>${sub}</span></div>${ico.go.replace("<svg", '<svg class="go"')}</a>`;
  $("cafePage").innerHTML = `
    <a class="back" href="#menu">${ico.back}Меню</a>
    <div class="cafe-hero">
      <span class="cafe-logo">${window.LOGO}</span>
      <h1>Кафе «${esc(C.name)}»</h1>
      <p>${esc(C.tagline)}. Комбо, бургеры, шаурма, пицца и роллы.</p>
    </div>
    <div class="rows">
      ${row("tel:+" + C.phone, ico.phone, esc(C.phoneText), `${esc(C.place)} · принимает заказы с сайта`, false)}
      ${C.phone2 ? row("tel:+" + C.phone2, ico.pin, esc(C.place2), esc(C.phone2Text), false) : ""}
      ${row(`https://instagram.com/${C.instagram}`, ico.ig, "@" + esc(C.instagram), "Instagram", true)}
      <div class="row"><i>${ico.clock}</i><div><b>${esc(C.hours)}</b><span>Доставка ${cart.rub(C.delivery)}</span></div><span></span></div>
    </div>
    <div class="cafe-cta">
      <a class="btn btn-wa" href="https://wa.me/${C.phone}" target="_blank" rel="noopener">${ico.wa}Написать в WhatsApp</a>
      <button class="btn btn-soft" type="button" data-install>${ico.install}Установить на телефон</button>
    </div>`;

  // Поиск: без учёта регистра и буквы «ё»
  const norm = (s) => s.toLowerCase().replace(/ё/g, "е");
  const all = M.flatMap((g) => g.items.map((it) => ({ it, hay: norm(`${it.name} ${it.desc} ${g.title}`) })));
  ["Пицца", "Шаурма", "Ролл", "Бургер", "Комбо", "Картошка"].forEach((w) => $("quick").insertAdjacentHTML("beforeend", `<button type="button">${w}</button>`));
  function search() {
    const q = norm($("q").value.trim());
    $("qClear").hidden = !q;
    $("quick").hidden = !!q;
    if (!q) { $("results").innerHTML = ""; return; }
    const found = all.filter((x) => q.split(/\s+/).every((w) => x.hay.includes(w))).map((x) => x.it);
    $("results").innerHTML = found.length
      ? `<p class="results-head">Найдено: ${found.length}</p><div class="grid">${found.map(Menu.card).join("")}</div>`
      : `<div class="blank"><div class="blank-art">${ico.search}</div><h2>Ничего не нашли</h2><p>Попробуйте другое слово: «пицца», «ролл», «шаурма».</p></div>`;
    $("results").querySelectorAll(".card").forEach((c) => c.classList.add("in"));
  }
  $("q").addEventListener("input", search);
  $("qClear").addEventListener("click", () => { $("q").value = ""; search(); $("q").focus(); });
  $("quick").addEventListener("click", (e) => { if (e.target.tagName === "BUTTON") { $("q").value = e.target.textContent; search(); } });

  // Экраны по адресу (#menu, #search, #order, #cafe)
  const scrollMemo = {};
  let view = null;
  function route() {
    const want = (location.hash || "#menu").slice(1);
    const next = VIEWS.includes(want) ? want : "menu";
    if (next === view) return;
    if (view) scrollMemo[view] = scrollY;
    view = next;
    if ($("sheet").classList.contains("open")) closeSheet($("sheet"));
    document.querySelectorAll(".view").forEach((v) => { v.hidden = v.dataset.view !== next; });
    document.body.dataset.view = next;
    document.querySelectorAll("[data-go]").forEach((t) => t.classList.toggle("on", t.dataset.go === next));
    scrollTo(0, scrollMemo[next] || 0);
    if (next === "menu") Menu.refreshChips();
    if (next === "search" && matchMedia("(hover: hover)").matches) $("q").focus({ preventScroll: true });
  }
  addEventListener("hashchange", route);
  route();

  // Нажатия: добавить, убрать, выбрать размер, открыть блюдо
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]"), sub = e.target.closest("[data-sub]"), pick = e.target.closest("[data-pick]");
    if (add) {
      e.stopPropagation();
      const key = add.dataset.add, first = !cart.qty(key);
      cart.add(key);
      haptic();
      const it = cart.byId[key.split("@")[0]];
      requestAnimationFrame(() => fly(add, it && it.photo));
      if (first) toast(`${cart.info(key).name}: в корзине`);
      return;
    }
    if (sub) { e.stopPropagation(); cart.sub(sub.dataset.sub); haptic(); return; }
    if (pick) { e.stopPropagation(); Menu.openDish(pick.dataset.pick); return; }
    const card = e.target.closest("[data-open]");
    if (card) Menu.openDish(card.dataset.open);
  });
  document.addEventListener("keydown", (e) => {
    const card = e.target.closest && e.target.closest("[data-open]");
    if (card && (e.key === "Enter" || e.key === " ") && e.target === card) { e.preventDefault(); Menu.openDish(card.dataset.open); }
    if (e.key === "Escape" && $("sheet").classList.contains("open")) closeSheet($("sheet"));
  });
  $("sheet").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeSheet($("sheet")); });

  // Кнопка корзины внизу: сколько блюд и на какую сумму
  const bar = $("cartbar");
  bar.addEventListener("animationend", () => bar.classList.remove("bump"));
  function syncBar() {
    const n = cart.count();
    const was = bar.classList.contains("show");
    bar.classList.toggle("show", n > 0);
    document.body.classList.toggle("has-cart", n > 0);
    $("cartbarCount").textContent = n;
    countTo($("cartbarSum"), cart.summary().total, cart.rub);
    if (was && n) { bar.classList.remove("bump"); void bar.offsetWidth; bar.classList.add("bump"); }
  }

  // Корзина изменилась: счётчики на карточках, окно блюда, кнопка корзины, экран заказа
  function sync() {
    document.querySelectorAll("[data-ctl]").forEach((el) => {
      const q = String(qtyOf(el.dataset.ctl));
      if (el.dataset.q !== q) { el.innerHTML = ctl(el.dataset.ctl, !!el.dataset.big); el.dataset.q = q; }
    });
    if (Menu.openKey() && $("sheet").classList.contains("open")) Menu.fill();
    syncBar();
    Order.update();
  }
  cart.onChange(sync);
  sync();

  addEventListener("scroll", () => document.querySelector(".appbar").classList.toggle("scrolled", scrollY > 4), { passive: true });
})();
