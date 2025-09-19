-- Migración para actualizar el esquema de evaluaciones con campos profesionales
-- Fecha: 2025-01-15
-- Descripción: Actualizar tabla evaluaciones para soportar el nuevo formulario completo

-- Agregar nuevos campos a la tabla evaluaciones
-- Primero agregar el campo estado que no existe
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'borrador';

-- Actualizar el tipo_evaluacion existente
ALTER TABLE evaluaciones ALTER COLUMN tipo_evaluacion SET DEFAULT 'desempeño';

-- Competencias Técnicas
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS conocimiento_tecnico INTEGER DEFAULT 3 CHECK (conocimiento_tecnico >= 1 AND conocimiento_tecnico <= 5);
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS obs_conocimiento_tecnico TEXT;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS calidad_trabajo INTEGER DEFAULT 3 CHECK (calidad_trabajo >= 1 AND calidad_trabajo <= 5);
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS obs_calidad_trabajo TEXT;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS productividad INTEGER DEFAULT 3 CHECK (productividad >= 1 AND productividad <= 5);
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS obs_productividad TEXT;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS seguridad_laboral INTEGER DEFAULT 3 CHECK (seguridad_laboral >= 1 AND seguridad_laboral <= 5);
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS obs_seguridad_laboral TEXT;

-- Competencias Interpersonales
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS trabajo_equipo INTEGER DEFAULT 3 CHECK (trabajo_equipo >= 1 AND trabajo_equipo <= 5);
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS obs_trabajo_equipo TEXT;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS comunicacion INTEGER DEFAULT 3 CHECK (comunicacion >= 1 AND comunicacion <= 5);
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS obs_comunicacion TEXT;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS liderazgo INTEGER DEFAULT 3 CHECK (liderazgo >= 1 AND liderazgo <= 5);
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS obs_liderazgo TEXT;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS adaptabilidad INTEGER DEFAULT 3 CHECK (adaptabilidad >= 1 AND adaptabilidad <= 5);
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS obs_adaptabilidad TEXT;

-- Competencias Organizacionales
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS puntualidad INTEGER DEFAULT 3 CHECK (puntualidad >= 1 AND puntualidad <= 5);
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS obs_puntualidad TEXT;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS iniciativa INTEGER DEFAULT 3 CHECK (iniciativa >= 1 AND iniciativa <= 5);
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS obs_iniciativa TEXT;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS compromiso INTEGER DEFAULT 3 CHECK (compromiso >= 1 AND compromiso <= 5);
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS obs_compromiso TEXT;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS resolucion_problemas INTEGER DEFAULT 3 CHECK (resolucion_problemas >= 1 AND resolucion_problemas <= 5);
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS obs_resolucion_problemas TEXT;

-- Objetivos y Metas
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS objetivos_cumplidos TEXT;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS objetivos_pendientes TEXT;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS porcentaje_cumplimiento VARCHAR(10);
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS calificacion_general VARCHAR(20);

-- Plan de Desarrollo
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS fortalezas TEXT;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS areas_mejora TEXT;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS recomendaciones_capacitacion TEXT;
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS objetivos_proximos TEXT;

-- Comentarios adicionales
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS comentarios_empleado TEXT;

-- Estado y Seguimiento
ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS requiere_seguimiento VARCHAR(2) DEFAULT 'no' CHECK (requiere_seguimiento IN ('si', 'no'));

-- Actualizar el campo estado para incluir más opciones
ALTER TABLE evaluaciones ALTER COLUMN estado TYPE VARCHAR(20);
ALTER TABLE evaluaciones ADD CONSTRAINT check_estado CHECK (estado IN ('borrador', 'completada', 'revisada', 'aprobada'));

-- Crear función para calcular puntuación total automáticamente
CREATE OR REPLACE FUNCTION calcular_puntuacion_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular promedio de todas las competencias
    NEW.puntuacion_total := (
        COALESCE(NEW.conocimiento_tecnico, 0) + 
        COALESCE(NEW.calidad_trabajo, 0) + 
        COALESCE(NEW.productividad, 0) + 
        COALESCE(NEW.seguridad_laboral, 0) +
        COALESCE(NEW.trabajo_equipo, 0) + 
        COALESCE(NEW.comunicacion, 0) + 
        COALESCE(NEW.liderazgo, 0) + 
        COALESCE(NEW.adaptabilidad, 0) +
        COALESCE(NEW.puntualidad, 0) + 
        COALESCE(NEW.iniciativa, 0) + 
        COALESCE(NEW.compromiso, 0) + 
        COALESCE(NEW.resolucion_problemas, 0)
    ) / 12.0;
    
    -- Determinar calificación general basada en puntuación
    IF NEW.puntuacion_total >= 4.5 THEN
        NEW.calificacion_general := 'excelente';
    ELSIF NEW.puntuacion_total >= 4.0 THEN
        NEW.calificacion_general := 'muy-bueno';
    ELSIF NEW.puntuacion_total >= 3.5 THEN
        NEW.calificacion_general := 'bueno';
    ELSIF NEW.puntuacion_total >= 3.0 THEN
        NEW.calificacion_general := 'regular';
    ELSE
        NEW.calificacion_general := 'deficiente';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para calcular puntuación automáticamente
DROP TRIGGER IF EXISTS trigger_calcular_puntuacion ON evaluaciones;
CREATE TRIGGER trigger_calcular_puntuacion
    BEFORE INSERT OR UPDATE ON evaluaciones
    FOR EACH ROW
    EXECUTE FUNCTION calcular_puntuacion_total();

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_evaluaciones_tipo ON evaluaciones(tipo_evaluacion);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_calificacion_general ON evaluaciones(calificacion_general);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_puntuacion_total ON evaluaciones(puntuacion_total);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_requiere_seguimiento ON evaluaciones(requiere_seguimiento);

-- Actualizar evaluaciones existentes con valores por defecto
UPDATE evaluaciones 
SET 
    tipo_evaluacion = COALESCE(tipo_evaluacion, 'desempeño'),
    conocimiento_tecnico = COALESCE(conocimiento_tecnico, 3),
    calidad_trabajo = COALESCE(calidad_trabajo, 3),
    productividad = COALESCE(productividad, 3),
    seguridad_laboral = COALESCE(seguridad_laboral, 3),
    trabajo_equipo = COALESCE(trabajo_equipo, 3),
    comunicacion = COALESCE(comunicacion, 3),
    liderazgo = COALESCE(liderazgo, 3),
    adaptabilidad = COALESCE(adaptabilidad, 3),
    puntualidad = COALESCE(puntualidad, 3),
    iniciativa = COALESCE(iniciativa, 3),
    compromiso = COALESCE(compromiso, 3),
    resolucion_problemas = COALESCE(resolucion_problemas, 3),
    requiere_seguimiento = COALESCE(requiere_seguimiento, 'no')
WHERE 
    tipo_evaluacion IS NULL OR
    conocimiento_tecnico IS NULL OR
    calidad_trabajo IS NULL OR
    productividad IS NULL OR
    seguridad_laboral IS NULL OR
    trabajo_equipo IS NULL OR
    comunicacion IS NULL OR
    liderazgo IS NULL OR
    adaptabilidad IS NULL OR
    puntualidad IS NULL OR
    iniciativa IS NULL OR
    compromiso IS NULL OR
    resolucion_problemas IS NULL OR
    requiere_seguimiento IS NULL;

-- Crear vista para resumen de evaluaciones
CREATE OR REPLACE VIEW vista_resumen_evaluaciones AS
SELECT 
    e.evaluado_id,
    u.nombre as empleado_nombre,
    u.rol as puesto,
    COUNT(e.id) as evaluaciones_completadas,
    AVG(e.puntuacion_total) as promedio_general,
    MAX(e.fecha_evaluacion) as ultima_evaluacion,
    CASE 
        WHEN COUNT(e.id) >= 2 THEN
            CASE 
                WHEN (
                    SELECT AVG(puntuacion_total) 
                    FROM evaluaciones e2 
                    WHERE e2.evaluado_id = e.evaluado_id 
                    AND e2.fecha_evaluacion >= (
                        SELECT fecha_evaluacion 
                        FROM evaluaciones e3 
                        WHERE e3.evaluado_id = e.evaluado_id 
                        ORDER BY fecha_evaluacion DESC 
                        OFFSET 1 LIMIT 1
                    )
                ) > (
                    SELECT AVG(puntuacion_total) 
                    FROM evaluaciones e2 
                    WHERE e2.evaluado_id = e.evaluado_id 
                    AND e2.fecha_evaluacion < (
                        SELECT fecha_evaluacion 
                        FROM evaluaciones e3 
                        WHERE e3.evaluado_id = e.evaluado_id 
                        ORDER BY fecha_evaluacion DESC 
                        OFFSET 1 LIMIT 1
                    )
                ) + 0.2 THEN 'mejorando'
                WHEN (
                    SELECT AVG(puntuacion_total) 
                    FROM evaluaciones e2 
                    WHERE e2.evaluado_id = e.evaluado_id 
                    AND e2.fecha_evaluacion >= (
                        SELECT fecha_evaluacion 
                        FROM evaluaciones e3 
                        WHERE e3.evaluado_id = e.evaluado_id 
                        ORDER BY fecha_evaluacion DESC 
                        OFFSET 1 LIMIT 1
                    )
                ) < (
                    SELECT AVG(puntuacion_total) 
                    FROM evaluaciones e2 
                    WHERE e2.evaluado_id = e.evaluado_id 
                    AND e2.fecha_evaluacion < (
                        SELECT fecha_evaluacion 
                        FROM evaluaciones e3 
                        WHERE e3.evaluado_id = e.evaluado_id 
                        ORDER BY fecha_evaluacion DESC 
                        OFFSET 1 LIMIT 1
                    )
                ) - 0.2 THEN 'declinando'
                ELSE 'estable'
            END
        ELSE 'estable'
    END as tendencia
FROM evaluaciones e
JOIN users u ON e.evaluado_id = u.id
WHERE e.estado IN ('completada', 'aprobada')
GROUP BY e.evaluado_id, u.nombre, u.rol;

-- Otorgar permisos en la vista
GRANT SELECT ON vista_resumen_evaluaciones TO authenticated;
GRANT SELECT ON vista_resumen_evaluaciones TO anon;