-- Fix foreign key relationship between actividades and users tables
-- First, clean up orphaned records and then add constraints

-- Step 1: Check and clean orphaned actividades records
DELETE FROM actividades 
WHERE user_id NOT IN (SELECT id FROM users);

-- Step 2: Check and clean orphaned user_obras records
DELETE FROM user_obras 
WHERE user_id NOT IN (SELECT id FROM users)
   OR obra_id NOT IN (SELECT id FROM obras);

-- Step 3: Check and clean orphaned evaluaciones records
DELETE FROM evaluaciones 
WHERE evaluador_id NOT IN (SELECT id FROM users)
   OR evaluado_id NOT IN (SELECT id FROM users)
   OR obra_id NOT IN (SELECT id FROM obras);

-- Step 4: Check and clean orphaned recursos records
DELETE FROM recursos 
WHERE actividad_id NOT IN (SELECT id FROM actividades);

-- Step 5: Check and clean orphaned evidencias records
DELETE FROM evidencias 
WHERE actividad_id NOT IN (SELECT id FROM actividades);

-- Step 6: Check and clean orphaned kpis records
DELETE FROM kpis 
WHERE obra_id NOT IN (SELECT id FROM obras);

-- Step 7: Now add the foreign key constraints
ALTER TABLE actividades 
ADD CONSTRAINT fk_actividades_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Add missing foreign key constraints for other tables
ALTER TABLE user_obras 
ADD CONSTRAINT fk_user_obras_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE user_obras 
ADD CONSTRAINT fk_user_obras_obra_id 
FOREIGN KEY (obra_id) 
REFERENCES obras(id) 
ON DELETE CASCADE;

ALTER TABLE evaluaciones 
ADD CONSTRAINT fk_evaluaciones_evaluador_id 
FOREIGN KEY (evaluador_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE evaluaciones 
ADD CONSTRAINT fk_evaluaciones_evaluado_id 
FOREIGN KEY (evaluado_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE evaluaciones 
ADD CONSTRAINT fk_evaluaciones_obra_id 
FOREIGN KEY (obra_id) 
REFERENCES obras(id) 
ON DELETE CASCADE;

ALTER TABLE recursos 
ADD CONSTRAINT fk_recursos_actividad_id 
FOREIGN KEY (actividad_id) 
REFERENCES actividades(id) 
ON DELETE CASCADE;

ALTER TABLE evidencias 
ADD CONSTRAINT fk_evidencias_actividad_id 
FOREIGN KEY (actividad_id) 
REFERENCES actividades(id) 
ON DELETE CASCADE;

ALTER TABLE kpis 
ADD CONSTRAINT fk_kpis_obra_id 
FOREIGN KEY (obra_id) 
REFERENCES obras(id) 
ON DELETE CASCADE;

-- Step 8: Grant permissions for anon and authenticated roles
GRANT SELECT ON actividades TO anon;
GRANT ALL PRIVILEGES ON actividades TO authenticated;

GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

GRANT SELECT ON obras TO anon;
GRANT ALL PRIVILEGES ON obras TO authenticated;

GRANT SELECT ON frentes TO anon;
GRANT ALL PRIVILEGES ON frentes TO authenticated;

GRANT SELECT ON user_obras TO anon;
GRANT ALL PRIVILEGES ON user_obras TO authenticated;

GRANT SELECT ON evaluaciones TO anon;
GRANT ALL PRIVILEGES ON evaluaciones TO authenticated;

GRANT SELECT ON recursos TO anon;
GRANT ALL PRIVILEGES ON recursos TO authenticated;

GRANT SELECT ON evidencias TO anon;
GRANT ALL PRIVILEGES ON evidencias TO authenticated;

GRANT SELECT ON kpis TO anon;
GRANT ALL PRIVILEGES ON kpis TO authenticated;