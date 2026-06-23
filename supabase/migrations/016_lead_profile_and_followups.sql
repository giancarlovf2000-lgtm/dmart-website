-- Lead profile enhancements + follow-up scheduler
--   1. leads.start_date  — fecha de comienzo que el empleado pone manualmente
--   2. communication_types — lista de "tipos de seguimiento" editable (solo agregar)
--   3. lead_history: permitir tipos de comunicación nuevos + nuevas action_types
--   4. lead_followups — recordatorios de follow-up programados por lead

-- ── 1. Fecha de comienzo ────────────────────────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS start_date date;

-- ── 2. Tipos de comunicación / seguimiento (add-only) ───────────────────────
CREATE TABLE IF NOT EXISTS communication_types (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL UNIQUE,
  created_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Seed con los 6 valores que estaban hardcodeados
INSERT INTO communication_types (name) VALUES
  ('Llamada'),
  ('Mensaje de texto'),
  ('Email'),
  ('Visita presencial'),
  ('WhatsApp'),
  ('Otro')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE communication_types ENABLE ROW LEVEL SECURITY;

-- Empleados autenticados pueden leer y agregar; sin políticas de update/delete
-- quedan bloqueados. El service-role (API) bypassa RLS de todas formas.
CREATE POLICY "authenticated can read communication types"
  ON communication_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can add communication types"
  ON communication_types FOR INSERT TO authenticated WITH CHECK (true);

-- ── 3. lead_history: permitir tipos nuevos y nuevas acciones ────────────────
-- El CHECK fijo del communication_type impediría usar tipos nuevos.
ALTER TABLE lead_history DROP CONSTRAINT IF EXISTS lead_history_communication_type_check;

-- Ampliar action_type con los eventos de follow-up.
ALTER TABLE lead_history DROP CONSTRAINT IF EXISTS lead_history_action_type_check;
ALTER TABLE lead_history ADD CONSTRAINT lead_history_action_type_check
  CHECK (action_type IN (
    'status_change', 'note_added', 'lead_created', 'lead_assigned',
    'followup_scheduled', 'followup_done'
  ));

-- ── 4. Follow-ups programados ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_followups (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id      uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  employee_id  uuid REFERENCES employees(id) ON DELETE SET NULL,
  due_date     date NOT NULL,
  note         text,
  status       text NOT NULL DEFAULT 'programado'
                 CHECK (status IN ('programado', 'completado', 'cancelado')),
  created_at   timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  completed_by uuid REFERENCES employees(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_lead_followups_lead ON lead_followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_due
  ON lead_followups(due_date) WHERE status = 'programado';

ALTER TABLE lead_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated employees can manage followups"
  ON lead_followups FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
