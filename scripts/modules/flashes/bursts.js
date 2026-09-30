import { CONFIG } from '../../config.js';
import { rand, coin, pickSide } from '../../lib/math.js';
import { sampleIntraGapScaled } from '../../lib/distributions.js';
import { fireFlash } from './spawn.js';

export function createBursts(spawn) {
  function scheduleBurst(count, sideAt, intensityAt) {
    let elapsed = 0;
    for (let i = 0; i < count; i++) {
      elapsed += sampleIntraGapScaled();
      const side = sideAt(i);
      const intensity = intensityAt(i);
      setTimeout(() => fireFlash(spawn, side, intensity), elapsed);
    }
  }

  function burstSameSide() {
    const cfg = CONFIG.flash.bursts.sameSide;
    const side = pickSide();
    const count = cfg.min + Math.floor(Math.random() * cfg.extra);
    const base = rand(...cfg.intensity);

    scheduleBurst(
      count,
      () => side,
      (i) => (i === 0 ? base : base * rand(...cfg.falloff))
    );
  }

  function burstCrossed() {
    const cfg = CONFIG.flash.bursts.crossed;
    const sequence = coin()
      ? ['left', 'right', 'left', 'right', 'left']
      : ['right', 'left', 'right', 'left', 'right'];
    const count = cfg.min + Math.floor(Math.random() * cfg.extra);

    scheduleBurst(
      count,
      (i) => sequence[i % sequence.length],
      () => rand(...cfg.intensity)
    );
  }

  function doublePop(side = pickSide()) {
    const cfg = CONFIG.flash.bursts.double;
    setTimeout(() => fireFlash(spawn, side, rand(...cfg.intensity1)), 0);
    setTimeout(() => fireFlash(spawn, side, rand(...cfg.intensity2)), rand(...cfg.delay));
  }

  function singleFlash() {
    fireFlash(spawn, pickSide(), rand(...CONFIG.flash.bursts.single.intensity));
  }

  return { burstSameSide, burstCrossed, doublePop, singleFlash };
}