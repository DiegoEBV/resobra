-- Generar kilómetros faltantes para frentes que tienen rangos definidos pero no kilómetros
-- Primero verificamos qué frentes necesitan kilómetros
DO $$
DECLARE
    frente_record RECORD;
    km_counter INTEGER;
BEGIN
    -- Iterar sobre frentes que tienen rangos kilométricos pero no kilómetros generados
    FOR frente_record IN 
        SELECT f.id, f.nombre, f.km_inicial, f.km_final
        FROM frentes f
        LEFT JOIN kilometros k ON f.id = k.frente_id
        WHERE f.km_inicial IS NOT NULL 
          AND f.km_final IS NOT NULL
          AND k.id IS NULL
          AND f.estado = 'activo'
    LOOP
        RAISE NOTICE 'Generando kilómetros para frente: % (%.1f - %.1f km)', 
            frente_record.nombre, frente_record.km_inicial, frente_record.km_final;
        
        -- Generar kilómetros para este frente
        FOR km_counter IN CEIL(frente_record.km_inicial)..FLOOR(frente_record.km_final) LOOP
            INSERT INTO kilometros (
                frente_id,
                kilometro,
                estado,
                color,
                progreso_porcentaje,
                actividades_count,
                fecha_ultima_actualizacion
            ) VALUES (
                frente_record.id,
                km_counter,
                'no_iniciado',
                '#6B7280',
                0,
                0,
                NOW()
            );
        END LOOP;
        
        RAISE NOTICE 'Kilómetros generados para frente: %', frente_record.nombre;
    END LOOP;
END $$;

-- Verificar los kilómetros generados
SELECT 
    f.nombre as frente_nombre,
    f.km_inicial,
    f.km_final,
    COUNT(k.id) as kilometros_generados,
    MIN(k.kilometro) as km_min_generado,
    MAX(k.kilometro) as km_max_generado
FROM frentes f
LEFT JOIN kilometros k ON f.id = k.frente_id
WHERE f.km_inicial IS NOT NULL AND f.km_final IS NOT NULL
GROUP BY f.id, f.nombre, f.km_inicial, f.km_final
ORDER BY f.nombre;