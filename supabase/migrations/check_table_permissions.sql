-- Verificar permisos actuales de las tablas para los roles anon y authenticated
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee IN ('anon', 'authenticated') 
    AND table_name IN ('obras', 'kpis')
ORDER BY table_name, grantee;

-- Otorgar permisos necesarios para la tabla 'obras'
GRANT SELECT ON public.obras TO anon;
GRANT ALL PRIVILEGES ON public.obras TO authenticated;

-- Otorgar permisos necesarios para la tabla 'kpis'
GRANT SELECT ON public.kpis TO anon;
GRANT ALL PRIVILEGES ON public.kpis TO authenticated;

-- Verificar permisos después de otorgarlos
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee IN ('anon', 'authenticated') 
    AND table_name IN ('obras', 'kpis')
ORDER BY table_name, grantee;