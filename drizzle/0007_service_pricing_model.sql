ALTER TABLE "hospitality_services" ADD COLUMN IF NOT EXISTS "pricing_model" text DEFAULT 'fixed' NOT NULL;
