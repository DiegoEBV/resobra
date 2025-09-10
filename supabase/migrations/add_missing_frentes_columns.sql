-- Agregar columnas faltantes a la tabla frentes
ALTER TABLE frentes 
ADD COLUMN IF NOT EXISTS ubicacion_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS ubicacion_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS fecha_inicio DATE;

-- Agregar comentarios para documentar las nuevas columnas
COMMENT ON COLUMN frentes.ubicacion_lat IS 'Latitud de la ubicación del frente de trabajo';
COMMENT ON COLUMN frentes.ubicacion_lng IS 'Longitud de la ubicación del frente de trabajo';
COMMENT ON COLUMN frentes.fecha_inicio IS 'Fecha de inicio del frente de trabajo';

-- Verificar permisos para las nuevas columnas
GRANT SELECT, INSERT, UPDATE ON frentes TO authenticated;
GRANT SELECT ON frentes TO anon;