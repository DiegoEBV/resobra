-- Script para corregir errores en evidencia fotográfica
-- Fecha: 2025-01-16

-- 1. Verificar permisos actuales para evidencia_fotografica
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'evidencia_fotografica'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- 2. Asegurar que los permisos estén correctamente otorgados
GRANT SELECT, INSERT, UPDATE, DELETE ON evidencia_fotografica TO authenticated;
GRANT SELECT ON evidencia_fotografica TO anon;

-- 3. Verificar que RLS esté habilitado
ALTER TABLE evidencia_fotografica ENABLE ROW LEVEL SECURITY;

-- 4. Recrear políticas RLS más robustas (eliminar y recrear)
DROP POLICY IF EXISTS "Users can view evidencia from their projects" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Users can insert evidencia in their projects" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Users can update their own evidencia" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Users can delete their own evidencia" ON evidencia_fotografica;

-- Política mejorada para SELECT - más permisiva para debugging
CREATE POLICY "Users can view evidencia from their projects" ON evidencia_fotografica
  FOR SELECT USING (
    -- Permitir a usuarios autenticados ver evidencia de sus proyectos
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM actividades a
        JOIN user_obras uo ON a.obra_id = uo.obra_id
        WHERE a.id = evidencia_fotografica.actividad_id
        AND uo.user_id = auth.uid()
      )
      OR subido_por = auth.uid() -- También pueden ver lo que subieron
    )
  );

-- Política mejorada para INSERT - más robusta
CREATE POLICY "Users can insert evidencia in their projects" ON evidencia_fotografica
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    subido_por = auth.uid() AND
    EXISTS (
      SELECT 1 FROM actividades a
      JOIN user_obras uo ON a.obra_id = uo.obra_id
      WHERE a.id = actividad_id
      AND uo.user_id = auth.uid()
    )
  );

-- Política para UPDATE - solo propios archivos
CREATE POLICY "Users can update their own evidencia" ON evidencia_fotografica
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    subido_por = auth.uid()
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    subido_por = auth.uid()
  );

-- Política para DELETE - solo propios archivos
CREATE POLICY "Users can delete their own evidencia" ON evidencia_fotografica
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    subido_por = auth.uid()
  );

-- 5. Verificar que las funciones de trigger existan
CREATE OR REPLACE FUNCTION update_evidencia_fotografica_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Recrear trigger si no existe
DROP TRIGGER IF EXISTS update_evidencia_fotografica_updated_at_trigger ON evidencia_fotografica;
CREATE TRIGGER update_evidencia_fotografica_updated_at_trigger
  BEFORE UPDATE ON evidencia_fotografica
  FOR EACH ROW
  EXECUTE FUNCTION update_evidencia_fotografica_updated_at();

-- 7. Verificar configuración final
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'evidencia_fotografica';

-- 8. Mostrar políticas activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'evidencia_fotografica';