/* 《靈修生活》目錄與原文：導讀路徑（由淺入深）、全書目錄（原書次序）、分章原文、搜尋。資料由 scripts/build_lingxiu.py 產生。 */
(() => {
  'use strict';
  const B = window.LINGXIU_BOOK, $ = id => document.getElementById(id), main = $('book-main');
  if (!B) { main.textContent = '未能載入書本資料。'; return; }
  const STORE = 'slow-reader:lingxiu:v1', BSTORE = 'slow-reader:lingxiu-book:v1';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const clamp = (v, a, b, d) => Number.isFinite(Number(v)) ? Math.max(a, Math.min(b, Number(v))) : d;
  const s = (lsGet(STORE) || {}).settings || (lsGet('slow-reader:v1') || {}).settings || {};
  const r = document.documentElement.style;
  r.setProperty('--read-size', clamp(s.font, 18, 32, 22) + 'px'); r.setProperty('--read-line', String(clamp(s.line, 1.6, 2.6, 2)));
  r.setProperty('--read-space', ([0.02, 0.08, 0.14].includes(Number(s.spacing)) ? Number(s.spacing) : 0.02) + 'em');
  document.body.dataset.theme = ['paper', 'white', 'dark'].includes(s.theme) ? s.theme : 'paper';
  const units = B.units, byKey = k => units.find(u => u.key === k);
  const LV = ['第一站', '第二站', '第三站', '第四站'];
  const levelOf = k => B.levels.findIndex(l => l.keys.includes(k));
  const unitName = u => u.key === 'pre' ? '序言' : `${u.no}　${u.title}`;
  function renderNav(cur) {
    const link = (h, num, t) => `<a href="#${h}" ${cur === h ? 'aria-current="true"' : ''}><span class="num">${num}</span><span>${esc(t)}</span></a>`;
    let html = '<h3>開始</h3>' + link('path', '★', '導讀路徑（由淺入深）') + link('toc', '≡', '全書目錄');
    html += '<h3>原書次序</h3>' + units.map(u => link('u-' + u.key, u.key === 'pre' ? '序' : u.no.replace(/^第|章$/g, '').replace('附篇', '附'), u.key === 'pre' ? '序言' : u.title)).join('');
    $('book-nav').innerHTML = html;
    $('book-select').innerHTML = [['path', '導讀路徑（由淺入深）'], ['toc', '全書目錄'], ...units.map(u => ['u-' + u.key, unitName(u)])].map(([v, t]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(t)}</option>`).join('');
  }
  $('book-select').addEventListener('change', e => { location.hash = e.target.value; });
  const guideLink = u => `<a class="button primary" href="lingxiu.html#chapter-${u.guide}">淺白導讀</a>`;
  const done = new Set((lsGet(STORE) || {}).done || []);
  function viewPath() {
    return `<div class="ch-head"><h1>導讀路徑：由淺入深</h1><p class="book-note">《靈修生活》 · ${esc(B.author)} 著 · 序言署 1977 年 10 月。按難度重新排成四站；每課有淺白導讀、小問題及原文卡。想照原書次序讀，請看「全書目錄」。</p></div>` +
      B.levels.map((lv, i) => `<section class="toc-part"><div class="toc-part-head"><h2>${LV[i]}　${esc(lv.name)}</h2><span class="badge">${lv.keys.length} 課</span></div><p class="book-note">${esc(lv.desc)}</p>` +
        lv.keys.map(k => { const u = byKey(k); return `<div class="toc-ch"><div class="toc-ch-head"><p class="toc-ch-title">第 ${u.guide} 課 · ${esc(unitName(u))}</p>${done.has(u.guide) ? '<span class="badge ok">✓ 已讀完</span>' : ''}</div>${u.sections.length ? `<p class="toc-topics">${u.sections.map(t => `<span>${esc(t)}</span>`).join('')}</p>` : ''}<div class="toc-actions">${guideLink(u)}<a class="button outline" href="#u-${u.key}">原文</a></div></div>`; }).join('') + '</section>').join('');
  }
  function viewToc() {
    const sum = units.reduce((n, u) => n + u.sections.length, 0);
    return `<div class="ch-head"><h1>全書目錄</h1><p class="book-note">序言、七章正文、四篇附篇，共 ${sum} 個小標題（原書次序）。</p></div><section class="toc-part">` +
      units.map(u => { const lv = levelOf(u.key); return `<div class="toc-ch"><div class="toc-ch-head"><p class="toc-ch-title"><a href="#u-${u.key}">${esc(unitName(u))}</a></p><span class="badge">${LV[lv]} · ${esc(B.levels[lv].name)}</span></div>${u.sections.length ? `<p class="toc-topics">${u.sections.map((t, i) => `<span><a href="#u-${u.key}/s${i + 1}">${esc(t)}</a></span>`).join('')}</p>` : ''}<div class="toc-actions">${guideLink(u)}<a class="button outline" href="#u-${u.key}">原文</a></div></div>`; }).join('') + '</section>';
  }
  function viewUnit(u) {
    const i = units.indexOf(u), prev = units[i - 1], next = units[i + 1], lv = levelOf(u.key);
    return `<div class="ch-head"><p class="book-note">${LV[lv]} · ${esc(B.levels[lv].name)}　·　導讀第 ${u.guide} 課</p><h1>${esc(unitName(u))}</h1>${u.sections.length ? `<nav class="ch-jump" aria-label="本章小標題">${u.sections.map((t, k) => `<a href="#u-${u.key}/s${k + 1}">${esc(t)}</a>`).join('')}</nav>` : ''}<div class="toc-actions">${guideLink(u)}</div></div><div class="book-text">` +
      u.blocks.map(b => b.t === 'h' ? `<h2 id="${b.id}">${esc(b.x)}</h2>` : `<p>${esc(b.x)}</p>`).join('') +
      `</div><nav class="ch-nav">${prev ? `<a class="button outline" href="#u-${prev.key}">← ${esc(unitName(prev))}</a>` : '<span></span>'}${next ? `<a class="button outline" href="#u-${next.key}">${esc(unitName(next))} →</a>` : ''}</nav>`;
  }
  function viewSearch(q) {
    q = q.trim(); if (!q) return '<h1>搜尋原文</h1><p class="book-note">請輸入要找的字詞。</p>';
    const out = [];
    units.forEach(u => { let sec = ''; u.blocks.forEach(b => { if (b.t === 'h') { sec = b.id; } const k = b.x.indexOf(q); if (k >= 0 && out.length < 200) out.push({ u, sec, b, k }); }); });
    return `<h1>搜尋「${esc(q)}」</h1><p class="book-note">找到 ${out.length}${out.length >= 200 ? '+' : ''} 處。</p><ul class="search-results">` + out.map(({ u, sec, b, k }) => {
      const a = Math.max(0, k - 30), snip = b.x.slice(a, k + q.length + 50);
      return `<li><a href="#u-${u.key}${sec ? '/' + sec : ''}"><small>${esc(unitName(u))}</small>${a ? '…' : ''}${esc(snip).split(esc(q)).join(`<mark>${esc(q)}</mark>`)}…</a></li>`;
    }).join('') + '</ul>';
  }
  let t; $('book-search').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { const v = e.target.value.trim(); location.hash = v ? 'search/' + encodeURIComponent(v) : 'path'; }, 250); });
  function route() {
    let h = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!h) { const last = (lsGet(BSTORE) || {}).route; h = typeof last === 'string' && last ? last : 'path'; history.replaceState(null, '', '#' + h); }
    const [head, ...rest] = h.split('/'), sub = rest.join('/');
    let html, title, ok = true, nav = head;
    const u = head.startsWith('u-') ? byKey(head.slice(2)) : null;
    if (head === 'toc') { html = viewToc(); title = '全書目錄'; }
    else if (head === 'search') { html = viewSearch(sub); title = '搜尋原文'; if (document.activeElement !== $('book-search')) $('book-search').value = sub; }
    else if (u) { html = viewUnit(u); title = unitName(u); }
    else { ok = head === 'path'; nav = 'path'; html = viewPath(); title = '導讀路徑'; }
    main.innerHTML = html; renderNav(nav);
    document.title = `${title} · 靈修生活 · 慢慢讀`;
    if (head !== 'search') lsSet(BSTORE, { route: ok ? h : 'path' });
    const target = sub && head !== 'search' ? document.getElementById(sub) : null;
    if (target) { target.scrollIntoView({ block: 'start', behavior: 'instant' }); target.classList.add('target-flash'); setTimeout(() => target.classList.remove('target-flash'), 1700); }
    else window.scrollTo({ top: 0, behavior: 'instant' });
    if (!target && document.activeElement !== $('book-search') && document.activeElement !== $('book-select')) main.focus({ preventScroll: true });
  }
  // 左右掃動：在原文中轉到上／下一章（只在本頁內容區）
  function go(d) { const m = location.hash.match(/^#u-(\w+)/); if (!m) return; const i = units.findIndex(x => x.key === m[1]); const n = units[i + d]; if (n) location.hash = 'u-' + n.key; }
  if (window.studySwipe) window.studySwipe(main, () => go(1), () => go(-1));
  addEventListener('hashchange', route);
  route();
})();
