-- Verificar permisos actuales para la tabla tareas
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'tareas'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Verificar políticas RLS existentes para tareas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'tareas';

-- Otorgar permisos básicos si no existen
GRANT SELECT, INSERT, UPDATE, DELETE ON tareas TO authenticated;
GRANT SELECT ON tareas TO anon;

-- Crear políticas RLS básicas si no existen
DROP POLICY IF EXISTS "Users can view all tareas" ON tareas;
CREATE POLICY "Users can view all tareas" ON tareas
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert tareas" ON tareas;
CREATE POLICY "Authenticated users can insert tareas" ON tareas
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update tareas" ON tareas;
CREATE POLICY "Authenticated users can update tareas" ON tareas
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete tareas" ON tareas;
CREATE POLICY "Authenticated users can delete tareas" ON tareas
  FOR DELETE