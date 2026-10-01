(function (window) {
  'use strict';

  const modules = window.LaunchPageModules = window.LaunchPageModules || {};

  modules.createContentEffects = function ({ timing, easeProgress, state, later }) {
    function initProgress(counterElement) {
      if (!counterElement) return;
      const start = performance.now() + timing.progressStart;
      const duration = timing.progressDuration;
      const target = timing.progressTarget;

      function frame(now) {
        if (state.canceled) return;
        const elapsed = now - start;
        if (elapsed < 0) {
          counterElement.textContent = '0%';
          state.progress = 0;
          requestAnimationFrame(frame);
          return;
        }
        const progress = Math.min(elapsed / duration, 1);
        const value = easeProgress(progress) * target;
        counterElement.textContent = Math.round(value) + '%';
        state.progress = progress;
        if (progress < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }

    function initTypewriter() {
      const element = document.getElementById('subtitleTypewriter');
      if (!element || state.reducedMotion) return;

      const wrapper = document.createElement('span');
      wrapper.style.display = 'contents';
      wrapper.innerHTML = element.innerHTML;

      const textNodes = [];
      (function collect(node) {
        for (let index = 0; index < node.childNodes.length; index++) {
          const child = node.childNodes[index];
          if (child.nodeType === Node.TEXT_NODE) textNodes.push(child);
          else if (child.nodeType === Node.ELEMENT_NODE) collect(child);
        }
      })(wrapper);

      const characterSpans = [];
      for (const textNode of textNodes) {
        const fragment = document.createDocumentFragment();
        const tokens = textNode.nodeValue.split(/(\s+)/);
        for (const token of tokens) {
          if (token === '') continue;
          if (/^\s+$/.test(token)) {
            const spaceSpan = document.createElement('span');
            spaceSpan.className = 'space';
            spaceSpan.textContent = '\u00A0';
            fragment.appendChild(spaceSpan);
          } else {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            for (const character of token) {
              const characterSpan = document.createElement('span');
              characterSpan.className = 'typewriter-char';
              characterSpan.textContent = character;
              wordSpan.appendChild(characterSpan);
              characterSpans.push(characterSpan);
            }
            fragment.appendChild(wordSpan);
          }
        }
        textNode.parentNode.replaceChild(fragment, textNode);
      }

      element.innerHTML = '';
      while (wrapper.firstChild) element.appendChild(wrapper.firstChild);

      const cursor = document.createElement('span');
      cursor.className = 'typewriter-cursor';
      cursor.setAttribute('aria-hidden', 'true');

      let index = 0;
      let nextAt = 0;
      let cursorReady = false;

      later(() => {
        if (state.canceled) return;
        element.insertBefore(cursor, element.firstChild);
        void cursor.offsetWidth;
        cursor.classList.add('is-active');
        cursorReady = true;
      }, timing.cursorAppear);

      function typeFrame(now) {
        if (state.canceled) return;
        if (!cursorReady) {
          requestAnimationFrame(typeFrame);
          return;
        }
        if (!nextAt) nextAt = now;
        if (now < nextAt) {
          requestAnimationFrame(typeFrame);
          return;
        }
        if (index >= characterSpans.length) {
          later(() => {
            cursor.classList.remove('is-active');
            later(() => { if (cursor.isConnected) cursor.remove(); }, 400);
          }, timing.cursorFadeOut);
          return;
        }

        const characterSpan = characterSpans[index++];
        characterSpan.classList.add('is-typed');
        const character = characterSpan.textContent;
        characterSpan.parentNode.insertBefore(cursor, characterSpan.nextSibling);
        let delay = timing.charDelay;
        if (character === '.' || character === ',' || character === ';') delay = timing.punctDelay;
        else if (character === '\u2014') delay = timing.dashDelay;
        nextAt = now + delay;
        requestAnimationFrame(typeFrame);
      }

      later(() => requestAnimationFrame(typeFrame), timing.typewriterStart);
    }

    return { initProgress, initTypewriter };
  };
})(window);
