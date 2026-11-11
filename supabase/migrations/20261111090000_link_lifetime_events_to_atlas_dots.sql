alter table public.lifetime_events
  add column source_candidate_key text,
  add column linked_atlas_dot_ids uuid[] not null default '{}';

create unique index lifetime_events_user_candidate_key
  on public.lifetime_events (user_id, source_candidate_key);
