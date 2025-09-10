-- Verificar datos del usuario actual y sus asignaciones
-- Esta consulta ayuda a diagnosticar por qué no aparecen frentes en el dropdown

-- 1. Verificar usuarios existentes
SELECT 'USUARIOS EXISTENTES:' as info;
SELECT id, email, nombre, rol, created_at FROM users ORDER BY created_at;

-- 2. Verificar obras disponibles
SELECT 'OBRAS DISPONIBLES:' as info;
SELECT id, nombre, descripcion, estado FROM obras ORDER BY id;

-- 3. Verificar frentes disponibles
SELECT 'FRENTES DISPONIBLES:' as info;
SELECT f.id, f.nombre, f.descripcion, f.obra_id, o.nombre as obra_nombre, f.estado 
FROM frentes f 
JOIN obras o ON f.obra_id = o.id 
ORDER BY f.obra_id, f.id;

-- 4. Verificar asignaciones user_obras
SELECT 'ASIGNACIONES USER_OBRAS:' as info;
SELECT uo.id, uo.user_id, u.email, u.nombre as user_nombre, uo.obra_id, o.nombre as obra_nombre, uo.rol_obra, uo.assigned_at
FROM user_obras uo
JOIN users u ON uo.user_id = u.id
JOIN obras o ON uo.obra_id = o.id
ORDER BY uo.assigned_at;

-- 5. Verificar la consulta que usa el frontend (simulando el query del servicio)
SELECT 'FRENTES QUE DEBERÍA VER EL USUARIO:' as info;
SELECT DISTINCT f.id, f.nombre, f.descripcion, f.obra_id, o.nombre as obra_nombre
FROM frentes f
JOIN obras o ON f.obra_id = o.id
JOIN user_obras uo ON o.id = uo.obra_id
JOIN users u ON uo.user_id = u.id
WHERE f.estado = 'activo'
AND u.email LIKE '%@%' -- Cualquier usuario con email válido
ORDER BY o.nombre, f.nombre;