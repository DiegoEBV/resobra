-- Agregar columna distancia_total a la tabla actividades
ALTER TABLE public.actividades 
ADD COLUMN distancia_total NUMERIC(10,3);

-- Comentario para la nueva columna
COMMENT ON COLUMN public.actividades.distancia_total IS 'Distancia total calculada automáticamente desde el mapa en kilómetros';

-- Actualizar registros existentes con valor por defecto
UPDATE public.actividades 
SET distancia_total = 0.0 
WHERE distancia_total IS NULL;