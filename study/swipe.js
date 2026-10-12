/* 屬靈學習：左右掃動轉頁（只在本程式內）。要求以水平為主、距離足夠，才不會干擾上下捲動。 */
window.studySwipe = (el, onLeft, onRight) => {
  if (!el) return;
  let x0 = 0, y0 = 0, t0 = 0, on = false;
  const skip = t => t.closest('input,select,textarea,button,a,summary,dialog,[data-no-swipe]') || (window.getSelection && String(getSelection()).length > 0);
  el.addEventListener('touchstart', e => {
    if (e.touches.length !== 1 || skip(e.target)) { on = false; return; }
    const p = e.touches[0]; x0 = p.clientX; y0 = p.clientY; t0 = Date.now(); on = true;
  }, { passive: true });
  el.addEventListener('touchend', e => {
    if (!on) return; on = false;
    const p = e.changedTouches[0], dx = p.clientX - x0, dy = p.clientY - y0;
    if (Date.now() - t0 > 800 || Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.8) return;
    (dx < 0 ? onLeft : onRight)();
  }, { passive: true });
  el.addEventListener('touchcancel', () => { on = false; }, { passive: true });
};
