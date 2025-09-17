-- Verificar datos en las tablas principales
SELECT 'frentes' as tabla, COUNT(*) as total_registros FROM frentes
UNION ALL
SELECT 'actividades' as tabla, COUNT(*) as total_registros FROM actividades
UNION ALL
SELECT 'kilometros' as tabla, COUNT(*) as total_registros FROM kilometros;

-- Verificar datos específicos de frentes
SELECT id, nombre, estado, km_inicial, km_final FROM frentes LIMIT 5;

-- Verificar datos específicos de kilometros
SELECT id, frente_id, kilometro, estado, progreso_porcentaje FROM kilometros LIMIT 5;

-- Verificar datos específicos de actividades
SELECT id, frente_id, tipo_actividad, estado, kilometro, progreso_porcentaje FROM actividades LIMIT 5;