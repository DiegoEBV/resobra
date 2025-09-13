-- Insertar obras de prueba
INSERT INTO obras (nombre, descripcion, ubicacion, fecha_inicio, fecha_fin_estimada, estado) VALUES
('Construcción Edificio Central', 'Construcción de edificio de oficinas de 10 pisos', 'Lima Centro', '2024-01-15', '2024-12-31', 'activa'),
('Remodelación Plaza Principal', 'Remodelación completa de la plaza principal del distrito', 'Plaza de Armas', '2024-02-01', '2024-08-30', 'activa'),
('Ampliación Vía Expresa', 'Ampliación de 2 carriles adicionales en vía expresa', 'Av. Javier Prado', '2024-03-01', '2025-02-28', 'planificacion');

-- Verificar que se insertaron
SELECT COUNT(*) as total_obras_after_insert FROM obras;
SELECT * FROM obras ORDER BY created_at DESC;