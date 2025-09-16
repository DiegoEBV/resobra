-- Migración para verificar y crear el bucket evidencia-fotografica
-- Fecha: 2024-01-15
-- Descripción: Asegura que el bucket evidencia-fotografica exista con la configuración correcta

-- Crear el bucket si no existe (usando INSERT con ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidencia-fotografica',
  'evidencia-fotografica',
  false,
  10485760, -- 10MB en bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  updated_at = now();

-- Verificar que el bucket existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'evidencia-fotografica') THEN
    RAISE EXCEPTION 'Bucket evidencia-fotografica no pudo ser creado';
  END IF;
  
  RAISE NOTICE 'Bucket evidencia-fotografica verificado exitosamente';
END $$;