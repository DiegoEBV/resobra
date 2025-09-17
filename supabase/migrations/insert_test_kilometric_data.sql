-- Insertar datos de prueba para visualización kilométrica
-- Primero verificar que existe el frente
DO $$
DECLARE
    frente_id_var UUID;
    actividad_id_var UUID;
BEGIN
    -- Obtener el ID del frente existente
    SELECT id INTO frente_id_var FROM frentes LIMIT 1;
    
    IF frente_id_var IS NOT NULL THEN
        -- Actualizar el frente con coordenadas completas para visualización
        UPDATE frentes 
        SET 
            coordenadas_inicio = '{"lat": -16.3988, "lng": -71.5350}',
            coordenadas_fin = '{"lat": -16.4088, "lng": -71.5250}',
            coordenadas_intermedias = '[
                {"lat": -16.4038, "lng": -71.5300, "kilometraje": 1.5},
                {"lat": -16.4058, "lng": -71.5275, "kilometraje": 2.5}
            ]',
            km_inicial = 0.0,
            km_final = 3.0
        WHERE id = frente_id_var;
        
        -- Limpiar kilómetros existentes para este frente
        DELETE FROM kilometros WHERE frente_id = frente_id_var;
        
        -- Insertar kilómetros con diferentes estados y progreso
        INSERT INTO kilometros (frente_id, kilometro, estado, color, progreso_porcentaje, actividades_count) VALUES
        (frente_id_var, 0.0, 'completado', '#4CAF50', 100, 3),
        (frente_id_var, 1.0, 'en_progreso', '#FF9800', 75, 2),
        (frente_id_var, 2.0, 'en_progreso', '#FF9800', 45, 1),
        (frente_id_var, 3.0, 'planificado', '#9E9E9E', 0, 0);
        
        -- Actualizar actividades existentes con kilometraje
        UPDATE actividades 
        SET 
            kilometro = CASE 
                WHEN id = (SELECT id FROM actividades WHERE frente_id = frente_id_var ORDER BY created_at LIMIT 1) THEN 0.5
                WHEN id = (SELECT id FROM actividades WHERE frente_id = frente_id_var ORDER BY created_at LIMIT 1 OFFSET 1) THEN 1.5
                ELSE 2.5
            END,
            progreso_porcentaje = CASE 
                WHEN id = (SELECT id FROM actividades WHERE frente_id = frente_id_var ORDER BY created_at LIMIT 1) THEN 100
                WHEN id = (SELECT id FROM actividades WHERE frente_id = frente_id_var ORDER BY created_at LIMIT 1 OFFSET 1) THEN 75
                ELSE 45
            END
        WHERE frente_id = frente_id_var;
        
        RAISE NOTICE 'Datos kilométricos de prueba insertados correctamente para frente %', frente_id_var;
    ELSE
        RAISE NOTICE 'No se encontró ningún frente para insertar datos de prueba';
    END IF;
END $$;

-- Verificar los datos insertados
SELECT 
    f.nombre as frente_nombre,
    f.km_inicial,
    f.km_final,
    f.coordenadas_inicio,
    f.coordenadas_fin,
    f.coordenadas_intermedias,
    COUNT(k.id) as kilometros_count
FROM frentes f
LEFT JOIN kilometros k ON f.id = k.frente_id
GROUP BY f.id, f.nombre, f.km_inicial, f.km_final, f.coordenadas_inicio, f.coordenadas_fin, f.coordenadas_intermedias;

-- Mostrar kilómetros con su progreso
SELECT 
    k.kilometro,
    k.estado,
    k.color,
    k.progreso_porcentaje,
    k.actividades_count,
    f.nombre as frente_nombre
FROM kilometros k
JOIN frentes f ON k.frente_id = f.id
ORDER BY f.nombre, k.kilometro;