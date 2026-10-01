(function (window) {
  'use strict';

  const modules = window.LaunchPageModules = window.LaunchPageModules || {};

  modules.createVideoStage = function ({ layers, rotationMs }) {
    if (!layers.length) return null;

    let currentIndex = 0;
    let rotationTimer = null;
    let stopped = false;
    const pendingPlays = new Map();

    const play = (video) => {
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');

      const doPlay = () => {
        const result = video.play();
        if (result && result.catch) {
          result.catch((error) => console.warn('[video] play bloqueado:', error.name, error.message));
        }
      };

      if (video.readyState >= 3) {
        doPlay();
      } else if (!pendingPlays.has(video)) {
        const playWhenReady = () => {
          pendingPlays.delete(video);
          if (!stopped) doPlay();
        };
        pendingPlays.set(video, playWhenReady);
        video.addEventListener('canplay', playWhenReady, { once: true });
      }
    };

    const show = (index) => {
      layers.forEach((video, layerIndex) => {
        const active = layerIndex === index;
        video.classList.toggle('is-visible', active);
        if (active) play(video);
        else video.pause();
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) layers.forEach((video) => video.pause());
      else play(layers[currentIndex]);
    };

    const unlock = () => {
      play(layers[currentIndex]);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };

    const start = () => {
      if (stopped || rotationTimer !== null) return;
      rotationTimer = window.setInterval(() => {
        currentIndex = (currentIndex + 1) % layers.length;
        show(currentIndex);
      }, rotationMs);
    };

    const stop = () => {
      if (stopped) return;
      stopped = true;
      if (rotationTimer !== null) window.clearInterval(rotationTimer);
      rotationTimer = null;
      pendingPlays.forEach((playWhenReady, video) => {
        video.removeEventListener('canplay', playWhenReady);
      });
      pendingPlays.clear();
      layers.forEach((video) => video.pause());
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
      window.removeEventListener('pagehide', stop);
    };

    show(0);
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    document.addEventListener('touchstart', unlock, { passive: true });
    document.addEventListener('click', unlock, { passive: true });
    window.addEventListener('pagehide', stop, { once: true });

    return { start, stop };
  };
})(window);
