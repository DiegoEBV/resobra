-- Insertar datos de prueba para obras y frentes

-- Insertar una obra de prueba
INSERT INTO obras (id, nombre, descripcion, ubicacion, fecha_inicio, estado)
VALUES (
  gen_random_uuid(),
  'Carretera Principal Km 0-20',
  'Construcción y mejoramiento de carretera principal',
  'Región Central',
  '2024-01-01',
  'activa'
) ON CONFLICT (id) DO NOTHING;

-- Obtener el ID de la obra recién insertada
DO $$
DECLARE
    obra_uuid UUID;
BEGIN
    -- Obtener o crear la obra
    SELECT id INTO obra_uuid FROM obras WHERE nombre = 'Carretera Principal Km 0-20' LIMIT 1;
    
    IF obra_uuid IS NULL THEN
        INSERT INTO obras (nombre, descripcion, ubicacion, fecha_inicio, estado)
        VALUES (
            'Carretera Principal Km 0-20',
            'Construcción y mejoramiento de carretera principal',
            'Región Central',
            '2024-01-01',
            'activa'
        ) RETURNING id INTO obra_uuid;
    END IF;
    
    -- Insertar frentes de trabajo
    INSERT INTO frentes (obra_id, nombre, descripcion, estado)
    VALUES 
        (obra_uuid, 'Frente A - Km 0-5', 'Tramo inicial de la carretera', 'activo'),
        (obra_uuid, 'Frente B - Km 5-10', 'Tramo intermedio de la carretera', 'activo'),
        (obra_uuid, 'Frente C - Km 10-15', 'Tramo avanzado de la carretera', 'activo'),
        (obra_uuid, 'Frente D - Km 15-20', 'Tramo final de la carretera', 'activo')
    ON CONFLICT DO NOTHING;
END $$;

-- Verificar que los datos se insertaron correctamente
SELECT 'Obras insertadas:' as info, COUNT(*) as cantidad FROM obras;
SELECT 'Frentes insertados:' as info, COUNT(*) as cantidad FROM frentes;