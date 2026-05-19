-- ============================================================
-- Migration 012 — Supervisor Role
-- ============================================================

-- Drop old role CHECK constraint and recreate with 'supervisor'
DO $$
DECLARE
  cname TEXT;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'employees'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%role%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE employees DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE employees
  ADD CONSTRAINT employees_role_check CHECK (role IN ('admin', 'supervisor', 'empleado'));

-- Add supervisor_id: the employee who supervises this person
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- RLS policy: supervisors can read leads of their supervised employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'supervisor_read_team_leads'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "supervisor_read_team_leads"
        ON leads FOR SELECT
        USING (
          assigned_to IN (
            SELECT id FROM employees WHERE supervisor_id = auth.uid()
          )
        )
    $pol$;
  END IF;
END $$;
