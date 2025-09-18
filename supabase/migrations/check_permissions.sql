-- Verificar permisos actuales para las tablas obras y user_obras
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee IN ('anon', 'authenticated') 
    AND table_name IN ('obras', 'user_obras')
ORDER BY table_name, grantee;

-- Otorgar permisos necesarios si no existen
GRANT SELECT ON obras TO anon;
GRANT SELECT ON obras TO authenticated;
GRANT SELECT ON user_obras TO anon;
GRANT SELECT ON user_obras TO authenticated;

-- Verificar permisos después de otorgarlos
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee IN ('anon', 'authenticated') 
    AND table_name IN ('obras', 'user_obras')
ORDER BY table_name, grantee;