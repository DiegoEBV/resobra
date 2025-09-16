-- Corrección de sintaxis SQL en consultas de KPIs
-- Fecha: 2025-01-15

-- Verificar que las funciones necesarias existan
-- Crear función auxiliar para obtener obra_id desde actividad_id si no existe
CREATE OR REPLACE FUNCTION get_obra_id_from_actividad(actividad_uuid UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT obra_id 
        FROM actividades 
        WHERE id = actividad_uuid
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear vista para simplificar consultas complejas de KPIs
CREATE OR REPLACE VIEW kpis_with_permissions AS
SELECT 
    k.*,
    o.nombre as obra_nombre,
    a.tipo_actividad,
    a.ubicacion as actividad_ubicacion,
    a.responsable as actividad_responsable,
    CASE 
        WHEN k.obra_id IS NOT NULL THEN k.obra_id
        WHEN k.actividad_id IS NOT NULL THEN get_obra_id_from_actividad(k.actividad_id)
        ELSE NULL
    END as effective_obra_id
FROM kpis k
LEFT JOIN obras o ON k.obra_id = o.id
LEFT JOIN actividades a ON k.actividad_id = a.id;

-- Otorgar permisos a la vista
GRANT SELECT ON kpis_with_permissions TO authenticated;
GRANT SELECT ON kpis_with_permissions TO anon;

-- Crear función para verificar permisos de usuario en KPIs
CREATE OR REPLACE FUNCTION user_can_access_kpi(kpi_obra_id UUID, kpi_actividad_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Si el KPI tiene obra_id directamente
    IF kpi_obra_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM user_obras uo 
            WHERE uo.user_id = user_uuid 
            AND uo.obra_id = kpi_obra_id
        );
    END IF;
    
    -- Si el KPI tiene actividad_id, verificar a través de la actividad
    IF kpi_actividad_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM user_obras uo 
            INNER JOIN actividades a ON uo.obra_id = a.obra_id
            WHERE uo.user_id = user_uuid 
            AND a.id = kpi_actividad_id
        );
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar políticas RLS para usar la nueva función
DROP POLICY IF EXISTS "Users can view KPIs" ON kpis;
CREATE POLICY "Users can view KPIs" ON kpis
    FOR SELECT
    TO authenticated
    USING (
        user_can_access_kpi(obra_id, actividad_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert KPIs" ON kpis;
CREATE POLICY "Users can insert KPIs" ON kpis
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_can_access_kpi(obra_id, actividad_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can update KPIs" ON kpis;
CREATE POLICY "Users can update KPIs" ON kpis
    FOR UPDATE
    TO authenticated
    USING (
        user_can_access_kpi(obra_id, actividad_id, auth.uid())
    )
    WITH CHECK (
        user_can_access_kpi(obra_id, actividad_id, auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete KPIs" ON kpis;
CREATE POLICY "Users can delete KPIs" ON kpis
    FOR DELETE
    TO authenticated
    USING (
        user_can_access_kpi(obra_id, actividad_id, auth.uid())
    );

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_kpis_obra_fecha ON kpis(obra_id, fecha);
CREATE INDEX IF NOT EXISTS idx_kpis_actividad_fecha ON kpis(actividad_id, fecha);
CREATE INDEX IF NOT EXISTS idx_kpis_calculated_at ON kpis(calculated_at);
CREATE INDEX IF NOT EXISTS idx_kpis_estado ON kpis(estado) WHERE estado IS NOT NULL;

-- Verificar integridad de datos
DO $$
BEGIN
    -- Verificar que no hay KPIs huérfanos
    IF EXISTS (
        SELECT 1 FROM kpis k 
        WHERE k.obra_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM obras o WHERE o.id = k.obra_id)
    ) THEN
        RAISE WARNING 'Existen KPIs con obra_id que no corresponden a obras existentes';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM kpis k 
        WHERE k.actividad_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM actividades a WHERE a.id = k.actividad_id)
    ) THEN
        RAISE WARNING 'Existen KPIs con actividad_id que no corresponden a actividades existentes';
    END IF;
    
    RAISE NOTICE 'Verificación de integridad completada';
END $$;

-- Comentarios para documentación
COMMENT ON FUNCTION get_obra_id_from_actividad(UUID) IS 'Obtiene el obra_id asociado a una actividad';
COMMENT ON FUNCTION user_can_access_kpi(UUID, UUID, UUID) IS 'Verifica si un usuario puede acceder a un KPI específico';
COMMENT ON VIEW kpis_with_permissions IS 'Vista que incluye información de permisos y relaciones para KPIs';