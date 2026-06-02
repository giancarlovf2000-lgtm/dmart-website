-- Migration 014: Audit log for supervisor calendar changes
-- Records every day-level edit so admins can detect manipulation

CREATE TABLE supervisor_plan_changes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  plan_month    TEXT NOT NULL,          -- YYYY-MM
  day           INT  NOT NULL,          -- 1-31
  old_value     TEXT,
  new_value     TEXT,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_spc_supervisor_month
  ON supervisor_plan_changes(supervisor_id, plan_month, changed_at DESC);
