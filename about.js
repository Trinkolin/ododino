/* Ododino – page « À propos et confidentialité » (script séparé pour respecter la CSP). */
(() => {
  'use strict';
  const I = window.I18N;
  let lang = I.detect();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function render() {
    const T = I[lang];
    document.documentElement.lang = lang;
    document.title = `${T.about} · Ododino`;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = T[el.dataset.i18n]; });
    document.querySelectorAll('a[data-keep-lang]').forEach((a) => { a.href = 'index.html?lang=' + lang; });
    const mail = `<a href="mailto:${esc(I.CONTACT)}">${esc(I.CONTACT)}</a>`;
    // aboutHtml vient de i18n.js (texte du site, pas de données externes)
    document.getElementById('content').innerHTML = `<h1 class="title">${esc(T.about)}</h1>` + T.aboutHtml.replace('{contact}', mail);
    document.getElementById('langs').innerHTML = I.LANGS.map(([c, short, name]) =>
      `<button data-lang="${c}" class="${c === lang ? 'on' : ''}" title="${esc(name)}" lang="${c}" aria-pressed="${c === lang}">${short}</button>`).join('');
  }

  document.getElementById('langs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-lang]'); if (!b) return;
    lang = b.dataset.lang; I.remember(lang);
    history.replaceState(null, '', '?lang=' + lang);
    render();
  });
  render();
})();
