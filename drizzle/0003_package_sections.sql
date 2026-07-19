-- Package sections (cleaning, future services) + popular badge
CREATE TABLE IF NOT EXISTS "package_sections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name_ar" text NOT NULL,
  "name_en" text NOT NULL,
  "description_ar" text,
  "description_en" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "section_id" uuid REFERENCES "package_sections"("id");
ALTER TABLE "packages" ADD COLUMN IF NOT EXISTS "is_popular" boolean DEFAULT false NOT NULL;
CREATE INDEX IF NOT EXISTS "packages_section_id_idx" ON "packages" ("section_id");

INSERT INTO "package_sections" ("slug", "name_ar", "name_en", "description_ar", "description_en", "sort_order")
VALUES (
  'cleaning',
  'تنظيف منزلي',
  'Home Cleaning',
  'باقات تنظيف منزلية مرنة في مسقط',
  'Flexible home cleaning packages in Muscat',
  0
)
ON CONFLICT ("slug") DO NOTHING;

UPDATE "packages"
SET "section_id" = (SELECT "id" FROM "package_sections" WHERE "slug" = 'cleaning' LIMIT 1)
WHERE "section_id" IS NULL;

UPDATE "packages"
SET "is_popular" = true
WHERE "is_featured" = true AND "is_popular" = false;
