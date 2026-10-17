-- ============================================================================
-- DENTAL MATCH — Estructura completa de la base de datos (Supabase / Postgres)
--
-- Cómo usarlo: Supabase → SQL Editor → pegar TODO este archivo → Run.
-- Se puede correr más de una vez: usa IF NOT EXISTS, así que no pisa nada ni
-- borra datos. Sobre una base vacía crea las 14 tablas, los índices y el bucket
-- de imágenes. Sobre una base creada con una versión anterior, agrega lo que falta.
--
-- Fuente: las columnas, tipos, defaults y claves foráneas replican la base de
-- producción (verificado comparando contra la API de Supabase). Lo que la API no
-- permite leer —restricciones CHECK de algunas tablas, ON DELETE de las claves
-- foráneas nuevas e índices— se eligió acá; está marcado en cada caso.
--
-- La seguridad la hace el backend (JWT + roles) con la service_role key, que
-- ignora RLS. Por eso RLS queda deshabilitado, como siempre estuvo en el proyecto.
-- ============================================================================

-- ── Usuarios y perfiles ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('estudiante', 'paciente', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- La verificación vive en users (no en los perfiles: esas filas no existen al
  -- registrarse y login siempre consulta users). DEFAULT TRUE para no bloquear
  -- cuentas existentes; el registro nuevo inserta email_verificado = false.
  email_verificado BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS estudiantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  universidad TEXT NOT NULL,
  anio_carrera INTEGER CHECK (anio_carrera BETWEEN 1 AND 6),
  materias TEXT[] NOT NULL DEFAULT '{}',
  disponibilidad TEXT[] NOT NULL DEFAULT '{}',
  descripcion TEXT NOT NULL,
  rating NUMERIC DEFAULT 0,
  pacientes_atendidos INTEGER DEFAULT 0,
  imagen_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pacientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  edad INTEGER NOT NULL,
  telefono TEXT,
  problema_dental TEXT NOT NULL,
  imagen_url TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'asignado', 'completado')),
  rating NUMERIC DEFAULT 0,
  turnos_completados INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Casos clínicos y postulaciones ──────────────────────────────────────────
-- (Sin CHECK en los estados: el código escribe varios valores y producción no los
-- restringe a nivel base. ON DELETE elegido: borrar un paciente borra sus casos;
-- borrar un estudiante deja el caso sin asignar.)

CREATE TABLE IF NOT EXISTS casos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  estudiante_id UUID REFERENCES estudiantes(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  tipo_tratamiento TEXT,
  estado TEXT DEFAULT 'abierto',          -- abierto | en_progreso | completado | cancelado
  imagen_url TEXT,
  notas TEXT,
  es_analisis BOOLEAN DEFAULT FALSE,
  diagnostico TEXT,
  tratamiento_asignado TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aplicaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
  mensaje TEXT,
  estado TEXT DEFAULT 'pendiente',        -- pendiente | aceptado | rechazado
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asignaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estudiante_id UUID REFERENCES estudiantes(id),
  paciente_id UUID REFERENCES pacientes(id),
  creador_id TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'completado', 'cancelado')),
  fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
  notas TEXT DEFAULT ''
);

-- ── Turnos ──────────────────────────────────────────────────────────────────
-- Columnas = las que turnosController.js inserta y lee (updated_at se escribe en
-- cada actualización). Una propuesta rechazada o cancelada libera el horario.

CREATE TABLE IF NOT EXISTS turnos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id          UUID NOT NULL REFERENCES casos(id)       ON DELETE CASCADE,
  estudiante_id    UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
  paciente_id      UUID NOT NULL REFERENCES pacientes(id)   ON DELETE CASCADE,
  fecha            DATE NOT NULL,
  hora             TIME NOT NULL,
  duracion_minutos INTEGER NOT NULL DEFAULT 60,
  estado           TEXT NOT NULL DEFAULT 'pendiente'
                   CHECK (estado IN ('pendiente','propuesto','confirmado','completado','cancelado','rechazado')),
  propuesto_por    TEXT CHECK (propuesto_por IN ('estudiante','paciente')),
  notas            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Reseñas y chat ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,                -- la API valida 1 a 5
  comment TEXT,
  direccion TEXT DEFAULT 'paciente_a_estudiante',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notificaciones y push ───────────────────────────────────────────────────
-- Los nombres de columna son los que el código usa (type / title / message / read).

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,               -- match | asignacion | turno | turno_propuesto | caso_completado
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Una fila por DISPOSITIVO suscripto. `endpoint` se repite fuera del jsonb a
-- propósito: es la identidad única y permite upsert (onConflict: 'endpoint').
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint     TEXT NOT NULL UNIQUE,
  subscription JSONB NOT NULL,            -- objeto completo de PushSubscription (endpoint + keys)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Verificación de email y recuperación de contraseña ──────────────────────

CREATE TABLE IF NOT EXISTS email_verifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_resets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Imágenes ya subidas (evita guardar dos veces el mismo archivo) ──────────

CREATE TABLE IF NOT EXISTS image_hashes (
  hash        TEXT PRIMARY KEY,           -- SHA-256 del archivo
  url         TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Actualización de bases creadas con una versión anterior ─────────────────
-- (CREATE TABLE IF NOT EXISTS no agrega columnas a una tabla que ya existe.)

ALTER TABLE users       ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS imagen_url TEXT;
ALTER TABLE pacientes   ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0;
ALTER TABLE pacientes   ADD COLUMN IF NOT EXISTS turnos_completados INTEGER DEFAULT 0;

-- ── Índices (las consultas del backend filtran y ordenan por estas columnas) ─
-- Los índices de producción no se pueden leer desde la API; estos son los que
-- convienen según cómo consulta el código.

CREATE INDEX IF NOT EXISTS idx_casos_paciente             ON casos (paciente_id);
CREATE INDEX IF NOT EXISTS idx_casos_estudiante           ON casos (estudiante_id);
CREATE INDEX IF NOT EXISTS idx_casos_estado               ON casos (estado);
CREATE INDEX IF NOT EXISTS idx_aplicaciones_caso          ON aplicaciones (caso_id);
CREATE INDEX IF NOT EXISTS idx_aplicaciones_estudiante    ON aplicaciones (estudiante_id);
CREATE INDEX IF NOT EXISTS idx_reviews_estudiante         ON reviews (estudiante_id);
CREATE INDEX IF NOT EXISTS idx_messages_caso_created      ON messages (caso_id, created_at);
CREATE INDEX IF NOT EXISTS idx_turnos_estudiante_fecha    ON turnos (estudiante_id, fecha);
CREATE INDEX IF NOT EXISTS idx_turnos_paciente_fecha      ON turnos (paciente_id, fecha);
CREATE INDEX IF NOT EXISTS idx_turnos_caso                ON turnos (caso_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread  ON notifications (user_id) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user    ON push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email  ON email_verifications (email);
CREATE INDEX IF NOT EXISTS idx_password_resets_email      ON password_resets (email);

-- ── Deshabilitar RLS (la seguridad la hace el backend con JWT) ──────────────

ALTER TABLE users               DISABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes         DISABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes           DISABLE ROW LEVEL SECURITY;
ALTER TABLE casos               DISABLE ROW LEVEL SECURITY;
ALTER TABLE aplicaciones        DISABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones        DISABLE ROW LEVEL SECURITY;
ALTER TABLE turnos              DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews             DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages            DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       DISABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets     DISABLE ROW LEVEL SECURITY;
ALTER TABLE image_hashes        DISABLE ROW LEVEL SECURITY;

-- ── Bucket de Storage para las imágenes de perfiles y casos ─────────────────
-- Tiene que ser público: el backend guarda la URL pública (getPublicUrl).
-- Solo funciona en Supabase (el esquema "storage" no existe en un Postgres común).

INSERT INTO storage.buckets (id, name, public)
VALUES ('dental-match', 'dental-match', TRUE)
ON CONFLICT (id) DO NOTHING;
