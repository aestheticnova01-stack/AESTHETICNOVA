'use strict';
/**
 * AESTHETICNOVA — Site Configuration
 * Central configuration for website identity, branding, contact info,
 * commerce policies, and shipping rules.
 */

const env = process.env;

module.exports = {
  // Brand & Website Identity
  name: 'AESTHETICNOVA',
  tagline: 'Stainless steel jewellery, made for everyday wear',
  description: 'Stainless steel rings, chains, pendants, bracelets and earrings from AESTHETICNOVA. Everyday essentials. Unordinary details.',
  logo: {
    text: 'AESTHETICNOVA',
    short: 'A',
    themeColor: '#F7F7F5',
  },

  // Brand Palette & Visual Identity
  colors: {
    ink: '#111111',
    paper: '#FFFFFF',
    background: '#F7F7F5',
    subtle: '#EAEAE6',
    border: '#E0E0DC',
    muted: '#595959',
    accent: '#0B5CD5',
    focus: '#0B5CD5',
    success: '#1D5B33',
    error: '#A32020',
  },

  // Currency & Locale
  currency: {
    code: 'INR',
    symbol: '₹',
    locale: 'en-IN',
  },

  // Business & Contact Information (Read from environment with transparent fallback detection)
  business: {
    tradingName: env.BIZ_TRADING_NAME || 'AESTHETICNOVA',
    legalEntity: env.BIZ_LEGAL_ENTITY || '',
    address: env.BIZ_ADDRESS || '',
    email: env.BIZ_SUPPORT_EMAIL || 'support@aestheticnova.local',
    phone: env.BIZ_SUPPORT_PHONE || '+91 98765 43210',
    gstin: env.BIZ_GSTIN || '',
    grievanceOfficer: env.BIZ_GRIEVANCE_OFFICER || '',
    grievanceEmail: env.BIZ_GRIEVANCE_EMAIL || '',
    supportHours: env.BIZ_SUPPORT_HOURS || 'Mon–Sat, 10:00 AM – 6:00 PM IST',
    countryOfOrigin: env.BIZ_COUNTRY_OF_ORIGIN || 'India',
    sellerName: env.BIZ_SELLER_NAME || 'AESTHETICNOVA Lifestyle Pvt Ltd',
  },

  // Shipping & Tax Configuration
  shipping: {
    freeShippingThresholdPaise: Number(env.FREE_SHIPPING_PAISE || 149900), // ₹1,499
    standardShippingFeePaise: Number(env.SHIPPING_PAISE || 7900),          // ₹79
    defaultCourier: 'Bluedart / Delhivery Express',
    estimatedDays: '3–5 business days',
  },

  tax: {
    gstRate: 0.18, // 18% GST included in retail price
    includedInPrice: true,
  },

  // Customer Policies
  policies: {
    returnWindowDays: Number(env.RETURN_WINDOW_DAYS || 7),
    policyVersion: '2026-11-03',
    cookiePolicyVersion: '2026-11-03',
    termsVersion: '2026-11-03',
  },

  // Navigation Links
  navigation: [
    { label: 'Shop all', url: '/shop', id: 'shop' },
    { label: 'Rings', url: '/shop?category=rings', id: 'rings' },
    { label: 'Chains', url: '/shop?category=chains', id: 'chains' },
    { label: 'Pendants', url: '/shop?category=pendants', id: 'pendants' },
    { label: 'Bracelets', url: '/shop?category=bracelets', id: 'bracelets' },
    { label: 'Earrings', url: '/shop?category=earrings', id: 'earrings' },
    { label: 'Accessories', url: '/shop?category=accessories', id: 'accessories' },
  ],
};
