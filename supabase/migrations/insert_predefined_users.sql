-- Script para insertar usuarios predefinidos

-- Insertar usuarios
INSERT INTO public.users (id, email, nombre, rol, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'RESIDENTE@CVH.COM', 'Residente', 'residente', NOW(), NOW()),
  (gen_random_uuid(), 'PRODUCCION@CVH.COM', 'Producción', 'logistica', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Obtener IDs de los usuarios insertados
DO $$
DECLARE
  residente_id UUID;
  produccion_id UUID;
  obra_id UUID;
BEGIN
  -- Obtener IDs de usuarios
  SELECT id INTO residente_id FROM public.users WHERE email = 'RESIDENTE@CVH.COM';
  SELECT id INTO produccion_id FROM public.users WHERE email = 'PRODUCCION@CVH.COM';
  
  -- Verificar si hay obras existentes
  SELECT id INTO obra_id FROM public.obras LIMIT 1;
  
  -- Si no hay obras, crear una obra de ejemplo
  IF obra_id IS NULL THEN
    INSERT INTO public.obras (nombre, descripcion, ubicacion, fecha_inicio, estado)
    VALUES ('Obra de Ejemplo', 'Obra creada automáticamente para pruebas', 'Lima, Perú', CURRENT_DATE, 'activa')
    RETURNING id INTO obra_id;
  END IF;
  
  -- Asignar usuarios a la obra
  INSERT INTO public.user_obras (user_id, obra_id, rol_obra)
  VALUES 
    (residente_id, obra_id, 'residente'),
    (produccion_id, obra_id, 'logistica')
  ON CONFLICT (user_id, obra_id) DO NOTHING;
  
END;
$$;