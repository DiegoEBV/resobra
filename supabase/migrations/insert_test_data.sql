-- Insertar datos de prueba para kilometros
-- Primero obtenemos un frente existente
DO $$
DECLARE
    frente_id_var uuid;
BEGIN
    -- Obtener el primer frente disponible
    SELECT id INTO frente_id_var FROM frentes LIMIT 1;
    
    -- Si existe un frente, insertar datos kilométricos de prueba
    IF frente_id_var IS NOT NULL THEN
        -- Insertar kilómetros de prueba (del 0 al 5)
        INSERT INTO kilometros (frente_id, kilometro, estado, color, progreso_porcentaje, actividades_count)
        VALUES 
            (frente_id_var, 0, 'completado', '#10B981', 100, 3),
            (frente_id_var, 1, 'en_progreso', '#F59E0B', 65, 2),
            (frente_id_var, 2, 'en_progreso', '#F59E0B', 45, 1),
            (frente_id_var, 3, 'no_iniciado', '#6B7280', 0, 0),
            (frente_id_var, 4, 'no_iniciado', '#6B7280', 0, 0),
            (frente_id_var, 5, 'con_observaciones', '#EF4444', 25, 1)
        ON CONFLICT (frente_id, kilometro) DO UPDATE SET
            estado = EXCLUDED.estado,
            color = EXCLUDED.color,
            progreso_porcentaje = EXCLUDED.progreso_porcentaje,
            actividades_count = EXCLUDED.actividades_count;
            
        RAISE NOTICE 'Datos kilométricos insertados para frente: %', frente_id_var;
    ELSE
        RAISE NOTICE 'No se encontraron frentes para insertar datos kilométricos';
    END IF;
END $$;

-- Verificar los datos insertados
SELECT k.*, f.nombre as frente_nombre 
FROM kilometros k 
JOIN frentes f ON k.frente_id = f.id 
ORDER BY k.kilometro;