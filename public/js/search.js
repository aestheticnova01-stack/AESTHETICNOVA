/**
 * AESTHETICNOVA — Search Module
 * Search bar toggle, keyboard shortcuts, and auto-focus.
 */
(function (window, document) {
  'use strict';

  function initSearch() {
    var searchToggle = document.getElementById('search-toggle');
    var searchPanel = document.getElementById('search-panel');
    if (!searchToggle || !searchPanel) return;

    searchToggle.addEventListener('click', function () {
      var open = !searchPanel.hidden;
      searchPanel.hidden = open;
      searchToggle.setAttribute('aria-expanded', String(!open));
      if (!open) {
        var input = document.getElementById('site-search');
        if (input) input.focus();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !searchPanel.hidden) {
        searchPanel.hidden = true;
        searchToggle.setAttribute('aria-expanded', 'false');
        searchToggle.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }

  window.AestheticNova = window.AestheticNova || {};
  window.AestheticNova.initSearch = initSearch;
})(window, document);
