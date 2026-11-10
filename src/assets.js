'use strict';
/**
 * Asset licensing record (Requirement 17).
 * Every creative asset in /public/img and /public/fonts must appear here with
 * its provenance. The a11y/asset test suite cross-checks files against the
 * register so an unregistered asset fails the build.
 */
module.exports = [
  {
    path: '/img/hero-editorial.jpg', type: 'Photography',
    description: 'Homepage hero — two adult models in minimal streetwear wearing silver-tone steel jewellery.',
    source: 'Generated for AESTHETICNOVA via Arena image generation (text-to-image)',
    licence: 'Commissioned work — full usage rights assigned to AESTHETICNOVA for this build',
    rights: 'Web + social, perpetual, worldwide', attribution: 'Not required',
    notes: 'Stylised editorial image. Not a photograph of a real customer or a real purchase.',
  },
  {
    path: '/img/cat-rings.jpg', type: 'Product photography',
    description: 'Category image — rings.', source: 'Generated for AESTHETICNOVA (text-to-image)',
    licence: 'Commissioned work — full usage rights assigned to AESTHETICNOVA for this build',
    rights: 'Web + social, perpetual, worldwide', attribution: 'Not required', notes: '',
  },
  {
    path: '/img/cat-chains.jpg', type: 'Product photography',
    description: 'Category image — chains.', source: 'Generated for AESTHETICNOVA (text-to-image)',
    licence: 'Commissioned work — full usage rights assigned to AESTHETICNOVA for this build',
    rights: 'Web + social, perpetual, worldwide', attribution: 'Not required', notes: '',
  },
  {
    path: '/img/cat-pendants.jpg', type: 'Product photography',
    description: 'Category image — pendants.', source: 'Generated for AESTHETICNOVA (text-to-image)',
    licence: 'Commissioned work — full usage rights assigned to AESTHETICNOVA for this build',
    rights: 'Web + social, perpetual, worldwide', attribution: 'Not required', notes: '',
  },
  {
    path: '/img/cat-bracelets.jpg', type: 'Product photography',
    description: 'Category image — bracelets.', source: 'Generated for AESTHETICNOVA (text-to-image)',
    licence: 'Commissioned work — full usage rights assigned to AESTHETICNOVA for this build',
    rights: 'Web + social, perpetual, worldwide', attribution: 'Not required', notes: '',
  },
  {
    path: '/img/cat-earrings.jpg', type: 'Product photography',
    description: 'Category image — earrings.', source: 'Generated for AESTHETICNOVA (text-to-image)',
    licence: 'Commissioned work — full usage rights assigned to AESTHETICNOVA for this build',
    rights: 'Web + social, perpetual, worldwide', attribution: 'Not required', notes: '',
  },
  {
    path: '/img/lookbook-01.jpg', type: 'Editorial photography',
    description: 'Lookbook — full-length model in minimal blazer with chain and signet ring.',
    source: 'Generated for AESTHETICNOVA (text-to-image)',
    licence: 'Commissioned work — full usage rights assigned to AESTHETICNOVA for this build',
    rights: 'Web + social, perpetual, worldwide', attribution: 'Not required', notes: '',
  },
  {
    path: '/img/lookbook-02.jpg', type: 'Editorial photography',
    description: 'Lookbook — wrist and hand detail with chain bracelet and rings.',
    source: 'Generated for AESTHETICNOVA (text-to-image)',
    licence: 'Commissioned work — full usage rights assigned to AESTHETICNOVA for this build',
    rights: 'Web + social, perpetual, worldwide', attribution: 'Not required', notes: '',
  },
  {
    path: '/img/p-signet.jpg', type: 'Product photography',
    description: 'Monolith Signet Ring.', source: 'Generated for AESTHETICNOVA (text-to-image)',
    licence: 'Commissioned work — full usage rights assigned to AESTHETICNOVA for this build',
    rights: 'Web + social, perpetual, worldwide', attribution: 'Not required',
    notes: 'Illustrative product render — replace with original photography of the shipped item before launch.',
  },
  {
    path: '/img/p-band.jpg', type: 'Product photography',
    description: 'Line Band rings.', source: 'Generated for AESTHETICNOVA (text-to-image)',
    licence: 'Commissioned work — full usage rights assigned to AESTHETICNOVA for this build',
    rights: 'Web + social, perpetual, worldwide', attribution: 'Not required',
    notes: 'Illustrative product render — replace with original photography of the shipped item before launch.',
  },
  {
    path: '/img/p-cap.svg', type: 'Original illustration',
    description: 'Field Cap — line illustration used because product photography for this item is pending.',
    source: 'Drawn in-house for AESTHETICNOVA (hand-authored SVG)',
    licence: 'AESTHETICNOVA original work — full rights', rights: 'Unrestricted use by AESTHETICNOVA',
    attribution: 'Not required',
    notes: 'Labelled as an illustration on the image itself and in the alt text. Must be replaced with real photography before launch.',
  },
  {
    path: '/img/p-tote.svg', type: 'Original illustration',
    description: 'Studio Tote — line illustration used because product photography for this item is pending.',
    source: 'Drawn in-house for AESTHETICNOVA (hand-authored SVG)',
    licence: 'AESTHETICNOVA original work — full rights', rights: 'Unrestricted use by AESTHETICNOVA',
    attribution: 'Not required',
    notes: 'Labelled as an illustration on the image itself and in the alt text. Must be replaced with real photography before launch.',
  },
  {
    path: '/fonts/space-grotesk.woff2', type: 'Typeface',
    description: 'Space Grotesk (display).', source: 'Google Fonts / Florian Karsten',
    licence: 'SIL Open Font License, Version 1.1', rights: 'Commercial web embedding permitted',
    attribution: 'OFL requires the licence to accompany the font files',
    notes: 'Self-hosted at /fonts; no request to Google servers at runtime.',
  },
  {
    path: '/fonts/inter.woff2', type: 'Typeface',
    description: 'Inter (body).', source: 'Google Fonts / Rasmus Andersson',
    licence: 'SIL Open Font License, Version 1.1', rights: 'Commercial web embedding permitted',
    attribution: 'OFL requires the licence to accompany the font files',
    notes: 'Self-hosted at /fonts; no request to Google servers at runtime.',
  },
  {
    path: '/fonts/LICENSE-space-grotesk.txt', type: 'Licence text',
    description: 'Full SIL Open Font License 1.1 text and copyright line for Space Grotesk.',
    source: 'The Space Grotesk Project Authors', licence: 'SIL Open Font License, Version 1.1',
    rights: 'Redistribution required by the OFL', attribution: 'Not required',
    notes: 'Served from /fonts so the licence travels with the font file, as OFL §2 requires.',
  },
  {
    path: '/fonts/LICENSE-inter.txt', type: 'Licence text',
    description: 'Full SIL Open Font License 1.1 text and copyright line for Inter.',
    source: 'The Inter Project Authors', licence: 'SIL Open Font License, Version 1.1',
    rights: 'Redistribution required by the OFL', attribution: 'Not required',
    notes: 'Served from /fonts so the licence travels with the font file, as OFL §2 requires.',
  },
];
