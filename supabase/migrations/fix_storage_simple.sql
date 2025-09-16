-- Migración simple para corregir bucket evidencia-fotografica
-- Fecha: 2025-01-15
-- Descripción: Configuración básica del bucket sin modificar permisos de sistema

-- Crear o actualizar el bucket
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
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  updated_at = now();

-- Eliminar políticas existentes de storage.objects para el bucket
DROP POLICY IF EXISTS "Authenticated users can upload to evidencia bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view evidencia files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update evidencia files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete evidencia files" ON storage.objects;

-- Crear políticas básicas para storage.objects
CREATE POLICY "Authenticated users can upload to evidencia bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidencia-fotografica'
);

CREATE POLICY "Authenticated users can view evidencia files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidencia-fotografica'
);

CREATE POLICY "Authenticated users can update evidencia files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidencia-fotografica'
)
WITH CHECK (
  bucket_id = 'evidencia-fotografica'
);

CREATE POLICY "Authenticated users can delete evidencia files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidencia-fotografica'
);

-- Verificar que el bucket existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'evidencia-fotografica') THEN
    RAISE EXCEPTION 'Bucket evidencia-fotografica no pudo ser creado';
  END IF;
  
  RAISE NOTICE 'Bucket evidencia-fotografica configurado exitosamente';
END $$;

-- Log de aplicación
SELECT 'Migración de Storage aplicada exitosamente' as resultado;