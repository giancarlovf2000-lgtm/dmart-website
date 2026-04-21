-- ============================================================
-- Migration 009 — Activity Enhancements + Report Scoring
-- ============================================================

-- Add new columns to activities
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS activity_date DATE,
  ADD COLUMN IF NOT EXISTS location      TEXT,
  ADD COLUMN IF NOT EXISTS status        TEXT NOT NULL DEFAULT 'planificada'
    CHECK (status IN ('planificada', 'terminada'));

-- Add new columns to monthly_reports
ALTER TABLE monthly_reports
  ADD COLUMN IF NOT EXISTS performance_score    TEXT
    CHECK (performance_score IN ('deficiente', 'basico', 'bueno', 'excelente')),
  ADD COLUMN IF NOT EXISTS activities_completed INT;
