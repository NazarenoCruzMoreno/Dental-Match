-- ============================================================
-- DENTAL MATCH — Schema completo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('estudiante', 'paciente', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de estudiantes
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de pacientes
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de asignaciones
CREATE TABLE IF NOT EXISTS asignaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estudiante_id UUID REFERENCES estudiantes(id),
  paciente_id UUID REFERENCES pacientes(id),
  creador_id TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'completado', 'cancelado')),
  fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
  notas TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deshabilitar RLS (usamos auth propia con JWT)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes DISABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones DISABLE ROW LEVEL SECURITY;
