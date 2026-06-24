-- 1. Guardar el HTML del contrato generado para poder reabrirlo desde el historial.
ALTER TABLE private_contracts ADD COLUMN IF NOT EXISTS contract_html text;

-- 2. Designar empleados que reciben los leads del website público.
ALTER TABLE employees ADD COLUMN IF NOT EXISTS web_intake boolean NOT NULL DEFAULT false;

-- 3. Reparto de leads del website: si hay empleados marcados con web_intake, los
--    leads del website (assigned_to NULL) se reparten SOLO entre ellos (round-robin).
--    Si no hay ninguno marcado, se mantiene el comportamiento anterior (por recinto).
CREATE OR REPLACE FUNCTION assign_lead_round_robin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_employee_id    UUID;
  v_current_index  INT;
  v_total          INT;
  v_web_count      INT;
  v_campus_filter  BOOLEAN;
BEGIN
  -- ¿Hay reps designados para los leads del website?
  SELECT COUNT(*) INTO v_web_count
    FROM employees
    WHERE active = true AND role = 'empleado' AND web_intake = true;

  IF v_web_count > 0 THEN
    -- Reparte solo entre los reps marcados, sin filtro de recinto.
    SELECT id, round_robin_index
      INTO v_employee_id, v_current_index
      FROM employees
      WHERE active = true AND role = 'empleado' AND web_intake = true
      ORDER BY round_robin_index ASC, id ASC
      LIMIT 1;
    v_total := v_web_count;
  ELSE
    -- Fallback: comportamiento anterior (round-robin por recinto entre todos los empleados).
    v_campus_filter := NEW.campus IS NOT NULL AND NEW.campus <> 'No tengo preferencia';

    IF v_campus_filter THEN
      SELECT id, round_robin_index
        INTO v_employee_id, v_current_index
        FROM employees
        WHERE active = true AND role = 'empleado' AND campus @> ARRAY[NEW.campus]
        ORDER BY round_robin_index ASC, id ASC
        LIMIT 1;
      SELECT COUNT(*) INTO v_total
        FROM employees
        WHERE active = true AND role = 'empleado' AND campus @> ARRAY[NEW.campus];
    ELSE
      SELECT id, round_robin_index
        INTO v_employee_id, v_current_index
        FROM employees
        WHERE active = true AND role = 'empleado'
        ORDER BY round_robin_index ASC, id ASC
        LIMIT 1;
      SELECT COUNT(*) INTO v_total
        FROM employees
        WHERE active = true AND role = 'empleado';
    END IF;
  END IF;

  -- No hay empleado elegible — dejar el lead sin asignar.
  IF v_employee_id IS NULL OR v_total = 0 THEN
    RETURN NEW;
  END IF;

  -- Avanzar la posición del empleado en la rotación.
  UPDATE employees
    SET round_robin_index = (v_current_index + 1) % GREATEST(v_total, 1)
    WHERE id = v_employee_id;

  -- Asignar el lead.
  UPDATE leads
    SET assigned_to       = v_employee_id,
        assignment_source = 'website',
        last_action_at    = NOW()
    WHERE id = NEW.id;

  -- Registrar en el historial.
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
