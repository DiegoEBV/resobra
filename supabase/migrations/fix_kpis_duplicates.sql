-- Script para corregir problemas de claves duplicadas en KPIs
-- Fecha: 2025-01-22

BEGIN;

-- 1. Eliminar registros duplicados manteniendo solo el más reciente
-- Para KPIs de obra (obra_id no null, actividad_id null)
WITH duplicados_obra AS (
    SELECT 
        id,
        obra_id,
        fecha,
        calculated_at,
        ROW_NUMBER() OVER (
            PARTITION BY obra_id, fecha 
            ORDER BY calculated_at DESC, id DESC
        ) as rn
    FROM public.kpis 
    WHERE obra_id IS NOT NULL AND actividad_id IS NULL
)
DELETE FROM public.kpis 
WHERE id IN (
    SELECT id FROM duplicados_obra WHERE rn > 1
);

-- 2. Eliminar registros duplicados para KPIs de actividad
WITH duplicados_actividad AS (
    SELECT 
        id,
        actividad_id,
        fecha,
        calculated_at,
        ROW_NUMBER() OVER (
            PARTITION BY actividad_id, fecha 
            ORDER BY calculated_at DESC, id DESC
        ) as rn
    FROM public.kpis 
    WHERE actividad_id IS NOT NULL
)
DELETE FROM public.kpis 
WHERE id IN (
    SELECT id FROM duplicados_actividad WHERE rn > 1
);

-- 3. Eliminar registros que no tienen ni obra_id ni actividad_id
DELETE FROM public.kpis 
WHERE obra_id IS NULL AND actividad_id IS NULL;

-- 4. Recrear los índices únicos si no existen
DROP INDEX IF EXISTS idx_kpis_obra_fecha;
DROP INDEX IF EXISTS idx_kpis_actividad_fecha;

-- Índice único para KPIs de obra
CREATE UNIQUE INDEX idx_kpis_obra_fecha 
ON public.kpis (obra_id, fecha) 
WHERE actividad_id IS NULL;

-- Índice único para KPIs de actividad
CREATE UNIQUE INDEX idx_kpis_actividad_fecha 
ON public.kpis (actividad_id, fecha) 
WHERE actividad_id IS NOT NULL;

-- 5. Verificar que la constraint existe
ALTER TABLE public.kpis 
DROP CONSTRAINT IF EXISTS chk_kpis_obra_or_actividad;

ALTER TABLE public.kpis 
ADD CONSTRAINT chk_kpis_obra_or_actividad 
CHECK (
    (obra_id IS NOT NULL AND actividad_id IS NULL) OR 
    (obra_id IS NULL AND actividad_id IS NOT NULL) OR
    (obra_id IS NOT NULL AND actividad_id IS NOT NULL)
);

-- 6. Actualizar permisos si es necesario
GRANT SELECT ON public.kpis TO anon;
GRANT ALL PRIVILEGES ON public.kpis TO authenticated;

COMMIT;

-- Verificación final
SELECT 
    'Verificación final' as status,
    COUNT(*) as total_kpis,
    COUNT(CASE WHEN obra_id IS NOT NULL AND actividad_id IS NULL THEN 1 END) as kpis_obra,
    COUNT(CASE WHEN actividad_id IS NOT NULL THEN 1 END) as kpis_actividad
FROM public.kpis;