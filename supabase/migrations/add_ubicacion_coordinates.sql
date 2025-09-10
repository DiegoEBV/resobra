-- Agregar columnas de coordenadas de ubicación a la tabla actividades
ALTER TABLE actividades 
ADD COLUMN IF NOT EXISTS ubicacion_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS ubicacion_lng DECIMAL(11, 8);

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN actividades.ubicacion_lat IS 'Latitud de la ubicación de la actividad';
COMMENT ON COLUMN actividades.ubicacion_lng IS 'Longitud de la ubicación de la actividad';

-- Migrar datos existentes del campo jsonb ubicacion a las nuevas columnas
UPDATE actividades 
SET 
  ubicacion_lat = CAST(ubicacion->>'lat' AS DECIMAL(10, 8)),
  ubicacion_lng = CAST(ubicacion->>'lng' AS DECIMAL(11, 8))
WHERE ubicacion IS NOT NULL 
  AND ubicacion->>'lat' IS NOT NULL 
  AND ubicacion->>'lng' IS NOT NULL;

-- Otorgar permisos a los roles anon y authenticated
GRANT SELECT, INSERT, UPDATE ON actividades TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON actividades TO authenticated;