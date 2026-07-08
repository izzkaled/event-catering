ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "user_id" uuid REFERENCES "users"("id");
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "package_name_ar" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "package_name_en" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "end_date" date;
CREATE INDEX IF NOT EXISTS "orders_user_id_idx" ON "orders" ("user_id");
