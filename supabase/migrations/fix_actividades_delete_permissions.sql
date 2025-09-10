-- Verificar y corregir permisos de eliminación para la tabla actividades
-- Fecha: 2025-01-09
-- Propósito: Solucionar error '22P02' en eliminación de actividades

-- Otorgar permisos de eliminación
GRANT DELETE ON public.actividades TO authenticated;
GRANT SELECT ON public.actividades TO authenticated;
GRANT UPDATE ON public.actividades TO authenticated;

-- Crear política de eliminación si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'actividades' 
        AND policyname = 'Users can delete their own actividades'
    ) THEN
        CREATE POLICY "Users can delete their own actividades" 
        ON public.actividades 
        FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Asegurar que RLS esté habilitado
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;