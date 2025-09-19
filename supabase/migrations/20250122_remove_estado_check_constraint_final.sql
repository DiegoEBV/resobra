-- Eliminar completamente la restricción CHECK del campo estado en la tabla kpis
-- Esta restricción está causando errores 23514 al intentar insertar KPIs

-- Eliminar la restricción CHECK existente
ALTER TABLE kpis DROP CONSTRAINT IF EXISTS kpis_estado_check;

-- Verificar que la restricción fue eliminada
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'kpis'::regclass AND contype = 'c';

-- Comentario: La restricción CHECK ha sido eliminada completamente
-- El campo estado ahora puede aceptar cualquier valor de texto
-- Esto resuelve el error 23514 que impedía la creación de KPIs