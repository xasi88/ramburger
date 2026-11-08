// «Версии» в админке и мини-приложении (2026-11-08): строка с номером внизу экрана и окно со списком версий.
// Список и номер: js/version.js (общий для меню, админки и бота). Здесь только вид.
// Текущая версия раскрыта, прежние свёрнуты: касание по строке версии раскрывает её.

const DATA = (d) => new Date(d + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const STRELKA = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

// Строка внизу админки. Нет файла версий: строки нет.
export function versiiStroka(esc) {
  const V = window.Versii;
  if (!V) return "";
  return `<button class="ad-ver" type="button" data-versii>
    <span>Версия ${esc(V.nomer)}</span><b>Что нового</b>
  </button>`;
}

// Окно «Версии»
export function versiiOkno(esc) {
  const V = window.Versii;
  return `<div class="ad-vers">
    <h2>Версии</h2>
    <p class="ad-set-hint">Сейчас у вас версия ${esc(V.nomer)}. Здесь всё, что менялось в меню, админке и боте.</p>
    <ol class="ad-vers-list">${V.spisok.map((r, i) => `
      <li><details${i === 0 ? " open" : ""}>
        <summary>
          <span class="ad-vers-num">${esc(r.v)}</span>
          <span class="ad-vers-head"><b>${esc(r.title)}</b><small>${DATA(r.date)}</small></span>
          ${i === 0 ? '<em class="ad-vers-now">текущая</em>' : ""}${STRELKA}
        </summary>
        <ul>${r.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      </details></li>`).join("")}
    </ol>
  </div>`;
}
