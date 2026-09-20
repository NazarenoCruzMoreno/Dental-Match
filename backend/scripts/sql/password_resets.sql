-- Ejecutar en Supabase → SQL Editor.
-- Sigue el mismo patrón que el resto de las tablas del proyecto: RLS
-- deshabilitado, la seguridad la hace el backend con la service_role key.

create table if not exists password_resets (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  token      text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_resets_token on password_resets (token);
create index if not exists idx_password_resets_email on password_resets (email);
