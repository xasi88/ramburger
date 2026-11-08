// Админка в Telegram (мини-приложение, 2026-11-08): бот открывает её кнопкой «Меню кафе», вход без Google.
// Скрипт Telegram (telegram.org/js/telegram-web-app.js) не грузим: в России без VPN он не открывается.
// Данные входа Telegram кладёт в адрес страницы (#tgWebAppData=...). Их проверяет бот: bot/src/prilozhenie.js.
// Ответы бота меньше 1,5 КБ: Cloudflare в России без VPN обрывает ответ на 3-4 КБ.

const BOT = "https://ramburger-bot.gmarbigm.workers.dev";
const KOPIYA = "ramburger-tg"; // данные входа на время вкладки: адрес страницы может потерять #

function dannyeVhoda() {
  let d = "";
  try { d = new URLSearchParams(location.hash.slice(1)).get("tgWebAppData") || ""; } catch (e) { /* адрес без данных */ }
  try {
    if (d) sessionStorage.setItem(KOPIYA, d);
    else d = sessionStorage.getItem(KOPIYA) || "";
  } catch (e) { /* хранилище закрыто */ }
  return d;
}

const initData = dannyeVhoda();
let chelovek = null;
try { chelovek = JSON.parse(new URLSearchParams(initData).get("user") || "null"); } catch (e) { chelovek = null; }

// null: админку открыли в браузере, вход через Google
export const TG = initData && chelovek && chelovek.id ? { initData, uid: "tg-" + chelovek.id } : null;

// Сигналы Telegram, как в telegram-web-app.js: на телефоне и в Telegram Desktop TelegramWebviewProxy, в Telegram Web окно-родитель
function signal(tip, dannye) {
  try {
    if (window.TelegramWebviewProxy) window.TelegramWebviewProxy.postEvent(tip, JSON.stringify(dannye || {}));
    else if (window.parent !== window) window.parent.postMessage(JSON.stringify({ eventType: tip, eventData: dannye || {} }), "*");
  } catch (e) { /* не Telegram */ }
}

// Шапка Telegram цвета страницы, приложение во весь экран
export function tgStart() {
  document.body.classList.add("ad-telegram"); // .ad-tg занят тумблерами в списке блюд
  const cvet = getComputedStyle(document.documentElement).getPropertyValue("--mustard").trim();
  if (cvet) {
    signal("web_app_set_header_color", { color: cvet });
    signal("web_app_set_background_color", { color: cvet });
  }
  signal("web_app_expand");
  // Список блюд длинный: смахивание вниз листает его, а не сворачивает приложение
  signal("web_app_setup_swipe_behavior", { allow_vertical_swipe: false });
  signal("web_app_ready");
}

export const tgZakryt = () => signal("web_app_close");

// Запрос к боту. Тело строкой без content-type: браузер не шлёт предварительный запрос.
async function bot(put, telo) {
  const r = await fetch(BOT + put, { method: "POST", body: JSON.stringify(Object.assign({ d: initData }, telo)) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error("бот: " + r.status);
    e.code = j.oshibka || "sboj";
    throw e;
  }
  return j;
}

export const tgVhod = async () => (await bot("/vhod")).token;
export const tgFoto = (id) => bot("/foto", { id });
// Копия автору о правке Ильяса. Не дошла: правка всё равно сохранена.
export const tgKopiya = (telo) => bot("/kopiya", telo).catch(() => {});

// Вход не получился: понятное слово вместо экрана входа Google
const OTKAZ = {
  chuzhoj: ["Нет доступа", "Это меню правит только кафе «Рамбургер». Если вы из кафе, попросите Хаси привязать вас к боту."],
  podpis: ["Вход не получился", "Закройте приложение и откройте его снова кнопкой «Меню кафе» в боте."],
  prava: ["Нет прав на правку меню", "База меню не пустила этот вход. Напишите Хаси."],
  sboj: ["Нет связи", "Проверьте интернет. Потом закройте приложение и откройте его снова кнопкой «Меню кафе»."],
};

export function tgOtkaz(kod) {
  const [h, p] = OTKAZ[kod] || OTKAZ.sboj;
  document.getElementById("adMain").innerHTML = `<section class="ad-login"><span class="ad-login-mark">${window.LOGO}</span><h1>${h}</h1><p>${p}</p></section>`;
}
