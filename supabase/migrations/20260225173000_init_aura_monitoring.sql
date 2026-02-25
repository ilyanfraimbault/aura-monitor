create table if not exists public.aura_members (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null unique,
  starting_aura integer not null default 100,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint aura_members_name_not_blank check (char_length(trim(name)) > 1)
);

create table if not exists public.aura_events (
  id uuid primary key default extensions.gen_random_uuid(),
  member_id uuid not null references public.aura_members(id) on delete cascade,
  delta integer not null,
  reason text not null,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint aura_events_delta_not_zero check (delta <> 0),
  constraint aura_events_delta_bounds check (delta between -1000 and 1000),
  constraint aura_events_reason_not_blank check (char_length(trim(reason)) >= 3)
);

create index if not exists aura_events_member_id_occurred_at_idx on public.aura_events (member_id, occurred_at desc);
create index if not exists aura_events_occurred_at_idx on public.aura_events (occurred_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists aura_members_set_updated_at on public.aura_members;
create trigger aura_members_set_updated_at
before update on public.aura_members
for each row execute procedure public.set_updated_at();

create or replace view public.aura_member_scores as
select
  m.id,
  m.name,
  m.starting_aura,
  m.created_at,
  m.updated_at,
  (m.starting_aura + coalesce(sum(e.delta), 0))::integer as current_aura,
  coalesce(sum(e.delta), 0)::integer as delta_total
from public.aura_members m
left join public.aura_events e
  on e.member_id = m.id
group by m.id;

insert into public.aura_members (name, starting_aura)
values
  ('Maxime', 100),
  ('Virgil', 100),
  ('Lucas', 100),
  ('Ilyan', 100)
on conflict (name) do nothing;

insert into public.aura_events (member_id, delta, reason, occurred_at)
select
  m.id,
  seed.delta,
  seed.reason,
  timezone('utc', now()) - (seed.days_ago || ' days')::interval
from (
  values
    ('Maxime', 15, 'A depanne un pote dans une galere', 6),
    ('Maxime', -8, 'Moment de gene en public', 3),
    ('Virgil', 20, 'Excellente intervention pendant une presentation', 5),
    ('Virgil', -5, 'Retard sans prevenir', 2),
    ('Lucas', -12, 'Blague ratee devant tout le monde', 4),
    ('Lucas', 18, 'Aide decisive sur un projet', 1),
    ('Ilyan', 10, 'Bon leadership dans la journee', 7),
    ('Ilyan', -6, 'Oubli d une tache importante', 2)
) as seed(member_name, delta, reason, days_ago)
join public.aura_members m
  on m.name = seed.member_name
where not exists (
  select 1
  from public.aura_events existing
  where existing.member_id = m.id
    and existing.reason = seed.reason
    and existing.occurred_at::date = (timezone('utc', now()) - (seed.days_ago || ' days')::interval)::date
);
