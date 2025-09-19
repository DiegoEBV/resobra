-- Consulta para revisar restricciones CHECK en la tabla kpis
-- Esta consulta mostrará todas las restricciones CHECK existentes

SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.kpis'::regclass 
AND contype = 'c'
ORDER BY conname;

-- También verificar si hay restricciones que mencionen 'estado'
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.kpis'::regclass 
AND contype = 'c'
AND pg_get_constraintdef(oid) ILIKE '%estado%'
ORDER BY conname;