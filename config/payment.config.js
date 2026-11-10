'use strict';
/**
 * AESTHETICNOVA — Payment Configuration
 * Central payment configuration supporting both Demo simulator and Razorpay live gateway.
 * Never exposes secrets to frontend.
 */

const env = process.env;

const bool = (v, d = false) => {
  if (v === undefined || v === null || v === '') return d;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};

const PAYMENT_MODE = (env.PAYMENT_MODE || 'demo').toLowerCase();
const RAZORPAY_KEY_ID = env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = env.RAZORPAY_WEBHOOK_SECRET || '';

const isRazorpayConfigured = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
const isLive = PAYMENT_MODE === 'razorpay' && isRazorpayConfigured;

const PAYMENT_METHODS = {
  upi: {
    id: 'upi',
    name: 'UPI',
    description: 'Instant payment via Google Pay, PhonePe, Paytm, or BHIM',
    icon: 'upi',
    enabled: true,
  },
  card: {
    id: 'card',
    name: 'Credit / Debit Card',
    description: 'Visa, MasterCard, RuPay, and American Express',
    icon: 'credit-card',
    enabled: true,
  },
  netbanking: {
    id: 'netbanking',
    name: 'Net Banking',
    description: 'All major Indian retail banks supported',
    icon: 'building-bank',
    enabled: true,
  },
  cod: {
    id: 'cod',
    name: 'Cash on Delivery (COD)',
    description: 'Pay cash upon delivery at your doorstep',
    icon: 'cash',
    enabled: bool(env.COD_ENABLED, false),
  },
};

module.exports = {
  // Mode: 'demo' (simulator) or 'razorpay'
  mode: PAYMENT_MODE,
  isLive,
  isRazorpayConfigured,

  // Server-only Private Credentials (NEVER pass to client templates or JSON APIs)
  credentials: {
    razorpayKeyId: RAZORPAY_KEY_ID,
    razorpayKeySecret: RAZORPAY_KEY_SECRET,
    razorpayWebhookSecret: RAZORPAY_WEBHOOK_SECRET,
  },

  // Cash on Delivery
  cod: {
    enabled: bool(env.COD_ENABLED, false),
    feePaise: Number(env.COD_FEE_PAISE || 4900), // ₹49
  },

  // Payment Methods Available
  methods: PAYMENT_METHODS,

  // Safe client-facing summary
  getPublicConfig() {
    return {
      mode: PAYMENT_MODE,
      isLive,
      methods: Object.values(PAYMENT_METHODS).filter(m => m.enabled).map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        icon: m.icon,
      })),
      currency: 'INR',
    };
  },
};
