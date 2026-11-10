# AESTHETICNOVA — Security & operations runbook

This is the operational half of the privacy promises. If a control is listed here as
"not configured", the storefront says so publicly on `/launch-readiness` rather than
implying it works.

---

## 1. Transport

| Control | Implementation | Status in this build |
|---|---|---|
| HTTPS | `FORCE_HTTPS` 308-redirects any non-TLS request when `NODE_ENV=production` | Configured, exercised behind the platform TLS proxy |
| HSTS | `Strict-Transport-Security: max-age=15552000; includeSubDomains` when `HSTS=1` | Emitted only over TLS |
| TLS certificates | Terminated by the hosting proxy | Not managed by this app |

## 2. Secrets

All secrets come from the environment. **No secret is present in the repository.**

| Variable | Purpose | Rotation |
|---|---|---|
| `ADMIN_PASSWORD` | Admin console credential | Rotate on staff change; 90 days otherwise |
| `PRIVACY_HASH_SALT` | HMAC salt for one-way IP/UA hashing | Rotate yearly (invalidates historical hashes, not consent validity) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payment gateway | Per provider guidance |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification | Per provider guidance |

Startup behaviour: if `ADMIN_PASSWORD` is unset, the app uses a fallback and
`/launch-readiness` reports **FAIL** with "Default fallback in use — blocker".
Rotating `ADMIN_PASSWORD` takes effect on restart; the stored hash is reconciled
automatically.

**Still to do:** move secrets into a managed secret store with an audit trail, and add
rotation automation. Reported as **NOT CONFIGURED**.

## 3. Sessions and authentication

- Server-side session store (SQLite). The cookie holds only an opaque 32-byte random ID.
- `HttpOnly`, `SameSite=Lax`, `Secure` when the request is HTTPS, 30-day idle expiry.
- Session ID rotated on every privilege change (sign-in, admin sign-in).
- Passwords hashed with scrypt (N=16384, r=8, p=1, 64-byte key, 16-byte random salt).
- Account lockout: 8 failed attempts → 15-minute lock. Rate limits: 10/IP and 8/account per 15 minutes.
- CSRF: per-session token, required on every `POST`/`PUT`/`PATCH`/`DELETE`. Verified: an unsigned POST returns 403.

## 4. Authorisation

- Order pages require either the per-order 24-byte access key or a signed-in session that owns the order (403 otherwise).
- Admin routes require a session carrying `role='admin'` bound to the configured admin user.
- Customer data in the console is limited: no card data exists; delivery addresses are shown only for open orders.

## 5. Input handling

- Every field is server-validated, length-capped and stored parameterised (no string-built SQL).
- HTML is escaped by EJS `<%= %>`; `<%- %>` is used only for `include`, JSON-LD and server-generated markup.
- Upload handling (`multer`) is installed but **not wired to any route** — no customer uploads are accepted in this build.
- Request bodies capped at 64 KB.

## 6. Rate limits

| Surface | Limit |
|---|---|
| Sign-in | 10/IP + 8/account per 15 min |
| Registration | 6/IP per 15 min |
| Checkout | 12/IP per 10 min |
| Support/grievance | 6/IP per hour |
| Privacy requests | 5/IP per hour |
| Reviews | 5/user per hour |
| Consent changes | 40/session per minute |

In-memory fixed-window counters. **For multi-node deployment, move to a shared store.**
Single-node is assumed here and stated in the code.

## 7. Logging and monitoring

- Application audit log: every privileged action with actor, entity and timestamp (`/admin/audit-log`).
- Security events: failed logins, lockouts, rate-limit hits, server errors — stored with hashed identifiers only.
- Request logging records neither IP addresses, query strings, cookies nor bodies.
- **No alerting, no log shipping, no uptime monitoring.** Reported **NOT CONFIGURED**. Minimum acceptable: ship `security_events` and 5xx logs off-host with an alert on spikes.

## 8. Data retention job

`src/retention.js` implements nine rules that map one-to-one to Privacy Policy §9:

| Rule | Period |
|---|---|
| Expired sessions | 30 days |
| Abandoned bags | 90 days |
| Anonymous visit counts | 13 months |
| Consent receipts | 180 days |
| Security events | 90 days |
| Closed support tickets | 24 months |
| Notification outbox | 24 months |
| Redaction after a completed deletion | on order closure |
| Invoice anonymisation | 8 years, then personal identifiers stripped |

Run manually: `node src/retention.js --dry-run` then `node src/retention.js`.
Operable from `/admin/retention`.

**Schedule it** — nothing in this build runs it automatically:

```cron
# /etc/cron.d/aestheticnova-retention
15 2 * * *  app  cd /srv/aestheticnova && node src/retention.js >> /var/log/an-retention.log 2>&1
```

Until that timer exists, the report marks retention scheduling **NOT CONFIGURED**.

## 9. Backup and restore

**Not configured.** A SQLite `VACUUM INTO` snapshot plus off-host copy is the minimum:

```bash
sqlite3 data/aestheticnova.db "VACUUM INTO '/backup/an-$(date +%F).db'"
```

A restore must be *tested*, not assumed. Reported **NOT CONFIGURED** until a restore drill is recorded.

## 10. Incident response (documented, never rehearsed)

1. **Contain** — rotate `ADMIN_PASSWORD`, `PRIVACY_HASH_SALT` and gateway keys; revoke all sessions (`DELETE FROM sessions`).
2. **Assess** — determine categories and approximate number of data principals affected, from the audit log and orders table.
3. **Notify** — where the law requires it, notify the Data Protection Board of India and affected individuals without delay. The DPDP breach-notification obligation commences 13 May 2027; the practical target here is disclosure within 72 hours of confirmation.
4. **Remediate** — fix the cause, then re-run `npm run audit`.
5. **Record** — keep an incident note with timeline, scope, decisions and remediation.

This runbook has **never been rehearsed**. Until a tabletop exercise is recorded, treat incident readiness as unproven.

## 11. Deployment checklist

- [ ] `NODE_ENV=production`, `FORCE_HTTPS=1`, `HSTS=1`
- [ ] `ADMIN_PASSWORD` set to a unique 20+ character value
- [ ] `PRIVACY_HASH_SALT` set to a random value and stored in the secret manager
- [ ] `BIZ_*` identity values complete and verified against the GST certificate
- [ ] Payment mode decided: `demo` (no real money) or `razorpay` with live keys and webhook secret
- [ ] `EMAIL_MODE` configured, or the outbox process staffed manually
- [ ] Retention job scheduled and one run recorded
- [ ] Backup schedule created **and a restore tested**
- [ ] Off-host log shipping and alerting live
- [ ] `npm run audit` green, then `/launch-readiness` re-read
- [ ] Legal review of the four policy pages recorded
