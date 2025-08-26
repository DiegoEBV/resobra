-- Crear enum para especialidades
CREATE TYPE specialty_enum AS ENUM (
  'arquitectura',
  'estructura', 
  'instalaciones_sanitarias',
  'instalaciones_electricas',
  'instalaciones_mecanicas',
  'comunicaciones'
);

-- Agregar campo especialidad a la tabla items
ALTER TABLE items ADD COLUMN specialty specialty_enum DEFAULT 'arquitectura';

-- Crear índice para mejorar consultas por especialidad
CREATE INDEX idx_items_specialty ON items(specialty);

-- Actualizar los datos existentes con especialidades apropiadas
UPDATE items SET specialty = 'estructura' WHERE name ILIKE '%excavación%' OR name ILIKE '%concreto%' OR name ILIKE '%acero%' OR name ILIKE '%encofrado%';
UPDATE items SET specialty = 'arquitectura' WHERE name ILIKE '%mampostería%' OR name ILIKE '%ladrillo%';

-- Insertar algunos ejemplos adicionales por especialidad
INSERT INTO items (name, description, unit, materials, specialty) VALUES
-- Arquitectura
('Tarrajeo interior', 'Tarrajeo de muros interiores con mortero 1:5', 'm²', ARRAY['Cemento', 'Arena fina', 'Agua'], 'arquitectura'),
('Pintura látex', 'Pintura látex en muros interiores, 2 manos', 'm²', ARRAY['Pintura látex', 'Imprimante', 'Rodillos', 'Brochas'], 'arquitectura'),

-- Estructura
('Zapata aislada', 'Concreto f''c=280 kg/cm² para zapatas', 'm³', ARRAY['Cemento', 'Arena gruesa', 'Piedra chancada', 'Agua'], 'estructura'),
('Columna de concreto', 'Columna de concreto armado 0.25x0.60m', 'm', ARRAY['Concreto', 'Acero de refuerzo', 'Encofrado'], 'estructura'),

-- Instalaciones Sanitarias
('Tubería PVC SAL 4"', 'Suministro e instalación de tubería PVC SAL 4"', 'm', ARRAY['Tubería PVC', 'Accesorios', 'Pegamento PVC'], 'instalaciones_sanitarias'),
('Inodoro tanque bajo', 'Suministro e instalación de inodoro tanque bajo', 'und', ARRAY['Inodoro', 'Accesorios', 'Cera', 'Pernos'], 'instalaciones_sanitarias'),

-- Instalaciones Eléctricas
('Cable THW 12 AWG', 'Cable THW 12 AWG para circuitos de tomacorrientes', 'm', ARRAY['Cable THW', 'Tubería PVC-P'], 'instalaciones_electricas'),
('Tablero eléctrico', 'Tablero eléctrico monofásico 12 polos', 'und', ARRAY['Tablero metálico', 'Interruptores', 'Cables'], 'instalaciones_electricas'),

-- Instalaciones Mecánicas
('Ducto de ventilación', 'Ducto rectangular galvanizado 30x20cm', 'm', ARRAY['Plancha galvanizada', 'Soldadura', 'Pintura anticorrosiva'], 'instalaciones_mecanicas'),
('Extractor de aire', 'Extractor axial de 12" para baños', 'und', ARRAY['Motor eléctrico', 'Aspas', 'Rejilla'], 'instalaciones_mecanicas'),

-- Comunicaciones
('Cable UTP Cat 6', 'Cable UTP categoría 6 para red de datos', 'm', ARRAY['Cable UTP', 'Conectores RJ45', 'Canaletas'], 'comunicaciones'),
('Rack de comunicaciones', 'Rack 19" de 12U para equipos de red', 'und', ARRAY['Gabinete metálico', 'Patch panel', 'Organizadores'], 'comunicaciones');