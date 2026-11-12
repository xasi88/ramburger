// Заказ: список блюд, доставка или с собой, село, оплата, сумма, отправка в WhatsApp кафе.
// Один и тот же заказ показан на экране «Заказ» и в боковой панели большого экрана.
// Текст для WhatsApp собран так, чтобы менеджер кафе сразу видел блюда, размеры, сумму, село, адрес и оплату.
// Сёла с ценой доставки, оплату, «с собой» и ночные заказы Ильяс меняет в админке (window.ORDER, вид в js/live.js).

window.OrderView = (function () {
  const { esc, ico, art, ctl, toast, countTo } = window.UI;
  const C = window.CAFE, O = window.ORDER, D = window.Data, cart = window.Cart;
  // Кафе работает доставкой, она первая. «С собой» только если Ильяс разрешил.
  const MODES = [["delivery", "Доставка", ico.truck]].concat(O.pickup ? [["pickup", "С собой", ico.walk]] : []);
  const one = (list, name) => (list.length === 1 ? name(list[0]) : "");
  const state = { mode: "delivery", place: one(O.places, (p) => p.name), pay: one(O.pay, (x) => x), time: "", addr: "", note: "" };
  const CLOSED = `Сейчас заказы не принимаем. Откроемся в ${C.open}:00, корзина сохранится.`;
  const mounts = [];

  function field(f, label, ph, extra) {
    return `<label class="field" data-for="${f}"><span class="o-label">${label}</span><input data-f="${f}" placeholder="${ph}" ${extra || ""}></label>`;
  }
  // Выбор одного из списка: село, оплата
  function chips(kind, label, list) {
    return `<div class="o-pick" data-for="${kind}"><span class="o-label">${label}</span>
      <div class="o-chips" role="radiogroup" aria-label="${label}">${list.map(([v, sub]) =>
        `<button type="button" role="radio" aria-checked="false" data-${kind}="${esc(v)}"><b>${esc(v)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</button>`).join("")}</div></div>`;
  }
  // Цена не задана: текст кафе (у Рамбургера «по тарифу такси», js/live.js, noPrice)
  const feeOf = (price) => (price === null ? O.noPrice : price ? cart.rub(price) : "бесплатно");

  function skeleton(side) {
    return `
      ${side ? "" : '<a class="back" href="#menu">' + ico.back + "Меню</a>"}
      <h1 class="page-title">Ваш заказ</h1>
      <div class="blank" data-empty>
        <div class="blank-art">${window.ICONS.burger}</div>
        <h2>Пока пусто</h2>
        <p>Добавьте блюда кнопкой «+». Заказ уйдёт в WhatsApp кафе готовым сообщением.</p>
        ${side ? "" : '<a class="btn btn-main" href="#menu">Открыть меню</a>'}
      </div>
      <div data-full hidden>
        <ul class="o-list" data-list></ul>
        <div class="o-section">
          ${MODES.length > 1 ? `<span class="o-label">Как получить</span>
          <div class="seg" role="radiogroup" aria-label="Как получить"><span class="seg-pill"></span>
            ${MODES.map(([m, t, i]) => `<button type="button" role="radio" data-mode="${m}" aria-checked="false">${i}${t}</button>`).join("")}
          </div>` : ""}
          ${O.places.length ? chips("place", "Куда привезти", O.places.map((p) => [p.name, feeOf(p.price)])) : ""}
          ${field("addr", "Адрес доставки", "Улица, дом, ориентир", 'autocomplete="street-address" maxlength="120"')}
          ${field("time", "Когда заберёте", "Например, через 30 минут", 'maxlength="60"')}
          ${O.pay.length ? chips("pay", "Оплата", O.pay.map((x) => [x, ""])) : ""}
          ${field("note", "Пожелания", "Например, без лука, соус острый", 'maxlength="140"')}
        </div>
        <div class="o-sums">
          <span>Блюда</span><b data-sum></b>
          <span data-fee-name>Доставка</span><b data-fee></b>
        </div>
        <div class="o-total"><span>Итого</span><b data-total></b></div>
        <p class="o-total-note" data-total-note hidden></p>
        <p class="o-closed" data-closed hidden>${CLOSED}</p>
        <a class="btn btn-wa btn-wide" data-send target="_blank" rel="noopener">${ico.wa}Отправить заказ в WhatsApp</a>
        <p class="o-hint" data-hint>Откроется WhatsApp кафе с готовым заказом и суммой. Останется нажать «Отправить».</p>
        <button class="o-clear" type="button" data-clear>Очистить заказ</button>
      </div>`;
  }

  // Подсветить, что гость пропустил
  function shake(x) {
    if (!x) return;
    x.classList.remove("invalid"); void x.offsetWidth; x.classList.add("invalid");
    if (x.scrollIntoView) x.scrollIntoView({ block: "center" });
  }

  // Почему заказ пока нельзя отправить. Пусто: можно.
  function problem(el) {
    if (!D.canOrder()) return CLOSED;
    if (state.mode === "delivery") {
      if (O.places.length && !placeOf()) { shake(el.querySelector('[data-for="place"]')); return "Выберите село"; }
      if (!state.addr.trim()) {
        const input = el.querySelector('[data-f="addr"]');
        shake(input); input.focus();
        return "Напишите адрес доставки";
      }
    }
    if (O.pay.length && !state.pay) { shake(el.querySelector('[data-for="pay"]')); return "Выберите оплату"; }
    return "";
  }

  function mount(el, side) {
    el.innerHTML = skeleton(side);
    mounts.push(el);
    el.addEventListener("click", (e) => {
      const m = e.target.closest("[data-mode]");
      if (m) { state.mode = m.dataset.mode; update(); return; }
      const pick = e.target.closest("[data-place], [data-pay]");
      if (pick) {
        if (pick.dataset.place !== undefined) state.place = pick.dataset.place; else state.pay = pick.dataset.pay;
        const box = pick.closest(".o-pick");
        if (box) box.classList.remove("invalid");
        update();
        return;
      }
      if (e.target.closest("[data-clear]")) { cart.clear(); toast("Заказ очищен"); return; }
      const send = e.target.closest("[data-send]");
      if (!send) return;
      const why = problem(el);
      if (why) { e.preventDefault(); toast(why); return; }
      window.Stats.order(cart.lines(), state.mode, total());
    });
    el.addEventListener("input", (e) => {
      const f = e.target.dataset.f;
      if (!f) return;
      state[f] = e.target.value;
      e.target.classList.remove("invalid");
      mounts.forEach((m) => { const x = m.querySelector(`[data-f="${f}"]`); if (x !== e.target) x.value = state[f]; });
      link();
    });
    update();
  }

  // Цена доставки: число, или null (цена не задана или село не выбрано). С собой: 0.
  const placeOf = () => O.places.find((p) => p.name === state.place);
  function fee() {
    if (state.mode !== "delivery") return 0;
    const p = placeOf();
    return p ? p.price : null;
  }
  const total = () => cart.summary().total + (fee() || 0);
  const feeText = () => (fee() === null && O.places.length && !placeOf() ? "выберите село" : feeOf(fee()));

  function message() {
    const rows = cart.lines().map(({ info, qty }, i) => `${i + 1}. ${info.name} × ${qty} = ${cart.rub(info.price * qty)}`);
    const sm = cart.summary(), f = fee(), deliv = state.mode === "delivery";
    const out = ["Здравствуйте! Заказ с сайта «Рамбургер».", "", ...rows, ""];
    // Акция из админки: кафе сразу видит, что гостю положено по акции
    const pr = window.Data.promo && window.Data.promo();
    if (pr) out.splice(1, 0, `Акция: ${pr.text}`);
    out.push(`Блюда: ${cart.rub(sm.total)}`);
    if (deliv) out.push(`Доставка: ${feeOf(f)}`);
    out.push(deliv && f === null ? `*Итого без доставки: ${cart.rub(total())}*` : `*Итого: ${cart.rub(total())}*`, "");
    if (deliv) {
      out.push(`Получение: доставка${placeOf() ? `, ${placeOf().name}` : ""}`);
      if (state.addr.trim()) out.push(`Адрес: ${state.addr.trim()}`);
    } else {
      out.push(`Получение: заберу сам${state.time.trim() ? `, ${state.time.trim()}` : ""}`);
    }
    if (state.pay) out.push(`Оплата: ${state.pay}`);
    if (state.note.trim()) out.push(`Пожелания: ${state.note.trim()}`);
    return out.join("\n");
  }

  function link() {
    const href = `https://wa.me/${C.phone}?text=${encodeURIComponent(message())}`;
    mounts.forEach((m) => { m.querySelector("[data-send]").href = href; });
  }

  function update() {
    const lines = cart.lines(), open = D.canOrder(), deliv = state.mode === "delivery", f = fee();
    const idx = MODES.findIndex(([m]) => m === state.mode);
    mounts.forEach((el) => {
      const q = (s) => el.querySelector(s);
      q("[data-empty]").hidden = lines.length > 0;
      q("[data-full]").hidden = !lines.length;
      q("[data-list]").innerHTML = lines.map(({ key, info, qty }) => `
        <li class="o-line"><span class="art">${art(info.art)}</span>
          <div><b>${esc(info.name)}</b><span>${cart.rub(info.price)} × ${qty} = ${cart.rub(info.price * qty)}</span></div>
          <span data-ctl="${key}">${ctl(key)}</span></li>`).join("");
      countTo(q("[data-sum]"), cart.summary().total, cart.rub);
      q("[data-fee-name]").hidden = q("[data-fee]").hidden = !deliv;
      q("[data-fee]").textContent = feeText();
      countTo(q("[data-total]"), total(), cart.rub);
      q("[data-total-note]").hidden = !(deliv && f === null);
      q("[data-total-note]").textContent = placeOf() || !O.places.length ? `Сумма без доставки. Доставка: ${O.noPrice}.` : "Сумма без доставки.";
      el.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.mode === state.mode)));
      const pill = q(".seg-pill");
      if (pill) pill.style.transform = `translateX(${idx * 100}%)`;
      q('[data-for="time"]').hidden = deliv;
      q('[data-for="addr"]').hidden = !deliv;
      const places = q('[data-for="place"]');
      if (places) places.hidden = !deliv;
      el.querySelectorAll("[data-place]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.place === state.place)));
      el.querySelectorAll("[data-pay]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.pay === state.pay)));
      // Кафе закрыто и ночью заказы не принимают: кнопка серая, рядом объяснение
      q("[data-closed]").hidden = open;
      q("[data-hint]").hidden = !open;
      const send = q("[data-send]");
      send.classList.toggle("off", !open);
      send.setAttribute("aria-disabled", String(!open));
      el.querySelectorAll("[data-f]").forEach((x) => { if (document.activeElement !== x) x.value = state[x.dataset.f]; });
    });
    link();
  }

  return { mount, update, message, total };
})();
