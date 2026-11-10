'use strict';
/**
 * AESTHETICNOVA — Central Configuration Aggregator
 * Unifies site, payment, database, and environment configuration.
 * Fully backwards-compatible with all existing legacy configuration properties.
 */

const fs = require('fs');
const path = require('path');
const siteConfig = require('./site.config');
const paymentConfig = require('./payment.config');
const databaseConfig = require('./database.config');

// Load .env if present
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  try {
    const content = fs.readFileSync(envFile, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.slice(0, idx).trim();
        let v = trimmed.slice(idx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (process.env[k] === undefined) {
          process.env[k] = v;
        }
      }
    }
  } catch { /* ignore */ }
}

const bool = (v, d = false) => {
  if (v === undefined || v === null || v === '') return d;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};

const env = process.env;
const NODE_ENV = env.NODE_ENV || 'development';
const PORT = Number(env.PORT || 3000);

const config = {
  // Modular configs
  site: siteConfig,
  payment: paymentConfig,
  database: databaseConfig,

  // Top-level properties (retained for backward compatibility)
  NODE_ENV,
  PORT,
  DATA_DIR: databaseConfig.dataDir,
  DB_FILE: databaseConfig.dbFile,

  SESSION_COOKIE: 'an_sid',
  CONSENT_COOKIE: 'an_consent',
  SESSION_TTL_DAYS: 30,

  FORCE_HTTPS: bool(env.FORCE_HTTPS, NODE_ENV === 'production'),
  HSTS: bool(env.HSTS, NODE_ENV === 'production'),
  TRUST_PROXY: Number(env.TRUST_PROXY || 1),

  PAYMENT_MODE: paymentConfig.mode,
  RAZORPAY_KEY_ID: paymentConfig.credentials.razorpayKeyId,
  RAZORPAY_KEY_SECRET: paymentConfig.credentials.razorpayKeySecret,
  RAZORPAY_WEBHOOK_SECRET: paymentConfig.credentials.razorpayWebhookSecret,

  COD_ENABLED: paymentConfig.cod.enabled,
  COD_FEE_PAISE: paymentConfig.cod.feePaise,

  EMAIL_MODE: (env.EMAIL_MODE || 'none').toLowerCase(),
  SUPPORT_EMAIL_PROVIDER_URL: env.SUPPORT_EMAIL_PROVIDER_URL || '',
  SMS_MODE: (env.SMS_MODE || 'none').toLowerCase(),
  WHATSAPP_MODE: (env.WHATSAPP_MODE || 'none').toLowerCase(),

  ADMIN_EMAIL: env.ADMIN_EMAIL || 'admin@localhost',
  ADMIN_PASSWORD: env.ADMIN_PASSWORD || 'CHANGE-ME-BEFORE-LAUNCH',
  ADMIN_PASSWORD_IS_DEFAULT: !env.ADMIN_PASSWORD,

  BIZ: siteConfig.business,

  FREE_SHIPPING_PAISE: siteConfig.shipping.freeShippingThresholdPaise,
  SHIPPING_PAISE: siteConfig.shipping.standardShippingFeePaise,
  GST_RATE: siteConfig.tax.gstRate,
  RETURN_WINDOW_DAYS: siteConfig.policies.returnWindowDays,
  POLICY_VERSION: siteConfig.policies.policyVersion,
  COOKIE_POLICY_VERSION: siteConfig.policies.cookiePolicyVersion,
  TERMS_VERSION: siteConfig.policies.termsVersion,

  ANALYTICS_SELF_HOSTED: true,
  THIRD_PARTY_ANALYTICS: false,
  REVIEWS_VERIFIED_PURCHASE_ONLY: true,
};

config.paymentsLive = paymentConfig.isLive;
config.businessConfigured = Boolean(
  config.BIZ.legalEntity && config.BIZ.address && config.BIZ.email && config.BIZ.phone
);

module.exports = config;
