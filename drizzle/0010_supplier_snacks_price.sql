ALTER TABLE "supplier_applications"
  ADD COLUMN IF NOT EXISTS "snacks_price_omr" numeric(10, 2);
