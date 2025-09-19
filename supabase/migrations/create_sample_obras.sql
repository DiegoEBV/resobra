-- Insertar obras de prueba
INSERT INTO public.obras (nombre, descripcion, ubicacion, fecha_inicio, fecha_fin_estimada, estado, progreso)
VALUES 
  ('Construcción Edificio Central', 'Edificio de oficinas de 10 pisos', 'Av. Principal 123', '2024-01-15', '2024-12-31', 'activa', 45.50),
  ('Remodelación Plaza Norte', 'Renovación completa de la plaza pública', 'Plaza Norte, Centro', '2024-02-01', '2024-08-30', 'activa', 78.25),
  ('Puente Vehicular Sur', 'Construcción de puente de 200m', 'Río Sur, Km 15', '2024-03-10', '2025-02-28', 'activa', 23.75)
ON CONFLICT (id) DO NOTHING;

-- Verificar que las obras se insertaron
SELECT id, nombre, estado, progreso FROM public.obras ORDER BY created_at DESC;