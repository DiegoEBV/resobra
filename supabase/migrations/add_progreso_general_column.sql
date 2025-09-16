-- Agregar columna progreso_general a la tabla frentes
ALTER TABLE frentes ADD COLUMN progreso_general INTEGER DEFAULT 0;

-- Agregar comentario a la columna
COMMENT ON COLUMN frentes.progreso_general IS 'Progreso general del frente de trabajo en porcentaje (0-100)';

-- Agregar constraint para validar que el progreso esté entre 0 y 100
ALTER TABLE frentes ADD CONSTRAINT check_progreso_general_range CHECK (progreso_general >= 0 AND progreso_general <= 100);