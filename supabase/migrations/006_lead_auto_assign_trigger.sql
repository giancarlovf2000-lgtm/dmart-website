-- Auto-assign leads to employees via round-robin at the DB level.
-- Fires AFTER INSERT on leads when assigned_to IS NULL (website form submissions).
-- Manual leads (portal) have assigned_to set before insert, so trigger skips them.

CREATE OR REPLACE FUNCTION assign_lead_round_robin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as postgres, bypasses RLS
AS $$
DECLARE
  v_employee_id    UUID;
  v_current_index  INT;
  v_total          INT;
  v_next_index     INT;
  v_campus_filter  BOOLEAN;
BEGIN
  v_campus_filter := NEW.campus IS NOT NULL AND NEW.campus <> 'No tengo preferencia';

  -- Find employee with lowest round_robin_index for this campus
  IF v_campus_filter THEN
    SELECT id, round_robin_index
      INTO v_employee_id, v_current_index
      FROM employees
      WHERE active = true AND role = 'empleado' AND campus @> ARRAY[NEW.campus]
      ORDER BY round_robin_index ASC
      LIMIT 1;

    SELECT COUNT(*) INTO v_total
      FROM employees
      WHERE active = true AND role = 'empleado' AND campus @> ARRAY[NEW.campus];
  ELSE
    SELECT id, round_robin_index
      INTO v_employee_id, v_current_index
      FROM employees
      WHERE active = true AND role = 'empleado'
      ORDER BY round_robin_index ASC
      LIMIT 1;

    SELECT COUNT(*) INTO v_total
      FROM employees
      WHERE active = true AND role = 'empleado';
  END IF;

  -- No eligible employee found — leave lead unassigned
  IF v_employee_id IS NULL OR v_total = 0 THEN
    RETURN NEW;
  END IF;

  v_next_index := (v_current_index + 1) % v_total;

  -- Advance this employee's position in the rotation
  UPDATE employees
    SET round_robin_index = v_next_index
    WHERE id = v_employee_id;

  -- Assign the lead
  UPDATE leads
    SET assigned_to       = v_employee_id,
        assignment_source = 'website',
        last_action_at    = NOW()
    WHERE id = NEW.id;

  -- Record in history
  INSERT INTO lead_history (lead_id, employee_id, action_type, new_status, note)
    VALUES (
      NEW.id,
      v_employee_id,
      'lead_assigned',
      NEW.status,
      'Lead asignado automáticamente desde formulario web'
    );

  RETURN NEW;
END;
$$;

-- Drop and recreate trigger so re-running migration is idempotent
DROP TRIGGER IF EXISTS lead_auto_assign ON leads;

CREATE TRIGGER lead_auto_assign
  AFTER INSERT ON leads
  FOR EACH ROW
  WHEN (NEW.assigned_to IS NULL)
  EXECUTE FUNCTION assign_lead_round_robin();
