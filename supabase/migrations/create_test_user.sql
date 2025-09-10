-- Crear usuario de prueba para testing
-- Este script crea un usuario de prueba y lo asigna a obras para verificar la funcionalidad

-- Insertar usuario de prueba en la tabla users (si no existe)
INSERT INTO users (id, email, nombre, rol, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@obras.com',
  'Usuario de Prueba',
  'residente',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Asignar el usuario de prueba a todas las obras disponibles
INSERT INTO user_obras (user_id, obra_id, rol_obra, assigned_at)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000',
  o.id,
  'residente',
  NOW()
FROM obras o
WHERE NOT EXISTS (
  SELECT 1 FROM user_obras uo 
  WHERE uo.user_id = '550e8400-e29b-41d4-a716-446655440000' AND uo.obra_id = o.id
);

-- Verificar los datos insertados
SELECT 'USUARIO DE PRUEBA CREADO:' as info;
SELECT id, email, nombre, rol FROM users WHERE email = 'test@obras.com';

SELECT 'ASIGNACIONES DEL USUARIO DE PRUEBA:' as info;
SELECT uo.user_id, u.email, uo.obra_id, o.nombre as obra_nombre, uo.rol_obra
FROM user_obras uo
JOIN users u ON uo.user_id = u.id
JOIN obras o ON uo.obra_id = o.id
WHERE u.email = 'test@obras.com';

SELECT 'FRENTES DISPONIBLES PARA EL USUARIO DE PRUEBA:' as info;
SELECT f.id, f.nombre, f.descripcion, o.nombre as obra_nombre
FROM frentes f
JOIN obras o ON f.obra_id = o.id
JOIN user_obras uo ON o.id = uo.obra_id
JOIN users u ON uo.user_id = u.id
WHERE u.email = 'test@obras.com'
AND f.estado = 'activo'
ORDER BY o.nombre, f.nombre;