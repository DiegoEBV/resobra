-- Verificar datos actuales
SELECT COUNT(*) as total_actividades FROM actividades;

-- Verificar si hay obras y frentes disponibles
SELECT COUNT(*) as total_obras FROM obras;
SELECT COUNT(*) as total_frentes FROM frentes;
SELECT COUNT(*) as total_users FROM users;

-- Crear datos de prueba básicos
INSERT INTO actividades (
    obra_id, 
    frente_id, 
    user_id, 
    tipo_actividad, 
    fecha, 
    ubicacion, 
    responsable, 
    estado,
    observaciones
) 
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Actividad de Prueba 1',
    CURRENT_DATE,
    '{"lat": -16.5, "lng": -68.15}',
    'Responsable Test 1',
    'programado',
    'Primera actividad de prueba'
),
(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Actividad de Prueba 2',
    CURRENT_DATE + 1,
    '{"lat": -16.6, "lng": -68.16}',
    'Responsable Test 2',
    'ejecucion',
    'Segunda actividad de prueba'
)
ON CONFLICT DO NOTHING;

-- Otorgar permisos básicos
GRANT SELECT ON actividades TO anon;
GRANT ALL PRIVILEGES ON actividades TO authenticated;

-- Verificar datos finales
SELECT COUNT(*) as actividades_final FROM actividades;
SELECT id, tipo_actividad, fecha, estado FROM actividades LIMIT 5;