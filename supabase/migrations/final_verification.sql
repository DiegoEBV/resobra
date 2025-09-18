-- Verificación final del estado de asignaciones y KPIs
-- Esta consulta verifica que todo esté funcionando correctamente

-- 1. Verificar usuarios existentes
SELECT 'USUARIOS EXISTENTES' as verificacion, COUNT(*) as total FROM users;

-- 2. Verificar obras existentes
SELECT 'OBRAS EXISTENTES' as verificacion, COUNT(*) as total FROM obras;

-- 3. Verificar asignaciones usuario-obra
SELECT 'ASIGNACIONES USER_OBRAS' as verificacion, COUNT(*) as total FROM user_obras;

-- 4. Verificar que cada usuario tenga al menos una obra asignada
SELECT 
    'USUARIOS CON OBRAS ASIGNADAS' as verificacion,
    COUNT(DISTINCT uo.user_id) as usuarios_con_obras,
    (SELECT COUNT(*) FROM users) as total_usuarios
FROM user_obras uo;

-- 5. Verificar que cada obra tenga al menos un usuario asignado
SELECT 
    'OBRAS CON USUARIOS ASIGNADOS' as verificacion,
    COUNT(DISTINCT uo.obra_id) as obras_con_usuarios,
    (SELECT COUNT(*) FROM obras) as total_obras
FROM user_obras uo;

-- 6. Detalle completo de asignaciones
SELECT 
    'DETALLE ASIGNACIONES' as verificacion,
    u.email as usuario_email,
    o.nombre as obra_nombre,
    o.ubicacion as obra_ubicacion
FROM user_obras uo
JOIN users u ON uo.user_id = u.id
JOIN obras o ON uo.obra_id = o.id
ORDER BY u.email, o.nombre;

-- 7. Verificar KPIs existentes
SELECT 'KPIS EXISTENTES' as verificacion, COUNT(*) as total FROM kpis;

-- 8. Verificar actividades existentes
SELECT 'ACTIVIDADES EXISTENTES' as verificacion, COUNT(*) as total FROM actividades;

-- 9. Estado final del sistema
SELECT 
    'RESUMEN FINAL' as verificacion,
    (SELECT COUNT(*) FROM users) as usuarios,
    (SELECT COUNT(*) FROM obras) as obras,
    (SELECT COUNT(*) FROM user_obras) as asignaciones,
    (SELECT COUNT(*) FROM kpis) as kpis,
    (SELECT COUNT(*) FROM actividades) as actividades;