-- Verificar si los datos de prueba se crearon correctamente
SELECT 'Verificando datos en actividades:' as info;
SELECT COUNT(*) as total_actividades FROM actividades;
SELECT id, fecha, descripcion, estado FROM actividades LIMIT 5;

-- Verificar permisos actuales
SELECT 'Verificando permisos:' as info;
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'actividades'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Verificar políticas RLS
SELECT 'Verificando políticas RLS:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'actividades';

-- Verificar si RLS está habilitado
SELECT 'Estado RLS:' as info;
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'actividades';

-- Intentar una consulta simple como usuario autenticado
SELECT 'Consulta de prueba:' as info;
SET ROLE authenticated;
SELECT COUNT(*) as count_as_authenticated FROM actividades;
RESET ROLE;

-- Intentar consulta como anon
SET ROLE anon;
SELECT COUNT(*) as count_as_anon FROM actividades;
RESET ROLE;