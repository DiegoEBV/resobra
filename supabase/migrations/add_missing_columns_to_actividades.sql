-- Agregar columnas faltantes a la tabla actividades
ALTER TABLE actividades 
ADD COLUMN IF NOT EXISTS requiere_maquinaria BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requiere_materiales BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS es_critica BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ubicacion_direccion TEXT;

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN actividades.requiere_maquinaria IS 'Indica si la actividad requiere maquinaria especializada';
COMMENT ON COLUMN actividades.requiere_materiales IS 'Indica si la actividad requiere materiales específicos';
COMMENT ON COLUMN actividades.es_critica IS 'Indica si la actividad es crítica para el proyecto';
COMMENT ON COLUMN actividades.ubicacion_direccion IS 'Dirección textual de la ubicación de la actividad';