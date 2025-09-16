-- Debug: Verificar datos y permisos de actividades

-- 1. Verificar si hay actividades en la tabla
SELECT COUNT(*) as total_actividades FROM actividades;

-- 2. Verificar permisos actuales
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'actividades'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- 3. Otorgar permisos básicos si no existen
GRANT SELECT ON actividades TO anon;
GRANT ALL PRIVILEGES ON actividades TO authenticated;

-- 4. Verificar políticas RLS existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'actividades';

-- 5. Mostrar algunas actividades de ejemplo (si existen)
SELECT id, tipo_actividad, fecha, estado, user_id, created_at
FROM actividades 
LIMIT 5;