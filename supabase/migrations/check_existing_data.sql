-- Consultar datos existentes en obras y frentes
SELECT 'obras' as tabla, id, nombre FROM obras;
SELECT 'frentes' as tabla, id, nombre, obra_id FROM frentes;
SELECT 'users' as tabla, id, email FROM auth.users LIMIT 5;

-- Verificar permisos actuales
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
AND table_name IN ('actividades', 'obras', 'frentes')
ORDER BY table_name, grantee;