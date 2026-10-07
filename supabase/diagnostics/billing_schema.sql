-- Read-only production inspection. Run in Supabase SQL Editor before/after the repair.
select name, to_regclass(name) is not null as present from (values ('public.profiles'),('public.billing_locks')) objects(name);
select signature,to_regprocedure(signature) is not null as present,
 case when to_regprocedure(signature) is not null then has_function_privilege('service_role',to_regprocedure(signature),'EXECUTE') end as service_role_can_execute,
 case when to_regprocedure(signature) is not null then has_function_privilege('authenticated',to_regprocedure(signature),'EXECUTE') end as browser_can_execute
from (values ('public.acquire_billing_lock(uuid,uuid)'),('public.release_billing_lock(uuid,uuid)'),('public.link_billing_customer(uuid,uuid,text)'),('public.write_billing_state(uuid,uuid,text,text,text,text,timestamp with time zone,text)')) functions(signature);
select table_name,column_name,data_type from information_schema.columns where table_schema='public' and table_name in ('profiles','billing_locks') order by table_name,ordinal_position;
select a.attname as billing_column,exists(select 1 from pg_index i where i.indrelid=a.attrelid and i.indisunique and i.indisvalid and i.indnkeyatts=1 and i.indkey[0]=a.attnum and i.indpred is null and i.indexprs is null) as unique_enforced from pg_attribute a where a.attrelid='public.profiles'::regclass and a.attname in ('stripe_customer_id','stripe_subscription_id');
select tablename,rowsecurity from pg_tables where schemaname='public' and tablename in ('profiles','billing_locks');
select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public' and tablename in ('profiles','billing_locks');
select has_table_privilege('service_role','public.profiles','SELECT') as admin_can_read_profiles,has_table_privilege('service_role','public.profiles','UPDATE') as admin_can_write_profiles,has_any_column_privilege('authenticated','public.profiles','UPDATE') as browser_can_update,has_table_privilege('authenticated','public.profiles','INSERT') as browser_can_insert;
