-- Actualizar algunas actividades para testing del dashboard
-- Cambiar estado de algunas actividades a 'finalizado' para probar el cálculo de progreso
-- Estados válidos: 'programado', 'ejecucion', 'finalizado'

UPDATE actividades 
SET estado = 'finalizado', 
    progreso_porcentaje = 100,
    updated_at = NOW()
WHERE id = '5fadee2d-3ee9-41df-9d2c-8a2cfb3ef310';

-- Verificar que la actualización fue exitosa
SELECT id, estado, progreso_porcentaje 
FROM actividades 
WHERE id = '5fadee2d-3ee9-41df-9d2c-8a2cfb3ef310';

-- Mostrar estadísticas actuales
SELECT 
    estado,
    COUNT(*) as cantidad
FROM actividades 
GROUP BY estado
ORDER BY estado;