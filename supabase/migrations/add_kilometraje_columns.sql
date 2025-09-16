-- Agregar columnas de kilometraje a la tabla actividades
ALTER TABLE actividades 
ADD COLUMN kilometraje_inicio DECIMAL(10,3),
ADD COLUMN kilometraje_fin DECIMAL(10,3);

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN actividades.kilometraje_inicio IS 'Kilometraje inicial de la actividad';
COMMENT ON COLUMN actividades.kilometraje_fin IS 'Kilometraje final de la actividad';