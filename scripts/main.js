import { initProgressCounter } from './modules/progress.js';
import { initVideoRotation }   from './modules/video.js';
import { initFlashes }         from './modules/flashes/index.js';

function boot() {
  initVideoRotation();
  initProgressCounter(document.getElementById('progressValue'));
  initFlashes();
}

document.addEventListener('DOMContentLoaded', boot);