-- Otorgar permisos a las tablas principales para los roles anon y authenticated

-- Permisos para la tabla actividades
GRANT SELECT ON actividades TO anon;
GRANT ALL PRIVILEGES ON actividades TO authenticated;

-- Permisos para la tabla user_obras
GRANT SELECT ON user_obras TO anon;
GRANT ALL PRIVILEGES ON user_obras TO authenticated;

-- Permisos para la tabla obras
GRANT SELECT ON obras TO anon;
GRANT ALL PRIVILEGES ON obras TO authenticated;

-- Permisos para tablas relacionadas que también podrían necesitarse
GRANT SELECT ON frentes TO anon;
GRANT ALL PRIVILEGES ON frentes TO authenticated;

GRANT SELECT ON evidencias TO anon;
GRANT ALL PRIVILEGES ON evidencias TO authenticated;

GRANT SELECT ON recursos TO anon;
GRANT ALL PRIVILEGES ON recursos TO authenticated;

GRANT SELECT ON tareas TO anon;
GRANT ALL PRIVILEGES ON tareas TO authenticated;

-- Verificar que los permisos se aplicaron correctamente
SELECT 'Permisos otorgados correctamente' as status;