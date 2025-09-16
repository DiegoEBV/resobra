-- Verificar si los datos de prueba se crearon correctamente
SELECT 'Verificando datos en actividades:' as info;
SELECT COUNT(*) as total_actividades FROM actividades;
SELECT id, fecha, tipo_actividad, estado, responsable FROM actividades LIMIT 5;

-- Verificar permisos actuales
SELECT 'Verificando permisos:' as info;
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'actividades'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Verificar políticas RLS
SELECT 'Verificando políticas RLS:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'actividades';

-- Verificar si RLS está habilitado
SELECT 'Estado RLS:' as info;
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'actividades';

-- Crear datos de prueba si no existen
INSERT INTO actividades (
    obra_id, 
    frente_id, 
    user_id, 
    tipo_actividad, 
    fecha, 
    ubicacion, 
    responsable, 
    estado,
    observaciones
) 
SELECT 
    (SELECT id FROM obras LIMIT 1),
    (SELECT id FROM frentes LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    'Actividad de Prueba',
    CURRENT_DATE,
    '{"lat": -16.5, "lng": -68.15}',
    'Responsable Test',
    'programado',
    'Actividad creada para pruebas'
WHERE NOT EXISTS (SELECT 1 FROM actividades WHERE tipo_actividad = 'Actividad de Prueba');

-- Otorgar permisos básicos si no existen
GRANT SELECT ON actividades TO anon;
GRANT ALL PRIVILEGES ON actividades TO authenticated;

-- Verificar datos después de la inserción
SELECT 'Datos después de inserción:' as info;
SELECT COUNT(*) as total_actividades_final FROM actividades;
SELECT id, tipo_actividad, fecha, estado FROM actividades WHERE tipo_actividad = 'Actividad de Prueba';