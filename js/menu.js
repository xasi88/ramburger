// Экран «Меню»: подсказка «как заказать», полоса разделов, карточки блюд, окно блюда.

window.MenuView = (function () {
  const { $, esc, ico, art, price, ctl, observe, openSheet, reduced } = window.UI;
  const C = window.CAFE, M = window.MENU, D = window.Data, cart = window.Cart, stats = window.Stats;
  const groupOf = {};
  M.forEach((g) => g.items.forEach((it) => { groupOf[it.id] = g; }));

  // Карточка блюда: общая для меню и поиска
  function card(it) {
    // Наклейка на фото: «3 / 6 / 9 шт» или «2 размера»
    const o = it.options || [];
    const pcs = o.length && o.every((x) => / шт$/.test(x.name));
    const sizes = o.length ? `<span class="badge">${pcs ? o.map((x) => x.name.replace(" шт", "")).join(" / ") + " шт" : `${o.length} размера`}</span>` : "";
    return `<article class="card${it.off ? " off" : ""}" data-open="${it.id}" data-g="${groupOf[it.id].id}" tabindex="0" aria-label="${esc(it.name)}">
      <div class="art">${art(it)}${sizes}<span class="tag">${price(it)}</span></div>
      <div class="c-body">
        <h3 class="c-name">${esc(it.name)}</h3>
        ${it.desc ? `<p class="c-desc">${esc(it.desc)}</p>` : ""}
        <div class="c-buy" data-ctl="${it.id}">${ctl(it.id)}</div>
      </div>
    </article>`;
  }

  const sections = [];
  function section(g) {
    sections.push({ id: g.id, title: g.title });
    return `
      <section class="group" id="g-${g.id}" aria-labelledby="h-${g.id}">
        <div class="group-head"><h2 id="h-${g.id}">${esc(g.title)}</h2>${g.note ? `<p>${esc(g.note)}</p>` : ""}</div>
        <div class="grid">${g.items.map(card).join("")}</div>
      </section>`;
  }

  function render() {
    // Первый экран: что делать, в три шага, и условия заказа
    $("intro").innerHTML = `
      <h1 class="intro-title">Соберите заказ, кафе получит его в WhatsApp</h1>
      <ol class="steps">
        <li><i>${ico.plus}</i><span>Выберите блюда</span></li>
        <li><i>${ico.bag}</i><span>Откройте корзину</span></li>
        <li><i class="wa">${ico.wa}</i><span>Отправьте в WhatsApp</span></li>
      </ol>
      <p class="terms"><span>${ico.truck}Доставка ${cart.rub(C.delivery)}</span><span>${ico.walk}С собой</span><span>${ico.clock}${C.open}:00 - ${C.close}:00</span></p>`;

    $("groups").innerHTML = M.filter((g) => g.items.length).map(section).join("");
    $("chipsTrack").insertAdjacentHTML("beforeend", sections.map((s) => `<button class="chip" type="button" data-cat="${s.id}">${esc(s.title)}</button>`).join(""));
    document.querySelectorAll("#groups .grid").forEach((grid) => [...grid.children].forEach(observe));
    $("demoNote").hidden = !C.demo;
    setupChips();
  }

  // Полоса разделов: подложка едет к текущему разделу
  function setupChips() {
    const track = $("chipsTrack"), pill = $("chipsPill");
    const chips = [...track.querySelectorAll(".chip")];
    if (!chips.length) return;
    let current = sections[0].id, lock = 0;

    function place(id, scrollTrack) {
      current = id;
      const c = chips.find((x) => x.dataset.cat === id);
      if (!c || !c.offsetWidth) return;
      if (!pill.dataset.ready) { pill.style.transition = "none"; requestAnimationFrame(() => requestAnimationFrame(() => { pill.style.transition = ""; pill.dataset.ready = "1"; })); }
      chips.forEach((x) => x.classList.toggle("on", x === c));
      pill.style.width = c.offsetWidth + "px";
      pill.style.transform = `translate(${c.offsetLeft}px, ${c.offsetTop}px)`;
      if (scrollTrack) track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: reduced() ? "auto" : "smooth" });
    }

    track.addEventListener("click", (e) => {
      const c = e.target.closest(".chip");
      if (!c) return;
      lock = Date.now() + 900;
      place(c.dataset.cat, true);
      stats.section(c.textContent);
      $("g-" + c.dataset.cat).scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    });

    function spy() {
      if (Date.now() < lock || $("view-menu").hidden) return;
      const edge = $("chips").getBoundingClientRect().bottom + 24;
      let id = sections[0].id;
      for (const s of sections) if ($("g-" + s.id).getBoundingClientRect().top <= edge) id = s.id;
      if (id !== current) place(id, true);
    }
    addEventListener("scroll", spy, { passive: true });
    addEventListener("resize", () => place(current, false));
    document.fonts.ready.then(() => place(current, false));
  }

  // Окно блюда: фото, состав, размеры, кнопка «В заказ»
  let openKey = null, openId = null, opt = 0;

  function fill() {
    const it = cart.byId[openId];
    const hasOpts = it.options && it.options.length;
    openKey = hasOpts ? `${openId}@${opt}` : openId;
    const base = D.optPrice(it, hasOpts ? opt : undefined), now = D.cut(base, it.discount);
    $("dPrice").innerHTML = `${cart.rub(now)}${now < base ? ` <s>${cart.rub(base)}</s>` : ""}`;
    $("dOpts").innerHTML = hasOpts ? it.options.map((o, i) => `<button type="button" data-opt="${i}" aria-pressed="${i === opt}"><b>${esc(o.name)}</b><small>${cart.rub(D.cut(o.price, it.discount))}</small>${cart.qty(`${openId}@${i}`) ? `<i class="opt-n">${cart.qty(`${openId}@${i}`)}</i>` : ""}</button>`).join("") : "";
    $("dOpts").hidden = !hasOpts;
    $("dCtl").innerHTML = ctl(openKey, true);
  }

  function openDish(key) {
    const it = cart.byId[key];
    if (!it) return;
    openId = key; opt = 0;
    $("sheet").querySelector(".d-art").dataset.g = groupOf[key].id;
    $("dArt").innerHTML = art(it, true);
    $("dMeta").textContent = groupOf[key].title + (it.off ? " · нет в наличии" : "");
    $("dName").textContent = it.name;
    $("dDesc").textContent = it.desc;
    $("dDesc").hidden = !it.desc;
    fill();
    openSheet($("sheet"));
    stats.opened(key);
  }

  $("dOpts").addEventListener("click", (e) => {
    const b = e.target.closest("[data-opt]");
    if (b && openId) { opt = Number(b.dataset.opt); fill(); }
  });

  return { render, card, openDish, fill, openKey: () => openKey, refreshChips: () => window.dispatchEvent(new Event("resize")) };
})();
