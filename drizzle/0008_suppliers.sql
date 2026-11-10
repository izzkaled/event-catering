CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name_ar" text NOT NULL,
  "name_en" text NOT NULL,
  "description_ar" text,
  "description_en" text,
  "logo_url" text,
  "contact_phone" text,
  "contact_email" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
INSERT INTO "suppliers" (
  "id",
  "slug",
  "name_ar",
  "name_en",
  "description_ar",
  "description_en",
  "logo_url",
  "is_active",
  "sort_order"
) VALUES (
  '00000000-0000-4000-8000-000000000001',
  'event-catering',
  'إيفنت كاترينج',
  'Event Catering',
  'المورد الداخلي للمنصة',
  'In-house platform supplier',
  '/images/brand/logo-mark.webp',
  true,
  0
) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "supplier_id" uuid;
--> statement-breakpoint
ALTER TABLE "hospitality_services" ADD COLUMN IF NOT EXISTS "supplier_id" uuid;
--> statement-breakpoint
UPDATE "packages"
SET "supplier_id" = '00000000-0000-4000-8000-000000000001'
WHERE "supplier_id" IS NULL;
--> statement-breakpoint
UPDATE "hospitality_services"
SET "supplier_id" = '00000000-0000-4000-8000-000000000001'
WHERE "supplier_id" IS NULL;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "packages"
    ADD CONSTRAINT "packages_supplier_id_suppliers_id_fk"
    FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "hospitality_services"
    ADD CONSTRAINT "hospitality_services_supplier_id_suppliers_id_fk"
    FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "packages_supplier_id_idx" ON "packages" ("supplier_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hospitality_services_supplier_id_idx" ON "hospitality_services" ("supplier_id");
