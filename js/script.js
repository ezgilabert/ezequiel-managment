    (() => {
      'use strict';

      const TIMING = Object.freeze({
        headlineStart:    1600,
        cursorAppear:     5000,
        typewriterStart:  5600,
        progressStart:    9800,
        textsDone:        6000,
        progressDuration: 6000,
        progressTarget:    78,
        charDelay:          22,
        punctDelay:        140,
        dashDelay:         100,
        cursorFadeOut:     500
      });
      const LOADER_MIN_DISPLAY_MS = 1200;
      const LOADER_CYCLE_MS = 3000;
      const LOADER_FADE_MS = 500;
      const loaderStartedAt = performance.now();

      const FLASH = Object.freeze({
        maxConcurrent: 16,
        startDelayMin: 300,
        startDelayRange: 400,

        // Ramp: cuánto tarda en intensificarse
        rampUpMs: 30000,

        // Pausas entre eventos
        gapBuckets: [
          { p: 0.55, min: 300,  max: 900  },
          { p: 0.80, min: 900,  max: 2000 },
          { p: 0.94, min: 2000, max: 4000 },
          { min: 4000, max: 7000 }
        ],

        // Pausas dentro de una ráfaga
        intraGapBuckets: [
          { p: 0.50, min: 60,  max: 140 },
          { p: 0.85, min: 140, max: 280 },
          { min: 280, max: 500 }
        ],

        events: { chaotic: 0.22, crossed: 0.45, double: 0.62, burst: 0.85 },

        echo: { chance: 0.35, min: 150, max: 500 },

        bursts: {
          sameSide: { min: 2, extra: 3, intensity: [0.55, 1.05], falloff: [0.45, 0.85] },
          crossed:  { min: 2, extra: 4, intensity: [0.50, 0.95] },
          chaotic:  { min: 2, extra: 4 },
          double:   { delay: [50, 140], i1: [0.70, 1.00], i2: [0.40, 0.70] },
          single:   { intensity: [0.50, 0.95] }
        },

        cleanup: { cone: 400, core: 350, halo: 450, streak: 450, floor: 500 }
      });

      const rand   = (a, b) => a + Math.random() * (b - a);
      const coin   = (p = 0.5) => Math.random() < p;
      const pickSide = () => (coin() ? 'left' : 'right');

      // Distribución sesgada hacia un extremo (para que no sea uniforme)
      function biasedRandom(min, max, skew = 1) {
        return min + Math.pow(Math.random(), skew) * (max - min);
      }

      function sampleBuckets(buckets) {
        const roll = Math.random();
        for (let i = 0; i < buckets.length; i++) {
          const b = buckets[i];
          if (b.p === undefined || roll < b.p) return rand(b.min, b.max);
        }
        return rand(0, 1000);
      }

      function makeBezier(p1x, p1y, p2x, p2y) {
        const bx = (u) => 3 * (1 - u) ** 2 * u * p1x + 3 * (1 - u) * u ** 2 * p2x + u ** 3;
        const by = (u) => 3 * (1 - u) ** 2 * u * p1y + 3 * (1 - u) * u ** 2 * p2y + u ** 3;
        return (t) => {
          let lo = 0, hi = 1, mid = 0.5;
          for (let i = 0; i < 20; i++) { mid = (lo + hi) * 0.5; if (bx(mid) < t) lo = mid; else hi = mid; }
          return by(mid);
        };
      }
      const easeProgress = makeBezier(0.65, 0, 0.35, 1);

      const state = {
        progress: 0,
        reducedMotion: false,
        canceled: false,
        isMobile: false,
        ramp: 0,
        paparazziStartTime: 0
      };

      const timers = new Set();
      function later(fn, ms) {
        const id = setTimeout(() => { timers.delete(id); if (!state.canceled) fn(); }, ms);
        timers.add(id);
        return id;
      }

      function createContentEffects() {
        return window.LaunchPageModules.createContentEffects({
          timing: TIMING,
          easeProgress,
          state,
          later
        });
      }

      function createVideoStage() {
        return window.LaunchPageModules.createVideoStage({
          video: document.querySelector('.mix-layer')
        });
      }

      function createPaparazzi() {
        return window.LaunchPageModules.createPaparazzi({
          config: FLASH,
          state,
          later,
          rand,
          coin,
          pickSide,
          biasedRandom,
          sampleBuckets
        });
      }
      function bootContent(contentEffects, paparazzi) {
        const contentStage = document.getElementById('contentStage');
        if (contentStage) {
          contentStage.classList.add('is-ready');
          if (!document.getElementById('pageLoader')) contentStage.removeAttribute('aria-hidden');
        }

        const counterEl = document.querySelector('.progress__value');
        contentEffects.initProgress(counterEl);
        contentEffects.initTypewriter(() => {
          if (state.isMobile || state.reducedMotion) return;
          const stage = document.querySelector('.stage-root');
          if (!stage) return;

          const cutInMs = 100;
          const cutOutMs = 240;
          const cameraHoldMs = 5000;
          const shots = ['camera-middle', 'camera-bottom', ''];
          let shotIndex = 0;
          function cutToNextShot() {
            stage.classList.remove('camera-cut-out');
            stage.classList.add('camera-cut-in');
            later(() => {
              stage.classList.remove('camera-middle', 'camera-bottom');
              if (shots[shotIndex]) stage.classList.add(shots[shotIndex]);
              shotIndex = (shotIndex + 1) % shots.length;
              stage.classList.remove('camera-cut-in');
              stage.classList.add('camera-cut-out');
              later(() => {
                stage.classList.remove('camera-cut-out');
                later(cutToNextShot, cameraHoldMs);
              }, cutOutMs);
            }, cutInMs);
          }
          cutToNextShot();
        });

        later(() => paparazzi.start(), TIMING.textsDone);
      }

      function boot() {
        state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        state.isMobile = window.matchMedia('(max-width: 899px)').matches;

        createVideoStage();
        const contentEffects = createContentEffects();
        const paparazzi = createPaparazzi();
        window.addEventListener('pagehide', paparazzi.stop, { once: true });

        const firstVideo = document.querySelector('.mix-layer');
        let contentStarted = false;
        let loaderCanDismiss = !firstVideo || firstVideo.readyState >= 2;
        let loaderDismissScheduled = false;
        const loader = document.getElementById('pageLoader');

        const dismissLoaderWhenReady = () => {
          if (!loader || !loaderCanDismiss || loaderDismissScheduled) return;
          loaderDismissScheduled = true;
          const elapsed = performance.now() - loaderStartedAt;
          const remaining = state.reducedMotion
            ? Math.max(0, LOADER_MIN_DISPLAY_MS - elapsed)
            : LOADER_CYCLE_MS - (elapsed % LOADER_CYCLE_MS);
          later(() => {
            loader.classList.add('is-hidden');
            later(() => {
              loader.setAttribute('aria-hidden', 'true');
              const contentStage = document.getElementById('contentStage');
              if (contentStage) contentStage.removeAttribute('aria-hidden');
            }, LOADER_FADE_MS);
          }, remaining);
        };

        const markLoaderReady = () => {
          loaderCanDismiss = true;
          dismissLoaderWhenReady();
        };

        const startContent = () => {
          if (contentStarted || state.canceled) return;
          contentStarted = true;
          dismissLoaderWhenReady();
          bootContent(contentEffects, paparazzi);
        };

        if (!firstVideo) {
          startContent();
        } else {
          if (firstVideo.readyState >= 2) {
            startContent();
          } else {
            const handleVideoReady = () => {
              markLoaderReady();
              startContent();
            };
            firstVideo.addEventListener('loadeddata', handleVideoReady, { once: true });
            firstVideo.addEventListener('canplay',    handleVideoReady, { once: true });
            firstVideo.addEventListener('error',      handleVideoReady, { once: true });
          }
          setTimeout(startContent, state.isMobile ? 400 : 800);
        }
      }

      window.addEventListener('pagehide', () => {
        state.canceled = true;
        for (const id of timers) clearTimeout(id);
        timers.clear();
      }, { once: true });

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
      } else {
        boot();
      }
    })();
