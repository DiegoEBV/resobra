-- Crear datos de prueba para frentes y asignaciones de usuario
-- Usar el primer usuario disponible en lugar de auth.uid()

-- Insertar obras de prueba si no existen
INSERT INTO obras (id, nombre, descripcion, ubicacion, fecha_inicio, estado)
SELECT 
  gen_random_uuid(),
  'Obra Residencial Los Pinos',
  'Construcción de conjunto residencial de 50 viviendas',
  'Av. Los Pinos 123, Lima',
  '2024-01-15',
  'activa'
WHERE NOT EXISTS (
  SELECT 1 FROM obras WHERE nombre = 'Obra Residencial Los Pinos'
);

INSERT INTO obras (id, nombre, descripcion, ubicacion, fecha_inicio, estado)
SELECT 
  gen_random_uuid(),
  'Edificio Comercial Centro',
  'Construcción de edificio comercial de 8 pisos',
  'Jr. Comercio 456, Lima',
  '2024-02-01',
  'activa'
WHERE NOT EXISTS (
  SELECT 1 FROM obras WHERE nombre = 'Edificio Comercial Centro'
);

-- Asignar el primer usuario disponible a las obras creadas
INSERT INTO user_obras (user_id, obra_id, rol_obra)
SELECT 
  u.id,
  o.id,
  'residente'
FROM users u
CROSS JOIN obras o
WHERE o.nombre IN ('Obra Residencial Los Pinos', 'Edificio Comercial Centro')
  AND u.email = 'residente@cvh.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_obras uo 
    WHERE uo.user_id = u.id AND uo.obra_id = o.id
  )
LIMIT 2;

-- Crear frentes para las obras
INSERT INTO frentes (obra_id, nombre, descripcion, estado)
SELECT 
  o.id,
  'Frente A - Cimentación',
  'Trabajos de excavación y cimentación',
  'activo'
FROM obras o
WHERE o.nombre = 'Obra Residencial Los Pinos'
  AND NOT EXISTS (
    SELECT 1 FROM frentes f 
    WHERE f.obra_id = o.id AND f.nombre = 'Frente A - Cimentación'
  );

INSERT INTO frentes (obra_id, nombre, descripcion, estado)
SELECT 
  o.id,
  'Frente B - Estructura',
  'Construcción de estructura de concreto armado',
  'activo'
FROM obras o
WHERE o.nombre = 'Obra Residencial Los Pinos'
  AND NOT EXISTS (
    SELECT 1 FROM frentes f 
    WHERE f.obra_id = o.id AND f.nombre = 'Frente B - Estructura'
  );

INSERT INTO frentes (obra_id, nombre, descripcion, estado)
SELECT 
  o.id,
  'Frente C - Acabados',
  'Trabajos de acabados interiores y exteriores',
  'activo'
FROM obras o
WHERE o.nombre = 'Obra Residencial Los Pinos'
  AND NOT EXISTS (
    SELECT 1 FROM frentes f 
    WHERE f.obra_id = o.id AND f.nombre = 'Frente C - Acabados'
  );

-- Frentes para el edificio comercial
INSERT INTO frentes (obra_id, nombre, descripcion, estado)
SELECT 
  o.id,
  'Frente 1 - Sótanos',
  'Construcción de sótanos y estacionamientos',
  'activo'
FROM obras o
WHERE o.nombre = 'Edificio Comercial Centro'
  AND NOT EXISTS (
    SELECT 1 FROM frentes f 
    WHERE f.obra_id = o.id AND f.nombre = 'Frente 1 - Sótanos'
  );

INSERT INTO frentes (obra_id, nombre, descripcion, estado)
SELECT 
  o.id,
  'Frente 2 - Torre Principal',
  'Construcción de la torre principal del edificio',
  'activo'
FROM obras o
WHERE o.nombre = 'Edificio Comercial Centro'
  AND NOT EXISTS (
    SELECT 1 FROM frentes f 
    WHERE f.obra_id = o.id AND f.nombre = 'Frente 2 - Torre Principal'
  );

-- Verificar los datos creados
SELECT 
  'Datos creados correctamente' as mensaje,
  COUNT(DISTINCT uo.obra_id) as obras_asignadas,
  COUNT(f.id) as frentes_disponibles
FROM user_obras uo
JOIN frentes f ON f.obra_id = uo.obra_id
JOIN users u ON uo.user_id = u.id
WHERE u.email = 'residente@cvh.com' AND f.estado = 'activo';

-- Mostrar frentes disponibles para el usuario residente@cvh.com
SELECT 
  f.id,
  f.nombre,
  f.descripcion,
  o.nombre as obra_nombre,
  u.email as usuario
FROM frentes f
JOIN obras o ON f.obra_id = o.id
JOIN user_obras uo ON o.id = uo.obra_id
JOIN users u ON uo.user_id = u.id
WHERE u.email = 'residente@cvh.com' AND f.estado = 'activo'
ORDER BY o.nombre, f.nombre;