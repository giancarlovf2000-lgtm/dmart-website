-- ============================================================================
-- 023_contributor_signup_trigger.sql
-- Al registrarse un estudiante/profesor por signUp (con metadata contributor_type),
-- crea automáticamente su fila en content_contributors. Así el perfil (nombre+email)
-- queda guardado desde el registro, incluso antes de confirmar el correo, y NUNCA
-- se pierde de vista quién subió contenido. No afecta a empleados (no setean
-- contributor_type; se crean por el panel admin).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_contributor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.raw_user_meta_data ->> 'contributor_type') IS NOT NULL THEN
    INSERT INTO public.content_contributors (id, full_name, email, type, programa)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), split_part(NEW.email, '@', 1)),
      NEW.email,
      CASE WHEN NEW.raw_user_meta_data ->> 'contributor_type' = 'profesor' THEN 'profesor' ELSE 'estudiante' END,
      NULLIF(NEW.raw_user_meta_data ->> 'programa', '')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_contributor ON auth.users;
CREATE TRIGGER on_auth_user_created_contributor
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_contributor();
