// Запуск меню: сначала правки админки из базы, потом всё остальное.
// Ждём базу до 2,5 секунды, чтобы гость не увидел старую цену или скрытое блюдо.
// Нет сети или база молчит: последняя полученная копия правок, иначе меню из файла.

(function () {
  const L = window.Live;
  const APP = ["js/data.js", "js/icons.js", "js/cart.js", "js/ui.js", "js/stats.js", "js/menu.js", "js/order.js", "js/app.js", "js/install.js"];
  // Номер версии из адреса boot.js (его ставит выложить-сайт.py): все файлы меню из одной выкладки
  const me = document.currentScript && document.currentScript.src;
  const ver = me && me.includes("?v=") ? "?v=" + me.split("?v=")[1] : "";
  let started = false;

  function start(live) {
    if (started) return;
    started = true;
    window.MENU_DATA = L.merge(window.MENU_DATA, live);
    APP.forEach((src) => {
      const s = document.createElement("script");
      s.src = src + ver;
      s.async = false;
      document.body.appendChild(s);
    });
  }

  function cached() {
    try { return JSON.parse(localStorage.getItem(L.CACHE)); } catch (e) { return null; }
  }

  L.fetchLive(2500).then((r) => {
    try { localStorage.setItem(L.CACHE, JSON.stringify(r.live)); } catch (e) { /* без хранилища работаем с тем, что пришло */ }
    start(r.live);
  }, () => start(cached()));
})();
