-- Paymob + bank transfer payment fields
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" text DEFAULT 'bank_transfer' NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'unpaid' NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "stripe_checkout_session_id" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymob_intention_id" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymob_transaction_id" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_reference" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paid_at" timestamp;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "refund_status" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "refund_amount_omr" numeric(10, 2);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_url" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "transfer_receipt_url" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "verification_notes" text;
CREATE INDEX IF NOT EXISTS "orders_payment_status_idx" ON "orders" ("payment_status");
