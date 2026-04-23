-- Add 'actividad' to assignment_source CHECK constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_assignment_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_assignment_source_check
  CHECK (assignment_source IN ('website', 'manual', 'import', 'actividad'));
