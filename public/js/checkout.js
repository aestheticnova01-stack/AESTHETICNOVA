/**
 * AESTHETICNOVA — Checkout Module
 * Client-side checkout validation, payment method selector, and demo simulation triggers.
 */
(function (window, document) {
  'use strict';

  function initCheckout() {
    var checkoutForm = document.querySelector('form[action="/checkout"]');
    if (!checkoutForm) return;

    var methods = checkoutForm.querySelectorAll('input[name="payment_method"]');
    methods.forEach(function (radio) {
      radio.addEventListener('change', function () {
        var codNotice = document.getElementById('cod-notice');
        if (codNotice) {
          codNotice.hidden = radio.value !== 'cod';
        }
      });
    });

    checkoutForm.addEventListener('submit', function (e) {
      var btn = checkoutForm.querySelector('[type="submit"]');
      if (btn && !btn.disabled) {
        btn.disabled = true;
        btn.textContent = 'Processing order…';
      }
    });
  }

  function initDemoPayment() {
    var payForm = document.querySelector('form[action*="/pay/simulate"]');
    if (!payForm) return;

    payForm.addEventListener('submit', function (e) {
      var btn = payForm.querySelector('[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Simulating payment…';
      }
    });
  }

  function init() {
    initCheckout();
    initDemoPayment();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AestheticNova = window.AestheticNova || {};
  window.AestheticNova.initCheckout = init;
})(window, document);
