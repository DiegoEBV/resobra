-- Crear tabla para evidencia fotográfica de actividades
CREATE TABLE IF NOT EXISTS evidencia_fotografica (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actividad_id UUID NOT NULL,
  url_imagen TEXT NOT NULL,
  descripcion TEXT,
  fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subido_por UUID NOT NULL,
  nombre_archivo TEXT,
  tamaño_archivo INTEGER,
  tipo_archivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_evidencia_fotografica_actividad_id ON evidencia_fotografica(actividad_id);
CREATE INDEX IF NOT EXISTS idx_evidencia_fotografica_subido_por ON evidencia_fotografica(subido_por);
CREATE INDEX IF NOT EXISTS idx_evidencia_fotografica_fecha_subida ON evidencia_fotografica(fecha_subida);

-- Habilitar RLS (Row Level Security)
ALTER TABLE evidencia_fotografica ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios autenticados puedan ver evidencia de sus proyectos
CREATE POLICY "Users can view evidencia from their projects" ON evidencia_fotografica
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM actividades a
      JOIN user_obras uo ON a.obra_id = uo.obra_id
      WHERE a.id = evidencia_fotografica.actividad_id
      AND uo.user_id = auth.uid()
    )
  );

-- Política para que los usuarios autenticados puedan insertar evidencia en sus proyectos
CREATE POLICY "Users can insert evidencia in their projects" ON evidencia_fotografica
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM actividades a
      JOIN user_obras uo ON a.obra_id = uo.obra_id
      WHERE a.id = evidencia_fotografica.actividad_id
      AND uo.user_id = auth.uid()
    )
    AND subido_por = auth.uid()
  );

-- Política para que los usuarios puedan actualizar evidencia que subieron
CREATE POLICY "Users can update their own evidencia" ON evidencia_fotografica
  FOR UPDATE USING (subido_por = auth.uid())
  WITH CHECK (subido_por = auth.uid());

-- Política para que los usuarios puedan eliminar evidencia que subieron
CREATE POLICY "Users can delete their own evidencia" ON evidencia_fotografica
  FOR DELETE USING (subido_por = auth.uid());

-- Otorgar permisos a los roles anon y authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON evidencia_fotografica TO authenticated;
GRANT SELECT ON evidencia_fotografica TO anon;

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_evidencia_fotografica_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_evidencia_fotografica_updated_at_trigger
  BEFORE UPDATE ON evidencia_fotografica
  FOR EACH ROW
  EXECUTE FUNCTION update_evidencia_fotografica_updated_at();