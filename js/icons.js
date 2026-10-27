// Векторные рисунки: знак кафе и рисунки блюд для пустых экранов и блюд без фото.
// Цвета из брендбука (docs/Брендбук Рамбургер.md). Знак повторяет логотип кафе: бургер, ролл, лента.

(function () {
  const svg = (body, label) => `<svg viewBox="0 0 64 64" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${body}</svg>`;
  const bun = "#E8902A", sesame = "#FFE7B0", leaf = "#6DB33F", meat = "#5B2E14", cheese = "#FFC928", coal = "#141210", red = "#DE2923", rice = "#FFF8EC", salmon = "#F26B3A";

  window.LOGO = `<svg viewBox="0 0 120 120" role="img" aria-label="Знак кафе «Рамбургер»">
    <circle cx="60" cy="60" r="59" fill="#F0A21C"/>
    <circle cx="60" cy="60" r="53" fill="${coal}"/>
    <clipPath id="rbLogoClip"><circle cx="60" cy="60" r="53"/></clipPath>
    <ellipse cx="116" cy="58" rx="45" ry="64" fill="#EFB017" clip-path="url(#rbLogoClip)"/>
    <path d="M14 52c0-11 8.5-18 19-18s19 7 19 18z" fill="${bun}"/>
    <g fill="${sesame}"><ellipse cx="26" cy="42" rx="2" ry="1.2"/><ellipse cx="34" cy="39" rx="2" ry="1.2"/><ellipse cx="41" cy="44" rx="2" ry="1.2"/><ellipse cx="31" cy="47" rx="2" ry="1.2"/></g>
    <path d="M13 52h40l-3 5-4-3-4 3-4-3-4 3-4-3-4 3-4-3-4 3z" fill="${leaf}"/>
    <path d="M15 56h36l-7 6-5-4-5 4z" fill="${cheese}"/>
    <rect x="15" y="58" width="36" height="8" rx="4" fill="${meat}"/>
    <path d="M16 68h34c0 5-4 8-9 8H25c-5 0-9-3-9-8z" fill="${bun}"/>
    <circle cx="92" cy="55" r="14" fill="${coal}"/>
    <circle cx="92" cy="55" r="11" fill="${rice}"/>
    <circle cx="92" cy="55" r="6" fill="${salmon}"/>
    <circle cx="95" cy="51.5" r="2" fill="${leaf}"/>
    <path d="M4 86l12-7v22l-12-6 7-4.5z" fill="#8E1712"/>
    <path d="M116 86l-12-7v22l12-6-7-4.5z" fill="#8E1712"/>
    <path d="M14 80q46-9 92 0v18q-46-9-92 0z" fill="#B3221B"/>
    <text x="60" y="93.5" text-anchor="middle" font-family="Montserrat Alternates, Montserrat, sans-serif" font-weight="800" font-size="13.5" fill="#FFE9B8" textLength="74" lengthAdjust="spacingAndGlyphs">RamBurger</text>
  </svg>`;

  window.ICONS = {
    burger: svg(`<path d="M10 30c0-11 10-18 22-18s22 7 22 18z" fill="${bun}"/><g fill="${sesame}"><ellipse cx="24" cy="20" rx="2.4" ry="1.4"/><ellipse cx="33" cy="17" rx="2.4" ry="1.4"/><ellipse cx="42" cy="21" rx="2.4" ry="1.4"/></g><path d="M8 31h48l-4 5-5-3-5 3-5-3-5 3-5-3-5 3-5-3-5 3z" fill="${leaf}"/><path d="M11 35h42l-8 6-6-4-6 4z" fill="${cheese}"/><rect x="10" y="37" width="44" height="9" rx="4.5" fill="${meat}"/><path d="M11 49h42c0 5-4 8-9 8H20c-5 0-9-3-9-8z" fill="${bun}"/>`),
    hotdog: svg(`<rect x="6" y="26" width="52" height="14" rx="7" fill="${bun}"/><rect x="4" y="28" width="56" height="9" rx="4.5" fill="#B5462A"/><path d="M10 31c4-3 6 3 10 0s6 3 10 0 6 3 10 0 6 3 10 0 4 2 6 0" fill="none" stroke="${cheese}" stroke-width="2.4" stroke-linecap="round"/><path d="M8 38h48c0 5-4 9-10 9H18c-6 0-10-4-10-9z" fill="${bun}"/>`),
    wrap: svg(`<path d="M18 10l30 8-8 40-30-8z" fill="#F3E0B5"/><path d="M18 10l30 8-3 14-30-8z" fill="${leaf}"/><path d="M15 24l30 8-2 8-30-8z" fill="#B5462A"/><path d="M10 50l30 8 8-40" fill="none" stroke="#D9B776" stroke-width="2"/>`),
    pizza: svg(`<circle cx="32" cy="32" r="26" fill="#E8902A"/><circle cx="32" cy="32" r="21" fill="${cheese}"/><g fill="${red}"><circle cx="24" cy="24" r="4"/><circle cx="40" cy="22" r="4"/><circle cx="38" cy="39" r="4"/><circle cx="23" cy="40" r="4"/></g><g fill="${leaf}"><circle cx="32" cy="31" r="2"/><circle cx="46" cy="31" r="1.6"/><circle cx="31" cy="46" r="1.6"/></g>`),
    roll: svg(`<rect x="6" y="40" width="52" height="8" rx="3" fill="${coal}"/><g><circle cx="20" cy="30" r="11" fill="${coal}"/><circle cx="20" cy="30" r="8.5" fill="${rice}"/><circle cx="20" cy="30" r="4.5" fill="${salmon}"/></g><g><circle cx="44" cy="30" r="11" fill="${coal}"/><circle cx="44" cy="30" r="8.5" fill="${rice}"/><circle cx="44" cy="30" r="4.5" fill="${salmon}"/><circle cx="46" cy="28" r="1.6" fill="${leaf}"/></g>`),
    snack: svg(`<g fill="${cheese}"><rect x="20" y="8" width="5" height="26" rx="2" transform="rotate(-8 22 20)"/><rect x="28" y="6" width="5" height="28" rx="2"/><rect x="36" y="8" width="5" height="26" rx="2" transform="rotate(8 38 20)"/><rect x="24" y="12" width="5" height="24" rx="2" transform="rotate(4 26 24)"/><rect x="32" y="11" width="5" height="24" rx="2" transform="rotate(-4 34 23)"/></g><path d="M14 26h36l-5 32H19z" fill="${red}"/><path d="M14 26h36l-1 6H15z" fill="#B3221B"/>`),
    noodles: svg(`<path d="M12 22h40l-5 34H17z" fill="#FFF8EC"/><path d="M12 22h40l-2 8H14z" fill="#EADFC8"/><path d="M20 22c2-8 4-8 6 0M28 22c2-9 4-9 6 0M36 22c2-8 4-8 6 0" fill="none" stroke="${cheese}" stroke-width="3"/><path d="M40 4l-8 20M48 6l-12 18" stroke="#C08A4A" stroke-width="2.6" stroke-linecap="round"/>`),
    plate: svg(`<ellipse cx="32" cy="38" rx="28" ry="16" fill="#E9EDF1"/><ellipse cx="32" cy="36" rx="22" ry="11" fill="#FFFFFF"/><path d="M16 36c4-8 12-10 18-6s10 2 14 4c-2 6-10 9-16 9s-14-2-16-7z" fill="#C97B3A"/><circle cx="24" cy="32" r="3" fill="${leaf}"/><circle cx="42" cy="35" r="3" fill="${red}"/>`),
    salad: svg(`<path d="M8 32h48c0 14-11 24-24 24S8 46 8 32z" fill="${coal}"/><g><circle cx="20" cy="28" r="8" fill="${leaf}"/><circle cx="32" cy="24" r="9" fill="#8CCB55"/><circle cx="44" cy="28" r="8" fill="${leaf}"/><circle cx="26" cy="30" r="4" fill="${red}"/><circle cx="40" cy="30" r="4" fill="${red}"/></g>`),
    combo: svg(`<rect x="6" y="18" width="52" height="34" rx="6" fill="#C9CED4"/><rect x="10" y="22" width="44" height="26" rx="4" fill="#E9EDF1"/><g fill="${cheese}"><rect x="14" y="26" width="4" height="16" rx="2"/><rect x="20" y="25" width="4" height="18" rx="2"/><rect x="26" y="27" width="4" height="15" rx="2"/></g><path d="M34 34c0-6 4-9 8-9s8 3 8 9z" fill="${bun}"/><rect x="33" y="35" width="18" height="4" rx="2" fill="${meat}"/><path d="M34 40h16c0 3-2 4-4 4h-8c-2 0-4-1-4-4z" fill="${bun}"/>`),
  };
})();
