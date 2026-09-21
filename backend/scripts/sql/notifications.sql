-- Ejecutar en Supabase → SQL Editor.
--
-- OJO con los nombres de columna: son los que el código YA usa (type / title /
-- message / read), no tipo / mensaje / leido. 6 lugares del backend insertan
-- con estos nombres (aplicaciones.js, asignacionesController, casosController,
-- turnosController x3), más notifications.js (GET/PUT) y NotificationsBell.jsx
-- en el frontend. Con nombres distintos, cada insert fallaría en silencio.
--
-- Mismo patrón que el resto de las tablas: RLS deshabilitado, la seguridad la
-- hace el backend con la service_role key.

create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  type       text not null,            -- match | asignacion | turno | turno_propuesto | caso_completado
  title      text not null,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- GET /api/notifications: filtra por user_id y ordena por created_at desc
create index if not exists idx_notifications_user_created
  on notifications (user_id, created_at desc);

-- PUT /api/notifications/read: solo toca las no leídas del usuario
create index if not exists idx_notifications_user_unread
  on notifications (user_id) where read = false;
