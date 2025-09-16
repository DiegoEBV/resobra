-- Migración crítica para corregir permisos de Storage
-- Fecha: 2025-01-15
-- Descripción: Soluciona errores críticos de subida de evidencia fotográfica

-- Verificar y crear bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidencia-fotografica',
  'evidencia-fotografica', 
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Eliminar políticas existentes para recrearlas
DROP POLICY IF EXISTS "Users can upload evidencia images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view evidencia images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update evidencia images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete evidencia images" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir evidencia" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver evidencia" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar evidencia" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar evidencia" ON storage.objects;

-- Habilitar RLS en storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Otorgar permisos básicos a roles
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;
GRANT SELECT ON storage.buckets TO anon;

-- Política PERMISIVA para INSERT (subir archivos)
CREATE POLICY "Authenticated users can upload to evidencia bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidencia-fotografica' AND
  auth.role() = 'authenticated'
);

-- Política PERMISIVA para SELECT (ver archivos)
CREATE POLICY "Authenticated users can view evidencia files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidencia-fotografica' AND
  auth.role() = 'authenticated'
);

-- Política PERMISIVA para UPDATE (actualizar archivos)
CREATE POLICY "Authenticated users can update evidencia files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidencia-fotografica' AND
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'evidencia-fotografica' AND
  auth.role() = 'authenticated'
);

-- Política PERMISIVA para DELETE (eliminar archivos)
CREATE POLICY "Authenticated users can delete evidencia files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidencia-fotografica' AND
  auth.role() = 'authenticated'
);

-- Verificar permisos en la tabla evidencia_fotografica
GRANT ALL PRIVILEGES ON evidencia_fotografica TO authenticated;
GRANT SELECT ON evidencia_fotografica TO anon;

-- Política PERMISIVA para INSERT en evidencia_fotografica
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar evidencias" ON evidencia_fotografica;
CREATE POLICY "Authenticated users can insert evidencia"
ON evidencia_fotografica FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Política PERMISIVA para SELECT en evidencia_fotografica
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver evidencias" ON evidencia_fotografica;
CREATE POLICY "Authenticated users can view evidencia"
ON evidencia_fotografica FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- Política PERMISIVA para UPDATE en evidencia_fotografica
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar evidencias" ON evidencia_fotografica;
CREATE POLICY "Authenticated users can update evidencia"
ON evidencia_fotografica FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Política PERMISIVA para DELETE en evidencia_fotografica
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar evidencias" ON evidencia_fotografica;
CREATE POLICY "Authenticated users can delete evidencia"
ON evidencia_fotografica FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Comentarios informativos
COMMENT ON POLICY "Authenticated users can upload to evidencia bucket" ON storage.objects IS 'Permite a usuarios autenticados subir archivos al bucket evidencia-fotografica';
COMMENT ON POLICY "Authenticated users can view evidencia files" ON storage.objects IS 'Permite a usuarios autenticados ver archivos del bucket evidencia-fotografica';
COMMENT ON POLICY "Authenticated users can update evidencia files" ON storage.objects IS 'Permite a usuarios autenticados actualizar archivos del bucket evidencia-fotografica';
COMMENT ON POLICY "Authenticated users can delete evidencia files" ON storage.objects IS 'Permite a usuarios autenticados eliminar archivos del bucket evidencia-fotografica';

COMMENT ON POLICY "Authenticated users can insert evidencia" ON evidencia_fotografica IS 'Permite a usuarios autenticados insertar registros de evidencia';
COMMENT ON POLICY "Authenticated users can view evidencia" ON evidencia_fotografica IS 'Permite a usuarios autenticados ver registros de evidencia';
COMMENT ON POLICY "Authenticated users can update evidencia" ON evidencia_fotografica IS 'Permite a usuarios autenticados actualizar registros de evidencia';
COMMENT ON POLICY "Authenticated users can delete evidencia" ON evidencia_fotografica IS 'Permite a usuarios autenticados eliminar registros de evidencia';

-- Log de aplicación
SELECT 'Migración de permisos críticos aplicada exitosamente' as resultado;