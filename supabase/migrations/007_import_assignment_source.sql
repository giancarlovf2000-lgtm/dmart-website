-- Add 'import' to assignment_source CHECK constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_assignment_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_assignment_source_check
  CHECK (assignment_source IN ('website', 'manual', 'import'));

-- Recreate trigger to skip imported leads (assignment_source = 'import')
-- This prevents 1000 historical imports from triggering round-robin assignment
DROP TRIGGER IF EXISTS lead_auto_assign ON leads;
CREATE TRIGGER lead_auto_assign
  AFTER INSERT ON leads
  FOR EACH ROW
  WHEN (NEW.assigned_to IS NULL AND (NEW.assignment_source IS NULL OR NEW.assignment_source <> 'import'))
  EXECUTE FUNCTION assign_lead_round_robin();
