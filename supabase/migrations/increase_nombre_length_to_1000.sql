-- Migración para aumentar el límite del campo nombre a 1000 caracteres
-- Fecha: $(date)
-- Descripción: Modificar la columna nombre de la tabla obras para permitir hasta 1000 caracteres

-- Modificar la columna nombre para permitir hasta 1000 caracteres
ALTER TABLE public.obras 
ALTER COLUMN nombre TYPE VARCHAR(1000);

-- Verificar el cambio
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'obras' 
    AND column_name = 'nombre';

-- Comentario para documentar el cambio
COMMENT ON COLUMN public.obras.nombre IS 'Nombre de la obra - máximo 1000 caracteres';