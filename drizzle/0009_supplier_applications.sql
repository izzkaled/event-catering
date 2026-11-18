CREATE TABLE IF NOT EXISTS "supplier_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_name" text NOT NULL,
  "contact_phone" text NOT NULL,
  "prep_speed" text NOT NULL,
  "breakfast_price_omr" numeric(10, 2),
  "lunch_price_omr" numeric(10, 2),
  "dinner_price_omr" numeric(10, 2),
  "snacks_price_omr" numeric(10, 2),
  "instagram" text,
  "desserts_type" text,
  "min_order_qty" integer,
  "min_order_price_omr" numeric(10, 2),
  "kitchen_type" text NOT NULL,
  "photo_urls" text[] DEFAULT '{}' NOT NULL,
  "notes" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "admin_notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "supplier_applications_status_idx"
  ON "supplier_applications" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "supplier_applications_created_at_idx"
  ON "supplier_applications" ("created_at");
