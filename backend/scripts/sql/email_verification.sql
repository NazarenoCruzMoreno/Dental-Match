-- Ejecutar en Supabase → SQL Editor.

-- La verificación vive en `users` (no en estudiantes/pacientes: esas filas
-- todavía no existen al momento del registro, y login siempre consulta users).
-- default TRUE para no bloquear cuentas ya existentes (seed + reales) —
-- el registro nuevo inserta explícitamente email_verificado = false.
alter table users add column if not exists email_verificado boolean not null default true;

create table if not exists email_verifications (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  token      text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_verifications_token on email_verifications (token);
