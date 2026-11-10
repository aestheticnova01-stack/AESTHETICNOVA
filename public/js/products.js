/**
 * AESTHETICNOVA — Products Module
 * Keyboard-accessible image zoom, pointer-follow zoom, and live variant stock feedback.
 */
(function (window, document) {
  'use strict';

  function initProductZoom() {
    var main = document.getElementById('pdp-main');
    if (!main) return;

    var img = main.querySelector('img');
    var toggle = function (on) {
      var zoom = typeof on === 'boolean' ? on : main.getAttribute('data-zoom') !== 'true';
      main.setAttribute('data-zoom', String(zoom));
      var hint = main.querySelector('.zoom-hint');
      if (hint) hint.textContent = zoom ? 'Zoomed — click or press Enter to reset' : 'Click or press Enter to zoom';
      if (img) img.style.transformOrigin = 'center center';
    };

    main.addEventListener('click', function () { toggle(); });
    main.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      if (e.key === 'Escape') toggle(false);
    });

    main.addEventListener('mousemove', function (e) {
      if (main.getAttribute('data-zoom') !== 'true' || !img) return;
      var r = main.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width) * 100;
      var y = ((e.clientY - r.top) / r.height) * 100;
      img.style.transformOrigin = x + '% ' + y + '%';
    });
  }

  function initProductVariants() {
    var form = document.getElementById('pdp-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      var group = form.querySelector('input[name="variant_id"][type="radio"]');
      if (group) {
        var chosen = form.querySelector('input[name="variant_id"]:checked');
        if (!chosen) {
          e.preventDefault();
          var fs = form.querySelector('.variant-list');
          if (fs) {
            fs.focus();
            var err = document.getElementById('variant-error');
            if (!err) {
              err = document.createElement('p');
              err.id = 'variant-error';
              err.className = 'error-text';
              err.setAttribute('role', 'alert');
              fs.parentNode.appendChild(err);
            }
            err.textContent = 'Choose an available option before adding to your bag.';
          }
          return;
        }
      }
      var btn = form.querySelector('[type="submit"]');
      if (btn && !form.matches('[data-cart-ajax]')) {
        btn.disabled = true;
        btn.textContent = 'Adding…';
      }
    });

    var status = document.getElementById('stock-status');
    form.addEventListener('change', function (e) {
      if (e.target.name !== 'variant_id' || !status) return;
      var selected = e.target.parentNode;
      var soldOut = /sold out/i.test(selected.textContent || '');
      var span = status.querySelector('span:last-child');
      status.setAttribute('data-state', soldOut ? 'out' : 'in');
      if (span) span.textContent = soldOut ? 'This option is sold out' : 'In stock and ready to ship';
      var submit = form.querySelector('[type="submit"]');
      if (submit && !submit.dataset.cartAjax) submit.disabled = soldOut;
    });
  }

  function init() {
    initProductZoom();
    initProductVariants();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AestheticNova = window.AestheticNova || {};
  window.AestheticNova.initProducts = init;
})(window, document);
