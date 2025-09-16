-- Ejecutar función corregida para asignar todas las obras existentes a todos los usuarios
-- Esta función usa la tabla public.users correcta

SELECT * FROM assign_all_existing_obras_to_all_users();

-- Verificar el resultado de las asignaciones
SELECT 
    u.email as usuario_email,
    u.nombre as usuario_nombre,
    o.nombre as obra_nombre,
    uo.rol_obra as rol_asignado,
    uo.assigned_at as fecha_asignacion
FROM user_obras uo
JOIN public.users u ON uo.user_id = u.id
JOIN obras o ON uo.obra_id = o.id
ORDER BY u.email, o.nombre;

-- Contar total de asignaciones por usuario
SELECT 
    u.email as usuario,
    u.nombre as nombre_usuario,
    u.rol as rol_usuario,
    COUNT(uo.obra_id) as total_obras_asignadas
FROM public.users u
LEFT JOIN user_obras uo ON u.id = uo.user_id
GROUP BY u.id, u.email, u.nombre, u.rol
ORDER BY u.email;

-- Verificar que el trigger esté activo
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_assign_obra_to_users';