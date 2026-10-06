begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 email text,
 plan text not null default 'free' check (plan in ('free','pro')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on table public.profiles from public, anon, authenticated;
grant select (id,email,plan,created_at,updated_at) on public.profiles to authenticated;
grant select,insert,update,delete on public.profiles to service_role;
create policy profiles_read_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
-- No browser INSERT, UPDATE or DELETE grant/policy. No safe editable fields in V1.
-- Privileged future subscription writers may change plan; client metadata is ignored.
create function public.create_account_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,email,plan) values(new.id,new.email,'free');
 return new;
end;
$$;
revoke all on function public.create_account_profile() from public,anon,authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_account_profile();
create function public.sync_account_email() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 update public.profiles set email=new.email,updated_at=now() where id=new.id;
 return new;
end;
$$;
revoke all on function public.sync_account_email() from public,anon,authenticated;
create trigger on_auth_email_changed after update of email on auth.users for each row execute function public.sync_account_email();
create function public.touch_account_profile() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at=now();return new;end;
$$;
revoke all on function public.touch_account_profile() from public,anon,authenticated;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.touch_account_profile();
-- Backfill only missing accounts, without replacing any existing trusted plan.
insert into public.profiles(id,email,plan) select id,email,'free' from auth.users on conflict(id) do nothing;
commit;
