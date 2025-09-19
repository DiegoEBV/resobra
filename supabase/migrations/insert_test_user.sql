-- Crear usuario de prueba para testing
-- Nota: En Supabase, los usuarios se crean a través de auth.users, no directamente en la tabla users

-- Primero, insertar en la tabla users (perfil de usuario)
INSERT INTO users (id, email, nombre)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Usuario de Prueba')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  nombre = EXCLUDED.nombre;

-- Insertar asignaciones de obras para el usuario de prueba
INSERT INTO user_obras (user_id, obra_id, rol_obra)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'residente'),
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'residente'),
  ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 'residente')
ON CONFLICT (user_id, obra_id) DO NOTHING;

-- Verificar que las obras existen
SELECT 'Obras disponibles:' as info;
SELECT id, nombre FROM obras;

-- Verificar las asignaciones
SELECT 'Asignaciones de usuario:' as info;
SELECT uo.user_id, uo.obra_id, uo.rol_obra, o.nombre as obra_nombre
FROM user_obras uo
JOIN obras o ON uo.obra_id = o.id
WHERE uo.user_id = '550e8400-e29b-41d4-a716-446655440000';