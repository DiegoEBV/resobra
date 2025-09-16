-- Verificar datos de frentes para el usuario actual
-- Paso 1: Ver el usuario actual autenticado
SELECT 
  auth.uid() as current_user_id,
  u.email,
  u.nombre
FROM users u 
WHERE u.id = auth.uid();

-- Paso 2: Ver obras asignadas al usuario actual
SELECT 
  uo.id,
  uo.user_id,
  uo.obra_id,
  uo.rol_obra,
  o.nombre as obra_nombre,
  o.descripcion as obra_descripcion
FROM user_obras uo
JOIN obras o ON uo.obra_id = o.id
WHERE uo.user_id = auth.uid();

-- Paso 3: Ver frentes disponibles para las obras del usuario
SELECT 
  f.id as frente_id,
  f.nombre as frente_nombre,
  f.descripcion as frente_descripcion,
  f.estado as frente_estado,
  o.nombre as obra_nombre,
  uo.rol_obra
FROM frentes f
JOIN obras o ON f.obra_id = o.id
JOIN user_obras uo ON o.id = uo.obra_id
WHERE uo.user_id = auth.uid()
  AND f.estado = 'activo'
ORDER BY o.nombre, f.nombre;

-- Paso 4: Contar totales
SELECT 
  'Total usuarios' as tipo,
  COUNT(*) as cantidad
FROM users
UNION ALL
SELECT 
  'Total obras' as tipo,
  COUNT(*) as cantidad
FROM obras
UNION ALL
SELECT 
  'Total user_obras' as tipo,
  COUNT(*) as cantidad
FROM user_obras
UNION ALL
SELECT 
  'Total frentes' as tipo,
  COUNT(*) as cantidad
FROM frentes
UNION ALL
SELECT 
  'Frentes activos' as tipo,
  COUNT(*) as cantidad
FROM frentes
WHERE estado = 'activo';