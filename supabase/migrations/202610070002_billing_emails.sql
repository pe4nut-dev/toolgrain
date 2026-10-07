-- Run in Supabase SQL Editor before deploying billing emails. Safe to re-run.
begin;
create table if not exists public.billing_email_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 stripe_subscription_id text not null,
 email_type text not null default 'pro_activation' check(email_type='pro_activation'),
 stripe_price_id text not null,
 subscription_current_period_end timestamptz,
 stripe_event_id text,
 livemode boolean,
 status text not null default 'pending' check(status in ('pending','sending','sent','failed','unavailable')),
 diagnostic_code text,
 created_at timestamptz not null default now(),
 attempted_at timestamptz,
 completed_at timestamptz,
 unique(stripe_subscription_id,email_type)
);
alter table public.billing_email_events enable row level security;
revoke all on public.billing_email_events from public,anon,authenticated;
grant select,update on public.billing_email_events to service_role;
-- Queue when the resulting billing row is complete; separate updates are supported.
create or replace function public.queue_pro_activation_email() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.plan='pro' and new.stripe_subscription_id is not null and new.stripe_price_id is not null then
  insert into public.billing_email_events(user_id,stripe_subscription_id,stripe_price_id,subscription_current_period_end)
  values(new.id,new.stripe_subscription_id,new.stripe_price_id,new.subscription_current_period_end)
  on conflict(stripe_subscription_id,email_type) do nothing;
 end if;
 return new;
exception when others then
 -- Email infrastructure must never roll back entitlement. No raw SQL error/details.
 raise warning 'Toolgrain billing email enqueue failed';
 return new;
end;$$;
revoke all on function public.queue_pro_activation_email() from public,anon,authenticated;
drop trigger if exists toolgrain_queue_pro_activation_email on public.profiles;
create trigger toolgrain_queue_pro_activation_email after update of plan,stripe_subscription_id,stripe_price_id,subscription_current_period_end on public.profiles
for each row execute function public.queue_pro_activation_email();
-- One persistent claim before SMTP. Never automatically re-claim an ambiguous sending/failed row.
create or replace function public.claim_pro_activation_email(p_user uuid,p_subscription text,p_event text,p_live boolean)
returns table(id uuid,recipient_email text,stripe_price_id text,subscription_current_period_end timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 return query
 with claimed as (
  update public.billing_email_events e set status='sending',attempted_at=now(),stripe_event_id=p_event,livemode=p_live
  where e.user_id=p_user and e.stripe_subscription_id=p_subscription and e.email_type='pro_activation' and e.status='pending'
  and exists(select 1 from public.profiles p where p.id=p_user and p.plan='pro' and p.stripe_subscription_id=p_subscription)
  returning e.id,e.user_id,e.stripe_price_id,e.subscription_current_period_end
 ) select c.id,u.email::text,c.stripe_price_id,c.subscription_current_period_end from claimed c
 left join auth.users u on u.id=c.user_id;
end;$$;
revoke all on function public.claim_pro_activation_email(uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.claim_pro_activation_email(uuid,text,text,boolean) to service_role;
notify pgrst,'reload schema';
commit;
