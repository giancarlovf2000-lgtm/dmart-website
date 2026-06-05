-- Migration 015: Private short programs contract log

CREATE TABLE private_contracts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  program          TEXT NOT NULL,        -- 'caballeros' | 'damas' | 'unas'
  scenario         INT  NOT NULL,        -- 1-6
  student_name     TEXT NOT NULL,
  student_phone    TEXT,
  student_email    TEXT,
  program_payment  TEXT NOT NULL,        -- 'complete' | 'deferred'
  equipment_option TEXT NOT NULL,        -- 'complete' | 'deferred' | 'student'
  initial_payment  NUMERIC(10,2) NOT NULL,
  weekly_total     NUMERIC(10,2) NOT NULL,
  total_contract   NUMERIC(10,2) NOT NULL,
  start_date       TEXT,
  campus           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pc_employee ON private_contracts(employee_id, created_at DESC);
