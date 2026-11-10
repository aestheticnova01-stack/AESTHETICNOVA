'use strict';
/**
 * AESTHETICNOVA — Product Service
 * Business logic for product catalogue, categories, variants, inventory, and wishlists.
 */

const db = require('../src/db');
const { inr } = require('../src/util');

/**
 * Fetch all categories ordered by position.
 */
function getCategories() {
  return db.prepare('SELECT * FROM categories ORDER BY position').all();
}

/**
 * Fetch a single category by its slug.
 */
function getCategoryBySlug(slug) {
  return db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
}

/**
 * Compute review statistics for a product.
 */
function reviewStats(productId) {
  const row = db.prepare(`SELECT COUNT(*) n, AVG(rating) avg FROM reviews
                          WHERE product_id=? AND status='approved'`).get(productId);
  return {
    count: row && row.n ? row.n : 0,
    average: row && row.n ? Number(row.avg) : null,
  };
}

/**
 * Generate formatted product card objects for views.
 */
function productCards(where = '1=1', params = [], order = 'p.featured DESC, p.created_at DESC', limit = 8) {
  const rows = db.prepare(`SELECT p.*, (SELECT COALESCE(SUM(stock),0) FROM variants v WHERE v.product_id=p.id) stock
                           FROM products p WHERE p.active=1 AND ${where}
                           ORDER BY ${order} LIMIT ${Number(limit)}`).all(...params);
  return rows.map((r) => ({
    ...r,
    priceLabel: inr(r.price_paise),
    stock: Number(r.stock),
    review: reviewStats(r.id),
  }));
}

/**
 * Get product by slug along with total stock and formatted price.
 */
function getProductBySlug(slug) {
  const product = db.prepare(`SELECT p.*, (SELECT COALESCE(SUM(stock),0) FROM variants v WHERE v.product_id=p.id) stock
                              FROM products p WHERE p.slug = ? AND p.active = 1`).get(slug);
  if (!product) return null;
  return {
    ...product,
    priceLabel: inr(product.price_paise),
    stock: Number(product.stock),
    review: reviewStats(product.id),
  };
}

/**
 * Get product by numeric ID.
 */
function getProductById(id) {
  const product = db.prepare(`SELECT p.*, (SELECT COALESCE(SUM(stock),0) FROM variants v WHERE v.product_id=p.id) stock
                              FROM products p WHERE p.id = ?`).get(id);
  if (!product) return null;
  return {
    ...product,
    priceLabel: inr(product.price_paise),
    stock: Number(product.stock),
    review: reviewStats(product.id),
  };
}

/**
 * Get all variants for a product.
 */
function getProductVariants(productId) {
  return db.prepare('SELECT * FROM variants WHERE product_id = ? ORDER BY position, id').all(productId);
}

/**
 * Get a specific variant by ID.
 */
function getVariantById(variantId) {
  return db.prepare('SELECT * FROM variants WHERE id = ?').get(variantId);
}

/**
 * Advanced search & filtering for shop catalogue.
 */
function searchProducts({ category, q, availability, sort = 'featured', limit = 100 }) {
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
  } else if (availability === 'out') {
    where.push('(SELECT COALESCE(SUM(stock),0) FROM variants v WHERE v.product_id=p.id) = 0');
  }

  let order = 'p.featured DESC, p.id ASC';
  if (sort === 'price-asc') order = 'p.price_paise ASC';
  else if (sort === 'price-desc') order = 'p.price_paise DESC';
  else if (sort === 'new') order = 'p.created_at DESC';

  return productCards(where.join(' AND '), params, order, limit);
}

/**
 * Get all products for admin inventory management.
 */
function getAllProductsAdmin() {
  const products = db.prepare(`
    SELECT p.*, (SELECT COALESCE(SUM(stock),0) FROM variants v WHERE v.product_id=p.id) stock
    FROM products p ORDER BY p.id ASC
  `).all();
  return products.map(p => ({
    ...p,
    variants: getProductVariants(p.id),
  }));
}

/**
 * Update stock for a specific variant.
 */
function updateVariantStock(variantId, newStock) {
  db.prepare('UPDATE variants SET stock = ? WHERE id = ?').run(Number(newStock), variantId);
}

/**
 * Wishlist helpers.
 */
function getWishlistProductIds(userId) {
  if (!userId) return [];
  return db.prepare('SELECT product_id FROM wishlist WHERE user_id=?').all(userId).map(r => r.product_id);
}

function toggleWishlist(userId, productId) {
  const existing = db.prepare('SELECT 1 FROM wishlist WHERE user_id=? AND product_id=?').get(userId, productId);
  if (existing) {
    db.prepare('DELETE FROM wishlist WHERE user_id=? AND product_id=?').run(userId, productId);
    return false; // removed
  } else {
    db.prepare('INSERT INTO wishlist (user_id,product_id) VALUES (?,?)').run(userId, productId);
    return true; // saved
  }
}

function getWishlistProducts(userId) {
  if (!userId) return [];
  const rows = db.prepare(`
    SELECT p.*, (SELECT COALESCE(SUM(stock),0) FROM variants v WHERE v.product_id=p.id) stock
    FROM wishlist w
    JOIN products p ON p.id = w.product_id
    WHERE w.user_id = ? AND p.active = 1
    ORDER BY w.added_at DESC
  `).all(userId);
  return rows.map(r => ({
    ...r,
    priceLabel: inr(r.price_paise),
    stock: Number(r.stock),
    review: reviewStats(r.id),
  }));
}

module.exports = {
  getCategories,
  getCategoryBySlug,
  reviewStats,
  productCards,
  getProductBySlug,
  getProductById,
  getProductVariants,
  getVariantById,
  searchProducts,
  getAllProductsAdmin,
  updateVariantStock,
  getWishlistProductIds,
  toggleWishlist,
  getWishlistProducts,
};
