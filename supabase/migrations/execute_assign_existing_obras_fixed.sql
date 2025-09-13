-- Ejecutar función corregida para asignar todas las obras existentes a todos los usuarios
-- Esta función asignará automáticamente todas las obras que ya existen a los usuarios del sistema

SELECT * FROM assign_all_existing_obras_to_all_users();

-- Verificar el resultado de las asignaciones
SELECT 
    u.email as usuario_email,
    o.nombre as obra_nombre,
    uo.rol_obra as rol_asignado,
    uo.assigned_at as fecha_asignacion
FROM user_obras uo
JOIN auth.users u ON uo.user_id = u.id
JOIN obras o ON uo.obra_id = o.id
ORDER BY u.email, o.nombre;

-- Contar total de asignaciones por usuario
SELECT 
    u.email as usuario,
    COUNT(uo.obra_id) as total_obras_asignadas
FROM auth.users u
LEFT JOIN user_obras uo ON u.id = uo.user_id
WHERE u.email_confirmed_at IS NOT NULL
GROUP BY u.id, u.email
ORDER BY u.email;