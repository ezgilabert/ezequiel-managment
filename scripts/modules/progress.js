import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { cubicBezier } from '../lib/math.js';

export function initProgressCounter(el) {
  const { startDelay, duration, target } = CONFIG.progress;
  const start = performance.now() + startDelay;

  function tick(now) {
    const elapsed = now - start;

    if (elapsed < 0) {
      el.textContent = '0%';
      state.progress = 0;
      requestAnimationFrame(tick);
      return;
    }

    const t = Math.min(elapsed / duration, 1);
    const eased = cubicBezier(t, 0.65, 0, 0.35, 1);
    const value = eased * target;

    el.textContent = Math.round(value) + '%';
    state.progress = t;

    if (t < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}