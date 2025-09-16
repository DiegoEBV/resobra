-- Migración para Sistema de Obras Viales Kilométricas
-- Fecha: 2025-01-07
-- Descripción: Crear tablas kilometros y estados_config, actualizar tabla frentes y actividades

-- 1. Actualizar tabla frentes con campos kilométricos
ALTER TABLE frentes ADD COLUMN IF NOT EXISTS km_inicial DECIMAL(10,3);
ALTER TABLE frentes ADD COLUMN IF NOT EXISTS km_final DECIMAL(10,3);
ALTER TABLE frentes ADD COLUMN IF NOT EXISTS coordenadas_inicio JSONB;
ALTER TABLE frentes ADD COLUMN IF NOT EXISTS coordenadas_fin JSONB;
ALTER TABLE frentes ADD COLUMN IF NOT EXISTS estado_general VARCHAR(50) DEFAULT 'no_iniciado';

-- Índices para frentes
CREATE INDEX IF NOT EXISTS idx_frentes_km_inicial ON frentes(km_inicial);
CREATE INDEX IF NOT EXISTS idx_frentes_km_final ON frentes(km_final);
CREATE INDEX IF NOT EXISTS idx_frentes_estado ON frentes(estado_general);

-- 2. Crear tabla kilometros
CREATE TABLE IF NOT EXISTS kilometros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frente_id UUID REFERENCES frentes(id) ON DELETE CASCADE,
  kilometro DECIMAL(10,3) NOT NULL,
  estado VARCHAR(50) DEFAULT 'no_iniciado',
  color VARCHAR(7) DEFAULT '#6B7280',
  progreso_porcentaje INTEGER DEFAULT 0 CHECK (progreso_porcentaje >= 0 AND progreso_porcentaje <= 100),
  actividades_count INTEGER DEFAULT 0,
  fecha_ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para kilometros
CREATE INDEX IF NOT EXISTS idx_kilometros_frente_id ON kilometros(frente_id);
CREATE INDEX IF NOT EXISTS idx_kilometros_kilometro ON kilometros(kilometro);
CREATE INDEX IF NOT EXISTS idx_kilometros_estado ON kilometros(estado);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kilometros_frente_km ON kilometros(frente_id, kilometro);

-- 3. Actualizar tabla actividades
ALTER TABLE actividades ADD COLUMN IF NOT EXISTS kilometro DECIMAL(10,3);
ALTER TABLE actividades ADD COLUMN IF NOT EXISTS progreso_porcentaje INTEGER DEFAULT 0 CHECK (progreso_porcentaje >= 0 AND progreso_porcentaje <= 100);

-- Índices adicionales para actividades
CREATE INDEX IF NOT EXISTS idx_actividades_kilometro ON actividades(kilometro);
CREATE INDEX IF NOT EXISTS idx_actividades_frente_km ON actividades(frente_id, kilometro);
CREATE INDEX IF NOT EXISTS idx_actividades_progreso ON actividades(progreso_porcentaje);

-- 4. Crear tabla estados_config
CREATE TABLE IF NOT EXISTS estados_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estado_nombre VARCHAR(50) UNIQUE NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  umbral_minimo INTEGER DEFAULT 0,
  umbral_maximo INTEGER DEFAULT 100,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Datos iniciales para estados_config
INSERT INTO estados_config (estado_nombre, color_hex, umbral_minimo, umbral_maximo) 
VALUES
('no_iniciado', '#6B7280', 0, 0),
('en_progreso', '#F59E0B', 1, 99),
('completado', '#059669', 100, 100),
('con_observaciones', '#DC2626', 0, 100)
ON CONFLICT (estado_nombre) DO NOTHING;

-- 5. Configurar permisos
GRANT SELECT ON kilometros TO anon;
GRANT ALL PRIVILEGES ON kilometros TO authenticated;

GRANT SELECT ON estados_config TO anon;
GRANT ALL PRIVILEGES ON estados_config TO authenticated;

-- 6. Configurar Row Level Security (RLS)
ALTER TABLE kilometros ENABLE ROW LEVEL SECURITY;
ALTER TABLE estados_config ENABLE ROW LEVEL SECURITY;

-- Políticas para kilometros
DROP POLICY IF EXISTS "Kilometros are viewable by everyone" ON kilometros;
DROP POLICY IF EXISTS "Kilometros are editable by authenticated users" ON kilometros;

CREATE POLICY "Kilometros are viewable by everyone" ON kilometros FOR SELECT USING (true);
CREATE POLICY "Kilometros are editable by authenticated users" ON kilometros FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para estados_config
DROP POLICY IF EXISTS "Estados config are viewable by everyone" ON estados_config;
DROP POLICY IF EXISTS "Estados config are editable by authenticated users" ON estados_config;

CREATE POLICY "Estados config are viewable by everyone" ON estados_config FOR SELECT USING (true);
CREATE POLICY "Estados config are editable by authenticated users" ON estados_config FOR ALL USING (auth.role() = 'authenticated');

-- 7. Función para actualizar contador de actividades por kilómetro
CREATE OR REPLACE FUNCTION update_actividades_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar contador para el kilómetro afectado
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE kilometros 
    SET actividades_count = (
      SELECT COUNT(*) 
      FROM actividades 
      WHERE frente_id = NEW.frente_id AND kilometro = NEW.kilometro
    )
    WHERE frente_id = NEW.frente_id AND kilometro = NEW.kilometro;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE kilometros 
    SET actividades_count = (
      SELECT COUNT(*) 
      FROM actividades 
      WHERE frente_id = OLD.frente_id AND kilometro = OLD.kilometro
    )
    WHERE frente_id = OLD.frente_id AND kilometro = OLD.kilometro;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar contador automáticamente
DROP TRIGGER IF EXISTS trigger_update_actividades_count ON actividades;
CREATE TRIGGER trigger_update_actividades_count
  AFTER INSERT OR UPDATE OR DELETE ON actividades
  FOR EACH ROW
  EXECUTE FUNCTION update_actividades_count();

-- 8. Función para actualizar fecha de última actualización
CREATE OR REPLACE FUNCTION update_fecha_ultima_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_ultima_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar fecha automáticamente
DROP TRIGGER IF EXISTS trigger_update_fecha_kilometros ON kilometros;
CREATE TRIGGER trigger_update_fecha_kilometros
  BEFORE UPDATE ON kilometros
  FOR EACH ROW
  EXECUTE FUNCTION update_fecha_ultima_actualizacion();

COMMIT;