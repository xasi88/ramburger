// Экраны админки: вход, список блюд по разделам, окно правки блюда, выбор фото, список админов.
// Данные и запись в базу: admin.js. Здесь только вид и нажатия. Настройки заказа и новые разделы: settings.js.

import { createSettings } from "./settings.js?v=5175baa2";
import { versiiStroka, versiiOkno } from "./versii.js?v=5175baa2";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const rub = (n) => Number(n).toLocaleString("ru-RU") + " ₽";
const num = (v) => Math.max(0, Math.round(Number(String(v).replace(/[^\d]/g, "")) || 0));
const svg = (d) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const EYE = svg('<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>');
const UP = svg('<path d="M12 19V5M5 12l7-7 7 7"/>');
const DOWN = svg('<path d="M12 5v14M5 12l7 7 7-7"/>');
const EYE_OFF = svg('<path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3 3.6M6.6 6.6C3.9 8.3 2 12 2 12s3.6 6 10 6a9.7 9.7 0 0 0 4.4-1"/>');
// Фото из файлов сайта лежат рядом (img/food/...), фото из Telegram-бота: полный адрес (bot/, 2026-11-08).
// PREVIEW: фото с телефона, пока GitHub Pages его выкладывает (до минуты), показываем из памяти телефона.
let PREVIEW = {};
const PIC = (p) => PREVIEW[p] || (/^https?:\/\//.test(p) ? p : "../" + p);

export function createUI(act) {
  if (act.preview) PREVIEW = act.preview;
  const L = window.Live;
  // sort: режим «Порядок», стрелки у разделов и блюд (2026-11-09)
  const st = { filter: "all", q: "", menu: null, admins: null, email: "", ed: null, edId: null, lock: 0, sort: false };
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Окно снизу: правка блюда или выбор фото
  function openSheet(html) {
    $("adSheetBody").innerHTML = html;
    const s = $("adSheet");
    s.classList.add("open");
    s.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    s.querySelector(".sheet-card").scrollTop = 0;
  }
  function closeSheet() {
    const s = $("adSheet");
    s.classList.remove("open");
    s.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    st.ed = null; st.edId = null;
  }

  let toastTimer;
  function toast(text) {
    const t = $("toast");
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  const settings = createSettings({ openSheet, closeSheet, toast, esc, num, act, get: () => st.menu });

  // Вход и отказ
  function login(onSignIn) {
    $("adOut").hidden = true; $("adAdd").hidden = true;
    $("adMain").innerHTML = `<section class="ad-login">
      <span class="ad-login-mark">${window.LOGO}</span>
      <h1>Админка меню</h1>
      <p>Здесь кафе меняет названия, цены и фото блюд, включает и выключает блюда и разделы, ставит скидки и настраивает заказ. Правки сохраняются сразу, гости видят их при следующем открытии меню.</p>
      <button class="btn btn-main btn-wide" type="button" id="adSignIn">Войти через Google</button>
    </section>`;
    $("adSignIn").onclick = onSignIn;
  }
  function denied(email) {
    $("adOut").hidden = false; $("adAdd").hidden = true;
    $("adMain").innerHTML = `<section class="ad-login">
      <h1>Нет доступа</h1>
      <p>Почты <b>${esc(email)}</b> нет в списке админов. Попросите автора меню добавить её и войдите снова.</p>
      <button class="btn btn-soft btn-wide" type="button" data-signout>Войти другой почтой</button>
    </section>`;
  }

  // Что видно в списке. Удалённые блюда (deleted) видны только во вкладке «Удалённые», их можно вернуть.
  const all = () => st.menu.menu.flatMap((g) => g.items.map((it) => ({ it, g })));
  const alive = () => all().filter(({ it }) => !it.deleted);
  const needs = (it) => !String(it.name || "").trim() || !L.priced(it);
  const FILTERS = [
    ["all", "Все", () => true],
    ["new", "Новые фото", (it) => needs(it)],
    ["hidden", "Скрыто", (it) => !L.visible(it)],
    ["hits", "Хиты", (it) => it.hit],
    ["sale", "Скидки", (it) => it.discount > 0],
    ["deleted", "Удалённые", () => true],
  ];
  const pass = (id, it) => (id === "deleted") === !!it.deleted && FILTERS.find((x) => x[0] === id)[2](it);

  function priceText(it) {
    if (it.options && it.options.length) return it.options.map((o) => `${esc(o.name)} ${rub(o.price)}`).join(" · ");
    return it.price > 0 ? rub(it.price) : "нет цены";
  }
  const thumb = (it) => (it.photo ? `<img src="${PIC(it.photo)}" alt="" loading="lazy" decoding="async">` : window.ICONS[it.icon] || window.ICONS.plate);

  // Стрелки «выше», «ниже». Двигать можно только среди соседей той же группы (js/live.js, rank).
  const arrows = (kind, id, up, down) => `<button class="ad-tg" type="button" data-move="${kind}" data-id="${esc(id)}" data-dir="-1"${up ? "" : " disabled"} aria-label="Выше">${UP}<span>Выше</span></button>
      <button class="ad-tg" type="button" data-move="${kind}" data-id="${esc(id)}" data-dir="1"${down ? "" : " disabled"} aria-label="Ниже">${DOWN}<span>Ниже</span></button>`;

  function row(it, up, down) {
    const vis = L.visible(it);
    const tail = st.sort ? arrows("i", it.id, up, down) : it.deleted
      ? `<button class="ad-mini" type="button" data-restore="${esc(it.id)}">Вернуть</button>`
      : `<button class="ad-tg${it.hidden ? "" : " on"}" type="button" data-toggle="show" data-id="${esc(it.id)}" aria-pressed="${!it.hidden}" aria-label="Показывать в меню">${it.hidden ? EYE_OFF : EYE}<span>${it.hidden ? "Скрыто" : "В меню"}</span></button>
      <button class="ad-tg ad-hit${it.hit ? " on" : ""}" type="button" data-toggle="hit" data-id="${esc(it.id)}" aria-pressed="${!!it.hit}" aria-label="Хит"><i>Хит</i><span>${it.hit ? "Да" : "Нет"}</span></button>`;
    return `<article class="ad-row${vis ? "" : " ad-dim"}" data-row="${esc(it.id)}">
      <button class="ad-open" type="button" data-edit="${esc(it.id)}">
        <span class="ad-thumb">${thumb(it)}</span>
        <span class="ad-info">
          <b class="${it.name ? "" : "ad-noname"}">${esc(it.name) || "Без названия"}</b>
          <small>${priceText(it)}${it.discount > 0 ? ` <em class="ad-mk">−${it.discount}%</em>` : ""}${it.off ? ` <em class="ad-mk">нет в наличии</em>` : ""}</small>
        </span>
      </button>
      ${tail}
    </article>`;
  }

  // Порядок списка: js/live.js (sortSections, sortItems). Включённое вверху, выключенное внизу.
  // move: строки, которые сменили место, плавно переезжают (поиск и вкладки перерисовывают без переезда).
  // keep: строка, которая остаётся под пальцем (режим «Порядок»): страница едет вместе с ней.
  function list(move = true, keep) {
    const box = $("adList"), was = {};
    // Переезд ещё идёт (база ответила раньше конца анимации): сначала довести строки до места, потом мерить
    if (move) box.querySelectorAll("[data-row]").forEach((el) => {
      if (el.getAnimations) el.getAnimations().forEach((a) => a.finish());
      was[el.dataset.row] = el.getBoundingClientRect().top;
    });
    const same = (a, b, r) => !!a && !!b && r(a) === r(b);
    const secs = L.sortSections(st.menu.menu), secRank = (g) => (g.hidden ? 1 : 0);
    const q = st.q.toLowerCase().replace(/ё/g, "е");
    const hit = (it, g) => !q || `${it.name} ${it.desc} ${g.title}`.toLowerCase().replace(/ё/g, "е").includes(q);
    const gone = st.filter === "deleted";
    const html = secs.map((g, si) => {
      const items = L.sortItems(g.items.filter((it) => pass(st.filter, it) && hit(it, g)));
      const tools = st.sort
        ? arrows("s", g.id, same(secs[si - 1], g, secRank), same(secs[si + 1], g, secRank))
        : `<button class="ad-sw${!g.hidden ? " on" : ""}" type="button" role="switch" aria-checked="${!g.hidden}" data-sec="${esc(g.id)}"><i></i>${!g.hidden ? "Раздел виден" : "Раздел скрыт"}</button>
          ${g.added ? `<button type="button" class="ad-mini" data-delsec="${esc(g.id)}">Удалить раздел</button>` : ""}`;
      if (!items.length && (st.filter !== "all" || q)) return "";
      const shown = !g.hidden, here = g.items.filter((it) => !it.deleted);
      return `<section class="ad-sec${shown ? "" : " ad-sec-off"}" data-row="s:${esc(g.id)}">
        <header class="ad-sec-head">
          <h2>${esc(g.title)} <span>${shown ? `${here.filter(L.visible).length} из ${here.length}` : "скрыт"}</span></h2>
          <div class="ad-sec-tools">${tools}</div>
        </header>
        ${shown || gone || st.sort ? "" : `<p class="ad-sec-note">Гости не видят этот раздел и его блюда. Включите тумблер, и раздел вернётся в меню.</p>`}
        ${shown && !gone && !st.sort && !here.length ? `<p class="ad-sec-note">Раздел пустой, гости его пока не видят. Нажмите «+ Блюдо» и выберите этот раздел.</p>` : ""}
        ${items.map((it, i) => row(it, same(items[i - 1], it, L.rank), same(items[i + 1], it, L.rank))).join("")}
      </section>`;
    }).join("");
    const top = gone ? `<p class="ad-sec-note">Удалённые блюда гости не видят. Нажмите «Вернуть», и блюдо снова в меню на прежнем месте.</p>`
      : st.sort ? `<p class="ad-sec-note">Кнопками «Выше» и «Ниже» двигайте разделы и блюда. Гости увидят новый порядок при следующем открытии меню. Скрытые и «нет в наличии» всегда стоят ниже остальных.</p>` : "";
    box.innerHTML = top + (html || `<p class="ad-empty">${gone ? "Удалённых блюд нет." : "Ничего не нашлось."}</p>`);
    if (keep && keep in was) {
      const el = box.querySelector(`[data-row="${CSS.escape(keep)}"]`);
      if (el) window.scrollBy(0, el.getBoundingClientRect().top - was[keep]);
    }
    if (move) slide(box, was, keep);
  }

  // Режим «Порядок»: поменять местами с соседом выше или ниже. Записывается весь порядок разделов или блюд раздела.
  async function shift(kind, id, dir) {
    const m = st.menu.menu;
    let arr, a, view, r;
    if (kind === "s") {
      arr = m; a = m.find((g) => g.id === id); view = L.sortSections(m); r = (g) => (g.hidden ? 1 : 0);
    } else {
      const g = m.find((x) => x.items.some((it) => it.id === id));
      if (!g) return;
      arr = g.items; a = arr.find((it) => it.id === id); view = L.sortItems(arr.filter((it) => !it.deleted)); r = L.rank;
    }
    const b = view[view.indexOf(a) + dir];
    if (!a || !b || r(a) !== r(b)) return;
    const swap = () => { const i = arr.indexOf(a), j = arr.indexOf(b); arr[i] = b; arr[j] = a; };
    swap();
    const key = kind === "s" ? "s:" + id : id;
    list(true, key);
    const ids = arr.map((x) => x.id);
    const sec = kind === "s" ? null : m.find((g) => g.items === arr);
    const ok = sec ? await act.sortItems(sec.id, ids) : await act.sortSections(ids);
    if (!ok) { swap(); list(true); }
  }

  // Переезд: строка едет со старого места на новое, раздел едет целиком.
  // Полсекунды после переезда нажатия в списке не срабатывают: на место уехавшей строки встаёт соседняя,
  // и второе нажатие попало бы в чужое блюдо (так 2026-11-08 удалился «Гамбургер»).
  function slide(box, was, keep) {
    const els = Array.from(box.querySelectorAll("[data-row]")), dy = new Map();
    els.forEach((el) => dy.set(el, (el.dataset.row in was ? was[el.dataset.row] : NaN) - el.getBoundingClientRect().top));
    let moved = false;
    els.forEach((el) => {
      const sec = el.parentElement.closest("[data-row]");
      const d = dy.get(el) - (sec && isFinite(dy.get(sec)) ? dy.get(sec) : 0);
      if (!isFinite(d) || Math.abs(d) < 2) return;
      moved = true;
      if (!reduced() && el.animate) el.animate([{ transform: `translateY(${d}px)` }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
    });
    // Строка осталась под пальцем (режим «Порядок»): второе нажатие попадёт в неё же, ждать не нужно
    const held = keep && box.querySelector(`[data-row="${CSS.escape(keep)}"]`);
    if (moved && !(held && Math.abs(dy.get(held)) < 2)) st.lock = Date.now() + 600;
  }

  function team() {
    if (!st.admins) return "";
    return `<section class="ad-team">
      <h2>Кто может править меню</h2>
      <p>Вход через Google. Автор меню входит всегда. Список меняет только автор.</p>
      <ul>${st.admins.map((e) => `<li><span>${esc(e)}</span><button type="button" class="ad-mini" data-unadmin="${esc(e)}">Убрать</button></li>`).join("") || "<li><span>Пока никого</span></li>"}</ul>
      <form class="ad-team-add" id="adTeamForm">
        <input type="email" id="adTeamEmail" placeholder="Почта Google" autocomplete="off" required aria-label="Почта нового админа">
        <button class="btn btn-main" type="submit">Добавить</button>
      </form>
    </section>`;
  }

  // Главный экран: первый раз целиком, потом только список
  function render(menu, admins, email, move = true) {
    const first = !st.menu;
    st.menu = menu; st.admins = admins; st.email = email;
    $("adOut").hidden = false; $("adAdd").hidden = false;
    const fresh = alive().filter(({ it }) => needs(it)).length;
    if (first || !$("adList")) {
      $("adMain").innerHTML = `
        <div class="ad-top">
          <p class="ad-hello">Вы вошли: ${esc(email)}. Правки сохраняются сразу, гости видят их при следующем открытии меню.</p>
          <p class="ad-note" id="adFresh"></p>
          <div id="adSet"></div>
          <div class="ad-tabs" id="adTabs" role="tablist"></div>
          <button type="button" class="ad-sort-btn" id="adSort" aria-pressed="false"></button>
          <label class="ad-search" id="adSearch">${svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>')}<input type="search" id="adQ" placeholder="Найти блюдо" autocomplete="off" aria-label="Найти блюдо"></label>
        </div>
        <div id="adList"></div>
        ${settings.sectionForm()}
        <div id="adTeam"></div>
        ${versiiStroka(esc)}`;
      $("adQ").addEventListener("input", (e) => { st.q = e.target.value.trim(); list(false); });
    }
    $("adFresh").hidden = !fresh;
    $("adFresh").innerHTML = `Новых фото без названия или цены: <b>${fresh}</b>. Откройте фото, впишите название и цену, включите «В меню».`;
    $("adTabs").innerHTML = FILTERS.map(([id, name]) => {
      const n = all().filter(({ it }) => pass(id, it)).length;
      if (id === "deleted" && !n && st.filter !== id) return "";
      return `<button type="button" role="tab" aria-selected="${st.filter === id}" data-filter="${id}">${name} <span>${n}</span></button>`;
    }).join("");
    $("adSet").innerHTML = settings.card(menu.order);
    // Режим «Порядок»: вкладки и поиск прячутся, видны все блюда, кроме удалённых
    $("adTabs").hidden = $("adSearch").hidden = $("adSet").hidden = st.sort;
    if (st.sort) $("adFresh").hidden = true;
    $("adSort").textContent = st.sort ? "Готово" : "Изменить порядок";
    $("adSort").setAttribute("aria-pressed", String(st.sort));
    $("adTeam").innerHTML = team();
    list(move);
  }

  // Окно правки блюда
  const sections = () => L.sortSections(st.menu.menu).map((g) => ({ id: g.id, title: g.title }));
  function editor(id) {
    const found = all().find(({ it }) => it.id === id);
    const it = found ? found.it : { id: null, name: "", desc: "", price: 0, icon: "plate", hidden: false };
    st.edId = id;
    st.ed = JSON.parse(JSON.stringify({
      name: it.name || "", desc: it.desc || "", price: it.price || 0, options: it.options || null, photo: it.photo || "",
      icon: it.icon || "plate", hidden: !!it.hidden, off: !!it.off, hit: !!it.hit, discount: it.discount || 0,
      section: found ? found.g.id : st.menu.menu[0].id, deleted: !!it.deleted,
    }));
    drawEditor();
  }

  function prices() {
    const e = st.ed;
    if (!e.options) {
      return `<div class="ad-price"><input id="edPrice" inputmode="numeric" pattern="[0-9]*" value="${e.price || ""}" placeholder="0" aria-label="Цена в рублях"><span>₽</span></div>
        <button type="button" class="ad-link" data-sizes="on">Добавить размеры (маленькая, большая, 6 шт)</button>`;
    }
    return e.options.map((o, i) => `<div class="ad-opt">
        <input data-optn="${i}" value="${esc(o.name)}" placeholder="Размер" maxlength="24" aria-label="Название размера">
        <input data-optp="${i}" inputmode="numeric" pattern="[0-9]*" value="${o.price || ""}" placeholder="0" aria-label="Цена размера"><span>₽</span>
        <button type="button" class="ad-mini" data-delopt="${i}" aria-label="Убрать размер">×</button>
      </div>`).join("") + `<button type="button" class="ad-link" data-addopt>Ещё размер</button> <button type="button" class="ad-link" data-sizes="off">Одна цена без размеров</button>`;
  }

  function sw(key, label, note) {
    const on = key === "show" ? !st.ed.hidden : !!st.ed[key];
    return `<button type="button" class="ad-sw ad-sw-row${on ? " on" : ""}" role="switch" aria-checked="${on}" data-edsw="${key}"><i></i><span><b>${label}</b><small>${note}</small></span></button>`;
  }

  function drawEditor() {
    const e = st.ed;
    openSheet(`<div class="ad-ed">
      <div class="ad-ed-photo">${e.photo ? `<img src="${PIC(e.photo).replace(/\.webp$/, "-big.webp")}" alt="">` : window.ICONS[e.icon] || window.ICONS.plate}
        <button type="button" class="ad-ed-pick" data-gallery>Сменить фото</button>
        ${act.uploadPhoto ? `<button type="button" class="ad-ed-pick ad-ed-up" data-upload>Фото с телефона</button>` : ""}</div>
      <div class="ad-ed-body">
        <h2 id="adSheetTitle">${st.edId ? "Блюдо" : "Новое блюдо"}</h2>
        ${e.deleted ? `<p class="ad-warn">Блюдо удалено, гости его не видят.</p>` : ""}
        <label class="ad-f"><span>Название</span><input id="edName" maxlength="60" value="${esc(e.name)}" placeholder="Например, Чизбургер"></label>
        <label class="ad-f"><span>Состав</span><textarea id="edDesc" maxlength="200" rows="2" placeholder="Можно оставить пустым">${esc(e.desc)}</textarea></label>
        <label class="ad-f"><span>Раздел</span><select id="edSec">${sections().map((s) => `<option value="${esc(s.id)}"${s.id === e.section ? " selected" : ""}>${esc(s.title)}</option>`).join("")}</select></label>
        <div class="ad-f"><span>Цена</span><div id="edPrices">${prices()}</div></div>
        <div class="ad-f"><span>Скидка</span><div class="ad-chips">${[0, 10, 15, 20, 30].map((d) => `<button type="button" data-disc="${d}" aria-pressed="${e.discount === d}">${d ? "−" + d + "%" : "Нет"}</button>`).join("")}</div></div>
        <div class="ad-sws">
          ${sw("show", "Показывать в меню", "Выключите, и гости не увидят блюдо")}
          ${sw("hit", "Хит", "Блюдо встанет в раздел «Хиты» вверху меню")}
          ${sw("off", "Нет в наличии", "Блюдо видно серым, заказать нельзя")}
        </div>
        <p class="ad-warn" id="edWarn" hidden></p>
        <div class="ad-ed-actions">
          <button type="button" class="btn btn-main btn-wide" data-save>Сохранить</button>
          <button type="button" class="btn btn-soft btn-wide" data-close>Отмена</button>
          ${!st.edId ? "" : e.deleted
            ? `<button type="button" class="btn btn-soft btn-wide" data-restore="${esc(st.edId)}">Вернуть в меню</button>`
            : `<button type="button" class="ad-del" data-remove>Удалить блюдо</button>`}
        </div>
      </div>
    </div>`);
    warn();
  }

  // Поля окна в st.ed
  function readForm() {
    const e = st.ed;
    if (!$("edName")) return e;
    e.name = $("edName").value.replace(/\s+/g, " ").trim();
    e.desc = $("edDesc").value.replace(/\s+/g, " ").trim();
    e.section = $("edSec").value;
    if (e.options) {
      e.options = e.options.map((o, i) => ({ name: document.querySelector(`[data-optn="${i}"]`).value.trim(), price: num(document.querySelector(`[data-optp="${i}"]`).value) }));
      e.price = e.options.length ? Math.min(...e.options.map((o) => o.price)) : 0;
    } else {
      e.price = num($("edPrice").value);
    }
    return e;
  }
  function warn() {
    const e = readForm(), w = $("edWarn");
    const miss = [!e.name && "название", !L.priced(e) && "цену"].filter(Boolean);
    w.hidden = !(miss.length && !e.hidden);
    w.textContent = `Гость не увидит блюдо, пока нет: ${miss.join(" и ")}.`;
  }

  function gallery() {
    readForm();
    const used = {};
    alive().forEach(({ it }) => { if (it.photo) (used[it.photo] = used[it.photo] || []).push(it.name || "без названия"); });
    const photos = Object.keys(used).concat(act.photos()).filter((p, i, a) => a.indexOf(p) === i).sort();
    openSheet(`<div class="ad-gal-wrap">
      <h2 id="adSheetTitle">Фото блюда</h2>
      <p>Нажмите на фото. Под фото написано, у какого блюда оно сейчас.</p>
      ${act.newPhoto && st.edId ? `<button type="button" class="btn btn-main btn-wide" data-newphoto>Новое фото: прислать в чат</button>
      <p>Приложение закроется, бот попросит фото. Несохранённые правки пропадут.</p>` : ""}
      <div class="ad-gal">
        <button type="button" data-pick="" class="ad-nopic${st.ed.photo ? "" : " on"}"><span>Без фото</span></button>
        ${photos.map((p) => `<button type="button" data-pick="${esc(p)}" class="${p === st.ed.photo ? "on" : ""}"><img src="${PIC(p)}" alt="" loading="lazy" decoding="async"><small>${esc((used[p] || ["свободно"]).join(", "))}</small></button>`).join("")}
      </div>
      <button type="button" class="btn btn-soft btn-wide" data-back>Назад к блюду</button>
    </div>`);
  }

  // Нажатия
  document.addEventListener("click", async (ev) => {
    const t = ev.target.closest("button, [data-close]");
    if (!t) return;
    if (Date.now() < st.lock && t.closest("#adList")) return; // строки ещё переезжают: slide()
    const d = t.dataset;
    if (d.signout !== undefined) return act.signOut();
    if (d.newphoto !== undefined) return act.newPhoto(st.edId);
    if (t.id === "adOut") return act.signOut();
    if (t.id === "adAdd") return editor(null);
    if (d.filter) { st.filter = d.filter; render(st.menu, st.admins, st.email, false); return; }
    if (t.id === "adSort") {
      st.sort = !st.sort;
      if (st.sort) { st.filter = "all"; st.q = ""; $("adQ").value = ""; }
      render(st.menu, st.admins, st.email, false);
      return;
    }
    if (d.move) return shift(d.move, d.id, Number(d.dir));
    if (d.edit) return editor(d.edit);
    // Тумблеры меняются на экране сразу, запись в базу идёт следом. Не записалось: тумблер встаёт назад.
    if (d.toggle) {
      const it = all().find((x) => x.it.id === d.id).it;
      if (d.toggle === "show" && it.hidden && (!it.name || !L.priced(it))) { toast("Сначала впишите название и цену"); return editor(it.id); }
      const key = d.toggle === "show" ? "hidden" : "hit", was = !!it[key];
      it[key] = !was;
      list();
      if (!(await act.patch(it.id, { [key]: !was }))) { it[key] = was; list(); }
      return;
    }
    if (d.sec) {
      const g = st.menu.menu.find((x) => x.id === d.sec), was = !!g.hidden;
      g.hidden = !was;
      list();
      if (!(await act.section(g.id, !was))) { g.hidden = was; list(); }
      return;
    }
    if (d.unadmin) return act.team(st.admins.filter((e) => e !== d.unadmin));
    if (d.versii !== undefined) return openSheet(versiiOkno(esc));
    // «Вернуть» в списке удалённых и в окне блюда
    if (d.restore) {
      t.disabled = true;
      const ok = await act.restore(d.restore);
      t.disabled = false;
      if (ok && st.ed) closeSheet();
      return;
    }
    if (!st.ed) { if (d.close !== undefined) closeSheet(); return; }
    // Дальше кнопки окна блюда
    if (d.close !== undefined) return closeSheet();
    if (d.gallery !== undefined) return gallery();
    // Фото с телефона (только в Telegram): пока грузится, человек мог открыть другое блюдо, тогда фото не ставим
    if (d.upload !== undefined) {
      const ed = st.ed, url = await act.uploadPhoto();
      if (url && st.ed === ed) { readForm(); st.ed.photo = url; drawEditor(); }
      return;
    }
    if (d.back !== undefined) return drawEditor();
    if (d.pick !== undefined) { st.ed.photo = d.pick; return drawEditor(); }
    if (d.sizes) {
      readForm();
      st.ed.options = d.sizes === "on" ? [{ name: "Маленькая", price: st.ed.price }, { name: "Большая", price: 0 }] : null;
      if (!st.ed.options) st.ed.price = st.ed.price || 0;
      return drawEditor();
    }
    if (d.addopt !== undefined) { readForm(); st.ed.options.push({ name: "", price: 0 }); return drawEditor(); }
    if (d.delopt) { readForm(); st.ed.options.splice(Number(d.delopt), 1); if (!st.ed.options.length) st.ed.options = null; return drawEditor(); }
    if (d.disc) { readForm(); st.ed.discount = Number(d.disc); document.querySelectorAll("[data-disc]").forEach((b) => b.setAttribute("aria-pressed", b === t)); return; }
    if (d.edsw) {
      const k = d.edsw;
      if (k === "show") st.ed.hidden = !st.ed.hidden; else st.ed[k] = !st.ed[k];
      const on = k === "show" ? !st.ed.hidden : st.ed[k];
      t.classList.toggle("on", on); t.setAttribute("aria-checked", on);
      return warn();
    }
    if (d.save !== undefined) {
      const e = readForm();
      if (e.options && e.options.some((o) => !o.name)) { toast("Впишите название каждого размера"); return; }
      t.disabled = true;
      const ok = await act.saveItem(st.edId, e);
      t.disabled = false;
      if (ok) closeSheet();
      return;
    }
    // Удаление (проба 2026-11-08): на месте «Удалить блюдо» встаёт «Нет, оставить», «Да, удалить» ниже, с названием.
    // Повторное нажатие в то же место (палец после закрытия клавиатуры) ничего не удаляет.
    if (d.remove !== undefined) {
      t.outerHTML = `<button type="button" class="btn btn-soft btn-wide" data-keep>Нет, оставить</button>
        <button type="button" class="ad-del" data-sure>Да, удалить «${esc(st.ed.name || "без названия")}»</button>`;
      return;
    }
    if (d.keep !== undefined) { readForm(); return drawEditor(); }
    if (d.sure !== undefined) {
      t.disabled = true;
      if (await act.remove(st.edId)) closeSheet();
      else t.disabled = false;
    }
  });
  document.addEventListener("input", (ev) => { if (st.ed && ev.target.closest(".ad-ed")) warn(); });
  document.addEventListener("submit", (ev) => {
    if (ev.target.id !== "adTeamForm") return;
    ev.preventDefault();
    const e = $("adTeamEmail").value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return toast("Похоже, в почте ошибка");
    if (st.admins.includes(e)) return toast("Эта почта уже в списке");
    act.team(st.admins.concat(e));
  });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && $("adSheet").classList.contains("open")) closeSheet(); });

  $("adMark").innerHTML = window.LOGO;
  return { login, denied, render, toast, closeSheet };
}
