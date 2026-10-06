-- Run only on a local/test Supabase database after the migration (supabase test db).
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);
insert into auth.users(id,email,raw_user_meta_data) values
 ('11111111-1111-4111-8111-111111111111','one@example.invalid','{"plan":"pro"}'),
 ('22222222-2222-4222-8222-222222222222','two@example.invalid','{}');
select is((select plan from public.profiles where id='11111111-1111-4111-8111-111111111111'),'free','Signup metadata cannot promote to Pro');
select is((select email from public.profiles where id='11111111-1111-4111-8111-111111111111'),'one@example.invalid','Trigger creates profile');
update auth.users set email='updated@example.invalid' where id='11111111-1111-4111-8111-111111111111';
select is((select email from public.profiles where id='11111111-1111-4111-8111-111111111111'),'updated@example.invalid','Auth email stays synchronized');
set local role authenticated;
set local request.jwt.claims='{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select is((select count(*)::int from public.profiles),1,'RLS exposes only own profile');
select is((select count(*)::int from public.profiles where id='22222222-2222-4222-8222-222222222222'),0,'Other profile cannot be read');
select throws_ok($$update public.profiles set plan='pro' where id='11111111-1111-4111-8111-111111111111'$$,'42501',null,'Client cannot update plan');
select throws_ok($$insert into public.profiles(id,plan) values('33333333-3333-4333-8333-333333333333','pro')$$,'42501',null,'Client cannot insert Pro profile');
select throws_ok($$delete from public.profiles where id='11111111-1111-4111-8111-111111111111'$$,'42501',null,'Client cannot delete profile');
reset role;
set local role anon;
select throws_ok($$select * from public.profiles$$,'42501',null,'Anonymous profile reads are denied');
reset role;
delete from auth.users where id='11111111-1111-4111-8111-111111111111';
select is((select count(*)::int from public.profiles where id='11111111-1111-4111-8111-111111111111'),0,'Auth deletion cascades to profile');
select * from finish();
rollback;
