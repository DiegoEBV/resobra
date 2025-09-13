-- Agregar columna coordenadas_intermedias a la tabla frentes para soporte de curvas
-- Esta columna almacenará puntos de control intermedios para definir rutas con curvas

ALTER TABLE frentes 
ADD COLUMN IF NOT EXISTS coordenadas_intermedias JSONB;

-- Agregar comentario para documentar la nueva columna
COMMENT ON COLUMN frentes.coordenadas_intermedias IS 'Array de puntos de control intermedios para curvas. Formato: [{"lat": number, "lng": number, "kilometraje": number}]';

-- Crear índice para mejorar el rendimiento de consultas sobre coordenadas intermedias
CREATE INDEX IF NOT EXISTS idx_frentes_coordenadas_intermedias 
ON frentes USING GIN (coordenadas_intermedias);

-- Verificar permisos para la nueva columna
GRANT SELECT, INSERT, UPDATE ON frentes TO authenticated;
GRANT SELECT ON frentes TO anon;

-- Verificar la estructura actualizada de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'frentes' 
AND column_name = 'coordenadas_intermedias';

-- Ejemplo de datos de prueba (comentado para no ejecutar automáticamente)
/*
UPDATE frentes 
SET coordenadas_intermedias = '[
  {"lat": 4.6110, "lng": -74.0800, "kilometraje": 0.1},
  {"lat": 4.6125, "lng": -74.0785, "kilometraje": 0.25},
  {"lat": 4.6140, "lng": -74.0770, "kilometraje": 0.4}
]'::jsonb
WHERE nombre = 'Frente de Pavimentación';
*/