// Админка меню «Рамбургер»: вход через Google, правки блюд и разделов в Firebase.
// В Telegram (мини-приложение «Меню кафе», 2026-11-08) вход без Google: пропуск даёт бот (admin/tg.js).
// Правки лежат в Firestore, документ menu/live, поле json (вид правок: js/live.js).
// Каждая правка: транзакция (два админа не затрут друг друга) и копия в history, чтобы вернуть меню назад.
// Кто может писать: firestore.rules (автор всегда, остальные из config/admins, из Telegram: Ильяс и автор).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCustomToken, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, runTransaction, serverTimestamp, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { createUI } from "./ui.js?v=c9875229";
import { TG, tgStart, tgVhod, tgFoto, tgKopiya, tgZakryt, tgOtkaz, tgZagruzitFoto } from "./tg.js?v=c9875229";

const L = window.Live;
const BASE = window.MENU_DATA;
const app = initializeApp(L.FB);
const auth = getAuth(app);
const db = getFirestore(app);
const LIVE = doc(db, "menu", "live");
const TEAM = doc(db, "config", "admins");

// kto: кто правит, только для history. Почта Google или «Telegram: Ильяс» из пропуска бота.
let user = null, live = null, admins = null, stop = null, kto = "";
if (TG) tgStart();
const baseIds = new Set(BASE.menu.flatMap((g) => g.items.map((it) => it.id)));
// Фото блюд из файла меню и фото без блюда (spare): всё это видно в выборе фото
const basePhotos = BASE.menu.flatMap((g) => g.items.map((it) => it.photo)).filter(Boolean).concat(BASE.spare || []);

// Удалённые блюда админка видит (вкладка «Удалённые»), гость нет. В Telegram списка админов нет: его меняет автор через Google.
const draw = () => ui.render(L.merge(BASE, live, { deleted: true }), TG ? null : admins, user.email || kto.replace("Telegram: ", "") + " (Telegram)");
const said = (e) => (e && e.code === "permission-denied" ? "Нет прав на правку меню" : "Не сохранилось. Проверьте интернет и попробуйте ещё раз.");

// Записать правку: change(правки) меняет объект правок на месте. id: блюдо, для копии автору из Telegram.
// quiet: копию автору не слать (порядок: каждое нажатие стрелки было бы письмом).
async function save(change, note, id, quiet) {
  try {
    let json = "", bylo = null;
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(LIVE);
      const cur = snap.exists() ? JSON.parse(snap.data().json) : {};
      cur.items = cur.items || {};
      cur.sections = cur.sections || {};
      bylo = id && cur.items[id] ? JSON.parse(JSON.stringify(cur.items[id])) : null;
      change(cur);
      json = JSON.stringify(cur);
      // Почта только в закрытой истории: menu/live читают все гости
      tx.set(LIVE, { json, at: serverTimestamp() });
    });
    addDoc(collection(db, "history"), { json, at: serverTimestamp(), by: kto }).catch(() => { /* копия не главное */ });
    // Правка Ильяса из Telegram: бот пришлёт автору, что изменилось (как о правке в чате).
    // Запрос к боту до ~4 КБ (больше Cloudflare из России не принимает): длинная правка уходит одной заметкой.
    if (TG && !quiet) {
      const telo = id ? { id, bylo } : { zametka: note };
      tgKopiya(JSON.stringify(telo).length < 2500 ? telo : { zametka: note });
    }
    ui.toast(note || "Сохранено. Гости увидят при следующем открытии меню.");
    return true;
  } catch (e) {
    console.warn(e);
    ui.toast(said(e));
    return false;
  }
}

const KEEP = ["name", "desc", "price", "options", "photo", "icon", "hidden", "off", "hit", "discount"];
const PREVIEW = {}; // фото с телефона: адрес на GitHub Pages → копия в памяти телефона (admin/ui.js, PIC)
const razdel = (id) => (L.merge(BASE, live, { deleted: true }).menu.find((g) => g.id === id) || {}).title || "";

const ui = createUI({
  signOut: () => signOut(auth),
  photos: () => basePhotos,

  // Быстрые переключатели в списке: «В меню», «Хит»
  patch: (id, p) => save((cur) => { cur.items[id] = Object.assign(cur.items[id] || {}, p); },
    "hidden" in p ? (p.hidden ? "Блюдо скрыто от гостей" : "Блюдо снова в меню") : p.hit ? "Блюдо в «Хитах»" : "Убрано из «Хитов»", id),

  // Тумблер раздела. Название и отметку нового раздела не трогаем.
  section: (id, hidden) => save((cur) => { cur.sections[id] = Object.assign(cur.sections[id] || {}, { hidden }); },
    `Раздел «${razdel(id)}» ` + (hidden ? "скрыт от гостей" : "снова в меню")),

  // Порядок вручную (js/live.js, sort): весь список разделов или блюд раздела
  sortSections: (ids) => save((cur) => { cur.sort = cur.sort || {}; cur.sort.sections = ids; }, "Порядок разделов сохранён", null, true),
  sortItems: (sec, ids) => save((cur) => {
    cur.sort = cur.sort || {};
    cur.sort.items = cur.sort.items || {};
    cur.sort.items[sec] = ids;
  }, "Порядок блюд сохранён", null, true),

  // Новый раздел встаёт в конец меню. Удалить можно только его и только пустой (проверка в settings.js).
  addSection: (title) => save((cur) => { cur.sections["s" + Date.now().toString(36)] = { title, added: true }; }, `Раздел «${title}» добавлен. Добавьте в него блюдо.`),
  removeSection: (id) => save((cur) => { delete cur.sections[id]; }, `Раздел «${razdel(id)}» удалён`),

  // Заказ у гостей: ночью, с собой, сёла с ценой, оплата (вид: js/live.js)
  setOrder: (order) => save((cur) => { cur.order = order; }, "Настройки заказа сохранены"),
  // Акция в меню (2026-11-12): баннер у гостей и строка «Акция» в заказе
  setPromo: (promo) => save((cur) => { cur.promo = promo; }, promo.active ? "Акция в меню включена" : "Акция выключена"),

  // Окно блюда: всё, что в нём, ложится в правку целиком
  saveItem(id, e) {
    const p = {};
    KEEP.forEach((k) => { p[k] = e[k]; });
    // null и "" тоже правка: «без размеров» и «без фото» перекрывают меню из файла
    p.options = e.options && e.options.length ? e.options : null;
    p.photo = e.photo || "";
    p.section = e.section;
    const newId = id || "a" + Date.now().toString(36);
    if (!baseIds.has(newId)) p.added = true;
    return save((cur) => { cur.items[newId] = Object.assign(cur.items[newId] || {}, p); }, id ? "Сохранено" : "Блюдо добавлено", newId);
  },

  // Удалить можно любое блюдо (2026-11-08): отметка deleted, правка остаётся. Вернуть: вкладка «Удалённые».
  remove: (id) => save((cur) => { cur.items[id] = Object.assign(cur.items[id] || {}, { deleted: true }); },
    "Блюдо удалено. Вернуть можно во вкладке «Удалённые».", id),
  restore: (id) => save((cur) => {
    const p = cur.items[id];
    if (!p) return;
    delete p.deleted;
    if (!Object.keys(p).length) delete cur.items[id];
  }, "Блюдо снова в меню", id),

  // Только в Telegram: фото с телефона (галерея или камера) сразу у блюда, в меню оно встанет после «Сохранить».
  // Человек закрыл выбор фото без фото: обещание так и не выполнится, это не мешает.
  uploadPhoto: TG ? () => new Promise((gotovo) => {
    const vybor = document.createElement("input");
    vybor.type = "file";
    vybor.accept = "image/*";
    vybor.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0";
    document.body.appendChild(vybor);
    vybor.onchange = async () => {
      const fail = vybor.files && vybor.files[0];
      vybor.remove();
      if (!fail) return gotovo(null);
      ui.toast("Загружаю фото…");
      try {
        // Фото в базу (папка foto, правила: только по пропуску из Telegram), бот заберёт его по номеру
        const vBazu = async (data) => (await addDoc(collection(db, "foto"), { data, at: serverTimestamp(), by: kto })).id;
        const { url, preview } = await tgZagruzitFoto(fail, vBazu);
        PREVIEW[url] = preview;
        ui.toast("Фото у блюда. Нажмите «Сохранить». Гости увидят его в течение минуты.");
        gotovo(url);
      } catch (e) {
        console.warn(e);
        ui.toast(e.code === "bolshoe" ? "Фото слишком большое. Выберите другое." : "Фото не загрузилось. Пришлите его в чат бота: «Сменить фото», «Новое фото: прислать в чат».");
        gotovo(null);
      }
    };
    vybor.click();
  }) : null,
  preview: PREVIEW,

  // Только в Telegram: новое фото блюду присылают в чат бота, приложение закрывается
  newPhoto: TG ? async (id) => {
    try {
      await tgFoto(id);
      tgZakryt();
    } catch (e) {
      ui.toast("Не получилось. Пришлите фото в чат бота: «Изменить меню», блюдо, «Фото».");
    }
  } : null,

  async team(emails) {
    try {
      await setDoc(TEAM, { emails });
      admins = emails;
      draw();
      ui.toast("Список админов сохранён");
    } catch (e) {
      ui.toast(e.code === "permission-denied" ? "Список админов меняет только автор меню" : said(e));
    }
  },
});

// Вход из Telegram: бот проверяет подпись Telegram и даёт пропуск Firebase (bot/src/prilozhenie.js)
async function tgLogin() {
  try {
    await signInWithCustomToken(auth, await tgVhod());
  } catch (e) {
    console.warn(e);
    tgOtkaz(e.code);
  }
}

onAuthStateChanged(auth, async (u) => {
  user = u;
  if (stop) { stop(); stop = null; }
  live = null;
  // В Telegram этого телефона вошёл другой человек: выйти и войти заново по его Telegram
  if (TG && u && u.uid !== TG.uid) { signOut(auth); return; }
  if (!u) {
    if (TG) return tgLogin();
    ui.login(() => signInWithPopup(auth, new GoogleAuthProvider()).catch((e) => {
      if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") ui.toast("Вход не получился: " + (e.code || "ошибка"));
    }));
    return;
  }
  kto = u.email || "";
  if (!kto) {
    try { kto = (await u.getIdTokenResult()).claims.kto || ""; } catch (e) { kto = ""; }
  }
  // Читать список админов может только админ: так и узнаём, есть ли доступ
  try {
    const t = await getDoc(TEAM);
    admins = t.exists() ? t.data().emails || [] : [];
  } catch (e) {
    if (TG) tgOtkaz("prava");
    else ui.denied(u.email);
    return;
  }
  stop = onSnapshot(LIVE, (s) => {
    try { live = s.exists() ? JSON.parse(s.data().json) : null; } catch (e) { live = null; }
    draw();
  }, () => ui.toast("Нет связи с базой. Проверьте интернет."));
});
