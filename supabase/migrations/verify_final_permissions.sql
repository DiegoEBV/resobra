-- Verificación final de permisos y políticas para la tabla kpis
-- Este archivo verifica que todo esté correctamente configurado

-- 1. Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'kpis' AND schemaname = 'public';

-- 2. Verificar políticas RLS existentes
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
WHERE tablename = 'kpis' AND schemaname = 'public'
ORDER BY policyname;

-- 3. Verificar permisos de tabla para roles anon y authenticated
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'kpis' 
    AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- 4. Verificar estructura de la tabla kpis
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'kpis'
ORDER BY ordinal_position;

-- 5. Verificar índices en la tabla kpis
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'kpis' AND schemaname = 'public'
ORDER BY indexname;

-- 6. Verificar foreign keys
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'kpis'
    AND tc.table_schema = 'public';

-- 7. Verificar que las tablas relacionadas existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('obras', 'actividades', 'kpi_historial')
ORDER BY table_name;

-- Mensaje de confirmación
SELECT 'Verificación de permisos y políticas completada' as status;