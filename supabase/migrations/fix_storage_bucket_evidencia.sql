-- Script para configurar correctamente el bucket de evidencia fotográfica
-- Fecha: 2025-01-16

-- 1. Crear el bucket si no existe (usando INSERT con ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidencia-fotografica',
  'evidencia-fotografica',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Verificar permisos en storage.objects
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'storage' 
  AND table_name = 'objects'
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- 3. Otorgar permisos básicos si no existen
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- 4. Eliminar políticas existentes para recrearlas
DROP POLICY IF EXISTS "Users can upload evidencia images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view evidencia images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their evidencia images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their evidencia images" ON storage.objects;

-- 5. Crear políticas mejoradas para el bucket evidencia-fotografica

-- Política para INSERT (subir archivos)
CREATE POLICY "Users can upload evidencia images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidencia-fotografica' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política para SELECT (ver archivos)
CREATE POLICY "Users can view evidencia images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidencia-fotografica' AND
    auth.role() = 'authenticated' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM evidencia_fotografica ef
        WHERE ef.url_imagen LIKE '%' || name || '%'
        AND EXISTS (
          SELECT 1 FROM actividades a
          JOIN user_obras uo ON a.obra_id = uo.obra_id
          WHERE a.id = ef.actividad_id
          AND uo.user_id = auth.uid()
        )
      )
    )
  );

-- Política para UPDATE (actualizar archivos propios)
CREATE POLICY "Users can update their evidencia images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'evidencia-fotografica' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'evidencia-fotografica' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política para DELETE (eliminar archivos propios)
CREATE POLICY "Users can delete their evidencia images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'evidencia-fotografica' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. Verificar que el bucket esté configurado correctamente
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id = 'evidencia-fotografica';

-- 7. Verificar políticas activas en storage.objects para el bucket
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
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%evidencia%';