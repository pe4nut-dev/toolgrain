-- Run as database administrator in Supabase SQL Editor. Re-runnable; no profile data is deleted.
begin;
alter table public.profiles add column if not exists stripe_customer_id text, add column if not exists stripe_subscription_id text, add column if not exists stripe_subscription_status text, add column if not exists stripe_price_id text, add column if not exists subscription_current_period_end timestamptz;

-- Safe for a manually created profiles table: preserve data and verify the expected billing types.
do $$
declare field record;
begin
 for field in select * from (values ('id','uuid'),('stripe_customer_id','text'),('stripe_subscription_id','text'),('stripe_subscription_status','text'),('stripe_price_id','text'),('subscription_current_period_end','timestamp with time zone')) expected(name,type) loop
  if not exists(select 1 from pg_attribute where attrelid='public.profiles'::regclass and attname=field.name and not attisdropped and format_type(atttypid,atttypmod)=field.type) then
   raise exception 'profiles column % has an incompatible type; inspect schema before billing repair',field.name;
  end if;
 end loop;
 -- Enforce one customer/subscription per profile. Duplicate existing values stop and roll back this migration.
 if not exists(select 1 from pg_index i join pg_attribute a on a.attrelid=i.indrelid and a.attnum=i.indkey[0] where i.indrelid='public.profiles'::regclass and i.indisunique and i.indisvalid and i.indnkeyatts=1 and i.indpred is null and i.indexprs is null and a.attname='stripe_customer_id') then
  create unique index toolgrain_profiles_stripe_customer_unique on public.profiles(stripe_customer_id);
 end if;
 if not exists(select 1 from pg_index i join pg_attribute a on a.attrelid=i.indrelid and a.attnum=i.indkey[0] where i.indrelid='public.profiles'::regclass and i.indisunique and i.indisvalid and i.indnkeyatts=1 and i.indpred is null and i.indexprs is null and a.attname='stripe_subscription_id') then
  create unique index toolgrain_profiles_stripe_subscription_unique on public.profiles(stripe_subscription_id);
 end if;
end;$$;
alter table public.profiles enable row level security;
revoke all on public.profiles from public,anon,authenticated;
-- Table-level revocation alone does not remove manually granted column privileges.
revoke all(id,email,plan,created_at,updated_at,stripe_customer_id,stripe_subscription_id,stripe_subscription_status,stripe_price_id,subscription_current_period_end) on public.profiles from public,anon,authenticated;
grant select(id,email,plan,created_at,updated_at,stripe_customer_id,stripe_subscription_id,stripe_subscription_status,stripe_price_id,subscription_current_period_end) on public.profiles to authenticated;
grant select,update on public.profiles to service_role;
-- Preserve the existing read-own policy. Install it only if no SELECT/ALL policy exists for authenticated users.
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='profiles' and cmd in ('SELECT','ALL') and ('authenticated'=any(roles) or 'public'=any(roles))) then
  create policy toolgrain_profiles_read_own on public.profiles for select to authenticated using ((select auth.uid())=id);
 end if;
end;$$;

-- Existing RLS and lack of browser INSERT/UPDATE/DELETE privileges remain unchanged.
create table if not exists public.billing_locks(user_id uuid primary key references public.profiles(id) on delete cascade,token uuid not null,expires_at timestamptz not null);
alter table public.billing_locks enable row level security;
revoke all on public.billing_locks from public,anon,authenticated;
create or replace function public.acquire_billing_lock(p_user uuid,p_token uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare acquired uuid;
begin
 insert into public.billing_locks(user_id,token,expires_at) values(p_user,p_token,now()+interval '120 seconds') on conflict(user_id) do update set token=excluded.token,expires_at=excluded.expires_at where public.billing_locks.expires_at<now() returning user_id into acquired;
 return acquired is not null;
end;$$;
create or replace function public.release_billing_lock(p_user uuid,p_token uuid) returns void language sql security definer set search_path='' as $$ delete from public.billing_locks where user_id=p_user and token=p_token; $$;
-- Conditional writes ensure an expired worker cannot overwrite a newer handler.
create or replace function public.write_billing_state(p_user uuid,p_token uuid,p_customer text,p_subscription text,p_status text,p_price text,p_end timestamptz,p_plan text) returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.billing_locks where user_id=p_user and token=p_token and expires_at>now() for update;
 if not found then return false;end if;
 update public.profiles set stripe_customer_id=p_customer,stripe_subscription_id=p_subscription,stripe_subscription_status=p_status,stripe_price_id=p_price,subscription_current_period_end=p_end,plan=p_plan where id=p_user and stripe_customer_id=p_customer;
 return found;
end;$$;
create or replace function public.link_billing_customer(p_user uuid,p_token uuid,p_customer text) returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.billing_locks where user_id=p_user and token=p_token and expires_at>now() for update;
 if not found then return false;end if;
 update public.profiles set stripe_customer_id=p_customer where id=p_user and (stripe_customer_id is null or stripe_customer_id=p_customer);
 return found;
end;$$;
revoke all on function public.acquire_billing_lock(uuid,uuid),public.release_billing_lock(uuid,uuid),public.write_billing_state(uuid,uuid,text,text,text,text,timestamptz,text),public.link_billing_customer(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.acquire_billing_lock(uuid,uuid),public.release_billing_lock(uuid,uuid),public.write_billing_state(uuid,uuid,text,text,text,text,timestamptz,text),public.link_billing_customer(uuid,uuid,text) to service_role;
-- Make new/replaced RPCs visible to PostgREST immediately after commit.
notify pgrst, 'reload schema';
commit;
