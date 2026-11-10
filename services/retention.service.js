'use strict';
/**
 * AESTHETICNOVA — Retention Service
 * Automated privacy retention policies, order delivery detail redaction,
 * and 8-year invoice anonymisation.
 */

const db = require('../src/db');
const { audit } = require('../src/util');

const RULES = [
  {
    id: 'sessions_expired',
    description: 'Expired and stale sessions (30-day TTL).',
    sql: "DELETE FROM sessions WHERE expires_at < datetime('now')",
  },
  {
    id: 'carts_abandoned',
    description: 'Bags untouched for 90 days, and their line items.',
    sql: `DELETE FROM carts WHERE updated_at < datetime('now','-90 days')
          AND id NOT IN (SELECT DISTINCT session_id FROM orders WHERE session_id IS NOT NULL
                         AND created_at > datetime('now','-90 days'))`,
  },
  {
    id: 'analytics_13_months',
    description: 'Anonymous daily visit counts older than 13 months.',
    sql: "DELETE FROM analytics_daily WHERE day < date('now','-13 months')",
  },
  {
    id: 'consent_receipts_180_days',
    description: 'Consent receipts older than 180 days (the choice itself is also carried in the cookie).',
    sql: "DELETE FROM consent_receipts WHERE received_at < datetime('now','-180 days')",
  },
  {
    id: 'security_events_90_days',
    description: 'Security events older than 90 days.',
    sql: "DELETE FROM security_events WHERE at < datetime('now','-90 days')",
  },
  {
    id: 'support_closed_24_months',
    description: 'Support tickets closed more than 24 months ago.',
    sql: `DELETE FROM support_tickets WHERE status IN ('resolved','closed')
          AND COALESCE(resolved_at, created_at) < datetime('now','-24 months')`,
  },
  {
    id: 'outbox_24_months',
    description: 'Notification outbox entries older than 24 months.',
    sql: "DELETE FROM outbox WHERE created_at < datetime('now','-24 months')",
  },
];

function redactClosedOrders({ dryRun }) {
  const pending = db.prepare(`SELECT DISTINCT email FROM dsar_requests
    WHERE status IN ('completed','partially_completed')
      AND request_type IN ('deletion','account_deletion')`).all();
  let affected = 0;
  pending.forEach(({ email }) => {
    const rows = db.prepare(`SELECT id, ref FROM orders
      WHERE email=? AND order_status IN ('delivered','cancelled','returned')
        AND (phone<>'REDACTED' OR address_line1<>'REDACTED')`).all(email);
    affected += rows.length;
    if (dryRun) return;
    rows.forEach((o) => {
      db.prepare(`UPDATE orders SET phone='REDACTED', address_line1='REDACTED',
                  address_line2=NULL, notes=NULL WHERE id=?`).run(o.id);
      db.prepare('INSERT INTO audit_log (actor,action,entity,entity_id,detail) VALUES (?,?,?,?,?)')
        .run('retention-job', 'order_delivery_redacted', 'order', o.ref,
          'Deletion request completed and order closed — delivery details erased, invoice amounts retained.');
    });
  });
  return {
    rule: 'redact_closed_orders_after_deletion',
    description: 'Delivery details on closed orders belonging to completed deletion requests.',
    affected,
  };
}

function anonymiseAgedInvoices({ dryRun }) {
  const rows = db.prepare(`SELECT id, ref FROM orders
    WHERE created_at < datetime('now','-8 years')
      AND (full_name<>'Archived customer' OR phone<>'REDACTED')`).all();
  if (!dryRun) {
    rows.forEach((o) => {
      db.prepare(`UPDATE orders SET full_name='Archived customer', email='archived@invalid.local',
                  phone='REDACTED', address_line1='REDACTED', address_line2=NULL, notes=NULL
                  WHERE id=?`).run(o.id);
      db.prepare('INSERT INTO audit_log (actor,action,entity,entity_id,detail) VALUES (?,?,?,?,?)')
        .run('retention-job', 'invoice_anonymised', 'order', o.ref,
          'Eight-year tax retention elapsed — personal identifiers removed, transaction record kept.');
    });
  }
  return {
    rule: 'invoices_8_years_then_anonymise',
    description: 'Orders older than 8 years stripped of personal identifiers (amounts retained).',
    affected: rows.length,
  };
}

function runRetention({ dryRun = false } = {}) {
  const summary = [];
  RULES.forEach((r) => {
    const countSql = r.sql.replace(/^DELETE FROM/, 'SELECT COUNT(*) c FROM');
    const before = db.prepare(countSql).get().c;
    if (!dryRun) db.prepare(r.sql).run();
    summary.push({ rule: r.id, description: r.description, affected: before });
  });
  summary.push(redactClosedOrders({ dryRun }));
  summary.push(anonymiseAgedInvoices({ dryRun }));

  if (!dryRun) {
    audit('system', 'retention_job_completed', 'retention', 'cron', {
      total_affected: summary.reduce((s, r) => s + r.affected, 0),
    });
  }
  return summary;
}

module.exports = {
  RULES,
  runRetention,
  redactClosedOrders,
  anonymiseAgedInvoices,
};
