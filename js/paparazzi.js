(function (window) {
  'use strict';

  const modules = window.LaunchPageModules = window.LaunchPageModules || {};

  modules.createPaparazzi = function ({ config, state, later, rand, coin, pickSide, biasedRandom, sampleBuckets }) {
    let active = false;
    let animationFrame = null;

    function start() {
      if (active || state.reducedMotion) return;
      const root = document.getElementById('paparazzi');
      if (!root) return;

      active = true;
      state.paparazziStartTime = performance.now();

      function rampLoop(now) {
        if (!active || state.canceled) return;
        const elapsed = now - state.paparazziStartTime;
        let progress = Math.min(elapsed / config.rampUpMs, 1);
        progress = progress * progress * (3 - 2 * progress);
        state.ramp = progress;
        animationFrame = requestAnimationFrame(rampLoop);
      }
      animationFrame = requestAnimationFrame(rampLoop);

      let live = 0;
      function spawn(className, cleanupMs, configure) {
        if (!active || live >= config.maxConcurrent) return null;
        const element = document.createElement('div');
        element.className = className;
        if (configure) configure(element);
        root.appendChild(element);
        live++;
        later(() => {
          if (element.isConnected) element.remove();
          live--;
        }, cleanupMs);
        return element;
      }

      function fireFlash(side, intensity) {
        const progress = state.progress;
        const flashIntensity = intensity * (0.55 + progress * 0.75);

        let y;
        if (coin(0.6)) {
          y = rand(5, 95);
        } else {
          const bias = coin() ? 0.35 : 2.8;
          y = biasedRandom(5, 95, bias);
        }

        const depth = Math.pow(Math.random(), 0.5);
        const coneScaleX = rand(0.6, 1.4) * (0.85 + depth * 0.5);
        const coneScaleY = rand(0.85, 1.25);
        const coneBrightness = 0.5 + flashIntensity * 0.6 + depth * 0.3;
        const finalIntensity = flashIntensity * (0.55 + depth * 0.85);
        const coneDuration = rand(80, 240);
        const coreDuration = rand(70, 200);
        const haloDuration = rand(140, 300);

        spawn(`flash flash--cone from-${side}`, config.cleanup.cone, (element) => {
          element.style.setProperty('--y', y + '%');
          element.style.animationDuration = coneDuration + 'ms';
          element.style.filter = `brightness(${coneBrightness})`;
          element.style.transformOrigin = `${side === 'left' ? 'left' : 'right'} ${y}%`;
          element.style.transform = `scale(${coneScaleX}, ${coneScaleY})`;
          element.style.opacity = (0.6 + depth * 0.4).toFixed(2);
        });

        const coreSize = rand(4, 16) + depth * 12;
        spawn('flash flash--core', config.cleanup.core, (element) => {
          element.style.top = y + '%';
          element.style[side === 'left' ? 'left' : 'right'] = '-2px';
          element.style.width = coreSize + 'px';
          element.style.height = coreSize + 'px';
          element.style.animationDuration = coreDuration + 'ms';
          element.style.transform = `translateY(-50%) scale(${0.5 + finalIntensity * 0.9})`;
        });

        if (coin(0.7)) {
          const haloSize = rand(0.5, 1.5) + depth * 0.6;
          spawn(`flash flash--halo from-${side}`, config.cleanup.halo, (element) => {
            element.style.animationDuration = haloDuration + 'ms';
            element.style.transform = `scale(${haloSize})`;
            const position = side === 'left' ? '0%' : '100%';
            element.style.background =
              `radial-gradient(ellipse 70% 80% at ${position} ${y}%,` +
              ` rgba(255,245,230,${0.5 * finalIntensity}) 0%,` +
              ` rgba(255,225,200,${0.18 * finalIntensity}) 35%, transparent 70%)`;
          });
        }

        const streaks = coin(0.4 + depth * 0.5) ? (coin(0.6) ? 1 : 2) : 0;
        for (let index = 0; index < streaks; index++) {
          later(() => {
            spawn(`flash flash--streak from-${side}`, config.cleanup.streak, (element) => {
              const streakY = Math.max(2, Math.min(98, y + rand(-6, 6)));
              element.style.top = streakY + '%';
              element.style[side === 'left' ? 'left' : 'right'] = '0px';
              element.style.width = rand(120, 400) + 'px';
              element.style.height = rand(1, 3) + 'px';
              element.style.animationDuration = rand(100, 220) + 'ms';
            });
          }, index * rand(20, 60));
        }

        if (y > 55) {
          spawn(`flash flash--floor from-${side}`, config.cleanup.floor, (element) => {
            element.style.animationDuration = rand(160, 280) + 'ms';
            const position = side === 'left' ? '0%' : '100%';
            element.style.background =
              `radial-gradient(ellipse 70% 60% at ${position} 100%,` +
              ` rgba(255,235,200,${0.45 * finalIntensity}) 0%,` +
              ` rgba(255,210,170,${0.14 * finalIntensity}) 40%, transparent 75%)`;
          });
        }
      }

      function gapScaled(buckets) {
        const base = sampleBuckets(buckets);
        const rampFactor = 1.8 - state.ramp * 1.5;
        return base * rampFactor * (1.1 - state.progress * 0.6);
      }

      function intraGapScaled() {
        const base = sampleBuckets(config.intraGapBuckets);
        const rampFactor = 1.6 - state.ramp * 1.3;
        return base * rampFactor * (1.05 - state.progress * 0.5);
      }

      function scheduleBurst(count, sideAt, intensityAt) {
        let elapsed = 0;
        for (let index = 0; index < count; index++) {
          elapsed += intraGapScaled();
          const side = sideAt(index);
          const intensity = intensityAt(index);
          later(() => fireFlash(side, intensity), elapsed);
        }
      }

      function burstSameSide() {
        const burst = config.bursts.sameSide;
        const side = pickSide();
        const count = burst.min + Math.floor(Math.random() * (burst.extra + state.ramp * 3));
        const base = rand(...burst.intensity);
        scheduleBurst(count, () => side, (index) => (index === 0 ? base : base * rand(...burst.falloff)));
      }

      function burstCrossed() {
        const burst = config.bursts.crossed;
        const sequence = coin() ? ['left', 'right', 'left', 'right', 'left'] : ['right', 'left', 'right', 'left', 'right'];
        const count = burst.min + Math.floor(Math.random() * (burst.extra + state.ramp * 3));
        scheduleBurst(count, (index) => sequence[index % sequence.length], () => rand(...burst.intensity));
      }

      function doublePop(side = pickSide()) {
        const burst = config.bursts.double;
        later(() => fireFlash(side, rand(...burst.i1)), 0);
        later(() => fireFlash(side, rand(...burst.i2)), rand(...burst.delay));
      }

      function singleFlash() {
        fireFlash(pickSide(), rand(...config.bursts.single.intensity));
      }

      function chaoticCluster() {
        const burst = config.bursts.chaotic;
        const size = burst.min + Math.floor(Math.random() * (burst.extra + state.ramp * 5));
        let elapsed = 0;
        for (let index = 0; index < size; index++) {
          elapsed += intraGapScaled() + rand(0, 80);
          later(() => {
            const roll = Math.random();
            if (roll < 0.40) doublePop();
            else if (roll < 0.75) singleFlash();
            else fireFlash(pickSide(), rand(0.5, 1.05));
          }, elapsed);
        }
      }

      function pickEvent() {
        const bias = state.progress * 0.25;
        const events = {
          chaotic: config.events.chaotic + bias,
          crossed: config.events.crossed + bias * 0.6,
          double: config.events.double + bias * 0.4,
          burst: config.events.burst + bias * 0.2
        };
        const total = events.burst;
        const scale = total > 1 ? 1 / total : 1;
        const roll = Math.random();
        if (roll < events.chaotic * scale) chaoticCluster();
        else if (roll < events.crossed * scale) burstCrossed();
        else if (roll < events.double * scale) doublePop();
        else if (roll < events.burst * scale) burstSameSide();
        else singleFlash();
      }

      function scheduleNext() {
        if (state.canceled || !active) return;
        const gap = gapScaled(config.gapBuckets);
        later(() => {
          pickEvent();
          if (coin(config.echo.chance * (0.4 + state.progress * 0.4 + state.ramp * 0.5))) {
            later(singleFlash, rand(config.echo.min, config.echo.max));
          }
          if (state.ramp > 0.4 && coin(state.ramp * 0.7)) {
            const extraGap = gapScaled(config.gapBuckets) * 0.5;
            later(() => {
              pickEvent();
              scheduleNext();
            }, extraGap);
          }
          scheduleNext();
        }, gap);
      }

      later(() => {
        if (!active || state.canceled) return;
        doublePop();
        scheduleNext();
      }, rand(config.startDelayMin, config.startDelayMin + config.startDelayRange));
    }

    function stop() {
      active = false;
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    return { start, stop };
  };
})(window);
