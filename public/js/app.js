/* AESTHETICNOVA — progressive enhancement.
 * Everything here is additive: every flow works with JavaScript disabled
 * because forms post to the server and redirect.
 */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function csrfToken() {
    var meta = document.querySelector('input[name="_csrf"]');
    return meta ? meta.value : '';
  }

  function announce(msg) {
    var live = document.getElementById('js-live');
    if (live) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 50); }
  }

  /* ------------------------------ mobile nav ---------------------------- */
  var menuToggle = document.getElementById('menu-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function () {
      var open = mobileNav.getAttribute('data-open') === 'true';
      mobileNav.setAttribute('data-open', String(!open));
      menuToggle.setAttribute('aria-expanded', String(!open));
      menuToggle.querySelector('.sr-only').textContent = open ? 'Open menu' : 'Close menu';
      if (!open) { var a = mobileNav.querySelector('a'); if (a) a.focus(); }
    });
  }

  /* ------------------------------- search ------------------------------- */
  var searchToggle = document.getElementById('search-toggle');
  var searchPanel = document.getElementById('search-panel');
  if (searchToggle && searchPanel) {
    searchToggle.addEventListener('click', function () {
      var open = !searchPanel.hidden;
      searchPanel.hidden = open;
      searchToggle.setAttribute('aria-expanded', String(!open));
      if (!open) { var input = document.getElementById('site-search'); if (input) input.focus(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !searchPanel.hidden) {
        searchPanel.hidden = true;
        searchToggle.setAttribute('aria-expanded', 'false');
        searchToggle.focus();
      }
    });
  }

  /* ------------------------------ cart drawer --------------------------- */
  var drawer = document.getElementById('cart-drawer');
  var cartOpenBtn = document.getElementById('cart-open');
  var drawerBody = document.querySelector('[data-cart-drawer-body]');
  var lastFocus = null;

  function renderCart(data) {
    if (!drawerBody) return;
    if (!data.items || !data.items.length) {
      drawerBody.innerHTML =
        '<div class="empty-state"><h3 style="font-size:1rem;">Your bag is empty</h3>' +
        '<p>Nothing saved in the bag yet. Have a look at <a href="/shop">the current pieces</a>.</p></div>' +
        '<a class="btn btn--block mt-2" href="/shop">Shop all</a>';
      return;
    }
    var rows = data.items.map(function (it) {
      return '<div class="line-item" style="grid-template-columns:64px 1fr auto;">' +
        '<img src="' + it.image + '" alt="" width="64" height="80">' +
        '<div><h3 style="font-size:.8125rem;"><a href="/product/' + it.slug + '">' + it.name + '</a></h3>' +
        '<p class="variant-note mb-0">' + it.variant + ' · Qty ' + it.qty + '</p></div>' +
        '<div class="li-price">' + it.line_total + '</div></div>';
    }).join('');
    drawerBody.innerHTML = rows +
      '<div class="summary-row summary-row--total" style="border-top:1px solid #111;"><span>Subtotal</span><span>' +
      data.subtotal + '</span></div>' +
      '<p class="small muted" style="margin-top:.5rem;">Shipping and GST are itemised in your bag before payment.</p>' +
      '<div style="display:grid;gap:.5rem;margin-top:1rem;">' +
      '<a class="btn btn--block" href="/cart">View bag</a>' +
      '<a class="btn btn--ghost btn--block" href="/checkout">Checkout</a></div>';
  }

  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    if (typeof drawer.showModal === 'function') {
      drawer.showModal();
    } else {
      drawer.setAttribute('open', '');
    }
    fetch('/api/cart', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(renderCart)
      .catch(function () { if (drawerBody) drawerBody.innerHTML = '<p class="small">Could not load your bag. <a href="/cart">Open the bag page</a>.</p>'; });
    var close = drawer.querySelector('[data-cart-close]');
    if (close) close.focus();
  }

  function closeDrawer() {
    if (!drawer) return;
    if (typeof drawer.close === 'function' && drawer.open) drawer.close();
    else drawer.removeAttribute('open');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  if (cartOpenBtn) cartOpenBtn.addEventListener('click', openDrawer);
  if (drawer) {
    var closeBtn = drawer.querySelector('[data-cart-close]');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    // Native dialog handles Escape; fall back for older engines.
    drawer.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
    drawer.addEventListener('cancel', function () { if (lastFocus) lastFocus.focus(); });
    drawer.addEventListener('click', function (e) { if (e.target === drawer) closeDrawer(); });
  }

  /* ---------------------------- add to bag ------------------------------ */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form.matches('[data-cart-ajax]')) {
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }
      fetch(form.action, {
        method: 'POST',
        body: new URLSearchParams(new FormData(form)),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': csrfToken(), Accept: 'application/json' },
        credentials: 'same-origin',
      }).then(function (r) { return r.json(); }).then(function (data) {
        if (btn) { btn.disabled = false; btn.textContent = 'Added to bag'; }
        if (data.count != null) {
          document.querySelectorAll('[data-cart-count]').forEach(function (n) { n.textContent = data.count; });
          document.querySelectorAll('[data-cart-count-sr]').forEach(function (n) { n.textContent = data.count + ' item' + (data.count === 1 ? '' : 's'); });
        }
        announce('Added to your bag. ' + (data.count || 0) + ' item' + (data.count === 1 ? '' : 's') + ' in bag.');
        openDrawer();
        setTimeout(function () { if (btn) btn.textContent = 'Add to bag'; }, 2500);
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Add to bag'; }
        form.submit();
      });
    }
  });

  /* ----------------------------- wishlist ------------------------------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-wishlist]');
    if (!btn) return;
    var id = btn.getAttribute('data-wishlist');
    fetch('/wishlist/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRF-Token': csrfToken(), Accept: 'application/json' },
      body: 'product_id=' + encodeURIComponent(id),
      credentials: 'same-origin',
    }).then(function (r) { return r.json(); }).then(function (data) {
      if (!data.ok) {
        announce(data.error || 'Sign in to save pieces.');
        if (data.signin) window.location.href = data.signin + '?next=' + encodeURIComponent(location.pathname);
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
    }).catch(function () { announce('Could not update your wishlist. Please try again.'); });
  });

  /* ----------------------- scroll reveal (opt-in) ----------------------- */
  var revealables = document.querySelectorAll('.reveal');
  if (revealables.length && !reduceMotion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* --------------------- quantity stepper (PDP/cart) -------------------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-qty]');
    if (!b) return;
    var wrap = b.closest('.qty');
    var input = wrap && wrap.querySelector('input');
    if (!input) return;
    var val = parseInt(input.value, 10) || 1;
    var min = parseInt(input.min, 10) || 1;
    var max = parseInt(input.max, 10) || 99;
    val = b.getAttribute('data-qty') === '+' ? Math.min(max, val + 1) : Math.max(min, val - 1);
    input.value = val;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ------------------------- confirm destructive ------------------------ */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form.matches('[data-confirm]')) {
      if (!window.confirm(form.getAttribute('data-confirm'))) e.preventDefault();
    }
  });
})();
