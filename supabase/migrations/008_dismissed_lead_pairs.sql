-- Stores pairs of leads that an employee reviewed and confirmed are NOT duplicates.
-- Prevents them from reappearing in the duplicates alert.
CREATE TABLE IF NOT EXISTS dismissed_lead_pairs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id_a   uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  lead_id_b   uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  dismissed_by uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (lead_id_a, lead_id_b),
  CHECK (lead_id_a < lead_id_b)
);

ALTER TABLE dismissed_lead_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated employees can manage dismissed pairs"
  ON dismissed_lead_pairs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
