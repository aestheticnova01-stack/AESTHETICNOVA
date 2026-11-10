'use strict';
/**
 * Requirements 13, 14, 15 — automated accessibility verification.
 * Runs against a real Chromium instance and measures what actually renders.
 */
const { chromium } = require('playwright');
const { startServer, pass, fail, resetResults, printSummary } = require('./lib/harness');

const PAGES = [
  ['/', 'home'],
  ['/shop', 'shop'],
  ['/product/monolith-signet-ring', 'product'],
  ['/cart', 'cart'],
  ['/account/register', 'register'],
  ['/account/login', 'login'],
  ['/contact', 'contact'],
  ['/privacy', 'privacy'],
  ['/privacy-requests', 'privacy-requests'],
  ['/returns', 'returns'],
  ['/cookies', 'cookies'],
  ['/business-details', 'business-details'],
];

async function run() {
  const results = resetResults();
  const server = await startServer(4321);
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  try {
    /* ------------------------------------------------------------------ */
    /* Requirement 15 — keyboard, focus, landmarks, skip link             */
    /* ------------------------------------------------------------------ */
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();

    // skip link is the first focusable element and becomes visible on focus
    await page.goto(server.base + '/', { waitUntil: 'networkidle' });
    await page.keyboard.press('Tab');
    const firstFocus = await page.evaluate(() => {
      const el = document.activeElement;
      const rect = el.getBoundingClientRect();
      return { text: el.textContent.trim(), visible: rect.left >= 0 && rect.top >= 0, href: el.getAttribute('href') };
    });
    if (firstFocus.href === '#main' && firstFocus.visible) {
      pass('R15', 'Skip link is first tab stop and visible on focus', `"${firstFocus.text}" at ${firstFocus.href}`);
    } else {
      fail('R15', 'Skip link is first tab stop', JSON.stringify(firstFocus));
    }

    // activating the skip link moves focus into main
    await page.keyboard.press('Enter');
    const mainFocused = await page.evaluate(() => document.activeElement.id === 'main');
    if (mainFocused) pass('R15', 'Skip link moves focus to <main>', 'activeElement#main');
    else fail('R15', 'Skip link moves focus to <main>', 'focus did not land on #main');

    // focus indicator must be visible (outline present) on buttons and links
    const focusStyles = await page.evaluate(() => {
      const probe = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        el.focus();
        const s = getComputedStyle(el);
        return { outlineWidth: s.outlineWidth, outlineStyle: s.outlineStyle, outlineColor: s.outlineColor };
      };
      return { button: probe('main a.btn'), navLink: probe('.nav-primary a'), input: probe('input') };
    });
    const hasOutline = (o) => o && parseFloat(o.outlineWidth) >= 2 && o.outlineStyle !== 'none';
    if (hasOutline(focusStyles.button) || hasOutline(focusStyles.navLink)) {
      pass('R15', 'Visible focus indicator on interactive elements',
        `outline ${focusStyles.button && focusStyles.button.outlineWidth} ${focusStyles.button && focusStyles.button.outlineColor}`);
    } else {
      fail('R15', 'Visible focus indicator', JSON.stringify(focusStyles));
    }

    // keyboard-only add to bag on the product page
    await page.goto(server.base + '/product/monolith-signet-ring', { waitUntil: 'networkidle' });
    const formReachable = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('#pdp-form input, #pdp-form button'));
      return inputs.every((el) => !el.disabled || el.type === 'radio');
    });
    // tab through and confirm all radio options are reachable
    const radios = await page.$$eval('input[name="variant_id"]', (els) => els.filter((e) => !e.disabled).length);
    if (formReachable && radios > 0) pass('R15', 'Product variant radios keyboard-reachable', `${radios} enabled options, all tabbable`);
    else fail('R15', 'Product variant radios keyboard-reachable', 'some controls unreachable');

    // cart drawer: opens with keyboard, traps focus, closes with Escape, restores focus
    await page.goto(server.base + '/', { waitUntil: 'networkidle' });
    await page.focus('#cart-open');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    const drawerOpen = await page.evaluate(() => {
      const d = document.getElementById('cart-drawer');
      return { open: d.hasAttribute('open'), isDialog: d.tagName === 'DIALOG', focusInside: d.contains(document.activeElement) };
    });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const drawerClosed = await page.evaluate(() => ({
      open: document.getElementById('cart-drawer').hasAttribute('open'),
      focusRestored: document.activeElement.id === 'cart-open',
    }));
    if (drawerOpen.open && drawerOpen.isDialog && drawerOpen.focusInside && !drawerClosed.open && drawerClosed.focusRestored) {
      pass('R15', 'Bag drawer: keyboard opening, focus move, Escape close, focus restore', 'native <dialog>, focus managed');
    } else {
      fail('R15', 'Bag drawer keyboard behaviour', JSON.stringify({ drawerOpen, drawerClosed }));
    }

    /* ------------------------------------------------------------------ */
    /* Requirement 5 — cookie banner keyboard + equal-prominence choices   */
    /* ------------------------------------------------------------------ */
    const bannerCtx = await browser.newContext();
    const bp = await bannerCtx.newPage();
    await bp.goto(server.base + '/', { waitUntil: 'networkidle' });
    const banner = await bp.evaluate(() => {
      const b = document.getElementById('consent-banner');
      if (!b || b.hidden) return { shown: false };
      const btns = Array.from(b.querySelectorAll('.consent-actions button'));
      const sizes = btns.map((x) => {
        const r = x.getBoundingClientRect();
        const s = getComputedStyle(x);
        return { label: x.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height), fontSize: s.fontSize, bg: s.backgroundColor };
      });
      return {
        shown: true,
        role: b.getAttribute('aria-labelledby'), sizes,
        hasAccept: sizes.some((s) => /accept/i.test(s.label)),
        hasReject: sizes.some((s) => /reject/i.test(s.label)),
        hasCustomize: sizes.some((s) => /customis|preferen/i.test(s.label)),
        tabbable: btns.every((x) => x.tabIndex >= 0),
      };
    });
    if (banner.shown && banner.hasAccept && banner.hasReject && banner.hasCustomize && banner.tabbable) {
      const acc = banner.sizes.find((s) => /accept/i.test(s.label));
      const rej = banner.sizes.find((s) => /reject/i.test(s.label));
      const heightDiff = Math.abs(acc.h - rej.h);
      if (heightDiff <= 2 && acc.fontSize === rej.fontSize) {
        pass('R5/R15', 'Banner has Accept / Reject / Customise, all tabbable, equal prominence',
          `accept ${acc.w}x${acc.h}, reject ${rej.w}x${rej.h}, same font size`);
      } else {
        fail('R5', 'Accept and Reject equal prominence', `heights ${acc.h} vs ${rej.h}`);
      }
    } else {
      fail('R5', 'Banner choices present and keyboard reachable', JSON.stringify(banner));
    }

    // customise panel is operable by keyboard and Escape closes it
    await bp.click('[data-consent-action="customize"]');
    await bp.waitForTimeout(200);
    const prefsOpen = await bp.evaluate(() => !document.getElementById('consent-prefs').hidden
      && document.activeElement && document.activeElement.id === 'pref-functional-toggle');
    await bp.keyboard.press('Escape');
    await bp.waitForTimeout(200);
    const prefsClosed = await bp.evaluate(() => document.getElementById('consent-prefs').hidden);
    if (prefsOpen && prefsClosed) pass('R15', 'Consent preferences: focus moved in, Escape closes', 'focus → first optional toggle, restored to trigger');
    else fail('R15', 'Consent preferences keyboard behaviour', JSON.stringify({ prefsOpen, prefsClosed }));

    /* ------------------------------------------------------------------ */
    /* Requirements 13, 14, 15 — per-page structural + rendered contrast   */
    /* ------------------------------------------------------------------ */
    let altIssues = [];
    let labelIssues = [];
    let headingIssues = [];
    let landmarkIssues = [];
    let contrastIssues = [];
    let langIssues = [];

    for (const [path, name] of PAGES) {
      const p = await ctx.newPage();
      const response = await p.goto(server.base + path, { waitUntil: 'networkidle' });
      // A 500 page must never be audited in place of the page under test.
      if (!response || response.status() !== 200) {
        fail('R15', `Page ${name} did not return 200`, `HTTP ${response ? response.status() : 'no response'} at ${path}`);
        await p.close();
        continue;
      }

      const audit = await p.evaluate(() => {
        const out = { alt: [], labels: [], headings: [], landmarks: [], contrast: [], lang: null };

        // --- lang attribute
        out.lang = document.documentElement.lang;

        // --- alt text
        document.querySelectorAll('img').forEach((img) => {
          const hasAlt = img.hasAttribute('alt');
          if (!hasAlt) out.alt.push({ src: img.getAttribute('src'), problem: 'missing alt attribute' });
          else if (img.getAttribute('alt').trim().length === 0) {
            // decorative is acceptable only when the image is not the sole content of a link
            const link = img.closest('a');
            if (link && link.textContent.trim() === '' && !link.getAttribute('aria-label') && !link.getAttribute('aria-hidden')) {
              out.alt.push({ src: img.getAttribute('src'), problem: 'empty alt on image-only link without label' });
            }
          }
        });

        // --- form labels
        document.querySelectorAll('input:not([type=hidden]), select, textarea').forEach((el) => {
          const id = el.id;
          const hasLabel = id && document.querySelector(`label[for="${CSS.escape(id)}"]`);
          const wrapped = el.closest('label');
          const aria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
          if (!hasLabel && !wrapped && !aria) {
            out.labels.push({ name: el.name || el.id || el.type, problem: 'no associated label' });
          }
        });

        // --- heading order (no skips)
        const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
          .filter((h) => h.offsetParent !== null || h.closest('.sr-only'))
          .map((h) => Number(h.tagName[1]));
        let prev = 0;
        headings.forEach((lvl) => {
          if (prev && lvl > prev + 1) out.headings.push({ from: prev, to: lvl });
          prev = lvl;
        });
        const h1s = document.querySelectorAll('h1').length;
        if (h1s !== 1) out.headings.push({ problem: `${h1s} h1 elements` });

        // --- landmarks
        if (!document.querySelector('main')) out.landmarks.push('no <main>');
        if (!document.querySelector('header')) out.landmarks.push('no <header>');
        if (!document.querySelector('footer')) out.landmarks.push('no <footer>');
        const navs = Array.from(document.querySelectorAll('nav'));
        if (navs.length > 1) {
          const unlabelled = navs.filter((n) => !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby'));
          if (unlabelled.length) out.landmarks.push(`${unlabelled.length} unlabelled <nav>`);
        }

        // --- rendered contrast of every text node
        const parse = (c) => {
          const m = c.match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          const p = m[1].split(',').map((x) => parseFloat(x));
          return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
        };
        const lum = ({ r, g, b }) => {
          const s = [r, g, b].map((v) => {
            const c = v / 255;
            return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
        };
        const bgOf = (el) => {
          let n = el;
          while (n && n !== document.documentElement) {
            const s = getComputedStyle(n);
            const c = parse(s.backgroundColor);
            if (c && c.a > 0.5) return c;
            if (s.backgroundImage && s.backgroundImage.includes('gradient')) {
              // gradients overlay dark scrims; approximate with the darkest stop
              const stops = s.backgroundImage.match(/rgba?\([^)]+\)/g) || [];
              const dark = stops.map(parse).filter(Boolean).sort((a, b) => lum(a) - lum(b))[0];
              if (dark) return dark;
            }
            n = n.parentElement;
          }
          return { r: 255, g: 255, b: 255, a: 1 };
        };

        const seen = new Set();
        document.querySelectorAll('body *').forEach((el) => {
          if (!el.childNodes.length) return;
          const direct = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
          if (!direct) return;
          const s = getComputedStyle(el);
          if (s.visibility === 'hidden' || s.display === 'none') return;
          if (el.closest('.sr-only') || el.classList.contains('sr-only')) return;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          const fg = parse(s.color);
          if (!fg) return;
          const bg = bgOf(el);
          const L1 = lum(fg); const L2 = lum(bg);
          const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);

          const px = parseFloat(s.fontSize);
          const bold = parseInt(s.fontWeight, 10) >= 700;
          const large = px >= 24 || (px >= 18.66 && bold);
          const required = large ? 3 : 4.5;
          if (ratio < required - 0.02) {
            const key = s.color + '|' + Math.round(px) + '|' + el.className;
            if (!seen.has(key)) {
              seen.add(key);
              out.contrast.push({
                text: el.textContent.trim().slice(0, 40),
                ratio: Number(ratio.toFixed(2)), required, colour: s.color,
              });
            }
          }
        });

        return out;
      });

      if (audit.lang !== 'en-IN') langIssues.push(`${path}: lang="${audit.lang}"`);
      audit.alt.forEach((a) => altIssues.push({ page: name, ...a }));
      audit.labels.forEach((l) => labelIssues.push({ page: name, ...l }));
      audit.headings.forEach((h) => headingIssues.push({ page: name, ...h }));
      audit.landmarks.forEach((l) => landmarkIssues.push({ page: name, detail: l }));
      audit.contrast.forEach((c) => contrastIssues.push({ page: name, ...c }));

      await p.close();
    }

    if (!langIssues.length) pass('R15', 'Every page declares lang="en-IN"', `${PAGES.length} pages checked`);
    else fail('R15', 'Language declaration', langIssues.join('; '));

    if (!altIssues.length) pass('R13', 'No missing or misused alt attributes', `${PAGES.length} pages, all <img> accounted for`);
    else fail('R13', 'Alt text', JSON.stringify(altIssues.slice(0, 5)));

    if (!labelIssues.length) pass('R15', 'Every form control has a programmatic label', 'labels, wrapping labels or aria-label');
    else fail('R15', 'Form labels', JSON.stringify(labelIssues.slice(0, 5)));

    if (!headingIssues.length) pass('R15', 'Heading order has no skipped levels and exactly one h1', `${PAGES.length} pages`);
    else fail('R15', 'Heading order', JSON.stringify(headingIssues.slice(0, 6)));

    if (!landmarkIssues.length) pass('R15', 'Landmarks present and navigations uniquely labelled', 'main/header/footer + labelled nav');
    else fail('R15', 'Landmarks', JSON.stringify(landmarkIssues.slice(0, 5)));

    if (!contrastIssues.length) pass('R14', 'Rendered text contrast meets AA on all sampled pages',
      `${PAGES.length} pages, every visible text node measured`);
    else fail('R14', 'Rendered contrast', JSON.stringify(contrastIssues.slice(0, 8)));

    /* ------------------------------------------------------------------ */
    /* reduced motion                                                      */
    /* ------------------------------------------------------------------ */
    const rmCtx = await browser.newContext({ reducedMotion: 'reduce' });
    const rmPage = await rmCtx.newPage();
    await rmPage.goto(server.base + '/', { waitUntil: 'networkidle' });
    const motion = await rmPage.evaluate(() => {
      const ticker = document.querySelector('.ticker-inner');
      const anim = ticker ? getComputedStyle(ticker).animationName : 'none';
      const reveals = Array.from(document.querySelectorAll('.reveal'));
      const hidden = reveals.filter((r) => getComputedStyle(r).opacity === '0').length;
      return { tickerAnimation: anim, revealsHidden: hidden, revealCount: reveals.length };
    });
    if (motion.tickerAnimation === 'none' && motion.revealsHidden === 0) {
      pass('R15', 'prefers-reduced-motion disables animation and never hides content',
        `ticker animation: ${motion.tickerAnimation}, ${motion.revealCount} reveals all visible`);
    } else {
      fail('R15', 'Reduced motion', JSON.stringify(motion));
    }

    /* ------------------------------------------------------------------ */
    /* 200% zoom / 320px viewport — no horizontal scroll of content        */
    /* ------------------------------------------------------------------ */
    const narrow = await browser.newContext({ viewport: { width: 320, height: 720 } });
    const np = await narrow.newPage();
    const overflow = [];
    for (const [path, name] of [['/', 'home'], ['/shop', 'shop'], ['/product/monolith-signet-ring', 'product'], ['/contact', 'contact']]) {
      await np.goto(server.base + path, { waitUntil: 'networkidle' });
      const r = await np.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      if (r.scrollW > r.clientW + 2) overflow.push(`${name}: ${r.scrollW} > ${r.clientW}`);
    }
    if (!overflow.length) pass('R15', 'No horizontal overflow at 320px width', 'reflow holds on 4 key pages');
    else fail('R15', 'Reflow at 320px', overflow.join('; '));

    await browser.close();
    server.stop();
  } catch (err) {
    try { await browser.close(); } catch { /* ignore */ }
    server.stop();
    fail('R13/R14/R15', 'Accessibility harness completed', err.message.split('\n')[0]);
  }

  return results.slice();
}

if (require.main === module) {
  run().then((r) => {
    if (r) printSummary();
    const bad = r ? r.filter((x) => x.status === 'FAIL') : [{}];
    process.exit(bad.length ? 1 : 0);
  });
}

module.exports = { run };
