/* 全書目錄與原文頁：書本資料、序言、全書目錄、神論十四章（分段、問題解答、原書頁碼）及原文搜尋。資料由 scripts/build_book.py 產生。 */
(() => {
  'use strict';
  const B = window.BOOK_FULL, $ = id => document.getElementById(id), main = $('book-main');
  if (!B) { main.textContent = '未能載入書本資料。'; return; }
  const STORE = 'slow-reader:v1', BSTORE = 'slow-reader:book:v1';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b, d) => Number.isFinite(Number(v)) ? Math.max(a, Math.min(b, Number(v))) : d;
  const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  // 沿用「陪伴閱讀」的閱讀設定（字體大小、行距、字距、頁面顏色）
  function applySettings() {
    const s = (lsGet(STORE) || {}).settings || {};
    const r = document.documentElement.style;
    r.setProperty('--read-size', clamp(s.font, 18, 32, 22) + 'px');
    r.setProperty('--read-line', String(clamp(s.line, 1.6, 2.6, 2)));
    r.setProperty('--read-space', ([0.02, 0.08, 0.14].includes(Number(s.spacing)) ? Number(s.spacing) : 0.02) + 'em');
    document.body.dataset.theme = ['paper', 'white', 'dark'].includes(s.theme) ? s.theme : 'paper';
  }
  applySettings(); addEventListener('storage', e => { if (e.key === STORE) applySettings(); });
  const chapters = B.chapters, part1 = B.toc[0];
  const chById = id => chapters.find(c => c.id === id);
  const chForPage = p => chapters.find(c => p >= c.pages[0] && p <= c.pages[1]);
  const cnPart = ['一', '二', '三'];
  // ---- 導覽
  const navItems = [['info', '書本資料'], ['preface', '序言'], ['toc', '全書目錄']];
  function renderNav(route) {
    const cur = route.split('/')[0];
    $('book-nav').innerHTML = navItems.map(([r, t]) => `<a href="#${r}" ${cur === r ? 'aria-current="true"' : ''}><span>${t}</span></a>`).join('') +
      `<h3>第一部　${esc(part1.name)}（${chapters.length} 章）</h3>` +
      chapters.map(c => `<a href="#ch-${c.id}" ${cur === 'ch-' + c.id ? 'aria-current="true"' : ''}><span class="num">${String(c.id).padStart(2, '0')}</span><span>${esc(c.title)}</span></a>`).join('');
    const sel = $('book-select');
    sel.innerHTML = navItems.map(([r, t]) => `<option value="${r}">${t}</option>`).join('') +
      `<optgroup label="第一部　${esc(part1.name)}">` + chapters.map(c => `<option value="ch-${c.id}">${c.no}、${esc(c.title)}</option>`).join('') + '</optgroup>' +
      (cur === 'search' ? '<option value="search">搜尋結果</option>' : '');
    sel.value = cur;
  }
  $('book-select').addEventListener('change', e => { location.hash = e.target.value; });
  // ---- 書本資料
  function viewInfo() {
    const i = B.info;
    return `<p class="eyebrow">書本資料</p><h1>${esc(i.title)}</h1>
      <div class="book-card"><dl class="book-meta"><dt>著者</dt><dd>${esc(i.author)}</dd><dt>出版</dt><dd>${esc(i.publisher)}</dd><dt>版本</dt><dd>${esc(i.edition)}</dd><dt>ISBN</dt><dd>${esc(i.isbn)}</dd>
      <dt>本站收錄</dt><dd>序言、全書目錄（三部 ${B.toc.reduce((n, p) => n + p.chapters.length, 0)} 章），以及第一部「${esc(part1.name)}」全部 ${chapters.length} 章原文（原書第 ${chapters[0].pages[0]}–${chapters.at(-1).pages[1]} 頁）。</dd></dl>
      <div class="toc-actions"><a class="button outline" href="#preface">讀序言</a><a class="button outline" href="#toc">看全書目錄</a><a class="button outline" href="#ch-1">由第一章開始</a></div></div>
      <details><summary>封面</summary><ul class="book-lines">${i.cover.map(l => `<li>${esc(l)}</li>`).join('')}</ul></details>
      <details><summary>版權頁</summary><ul class="book-lines">${i.copyright.map(l => `<li>${esc(l)}</li>`).join('')}</ul></details>
      <details><summary>文字整理說明</summary>${i.notes.map(l => `<p class="book-note">${esc(l)}</p>`).join('')}<p class="book-note">網站版另把掃描時被硬性斷開的句子接回同一段（只調整分段，沒有改動文字），並把章節按小標題、問題解答及題號分段。原書頁碼全部保留。</p><p><a href="assets/book-part-one.txt" download>下載整理文字檔 ↓</a></p></details>`;
  }
  // ---- 文字區塊
  function renderBlocks(blocks, chId) {
    let html = '', openP = null;
    const flush = () => { if (openP !== null) { html += `<p id="${openP.id}"${openP.cls ? ` class="${openP.cls}"` : ''}>${openP.h}</p>`; openP = null; } };
    blocks.forEach((b, i) => {
      const bid = `b${i}`;
      if (b.t === 'pg') {
        if (b.inline && openP) { openP.h += `<span class="page-mark-inline" id="p${b.n}" title="原書第 ${b.n} 頁開始">第 ${b.n} 頁</span>`; openP.cont = true; return; }
        flush(); html += `<div class="page-mark" id="p${b.n}"><span>原書第 ${b.n} 頁</span></div>`; return;
      }
      if (b.t === 'p' && openP && openP.cont) { openP.h += esc(b.x); openP.cont = false; flush(); return; }
      flush();
      if (b.t === 'p') { openP = { id: bid, h: esc(b.x) }; return; }
      if (b.t === 'li') { openP = { id: bid, h: esc(b.x), cls: 'pref' }; return; }
      if (b.t === 'h') { html += `<h2 id="${b.id}">${esc(b.x)}</h2>`; return; }
      if (b.t === 'qa') { html += `<h2 class="qa-head" id="qa">問題解答</h2>`; return; }
      if (b.t === 'q') { html += `<h3 class="q" id="${b.id}"><span class="qn">${b.n}.</span><span>${esc(b.x)}</span></h3>`; return; }
      if (b.t === 'a') { openP = { id: bid, h: `<span class="ans-label">答：</span>${esc(b.x)}` }; return; }
    });
    flush(); return html;
  }
  function viewPreface() {
    return `<p class="eyebrow">原書第 1–7 頁</p><h1>序言</h1><div class="book-text">${renderBlocks(B.preface)}</div>
      <div class="ch-nav"><a class="button outline" href="#info">← 書本資料</a><a class="button primary" href="#toc">全書目錄 →</a></div>`;
  }
  function viewToc() {
    return `<p class="eyebrow">原書第 8–42 頁</p><h1>全書目錄</h1><p class="book-note">全書共三部。本站收錄第一部「${esc(part1.name)}」全部原文；第二、三部只列出目錄，暫未收錄原文。</p>` +
      B.toc.map((p, pi) => `<section class="toc-part" aria-labelledby="part-${p.part}"><div class="toc-part-head"><h2 id="part-${p.part}">第${cnPart[pi]}部　${esc(p.name)}</h2><span class="badge ${pi === 0 ? 'ok' : ''}">${pi === 0 ? `已收錄原文 · ${p.chapters.length} 章` : `未收錄原文 · ${p.chapters.length} 章`}</span></div>` +
        p.chapters.map((c, ci) => {
          const id = pi === 0 ? ci + 1 : null;
          return `<article class="toc-ch"><div class="toc-ch-head"><h3 class="toc-ch-title">${c.no}、${esc(c.title)}</h3><span class="toc-ch-page">原書第 ${c.page} 頁${pi > 0 ? ' · 未收錄' : ''}</span></div>` +
            (c.topics.length ? `<p class="toc-topics">${c.topics.map(t => `<span>${esc(t)}</span>`).join('')}</p>` : '') +
            `<details><summary>問題解答（${c.questions.length} 題${c.qaPage ? ` · 第 ${c.qaPage} 頁` : ''}）</summary><ol class="toc-q">${c.questions.map((q, qi) => `<li>${id ? `<a href="#ch-${id}/q${qi + 1}">${esc(q)}</a>` : esc(q)}</li>`).join('')}</ol></details>` +
            (id ? `<div class="toc-actions"><a class="button primary" href="#ch-${id}">讀原文</a><a class="button outline" href="index.html#chapter-${id}">淺白導讀</a></div>` : '') + '</article>';
        }).join('') + '</section>').join('');
  }
  function viewChapter(c) {
    const jumps = c.sections.map((s, i) => `<a href="#ch-${c.id}/s${i + 1}">${esc(s)}</a>`).join('') + `<a class="qa" href="#ch-${c.id}/qa">問題解答 · ${c.questions.length} 題</a>`;
    const qs = c.questions.map((q, i) => `<li><a href="#ch-${c.id}/q${i + 1}">${esc(q)}</a></li>`).join('');
    const prev = chById(c.id - 1), next = chById(c.id + 1);
    return `<div class="ch-head"><p class="eyebrow">第一部　${esc(part1.name)} · 第 ${c.no} 章 / ${chapters.length} · 原書第 ${c.pages[0]}–${c.pages[1]} 頁</p><h1>${c.no}、${esc(c.title)}</h1>
      <nav class="ch-jump" aria-label="本章內容">${jumps}</nav>
      <details><summary>本章問題（${c.questions.length} 題）</summary><ol class="toc-q">${qs}</ol></details>
      <div class="toc-actions"><a class="button outline" href="index.html#chapter-${c.id}">用淺白導讀讀這章 ↗</a></div></div>
      <article class="book-text">${renderBlocks(c.blocks, c.id)}</article>
      <div class="ch-nav">${prev ? `<a class="button outline" href="#ch-${prev.id}">← ${prev.no}、${esc(prev.title)}</a>` : `<a class="button outline" href="#toc">← 全書目錄</a>`}${next ? `<a class="button primary" href="#ch-${next.id}">${next.no}、${esc(next.title)} →</a>` : `<a class="button primary" href="#toc">回到全書目錄 →</a>`}</div>`;
  }
  // ---- 搜尋
  function viewSearch(q) {
    const term = q.trim(); if (!term) return viewToc();
    const hits = [];
    for (const c of chapters) {
      let page = c.pages[0];
      c.blocks.forEach((b, i) => {
        if (b.t === 'pg') { page = b.n; return; }
        const x = b.x || ''; const k = x.indexOf(term);
        if (k >= 0 && hits.length < 80) {
          const anchor = b.t === 'q' ? b.id : b.t === 'h' ? b.id : b.t === 'qa' ? 'qa' : `b${i}`;
          const a = Math.max(0, k - 24), snip = (a > 0 ? '…' : '') + esc(x.slice(a, k)) + '<mark>' + esc(term) + '</mark>' + esc(x.slice(k + term.length, k + term.length + 40)) + (k + term.length + 40 < x.length ? '…' : '');
          hits.push(`<li><a href="#ch-${c.id}/${anchor}"><small>${c.no}、${esc(c.title)} · 原書第 ${page} 頁${b.t === 'q' ? ` · 問題 ${b.n}` : ''}</small>${snip}</a></li>`);
        }
      });
    }
    return `<p class="eyebrow">搜尋原文 · 第一部${esc(part1.name)}</p><h1>「${esc(term)}」</h1><p class="book-note">${hits.length ? `找到 ${hits.length}${hits.length >= 80 ? '+' : ''} 處` : '找不到。試試較短的詞，例如「恩典」或「審判」。'}</p><ul class="search-results">${hits.join('')}</ul>`;
  }
  let st; $('book-search').addEventListener('input', e => { clearTimeout(st); const v = e.target.value; st = setTimeout(() => { if (v.trim()) location.hash = 'search/' + encodeURIComponent(v.trim()); else if (location.hash.startsWith('#search')) location.hash = 'toc'; }, 250); });
  // ---- 頁碼跳轉
  function pageGo() {
    const n = Number($('book-page').value), help = $('book-page-help');
    if (!Number.isInteger(n) || n < 1 || n > 174) { help.textContent = '請輸入 1 至 174 的頁碼。'; return; }
    if (n <= 7) { location.hash = `preface/p${n}`; help.textContent = `原書第 ${n} 頁在序言。`; return; }
    if (n <= 42) { location.hash = 'toc'; help.textContent = `原書第 ${n} 頁屬全書目錄。`; return; }
    if (n === 43) { location.hash = 'ch-1'; help.textContent = '原書第 43 頁是第一部扉頁，已前往第一章。'; return; }
    const c = chForPage(n); location.hash = `ch-${c.id}/p${n}`; help.textContent = `已前往原書第 ${n} 頁（${c.no}、${c.title}）。`;
  }
  $('book-page-go').addEventListener('click', pageGo); $('book-page').addEventListener('keydown', e => { if (e.key === 'Enter') pageGo(); });
  // ---- 路由
  function route() {
    let h = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!h) { const last = (lsGet(BSTORE) || {}).route; h = typeof last === 'string' && last ? last : 'toc'; history.replaceState(null, '', '#' + h); }
    const [head, ...rest] = h.split('/'); const sub = rest.join('/');
    let html, title, ok = true;
    if (head === 'info') { html = viewInfo(); title = '書本資料'; }
    else if (head === 'preface') { html = viewPreface(); title = '序言'; }
    else if (head === 'search') { html = viewSearch(sub); title = '搜尋原文'; if (document.activeElement !== $('book-search')) $('book-search').value = sub; }
    else if (/^ch-\d+$/.test(head) && chById(Number(head.slice(3)))) { const c = chById(Number(head.slice(3))); html = viewChapter(c); title = `${c.no}、${c.title}`; }
    else if (head === 'toc') { html = viewToc(); title = '全書目錄'; }
    else { ok = false; html = viewToc(); title = '全書目錄'; }
    main.innerHTML = html; renderNav(ok ? head : 'toc');
    document.title = `${title} · 全書目錄與原文 · 慢慢讀`;
    if (head !== 'search') lsSet(BSTORE, { route: ok ? h : 'toc' });
    const target = sub && head !== 'search' ? document.getElementById(sub) : null;
    if (target) { target.scrollIntoView({ block: 'start', behavior: 'instant' }); target.classList.add('target-flash'); setTimeout(() => target.classList.remove('target-flash'), 1700); }
    else window.scrollTo({ top: 0, behavior: 'instant' });
    if (!target && document.activeElement !== $('book-search') && document.activeElement !== $('book-select')) main.focus({ preventScroll: true });
  }
  addEventListener('hashchange', route);
  route();
})();
