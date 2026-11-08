// Админка меню «Рамбургер»: вход через Google, правки блюд и разделов в Firebase.
// Правки лежат в Firestore, документ menu/live, поле json (вид правок: js/live.js).
// Каждая правка: транзакция (два админа не затрут друг друга) и копия в history, чтобы вернуть меню назад.
// Кто может писать: firestore.rules (автор всегда, остальные из config/admins).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, runTransaction, serverTimestamp, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { createUI } from "./ui.js?v=a53962a7";

const L = window.Live;
const BASE = window.MENU_DATA;
const app = initializeApp(L.FB);
const auth = getAuth(app);
const db = getFirestore(app);
const LIVE = doc(db, "menu", "live");
const TEAM = doc(db, "config", "admins");

let user = null, live = null, admins = null, stop = null;
const baseIds = new Set(BASE.menu.flatMap((g) => g.items.map((it) => it.id)));
// Фото блюд из файла меню и фото без блюда (spare): всё это видно в выборе фото
const basePhotos = BASE.menu.flatMap((g) => g.items.map((it) => it.photo)).filter(Boolean).concat(BASE.spare || []);

const draw = () => ui.render(L.merge(BASE, live), admins, user.email);
const said = (e) => (e && e.code === "permission-denied" ? "Нет прав на правку меню" : "Не сохранилось. Проверьте интернет и попробуйте ещё раз.");

// Записать правку: change(правки) меняет объект правок на месте
async function save(change, note) {
  try {
    let json = "";
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(LIVE);
      const cur = snap.exists() ? JSON.parse(snap.data().json) : {};
      cur.items = cur.items || {};
      cur.sections = cur.sections || {};
      change(cur);
      json = JSON.stringify(cur);
      // Почта только в закрытой истории: menu/live читают все гости
      tx.set(LIVE, { json, at: serverTimestamp() });
    });
    addDoc(collection(db, "history"), { json, at: serverTimestamp(), by: user.email }).catch(() => { /* копия не главное */ });
    ui.toast(note || "Сохранено. Гости увидят при следующем открытии меню.");
    return true;
  } catch (e) {
    console.warn(e);
    ui.toast(said(e));
    return false;
  }
}

const KEEP = ["name", "desc", "price", "options", "photo", "icon", "hidden", "off", "hit", "discount"];

const ui = createUI({
  signOut: () => signOut(auth),
  photos: () => basePhotos,
  isAdded: (id) => !!(id && !baseIds.has(id)),

  // Быстрые переключатели в списке: «В меню», «Хит»
  patch: (id, p) => save((cur) => { cur.items[id] = Object.assign(cur.items[id] || {}, p); },
    "hidden" in p ? (p.hidden ? "Блюдо скрыто от гостей" : "Блюдо снова в меню") : p.hit ? "Блюдо в «Хитах»" : "Убрано из «Хитов»"),

  // Тумблер раздела. Название и отметку нового раздела не трогаем.
  section: (id, hidden) => save((cur) => { cur.sections[id] = Object.assign(cur.sections[id] || {}, { hidden }); }, hidden ? "Раздел скрыт от гостей" : "Раздел снова в меню"),

  // Новый раздел встаёт в конец меню. Удалить можно только его и только пустой (проверка в settings.js).
  addSection: (title) => save((cur) => { cur.sections["s" + Date.now().toString(36)] = { title, added: true }; }, "Раздел добавлен. Добавьте в него блюдо."),
  removeSection: (id) => save((cur) => { delete cur.sections[id]; }, "Раздел удалён"),

  // Заказ у гостей: ночью, с собой, сёла с ценой, оплата (вид: js/live.js)
  setOrder: (order) => save((cur) => { cur.order = order; }, "Настройки заказа сохранены"),

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
    return save((cur) => { cur.items[newId] = Object.assign(cur.items[newId] || {}, p); }, id ? "Сохранено" : "Блюдо добавлено");
  },

  // Удалить можно только блюдо, созданное в админке. Блюда из меню кафе скрывают.
  remove: (id) => save((cur) => { delete cur.items[id]; }, "Блюдо удалено"),

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

onAuthStateChanged(auth, async (u) => {
  user = u;
  if (stop) { stop(); stop = null; }
  live = null;
  if (!u) {
    ui.login(() => signInWithPopup(auth, new GoogleAuthProvider()).catch((e) => {
      if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") ui.toast("Вход не получился: " + (e.code || "ошибка"));
    }));
    return;
  }
  // Читать список админов может только админ: так и узнаём, есть ли доступ
  try {
    const t = await getDoc(TEAM);
    admins = t.exists() ? t.data().emails || [] : [];
  } catch (e) {
    ui.denied(u.email);
    return;
  }
  stop = onSnapshot(LIVE, (s) => {
    try { live = s.exists() ? JSON.parse(s.data().json) : null; } catch (e) { live = null; }
    draw();
  }, () => ui.toast("Нет связи с базой. Проверьте интернет."));
});
