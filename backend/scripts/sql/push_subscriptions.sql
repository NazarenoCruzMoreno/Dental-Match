-- Ejecutar en Supabase → SQL Editor.
--
-- Una fila por DISPOSITIVO/navegador suscripto (un usuario puede tener varios:
-- celular, notebook, etc.), no una por usuario.
--
-- `endpoint` está duplicado a propósito fuera del jsonb: es la identidad única
-- de la suscripción, y con una columna común se puede hacer upsert
-- (onConflict: 'endpoint') — supabase-js no puede usar como clave de conflicto
-- una expresión sobre el jsonb. Así, suscribirse dos veces desde el mismo
-- navegador actualiza la fila en vez de duplicarla.
--
-- RLS deshabilitado, igual que el resto: la seguridad la hace el backend.

create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  endpoint     text not null unique,
  subscription jsonb not null,   -- objeto completo de PushSubscription (endpoint + keys)
  created_at   timestamptz not null default now()
);

-- Buscar todas las suscripciones de un usuario al mandarle un push
create index if not exists idx_push_subscriptions_user on push_subscriptions (user_id);
