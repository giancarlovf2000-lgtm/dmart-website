-- ============================================================================
-- 018_posts_and_analytics.sql
-- Marketing posts (calendarios + posts guardados) y analítica web first-party.
-- ============================================================================

-- ── Calendarios de posts ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_calendars (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  month       date NOT NULL,                       -- primer día del mes (YYYY-MM-01)
  created_by  uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Posts guardados (solo los que el admin decide guardar) ───────────────────
CREATE TABLE IF NOT EXISTS saved_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid REFERENCES post_calendars(id) ON DELETE CASCADE,
  post_date   date NOT NULL,
  title       text,
  config      jsonb NOT NULL,                       -- los 12 campos de PostConfig
  image_url   text,                                 -- PNG en Storage (saved-post-images)
  created_by  uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_posts_calendar      ON saved_posts (calendar_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_calendar_date ON saved_posts (calendar_id, post_date);

-- ── Analítica web first-party (vistas de página del sitio público) ───────────
CREATE TABLE IF NOT EXISTS page_views (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path         text NOT NULL,
  referrer     text,
  session_id   text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path       ON page_views (path);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE post_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views     ENABLE ROW LEVEL SECURITY;

-- post_calendars / saved_posts: accesibles a empleados autenticados.
-- (El rol admin se valida en el servidor; el service role omite RLS.)
CREATE POLICY "post_calendars_auth_all" ON post_calendars
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "saved_posts_auth_all" ON saved_posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- page_views: sin acceso público; el INSERT lo hace /api/track con service role
-- (que omite RLS). No se definen políticas para anon/authenticated a propósito.

-- ── Storage: bucket público para las imágenes de los posts guardados ─────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('saved-post-images', 'saved-post-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "saved_post_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'saved-post-images');

CREATE POLICY "saved_post_images_auth_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'saved-post-images');

CREATE POLICY "saved_post_images_auth_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'saved-post-images');

CREATE POLICY "saved_post_images_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'saved-post-images');
