-- Agregar columna fecha_fin_estimada a la tabla frentes
ALTER TABLE frentes ADD COLUMN fecha_fin_estimada DATE;

-- Agregar comentario a la columna
COMMENT ON COLUMN frentes.fecha_fin_estimada IS 'Fecha estimada de finalización del frente de trabajo';