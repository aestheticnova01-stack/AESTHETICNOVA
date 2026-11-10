/**
 * AESTHETICNOVA — UI Components Module
 * Wishlist interactions, scroll animations, confirmation modals, and accessible alerts.
 */
(function (window, document) {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getCsrfToken() {
    var meta = document.querySelector('input[name="_csrf"]');
    return meta ? meta.value : '';
  }

  function announce(msg) {
    var live = document.getElementById('js-live');
    if (live) {
      live.textContent = '';
      setTimeout(function () { live.textContent = msg; }, 50);
    }
  }

  function initWishlist() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-wishlist]');
      if (!btn) return;

      var id = btn.getAttribute('data-wishlist');
      fetch('/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRF-Token': getCsrfToken(),
          Accept: 'application/json',
        },
        body: 'product_id=' + encodeURIComponent(id),
        credentials: 'same-origin',
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.ok) {
            announce(data.error || 'Sign in to save pieces.');
            if (data.signin) {
              window.location.href = data.signin + '?next=' + encodeURIComponent(window.location.pathname);
            }
            return;
          }
          btn.setAttribute('aria-pressed', String(data.saved));
          var name = btn.getAttribute('aria-label') || '';
          btn.setAttribute('aria-label', data.saved
            ? name.replace(/^Save /, 'Remove ').replace(/ to wishlist$/, ' from wishlist')
            : name.replace(/^Remove /, 'Save ').replace(/ from wishlist$/, ' to wishlist'));
          var label = btn.querySelector('[data-wish-label]');
          if (label) label.textContent = data.saved ? 'Saved' : 'Save';
          announce(data.saved ? 'Saved to your wishlist.' : 'Removed from your wishlist.');
        })
        .catch(function () {
          announce('Could not update your wishlist. Please try again.');
        });
    });
  }

  function initScrollReveal() {
    var revealables = document.querySelectorAll('.reveal');
    if (revealables.length && !reduceMotion && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-visible');
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      revealables.forEach(function (el) { io.observe(el); });
    } else {
      revealables.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  function initDestructiveConfirm() {
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (form.matches('[data-confirm]')) {
        if (!window.confirm(form.getAttribute('data-confirm'))) {
          e.preventDefault();
        }
      }
    });
  }

  function init() {
    initWishlist();
    initScrollReveal();
    initDestructiveConfirm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AestheticNova = window.AestheticNova || {};
  window.AestheticNova.announce = announce;
  window.AestheticNova.initComponents = init;
})(window, document);
