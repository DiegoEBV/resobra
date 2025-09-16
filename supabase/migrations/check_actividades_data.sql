-- Verificar datos de actividades en la base de datos

-- 1. Contar total de actividades
SELECT 'Total actividades' as descripcion, COUNT(*) as cantidad FROM actividades;

-- 2. Mostrar las primeras 5 actividades con información básica
SELECT 
    'Primeras 5 actividades' as descripcion,
    id,
    tipo_actividad,
    estado,
    user_id,
    frente_id,
    created_at
FROM actividades 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verificar usuarios en la tabla users
SELECT 'Usuarios registrados' as descripcion, COUNT(*) as cantidad FROM auth.users;

-- 4. Verificar frentes disponibles
SELECT 'Frentes disponibles' as descripcion, COUNT(*) as cantidad FROM frentes;

-- 5. Verificar relación actividades-frentes
SELECT 
    'Actividades con frente' as descripcion,
    a.id as actividad_id,
    a.tipo_actividad,
    f.nombre as frente_nombre,
    a.estado
FROM actividades a
LEFT JOIN frentes f ON a.frente_id = f.id
LIMIT 3;

-- 6. Verificar permisos actuales
SELECT 
    'Permisos tabla actividades' as descripcion,
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'actividades' 
AND grantee IN ('anon', 'authenticated');