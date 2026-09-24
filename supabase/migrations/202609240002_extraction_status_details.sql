alter table public.quotations
  add column extraction_error text,
  add column extraction_model text,
  add column extraction_duration_ms integer check (extraction_duration_ms is null or extraction_duration_ms >= 0),
  add column extraction_attempted_at timestamptz;
