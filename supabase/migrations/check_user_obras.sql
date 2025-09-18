-- Verificar si existe el usuario residente@cvh.com
SELECT id, email, nombre, rol, created_at FROM users WHERE email = 'residente@cvh.com';

-- Verificar todas las obras disponibles
SELECT id, nombre, estado, fecha_inicio, progreso FROM obras WHERE estado = 'activa';

-- Verificar datos en user_obras con información de usuarios y obras
SELECT 
    uo.id as user_obra_id,
    u.email as usuario_email,
    u.nombre as usuario_nombre,
    u.rol as usuario_rol,
    o.nombre as obra_nombre,
    o.estado as obra_estado,
    uo.rol_obra,
    uo.assigned_at
FROM user_obras uo
JOIN users u ON uo.user_id = u.id
JOIN obras o ON uo.obra_id = o.id
ORDER BY uo.assigned_at DESC;

-- Si no hay asignaciones para residente@cvh.com, crear una
-- Primero obtener los IDs necesarios
WITH user_data AS (
    SELECT id as user_id FROM users WHERE email = 'residente@cvh.com'
),
obra_data AS (
    SELECT id as obra_id FROM obras WHERE estado = 'activa' LIMIT 1
)
INSERT INTO user_obras (user_id, obra_id, rol_obra)
SELECT u.user_id, o.obra_id, 'residente'
FROM user_data u, obra_data o
WHERE NOT EXISTS (
    SELECT 1 FROM user_obras uo2 
    WHERE uo2.user_id = u.user_id AND uo2.obra_id = o.obra_id
);

-- Verificar la asignación después de la inserción
SELECT 
    uo.id as user_obra_id,
    u.email as usuario_email,
    o.nombre as obra_nombre,
    uo.rol_obra,
    uo.assigned_at
FROM user_obras uo
JOIN users u ON uo.user_id = u.id
JOIN obras o ON uo.obra_id = o.id
WHERE u.email = 'residente@cvh.com';

-- Contar registros en cada tabla
SELECT 'users' as tabla, COUNT(*) as total FROM users
UNION ALL
SELECT 'obras' as tabla, COUNT(*) as total FROM obras
UNION ALL
SELECT 'user_obras' as tabla, COUNT(*) as total FROM user_obras;