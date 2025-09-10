-- Migración para agregar columnas faltantes en la tabla actividades
-- Fecha: 2024-12-09
-- Descripción: Agregar columnas que el frontend está enviando pero no existen en la tabla

-- Campos que el frontend envía pero faltan en la tabla:
-- progreso_inicial: DECIMAL para almacenar el progreso inicial de la actividad
-- ubicacion_inicio: JSONB para almacenar coordenadas del punto inicial
-- ubicacion_fin: JSONB para almacenar coordenadas del punto final
-- responsable: VARCHAR para almacenar el responsable de la actividad
-- estado: VARCHAR para almacenar el estado de la actividad
-- observaciones: TEXT para observaciones adicionales
-- fecha: DATE para la fecha de la actividad
-- tipo_actividad: VARCHAR para el tipo de actividad

ALTER TABLE actividades 
ADD COLUMN IF NOT EXISTS progreso_inicial DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS ubicacion_inicio JSONB,
ADD COLUMN IF NOT EXISTS ubicacion_fin JSONB,
ADD COLUMN IF NOT EXISTS responsable VARCHAR(255),
ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'programado',
ADD COLUMN IF NOT EXISTS observaciones TEXT,
ADD COLUMN IF NOT EXISTS fecha DATE,
ADD COLUMN IF NOT EXISTS tipo_actividad VARCHAR(100);

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN actividades.progreso_inicial IS 'Progreso inicial de la actividad en porcentaje';
COMMENT ON COLUMN actividades.ubicacion_inicio IS 'Coordenadas del punto inicial de la actividad';
COMMENT ON COLUMN actividades.ubicacion_fin IS 'Coordenadas del punto final de la actividad';
COMMENT ON COLUMN actividades.responsable IS 'Persona responsable de la actividad';
COMMENT ON COLUMN actividades.estado IS 'Estado actual de la actividad';
COMMENT ON COLUMN actividades.observaciones IS 'Observaciones adicionales sobre la actividad';
COMMENT ON COLUMN actividades.fecha IS 'Fecha programada para la actividad';
COMMENT ON COLUMN actividades.tipo_actividad IS 'Tipo o categoría de la actividad';

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'actividades' 
AND table_schema = 'public'
ORDER BY ordinal_position;