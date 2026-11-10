/*
 * AESTHETICNOVA consent UI.
 *
 * Nothing here loads a tracker — the job of this file is to (a) show the banner
 * when no choice has been recorded, (b) apply consent to the DOM before any
 * optional code could run, and (c) let the visitor change their mind at any
 * time from the footer. Optional scripts are never injected by this file; the
 * server is the gate for the only optional processing we do.
 */
(function () {
  'use strict';

  var BANNER = document.getElementById('consent-banner');
  var PREFS = document.getElementById('consent-prefs');
  var TOAST = document.getElementById('consent-toast');
  var lastFocus = null;

  function hasConsentCookie() {
    // The server always renders data-consent-recorded on <body> when a receipt exists.
    return document.body.getAttribute('data-consent-recorded') === 'true';
  }

  function announce(msg, isError) {
    var live = document.getElementById('js-live');
    if (live) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 60); }
    if (TOAST) {
      TOAST.setAttribute('role', isError ? 'alert' : 'status');
      TOAST.hidden = false;
      TOAST.textContent = msg;
      TOAST.classList.toggle('is-error', Boolean(isError));
      clearTimeout(TOAST._t);
      TOAST._t = setTimeout(function () { TOAST.hidden = true; }, 6000);
    }
  }

  function showBanner(focusFirst) {
    if (!BANNER) return;
    BANNER.hidden = false;
    document.body.classList.add('has-consent-banner');
    if (focusFirst) {
      var title = BANNER.querySelector('#consent-title');
      if (title) { title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: false }); }
    }
  }

  function hideBanner() {
    if (!BANNER) return;
    BANNER.hidden = true;
    document.body.classList.remove('has-consent-banner');
    if (PREFS) PREFS.hidden = true;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  // The CSRF token lives on the banner element itself (server-rendered) and in
  // the customise form. Never assume a global exists: an empty token would make
  // every choice fail with 403 while the UI silently pretended to save it.
  function csrfToken() {
    if (BANNER && BANNER.dataset && BANNER.dataset.csrf) return BANNER.dataset.csrf;
    var field = document.querySelector('#consent-form [name="_csrf"]');
    return field && field.value ? field.value : '';
  }

  function post(url, data) {
    var payload = Object.assign({ _csrf: csrfToken() }, data || {});
    var body = new URLSearchParams();
    Object.keys(payload).forEach(function (k) { body.append(k, payload[k]); });
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-Token': csrfToken(),
        // Ask for JSON explicitly: the server otherwise answers with a 302 that
        // fetch follows, and parsing the resulting HTML as JSON throws.
        Accept: 'application/json',
      },
      body: body.toString(),
      credentials: 'same-origin',
    }).then(function (r) {
      if (!r.ok) throw new Error('consent ' + r.status);
      return r.json();
    });
  }

  function choiceMade(result) {
    document.body.setAttribute('data-consent-recorded', 'true');
    var s = result.state || {};
    announce('Cookie preferences saved. Analytics ' + (s.analytics ? 'on' : 'off') +
      ', marketing ' + (s.marketing ? 'on' : 'off') + '.');
    hideBanner();
    updateStateLabels(s);
  }

  function updateStateLabels(state) {
    ['functional', 'analytics', 'marketing'].forEach(function (k) {
      var input = document.getElementById('pref-' + k + '-toggle');
      var label = document.querySelector('[data-state-for="pref-' + k + '-toggle"]');
      if (input && state && typeof state[k] === 'boolean') input.checked = state[k];
      if (label && state && typeof state[k] === 'boolean') label.textContent = state[k] ? 'On' : 'Off';
    });
  }

  /* ---------------------------- banner wiring --------------------------- */
  if (BANNER && !hasConsentCookie()) showBanner(false);

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-consent-action]');
    if (btn) {
      var action = btn.getAttribute('data-consent-action');
      lastFocus = btn;
      if (action === 'accept-all') {
        post('/consent/accept-all', {}).then(choiceMade).catch(function () { announce('Could not save preferences. Please try again.'); });
      } else if (action === 'reject-non-essential') {
        post('/consent/reject', {})
          .then(choiceMade)
          .catch(function () {
            announce('Could not save your choice — nothing was recorded. Please try again.', true);
          });
      } else if (action === 'customize') {
        showBanner(false);
        if (PREFS) {
          PREFS.hidden = false;
          btn.setAttribute('aria-expanded', 'true');
          var first = document.getElementById('pref-functional-toggle');
          if (first) first.focus();
        }
      }
    }

    var opener = e.target.closest('[data-consent-open]');
    if (opener) {
      lastFocus = opener;
      showBanner(true);
      if (PREFS) {
        PREFS.hidden = false;
        var customizeBtn = BANNER.querySelector('[data-consent-action="customize"]');
        if (customizeBtn) customizeBtn.setAttribute('aria-expanded', 'true');
      }
    }
  });

  /* Escape closes the preferences panel (not the banner itself — it stays
     until a choice is made, which is why it is a region, not a modal). */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && PREFS && !PREFS.hidden) {
      PREFS.hidden = true;
      var customizeBtn = BANNER.querySelector('[data-consent-action="customize"]');
      if (customizeBtn) { customizeBtn.setAttribute('aria-expanded', 'false'); customizeBtn.focus(); }
    }
  });

  /* Switch labels track their state for screen readers and sighted users. */
  ['functional', 'analytics', 'marketing'].forEach(function (k) {
    var input = document.getElementById('pref-' + k + '-toggle');
    var label = document.querySelector('[data-state-for="pref-' + k + '-toggle"]');
    if (input && label) {
      input.addEventListener('change', function () { label.textContent = input.checked ? 'On' : 'Off'; });
    }
  });

  /* AJAX save from the preferences form so focus is not lost on navigation. */
  var form = document.getElementById('consent-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = { _csrf: form.querySelector('[name="_csrf"]').value, source: 'banner-custom' };
      ['functional', 'analytics', 'marketing'].forEach(function (k) {
        var i = document.getElementById('pref-' + k + '-toggle');
        data[k] = i && i.checked ? '1' : '0';
      });
      post('/consent', data).then(choiceMade).catch(function () { announce('Could not save preferences. Please try again.'); });
    });
  }

  /* Settings page switches post immediately, so the state never looks saved
     when it is not. */
  var pageForm = document.getElementById('cookie-settings-form');
  if (pageForm) {
    pageForm.addEventListener('submit', function () {
      var live = document.getElementById('js-live');
      if (live) live.textContent = 'Saving your preferences…';
    });
  }

  window.ANConsent = { show: showBanner, hide: hideBanner, updateStateLabels: updateStateLabels };
})();
