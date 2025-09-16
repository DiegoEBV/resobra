-- Agregar columna 'calificaciones' a la tabla evaluaciones
-- Esta columna almacenará las calificaciones individuales por criterio

ALTER TABLE evaluaciones 
ADD COLUMN calificaciones JSONB;

-- Comentario para la nueva columna
COMMENT ON COLUMN evaluaciones.calificaciones IS 'Calificaciones individuales por criterio de evaluación en formato JSON';

-- Crear índice para mejorar el rendimiento de consultas sobre calificaciones
CREATE INDEX idx_evaluaciones_calificaciones ON evaluaciones USING GIN (calificaciones);

-- Actualizar las políticas RLS existentes para incluir la nueva columna
-- Las políticas existentes ya cubren toda la tabla, por lo que no necesitan modificación específica

-- Verificar que los permisos existentes cubran la nueva columna
-- Los permisos GRANT ALL PRIVILEGES ya incluyen la nueva columna automáticamente