-- Verificar datos en la tabla user_obras
SELECT 
  uo.id,
  uo.user_id,
  uo.obra_id,
  uo.rol_obra,
  uo.assigned_at,
  u.email as user_email,
  o.nombre as obra_nombre
FROM user_obras uo
LEFT JOIN users u ON uo.user_id = u.id
LEFT JOIN obras o ON uo.obra_id = o.id
ORDER BY uo.assigned_at DESC;

-- Contar total de registros en user_obras
SELECT COUNT(*) as total_user_obras FROM user_obras;

-- Verificar si hay usuarios sin obras asignadas
SELECT 
  u.id,
  u.email,
  COUNT(uo.id) as obras_asignadas
FROM users u
LEFT JOIN user_obras uo ON u.id = uo.user_id
GROUP BY u.id, u.email
ORDER BY obras_asignadas ASC;

-- Verificar permisos de la tabla user_obras
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'user_obras'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;