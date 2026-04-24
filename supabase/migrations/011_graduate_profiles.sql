-- Add 'Graduado' and 'Graduado con Reválida' to lead status constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN (
  'Nuevo Lead',
  'Crítico',
  'Contacto Inicial (Pendiente de Respuesta)',
  'Contacto Establecido',
  'Cita Programada',
  'No Asistió a la Cita',
  'Reagendado',
  'En Espera de Documentos',
  'Orientado (En Proceso de Matricularse)',
  'Seguimiento a Futuro',
  'Matriculado',
  'Desinteresado / Rechazado',
  'Graduado',
  'Graduado con Reválida'
));

-- Graduate profiles table
CREATE TABLE IF NOT EXISTS graduate_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID REFERENCES leads(id) ON DELETE CASCADE UNIQUE,
  full_name        TEXT NOT NULL,
  program          TEXT NOT NULL,
  campus           TEXT,
  specialty        TEXT,
  bio              TEXT,
  photo_url        TEXT,
  graduation_date  DATE,
  available        BOOLEAN NOT NULL DEFAULT true,
  consent_given    BOOLEAN NOT NULL DEFAULT false,
  consent_date     TIMESTAMPTZ,
  created_by       UUID REFERENCES employees(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE graduate_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "graduate_profiles_public_read"
  ON graduate_profiles FOR SELECT USING (true);

CREATE POLICY "graduate_profiles_emp_insert"
  ON graduate_profiles FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "graduate_profiles_emp_update"
  ON graduate_profiles FOR UPDATE TO authenticated USING (true);

-- Job requests table (public can insert, only authenticated can read/update)
CREATE TABLE IF NOT EXISTS job_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  graduate_id         UUID REFERENCES graduate_profiles(id) ON DELETE CASCADE,
  client_name         TEXT NOT NULL,
  client_email        TEXT NOT NULL,
  client_phone        TEXT NOT NULL,
  service_description TEXT NOT NULL,
  preferred_date      DATE,
  status              TEXT NOT NULL DEFAULT 'pendiente'
                        CHECK (status IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_requests_anon_insert"
  ON job_requests FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "job_requests_auth_insert"
  ON job_requests FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "job_requests_emp_read"
  ON job_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "job_requests_emp_update"
  ON job_requests FOR UPDATE TO authenticated USING (true);

-- Supabase Storage bucket for graduate photos (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('graduate-photos', 'graduate-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "graduate_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'graduate-photos');

CREATE POLICY "graduate_photos_auth_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'graduate-photos');

CREATE POLICY "graduate_photos_auth_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'graduate-photos');
