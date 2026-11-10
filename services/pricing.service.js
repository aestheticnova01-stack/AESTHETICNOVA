'use strict';
/**
 * AESTHETICNOVA — Pricing Engine Service
 * Generates identical, itemised, GST-inclusive numbers across all touchpoints.
 */

const config = require('../config');
const { setting, gstComponent } = require('../src/util');

function pricingRules() {
  return {
    shippingPaise: Number(setting('shipping_paise', config.SHIPPING_PAISE)),
    freeShippingThreshold: Number(setting('free_shipping_threshold_paise', config.FREE_SHIPPING_PAISE)),
    codEnabled: setting('cod_enabled', config.COD_ENABLED ? '1' : '0') === '1',
    codFeePaise: Number(setting('cod_fee_paise', config.COD_FEE_PAISE)),
    gstRate: config.GST_RATE,
    pricesIncludeGst: setting('prices_include_gst', '1') === '1',
  };
}

/**
 * @param {Array<{unitPrice:number, qty:number}>} lines
 * @param {{paymentMethod?:string, discountPaise?:number}} opts
 */
function computeTotals(lines, opts = {}) {
  const rules = pricingRules();
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const discount = Math.max(0, Math.min(opts.discountPaise || 0, subtotal));
  const afterDiscount = subtotal - discount;

  const qualifiesFree = afterDiscount >= rules.freeShippingThreshold;
  const shipping = subtotal === 0 ? 0 : (qualifiesFree ? 0 : rules.shippingPaise);
  const codLine = opts.paymentMethod === 'cod' && rules.codEnabled ? rules.codFeePaise : 0;

  const total = afterDiscount + shipping + codLine;
  const gst = gstComponent(total, rules.gstRate);

  return {
    currency: 'INR',
    subtotalPaise: subtotal,
    discountPaise: discount,
    shippingPaise: shipping,
    codFeePaise: codLine,
    totalPaise: total,
    gstPaise: gst,
    gstRate: rules.gstRate,
    pricesIncludeGst: rules.pricesIncludeGst,
    freeShippingThresholdPaise: rules.freeShippingThreshold,
    freeShippingRemainingPaise: qualifiesFree ? 0 : Math.max(0, rules.freeShippingThreshold - afterDiscount),
    qualifyFreeShipping: qualifiesFree,
    codEnabled: rules.codEnabled,
    lines: [
      { label: 'Subtotal', paise: subtotal },
      ...(discount ? [{ label: 'Discount', paise: -discount, muted: true }] : []),
      { label: shipping === 0 ? 'Shipping — free' : 'Shipping', paise: shipping },
      ...(codLine ? [{ label: 'Cash on delivery fee', paise: codLine }] : []),
      { label: `Final payable (includes GST ${Math.round(rules.gstRate * 100)}% of ${''})`.replace(' of ', ''), paise: total, strong: true },
    ],
    taxNote: `Listed prices include GST at ${Math.round(rules.gstRate * 100)}%. GST component: ${(gst / 100).toFixed(2)} on this order.`,
  };
}

module.exports = {
  pricingRules,
  computeTotals,
  gstComponent,
};
