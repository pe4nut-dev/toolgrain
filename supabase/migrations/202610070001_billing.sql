begin;
alter table public.profiles add column stripe_customer_id text unique, add column stripe_subscription_id text unique, add column stripe_subscription_status text, add column stripe_price_id text, add column subscription_current_period_end timestamptz;
grant select(stripe_customer_id,stripe_subscription_id,stripe_subscription_status,stripe_price_id,subscription_current_period_end) on public.profiles to authenticated;
-- Existing RLS and lack of browser INSERT/UPDATE/DELETE privileges remain unchanged.
create table public.billing_locks(user_id uuid primary key references public.profiles(id) on delete cascade,token uuid not null,expires_at timestamptz not null);
alter table public.billing_locks enable row level security;
revoke all on public.billing_locks from public,anon,authenticated;
create function public.acquire_billing_lock(p_user uuid,p_token uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare acquired uuid;
begin
 insert into public.billing_locks(user_id,token,expires_at) values(p_user,p_token,now()+interval '120 seconds') on conflict(user_id) do update set token=excluded.token,expires_at=excluded.expires_at where public.billing_locks.expires_at<now() returning user_id into acquired;
 return acquired is not null;
end;$$;
create function public.release_billing_lock(p_user uuid,p_token uuid) returns void language sql security definer set search_path='' as $$ delete from public.billing_locks where user_id=p_user and token=p_token; $$;
-- Conditional writes ensure an expired worker cannot overwrite a newer handler.
create function public.write_billing_state(p_user uuid,p_token uuid,p_customer text,p_subscription text,p_status text,p_price text,p_end timestamptz,p_plan text) returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.billing_locks where user_id=p_user and token=p_token and expires_at>now() for update;
 if not found then return false;end if;
 update public.profiles set stripe_customer_id=p_customer,stripe_subscription_id=p_subscription,stripe_subscription_status=p_status,stripe_price_id=p_price,subscription_current_period_end=p_end,plan=p_plan where id=p_user and stripe_customer_id=p_customer;
 return found;
end;$$;
create function public.link_billing_customer(p_user uuid,p_token uuid,p_customer text) returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.billing_locks where user_id=p_user and token=p_token and expires_at>now() for update;
 if not found then return false;end if;
 update public.profiles set stripe_customer_id=p_customer where id=p_user and (stripe_customer_id is null or stripe_customer_id=p_customer);
 return found;
end;$$;
revoke all on function public.acquire_billing_lock(uuid,uuid),public.release_billing_lock(uuid,uuid),public.write_billing_state(uuid,uuid,text,text,text,text,timestamptz,text),public.link_billing_customer(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.acquire_billing_lock(uuid,uuid),public.release_billing_lock(uuid,uuid),public.write_billing_state(uuid,uuid,text,text,text,text,timestamptz,text),public.link_billing_customer(uuid,uuid,text) to service_role;
commit;
