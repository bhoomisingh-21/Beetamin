-- ============================================================================
-- ONE-OFF TEST-DATA CLEANUP  (run manually in the Supabase SQL editor)
-- ----------------------------------------------------------------------------
-- DO NOT put this in supabase/migrations — it must NOT run automatically.
--
-- Scope (as confirmed):
--   * KEEP clients that are real customers:
--       - have an ACTIVE purchase, OR
--       - have generated a paid (Rs.39) report   <-- remove the paid_reports lines for a stricter wipe
--   * DELETE all other clients + their panel data
--     (appointments, notes, documents, diet plans, progress logs)
--   * KEEP billing tables (purchases, paid_reports, leads)
--   * KEEP only the two real nutritionists (Jyoti, Nausheen); delete all others
--
-- PRE-REQUISITES (run FIRST, in order):
--   1. Migration 20260609130000_nutritionists_is_active.sql
--   2. Migration 20260609140000_add_real_nutritionists.sql   <-- so Jyoti & Nausheen
--      EXIST before Phase B, otherwise Phase B would leave you with ZERO nutritionists.
--
-- NOTE: no temp tables (Supabase SQL editor drops ON COMMIT DROP temps between
-- statements). The "keep" rule is inlined as a subquery in every statement.
--
-- This is IRREVERSIBLE. Take a backup / snapshot before running.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- PHASE A — remove non-real clients and their panel data
-- A client is KEPT when it has an active purchase OR a paid report.
-- ─────────────────────────────────────────────────────────────────────────
begin;

delete from public.diet_plans d
where not exists (
  select 1 from public.clients c
  where c.id = d.client_id
    and ( exists (select 1 from public.purchases p where p.user_id = c.clerk_user_id and p.status = 'active')
       or exists (select 1 from public.paid_reports pr where pr.user_id = c.clerk_user_id) )
);

delete from public.client_documents cd
where not exists (
  select 1 from public.clients c
  where lower(c.email) = lower(cd.client_email)
    and ( exists (select 1 from public.purchases p where p.user_id = c.clerk_user_id and p.status = 'active')
       or exists (select 1 from public.paid_reports pr where pr.user_id = c.clerk_user_id) )
);

delete from public.nutritionist_notes n
where not exists (
  select 1 from public.clients c
  where lower(c.email) = lower(n.client_email)
    and ( exists (select 1 from public.purchases p where p.user_id = c.clerk_user_id and p.status = 'active')
       or exists (select 1 from public.paid_reports pr where pr.user_id = c.clerk_user_id) )
);

delete from public.appointments a
where not exists (
  select 1 from public.clients c
  where c.id = a.client_id
    and ( exists (select 1 from public.purchases p where p.user_id = c.clerk_user_id and p.status = 'active')
       or exists (select 1 from public.paid_reports pr where pr.user_id = c.clerk_user_id) )
);

delete from public.progress_logs pl
where not exists (
  select 1 from public.clients c
  where ( c.clerk_user_id = pl.user_id or lower(c.email) = lower(pl.client_email) )
    and ( exists (select 1 from public.purchases p where p.user_id = c.clerk_user_id and p.status = 'active')
       or exists (select 1 from public.paid_reports pr where pr.user_id = c.clerk_user_id) )
);

delete from public.clients c
where not (
  exists (select 1 from public.purchases p where p.user_id = c.clerk_user_id and p.status = 'active')
  or exists (select 1 from public.paid_reports pr where pr.user_id = c.clerk_user_id)
);

commit;

-- ─────────────────────────────────────────────────────────────────────────
-- PHASE B — keep ONLY the two real nutritionists, remove all test ones
-- (Make sure the add-nutritionists migration has already run!)
-- ─────────────────────────────────────────────────────────────────────────
begin;

delete from public.diet_plans
where nutritionist_id in (
  select id from public.nutritionists
  where lower(email) not in ('dtjyotidahiya@gmail.com', 'nausheen1shaikh@gmail.com')
);

delete from public.client_documents
where nutritionist_id in (
  select id from public.nutritionists
  where lower(email) not in ('dtjyotidahiya@gmail.com', 'nausheen1shaikh@gmail.com')
);

delete from public.nutritionist_notes
where nutritionist_id in (
  select id from public.nutritionists
  where lower(email) not in ('dtjyotidahiya@gmail.com', 'nausheen1shaikh@gmail.com')
);

delete from public.appointments
where nutritionist_id in (
  select id from public.nutritionists
  where lower(email) not in ('dtjyotidahiya@gmail.com', 'nausheen1shaikh@gmail.com')
);

delete from public.availability
where nutritionist_id in (
  select id from public.nutritionists
  where lower(email) not in ('dtjyotidahiya@gmail.com', 'nausheen1shaikh@gmail.com')
);

delete from public.nutritionists
where lower(email) not in ('dtjyotidahiya@gmail.com', 'nausheen1shaikh@gmail.com');

commit;

-- ─────────────────────────────────────────────────────────────────────────
-- VERIFY
-- ─────────────────────────────────────────────────────────────────────────
select 'nutritionists' as table_name, count(*) from public.nutritionists
union all select 'clients',       count(*) from public.clients
union all select 'appointments',  count(*) from public.appointments
union all select 'diet_plans',    count(*) from public.diet_plans
union all select 'documents',     count(*) from public.client_documents
union all select 'notes',         count(*) from public.nutritionist_notes
union all select 'progress_logs', count(*) from public.progress_logs;

select id, name, email, is_active from public.nutritionists order by name;
