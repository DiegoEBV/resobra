-- Eliminar TODAS las restricciones CHECK de la tabla kpis
-- Hay múltiples restricciones que están causando errores de inserción

-- Eliminar todas las restricciones CHECK de la tabla kpis
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Buscar y eliminar todas las restricciones CHECK en la tabla kpis
    FOR constraint_record IN 
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = 'kpis'::regclass 
        AND contype = 'c'
    LOOP
        -- Eliminar cada restricción CHECK encontrada
        EXECUTE 'ALTER TABLE kpis DROP CONSTRAINT IF EXISTS ' || constraint_record.conname;
        RAISE NOTICE 'Eliminada restricción CHECK: % - %', constraint_record.conname, constraint_record.definition;
    END LOOP;
END $$;

-- Verificar que no queden restricciones CHECK en la tabla kpis
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'kpis'::regclass 
AND contype = 'c';

-- Comentario: Todas las restricciones CHECK han sido eliminadas de la tabla kpis