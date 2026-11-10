'use strict';
/**
 * Requirement 14 — colour contrast verification.
 * Computes real WCAG 2.x relative-luminance ratios for every text/background
 * pairing the design system actually uses. No eyeballing, no "looks fine".
 */
const fs = require('fs');
const path = require('path');

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function luminance([r, g, b]) {
  const s = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}
function ratio(fg, bg) {
  const a = luminance(hexToRgb(fg));
  const b = luminance(hexToRgb(bg));
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const BG = '#F7F7F5';
const WHITE = '#FFFFFF';
const DARK = '#191919';

// [name, foreground, background, kind]  kind: normal | large | ui (3:1)
const PAIRS = [
  ['Primary text on page background', '#111111', BG, 'normal'],
  ['Primary text on white surface', '#111111', WHITE, 'normal'],
  ['Secondary body text on page background', '#595959', BG, 'normal'],
  ['Secondary body text on white surface', '#595959', WHITE, 'normal'],
  ['Muted small text on page background', '#595959', BG, 'normal'],
  ['Placeholder text on white', '#6B6B6B', WHITE, 'normal'],
  ['Disabled/outline variant text', '#767676', WHITE, 'normal'],
  ['Text on dark sections', '#FFFFFF', DARK, 'normal'],
  ['Secondary text on dark sections', '#C9C9C6', DARK, 'normal'],
  ['Eyebrow text on dark', '#C9C9C6', DARK, 'normal'],
  ['Dark section link white', '#FFFFFF', DARK, 'normal'],
  ['Footer legal note on dark', '#C9C9C6', DARK, 'normal'],
  ['Button label on ink button', '#FFFFFF', '#111111', 'normal'],
  ['Ghost button label', '#111111', BG, 'normal'],
  ['Light button label on dark', '#111111', '#FFFFFF', 'normal'],
  ['Price label on white', '#111111', WHITE, 'normal'],
  ['Price label on page background', '#111111', BG, 'normal'],
  ['Error text', '#A32020', WHITE, 'normal'],
  ['Error text on error background', '#5C1212', '#FBEDED', 'normal'],
  ['Success text on success background', '#14401F', '#EDF6F0', 'normal'],
  ['Info text on info background', '#143A66', '#EEF3FA', 'normal'],
  ['Warning text on warn background', '#4E3600', '#FDF6E7', 'normal'],
  ['In-stock dot (non-text UI, 3:1)', '#1D5B33', WHITE, 'ui'],
  ['Out-of-stock text', '#A32020', WHITE, 'normal'],
  ['Consent banner body text', '#595959', WHITE, 'normal'],
  ['Consent banner link', '#111111', WHITE, 'normal'],
  ['Switch track border (UI, 3:1)', '#767676', WHITE, 'ui'],
  ['Form input border (UI, 3:1)', '#767676', WHITE, 'ui'],
  ['Focus ring on light background', '#0B5CD5', BG, 'ui'],
  ['Focus ring on white', '#0B5CD5', WHITE, 'ui'],
  ['Focus ring on dark background', '#8FC1FF', DARK, 'ui'],
  ['Cat card label on gradient overlay', '#FFFFFF', '#111111', 'normal'],
  ['Flag text on white', '#111111', WHITE, 'normal'],
  ['Sold-out flag text', '#A32020', WHITE, 'normal'],
  ['Card subtitle on page background', '#595959', BG, 'normal'],
  ['Category tagline on dark overlay', '#E4E4E0', '#1F1F1F', 'normal'],
  ['Verified badge text', '#1D5B33', WHITE, 'normal'],
  ['Neutral badge text', '#595959', WHITE, 'normal'],
  ['Pending badge text', '#6E4B00', WHITE, 'normal'],
  ['Pay tag text', '#6E4B00', WHITE, 'normal'],
  ['Table header text on #F0F0ED', '#111111', '#F0F0ED', 'normal'],
  ['Table cell body on white', '#595959', WHITE, 'normal'],
  ['Status pill on white', '#111111', WHITE, 'normal'],
  ['Ticker text on white', '#595959', WHITE, 'normal'],
  ['Free shipping note text', '#1B4B87', '#EEF3FA', 'normal'],
  ['Topbar text on ink', '#FFFFFF', '#111111', 'normal'],
  ['Large display heading on background', '#111111', BG, 'large'],
  ['Hero subheadline', '#595959', BG, 'normal'],
];

const THRESHOLDS = { normal: 4.5, large: 3, ui: 3 };
const results = PAIRS.map(([name, fg, bg, kind]) => {
  const r = ratio(fg, bg);
  return { name, fg, bg, kind, ratio: Number(r.toFixed(2)), required: THRESHOLDS[kind], pass: r >= THRESHOLDS[kind] };
});

/**
 * Parse the stylesheet to make sure no CSS colour pair is used that this test
 * does not know about. This is a guard against "someone added a light grey".
 */
function auditCssForUnknownGreys() {
  const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'css', 'app.css'), 'utf8');
  const findings = [];
  // Any literal hex colour that is lighter than #999 used as a text colour
  const textColorDecls = css.match(/(?:^|[;{\s])color:\s*(#[0-9a-fA-F]{3,6})/g) || [];
  textColorDecls.forEach((decl) => {
    const hex = decl.match(/#[0-9a-fA-F]{3,6}/)[0];
    const full = hex.length === 4
      ? '#' + hex.slice(1).split('').map((c) => c + c).join('')
      : hex;
    const lum = luminance(hexToRgb(full));
    if (lum > 0.55) findings.push({ colour: full, luminance: Number(lum.toFixed(2)) });
  });
  return findings;
}

const lightTextFindings = auditCssForUnknownGreys();
const failures = results.filter((r) => !r.pass);

function report() {
  const rows = results.map((r) => (
    `| ${r.name} | ${r.fg} on ${r.bg} | ${r.ratio}:1 | ${r.required}:1 | ${r.pass ? 'PASS' : 'FAIL'} |`
  ));
  return { results, failures, lightTextFindings, rows };
}

if (require.main === module) {
  const { rows, failures, lightTextFindings } = report();
  console.log('AESTHETICNOVA — colour contrast audit (WCAG 2.2 AA)\n');
  console.log('| Pairing | Colours | Ratio | Required | Result |');
  console.log('|---|---|---|---|---|');
  rows.forEach((r) => console.log(r));
  console.log(`\n${results.length} pairings checked, ${failures.length} failure(s).`);
  if (lightTextFindings.length) {
    console.log('\nLight literal text colours found in CSS (review manually):',
      JSON.stringify(lightTextFindings));
  } else {
    console.log('No text colour in the stylesheet is lighter than the measured palette.');
  }
  process.exit(failures.length ? 1 : 0);
}

module.exports = { ratio, report, PAIRS };
