alter table public.profiles
add column if not exists full_name text,
add column if not exists school text,
add column if not exists location text,
add column if not exists age int;
