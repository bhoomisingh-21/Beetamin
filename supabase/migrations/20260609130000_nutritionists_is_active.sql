-- Allow admins to deactivate a nutritionist without deleting history (appointments FK).
alter table public.nutritionists
  add column if not exists is_active boolean not null default true;

comment on column public.nutritionists.is_active is
  'Inactive nutritionists are hidden from new bookings but keep their history.';
