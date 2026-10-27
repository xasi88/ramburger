// Приложение на телефоне: работа без сети (sw.js) и приглашение установить сайт на главный экран.
// Android и Chrome: системное окно установки. iPhone: подсказка «Поделиться → На экран Домой».

(function () {
  const { $, ico, openSheet, closeSheet } = window.UI;
  const HIDE_KEY = "ramburger-install-hide";
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let prompt = null;

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { /* без офлайна сайт тоже работает */ }));
  }

  if (standalone) {
    document.querySelectorAll("[data-install]").forEach((b) => { b.hidden = true; });
    return;
  }

  const share = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/></svg>';
  const plusBox = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
  document.body.insertAdjacentHTML("beforeend", `
    <aside class="install-card" id="installCard" aria-label="Установить приложение" hidden>
      <img src="img/icon-192.png" alt="" width="48" height="48">
      <div><b>Рамбургер на телефоне</b><span>Меню открывается одним касанием.</span></div>
      <button type="button" class="btn btn-main inst-go" data-install>Установить</button>
      <button type="button" class="inst-x" aria-label="Не сейчас"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </aside>
    <div class="sheet" id="installSheet" aria-hidden="true">
      <div class="sheet-bg" data-close></div>
      <article class="sheet-card inst-card" role="dialog" aria-modal="true" aria-labelledby="instTitle" tabindex="-1">
        <button class="sheet-x" type="button" data-close aria-label="Закрыть"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
        <img class="inst-logo" src="img/icon-192.png" alt="" width="88" height="88">
        <h2 id="instTitle">Установите «Рамбургер»</h2>
        <p class="inst-sub">Иконка появится рядом с другими приложениями. Меню открывается сразу, без браузера.</p>
        <ol class="inst-steps">
          ${ios
            ? `<li><i>${share}</i><span>Нажмите <b>«Поделиться»</b> внизу экрана Safari</span></li>
               <li><i>${plusBox}</i><span>Выберите <b>«На экран Домой»</b></span></li>
               <li><i>${ico.plus}</i><span>Нажмите <b>«Добавить»</b></span></li>`
            : `<li><i>${ico.menu}</i><span>Откройте меню браузера <b>⋮</b></span></li>
               <li><i>${plusBox}</i><span>Выберите <b>«Установить приложение»</b> или <b>«На главный экран»</b></span></li>`}
        </ol>
        <button type="button" class="btn btn-main btn-wide" data-close>Понятно</button>
      </article>
    </div>`);

  const card = $("installCard"), sheet = $("installSheet");
  const hiddenUntil = () => { try { return Number(localStorage.getItem(HIDE_KEY)) || 0; } catch (e) { return 0; } };
  function hideCard(days) {
    card.classList.remove("show");
    setTimeout(() => { card.hidden = true; }, 400);
    try { localStorage.setItem(HIDE_KEY, String(Date.now() + days * 864e5)); } catch (e) { /* без хранилища покажем в следующий раз */ }
  }
  function showCard() {
    if (Date.now() < hiddenUntil() || !card.hidden) return;
    card.hidden = false;
    requestAnimationFrame(() => card.classList.add("show"));
  }

  async function install() {
    if (prompt) {
      prompt.prompt();
      const r = await prompt.userChoice.catch(() => null);
      prompt = null;
      hideCard(r && r.outcome === "accepted" ? 365 : 5);
      return;
    }
    openSheet(sheet);
    hideCard(5);
  }

  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); prompt = e; });
  addEventListener("appinstalled", () => { hideCard(365); document.querySelectorAll("[data-install]").forEach((b) => { b.hidden = true; }); });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-install]")) { install(); return; }
    if (e.target.closest(".inst-x")) hideCard(5);
  });
  sheet.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeSheet(sheet); });

  // Приглашение: через 40 секунд на телефоне, не во время заказа
  const phone = matchMedia("(max-width: 1023px)").matches;
  if (phone) setTimeout(() => { if (document.body.dataset.view === "menu") showCard(); }, 40000);
})();
