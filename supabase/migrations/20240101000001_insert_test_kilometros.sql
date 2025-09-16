-- Insertar kilómetros de prueba para el frente existente
-- Primero obtenemos el ID del frente de pavimentación
DO $$
DECLARE
    frente_id_var UUID;
BEGIN
    -- Obtener el ID del frente de pavimentación
    SELECT id INTO frente_id_var FROM frentes WHERE nombre = 'Frente de Pavimentación' LIMIT 1;
    
    IF frente_id_var IS NOT NULL THEN
        -- Insertar kilómetros de prueba para este frente
        INSERT INTO kilometros (frente_id, kilometro, estado, color, progreso_porcentaje, actividades_count) VALUES
        (frente_id_var, 0.0, 'completado', '#22C55E', 100, 2),
        (frente_id_var, 0.1, 'en_progreso', '#F59E0B', 65, 3),
        (frente_id_var, 0.2, 'en_progreso', '#F59E0B', 45, 2),
        (frente_id_var, 0.3, 'no_iniciado', '#6B7280', 0, 1),
        (frente_id_var, 0.4, 'no_iniciado', '#6B7280', 0, 1),
        (frente_id_var, 0.5, 'no_iniciado', '#6B7280', 0, 0);
        
        RAISE NOTICE 'Kilómetros de prueba insertados para frente: %', frente_id_var;
    ELSE
        RAISE NOTICE 'No se encontró el frente de pavimentación';
    END IF;
END $$;