export const CONFIG = Object.freeze({
  progress: {
    startDelay: 2600,
    duration:   6000,
    target:     78
  },

  video: {
    rotationMs: 3200
  },

  flash: {
    startDelay: [2600, 3000],
    maxConcurrent: 16,

    gaps: {
      short:  { p: 0.55, min: 450,  max: 1200 },
      medium: { p: 0.85, min: 1200, max: 2600 },
      long:   { p: 0.97, min: 2600, max: 6000 },
      rare:   { min: 6000, max: 10000 }
    },

    intraGaps: {
      tight:  { p: 0.40, min: 40,  max: 90  },
      normal: { p: 0.80, min: 90,  max: 190 },
      slow:   { min: 190, max: 400 }
    },

    y: { min: 12, range: 76, skew: 1.4 },

    events: {
      chaotic: 0.20,
      crossed: 0.42,
      double:  0.60,
      burst:   0.82
    },

    echo: {
      chance: 0.45,
      delay:  [150, 700]
    },

    bursts: {
      sameSide: { min: 2, extra: 3, intensity: [0.65, 1.15], falloff: [0.45, 0.85] },
      crossed:  { min: 2, extra: 4, intensity: [0.55, 1.05] },
      chaotic:  { min: 2, extra: 4 },
      double:   { delay: [50, 140], intensity1: [0.85, 1.15], intensity2: [0.45, 0.80] },
      single:   { intensity: [0.60, 1.10] }
    },

    durations: {
      cone:   [110, 190],
      core:   [90,  150],
      halo:   [170, 250],
      streak: [130, 200],
      floor:  [190, 270]
    },

    cleanup: {
      cone:   350,
      core:   300,
      halo:   400,
      streak: 400,
      floor:  450
    }
  }
});