-- ============================================================
-- Migration 004 — Employee Portal
-- ============================================================

-- ============================================================
-- STEP 1: Remove legacy calls columns from leads
-- (safe if 002/003 were never applied — IF EXISTS guards it)
-- ============================================================
ALTER TABLE leads DROP COLUMN IF EXISTS call_status;
ALTER TABLE leads DROP COLUMN IF EXISTS call_id;
ALTER TABLE leads DROP COLUMN IF EXISTS last_called_at;

DROP TABLE IF EXISTS calls CASCADE;

-- ============================================================
-- STEP 2: Create employees table
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  campus            TEXT[] NOT NULL DEFAULT '{}',
  role              TEXT NOT NULL DEFAULT 'empleado' CHECK (role IN ('admin', 'empleado')),
  active            BOOLEAN NOT NULL DEFAULT true,
  round_robin_index INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: Create activities table (before leads FK)
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month          DATE NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT,
  type           TEXT NOT NULL CHECK (type IN ('feria', 'visita_escuela', 'evento_comunitario', 'otro')),
  planned_leads  INT,
  actual_leads   INT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Alter leads table
-- ============================================================
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS assigned_to       UUID REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assignment_source TEXT CHECK (assignment_source IN ('website', 'manual')),
  ADD COLUMN IF NOT EXISTS last_action_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS activity_id       UUID REFERENCES activities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_source_text  TEXT;

-- Migrate old status values before adding new constraint
UPDATE leads SET status = 'Nuevo Lead'                  WHERE status = 'new';
UPDATE leads SET status = 'Contacto Establecido'         WHERE status = 'contacted';
UPDATE leads SET status = 'Matriculado'                  WHERE status = 'enrolled';
UPDATE leads SET status = 'Desinteresado / Rechazado'    WHERE status = 'closed';

-- Replace status constraint
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
  'Desinteresado / Rechazado'
));

ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'Nuevo Lead';

-- ============================================================
-- STEP 5: Create lead_history table
-- ============================================================
CREATE TABLE IF NOT EXISTS lead_history (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id            UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  employee_id        UUID REFERENCES employees(id) ON DELETE SET NULL,
  action_type        TEXT NOT NULL CHECK (action_type IN (
                       'status_change', 'note_added', 'lead_created', 'lead_assigned'
                     )),
  old_status         TEXT,
  new_status         TEXT,
  note               TEXT,
  communication_type TEXT CHECK (communication_type IN (
                       'Llamada', 'Mensaje de texto', 'Email',
                       'Visita presencial', 'WhatsApp', 'Otro'
                     )),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: Create monthly_reports table
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month             DATE NOT NULL,
  report_type       TEXT NOT NULL CHECK (report_type IN ('planning', 'performance')),
  leads_acquired    INT,
  leads_contacted   INT,
  leads_enrolled    INT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, month, report_type)
);

ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 7: RLS Policies — employees
-- ============================================================
CREATE POLICY "employee_read_own"
  ON employees FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "admin_read_all_employees"
  ON employees FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM employees e WHERE e.id = auth.uid() AND e.role = 'admin')
  );

CREATE POLICY "admin_update_employees"
  ON employees FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM employees e WHERE e.id = auth.uid() AND e.role = 'admin')
  );

-- ============================================================
-- STEP 8: RLS Policies — leads (extend existing)
-- ============================================================
-- Drop old anon-only insert policy if it exists
DROP POLICY IF EXISTS "Anonymous insert leads" ON leads;
DROP POLICY IF EXISTS "anon_insert_leads" ON leads;

CREATE POLICY "anon_insert_leads"
  ON leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "employee_read_own_leads"
  ON leads FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "employee_update_own_leads"
  ON leads FOR UPDATE
  USING (assigned_to = auth.uid());

CREATE POLICY "employee_insert_leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = assigned_to);

CREATE POLICY "admin_read_all_leads"
  ON leads FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM employees e WHERE e.id = auth.uid() AND e.role = 'admin')
  );

CREATE POLICY "admin_update_all_leads"
  ON leads FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM employees e WHERE e.id = auth.uid() AND e.role = 'admin')
  );

-- ============================================================
-- STEP 9: RLS Policies — lead_history
-- ============================================================
CREATE POLICY "employee_read_own_lead_history"
  ON lead_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads l
      WHERE l.id = lead_history.lead_id AND l.assigned_to = auth.uid()
    )
  );

CREATE POLICY "employee_insert_lead_history"
  ON lead_history FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "admin_read_all_lead_history"
  ON lead_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM employees e WHERE e.id = auth.uid() AND e.role = 'admin')
  );

-- ============================================================
-- STEP 10: RLS Policies — activities
-- ============================================================
CREATE POLICY "employee_crud_own_activities"
  ON activities FOR ALL
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "admin_read_all_activities"
  ON activities FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM employees e WHERE e.id = auth.uid() AND e.role = 'admin')
  );

-- ============================================================
-- STEP 11: RLS Policies — monthly_reports
-- ============================================================
CREATE POLICY "employee_crud_own_reports"
  ON monthly_reports FOR ALL
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "admin_read_all_reports"
  ON monthly_reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM employees e WHERE e.id = auth.uid() AND e.role = 'admin')
  );

-- ============================================================
-- STEP 12: Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_employees_campus         ON employees USING GIN (campus);
CREATE INDEX IF NOT EXISTS idx_employees_active         ON employees (active);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to        ON leads (assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_last_action_at     ON leads (last_action_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id     ON lead_history (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_employee_id ON lead_history (employee_id);
CREATE INDEX IF NOT EXISTS idx_activities_employee_id   ON activities (employee_id);
CREATE INDEX IF NOT EXISTS idx_activities_month         ON activities (month);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_emp_month ON monthly_reports (employee_id, month);
