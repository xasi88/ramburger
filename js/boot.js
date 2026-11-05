// Запуск меню: сначала правки админки из базы, потом всё остальное.
// Запрос к базе уходит ещё из <head> (js/live.js, Live.pending). Ждём ответ: с копией правок в браузере до 4 с,
// без копии до 8 с. Не дождались: открываем по копии, иначе по файлу меню.
// Ответ пришёл позже и правки другие: копию обновляем. Гость ещё ничего не нажимал: меню открывается заново один раз.

(function () {
  const L = window.Live;
  const APP = ["js/data.js", "js/icons.js", "js/cart.js", "js/ui.js", "js/stats.js", "js/menu.js", "js/order.js", "js/app.js", "js/install.js"];
  // Номер версии из адреса boot.js (его ставит выложить-сайт.py): все файлы меню из одной выкладки
  const me = document.currentScript && document.currentScript.src;
  const ver = me && me.includes("?v=") ? "?v=" + me.split("?v=")[1] : "";
  const RELOADED = "ramburger-reloaded";
  let started = false, used = null, touched = false;

  function start(live) {
    if (started) return;
    started = true;
    used = live;
    window.MENU_DATA = L.merge(window.MENU_DATA, live);
    APP.forEach((src) => {
      const s = document.createElement("script");
      s.src = src + ver;
      s.async = false;
      document.body.appendChild(s);
    });
  }

  const store = {
    get() { try { return localStorage.getItem(L.CACHE); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(L.CACHE, JSON.stringify(v)); } catch (e) { /* без хранилища живём без копии */ } },
  };
  const copy = store.get();
  const cached = () => { try { return JSON.parse(copy); } catch (e) { return null; } };

  ["pointerdown", "keydown", "wheel"].forEach((ev) => addEventListener(ev, () => { touched = true; }, { once: true, passive: true }));
  const late = setTimeout(() => start(cached()), copy !== null ? 4000 : 8000);

  (L.pending || L.fetchLive(10000)).then((r) => {
    clearTimeout(late);
    store.set(r.live);
    if (!started) {
      try { sessionStorage.removeItem(RELOADED); } catch (e) { /* нет хранилища: не страшно */ }
      start(r.live);
      return;
    }
    if (JSON.stringify(r.live) === JSON.stringify(used) || touched) return;
    try {
      if (sessionStorage.getItem(RELOADED)) return;
      sessionStorage.setItem(RELOADED, "1");
    } catch (e) { return; }
    location.reload();
  }, () => { clearTimeout(late); start(cached()); });
})();
