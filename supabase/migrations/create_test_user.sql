-- Crear usuario de prueba simple en la tabla users
INSERT INTO public.users (
  email,
  nombre,
  rol
) VALUES (
  'test@residente.com',
  'Usuario de Prueba',
  'residente'
);