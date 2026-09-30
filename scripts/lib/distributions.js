import { CONFIG } from '../config.js';
import { progress } from '../state.js';
import { rand } from './math.js';

export function sampleDistribution(dist) {
  const roll = Math.random();
  for (const bucket of Object.values(dist)) {
    if (bucket.p === undefined || roll < bucket.p) {
      return rand(bucket.min, bucket.max);
    }
  }
  return rand(0, 1000);
}

export function sampleGapScaled(dist) {
  const base = sampleDistribution(dist);
  const factor = 1.4 - progress() * 0.95;
  return base * factor;
}

export function sampleIntraGapScaled() {
  const base = sampleDistribution(CONFIG.flash.intraGaps);
  const factor = 1.3 - progress() * 0.85;
  return base * factor;
}