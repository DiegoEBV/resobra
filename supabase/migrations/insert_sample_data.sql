-- Insertar datos de ejemplo para obras, frentes y asignaciones de usuario
-- Esta migración crea datos de prueba para que los usuarios puedan ver frentes de trabajo

-- Insertar obras viales de ejemplo
INSERT INTO obras (id, nombre, descripcion, ubicacion, fecha_inicio, fecha_fin_estimada, estado) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Carretera Panamericana Norte Km 45-85', 'Mejoramiento y rehabilitación de carretera Panamericana Norte, tramo km 45-85', 'Ancash - Huaraz', '2024-01-15', '2024-12-31', 'activa'),
('550e8400-e29b-41d4-a716-446655440002', 'Autopista Central Tramo 2', 'Construcción de autopista central con doble calzada, tramo km 120-160', 'Lima - Junín', '2024-02-01', '2024-11-30', 'activa'),
('550e8400-e29b-41d4-a716-446655440003', 'Carretera Interoceánica Sur', 'Pavimentación y señalización carretera interoceánica sur, tramo km 200-250', 'Cusco - Madre de Dios', '2024-03-01', '2025-02-28', 'activa')
ON CONFLICT (id) DO NOTHING;

-- Insertar frentes de trabajo viales de ejemplo
INSERT INTO frentes (id, obra_id, nombre, descripcion, estado) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Frente A - Movimiento de Tierras Km 45-55', 'Excavación, corte y relleno de terraplenes km 45-55', 'activo'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Frente B - Pavimentación Km 55-70', 'Colocación de base granular y carpeta asfáltica km 55-70', 'activo'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Frente C - Obras de Drenaje Km 70-85', 'Construcción de alcantarillas y cunetas km 70-85', 'activo'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Frente D - Explanación Km 120-135', 'Preparación de explanada y conformación de rasante km 120-135', 'activo'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Frente E - Pavimento Rígido Km 135-160', 'Construcción de losas de concreto y juntas km 135-160', 'activo'),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'Frente F - Señalización Horizontal Km 200-225', 'Pintado de líneas y demarcación vial km 200-225', 'activo'),
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'Frente G - Señalización Vertical Km 225-250', 'Instalación de señales preventivas e informativas km 225-250', 'activo')
ON CONFLICT (id) DO NOTHING;

-- Asignar obras a usuarios (usando el usuario autenticado actual)
-- Nota: Esta inserción se hará para cualquier usuario que esté autenticado
INSERT INTO user_obras (user_id, obra_id, rol_obra)
SELECT 
    auth.uid() as user_id,
    obras.id as obra_id,
    'residente' as rol_obra
FROM obras
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- Verificar que se insertaron los datos correctamente
SELECT 'Obras insertadas:' as info, count(*) as cantidad FROM obras;
SELECT 'Frentes insertados:' as info, count(*) as cantidad FROM frentes;
SELECT 'Asignaciones de usuario:' as info, count(*) as cantidad FROM user_obras WHERE user_id = auth.uid();