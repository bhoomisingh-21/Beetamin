-- Iram's login email is iramarif23497@gmail.com (not iramkhan).

update public.nutritionists
set
  email = 'iramarif23497@gmail.com',
  name = 'Iram Arif',
  bio = 'Clinical nutritionist',
  is_active = true
where lower(email) = 'iramkhan23497@gmail.com'
  and not exists (
    select 1 from public.nutritionists where lower(email) = 'iramarif23497@gmail.com'
  );

insert into public.nutritionists (name, email, bio, is_active)
values (
  'Iram Arif',
  'iramarif23497@gmail.com',
  'Clinical nutritionist',
  true
)
on conflict (email) do update set
  name = excluded.name,
  bio = excluded.bio,
  is_active = true;
