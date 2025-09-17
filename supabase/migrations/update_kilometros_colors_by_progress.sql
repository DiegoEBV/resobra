-- Función para actualizar colores de kilómetros basado en progreso y estado
CREATE OR REPLACE FUNCTION update_kilometro_color_by_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Determinar color basado en progreso y estado
    IF NEW.progreso_porcentaje = 0 THEN
        NEW.color := '#9CA3AF'; -- Gris para no iniciado
        NEW.estado := 'no_iniciado';
    ELSIF NEW.progreso_porcentaje > 0 AND NEW.progreso_porcentaje < 100 THEN
        NEW.color := '#F59E0B'; -- Amarillo para en progreso
        NEW.estado := 'en_progreso';
    ELSIF NEW.progreso_porcentaje = 100 THEN
        NEW.color := '#10B981'; -- Verde para completado
        NEW.estado := 'completado';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar automáticamente el color cuando cambie el progreso
DROP TRIGGER IF EXISTS trigger_update_kilometro_color ON kilometros;
CREATE TRIGGER trigger_update_kilometro_color
    BEFORE UPDATE OF progreso_porcentaje ON kilometros
    FOR EACH ROW
    EXECUTE FUNCTION update_kilometro_color_by_progress();

-- Actualizar todos los kilómetros existentes con colores basados en progreso
UPDATE kilometros 
SET 
    color = CASE 
        WHEN progreso_porcentaje = 0 THEN '#9CA3AF'
        WHEN progreso_porcentaje > 0 AND progreso_porcentaje < 100 THEN '#F59E0B'
        WHEN progreso_porcentaje = 100 THEN '#10B981'
        ELSE '#9CA3AF'
    END,
    estado = CASE 
        WHEN progreso_porcentaje = 0 THEN 'no_iniciado'
        WHEN progreso_porcentaje > 0 AND progreso_porcentaje < 100 THEN 'en_progreso'
        WHEN progreso_porcentaje = 100 THEN 'completado'
        ELSE 'no_iniciado'
    END;

-- Verificar la actualización
SELECT 
    k.kilometro,
    k.estado,
    k.color,
    k.progreso_porcentaje,
    k.actividades_count,
    f.nombre as frente_nombre
FROM kilometros k
JOIN frentes f ON k.frente_id = f.id
ORDER BY f.nombre, k.kilometro;