-- Verificar si hay obras en la tabla
SELECT COUNT(*) as total_obras FROM obras;
SELECT * FROM obras LIMIT 5;

-- Verificar user_obras (asignaciones)
SELECT COUNT(*) as total_asignaciones FROM user_obras;
SELECT * FROM user_obras LIMIT 5;

-- Verificar usuarios
SELECT COUNT(*) as total_users FROM auth.users;

-- Verificar permisos de la tabla obras
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'obras' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;