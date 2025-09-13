-- Crear tabla de historial de KPIs
-- Fecha: 2025-01-14

-- Crear tabla kpi_historial para almacenar el historial de cambios de KPIs
CREATE TABLE IF NOT EXISTS public.kpi_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES public.kpis(id) ON DELETE CASCADE,
    valor NUMERIC NOT NULL,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_kpi_historial_kpi_id ON public.kpi_historial(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_historial_fecha ON public.kpi_historial(fecha_registro DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.kpi_historial ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
CREATE POLICY "Users can view KPI historial" ON public.kpi_historial
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert KPI historial" ON public.kpi_historial
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update KPI historial" ON public.kpi_historial
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can delete KPI historial" ON public.kpi_historial
    FOR DELETE
    TO authenticated
    USING (true);

-- Otorgar permisos a los roles
GRANT SELECT ON public.kpi_historial TO anon;
GRANT ALL PRIVILEGES ON public.kpi_historial TO authenticated;

-- Comentarios para documentación
COMMENT ON TABLE public.kpi_historial IS 'Historial de cambios y valores de KPIs';
COMMENT ON COLUMN public.kpi_historial.kpi_id IS 'Referencia al KPI principal';
COMMENT ON COLUMN public.kpi_historial.valor IS 'Valor registrado del KPI';
COMMENT ON COLUMN public.kpi_historial.fecha_registro IS 'Fecha y hora del registro';
COMMENT ON COLUMN public.kpi_historial.observaciones IS 'Observaciones adicionales del registro';