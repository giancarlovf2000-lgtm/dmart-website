-- Calls table to track AI voice agent interactions
create table if not exists calls (
  id                uuid primary key default uuid_generate_v4(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  lead_id           uuid references leads(id) on delete set null,
  vapi_call_id      text unique,
  phone_number      text not null,
  nombre            text,
  programa_interes  text,
  campus            text,
  status            text not null default 'initiated',
  -- status options: initiated, ringing, in-progress, completed, failed, no-answer, voicemail
  duration_seconds  int,
  transcript        text,
  summary           text,
  outcome           text,
  -- outcome options: interested, not_interested, callback_requested, voicemail, no_answer, error
  recording_url     text,
  ended_reason      text,
  cost_usd          numeric(8,4)
);

-- RLS
alter table calls enable row level security;

-- Allow service role full access
create policy "Service role full access on calls"
  on calls for all
  using (true)
  with check (true);

-- Updated_at trigger
create trigger update_calls_updated_at
  before update on calls
  for each row execute function update_updated_at_column();

-- Index
create index if not exists calls_lead_id_idx on calls(lead_id);
create index if not exists calls_vapi_call_id_idx on calls(vapi_call_id);
create index if not exists calls_status_idx on calls(status);
