-- Corregir permisos para la tabla evidencia_fotografica v2
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver todas las evidencias" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar evidencias" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar evidencias" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar evidencias" ON evidencia_fotografica;

-- Otorgar permisos básicos a los roles
GRANT SELECT, INSERT, UPDATE, DELETE ON evidencia_fotografica TO authenticated;
GRANT SELECT ON evidencia_fotografica TO anon;

-- Crear políticas RLS más permisivas para usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden ver todas las evidencias"
  ON evidencia_fotografica
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar evidencias"
  ON evidencia_fotografica
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar evidencias"
  ON evidencia_fotografica
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar evidencias"
  ON evidencia_fotografica
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Verificar permisos actuales
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'evidencia_fotografica'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;