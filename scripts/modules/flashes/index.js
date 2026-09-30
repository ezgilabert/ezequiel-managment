import { CONFIG } from '../../config.js';
import { rand } from '../../lib/math.js';
import { createSpawner } from './spawn.js';
import { createBursts } from './bursts.js';
import { createScheduler } from './scheduler.js';

export function initFlashes() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.getElementById('flashes');
  if (!root) return;

  const spawn = createSpawner(root);
  const bursts = createBursts(spawn);
  const scheduler = createScheduler(spawn, bursts);

  setTimeout(() => {
    bursts.doublePop();
    scheduler.scheduleNext();
  }, rand(...CONFIG.flash.startDelay));
}