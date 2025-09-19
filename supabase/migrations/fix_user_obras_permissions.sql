-- Otorgar permisos para la tabla user_obras
-- Fecha: 2025-01-15

-- Otorgar permisos de lectura al rol anon para user_obras
GRANT SELECT ON user_obras TO anon;

-- Otorgar permisos completos al rol authenticated para user_obras
GRANT ALL PRIVILEGES ON user_obras TO authenticated;

-- Verificar permisos otorgados
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'user_obras'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;