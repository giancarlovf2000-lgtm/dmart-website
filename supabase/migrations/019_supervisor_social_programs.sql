-- Migration 019: programas que el supervisor solicita para apoyo/exposición en redes.
-- Se guarda por (supervisor_id, plan_month) junto al plan mensual.

ALTER TABLE supervisor_monthly_plans
  ADD COLUMN IF NOT EXISTS social_programs jsonb NOT NULL DEFAULT '[]'::jsonb;
