-- Migración para corregir permisos de la tabla evidencia_fotografica
-- Fecha: 2024-01-15
-- Descripción: Otorgar permisos necesarios a los roles anon y authenticated

-- Verificar permisos actuales
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'evidencia_fotografica'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Otorgar permisos básicos de lectura al rol anon
GRANT SELECT ON evidencia_fotografica TO anon;

-- Otorgar permisos completos al rol authenticated
GRANT ALL PRIVILEGES ON evidencia_fotografica TO authenticated;

-- Verificar que los permisos se otorgaron correctamente
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'evidencia_fotografica'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Crear políticas RLS para evidencia_fotografica si no existen

-- Política para permitir lectura a usuarios autenticados
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver evidencias" ON evidencia_fotografica;
CREATE POLICY "Usuarios autenticados pueden ver evidencias" 
ON evidencia_fotografica FOR SELECT 
TO authenticated 
USING (true);

-- Política para permitir inserción a usuarios autenticados
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar evidencias" ON evidencia_fotografica;
CREATE POLICY "Usuarios autenticados pueden insertar evidencias" 
ON evidencia_fotografica FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = subido_por);

-- Política para permitir actualización a usuarios autenticados (solo sus propias evidencias)
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus evidencias" ON evidencia_fotografica;
CREATE POLICY "Usuarios pueden actualizar sus evidencias" 
ON evidencia_fotografica FOR UPDATE 
TO authenticated 
USING (auth.uid() = subido_por)
WITH CHECK (auth.uid() = subido_por);

-- Política para permitir eliminación a usuarios autenticados (solo sus propias evidencias)
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus evidencias" ON evidencia_fotografica;
CREATE POLICY "Usuarios pueden eliminar sus evidencias" 
ON evidencia_fotografica FOR DELETE 
TO authenticated 
USING (auth.uid() = subido_por);

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'evidencia_fotografica';

COMMIT;