-- Experience platform: package flags + services + saved experiences
ALTER TABLE packages ADD COLUMN IF NOT EXISTS is_recommended boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS hospitality_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text,
  description_en text,
  category text NOT NULL,
  price_omr numeric(10,2) NOT NULL,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS package_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES hospitality_services(id) ON DELETE CASCADE,
  included boolean NOT NULL DEFAULT true,
  quantity integer NOT NULL DEFAULT 1,
  custom_price_omr numeric(10,2),
  UNIQUE (package_id, service_id)
);

CREATE INDEX IF NOT EXISTS package_services_package_id_idx ON package_services(package_id);

CREATE TABLE IF NOT EXISTS saved_experiences (
  id text PRIMARY KEY,
  package_id uuid REFERENCES packages(id),
  payload text NOT NULL,
  estimated_total_omr numeric(10,2),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
