-- Crear datos de ejemplo para obras y frentes

-- Insertar obra de ejemplo
INSERT INTO obras (id, nombre, descripcion, ubicacion, fecha_inicio, fecha_fin_estimada, estado)
VALUES (
  gen_random_uuid(),
  'Carretera Principal Norte',
  'Construcción y mejoramiento de carretera principal del sector norte',
  'Sector Norte - Km 0+000 a 25+000',
  '2024-01-01',
  '2024-12-31',
  'activa'
);

-- Obtener el ID de la obra recién creada para usarlo en frentes
WITH obra_creada AS (
  SELECT id FROM obras WHERE nombre = 'Carretera Principal Norte' LIMIT 1
)
-- Insertar frentes de ejemplo
INSERT INTO frentes (id, obra_id, nombre, descripcion, coordenadas_gps, estado)
SELECT 
  gen_random_uuid(),
  obra_creada.id,
  'Frente A - Km 0+000 - 5+000',
  'Primer tramo de la carretera principal',
  '{"lat": -12.0464, "lng": -77.0428}'::jsonb,
  'activo'
FROM obra_creada

UNION ALL

SELECT 
  gen_random_uuid(),
  obra_creada.id,
  'Frente B - Km 5+000 - 10+000',
  'Segundo tramo de la carretera principal',
  '{"lat": -12.0564, "lng": -77.0528}'::jsonb,
  'activo'
FROM obra_creada

UNION ALL

SELECT 
  gen_random_uuid(),
  obra_creada.id,
  'Frente C - Km 10+000 - 15+000',
  'Tercer tramo de la carretera principal',
  '{"lat": -12.0664, "lng": -77.0628}'::jsonb,
  'activo'
FROM obra_creada;

-- Verificar que los datos se insertaron correctamente
SELECT 'Obras creadas:' as info, count(*) as cantidad FROM obras;
SELECT 'Frentes creados:' as info, count(*) as cantidad FROM frentes;