-- Migración para corregir restricción CHECK del campo estado
-- Fecha: 2025-01-22
-- Propósito: Agregar 'activo' como valor válido y eliminar restricciones problemáticas

-- Paso 1: Eliminar cualquier restricción CHECK existente que pueda estar causando problemas
DO $$
BEGIN
    -- Eliminar restricción check_kpi_reference si existe
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_kpi_reference' AND conrelid = 'public.kpis'::regclass) THEN
        ALTER TABLE public.kpis DROP CONSTRAINT check_kpi_reference;
        RAISE NOTICE 'Restricción check_kpi_reference eliminada';
    END IF;
    
    -- Eliminar cualquier restricción CHECK en el campo estado si existe
    DECLARE
        constraint_rec RECORD;
    BEGIN
        FOR constraint_rec IN 
            SELECT conname
            FROM pg_constraint 
            WHERE conrelid = 'public.kpis'::regclass 
            AND contype = 'c' 
            AND pg_get_constraintdef(oid) ILIKE '%estado%'
        LOOP
            EXECUTE 'ALTER TABLE public.kpis DROP CONSTRAINT ' || constraint_rec.conname;
            RAISE NOTICE 'Restricción % eliminada', constraint_rec.conname;
        END LOOP;
    END;
END $$;

-- Paso 2: Actualizar datos existentes que puedan tener valores inválidos
UPDATE public.kpis 
SET estado = 'activo' 
WHERE estado IS NULL OR estado NOT IN ('pendiente', 'en_progreso', 'completado', 'activo', 'inactivo', 'cancelado');

-- Paso 3: Agregar nueva restricción CHECK para el campo estado que incluya 'activo'
ALTER TABLE public.kpis 
ADD CONSTRAINT check_kpi_estado 
CHECK (estado IN ('pendiente', 'en_progreso', 'completado', 'activo', 'inactivo', 'cancelado'));

-- Comentario para la nueva restricción
COMMENT ON CONSTRAINT check_kpi_estado ON public.kpis IS 'Valida que el estado sea uno de los valores permitidos incluyendo activo';

-- Verificar que la restricción se creó correctamente
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.kpis'::regclass 
AND contype = 'c'
AND conname = 'check_kpi_estado';