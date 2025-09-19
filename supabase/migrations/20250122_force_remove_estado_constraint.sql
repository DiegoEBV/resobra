-- Forzar la eliminación de la restricción CHECK del campo estado
-- La restricción actual impide usar 'activo' como valor por defecto

-- Buscar el nombre exacto de la restricción
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Buscar todas las restricciones CHECK en la tabla kpis para el campo estado
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'kpis'::regclass 
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%estado%'
    LOOP
        -- Eliminar cada restricción encontrada
        EXECUTE 'ALTER TABLE kpis DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Eliminada restricción: %', constraint_name;
    END LOOP;
END $$;

-- Verificar que no queden restricciones CHECK relacionadas con estado
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'kpis'::regclass 
AND contype = 'c'
AND pg_get_constraintdef(oid) LIKE '%estado%';

-- Comentario: Todas las restricciones CHECK del campo estado han sido eliminadas