# Payment System Setup
## Project: Cleaning Services Website
### AI Agent: Cursor
### Version: 1.0

---

# Goal

Convert the current website from **"Pay After Contact"** to a complete **online payment system**.

The payment experience must be identical to modern service platforms.

---

# Payment Provider

Use **Paymob** as the primary payment gateway.

Requirements:

- Apple Pay
- Visa
- Mastercard
- Mada (if available)
- Google Pay (if enabled)
- Debit/Credit Cards
- Saved Cards (future support)
- Payment Tokens
- Webhooks
- Refund API
- Payment Status Verification

---

# Additional Payment Method

Add a second payment option.

## Bank Transfer

Display:

- Bank Name
- Account Name
- Account Number
- IBAN
- Swift Code (optional)

After selecting Bank Transfer:

User uploads:

- Transfer Receipt
- Notes (optional)

Status:

Pending Verification

Admin manually approves.

---

# Checkout Flow

User

↓

Select Service

↓

Choose Date & Time

↓

Enter Address

↓

Choose Extras

↓

Review Order

↓

Payment Page

↓

Choose Payment Method

- Apple Pay
- Visa
- Mastercard
- Bank Transfer

↓

Successful Payment

↓

Order Confirmation

↓

Tracking Page

---

# Order Status

Pending Payment

↓

Paid

↓

Confirmed

↓

Cleaner Assigned

↓

On The Way

↓

Cleaning Started

↓

Completed

---

# Payment Page UI

Large clean payment card.

Sections:

Order Summary

Includes

- Service
- Duration
- Extras
- VAT
- Discount
- Total

Payment Methods

Cards

Apple Pay Button

Bank Transfer Button

Security Information

SSL Secure

Powered by Paymob

Encrypted Payment

---

# Card Payment

Collect

Card Holder

Card Number

Expiry

CVV

Validate all fields.

Handle:

Invalid Card

Expired Card

Declined

Network Error

Timeout

Duplicate Payment

---

# Apple Pay

If device supports Apple Pay:

Show Apple Pay button.

Otherwise hide it automatically.

---

# Success Page

Large Success Icon

Message

Payment Successful

Display

Order Number

Transaction ID

Amount Paid

Estimated Arrival

Buttons

Track Order

Return Home

Download Invoice

---

# Failed Payment

Explain reason.

Buttons

Try Again

Choose Another Method

Contact Support

---

# Pending Bank Transfer

After upload:

Status

Awaiting Verification

Message

Your transfer has been received.
Our team will verify it shortly.

---

# Admin Dashboard

Payments Page

Columns

Order ID

Customer

Amount

Method

Status

Transaction ID

Date

Actions

---

For Bank Transfers

Preview Receipt

Approve

Reject

Request New Receipt

---

# Refunds

Admin can

Refund Full Amount

Refund Partial Amount

Reason

Confirmation Dialog

Refund History

---

# Payment Security

Never store:

- CVV
- Raw Card Numbers

Use:

Paymob Tokens

HTTPS Only

Server-side Verification

Webhook Verification

---

# Database

Orders

Payment Method

Payment Status

Transaction ID

Reference Number

Paid At

Refund Status

Refund Amount

Invoice URL

Transfer Receipt URL

Verification Notes

---

# Notifications

After payment:

Customer

Email Confirmation

SMS Confirmation

Order Created

Admin

New Paid Order

New Bank Transfer

Refund Completed

---

# Invoice

Generate PDF automatically.

Contains

Company Logo

Invoice Number

Customer

Services

VAT

Total

Payment Method

Transaction ID

QR Code

---

# API Structure

POST

/api/payment/create

POST

/api/payment/webhook

POST

/api/payment/refund

GET

/api/payment/status/:id

POST

/api/bank-transfer/upload

GET

/api/invoice/:orderId

---

# Frontend

Next.js

TypeScript

TailwindCSS

Framer Motion

React Hook Form

Zod Validation

TanStack Query

Axios

---

# Backend

Node.js

Express

TypeScript

MongoDB

JWT

Multer

Cloudinary

Paymob SDK / REST API

---

# Environment Variables

PAYMOB_API_KEY

PAYMOB_SECRET_KEY

PAYMOB_INTEGRATION_ID

PAYMOB_IFRAME_ID

PAYMOB_HMAC_SECRET

APP_URL

MONGODB_URI

JWT_SECRET

SMTP_HOST

SMTP_PORT

SMTP_USER

SMTP_PASS

CLOUDINARY_NAME

CLOUDINARY_KEY

CLOUDINARY_SECRET

BANK_NAME

BANK_ACCOUNT_NAME

BANK_ACCOUNT_NUMBER

BANK_IBAN

BANK_SWIFT

---

# UX Details

Show loading during payment.

Disable duplicate clicks.

Prevent multiple submissions.

Handle browser refresh.

Auto-update payment status.

Responsive on all devices.

Support Dark Mode.

Support RTL & English.

---

# Final Goal

The website must provide a professional, secure, production-ready payment experience comparable to leading online service platforms, with Paymob handling electronic payments and a manual bank transfer option for customers who prefer direct transfers.