-- Simular login del usuario de prueba
-- Este script verifica que el usuario de prueba puede autenticarse

-- Verificar que el usuario existe
SELECT 'VERIFICANDO USUARIO DE PRUEBA:' as info;
SELECT id, email, nombre, rol, created_at 
FROM users 
WHERE email = 'test@obras.com';

-- Verificar sus asignaciones de obras
SELECT 'OBRAS ASIGNADAS AL USUARIO:' as info;
SELECT 
    u.email,
    o.nombre as obra_nombre,
    uo.rol_obra,
    COUNT(f.id) as total_frentes
FROM users u
JOIN user_obras uo ON u.id = uo.user_id
JOIN obras o ON uo.obra_id = o.id
LEFT JOIN frentes f ON o.id = f.obra_id AND f.estado = 'activo'
WHERE u.email = 'test@obras.com'
GROUP BY u.email, o.nombre, uo.rol_obra
ORDER BY o.nombre;

-- Verificar frentes disponibles para el usuario
SELECT 'FRENTES DISPONIBLES PARA EL USUARIO:' as info;
SELECT 
    f.id,
    f.nombre as frente_nombre,
    f.descripcion,
    o.nombre as obra_nombre,
    f.estado
FROM frentes f
JOIN obras o ON f.obra_id = o.id
JOIN user_obras uo ON o.id = uo.obra_id
JOIN users u ON uo.user_id = u.id
WHERE u.email = 'test@obras.com'
AND f.estado = 'activo'
ORDER BY o.nombre, f.nombre;

-- Contar total de frentes por usuario
SELECT 'RESUMEN DE FRENTES POR USUARIO:' as info;
SELECT 
    u.email,
    u.nombre,
    COUNT(DISTINCT o.id) as total_obras,
    COUNT(f.id) as total_frentes_activos
FROM users u
JOIN user_obras uo ON u.id = uo.user_id
JOIN obras o ON uo.obra_id = o.id
LEFT JOIN frentes f ON o.id = f.obra_id AND f.estado = 'activo'
WHERE u.email = 'test@obras.com'
GROUP BY u.email, u.nombre;