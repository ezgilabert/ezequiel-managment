import { CONFIG } from '../config.js';

export function initVideoRotation() {
  const layers = Array.from(document.querySelectorAll('.video-layer'));
  if (!layers.length) return;

  let current = 0;

  const play = (video) => {
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  };

  const show = (index) => {
    layers.forEach((layer, i) => {
      const active = i === index;
      layer.classList.toggle('is-visible', active);
      active ? play(layer) : layer.pause();
    });
  };

  show(0);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) layers.forEach((l) => l.pause());
    else play(layers[current]);
  });

  setInterval(() => {
    current = (current + 1) % layers.length;
    show(current);
  }, CONFIG.video.rotationMs);
}