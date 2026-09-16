-- Track Visa / Mastercard / Apple Pay (and card last4) for commission clarity
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_channel" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_card_last4" text;
CREATE INDEX IF NOT EXISTS "orders_payment_channel_idx" ON "orders" ("payment_channel");
