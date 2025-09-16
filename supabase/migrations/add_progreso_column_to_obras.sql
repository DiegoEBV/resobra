-- Agregar columna 'progreso' a la tabla 'obras'
-- Esta columna almacenará el porcentaje de progreso de la obra (0-100)

ALTER TABLE public.obras 
ADD COLUMN progreso NUMERIC(5,2) DEFAULT 0.00;

-- Agregar comentario a la columna
COMMENT ON COLUMN public.obras.progreso IS 'Porcentaje de progreso de la obra (0.00 - 100.00)';

-- Agregar constraint para validar que el progreso esté entre 0 y 100
ALTER TABLE public.obras 
ADD CONSTRAINT check_progreso_range 
CHECK (progreso >= 0 AND progreso <= 100);

-- Actualizar obras existentes con progreso inicial basado en el estado
UPDATE public.obras 
SET progreso = CASE 
    WHEN estado = 'planificacion' THEN 0.00
    WHEN estado = 'activa' THEN 25.00
    WHEN estado = 'suspendida' THEN 50.00
    WHEN estado = 'finalizada' THEN 100.00
    ELSE 0.00
END
WHERE progreso IS NULL OR progreso = 0.00;