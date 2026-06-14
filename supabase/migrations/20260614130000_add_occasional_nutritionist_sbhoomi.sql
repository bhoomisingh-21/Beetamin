-- Occasional nutritionist: portal access via whitelist; hidden from client booking until is_active = true.
insert into public.nutritionists (name, email, bio, is_active)
values (
  'Bhoomi',
  'sbhoomi23bca@student.mes.ac.in',
  'Nutritionist (occasional access)',
  false
)
on conflict (email) do update set
  name = excluded.name,
  bio = excluded.bio;
