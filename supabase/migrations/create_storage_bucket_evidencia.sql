-- Crear bucket para evidencia fotográfica
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidencia-fotografica',
  'evidencia-fotografica',
  false,
  10485760, -- 10MB límite por archivo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir a usuarios autenticados subir archivos
CREATE POLICY "Usuarios autenticados pueden subir evidencia" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'evidencia-fotografica' AND
  auth.role() = 'authenticated'
);

-- Política para permitir a usuarios autenticados ver sus archivos
CREATE POLICY "Usuarios autenticados pueden ver evidencia" ON storage.objects
FOR SELECT USING (
  bucket_id = 'evidencia-fotografica' AND
  auth.role() = 'authenticated'
);

-- Política para permitir a usuarios autenticados actualizar sus archivos
CREATE POLICY "Usuarios autenticados pueden actualizar evidencia" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'evidencia-fotografica' AND
  auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'evidencia-fotografica' AND
  auth.role() = 'authenticated'
);

-- Política para permitir a usuarios autenticados eliminar sus archivos
CREATE POLICY "Usuarios autenticados pueden eliminar evidencia" ON storage.objects
FOR DELETE USING (
  bucket_id = 'evidencia-fotografica' AND
  auth.role() = 'authenticated'
);

-- Habilitar RLS en la tabla storage.objects si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Comentario informativo
COMMENT ON POLICY "Usuarios autenticados pueden subir evidencia" ON storage.objects IS 'Permite a usuarios autenticados subir evidencia fotográfica';
COMMENT ON POLICY "Usuarios autenticados pueden ver evidencia" ON storage.objects IS 'Permite a usuarios autenticados ver evidencia fotográfica';
COMMENT ON POLICY "Usuarios autenticados pueden actualizar evidencia" ON storage.objects IS 'Permite a usuarios autenticados actualizar evidencia fotográfica';
COMMENT ON POLICY "Usuarios autenticados pueden eliminar evidencia" ON storage.objects IS 'Permite a usuarios autenticados eliminar evidencia fotográfica';