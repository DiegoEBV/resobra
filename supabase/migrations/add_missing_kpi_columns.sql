-- Migración para agregar columnas faltantes a la tabla KPIs
-- Fecha: 2025-01-14
-- Propósito: Corregir errores de columnas faltantes y constraints duplicados

-- Verificar si las columnas ya existen antes de agregarlas
DO $$
BEGIN
    -- Agregar columna created_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'kpis' AND column_name = 'created_at') THEN
        ALTER TABLE public.kpis ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        COMMENT ON COLUMN public.kpis.created_at IS 'Fecha de creación del registro';
    END IF;

    -- Eliminar índice existente problemático si existe
    DROP INDEX IF EXISTS idx_kpis_obra_fecha;
    
    -- Crear índice único compuesto que maneje tanto KPIs de obra como de actividad
    -- Usar COALESCE para manejar valores NULL en actividad_id
    DROP INDEX IF EXISTS idx_kpis_unique_constraint;
    CREATE UNIQUE INDEX idx_kpis_unique_constraint 
    ON public.kpis (obra_id, COALESCE(actividad_id, '00000000-0000-0000-0000-000000000000'::uuid), fecha)
    WHERE obra_id IS NOT NULL;

    -- Crear índices para mejorar rendimiento
    CREATE INDEX IF NOT EXISTS idx_kpis_fecha ON public.kpis(fecha);
    CREATE INDEX IF NOT EXISTS idx_kpis_estado ON public.kpis(estado);
    CREATE INDEX IF NOT EXISTS idx_kpis_created_by ON public.kpis(created_by);
    CREATE INDEX IF NOT EXISTS idx_kpis_obra_id ON public.kpis(obra_id);
    CREATE INDEX IF NOT EXISTS idx_kpis_actividad_id ON public.kpis(actividad_id);

END $$;

-- Actualizar registros existentes que no tengan created_at
UPDATE public.kpis 
SET created_at = COALESCE(updated_at, calculated_at, now())
WHERE created_at IS NULL;

-- Actualizar registros que no tengan created_by (asignar al primer usuario disponible)
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Buscar el primer usuario disponible en auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    ORDER BY created_at 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        UPDATE public.kpis 
        SET created_by = admin_user_id
        WHERE created_by IS NULL;
    END IF;
END $$;

-- Agregar constraint para validar que al menos obra_id o actividad_id esté presente
DO $$
BEGIN
    -- Eliminar constraint si existe
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_kpi_reference' AND table_name = 'kpis') THEN
        ALTER TABLE public.kpis DROP CONSTRAINT check_kpi_reference;
    END IF;
    
    -- Agregar nuevo constraint
    ALTER TABLE public.kpis 
    ADD CONSTRAINT check_kpi_reference 
    CHECK (obra_id IS NOT NULL OR actividad_id IS NOT NULL);
END $$;

-- Agregar constraint para validar rangos de porcentajes
DO $$
BEGIN
    -- Eliminar constraint si existe
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_percentage_ranges' AND table_name = 'kpis') THEN
        ALTER TABLE public.kpis DROP CONSTRAINT check_percentage_ranges;
    END IF;
    
    -- Agregar nuevo constraint
    ALTER TABLE public.kpis 
    ADD CONSTRAINT check_percentage_ranges 
    CHECK (
        (avance_fisico IS NULL OR (avance_fisico >= 0 AND avance_fisico <= 100)) AND
        (calidad IS NULL OR (calidad >= 0 AND calidad <= 100)) AND
        (productividad IS NULL OR productividad >= 0)
    );
END $$;

-- Agregar constraint para validar valores no negativos
DO $$
BEGIN
    -- Eliminar constraint si existe
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_non_negative_values' AND table_name = 'kpis') THEN
        ALTER TABLE public.kpis DROP CONSTRAINT check_non_negative_values;
    END IF;
    
    -- Agregar nuevo constraint
    ALTER TABLE public.kpis 
    ADD CONSTRAINT check_non_negative_values 
    CHECK (
        (costo_ejecutado IS NULL OR costo_ejecutado >= 0) AND
        (costo_presupuestado IS NULL OR costo_presupuestado >= 0) AND
        (personal_asignado IS NULL OR personal_asignado >= 0) AND
        (incidentes_seguridad IS NULL OR incidentes_seguridad >= 0)
    );
END $$;

-- Comentarios para documentación
COMMENT ON CONSTRAINT check_kpi_reference ON public.kpis IS 'Asegura que el KPI esté asociado a una obra o actividad';
COMMENT ON CONSTRAINT check_percentage_ranges ON public.kpis IS 'Valida que los porcentajes estén en rangos correctos';
COMMENT ON CONSTRAINT check_non_negative_values ON public.kpis IS 'Asegura que los valores numéricos no sean negativos';

-- Actualizar políticas RLS simplificadas
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

-- Función para auto-asignar created_by en inserts
CREATE OR REPLACE FUNCTION set_kpi_created_by()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auto-asignar created_by
DROP TRIGGER IF EXISTS trigger_set_kpi_created_by ON public.kpis;
CREATE TRIGGER trigger_set_kpi_created_by
    BEFORE INSERT ON public.kpis
    FOR EACH ROW
    EXECUTE FUNCTION set_kpi_created_by();

-- Limpiar datos duplicados existentes antes de aplicar el índice único
DO $$
DECLARE
    duplicate_record RECORD;
BEGIN
    -- Encontrar y eliminar duplicados, manteniendo solo el más reciente
    FOR duplicate_record IN
        SELECT obra_id, COALESCE(actividad_id, '00000000-0000-0000-0000-000000000000'::uuid) as act_id, fecha, array_agg(id ORDER BY created_at DESC) as ids
        FROM public.kpis 
        WHERE obra_id IS NOT NULL
        GROUP BY obra_id, COALESCE(actividad_id, '00000000-0000-0000-0000-000000000000'::uuid), fecha
        HAVING COUNT(*) > 1
    LOOP
        -- Eliminar todos excepto el primero (más reciente)
        DELETE FROM public.kpis 
        WHERE id = ANY(duplicate_record.ids[2:]);
        
        RAISE NOTICE 'Eliminados % duplicados para obra %, actividad %, fecha %', 
                     array_length(duplicate_record.ids, 1) - 1,
                     duplicate_record.obra_id,
                     duplicate_record.act_id,
                     duplicate_record.fecha;
    END LOOP;
END $$;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Migración completada exitosamente. Columnas agregadas y constraints corregidos.';
END $$;