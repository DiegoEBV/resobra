-- Crear tabla rubricas_evaluacion
CREATE TABLE IF NOT EXISTS rubricas_evaluacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla criterios_evaluacion
CREATE TABLE IF NOT EXISTS criterios_evaluacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rubrica_id UUID NOT NULL REFERENCES rubricas_evaluacion(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    peso DECIMAL(5,2) DEFAULT 1.00,
    puntuacion_maxima INTEGER DEFAULT 5,
    orden INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE rubricas_evaluacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE criterios_evaluacion ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para rubricas_evaluacion
CREATE POLICY "Usuarios autenticados pueden ver rúbricas" ON rubricas_evaluacion
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden crear rúbricas" ON rubricas_evaluacion
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar rúbricas" ON rubricas_evaluacion
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas RLS para criterios_evaluacion
CREATE POLICY "Usuarios autenticados pueden ver criterios" ON criterios_evaluacion
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden crear criterios" ON criterios_evaluacion
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar criterios" ON criterios_evaluacion
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Otorgar permisos a los roles
GRANT ALL PRIVILEGES ON rubricas_evaluacion TO authenticated;
GRANT ALL PRIVILEGES ON criterios_evaluacion TO authenticated;
GRANT SELECT ON rubricas_evaluacion TO anon;
GRANT SELECT ON criterios_evaluacion TO anon;

-- Insertar datos de muestra para rúbricas
INSERT INTO rubricas_evaluacion (id, nombre, descripcion, activa) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Evaluación de Desempeño General', 'Rúbrica para evaluar el desempeño general de los trabajadores en obra', true),
('550e8400-e29b-41d4-a716-446655440002', 'Evaluación de Seguridad', 'Rúbrica enfocada en aspectos de seguridad laboral', true),
('550e8400-e29b-41d4-a716-446655440003', 'Evaluación de Calidad', 'Rúbrica para evaluar la calidad del trabajo realizado', true);

-- Insertar datos de muestra para criterios de Evaluación de Desempeño General
INSERT INTO criterios_evaluacion (rubrica_id, nombre, descripcion, peso, puntuacion_maxima, orden) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Puntualidad', 'Cumplimiento de horarios establecidos', 1.0, 5, 1),
('550e8400-e29b-41d4-a716-446655440001', 'Productividad', 'Eficiencia en la realización de tareas', 1.5, 5, 2),
('550e8400-e29b-41d4-a716-446655440001', 'Trabajo en Equipo', 'Colaboración y comunicación con compañeros', 1.2, 5, 3),
('550e8400-e29b-41d4-a716-446655440001', 'Iniciativa', 'Proactividad y propuesta de mejoras', 1.0, 5, 4);

-- Insertar datos de muestra para criterios de Evaluación de Seguridad
INSERT INTO criterios_evaluacion (rubrica_id, nombre, descripcion, peso, puntuacion_maxima, orden) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'Uso de EPP', 'Uso correcto de equipos de protección personal', 2.0, 5, 1),
('550e8400-e29b-41d4-a716-446655440002', 'Cumplimiento de Normas', 'Seguimiento de protocolos de seguridad', 1.8, 5, 2),
('550e8400-e29b-41d4-a716-446655440002', 'Reporte de Incidentes', 'Comunicación oportuna de situaciones de riesgo', 1.5, 5, 3);

-- Insertar datos de muestra para criterios de Evaluación de Calidad
INSERT INTO criterios_evaluacion (rubrica_id, nombre, descripcion, peso, puntuacion_maxima, orden) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'Precisión', 'Exactitud en las medidas y especificaciones', 1.8, 5, 1),
('550e8400-e29b-41d4-a716-446655440003', 'Acabados', 'Calidad de los acabados realizados', 1.5, 5, 2),
('550e8400-e29b-41d4-a716-446655440003', 'Uso de Materiales', 'Aprovechamiento eficiente de recursos', 1.2, 5, 3);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_criterios_rubrica_id ON criterios_evaluacion(rubrica_id);
CREATE INDEX idx_rubricas_activa ON rubricas_evaluacion(activa);
CREATE INDEX idx_criterios_orden ON criterios_evaluacion(orden);