-- Consultar todas las restricciones de la tabla kpis
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.table_name
FROM 
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
WHERE 
    tc.table_name = 'kpis' 
    AND tc.table_schema = 'public'
ORDER BY 
    tc.constraint_type, tc.constraint_name;

-- Verificar si existe la restricción problemática
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'kpis' 
  AND constraint_name LIKE '%obra_id_fecha%';

-- Si existe, eliminarla
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'kpis' 
          AND constraint_name = 'kpis_obra_id_fecha_key'
    ) THEN
        ALTER TABLE kpis DROP CONSTRAINT kpis_obra_id_fecha_key;
        RAISE NOTICE 'Restricción kpis_obra_id_fecha_key eliminada';
    ELSE
        RAISE NOTICE 'La restricción kpis_obra_id_fecha_key no existe';
    END IF;
END $$;