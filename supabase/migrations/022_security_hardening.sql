-- ============================================================================
-- 022_security_hardening.sql
-- Arreglos seguros del Security Advisor de Supabase:
--  1. Habilitar RLS en supervisor_monthly_plans (solo se accede por service-role).
--  2. Fijar search_path en funciones SECURITY DEFINER (evita inyección de search_path).
-- ============================================================================

-- 1. RLS deny-by-default: sin políticas, solo el service-role (que omite RLS) accede.
--    Verificado: rutas API y planningGate reciben un adminClient (service-role);
--    ningún cliente de navegador consulta esta tabla directamente.
ALTER TABLE public.supervisor_monthly_plans ENABLE ROW LEVEL SECURITY;

-- 2. search_path inmutable en las funciones trigger (usan tablas del schema public).
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.assign_lead_round_robin() SET search_path = public;
