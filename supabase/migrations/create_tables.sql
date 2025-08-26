-- Crear tabla de partidas
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(50),
  materials TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de proyectos/obras
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  contractor VARCHAR(255),
  supervisor VARCHAR(255),
  start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de informes
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  report_number VARCHAR(50) NOT NULL,
  report_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de partidas en informes
CREATE TABLE report_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  previous_quantity DECIMAL(10,2) DEFAULT 0,
  current_quantity DECIMAL(10,2) DEFAULT 0,
  accumulated_quantity DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_items_name ON items USING gin(to_tsvector('spanish', name));
CREATE INDEX idx_items_description ON items USING gin(to_tsvector('spanish', description));
CREATE INDEX idx_reports_project_id ON reports(project_id);
CREATE INDEX idx_report_items_report_id ON report_items(report_id);
CREATE INDEX idx_report_items_item_id ON report_items(item_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_items ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso público (sin autenticación requerida)
CREATE POLICY "Allow all operations on items" ON items FOR ALL USING (true);
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on reports" ON reports FOR ALL USING (true);
CREATE POLICY "Allow all operations on report_items" ON report_items FOR ALL USING (true);

-- Otorgar permisos a roles anónimos y autenticados
GRANT ALL PRIVILEGES ON items TO anon, authenticated;
GRANT ALL PRIVILEGES ON projects TO anon, authenticated;
GRANT ALL PRIVILEGES ON reports TO anon, authenticated;
GRANT ALL PRIVILEGES ON report_items TO anon, authenticated;

-- Insertar datos de ejemplo
INSERT INTO items (name, description, unit, materials) VALUES
('Excavación manual', 'Excavación manual en terreno normal hasta 2.00 m de profundidad', 'm³', ARRAY['Herramientas manuales', 'Mano de obra']),
('Concreto f''c=210 kg/cm²', 'Concreto premezclado f''c=210 kg/cm² incluye colocación y vibrado', 'm³', ARRAY['Cemento', 'Arena', 'Grava', 'Agua', 'Aditivos']),
('Acero de refuerzo fy=4200 kg/cm²', 'Suministro y colocación de acero de refuerzo corrugado', 'kg', ARRAY['Varillas de acero', 'Alambre de amarre', 'Mano de obra']),
('Encofrado y desencofrado', 'Encofrado y desencofrado de elementos de concreto con madera', 'm²', ARRAY['Madera', 'Clavos', 'Desmoldante', 'Mano de obra']),
('Mampostería de ladrillo', 'Muro de mampostería de ladrillo King Kong con mortero 1:4', 'm²', ARRAY['Ladrillo King Kong', 'Cemento', 'Arena fina', 'Agua']);

INSERT INTO projects (name, location, contractor, supervisor, start_date) VALUES
('Construcción de Edificio Multifamiliar', 'Av. Principal 123, Lima', 'Constructora ABC S.A.C.', 'Ing. Juan Pérez', '2024-01-15'),
('Ampliación de Centro Comercial', 'Jr. Comercio 456, Arequipa', 'Obras y Proyectos XYZ', 'Ing. María García', '2024-02-01');