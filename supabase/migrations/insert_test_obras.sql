-- Insertar obras de prueba
INSERT INTO obras (id, nombre, descripcion, ubicacion, fecha_inicio, fecha_fin_estimada, estado, progreso)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Construcción Edificio Central', 'Construcción de edificio de oficinas de 10 pisos', 'Av. Principal 123, Lima', '2024-01-15', '2024-12-31', 'activa', 45.50),
  ('550e8400-e29b-41d4-a716-446655440002', 'Remodelación Plaza Norte', 'Remodelación completa de la plaza principal', 'Plaza Norte, Distrito Centro', '2024-02-01', '2024-08-30', 'activa', 72.30),
  ('550e8400-e29b-41d4-a716-446655440003', 'Puente Vehicular Sur', 'Construcción de puente vehicular de 200m', 'Km 15 Carretera Sur', '2024-03-10', '2024-11-15', 'activa', 28.75)
ON CONFLICT (id) DO NOTHING;

-- Obtener el ID del usuario autenticado actual y asignar obras
-- Nota: Este script asume que hay un usuario autenticado
-- En un entorno real, esto se haría a través de la aplicación

-- Insertar asignaciones de usuario a obras (usando el user_id del usuario autenticado)
-- Primero eliminamos asignaciones existentes para evitar duplicados
DELETE FROM user_obras WHERE obra_id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002', 
  '550e8400-e29b-41d4-a716-446655440003'
);

-- Insertar nuevas asignaciones para el usuario autenticado
-- Nota: auth.uid() devuelve el ID del usuario autenticado
INSERT INTO user_obras (user_id, obra_id, rol_obra)
SELECT 
  auth.uid(),
  obra_id,
  'residente'
FROM (
  VALUES 
    ('550e8400-e29b-41d4-a716-446655440001'::uuid),
    ('550e8400-e29b-41d4-a716-446655440002'::uuid),
    ('550e8400-e29b-41d4-a716-446655440003'::uuid)
) AS obras_data(obra_id)
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;