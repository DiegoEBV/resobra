-- Migración para agregar columna rubrica_id a la tabla evaluaciones
-- Esta columna es necesaria para la relación con rubricas_evaluacion

-- Agregar la columna rubrica_id a la tabla evaluaciones
ALTER TABLE evaluaciones 
ADD COLUMN rubrica_id uuid;

-- Crear el foreign key constraint hacia rubricas_evaluacion
ALTER TABLE evaluaciones 
ADD CONSTRAINT fk_evaluaciones_rubrica_id 
FOREIGN KEY (rubrica_id) REFERENCES rubricas_evaluacion(id) ON DELETE SET NULL;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX idx_evaluaciones_rubrica_id ON evaluaciones(rubrica_id);

-- Asignar una rúbrica por defecto a las evaluaciones existentes (si las hay)
-- Usamos la primera rúbrica activa disponible
UPDATE evaluaciones 
SET rubrica_id = (
    SELECT id 
    FROM rubricas_evaluacion 
    WHERE activa = true 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE rubrica_id IS NULL;

-- Comentario sobre la migración
COMMENT ON COLUMN evaluaciones.rubrica_id IS 'ID de la rúbrica de evaluación utilizada para esta evaluación';