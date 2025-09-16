-- Verificar datos existentes en tablas relacionadas
SELECT 'Obras disponibles:' as info;
SELECT id, nombre FROM obras LIMIT 3;

SELECT 'Frentes disponibles:' as info;
SELECT id, nombre FROM frentes LIMIT 3;

SELECT 'Usuarios disponibles:' as info;
SELECT id, email FROM users LIMIT 3;

SELECT 'Actividades actuales:' as info;
SELECT COUNT(*) as total FROM actividades;

-- Verificar permisos actuales
SELECT 'Permisos actuales:' as info;
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'actividades'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Otorgar permisos básicos por si acaso
GRANT SELECT ON actividades TO anon;
GRANT ALL PRIVILEGES ON actividades TO authenticated;