alter table public.aura_events
drop constraint if exists aura_events_delta_bounds;

alter table public.aura_events
add constraint aura_events_delta_bounds check (delta between -1000 and 1000);
