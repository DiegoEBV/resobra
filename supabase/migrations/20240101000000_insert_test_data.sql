-- Insertar datos de prueba para obras, frentes y kilómetros

-- Insertar usuario de prueba
INSERT INTO users (id, email, nombre, rol)
VALUES (
  '550e8400-e29b-41d4-a716-446655440030',
  'supervisor@test.com',
  'Supervisor Test',
  'residente'
) ON CONFLICT (email) DO NOTHING;

-- Insertar obra de prueba
INSERT INTO obras (id, nombre, descripcion, ubicacion, fecha_inicio, fecha_fin_estimada, estado)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Carretera Lima-Huancayo Tramo 1',
  'Construcción y mejoramiento de carretera',
  'Lima, Perú',
  '2024-01-01',
  '2024-12-31',
  'activa'
) ON CONFLICT (id) DO NOTHING;

-- Insertar frente de prueba con coordenadas kilométricas
INSERT INTO frentes (
  id, obra_id, nombre, descripcion, 
  ubicacion_lat, ubicacion_lng,
  km_inicial, km_final,
  coordenadas_inicio, coordenadas_fin,
  estado, fecha_inicio, progreso_general
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Frente Pavimentación KM 0-5',
  'Pavimentación del tramo kilométrico 0 al 5',
  -12.0464,
  -77.0428,
  0.0,
  5.0,
  '{"lat": -12.0464, "lng": -77.0428}',
  '{"lat": -12.0500, "lng": -77.0500}',
  'activo',
  '2024-01-15',
  45
) ON CONFLICT (id) DO NOTHING;

-- Insertar kilómetros de prueba
INSERT INTO kilometros (id, frente_id, kilometro, estado, color, progreso_porcentaje, actividades_count)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 0.0, 'completado', '#22C55E', 100, 3),
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 1.0, 'en_progreso', '#F59E0B', 75, 2),
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 2.0, 'en_progreso', '#F59E0B', 50, 1),
  ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 3.0, 'no_iniciado', '#6B7280', 0, 0),
  ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', 4.0, 'no_iniciado', '#6B7280', 0, 0),
  ('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 5.0, 'no_iniciado', '#6B7280', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Insertar actividades de prueba
INSERT INTO actividades (
  id, obra_id, frente_id, user_id, tipo_actividad, fecha,
  ubicacion, responsable, kilometro, estado, observaciones, progreso_porcentaje
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440030',
    'pavimentacion',
    '2024-01-20',
    '{"lat": -12.0464, "lng": -77.0428, "direccion": "KM 0+000"}',
    'Juan Pérez',
    0.0,
    'finalizado',
    'Pavimentación base completada',
    100
  ),
  (
    '550e8400-e29b-41d4-a716-446655440021',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440030',
    'pavimentacion',
    '2024-01-21',
    '{"lat": -12.0470, "lng": -77.0435, "direccion": "KM 1+000"}',
    'María García',
    1.0,
    'ejecucion',
    'Pavimentación en progreso',
    75
  )
ON CONFLICT (id) DO NOTHING;

-- Asignar obra al usuario (necesario para que aparezca en la consulta)
INSERT INTO user_obras (user_id, obra_id, rol_obra)
VALUES ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', 'residente')
ON CONFLICT (user_id, obra_id) DO NOTHING;