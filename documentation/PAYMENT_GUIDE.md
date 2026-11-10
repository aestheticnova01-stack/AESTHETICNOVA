# AESTHETICNOVA — Payment Gateway & Integration Guide

## 1. Architectural Principles
AESTHETICNOVA is designed with privacy and financial compliance in mind:
1. **Zero Cardholder Data Storage**: Credit and debit card numbers, CVVs, expiry dates, and net banking credentials are **NEVER** captured, processed, or stored on this server.
2. **Honest Modes**:
   - `demo` mode is an explicit test simulator. It informs the customer that no money is moving.
   - `razorpay` mode connects to the official Razorpay Orders API and verifies cryptographic signatures before confirming any order.
3. **No Hidden Fees**: The exact final amount displayed on the product page and bag matches the amount sent to the payment gateway to the exact paise.

---

## 2. Payment Modes

### 2.1 Demo Simulator (`PAYMENT_MODE=demo`)
- Default mode for development, testing, and local demos.
- Displays a dedicated test payment page where you can simulate a successful or failed payment.
- Marks orders as `paid` and assigns an invoice number (`INV-XXXXXX`) upon successful simulation.
- Automatically disabled in production if live Razorpay keys are provided.

### 2.2 Live Gateway (`PAYMENT_MODE=razorpay`)
- Communicates server-to-server with Razorpay's API: `https://api.razorpay.com/v1/orders`.
- Uses HTTP Basic Authentication with `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- Validates HMAC-SHA256 signature on payment completion:
  ```javascript
  const expected = crypto
    .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  ```
- Constant-time verification prevents timing attacks.

---

## 3. How to Switch to Live Payments

### Step 1: Obtain Razorpay Merchant Credentials
1. Sign up on [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Complete KYC and merchant activation.
3. Generate **Key ID** and **Key Secret** in Settings -> API Keys.
4. Set a Webhook Secret in Settings -> Webhooks.

### Step 2: Configure Environment Variables
In your production environment or `.env` file:
```env
PAYMENT_MODE=razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_production_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 3: Enable or Disable Cash on Delivery (COD)
In `.env` or `/admin/settings`:
```env
COD_ENABLED=true
COD_FEE_PAISE=4900
```
- When `COD_ENABLED=true`, Cash on Delivery is presented as an option at checkout with an itemized ₹49 handling fee.
- When `COD_ENABLED=false`, orders require online prepayment via UPI, Card, or Net Banking.

---

## 4. Testing Checklist Before Production
- [ ] Verify SSL certificate is active (HTTPS).
- [ ] Confirm Razorpay test mode orders transition cleanly to paid status.
- [ ] Test webhook delivery if using background reconciliation.
- [ ] Confirm order confirmation emails are delivered to test accounts.
- [ ] Verify that admin credentials and privacy hash salt have been updated.
