-- Script para insertar directamente usuarios en Supabase

-- Insertar usuarios en la tabla auth.users (requiere permisos de administrador)
-- Nota: Este script debe ejecutarse en la consola SQL de Supabase con permisos de administrador

-- Insertar usuario RESIDENTE@CVH.COM si no existe
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, is_sso_user, instance_id)
SELECT 
  gen_random_uuid(), 
  'RESIDENTE@CVH.COM', 
  NOW(), 
  NOW(), 
  NOW(), 
  FALSE, 
  (SELECT id FROM auth.instances LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'RESIDENTE@CVH.COM');

-- Insertar usuario PRODUCCION@CVH.COM si no existe
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, is_sso_user, instance_id)
SELECT 
  gen_random_uuid(), 
  'PRODUCCION@CVH.COM', 
  NOW(), 
  NOW(), 
  NOW(), 
  FALSE, 
  (SELECT id FROM auth.instances LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'PRODUCCION@CVH.COM');

-- Establecer contraseñas para los usuarios (hash de '123456')
-- Nota: Este es un hash genérico para la contraseña '123456', pero en producción debería generarse de forma segura
UPDATE auth.users 
SET encrypted_password = '$2a$10$Ot9DLhYJVEYFQGqz5bS7.OlKdJ9nLQbTYo5JMda4uxrL0hNmjFhLa'
WHERE email IN ('RESIDENTE@CVH.COM', 'PRODUCCION@CVH.COM');

-- Obtener IDs de los usuarios
DO $$
DECLARE
  v_residente_id UUID;
  v_produccion_id UUID;
  v_obra_id UUID;
BEGIN
  -- Obtener IDs de usuarios
  SELECT id INTO v_residente_id FROM auth.users WHERE email = 'RESIDENTE@CVH.COM';
  SELECT id INTO v_produccion_id FROM auth.users WHERE email = 'PRODUCCION@CVH.COM';
  
  -- Insertar en la tabla public.users
  INSERT INTO public.users (id, email, nombre, rol, created_at, updated_at)
  VALUES 
    (v_residente_id, 'RESIDENTE@CVH.COM', 'Residente', 'residente', NOW(), NOW()),
    (v_produccion_id, 'PRODUCCION@CVH.COM', 'Producción', 'logistica', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    nombre = EXCLUDED.nombre,
    rol = EXCLUDED.rol,
    updated_at = NOW();
  
  -- Verificar si hay obras existentes
  SELECT id INTO v_obra_id FROM public.obras LIMIT 1;
  
  -- Si no hay obras, crear una obra de ejemplo
  IF v_obra_id IS NULL THEN
    INSERT INTO public.obras (nombre, descripcion, ubicacion, fecha_inicio, estado)
    VALUES ('Obra de Ejemplo', 'Obra creada automáticamente para pruebas', 'Lima, Perú', CURRENT_DATE, 'activa')
    RETURNING id INTO v_obra_id;
  END IF;
  
  -- Asignar usuarios a la obra
  INSERT INTO public.user_obras (user_id, obra_id, rol_obra)
  VALUES 
    (v_residente_id, v_obra_id, 'residente'),
    (v_produccion_id, v_obra_id, 'logistica')
  ON CONFLICT (user_id, obra_id) DO UPDATE 
  SET rol_obra = EXCLUDED.rol_obra;
  
END;
$$;