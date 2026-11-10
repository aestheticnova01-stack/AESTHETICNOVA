'use strict';
/**
 * Seed the catalogue, tracker register and settings.
 * NOTE ON REVIEWS: no reviews are seeded. Seeding testimonials would breach the
 * "no fake reviews" rule, so every product starts in its honest empty state.
 */
const db = require('./db');

const CATEGORIES = [
  { slug: 'rings', name: 'Rings', tagline: 'Signets, bands and sculptural stacks',
    image: '/img/cat-rings.jpg',
    alt: 'Three polished stainless steel rings — a chunky signet, a slim band and an interlocking band — on a warm off-white surface.' },
  { slug: 'chains', name: 'Chains', tagline: 'Curb, box and rope links in solid silver tone',
    image: '/img/cat-chains.jpg',
    alt: 'A thick curb chain necklace coiled beside a fine box chain on a warm off-white surface.' },
  { slug: 'pendants', name: 'Pendants', tagline: 'Angular forms, quiet weight',
    image: '/img/cat-pendants.jpg',
    alt: 'Two stainless steel pendants on fine chains — one angular shard, one small circular disc — on a warm off-white surface.' },
  { slug: 'bracelets', name: 'Bracelets', tagline: 'Flat links and clean cuffs',
    image: '/img/cat-bracelets.jpg',
    alt: 'A chunky flat-link stainless steel bracelet next to a slim polished cuff on a warm off-white surface.' },
  { slug: 'earrings', name: 'Earrings', tagline: 'Small hoops, sharp studs',
    image: '/img/cat-earrings.jpg',
    alt: 'Three pairs of small stainless steel earrings — a chunky hoop, a flat square stud and a tiny huggie — arranged in a row.' },
];

// Prices are the real catalogue prices for this build, stored in paise.
const PRODUCTS = [
  {
    slug: 'monolith-signet-ring', name: 'Monolith Signet Ring', category: 'rings',
    price: 149000,
    description: 'A flat-topped signet with squared shoulders and a deliberately heavy face. Built as an everyday anchor piece, finished by hand and polished to a soft mirror.',
    details: ['Face: 12 mm × 9 mm flat rectangle', 'Band width: 4 mm tapering to 3 mm', 'Weight: approx. 9 g (size 18)', 'Clasp/fitting: solid band, no moving parts'],
    care: 'Wipe with a soft dry cloth after wear. Remove before swimming in chlorinated water or handling harsh cleaning agents. Store separately to avoid surface scratches.',
    material: 'Stainless steel', finish: 'Hand-polished mirror face, brushed band', made_in: 'India',
    image: '/img/p-signet.jpg',
    image_alt: 'Front view of a chunky polished stainless steel signet ring with a flat rectangular top on a warm off-white background.',
    variant_type: 'size', featured: 1, new_arrival: 1,
    variants: [['IN 14', 6], ['IN 16', 11], ['IN 18', 14], ['IN 20', 4], ['IN 22', 0]],
    claim_note: 'Solid stainless steel construction; no plating claim is made for this item.',
  },
  {
    slug: 'line-band-ring', name: 'Line Band', category: 'rings',
    price: 89000,
    description: 'A 2.5 mm band with a single brushed facet. Thin enough to stack, plain enough to wear alone.',
    details: ['Band width: 2.5 mm', 'Profile: flat outer, comfort inner', 'Weight: approx. 3 g (size 16)'],
    care: 'Polish with a dry microfibre cloth. Avoid abrasive cleaners.',
    material: 'Stainless steel', finish: 'Brushed facet, polished sides', made_in: 'India',
    image: '/img/p-band.jpg',
    image_alt: 'Two slim stainless steel band rings, one brushed and one mirror polished, standing side by side on a warm off-white background.',
    variant_type: 'size', featured: 0, new_arrival: 0,
    variants: [['IN 12', 9], ['IN 14', 12], ['IN 16', 3], ['IN 18', 8], ['IN 20', 5]],
    claim_note: 'Sold as a single ring. Images show two finishes for reference only.',
  },
  {
    slug: 'twin-facet-ring', name: 'Twin Facet Ring', category: 'rings',
    price: 129000,
    description: 'Two interlocking flat bands cast as one piece. Wears like a stack without the slip.',
    details: ['Band width: 7 mm total', 'Construction: single cast piece', 'Weight: approx. 6 g (size 16)'],
    care: 'Dry cloth only. Remove before gym or swim.',
    material: 'Stainless steel', finish: 'Polished', made_in: 'India',
    image: '/img/cat-rings.jpg',
    image_alt: 'Interlocking twin-band stainless steel ring photographed with two other silver rings on a warm off-white surface.',
    variant_type: 'size', featured: 0, new_arrival: 1,
    variants: [['IN 14', 2], ['IN 16', 7], ['IN 18', 9], ['IN 20', 0]],
    claim_note: 'Photographed as part of a set; one ring is shipped.',
  },
  {
    slug: 'heavy-curb-chain', name: 'Heavy Curb Chain', category: 'chains',
    price: 289000,
    description: 'A 7 mm curb chain with flat-lying links that sit close to the collarbone. Weighted lobster clasp.',
    details: ['Link width: 7 mm', 'Lengths: 45 cm, 50 cm, 55 cm', 'Clasp: stainless lobster with 3 mm safety catch', 'Weight: approx. 46 g at 50 cm'],
    care: 'Store flat. Wipe after wear to remove skin oils.',
    material: 'Stainless steel', finish: 'Polished', made_in: 'India',
    image: '/img/cat-chains.jpg',
    image_alt: 'Thick polished stainless steel curb chain necklace laid in a curve on a warm off-white surface.',
    variant_type: 'length', featured: 1, new_arrival: 0,
    variants: [['45 cm', 8, 0], ['50 cm', 12, 0], ['55 cm', 5, 20000]],
    claim_note: 'Length 55 cm carries a ₹200 material surcharge, shown on the product page.',
  },
  {
    slug: 'signal-box-chain', name: 'Signal Box Chain', category: 'chains',
    price: 159000,
    description: 'A fine 2 mm box chain that reads clean under a collar. Sits well under a tee or over a hoodie.',
    details: ['Link width: 2 mm', 'Lengths: 45 cm, 50 cm', 'Clasp: slim lobster', 'Weight: approx. 11 g at 50 cm'],
    care: 'Wipe with a dry cloth. Avoid pulling on the clasp.',
    material: 'Stainless steel', finish: 'Polished', made_in: 'India',
    image: '/img/cat-chains.jpg',
    image_alt: 'Fine stainless steel box chain necklace draped horizontally on a warm off-white surface.',
    variant_type: 'length', featured: 0, new_arrival: 0,
    variants: [['45 cm', 20, 0], ['50 cm', 16, 0]],
    claim_note: '',
  },
  {
    slug: 'arc-rope-chain', name: 'Arc Rope Chain', category: 'chains',
    price: 219000,
    description: 'A 4 mm twisted rope link with continuous movement. Pairs with the Arc pendant or stands alone.',
    details: ['Link width: 4 mm', 'Lengths: 45 cm, 50 cm, 55 cm', 'Clasp: stainless lobster', 'Weight: approx. 24 g at 50 cm'],
    care: 'Rinse-free wipe only. Keep away from perfume sprays.',
    material: 'Stainless steel', finish: 'Polished', made_in: 'India',
    image: '/img/cat-chains.jpg',
    image_alt: 'Twisted rope chain necklace in polished stainless steel on a warm off-white background.',
    variant_type: 'length', featured: 0, new_arrival: 1,
    variants: [['45 cm', 3, 0], ['50 cm', 6, 0], ['55 cm', 0, 0]],
    claim_note: '',
  },
  {
    slug: 'shard-pendant', name: 'Shard Pendant', category: 'pendants',
    price: 139000,
    description: 'A tapered angular shard, cut flat on one face and left raw-edged on the other. Ships on a 2 mm box chain.',
    details: ['Pendant: 28 mm × 9 mm', 'Chain: 50 cm box chain included', 'Weight: approx. 9 g total', 'Finish: brushed face, polished edges'],
    care: 'Wipe dry. Do not use polishing compounds on the brushed face.',
    material: 'Stainless steel', finish: 'Brushed and polished', made_in: 'India',
    image: '/img/cat-pendants.jpg',
    image_alt: 'Angular stainless steel shard pendant on a fine chain on a warm off-white surface.',
    variant_type: 'none', featured: 1, new_arrival: 1,
    variants: [['One size', 14, 0]],
    claim_note: 'Chain length is fixed at 50 cm for this item.',
  },
  {
    slug: 'disc-pendant', name: 'Disc Pendant', category: 'pendants',
    price: 99000,
    description: 'A 16 mm disc with a subtle domed face and no engraving. The quiet one.',
    details: ['Disc: 16 mm diameter', 'Chain: 45 cm fine cable chain included', 'Weight: approx. 5 g total'],
    care: 'Dry cloth only.',
    material: 'Stainless steel', finish: 'Polished', made_in: 'India',
    image: '/img/cat-pendants.jpg',
    image_alt: 'Small polished stainless steel disc pendant on a fine chain on a warm off-white surface.',
    variant_type: 'none', featured: 0, new_arrival: 0,
    variants: [['One size', 19, 0]],
    claim_note: '',
  },
  {
    slug: 'flat-link-bracelet', name: 'Flat Link Bracelet', category: 'bracelets',
    price: 179000,
    description: 'Wide flat links with alternating brushed and polished faces. Sits flat on the wrist, no rattle.',
    details: ['Link width: 10 mm', 'Lengths: 18 cm, 20 cm, 22 cm', 'Clasp: fold-over with safety catch', 'Weight: approx. 28 g at 20 cm'],
    care: 'Store flat. Wipe after wear.',
    material: 'Stainless steel', finish: 'Brushed and polished', made_in: 'India',
    image: '/img/cat-bracelets.jpg',
    image_alt: 'Flat-link stainless steel bracelet with alternating brushed and polished links on a warm off-white surface.',
    variant_type: 'length', featured: 1, new_arrival: 0,
    variants: [['18 cm', 7, 0], ['20 cm', 10, 0], ['22 cm', 2, 0]],
    claim_note: '',
  },
  {
    slug: 'plain-cuff', name: 'Plain Cuff', category: 'bracelets',
    price: 109000,
    description: 'An open cuff with a 4 mm round profile and softened ends. Adjustable by a few millimetres.',
    details: ['Cuff width: 4 mm', 'Inner circumference: 165 mm (adjustable ±5 mm)', 'Weight: approx. 12 g'],
    care: 'Adjust gently by hand at the ends only.',
    material: 'Stainless steel', finish: 'Polished', made_in: 'India',
    image: '/img/cat-bracelets.jpg',
    image_alt: 'Slim polished stainless steel open cuff bracelet on a warm off-white surface.',
    variant_type: 'none', featured: 0, new_arrival: 0,
    variants: [['One size', 0, 0]],
    claim_note: 'Adjust the cuff by hand; repeated bending can weaken the metal over time.',
  },
  {
    slug: 'small-hoop-earrings', name: 'Small Hoop Earrings', category: 'earrings',
    price: 79000,
    description: 'A 12 mm hollow hoop with a flush hinge. Light enough to forget you are wearing them.',
    details: ['Diameter: 12 mm', 'Thickness: 2.5 mm', 'Closure: hinged click', 'Weight: approx. 1.8 g per hoop'],
    care: 'Wipe the hinge dry after wear.',
    material: 'Stainless steel', finish: 'Polished', made_in: 'India',
    image: '/img/cat-earrings.jpg',
    image_alt: 'Small polished stainless steel hinged hoop earrings on a warm off-white surface.',
    variant_type: 'none', featured: 1, new_arrival: 0,
    variants: [['One size', 16, 0]],
    claim_note: 'Sold as a pair.',
  },
  {
    slug: 'square-stud-earrings', name: 'Square Stud Earrings', category: 'earrings',
    price: 69000,
    description: 'A 6 mm flat square on a straight post. Minimal, geometric, easy to keep on.',
    details: ['Face: 6 mm × 6 mm', 'Post: 0.8 mm, stainless steel back', 'Weight: approx. 0.9 g per stud'],
    care: 'Clean the post with a dry cloth before storing.',
    material: 'Stainless steel', finish: 'Polished', made_in: 'India',
    image: '/img/cat-earrings.jpg',
    image_alt: 'Flat square stainless steel stud earrings arranged on a warm off-white surface.',
    variant_type: 'none', featured: 0, new_arrival: 1,
    variants: [['One size', 24, 0]],
    claim_note: 'Sold as a pair. Not suitable for unhealed piercings — see care guidance.',
  },
  {
    slug: 'huggie-earrings', name: 'Huggie Earrings', category: 'earrings',
    price: 89000,
    description: 'A 8 mm huggie that sits flush against the lobe. Good second or third piercing.',
    details: ['Inner diameter: 8 mm', 'Thickness: 2 mm', 'Closure: hinged click', 'Weight: approx. 1.2 g per hoop'],
    care: 'Dry the hinge after wear.',
    material: 'Stainless steel', finish: 'Polished', made_in: 'India',
    image: '/img/cat-earrings.jpg',
    image_alt: 'Tiny stainless steel huggie hoop earrings on a warm off-white surface.',
    variant_type: 'none', featured: 0, new_arrival: 0,
    variants: [['One size', 11, 0]],
    claim_note: 'Sold as a pair.',
  },
  {
    slug: 'field-cap', name: 'Field Cap', category: 'accessories',
    price: 149000,
    description: 'Six-panel cotton twill cap with a soft crown and a metal buckle strap. Part of the AESTHETICNOVA streetwear line.',
    details: ['Fabric: 100% cotton twill', 'Sizing: adjustable 54–60 cm', 'Weight: approx. 78 g', 'Care: hand wash cold, air dry'],
    care: 'Hand wash cold. Do not tumble dry.',
    material: 'Cotton twill', finish: 'Garment washed', made_in: 'India',
    image: '/img/p-cap.svg',
    image_alt: 'Line illustration of a six-panel cotton twill cap with a curved brim and buckle strap.',
    variant_type: 'none', featured: 0, new_arrival: 1,
    variants: [['One size', 13, 0]],
    claim_note: 'Accessories line item — not a metal jewellery piece.',
  },
  {
    slug: 'studio-tote', name: 'Studio Tote', category: 'accessories',
    price: 189000,
    description: 'A heavy canvas tote with an internal pocket and a long shoulder strap. Built for daily carry.',
    details: ['Fabric: 12 oz cotton canvas', 'Dimensions: 38 × 42 × 12 cm', 'Strap drop: 62 cm', 'Care: spot clean'],
    care: 'Spot clean with cold water. Air dry away from direct heat.',
    material: 'Cotton canvas', finish: 'Natural undyed', made_in: 'India',
    image: '/img/p-tote.svg',
    image_alt: 'Line illustration of a heavy canvas tote bag with two long shoulder handles.',
    variant_type: 'none', featured: 0, new_arrival: 0,
    variants: [['One size', 6, 0]],
    claim_note: 'Accessories line item — not a metal jewellery piece.',
  },
];

const TRACKERS = [
  { name: 'Session cookie (an_sid)', provider: 'AESTHETICNOVA (first party)', category: 'necessary',
    purpose: 'Keeps the cart, sign-in state and checkout session working between page loads.',
    data_collected: 'Random session identifier. No advertising identifiers.',
    cookies: 'an_sid — HttpOnly, SameSite=Lax, 30 days', retention: '30 days, or until sign-out',
    consent_category: 'Strictly necessary — consent not required, but disclosed', status: 'active',
    notes: 'Server-side store; the cookie holds only an opaque ID.' },
  { name: 'CSRF token (session-bound)', provider: 'AESTHETICNOVA (first party)', category: 'necessary',
    purpose: 'Protects forms and checkout from cross-site request forgery.',
    data_collected: 'Random token bound to the session.', cookies: 'Sent in a hidden form field, not a cookie',
    retention: 'Life of the session', consent_category: 'Strictly necessary', status: 'active',
    notes: 'No consent required; security-essential.' },
  { name: 'Cart identifier', provider: 'AESTHETICNOVA (first party)', category: 'necessary',
    purpose: 'Remembers which items are in the bag before sign-in.',
    data_collected: 'Cart ID linked to the session cookie.', cookies: 'Stored server-side; referenced by an_sid',
    retention: '90 days after last update', consent_category: 'Strictly necessary', status: 'active', notes: '' },
  { name: 'Consent preference record', provider: 'AESTHETICNOVA (first party)', category: 'necessary',
    purpose: 'Remembers your cookie choices so the banner does not reappear.',
    data_collected: 'Your category choices, timestamp, policy version, a one-way hash of IP and user agent.',
    cookies: 'an_consent — HttpOnly, SameSite=Lax, 180 days', retention: '180 days',
    consent_category: 'Strictly necessary', status: 'active',
    notes: 'Required to honour your choices.' },
  { name: 'First-party aggregate page counter', provider: 'AESTHETICNOVA (self-hosted)', category: 'analytics',
    purpose: 'Counts anonymous page visits per day so the team knows which products get attention.',
    data_collected: 'Path and a daily count. No cookie, no cross-site identifier, no fingerprinting.',
    cookies: 'None', retention: '13 months, then deleted', consent_category: 'Analytics', status: 'active',
    notes: 'Runs only after analytics consent. Server-side, no third party involved.' },
  { name: 'Google Analytics (GA4)', provider: 'Google', category: 'analytics',
    purpose: 'Third-party web analytics.', data_collected: 'Would collect identifiers and device data.',
    cookies: '_ga, _ga_*', retention: 'N/A', consent_category: 'Analytics', status: 'disabled',
    notes: 'Not deployed. No GA snippet, SDK or network call exists in this codebase.' },
  { name: 'Meta Pixel', provider: 'Meta Platforms', category: 'marketing',
    purpose: 'Ad measurement and remarketing.', data_collected: 'Would collect identifiers and event data.',
    cookies: '_fbp', retention: 'N/A', consent_category: 'Marketing', status: 'disabled',
    notes: 'Not deployed. No Meta SDK or pixel request exists in this codebase.' },
  { name: 'Google Tag Manager', provider: 'Google', category: 'marketing',
    purpose: 'Tag orchestration.', data_collected: 'None — GTM itself is not installed.',
    cookies: 'None', retention: 'N/A', consent_category: 'Marketing', status: 'disabled',
    notes: 'Deliberately omitted so no unreviewed tags can be injected.' },
  { name: 'Razorpay Checkout', provider: 'Razorpay Software Pvt. Ltd.', category: 'necessary',
    purpose: 'Payment processing when live keys are configured.',
    data_collected: 'Payment instrument data is entered on Razorpay-hosted surfaces. AESTHETICNOVA stores only the gateway payment ID and status.',
    cookies: 'Set by Razorpay on its own pages', retention: 'Per Razorpay policy; order records per retention rule',
    consent_category: 'Strictly necessary for a purchase', status: 'not_configured',
    notes: 'Integration is coded and signature-verified, but this build runs PAYMENT_MODE=demo because no live merchant account is connected.' },
  { name: 'Marketing email provider', provider: 'Not configured', category: 'marketing',
    purpose: 'Sending only opted-in marketing email.', data_collected: 'Email and opt-in timestamp, if ever enabled.',
    cookies: 'None', retention: 'Until withdrawal', consent_category: 'Marketing', status: 'not_configured',
    notes: 'No provider is connected. Marketing opt-ins are recorded but no campaign is sent.' },
  { name: 'Shipping / courier partner API', provider: 'Not configured', category: 'necessary',
    purpose: 'Creating shipments and sharing delivery address.', data_collected: 'Name, address, phone for fulfilment.',
    cookies: 'None', retention: 'Per courier partner policy', consent_category: 'Necessary for delivery', status: 'not_configured',
    notes: 'No courier API is integrated in this build. Orders are fulfilled manually.' },
  { name: 'Third-party chat widget', provider: 'Not configured', category: 'functional',
    purpose: 'Live chat support.', data_collected: 'None — no widget is installed.',
    cookies: 'None', retention: 'N/A', consent_category: 'Functional', status: 'disabled',
    notes: 'Support is handled through the on-site ticket form, which stores data on this server.' },
  { name: 'Third-party web fonts', provider: 'N/A', category: 'necessary',
    purpose: 'Typography.', data_collected: 'None — fonts are self-hosted, so no request leaves this site.',
    cookies: 'None', retention: 'N/A', consent_category: 'Strictly necessary', status: 'removed',
    notes: 'Space Grotesk and Inter (SIL Open Font License 1.1) are served from /fonts.' },
  { name: 'Embedded media players', provider: 'N/A', category: 'functional',
    purpose: 'Video and social embeds.', data_collected: 'None — no third-party embed is used.',
    cookies: 'None', retention: 'N/A', consent_category: 'Functional', status: 'removed',
    notes: 'All imagery is first-party generated brand asset; no embed iframes.' },
];

function isoNowMinusDays(days) {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function seed() {
  const tx = db.transaction(() => {
    // Categories
    const catStmt = db.prepare(`INSERT INTO categories (slug,name,tagline,image,alt,position)
      VALUES (@slug,@name,@tagline,@image,@alt,@position)
      ON CONFLICT(slug) DO UPDATE SET name=excluded.name,tagline=excluded.tagline,
        image=excluded.image,alt=excluded.alt,position=excluded.position`);
    CATEGORIES.forEach((c, i) => catStmt.run({ ...c, position: i }));
    db.prepare(`INSERT INTO categories (slug,name,tagline,image,alt,position)
      VALUES ('accessories','Accessories','Caps and carry: the streetwear line','/img/lookbook-02.jpg',
      'Cotton twill cap and canvas tote photographed for the AESTHETICNOVA accessories line.',5)
      ON CONFLICT(slug) DO NOTHING`).run();

    // Products
    const prodStmt = db.prepare(`INSERT INTO products
      (slug,name,category,price_paise,description,details,care,material,finish,made_in,image,image_alt,
       variant_type,featured,new_arrival,claim_note)
      VALUES (@slug,@name,@category,@price,@description,@details,@care,@material,@finish,@made_in,@image,
       @image_alt,@variant_type,@featured,@new_arrival,@claim_note)
      ON CONFLICT(slug) DO UPDATE SET name=excluded.name,price_paise=excluded.price_paise,description=excluded.description`);
    const variantStmt = db.prepare(`INSERT INTO variants (product_id,label,sku,stock,extra_paise,position)
      VALUES (?,?,?,?,?,?)
      ON CONFLICT(sku) DO UPDATE SET label=excluded.label,stock=excluded.stock,extra_paise=excluded.extra_paise`);
    const priceStmt = db.prepare(`INSERT INTO price_history (product_id,price_paise,changed_at,note) VALUES (?,?,?,?)`);

    PRODUCTS.forEach((p) => {
      const info = prodStmt.run({
        slug: p.slug, name: p.name, category: p.category, price: p.price,
        description: p.description, details: JSON.stringify(p.details), care: p.care,
        material: p.material, finish: p.finish, made_in: p.made_in, image: p.image,
        image_alt: p.image_alt, variant_type: p.variant_type,
        featured: p.featured, new_arrival: p.new_arrival, claim_note: p.claim_note || '',
      });
      const row = db.prepare('SELECT id FROM products WHERE slug=?').get(p.slug);
      const id = row.id;
      // only (re)insert variants when the product is fresh
      const existing = db.prepare('SELECT COUNT(*) c FROM variants WHERE product_id=?').get(id).c;
      if (existing === 0) {
        p.variants.forEach(([label, stock, extra = 0], i) => {
          const sku = 'AN-' + p.slug.split('-').map(s => s[0]).join('').toUpperCase() +
            '-' + p.slug.length + '-' + (i + 1);
          variantStmt.run(id, label, sku, stock, extra, i);
        });
        priceStmt.run(id, p.price, isoNowMinusDays(45), 'Catalogue launch price');
      }
    });

    // Trackers
    db.prepare('DELETE FROM trackers').run();
    const trStmt = db.prepare(`INSERT INTO trackers
      (name,provider,category,purpose,data_collected,cookies,retention,consent_category,status,notes)
      VALUES (@name,@provider,@category,@purpose,@data_collected,@cookies,@retention,@consent_category,@status,@notes)`);
    TRACKERS.forEach(t => trStmt.run(t));

    // Settings
    const setStmt = db.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
    const defaults = {
      shipping_paise: '7900',
      free_shipping_threshold_paise: '149900',
      cod_enabled: '0',
      cod_fee_paise: '4900',
      return_window_days: '7',
      prices_include_gst: '1',
      support_hours: '',
      grievance_officer: '',
      grievance_email: '',
      last_dark_pattern_audit: '',
    };
    Object.entries(defaults).forEach(([k, v]) => {
      const exists = db.prepare('SELECT 1 FROM settings WHERE key=?').get(k);
      if (!exists) setStmt.run(k, v);
    });
  });
  tx();
}

if (require.main === module) {
  seed();
  const n = db.prepare('SELECT COUNT(*) c FROM products').get().c;
  const v = db.prepare('SELECT COUNT(*) c FROM variants').get().c;
  console.log(`Seeded ${n} products, ${v} variants, ${CATEGORIES.length + 1} categories, ${TRACKERS.length} tracker register rows.`);
}

module.exports = { seed, CATEGORIES, PRODUCTS, TRACKERS };
