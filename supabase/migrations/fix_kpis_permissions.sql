-- Verificar y corregir permisos para la tabla kpis

-- Otorgar permisos básicos a los roles anon y authenticated
GRANT SELECT ON public.kpis TO anon;
GRANT ALL PRIVILEGES ON public.kpis TO authenticated;

-- Verificar que las políticas RLS estén habilitadas
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir inserción a usuarios autenticados
DROP POLICY IF EXISTS "Users can insert KPIs" ON public.kpis;
CREATE POLICY "Users can insert KPIs" ON public.kpis
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Crear política para permitir lectura a usuarios autenticados
DROP POLICY IF EXISTS "Users can view KPIs" ON public.kpis;
CREATE POLICY "Users can view KPIs" ON public.kpis
    FOR SELECT
    TO authenticated
    USING (true);

-- Crear política para permitir actualización a usuarios autenticados
DROP POLICY IF EXISTS "Users can update KPIs" ON public.kpis;
CREATE POLICY "Users can update KPIs" ON public.kpis
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Crear política para permitir eliminación a usuarios autenticados
DROP POLICY IF EXISTS "Users can delete KPIs" ON public.kpis;
CREATE POLICY "Users can delete KPIs" ON public.kpis
    FOR DELETE
    TO authenticated
    USING (true);

-- Verificar los permisos finales
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'kpis' 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;