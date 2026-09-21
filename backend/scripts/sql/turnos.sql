-- Ejecutar en Supabase → SQL Editor.
--
-- Esta tabla figura en PROJECT_REPORT.md pero NO existe en el proyecto de
-- Supabase actual (verificado con un SELECT real: "Could not find the table
-- 'public.turnos'"). Sin ella, todo el flujo de turnos falla con 500:
-- proponer, aceptar, listar, TurnosPage y el botón de Google Calendar.
--
-- Columnas = las que turnosController.js inserta/lee (incluye updated_at, que
-- actualizarTurno escribe en cada update). RLS deshabilitado como el resto.

create table if not exists turnos (
  id               uuid primary key default gen_random_uuid(),
  caso_id          uuid not null references casos(id)       on delete cascade,
  estudiante_id    uuid not null references estudiantes(id) on delete cascade,
  paciente_id      uuid not null references pacientes(id)   on delete cascade,
  fecha            date not null,
  hora             time not null,
  duracion_minutos integer not null default 60,
  estado           text not null default 'pendiente'
                   check (estado in ('pendiente','propuesto','confirmado','completado','cancelado','rechazado')),
  propuesto_por    text check (propuesto_por in ('estudiante','paciente')),
  notas            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Chequeo de disponibilidad: turnos de un estudiante en una fecha
create index if not exists idx_turnos_estudiante_fecha on turnos (estudiante_id, fecha);
-- Listados por paciente
create index if not exists idx_turnos_paciente_fecha   on turnos (paciente_id, fecha);
create index if not exists idx_turnos_caso             on turnos (caso_id);
