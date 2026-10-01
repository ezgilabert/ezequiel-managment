(function (window) {
  'use strict';

  const modules = window.LaunchPageModules = window.LaunchPageModules || {};

  modules.createVideoStage = function ({ video }) {
    if (!video) return null;

    let stopped = false;
    let pendingPlay = null;

    const play = () => {
      if (stopped || document.hidden) return;
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');

      const doPlay = () => {
        pendingPlay = null;
        if (stopped || document.hidden) return;
        const result = video.play();
        if (result && result.catch) {
          result.catch((error) => console.warn('[video] play bloqueado:', error.name, error.message));
        }
      };

      if (video.readyState >= 3) {
        doPlay();
      } else if (!pendingPlay) {
        pendingPlay = doPlay;
        video.addEventListener('canplay', pendingPlay, { once: true });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) video.pause();
      else play();
    };

    const unlock = () => {
      play();
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };

    const stop = () => {
      if (stopped) return;
      stopped = true;
      if (pendingPlay) video.removeEventListener('canplay', pendingPlay);
      pendingPlay = null;
      video.pause();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
      window.removeEventListener('pagehide', stop);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    document.addEventListener('touchstart', unlock, { passive: true });
    document.addEventListener('click', unlock, { passive: true });
    window.addEventListener('pagehide', stop, { once: true });
    play();

    return { start: play, stop };
  };
})(window);
