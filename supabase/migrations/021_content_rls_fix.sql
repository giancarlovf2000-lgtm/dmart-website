-- ============================================================================
-- 021_content_rls_fix.sql
-- Quita las políticas de escalada de admin en content_* que consultaban la
-- tabla `employees` (cuya RLS es recursiva → "infinite recursion"). El admin
-- accede a este contenido SOLO vía service-role en las rutas API (omite RLS),
-- por lo que estas políticas no son necesarias. Quedan las políticas de dueño.
-- ============================================================================

DROP POLICY IF EXISTS contrib_admin_read ON content_contributors;
DROP POLICY IF EXISTS subs_admin_read    ON content_submissions;
DROP POLICY IF EXISTS subs_admin_update  ON content_submissions;
