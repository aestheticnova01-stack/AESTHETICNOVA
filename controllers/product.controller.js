'use strict';
/**
 * AESTHETICNOVA — Product Controller
 * Handles shop catalog, filtering, product detail view, and customer wishlists.
 */

const db = require('../src/db');
const config = require('../config');
const { inr, setting } = require('../src/util');
const {
  getCategories,
  productCards,
  reviewStats,
  toggleWishlist: toggleWishlistService,
} = require('../services/product.service');

function renderShop(req, res) {
  const { category, sort = 'featured', q = '', price = 'all', availability = 'all' } = req.query;
  res.locals.currentNav = 'shop';

  const where = ['p.active=1'];
  const params = [];

  if (category) {
    where.push('p.category = ?');
    params.push(String(category));
  }

  if (q) {
    where.push('(p.name LIKE ? OR p.description LIKE ? OR p.category LIKE ?)');
    const like = `%${String(q).slice(0, 80)}%`;
    params.push(like, like, like);
  }

  if (availability === 'in') {
    where.push('(SELECT COALESCE(SUM(stock),0) FROM variants v WHERE v.product_id=p.id) > 0');
  }
  if (availability === 'out') {
    where.push('(SELECT COALESCE(SUM(stock),0) FROM variants v WHERE v.product_id=p.id) = 0');
  }

  const sortMap = {
    featured: 'p.featured DESC, p.id ASC',
    new: 'p.new_arrival DESC, p.created_at DESC',
    'price-asc': 'p.price_paise ASC',
    'price-desc': 'p.price_paise DESC',
    name: 'p.name ASC',
  };
  const order = sortMap[sort] || sortMap.featured;

  let products = db.prepare(`SELECT p.* FROM products p WHERE ${where.join(' AND ')} ORDER BY ${order}`).all(...params);
  if (price === 'under1000') products = products.filter((p) => p.price_paise < 100000);
  if (price === '1000-2000') products = products.filter((p) => p.price_paise >= 100000 && p.price_paise < 200000);
  if (price === 'over2000') products = products.filter((p) => p.price_paise >= 200000);

  const cards = products.map((r) => {
    const stock = db.prepare('SELECT COALESCE(SUM(stock),0) s FROM variants WHERE product_id=?').get(r.id).s;
    return { ...r, stock: Number(stock), priceLabel: inr(r.price_paise), review: reviewStats(r.id) };
  });

  const categories = getCategories();

  res.render('shop/index', {
    pageTitle: `${q ? `Search “${String(q).slice(0, 60)}” — ` : category ? `${category[0].toUpperCase()}${category.slice(1)} — ` : 'Shop all — '}AESTHETICNOVA`,
    metaDescription: 'Browse every AESTHETICNOVA piece: stainless steel rings, chains, pendants, bracelets, earrings and streetwear accessories. Real prices, real stock.',
    currentNav: 'shop',
    categories,
    products: cards,
    filters: { category: category || '', sort, q: String(q || ''), price, availability },
    canonicalPath: 'shop',
    rankNote: 'Products are ranked by our own merchandising order (featured pieces first). No paid placements, and no seller can boost a product by paying us.',
  });
}

function renderProductDetail(req, res, next) {
  const slug = req.params.slug;
  const product = db.prepare('SELECT * FROM products WHERE slug=? AND active=1').get(slug);
  if (!product) return next();

  const variants = db.prepare('SELECT * FROM variants WHERE product_id=? ORDER BY position').all(product.id);
  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  const firstAvailableIndex = Math.max(0, variants.findIndex((v) => v.stock > 0));
  const maxQty = variants.length ? Math.max(1, ...variants.map((v) => Math.min(v.stock, 5))) : 1;

  const summary = reviewStats(product.id);
  const reviews = db.prepare(`SELECT id, author_name, rating, title, body, verified_purchase, created_at
                              FROM reviews WHERE product_id=? AND status='approved'
                              ORDER BY created_at DESC LIMIT 30`).all(product.id);

  const purchased = req.user ? db.prepare(`SELECT COUNT(*) c FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id=? AND oi.product_id=? AND o.order_status IN ('delivered','shipped','processing')`)
    .get(req.user.id, product.id).c : 0;

  const alreadyReviewed = req.user ? db.prepare('SELECT COUNT(*) c FROM reviews WHERE product_id=? AND user_id=?')
    .get(product.id, req.user.id).c > 0 : false;

  const related = productCards('p.category=? AND p.id<>?', [product.category, product.id], 'p.featured DESC, p.id ASC', 4);

  const freeShippingThreshold = Number(setting('free_shipping_threshold_paise', config.FREE_SHIPPING_PAISE));
  const freeShipping = freeShippingThreshold === 0 || product.price_paise >= freeShippingThreshold;

  res.render('shop/product', {
    pageTitle: `${product.name} — ${inr(product.price_paise)} | AESTHETICNOVA`,
    metaDescription: `${product.name}: ${product.description.slice(0, 140)}`,
    canonicalPath: `product/${product.slug}`,
    product,
    variants,
    totalStock,
    firstAvailableIndex,
    maxQty,
    reviewSummary: summary,
    reviews,
    hasPurchased: purchased > 0,
    userReviewed: alreadyReviewed,
    wishlisted: res.locals.wishlistIds.includes(product.id),
    related,
    freeShipping,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      material: product.material,
      image: product.image,
      brand: { '@type': 'Brand', name: 'AESTHETICNOVA' },
      countryOfOrigin: product.made_in,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: (product.price_paise / 100).toFixed(2),
        availability: totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
      ...(summary.count > 0 ? {
        aggregateRating: {
          '@type': 'AggregateRating', ratingValue: summary.average.toFixed(1), reviewCount: summary.count,
        },
      } : {}),
    },
  });
}

function renderWishlist(req, res) {
  if (!req.user) return res.redirect('/account/login?next=/account/wishlist');
  const ids = res.locals.wishlistIds;
  const products = ids.length
    ? productCards(`p.id IN (${ids.map(() => '?').join(',')})`, ids)
    : [];

  res.render('account/wishlist', {
    pageTitle: 'Your wishlist — AESTHETICNOVA',
    metaDescription: 'Pieces you have saved.',
    canonicalPath: 'account/wishlist',
    products,
  });
}

function toggleWishlist(req, res) {
  if (!req.user) {
    if (req.accepts(['html', 'json']) === 'json') {
      return res.status(401).json({ ok: false, error: 'Sign in to save pieces to your wishlist.', signin: '/account/login' });
    }
    return res.redirect('/account/login?next=' + encodeURIComponent(req.headers.referer || '/shop'));
  }

  const productId = Number(req.body.product_id);
  const saved = toggleWishlistService(req.user.id, productId);

  if (req.accepts(['html', 'json']) === 'json') {
    return res.json({ ok: true, saved });
  }
  res.redirect(req.headers.referer || '/shop');
}

module.exports = {
  renderShop,
  renderProductDetail,
  renderWishlist,
  toggleWishlist,
};
