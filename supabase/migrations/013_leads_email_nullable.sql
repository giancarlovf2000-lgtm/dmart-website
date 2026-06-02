-- Migration 013: Make leads.email nullable
-- Email is now optional when creating a lead manually

ALTER TABLE leads ALTER COLUMN email DROP NOT NULL;
