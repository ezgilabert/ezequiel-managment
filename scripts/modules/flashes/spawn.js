import { CONFIG } from '../../config.js';
import { progress } from '../../state.js';
import { rand, coin, skew } from '../../lib/math.js';

export function createSpawner(root) {
  let liveCount = 0;

  return function spawn(className, cleanupMs, configure) {
    if (liveCount >= CONFIG.flash.maxConcurrent) return null;

    const el = document.createElement('div');
    el.className = className;
    if (configure) configure(el);
    root.appendChild(el);
    liveCount++;

    setTimeout(() => {
      el.remove();
      liveCount--;
    }, cleanupMs);

    return el;
  };
}

export function fireFlash(spawn, side, intensity = 1) {
  const p = progress();
  const strength = intensity * (0.5 + p * 0.9);

  const { min, range, skew: ySkew } = CONFIG.flash.y;
  const y = min + skew(ySkew) * range;

  // Cone
  spawn(`flash flash--screen flash--cone from-${side}`, CONFIG.flash.cleanup.cone, (el) => {
    el.style.setProperty('--y', y + '%');
    el.style.animationDuration = rand(...CONFIG.flash.durations.cone) + 'ms';
    el.style.filter = `brightness(${0.7 + strength * 0.5})`;
  });

  // Core
  spawn('flash flash--core', CONFIG.flash.cleanup.core, (el) => {
    el.style.top = y + '%';
    el.style[side === 'left' ? 'left' : 'right'] = '-2px';
    el.style.animationDuration = rand(...CONFIG.flash.durations.core) + 'ms';
    el.style.transform = `translateY(-50%) scale(${0.7 + strength * 0.6})`;
  });

  // Halo
  spawn(`flash flash--screen flash--halo from-${side}`, CONFIG.flash.cleanup.halo, (el) => {
    el.style.animationDuration = rand(...CONFIG.flash.durations.halo) + 'ms';
    const pos = side === 'left' ? '0%' : '100%';
    el.style.background =
      `radial-gradient(ellipse 70% 80% at ${pos} ${y}%,` +
      ` rgba(255,245,230,${0.55 * strength}) 0%,` +
      ` rgba(255,225,200,${0.20 * strength}) 35%, transparent 70%)`;
  });

  // Streaks
  const streaks = coin() ? 1 : (coin(0.7) ? 2 : 0);
  for (let i = 0; i < streaks; i++) {
    setTimeout(() => {
      spawn(`flash flash--screen flash--streak from-${side}`, CONFIG.flash.cleanup.streak, (el) => {
        el.style.top = (y + rand(-4, 4)) + '%';
        el.style[side === 'left' ? 'left' : 'right'] = '0px';
        el.style.width = rand(180, 400) + 'px';
        el.style.animationDuration = rand(...CONFIG.flash.durations.streak) + 'ms';
      });
    }, i * rand(20, 60));
  }

  // Floor
  spawn(`flash flash--screen flash--floor from-${side}`, CONFIG.flash.cleanup.floor, (el) => {
    el.style.animationDuration = rand(...CONFIG.flash.durations.floor) + 'ms';
    const pos = side === 'left' ? '0%' : '100%';
    el.style.background =
      `radial-gradient(ellipse 70% 60% at ${pos} 100%,` +
      ` rgba(255,235,200,${0.5 * strength}) 0%,` +
      ` rgba(255,210,170,${0.15 * strength}) 40%, transparent 75%)`;
  });
}