-- clerk_user_id is only set when the nutritionist first signs in with Google
-- (getOrCreateNutritionist links it). Allow NULL so we can pre-create their row.
alter table public.nutritionists alter column clerk_user_id drop not null;

-- Register two real nutritionists. Names/bios are placeholders — edit them in
-- the admin UI (/admin/nutritionists) since they are shown to clients at booking.
insert into public.nutritionists (name, email, bio, is_active)
values
  ('Jyoti Dahiya', 'dtjyotidahiya@gmail.com', 'Clinical nutritionist', true),
  ('Nausheen Shaikh', 'nausheen1shaikh@gmail.com', 'Clinical nutritionist', true)
on conflict (email) do nothing;
