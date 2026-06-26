drop policy if exists "Usuarios pueden leer su perfil" on public.profiles;

drop function if exists public.profile_email_exists_for_current_user();
drop function if exists public.profile_email_exists_for_current_user(text);
drop function if exists public.current_auth_email();

create or replace function public.current_auth_email()
returns text
language sql
security definer
stable
set search_path = public, auth
as $$
  select lower(trim(u.email))
  from auth.users u
  where u.id = auth.uid();
$$;

create or replace function public.profile_email_exists_for_current_user()
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where lower(trim(p.email)) = public.current_auth_email()
  );
$$;

grant execute on function public.current_auth_email() to authenticated;
grant execute on function public.profile_email_exists_for_current_user() to authenticated;

create policy "Usuarios pueden leer su perfil"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or lower(trim(email)) = public.current_auth_email()
);
