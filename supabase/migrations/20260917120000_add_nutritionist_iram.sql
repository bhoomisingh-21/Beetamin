-- Add Iram Khan as an active nutritionist (portal login + client booking).
-- clerk_user_id is linked on first Google sign-in.

insert into public.nutritionists (name, email, bio, is_active)
values (
  'Iram Khan',
  'iramkhan23497@gmail.com',
  'Clinical nutritionist',
  true
)
on conflict (email) do update set
  name = excluded.name,
  bio = excluded.bio,
  is_active = true;
