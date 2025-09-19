-- Agregar campos faltantes a la tabla kpis
-- Fecha: 2025-01-19
-- Descripción: Agregar todos los campos requeridos por el formulario que faltan en la tabla

-- Agregar campos faltantes
ALTER TABLE kpis 
ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS productividad DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS maquinaria_utilizada TEXT,
ADD COLUMN IF NOT EXISTS clima_condiciones VARCHAR(100),
ADD COLUMN IF NOT EXISTS metricas_adicionales TEXT;

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN kpis.estado IS 'Estado del KPI: pendiente, en_progreso, completado, etc.';
COMMENT ON COLUMN kpis.productividad IS 'Índice de productividad (porcentaje)';
COMMENT ON COLUMN kpis.maquinaria_utilizada IS 'Descripción de la maquinaria utilizada';
COMMENT ON COLUMN kpis.clima_condiciones IS 'Condiciones climáticas durante la actividad';
COMMENT ON COLUMN kpis.metricas_adicionales IS 'Métricas adicionales en formato JSON o texto';

-- Agregar restricciones de validación
ALTER TABLE kpis 
ADD CONSTRAINT check_estado_valido 
CHECK (estado IN ('pendiente', 'en_progreso', 'completado', 'cancelado', 'pausado'));

ALTER TABLE kpis 
ADD CONSTRAINT check_productividad_rango 
CHECK (productividad IS NULL OR (productividad >= 0 AND productividad <= 200));

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_kpis_estado ON kpis(estado);
CREATE INDEX IF NOT EXISTS idx_kpis_productividad ON kpis(productividad) WHERE productividad IS NOT NULL;

-- Verificar que todos los campos requeridos existan
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'kpis'
ORDER BY ordinal_position;