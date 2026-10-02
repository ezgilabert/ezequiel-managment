(function (window) {
  'use strict';

  const modules = window.LaunchPageModules = window.LaunchPageModules || {};

  modules.createContentEffects = function ({ timing, easeProgress, state, later }) {
    function initProgress(counterElement, startDelay = timing.progressStart) {
      if (!counterElement) return;
      const duration = timing.progressDuration;
      const target = timing.progressTarget;
      let start = 0;
      let displayedValue = null;

      function frame(now) {
        if (state.canceled) return;
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = easeProgress(progress) * target;
        const roundedValue = Math.round(value);
        if (roundedValue !== displayedValue) {
          counterElement.textContent = roundedValue + '%';
          displayedValue = roundedValue;
        }
        state.progress = progress;
        if (progress < 1) requestAnimationFrame(frame);
      }

      later(() => {
        start = performance.now();
        requestAnimationFrame(frame);
      }, startDelay);
    }

    function initHeadlineTypewriter(onComplete) {
      const element = document.querySelector('.headline');
      if (!element || state.reducedMotion) {
        if (onComplete) onComplete();
        return;
      }
      const accessibleText = element.innerText.replace(/\s+/g, ' ').trim();

      const textNodes = [];
      (function collect(node) {
        for (let index = 0; index < node.childNodes.length; index++) {
          const child = node.childNodes[index];
          if (child.nodeType === Node.TEXT_NODE) textNodes.push(child);
          else if (child.nodeType === Node.ELEMENT_NODE) collect(child);
        }
      })(element);

      const characterSpans = [];
      for (const textNode of textNodes) {
        const fragment = document.createDocumentFragment();
        const tokens = textNode.nodeValue.split(/(\s+)/);
        for (const token of tokens) {
          if (token === '') continue;
          if (/^\s+$/.test(token)) {
            const space = document.createElement('span');
            space.className = 'headline__typewriter-char headline__typewriter-space';
            space.textContent = '\u00a0';
            space.setAttribute('aria-hidden', 'true');
            fragment.appendChild(space);
            characterSpans.push(space);
            continue;
          }

          const word = document.createElement('span');
          word.className = 'headline__word';
          for (const character of token) {
            const characterSpan = document.createElement('span');
            characterSpan.className = 'headline__typewriter-char';
            characterSpan.textContent = character;
            characterSpan.setAttribute('aria-hidden', 'true');
            word.appendChild(characterSpan);
            characterSpans.push(characterSpan);
          }
          fragment.appendChild(word);
        }
        textNode.parentNode.replaceChild(fragment, textNode);
      }

      element.setAttribute('aria-label', accessibleText);

      let index = 0;
      let nextAt = 0;
      function typeFrame(now) {
        if (state.canceled) return;
        if (!nextAt) nextAt = now;
        if (now < nextAt) {
          requestAnimationFrame(typeFrame);
          return;
        }
        if (index >= characterSpans.length) {
          if (onComplete) onComplete();
          return;
        }

        const characterSpan = characterSpans[index++];
        characterSpan.classList.add('is-typed');
        const character = characterSpan.textContent;
        nextAt = now + (character === '.' || character === ',' ? 110 : 38);
        requestAnimationFrame(typeFrame);
      }

      requestAnimationFrame(typeFrame);
    }

    function initTypewriter(onComplete, startDelay = timing.typewriterStart) {
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
      let started = false;

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
          if (onComplete) onComplete();
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

      return function startTypewriter() {
        if (started || state.canceled) return;
        started = true;
        later(() => {
          if (state.canceled) return;
          element.insertBefore(cursor, element.firstChild);
          void cursor.offsetWidth;
          cursor.classList.add('is-active');
          cursorReady = true;
        }, startDelay === 0 ? 0 : timing.cursorAppear);
        later(() => requestAnimationFrame(typeFrame), startDelay);
      };
    }

    return { initProgress, initHeadlineTypewriter, initTypewriter };
  };
})(window);
