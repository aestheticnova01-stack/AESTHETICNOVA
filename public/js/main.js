/**
 * AESTHETICNOVA — Main Frontend Script
 * Progressive enhancement orchestrator.
 * All modules function additively; basic form submissions and navigation work with JS disabled.
 */
(function (window, document) {
  'use strict';

  window.AestheticNova = window.AestheticNova || {};

  function initApp() {
    // Announce application ready in polite live region
    var live = document.getElementById('js-live');
    if (live && !live.hasAttribute('data-ready')) {
      live.setAttribute('data-ready', 'true');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  window.AestheticNova.init = initApp;
})(window, document);
