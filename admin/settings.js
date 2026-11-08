// Админка: настройки заказа у гостей (ночные заказы, «с собой», сёла доставки с ценой, оплата) и новые разделы меню.
// Вид настроек: js/live.js (order, sections). Запись в базу: admin.js (setOrder, addSection, removeSection).
// Экраны блюд и общий список: ui.js. Отсюда он берёт только кнопку настроек и форму нового раздела.

export function createSettings(h) {
  // h: { openSheet, closeSheet, toast, esc, num, act, get: () => меню с правками }
  const { esc } = h;
  const $ = (id) => document.getElementById(id);
  const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
  let ed = null;

  const summary = (o) => [
    `ночью ${o.night ? "принимаем" : "не принимаем"}`,
    `с собой ${o.pickup ? "можно" : "нельзя"}`,
    `сёл: ${o.places.length}`,
    `оплата: ${o.pay.length ? o.pay.length + " вида" : "не спрашиваем"}`,
  ].join(" · ");

  // Кнопка на главном экране
  function card(o) {
    return `<button type="button" class="ad-set-open" data-setopen>
      <span><b>Заказ у гостей</b><small>${esc(summary(o))}</small></span><i>Изменить</i></button>`;
  }

  // Форма нового раздела под списком блюд
  function sectionForm() {
    return `<form class="ad-secadd" id="adSecForm">
      <h2>Новый раздел</h2>
      <p>Например, «Напитки». Раздел встанет в конец меню. Гости увидят его, когда в нём будет блюдо: «+ Блюдо», поле «Раздел».</p>
      <div class="ad-secadd-row">
        <input id="adSecName" maxlength="30" placeholder="Название раздела" autocomplete="off" required aria-label="Название нового раздела">
        <button class="btn btn-main" type="submit">Добавить</button>
      </div>
    </form>`;
  }

  function sw(key, label, note) {
    const on = !!ed[key];
    return `<button type="button" class="ad-sw ad-sw-row${on ? " on" : ""}" role="switch" aria-checked="${on}" data-setsw="${key}"><i></i><span><b>${label}</b><small>${note}</small></span></button>`;
  }

  function draw() {
    const C = h.get().cafe;
    h.openSheet(`<div class="ad-set">
      <h2 id="adSheetTitle">Заказ у гостей</h2>
      <div class="ad-sws">
        ${sw("night", "Принимаем заказы ночью", `С ${C.close}:00 до ${C.open}:00. Выключено: ночью гость видит «Сейчас заказы не принимаем» и не может отправить заказ.`)}
        ${sw("pickup", "Можно забрать самому", "Выключено: в заказе только доставка.")}
      </div>
      <div class="ad-f"><span>Сёла доставки и цена</span>
        ${ed.places.map((p, i) => `<div class="ad-opt">
          <input data-plname="${i}" value="${esc(p.name)}" placeholder="Село" maxlength="30" aria-label="Название села">
          <input data-plprice="${i}" inputmode="numeric" pattern="[0-9]*" value="${p.price === null ? "" : p.price}" placeholder="?" aria-label="Цена доставки, рублей"><span>₽</span>
          <button type="button" class="ad-mini" data-pldel="${i}" aria-label="Убрать село">×</button>
        </div>`).join("")}
        <small class="ad-set-hint">Цена пустая: гость увидит «цену доставки скажет кафе». Цена 0: доставка бесплатная.</small>
        <button type="button" class="ad-link" data-pladd>Ещё село</button>
      </div>
      <div class="ad-f"><span>Оплата</span>
        ${ed.pay.map((x, i) => `<div class="ad-opt">
          <input data-payname="${i}" value="${esc(x)}" placeholder="Например, наличными при получении" maxlength="40" aria-label="Способ оплаты">
          <button type="button" class="ad-mini" data-paydel="${i}" aria-label="Убрать способ оплаты">×</button>
        </div>`).join("")}
        <small class="ad-set-hint">Гость выбирает один способ, он попадёт в заказ. Список пустой: оплату гость не выбирает.</small>
        <button type="button" class="ad-link" data-payadd>Ещё способ</button>
      </div>
      <div class="ad-ed-actions">
        <button type="button" class="btn btn-main btn-wide" data-setsave>Сохранить</button>
        <button type="button" class="btn btn-soft btn-wide" data-close>Отмена</button>
      </div>
    </div>`);
  }

  // Поля окна в черновик
  function read() {
    if (!document.querySelector(".ad-set")) return ed;
    ed.places = ed.places.map((p, i) => {
      const v = document.querySelector(`[data-plprice="${i}"]`).value.trim();
      return { name: clean(document.querySelector(`[data-plname="${i}"]`).value), price: v === "" ? null : h.num(v) };
    });
    ed.pay = ed.pay.map((x, i) => clean(document.querySelector(`[data-payname="${i}"]`).value));
    return ed;
  }

  const twice = (list) => new Set(list.map((x) => x.toLowerCase())).size < list.length;
  async function save(btn) {
    const e = read();
    const places = e.places.filter((p) => p.name), pay = e.pay.filter(Boolean);
    if (twice(places.map((p) => p.name))) return h.toast("Два села с одним названием");
    if (twice(pay)) return h.toast("Два одинаковых способа оплаты");
    btn.disabled = true;
    const ok = await h.act.setOrder({ night: !!e.night, pickup: !!e.pickup, places, pay });
    btn.disabled = false;
    if (ok) { ed = null; h.closeSheet(); }
  }

  function focusLast(sel) {
    const all = document.querySelectorAll(sel);
    if (all.length) all[all.length - 1].focus();
  }

  document.addEventListener("click", async (ev) => {
    const t = ev.target.closest("button");
    if (!t) return;
    const d = t.dataset;
    if (d.setopen !== undefined) { ed = JSON.parse(JSON.stringify(h.get().order)); return draw(); }
    // Удалить можно только раздел из админки и только пустой: блюда сначала переносят
    if (d.delsec) {
      const g = h.get().menu.find((x) => x.id === d.delsec);
      if (g && g.items.some((it) => !it.deleted)) return h.toast("Сначала перенесите блюда в другой раздел");
      if (d.sure !== "1") { d.sure = "1"; t.textContent = "Точно удалить?"; return; }
      return h.act.removeSection(d.delsec);
    }
    if (!ed || !t.closest(".ad-set")) return;
    if (d.setsw) {
      ed[d.setsw] = !ed[d.setsw];
      t.classList.toggle("on", ed[d.setsw]); t.setAttribute("aria-checked", ed[d.setsw]);
      return;
    }
    if (d.pladd !== undefined) { read(); ed.places.push({ name: "", price: null }); draw(); return focusLast("[data-plname]"); }
    if (d.pldel) { read(); ed.places.splice(Number(d.pldel), 1); return draw(); }
    if (d.payadd !== undefined) { read(); ed.pay.push(""); draw(); return focusLast("[data-payname]"); }
    if (d.paydel) { read(); ed.pay.splice(Number(d.paydel), 1); return draw(); }
    if (d.setsave !== undefined) return save(t);
  });

  document.addEventListener("submit", async (ev) => {
    if (ev.target.id !== "adSecForm") return;
    ev.preventDefault();
    const name = clean($("adSecName").value);
    if (!name) return;
    if (h.get().menu.some((g) => g.title.toLowerCase() === name.toLowerCase())) return h.toast("Такой раздел уже есть");
    if (await h.act.addSection(name)) $("adSecName").value = "";
  });

  return { card, sectionForm };
}
