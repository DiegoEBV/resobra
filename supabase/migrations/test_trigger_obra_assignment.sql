-- Probar el trigger de asignación automática creando una obra de prueba
-- Esta obra debería asignarse automáticamente a todos los usuarios existentes

-- Insertar una obra de prueba
INSERT INTO obras (
    nombre,
    descripcion,
    ubicacion,
    fecha_inicio,
    fecha_fin_estimada,
    estado,
    presupuesto
) VALUES (
    'Obra de Prueba - Trigger Automático',
    'Esta obra se creó para probar el sistema de asignación automática de usuarios',
    'Ubicación de Prueba',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'planificacion',
    100000.00
);

-- Verificar que la obra se creó correctamente
SELECT 
    id,
    nombre,
    descripcion,
    estado,
    created_at
FROM obras 
WHERE nombre = 'Obra de Prueba - Trigger Automático'
ORDER BY created_at DESC
LIMIT 1;

-- Verificar que el trigger asignó automáticamente la obra a todos los usuarios
SELECT 
    u.email as usuario_email,
    u.nombre as usuario_nombre,
    u.rol as rol_usuario,
    o.nombre as obra_nombre,
    uo.rol_obra as rol_asignado_obra,
    uo.assigned_at as fecha_asignacion
FROM user_obras uo
JOIN public.users u ON uo.user_id = u.id
JOIN obras o ON uo.obra_id = o.id
WHERE o.nombre = 'Obra de Prueba - Trigger Automático'
ORDER BY u.email;

-- Contar cuántos usuarios fueron asignados automáticamente a la nueva obra
SELECT 
    COUNT(*) as usuarios_asignados_automaticamente
FROM user_obras uo
JOIN obras o ON uo.obra_id = o.id
WHERE o.nombre = 'Obra de Prueba - Trigger Automático';