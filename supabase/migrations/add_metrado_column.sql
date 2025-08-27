-- Agregar columna metrado a la tabla items
ALTER TABLE items ADD COLUMN metrado DECIMAL(10,2) DEFAULT 0;

-- Comentario para la nueva columna
COMMENT ON COLUMN items.metrado IS 'Metrado de la partida - valor fijo que se almacena en la base de datos';