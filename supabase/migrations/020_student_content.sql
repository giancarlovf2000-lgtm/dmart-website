-- ============================================================================
-- 020_student_content.sql
-- Portal de contenido para estudiantes/profesores: cuentas de contribuidores,
-- envíos de imágenes/videos con consentimiento, y bucket privado de storage.
-- Privacidad estricta: cada quien ve solo lo suyo; el admin (service-role) ve todo.
-- ============================================================================

-- ── Contribuidores (estudiantes / profesores) ───────────────────────────────
-- Fila 1:1 con auth.users, SEPARADA de employees (no son staff).
CREATE TABLE IF NOT EXISTS content_contributors (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text NOT NULL,
  email      text NOT NULL,
  type       text NOT NULL DEFAULT 'estudiante' CHECK (type IN ('estudiante', 'profesor')),
  programa   text,
  campus     text,
  phone      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Envíos de contenido ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind            text NOT NULL CHECK (kind IN ('imagen', 'video')),
  storage_path    text NOT NULL,
  mime            text,
  size_bytes      bigint,
  title           text,
  caption         text,
  -- Consentimiento (registro legal): texto/versión/fecha + aval de menor.
  consent_granted boolean NOT NULL DEFAULT false,
  is_minor        boolean NOT NULL DEFAULT false,
  guardian_ack    boolean NOT NULL DEFAULT false,
  guardian_name   text,
  consent_text    text,
  consent_version text,
  consent_at      timestamptz,
  -- Revisión por la institución.
  status          text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),
  review_note     text,
  reviewed_by     uuid REFERENCES employees(id) ON DELETE SET NULL,
  reviewed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_submissions_contributor ON content_submissions (contributor_id);
CREATE INDEX IF NOT EXISTS idx_content_submissions_status      ON content_submissions (status);
CREATE INDEX IF NOT EXISTS idx_content_submissions_created     ON content_submissions (created_at DESC);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Nota: el rol admin se valida en el servidor y el service-role omite RLS.
-- Estas políticas son el respaldo para acceso directo con anon/user key.
ALTER TABLE content_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_submissions  ENABLE ROW LEVEL SECURITY;

-- content_contributors: cada quien su fila; admin lee todo.
DROP POLICY IF EXISTS contrib_own_all  ON content_contributors;
CREATE POLICY contrib_own_all ON content_contributors FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS contrib_admin_read ON content_contributors;
CREATE POLICY contrib_admin_read ON content_contributors FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.id = auth.uid() AND e.role = 'admin'));

-- content_submissions: el dueño CRUD lo suyo; admin lee/actualiza todo. Sin lectura pública.
DROP POLICY IF EXISTS subs_owner_all ON content_submissions;
CREATE POLICY subs_owner_all ON content_submissions FOR ALL TO authenticated
  USING (contributor_id = auth.uid()) WITH CHECK (contributor_id = auth.uid());
DROP POLICY IF EXISTS subs_admin_read ON content_submissions;
CREATE POLICY subs_admin_read ON content_submissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.id = auth.uid() AND e.role = 'admin'));
DROP POLICY IF EXISTS subs_admin_update ON content_submissions;
CREATE POLICY subs_admin_update ON content_submissions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM employees e WHERE e.id = auth.uid() AND e.role = 'admin'));

-- ── Bucket privado de storage ────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-content', 'student-content', false, 209715200,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif',
        'video/mp4','video/quicktime','video/webm','video/x-m4v']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas: cada usuario autenticado solo su propia carpeta (name = "<uid>/archivo").
-- El admin accede vía service-role (omite RLS) para revisar y firmar URLs.
DROP POLICY IF EXISTS student_content_own_insert ON storage.objects;
CREATE POLICY student_content_own_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-content' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS student_content_own_select ON storage.objects;
CREATE POLICY student_content_own_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-content' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS student_content_own_update ON storage.objects;
CREATE POLICY student_content_own_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'student-content' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS student_content_own_delete ON storage.objects;
CREATE POLICY student_content_own_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'student-content' AND (storage.foldername(name))[1] = auth.uid()::text);
