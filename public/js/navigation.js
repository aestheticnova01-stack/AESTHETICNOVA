/**
 * AESTHETICNOVA — Navigation Module
 * Mobile navigation toggle, keyboard accessibility, and focus management.
 */
(function (window, document) {
  'use strict';

  function initNavigation() {
    var menuToggle = document.getElementById('menu-toggle');
    var mobileNav = document.getElementById('mobile-nav');
    if (!menuToggle || !mobileNav) return;

    menuToggle.addEventListener('click', function () {
      var open = mobileNav.getAttribute('data-open') === 'true';
      var nextState = !open;
      mobileNav.setAttribute('data-open', String(nextState));
      menuToggle.setAttribute('aria-expanded', String(nextState));

      var srText = menuToggle.querySelector('.sr-only');
      if (srText) srText.textContent = nextState ? 'Close menu' : 'Open menu';

      if (nextState) {
        var firstLink = mobileNav.querySelector('a');
        if (firstLink) firstLink.focus();
      }
    });

    // Close mobile nav on escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.getAttribute('data-open') === 'true') {
        mobileNav.setAttribute('data-open', 'false');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }

  window.AestheticNova = window.AestheticNova || {};
  window.AestheticNova.initNavigation = initNavigation;
})(window, document);
