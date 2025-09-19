-- Insertar asignaciones de obras para usuarios
-- Fecha: 2025-01-15

-- Insertar asignación del usuario residente a la obra disponible
INSERT INTO user_obras (user_id, obra_id, rol_obra)
SELECT 
    u.id as user_id,
    o.id as obra_id,
    'residente' as rol_obra
FROM users u
CROSS JOIN obras o
WHERE u.email = 'residente@cvh.com'
  AND u.rol = 'residente'
  AND NOT EXISTS (
    SELECT 1 FROM user_obras uo 
    WHERE uo.user_id = u.id AND uo.obra_id = o.id
  );

-- Insertar asignación del usuario de producción a la obra disponible
INSERT INTO user_obras (user_id, obra_id, rol_obra)
SELECT 
    u.id as user_id,
    o.id as obra_id,
    'logistica' as rol_obra
FROM users u
CROSS JOIN obras o
WHERE u.email = 'produccion@cvh.com'
  AND u.rol = 'logistica'
  AND NOT EXISTS (
    SELECT 1 FROM user_obras uo 
    WHERE uo.user_id = u.id AND uo.obra_id = o.id
  );

-- Verificar las asignaciones creadas
SELECT 
    uo.id,
    u.email,
    u.nombre as usuario_nombre,
    u.rol as usuario_rol,
    o.nombre as obra_nombre,
    uo.rol_obra,
    uo.assigned_at
FROM user_obras uo
JOIN users u ON uo.user_id = u.id
JOIN obras o ON uo.obra_id = o.id
ORDER BY u.email, o.nombre;