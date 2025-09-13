-- Migración para corregir permisos de KPIs y agregar nuevos campos
-- Fecha: 2025-01-14

-- Primero, agregar los nuevos campos a la tabla kpis
ALTER TABLE public.kpis ADD COLUMN IF NOT EXISTS costo_ejecutado NUMERIC DEFAULT 0;
ALTER TABLE public.kpis ADD COLUMN IF NOT EXISTS costo_presupuestado NUMERIC DEFAULT 0;
ALTER TABLE public.kpis ADD COLUMN IF NOT EXISTS personal_asignado INTEGER DEFAULT 0;
ALTER TABLE public.kpis ADD COLUMN IF NOT EXISTS maquinaria_utilizada TEXT;
ALTER TABLE public.kpis ADD COLUMN IF NOT EXISTS incidentes_seguridad INTEGER DEFAULT 0;
ALTER TABLE public.kpis ADD COLUMN IF NOT EXISTS clima_condiciones TEXT;
ALTER TABLE public.kpis ADD COLUMN IF NOT EXISTS observaciones_tecnicas TEXT;
ALTER TABLE public.kpis ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo';
ALTER TABLE public.kpis ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.kpis ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Otorgar permisos básicos a los roles anon y authenticated
GRANT SELECT ON public.kpis TO anon;
GRANT ALL PRIVILEGES ON public.kpis TO authenticated;

-- Crear políticas RLS más permisivas para authenticated users
DROP POLICY IF EXISTS "Users can view KPIs" ON public.kpis;
DROP POLICY IF EXISTS "Users can insert KPIs" ON public.kpis;
DROP POLICY IF EXISTS "Users can update KPIs" ON public.kpis;
DROP POLICY IF EXISTS "Users can delete KPIs" ON public.kpis;

-- Política para ver KPIs (todos los usuarios autenticados)
CREATE POLICY "Users can view KPIs" ON public.kpis
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para insertar KPIs (todos los usuarios autenticados)
CREATE POLICY "Users can insert KPIs" ON public.kpis
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política para actualizar KPIs (todos los usuarios autenticados)
CREATE POLICY "Users can update KPIs" ON public.kpis
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política para eliminar KPIs (todos los usuarios autenticados)
CREATE POLICY "Users can delete KPIs" ON public.kpis
    FOR DELETE
    TO authenticated
    USING (true);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_kpis_obra_id ON public.kpis(obra_id);
CREATE INDEX IF NOT EXISTS idx_kpis_fecha ON public.kpis(fecha);
CREATE INDEX IF NOT EXISTS idx_kpis_estado ON public.kpis(estado);

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN public.kpis.costo_ejecutado IS 'Costo real ejecutado hasta la fecha';
COMMENT ON COLUMN public.kpis.costo_presupuestado IS 'Costo presupuestado para el período';
COMMENT ON COLUMN public.kpis.personal_asignado IS 'Número de personal asignado al proyecto';
COMMENT ON COLUMN public.kpis.maquinaria_utilizada IS 'Descripción de maquinaria utilizada';
COMMENT ON COLUMN public.kpis.incidentes_seguridad IS 'Número de incidentes de seguridad reportados';
COMMENT ON COLUMN public.kpis.clima_condiciones IS 'Condiciones climáticas durante el período';
COMMENT ON COLUMN public.kpis.observaciones_tecnicas IS 'Observaciones técnicas adicionales';
COMMENT ON COLUMN public.kpis.estado IS 'Estado del KPI: activo, inactivo, revisión';
COMMENT ON COLUMN public.kpis.created_by IS 'Usuario que creó el registro';
COMMENT ON COLUMN public.kpis.updated_at IS 'Fecha de última actualización';