-- Run only against a local/test database after both migrations. All fixtures roll back.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(8);
insert into auth.users(id,email,raw_user_meta_data) values('33333333-3333-4333-8333-333333333333','billing-test@example.invalid','{}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
select throws_ok($$update public.profiles set stripe_customer_id='cus_fake'$$,'42501',null,'customer cannot be changed by browser');
select throws_ok($$update public.profiles set stripe_subscription_id='sub_fake'$$,'42501',null,'subscription cannot be changed');
select throws_ok($$update public.profiles set stripe_subscription_status='active'$$,'42501',null,'status cannot be changed');
select throws_ok($$update public.profiles set stripe_price_id='price_fake'$$,'42501',null,'price cannot be changed');
select throws_ok($$update public.profiles set subscription_current_period_end=now()$$,'42501',null,'period cannot be changed');
select throws_ok($$update public.profiles set plan='pro'$$,'42501',null,'plan cannot be changed');
select throws_ok($$select public.acquire_billing_lock('33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444')$$,'42501',null,'browser cannot lock billing');
select throws_ok($$select * from public.billing_locks$$,'42501',null,'billing locks are private');
reset role;
select * from finish();
rollback;
