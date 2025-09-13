-- Script para diagnosticar problemas en la tabla kpis
-- Fecha: 2025-01-22

-- 1. Verificar registros duplicados por obra_id y fecha
SELECT 
    obra_id, 
    fecha, 
    COUNT(*) as duplicados
FROM public.kpis 
WHERE obra_id IS NOT NULL AND actividad_id IS NULL
GROUP BY obra_id, fecha 
HAVING COUNT(*) > 1;

-- 2. Verificar registros duplicados por actividad_id y fecha
SELECT 
    actividad_id, 
    fecha, 
    COUNT(*) as duplicados
FROM public.kpis 
WHERE actividad_id IS NOT NULL
GROUP BY actividad_id, fecha 
HAVING COUNT(*) > 1;

-- 3. Verificar registros que violan la constraint chk_kpis_obra_or_actividad
SELECT 
    id,
    obra_id,
    actividad_id,
    fecha,
    CASE 
        WHEN obra_id IS NULL AND actividad_id IS NULL THEN 'Ambos NULL'
        ELSE 'OK'
    END as estado_constraint
FROM public.kpis 
WHERE obra_id IS NULL AND actividad_id IS NULL;

-- 4. Verificar índices únicos existentes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'kpis' 
AND schemaname = 'public'
AND indexdef LIKE '%UNIQUE%';

-- 5. Verificar constraints existentes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.kpis'::regclass;

-- 6. Contar total de registros
SELECT 
    COUNT(*) as total_kpis,
    COUNT(CASE WHEN obra_id IS NOT NULL AND actividad_id IS NULL THEN 1 END) as kpis_obra,
    COUNT(CASE WHEN actividad_id IS NOT NULL THEN 1 END) as kpis_actividad,
    COUNT(CASE WHEN obra_id IS NULL AND actividad_id IS NULL THEN 1 END) as kpis_sin_asignar
FROM public.kpis;