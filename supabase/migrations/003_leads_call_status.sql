-- Add call tracking fields to leads table
alter table leads add column if not exists call_status text default 'pending';
-- call_status: pending, called, completed, failed
alter table leads add column if not exists call_id uuid references calls(id) on delete set null;
alter table leads add column if not exists last_called_at timestamptz;
