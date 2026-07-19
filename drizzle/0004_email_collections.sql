-- Email outreach collections + contacts
CREATE TABLE IF NOT EXISTS "email_collections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "email_contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "collection_id" uuid NOT NULL REFERENCES "email_collections"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "company_name" text,
  "notes" text,
  "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "email_contacts_collection_email_uidx"
  ON "email_contacts" ("collection_id", "email");

CREATE INDEX IF NOT EXISTS "email_contacts_collection_id_idx"
  ON "email_contacts" ("collection_id");
