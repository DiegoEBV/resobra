-- Migración para agregar actividad_id a la tabla kpis
-- Fecha: 2025-01-15
-- Descripción: Permitir que los KPIs se asignen a actividades específicas además de obras

BEGIN;

-- Agregar columna actividad_id a la tabla kpis
ALTER TABLE public.kpis ADD COLUMN IF NOT EXISTS actividad_id UUID;

-- Hacer obra_id opcional (permitir NULL)
ALTER TABLE public.kpis ALTER COLUMN obra_id DROP NOT NULL;

-- Agregar foreign key constraint para actividad_id
ALTER TABLE public.kpis 
ADD CONSTRAINT fk_kpis_actividad_id 
FOREIGN KEY (actividad_id) REFERENCES public.actividades(id) ON DELETE CASCADE;

-- Agregar constraint para asegurar que al menos uno de obra_id o actividad_id esté presente
ALTER TABLE public.kpis 
ADD CONSTRAINT chk_kpis_obra_or_actividad 
CHECK (
    (obra_id IS NOT NULL AND actividad_id IS NULL) OR 
    (obra_id IS NULL AND actividad_id IS NOT NULL) OR
    (obra_id IS NOT NULL AND actividad_id IS NOT NULL)
);

-- Eliminar la constraint única existente (obra_id, fecha)
ALTER TABLE public.kpis DROP CONSTRAINT IF EXISTS kpis_obra_id_fecha_key;

-- Crear nueva constraint única que considere tanto obra_id como actividad_id
-- Para KPIs de obra: única por obra_id y fecha
-- Para KPIs de actividad: única por actividad_id y fecha
CREATE UNIQUE INDEX IF NOT EXISTS idx_kpis_obra_fecha 
ON public.kpis (obra_id, fecha) 
WHERE actividad_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_kpis_actividad_fecha 
ON public.kpis (actividad_id, fecha) 
WHERE obra_id IS NULL OR actividad_id IS NOT NULL;

-- Crear índice para actividad_id
CREATE INDEX IF NOT EXISTS idx_kpis_actividad_id ON public.kpis(actividad_id);

-- Actualizar políticas RLS para incluir KPIs por actividad
DROP POLICY IF EXISTS "Users can view KPIs" ON public.kpis;
DROP POLICY IF EXISTS "Users can insert KPIs" ON public.kpis;
DROP POLICY IF EXISTS "Users can update KPIs" ON public.kpis;
DROP POLICY IF EXISTS "Users can delete KPIs" ON public.kpis;

-- Política para ver KPIs (obras y actividades del usuario)
CREATE POLICY "Users can view KPIs" ON public.kpis
    FOR SELECT
    TO authenticated
    USING (
        -- KPIs de obras asignadas al usuario
        (obra_id IS NOT NULL AND obra_id IN (
            SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text
        )) OR
        -- KPIs de actividades en obras asignadas al usuario
        (actividad_id IS NOT NULL AND actividad_id IN (
            SELECT a.id FROM actividades a 
            JOIN user_obras uo ON a.obra_id = uo.obra_id 
            WHERE uo.user_id::text = auth.uid()::text
        ))
    );

-- Política para insertar KPIs
CREATE POLICY "Users can insert KPIs" ON public.kpis
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Puede crear KPIs para obras asignadas
        (obra_id IS NOT NULL AND obra_id IN (
            SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text
        )) OR
        -- Puede crear KPIs para actividades en obras asignadas
        (actividad_id IS NOT NULL AND actividad_id IN (
            SELECT a.id FROM actividades a 
            JOIN user_obras uo ON a.obra_id = uo.obra_id 
            WHERE uo.user_id::text = auth.uid()::text
        ))
    );

-- Política para actualizar KPIs
CREATE POLICY "Users can update KPIs" ON public.kpis
    FOR UPDATE
    TO authenticated
    USING (
        (obra_id IS NOT NULL AND obra_id IN (
            SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text
        )) OR
        (actividad_id IS NOT NULL AND actividad_id IN (
            SELECT a.id FROM actividades a 
            JOIN user_obras uo ON a.obra_id = uo.obra_id 
            WHERE uo.user_id::text = auth.uid()::text
        ))
    )
    WITH CHECK (
        (obra_id IS NOT NULL AND obra_id IN (
            SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text
        )) OR
        (actividad_id IS NOT NULL AND actividad_id IN (
            SELECT a.id FROM actividades a 
            JOIN user_obras uo ON a.obra_id = uo.obra_id 
            WHERE uo.user_id::text = auth.uid()::text
        ))
    );

-- Política para eliminar KPIs
CREATE POLICY "Users can delete KPIs" ON public.kpis
    FOR DELETE
    TO authenticated
    USING (
        (obra_id IS NOT NULL AND obra_id IN (
            SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text
        )) OR
        (actividad_id IS NOT NULL AND actividad_id IN (
            SELECT a.id FROM actividades a 
            JOIN user_obras uo ON a.obra_id = uo.obra_id 
            WHERE uo.user_id::text = auth.uid()::text
        ))
    );

-- Comentarios para documentar el nuevo campo
COMMENT ON COLUMN public.kpis.actividad_id IS 'ID de la actividad específica (opcional, alternativo a obra_id)';

-- Crear función para obtener obra_id desde actividad_id cuando sea necesario
CREATE OR REPLACE FUNCTION get_obra_from_actividad(p_actividad_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT obra_id FROM actividades WHERE id = p_actividad_id);
END;
$$ LANGUAGE plpgsql;

COMMIT;