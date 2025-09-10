-- Verificar permisos actuales para la tabla actividades
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'actividades' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Otorgar permisos de lectura al rol anon
GRANT SELECT ON actividades TO anon;

-- Otorgar todos los permisos al rol authenticated
GRANT ALL PRIVILEGES ON actividades TO authenticated;

-- Verificar permisos después de otorgarlos
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'actividades' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;