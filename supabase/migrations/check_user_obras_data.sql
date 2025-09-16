-- Verificar datos en user_obras y obras
SELECT 'user_obras' as tabla, COUNT(*) as total FROM user_obras;
SELECT 'obras' as tabla, COUNT(*) as total FROM obras;

-- Ver datos específicos de user_obras con obras relacionadas
SELECT 
  uo.id,
  uo.user_id,
  uo.obra_id,
  uo.rol_obra,
  o.nombre as obra_nombre,
  o.descripcion as obra_descripcion
FROM user_obras uo
LEFT JOIN obras o ON uo.obra_id = o.id
ORDER BY uo.assigned_at DESC;

-- Verificar usuarios existentes en auth.users
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- Verificar usuarios existentes en tabla users
SELECT COUNT(*) as total_users FROM users;

-- Verificar permisos para las tablas
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name IN ('user_obras', 'obras')
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Otorgar permisos necesarios
GRANT SELECT ON user_obras TO anon;
GRANT ALL PRIVILEGES ON user_obras TO authenticated;
GRANT SELECT ON obras TO anon;
GRANT ALL PRIVILEGES ON obras TO authenticated;

-- Mostrar mensaje informativo
SELECT 'Permisos configurados correctamente para user_obras y obras' as mensaje;