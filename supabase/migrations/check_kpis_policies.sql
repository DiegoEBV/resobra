-- Verificar políticas RLS para la tabla kpis
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
WHERE tablename = 'kpis'
ORDER BY policyname;

-- También verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'kpis';

-- Verificar permisos de roles en la tabla
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'kpis' 
AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;