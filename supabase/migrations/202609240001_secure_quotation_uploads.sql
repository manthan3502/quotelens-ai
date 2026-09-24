alter table public.quotations
  add constraint quotations_supported_mime_type
    check (mime_type in ('application/pdf', 'image/png', 'image/jpeg')),
  add constraint quotations_maximum_file_size
    check (file_size <= 10485760),
  add constraint quotations_original_filename_length
    check (char_length(original_filename) between 1 and 255);

create or replace function public.enforce_quotation_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  quotation_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.comparison_id::text, 0));

  select count(*) into quotation_count
  from public.quotations
  where comparison_id = new.comparison_id;

  if quotation_count >= 5 then
    raise exception 'A comparison can contain at most 5 quotations.';
  end if;

  return new;
end;
$$;

create trigger quotations_enforce_limit
before insert on public.quotations
for each row execute procedure public.enforce_quotation_limit();
