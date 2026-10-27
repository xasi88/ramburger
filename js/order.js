// Заказ: список блюд, с собой или доставка, сумма, отправка в WhatsApp кафе.
// Один и тот же заказ показан на экране «Заказ» и в боковой панели большого экрана.
// Текст для WhatsApp собран так, чтобы менеджер кафе сразу видел блюда, размеры, сумму и адрес.

window.OrderView = (function () {
  const { esc, ico, art, ctl, toast, countTo } = window.UI;
  const C = window.CAFE, cart = window.Cart;
  const MODES = [["pickup", "С собой", ico.walk], ["delivery", "Доставка", ico.truck]];
  const state = { mode: "pickup", time: "", addr: "", note: "" };
  const mounts = [];

  function field(f, label, ph, extra) {
    return `<label class="field" data-for="${f}"><span class="o-label">${label}</span><input data-f="${f}" placeholder="${ph}" ${extra || ""}></label>`;
  }

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
          <span class="o-label">Как получить</span>
          <div class="seg" role="radiogroup" aria-label="Как получить"><span class="seg-pill"></span>
            ${MODES.map(([m, t, i]) => `<button type="button" role="radio" data-mode="${m}" aria-checked="false">${i}${t}</button>`).join("")}
          </div>
          ${field("time", "Когда заберёте", "Например, через 30 минут", 'maxlength="60"')}
          ${field("addr", "Адрес доставки", "Улица, дом, ориентир", 'autocomplete="street-address" maxlength="120"')}
          ${field("note", "Пожелания", "Например, без лука, соус острый", 'maxlength="140"')}
        </div>
        <div class="o-sums">
          <span>Блюда</span><b data-sum></b>
          <span data-fee-name>Доставка</span><b data-fee></b>
        </div>
        <div class="o-total"><span>Итого</span><b data-total></b></div>
        <a class="btn btn-wa btn-wide" data-send target="_blank" rel="noopener">${ico.wa}Отправить заказ в WhatsApp</a>
        <p class="o-hint">Откроется WhatsApp кафе с готовым заказом и суммой. Останется нажать «Отправить».</p>
        <button class="o-clear" type="button" data-clear>Очистить заказ</button>
      </div>`;
  }

  function mount(el, side) {
    el.innerHTML = skeleton(side);
    mounts.push(el);
    el.addEventListener("click", (e) => {
      const m = e.target.closest("[data-mode]");
      if (m) { state.mode = m.dataset.mode; update(); if (state.mode === "delivery" && !state.addr) setTimeout(() => el.querySelector('[data-f="addr"]').focus(), 250); return; }
      if (e.target.closest("[data-clear]")) { cart.clear(); toast("Заказ очищен"); return; }
      const send = e.target.closest("[data-send]");
      if (send && state.mode === "delivery" && !state.addr.trim()) {
        e.preventDefault();
        const input = el.querySelector('[data-f="addr"]');
        input.classList.remove("invalid"); void input.offsetWidth; input.classList.add("invalid");
        input.focus();
        toast("Напишите адрес доставки");
        return;
      }
      if (send) window.Stats.order(cart.lines(), state.mode, total());
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

  // Доставка платная, с собой бесплатно
  const fee = () => (state.mode === "delivery" ? C.delivery || 0 : 0);
  const total = () => cart.summary().total + fee();

  function message() {
    const rows = cart.lines().map(({ info, qty }, i) => `${i + 1}. ${info.name} × ${qty} = ${cart.rub(info.price * qty)}`);
    const sm = cart.summary();
    const out = ["Здравствуйте! Заказ с сайта «Рамбургер».", "", ...rows, ""];
    out.push(`Блюда: ${cart.rub(sm.total)}`);
    if (state.mode === "delivery") out.push(`Доставка: ${cart.rub(fee())}`);
    out.push(`*Итого: ${cart.rub(total())}*`, "");
    if (state.mode === "delivery") {
      out.push("Получение: доставка");
      if (state.addr.trim()) out.push(`Адрес: ${state.addr.trim()}`);
    } else {
      out.push(`Получение: заберу сам${state.time.trim() ? `, ${state.time.trim()}` : ""}`);
    }
    if (state.note.trim()) out.push(`Пожелания: ${state.note.trim()}`);
    return out.join("\n");
  }

  function link() {
    const href = `https://wa.me/${C.phone}?text=${encodeURIComponent(message())}`;
    mounts.forEach((m) => { m.querySelector("[data-send]").href = href; });
  }

  function update() {
    const lines = cart.lines();
    const idx = MODES.findIndex(([m]) => m === state.mode);
    mounts.forEach((el) => {
      el.querySelector("[data-empty]").hidden = lines.length > 0;
      el.querySelector("[data-full]").hidden = !lines.length;
      el.querySelector("[data-list]").innerHTML = lines.map(({ key, info, qty }) => `
        <li class="o-line"><span class="art">${art(info.art)}</span>
          <div><b>${esc(info.name)}</b><span>${cart.rub(info.price)} × ${qty} = ${cart.rub(info.price * qty)}</span></div>
          <span data-ctl="${key}">${ctl(key)}</span></li>`).join("");
      countTo(el.querySelector("[data-sum]"), cart.summary().total, cart.rub);
      el.querySelector("[data-fee-name]").hidden = el.querySelector("[data-fee]").hidden = state.mode !== "delivery";
      el.querySelector("[data-fee]").textContent = cart.rub(fee());
      countTo(el.querySelector("[data-total]"), total(), cart.rub);
      el.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.mode === state.mode)));
      el.querySelector(".seg-pill").style.transform = `translateX(${idx * 100}%)`;
      el.querySelector('[data-for="time"]').hidden = state.mode !== "pickup";
      el.querySelector('[data-for="addr"]').hidden = state.mode !== "delivery";
      el.querySelectorAll("[data-f]").forEach((x) => { if (document.activeElement !== x) x.value = state[x.dataset.f]; });
    });
    link();
  }

  return { mount, update, message, total };
})();
