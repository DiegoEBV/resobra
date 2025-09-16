-- Debug: Verificar datos de actividades y permisos

-- 1. Verificar si hay datos en la tabla actividades
SELECT 
    COUNT(*) as total_actividades,
    COUNT(CASE WHEN estado = 'programado' THEN 1 END) as programadas,
    COUNT(CASE WHEN estado = 'ejecucion' THEN 1 END) as en_ejecucion,
    COUNT(CASE WHEN estado = 'finalizado' THEN 1 END) as finalizadas
FROM actividades;

-- 2. Verificar permisos actuales para las tablas
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee IN ('anon', 'authenticated') 
    AND table_name IN ('actividades', 'frentes', 'obras', 'users')
ORDER BY table_name, grantee;

-- 3. Verificar políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('actividades', 'frentes', 'obras', 'users')
ORDER BY tablename, policyname;

-- 4. Verificar algunas actividades de ejemplo (sin filtros RLS)
SELECT 
    id,
    obra_id,
    frente_id,
    user_id,
    tipo_actividad,
    fecha,
    responsable,
    estado,
    created_at
FROM actividades 
LIMIT 5;

-- 5. Otorgar permisos básicos si no existen
GRANT SELECT ON actividades TO anon;
GRANT ALL PRIVILEGES ON actividades TO authenticated;

GRANT SELECT ON frentes TO anon;
GRANT ALL PRIVILEGES ON frentes TO authenticated;

GRANT SELECT ON obras TO anon;
GRANT ALL PRIVILEGES ON obras TO authenticated;

GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;