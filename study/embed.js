/* 靈修生活：在網站「屬靈學習」分頁內嵌時加上 in-site class（只影響版面，不改程式邏輯）。 */
try { if (window.self !== window.top) document.documentElement.classList.add('in-site'); } catch (e) { document.documentElement.classList.add('in-site'); }
