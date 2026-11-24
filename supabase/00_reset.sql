-- =====================================================================
--  00_reset.sql  |  OPTIONAL. Run ONLY if you ran the OLD schema before.
--  WARNING: this erases every table and all data in the "public" schema
--  (your test courses, enrollments, etc.). Accounts in Authentication are kept.
--  Then run 01_schema.sql, 02_security.sql and 03_seed.sql in order.
-- =====================================================================
drop schema public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
