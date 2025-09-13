-- Insertar registros en user_obras para asignar obras a usuarios
-- Basado en el diagnóstico: hay 3 usuarios y 2 obras, pero 0 registros en user_obras
-- Estructura correcta: user_id, obra_id, rol_obra, assigned_at

-- Asignar obra "Remodelación Plaza Principal" al usuario residente@cvh.com
INSERT INTO user_obras (user_id, obra_id, rol_obra, assigned_at)
VALUES (
  '4fb82129-7475-4b55-ac52-8a712baa409b', -- residente@cvh.com
  'e52e9478-f475-4727-b8b1-3f5c61a29441', -- Remodelación Plaza Principal
  'residente',
  NOW()
);

-- Asignar obra "Ampliación Vía Expresa" al usuario residente@cvh.com
INSERT INTO user_obras (user_id, obra_id, rol_obra, assigned_at)
VALUES (
  '4fb82129-7475-4b55-ac52-8a712baa409b', -- residente@cvh.com
  '63316f90-3003-4855-9335-ce48f50939cf', -- Ampliación Vía Expresa
  'residente',
  NOW()
);

-- Asignar obra "Remodelación Plaza Principal" al usuario produccion@cvh.com
INSERT INTO user_obras (user_id, obra_id, rol_obra, assigned_at)
VALUES (
  'a824cffd-0014-448b-8db1-b25b49f16f90', -- produccion@cvh.com
  'e52e9478-f475-4727-b8b1-3f5c61a29441', -- Remodelación Plaza Principal
  'logistica',
  NOW()
);

-- Asignar obra "Ampliación Vía Expresa" al usuario produccion@cvh.com
INSERT INTO user_obras (user_id, obra_id, rol_obra, assigned_at)
VALUES (
  'a824cffd-0014-448b-8db1-b25b49f16f90', -- produccion@cvh.com
  '63316f90-3003-4855-9335-ce48f50939cf', -- Ampliación Vía Expresa
  'logistica',
  NOW()
);

-- Verificar permisos para la tabla user_obras
-- Otorgar permisos básicos a los roles anon y authenticated
GRANT SELECT ON user_obras TO anon;
GRANT ALL PRIVILEGES ON user_obras TO authenticated;

-- Verificar que los registros se insertaron correctamente
SELECT 
  uo.user_id,
  uo.obra_id,
  uo.rol_obra,
  o.nombre as obra_nombre
FROM user_obras uo
JOIN obras o ON uo.obra_id = o.id
ORDER BY uo.user_id, o.nombre;