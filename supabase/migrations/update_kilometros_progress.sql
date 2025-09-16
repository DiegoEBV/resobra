-- Actualizar el progreso de los kilómetros basándose en las actividades existentes
DO $$
DECLARE
    kilometro_record RECORD;
    actividad_count INTEGER;
    total_progreso NUMERIC;
    promedio_progreso NUMERIC;
    nuevo_estado VARCHAR(50);
BEGIN
    -- Iterar sobre todos los kilómetros
    FOR kilometro_record IN 
        SELECT k.id, k.frente_id, k.kilometro
        FROM kilometros k
    LOOP
        -- Contar actividades en este kilómetro
        SELECT COUNT(*), COALESCE(AVG(progreso_porcentaje), 0)
        INTO actividad_count, promedio_progreso
        FROM actividades a
        WHERE a.frente_id = kilometro_record.frente_id
          AND (
            -- Actividades que tienen kilometro específico
            a.kilometro = kilometro_record.kilometro
            OR
            -- Actividades que están en el rango kilométrico
            (a.kilometraje_inicio <= kilometro_record.kilometro AND a.kilometraje_fin >= kilometro_record.kilometro)
          );
        
        -- Determinar el estado basado en el progreso
        IF promedio_progreso = 0 THEN
            nuevo_estado := 'no_iniciado';
        ELSIF promedio_progreso >= 100 THEN
            nuevo_estado := 'completado';
        ELSE
            nuevo_estado := 'en_progreso';
        END IF;
        
        -- Actualizar el kilómetro
        UPDATE kilometros 
        SET 
            actividades_count = actividad_count,
            progreso_porcentaje = ROUND(promedio_progreso),
            estado = nuevo_estado,
            color = CASE 
                WHEN promedio_progreso = 0 THEN '#6B7280'  -- Gris para no iniciado
                WHEN promedio_progreso >= 100 THEN '#10B981'  -- Verde para completado
                WHEN promedio_progreso >= 50 THEN '#F59E0B'   -- Amarillo para progreso medio
                ELSE '#EF4444'  -- Rojo para progreso bajo
            END,
            fecha_ultima_actualizacion = NOW()
        WHERE id = kilometro_record.id;
        
        IF actividad_count > 0 THEN
            RAISE NOTICE 'Kilómetro % del frente %: % actividades, %.1f%% progreso, estado: %', 
                kilometro_record.kilometro, kilometro_record.frente_id, actividad_count, promedio_progreso, nuevo_estado;
        END IF;
    END LOOP;
END $$;

-- Verificar los resultados
SELECT 
    f.nombre as frente_nombre,
    k.kilometro,
    k.estado,
    k.progreso_porcentaje,
    k.actividades_count,
    k.color
FROM kilometros k
JOIN frentes f ON k.frente_id = f.id
WHERE k.actividades_count > 0
ORDER BY f.nombre, k.kilometro;

-- Resumen por frente
SELECT 
    f.nombre as frente_nombre,
    COUNT(k.id) as total_kilometros,
    COUNT(CASE WHEN k.estado = 'no_iniciado' THEN 1 END) as no_iniciados,
    COUNT(CASE WHEN k.estado = 'en_progreso' THEN 1 END) as en_progreso,
    COUNT(CASE WHEN k.estado = 'completado' THEN 1 END) as completados,
    ROUND(AVG(k.progreso_porcentaje), 1) as progreso_promedio
FROM kilometros k
JOIN frentes f ON k.frente_id = f.id
GROUP BY f.id, f.nombre
ORDER BY f.nombre;