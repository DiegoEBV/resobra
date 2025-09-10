-- Crear relación de clave foránea entre actividades y frentes
ALTER TABLE actividades 
ADD CONSTRAINT fk_actividades_frente_id 
FOREIGN KEY (frente_id) REFERENCES frentes(id) ON DELETE CASCADE;

-- Crear relación de clave foránea entre actividades y obras
ALTER TABLE actividades 
ADD CONSTRAINT fk_actividades_obra_id 
FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE;

-- Crear relación de clave foránea entre frentes y obras
ALTER TABLE frentes 
ADD CONSTRAINT fk_frentes_obra_id 
FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE;

-- Verificar que las relaciones se crearon correctamente
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('actividades', 'frentes');