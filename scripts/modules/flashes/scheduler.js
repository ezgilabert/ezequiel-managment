import { CONFIG } from '../../config.js';
import { progress } from '../../state.js';
import { rand, coin, pickSide } from '../../lib/math.js';
import { sampleGapScaled, sampleIntraGapScaled } from '../../lib/distributions.js';
import { fireFlash } from './spawn.js';

export function createScheduler(spawn, bursts) {
  const { burstSameSide, burstCrossed, doublePop, singleFlash } = bursts;

  function chaoticCluster() {
    const cfg = CONFIG.flash.bursts.chaotic;
    const size = cfg.min + Math.floor(Math.random() * cfg.extra);
    let elapsed = 0;

    for (let i = 0; i < size; i++) {
      elapsed += sampleIntraGapScaled() + rand(0, 80);

      setTimeout(() => {
        const roll = Math.random();
        if (roll < 0.35)      doublePop();
        else if (roll < 0.70) singleFlash();
        else                  fireFlash(spawn, pickSide(), rand(0.7, 1.1));
      }, elapsed);
    }
  }

  function pickEvent() {
    const p = progress();
    const bias = p * 0.35;

    const ev = {
      chaotic: CONFIG.flash.events.chaotic + bias,
      crossed: CONFIG.flash.events.crossed + bias * 0.6,
      double:  CONFIG.flash.events.double  + bias * 0.4,
      burst:   CONFIG.flash.events.burst   + bias * 0.2
    };

    const scale = ev.burst > 1 ? 1 / ev.burst : 1;
    const roll = Math.random();

    if      (roll < ev.chaotic * scale) chaoticCluster();
    else if (roll < ev.crossed * scale) burstCrossed();
    else if (roll < ev.double  * scale) doublePop();
    else if (roll < ev.burst   * scale) burstSameSide();
    else                                singleFlash();
  }

  function scheduleNext() {
    const gap = sampleGapScaled(CONFIG.flash.gaps);

    setTimeout(() => {
      pickEvent();

      if (coin(CONFIG.flash.echo.chance * (0.5 + progress()))) {
        setTimeout(singleFlash, rand(...CONFIG.flash.echo.delay));
      }

      scheduleNext();
    }, gap);
  }

  return { scheduleNext };
}