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
      const LOADER_DOTS_ENTER_MS = 250;
      const LOADER_CYCLE_MS = 3000;
      const LOADER_FADE_MS = 500;
      const loaderStartedAt = performance.now();

      const FLASH = Object.freeze({
        maxConcurrent: 16,
        startDelayMin: 300,
        startDelayRange: 400,

        // Ramp: time taken to intensify
        rampUpMs: 30000,

        // Pauses between events
        gapBuckets: [
          { p: 0.55, min: 300,  max: 900  },
          { p: 0.80, min: 900,  max: 2000 },
          { p: 0.94, min: 2000, max: 4000 },
          { min: 4000, max: 7000 }
        ],

        // Pauses within a burst
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

      // Bias the distribution toward one end rather than making it uniform
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
      function loadFavicon() {
        if (document.querySelector('link[rel="icon"]')) return;
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.type = 'image/svg+xml';
        favicon.href = 'assets/img/favicon.svg';
        document.head.appendChild(favicon);
      }
      function bootContent(contentEffects, paparazzi) {
        const contentStage = document.getElementById('contentStage');
        if (contentStage) {
          contentStage.classList.add('is-ready');
          contentStage.removeAttribute('aria-hidden');
        }

        const counterEl = document.querySelector('.progress__value');
        const revealFooter = () => {
          const eyebrow = document.querySelector('.eyebrow');
          const progress = document.querySelector('.progress');
          const credit = document.querySelector('.credit');
          if (!eyebrow || !progress || !credit) return;

          eyebrow.classList.add('is-revealed');
          later(() => {
            progress.classList.add('is-revealed');
            contentEffects.initProgress(counterEl, 0);
          }, 350);
          later(() => credit.classList.add('is-revealed'), 700);
        };
        const onSubtitleComplete = () => {
          revealFooter();
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
        };
        const startSubtitleTypewriter = contentEffects.initTypewriter(onSubtitleComplete, 0);
        contentEffects.initHeadlineTypewriter(() => {
          if (startSubtitleTypewriter) startSubtitleTypewriter();
          else revealFooter();
        });

        later(() => paparazzi.start(), TIMING.textsDone);
      }

      function boot() {
        state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        state.isMobile = window.matchMedia('(max-width: 899px)').matches;

        const videoStage = createVideoStage();
        const contentEffects = createContentEffects();
        const paparazzi = createPaparazzi();
        window.addEventListener('pagehide', paparazzi.stop, { once: true });

        let contentStarted = false;
        let contentBooted = false;
        let loaderDismissScheduled = false;
        const loader = document.getElementById('pageLoader');

        const bootContentOnce = () => {
          if (contentBooted || state.canceled) return;
          contentBooted = true;
          loadFavicon();
          if (videoStage) videoStage.start();
          bootContent(contentEffects, paparazzi);
        };

        const scheduleLoaderDismissal = () => {
          if (!loader || loaderDismissScheduled) return;
          loaderDismissScheduled = true;
          const elapsed = performance.now() - loaderStartedAt;
          const loaderStyle = getComputedStyle(loader);
          const introDelay = parseFloat(loaderStyle.getPropertyValue('--loader-intro-delay')) || 0;
          const contentEnterDuration = parseFloat(loaderStyle.getPropertyValue('--loader-content-enter-duration')) || 0;
          const typeDuration = parseFloat(loaderStyle.getPropertyValue('--loader-type-duration')) || 0;
          const loaderAnimationDuration = introDelay + contentEnterDuration + typeDuration + LOADER_DOTS_ENTER_MS;
          const cycleElapsed = elapsed - introDelay - contentEnterDuration - typeDuration;
          const remaining = state.reducedMotion
            ? Math.max(0, Math.max(LOADER_MIN_DISPLAY_MS, loaderAnimationDuration) - elapsed)
            : cycleElapsed < 0
              ? -cycleElapsed + LOADER_CYCLE_MS
              : LOADER_CYCLE_MS - (cycleElapsed % LOADER_CYCLE_MS);
          later(() => {
            loader.classList.add('is-hidden');
            later(() => {
              loader.setAttribute('aria-hidden', 'true');
              const contentStage = document.getElementById('contentStage');
              if (contentStage) contentStage.removeAttribute('aria-hidden');
              bootContentOnce();
            }, LOADER_FADE_MS);
          }, remaining);
        };

        const startContent = () => {
          if (contentStarted || state.canceled) return;
          contentStarted = true;
          if (loader) scheduleLoaderDismissal();
          else bootContentOnce();
        };

        setTimeout(startContent, state.isMobile ? 400 : 800);
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
