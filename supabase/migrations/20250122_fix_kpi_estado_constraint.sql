-- Migración para corregir la restricción CHECK del campo estado en la tabla kpis
-- Fecha: 2025-01-22
-- Propósito: Incluir 'activo' como valor válido y eliminar KPIs de prueba

-- 1. Eliminar KPIs de prueba que puedan estar causando duplicados
DELETE FROM kpis 
WHERE observaciones_tecnicas LIKE '%prueba%' 
   OR observaciones_tecnicas LIKE '%test%' 
   OR observaciones_tecnicas LIKE '%Test%'
   OR observaciones_tecnicas LIKE '%KPI de prueba%'
   OR observaciones_tecnicas LIKE '%Verificación de permisos%'
   OR observaciones_tecnicas LIKE '%Funcionalidad restaurada%';

-- 2. Verificar si existe la restricción CHECK actual
DO $$
BEGIN
    -- Eliminar la restricción CHECK existente si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'kpis_estado_check'
    ) THEN
        ALTER TABLE kpis DROP CONSTRAINT kpis_estado_check;
        RAISE NOTICE 'Restricción CHECK existente eliminada';
    END IF;
END $$;

-- 3. Actualizar registros existentes que puedan tener estados no válidos
UPDATE kpis 
SET estado = 'activo' 
WHERE estado NOT IN ('pendiente', 'en_progreso', 'completado', 'cancelado', 'activo');

-- 4. Crear nueva restricción CHECK que incluya 'activo'
ALTER TABLE kpis 
ADD CONSTRAINT kpis_estado_check 
CHECK (estado IN ('pendiente', 'en_progreso', 'completado', 'cancelado', 'activo'));

-- 5. Verificar que la restricción se aplicó correctamente
SELECT 
    constraint_name, 
    check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'kpis_estado_check';

-- 6. Mostrar estadísticas de limpieza
SELECT 
    COUNT(*) as total_kpis,
    COUNT(CASE WHEN estado = 'activo' THEN 1 END) as kpis_activos,
    COUNT(CASE WHEN observaciones_tecnicas LIKE '%prueba%' THEN 1 END) as kpis_prueba_restantes
FROM kpis;

COMMIT;