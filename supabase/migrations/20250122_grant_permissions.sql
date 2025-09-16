-- Otorgar permisos a las tablas para los roles anon y authenticated

-- Permisos para la tabla obras
GRANT SELECT ON obras TO anon;
GRANT ALL PRIVILEGES ON obras TO authenticated;

-- Permisos para la tabla frentes
GRANT SELECT ON frentes TO anon;
GRANT ALL PRIVILEGES ON frentes TO authenticated;

-- Permisos para la tabla actividades
GRANT SELECT ON actividades TO anon;
GRANT ALL PRIVILEGES ON actividades TO authenticated;

-- Verificar que los datos se insertaron correctamente
SELECT 'Obras insertadas:' as info, count(*) as cantidad FROM obras;
SELECT 'Frentes insertados:' as info, count(*) as cantidad FROM frentes;

-- Mostrar los datos insertados
SELECT id, nombre FROM obras;
SELECT id, obra_id, nombre FROM frentes;