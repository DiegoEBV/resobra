-- Crear tabla de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(20) DEFAULT 'logistica' CHECK (rol IN ('logistica', 'residente')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para usuarios
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rol ON users(rol);

-- Crear tabla de obras
CREATE TABLE obras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    ubicacion VARCHAR(300),
    fecha_inicio DATE NOT NULL,
    fecha_fin_estimada DATE,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('planificacion', 'activa', 'suspendida', 'finalizada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para obras
CREATE INDEX idx_obras_estado ON obras(estado);
CREATE INDEX idx_obras_fecha_inicio ON obras(fecha_inicio DESC);

-- Crear tabla de relación usuario-obra
CREATE TABLE user_obras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    obra_id UUID NOT NULL,
    rol_obra VARCHAR(20) DEFAULT 'logistica' CHECK (rol_obra IN ('logistica', 'residente')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, obra_id)
);

-- Crear índices para user_obras
CREATE INDEX idx_user_obras_user_id ON user_obras(user_id);
CREATE INDEX idx_user_obras_obra_id ON user_obras(obra_id);

-- Crear tabla de frentes
CREATE TABLE frentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    coordenadas_gps JSONB,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'completado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para frentes
CREATE INDEX idx_frentes_obra_id ON frentes(obra_id);
CREATE INDEX idx_frentes_estado ON frentes(estado);

-- Crear tabla de actividades
CREATE TABLE actividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL,
    frente_id UUID NOT NULL,
    user_id UUID NOT NULL,
    tipo_actividad VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    ubicacion JSONB NOT NULL,
    responsable VARCHAR(100) NOT NULL,
    estado VARCHAR(20) DEFAULT 'programado' CHECK (estado IN ('programado', 'ejecucion', 'finalizado')),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para actividades
CREATE INDEX idx_actividades_obra_id ON actividades(obra_id);
CREATE INDEX idx_actividades_frente_id ON actividades(frente_id);
CREATE INDEX idx_actividades_user_id ON actividades(user_id);
CREATE INDEX idx_actividades_fecha ON actividades(fecha DESC);
CREATE INDEX idx_actividades_estado ON actividades(estado);

-- Crear tabla de evidencias
CREATE TABLE evidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actividad_id UUID NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tamaño INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para evidencias
CREATE INDEX idx_evidencias_actividad_id ON evidencias(actividad_id);
CREATE INDEX idx_evidencias_tipo ON evidencias(tipo);

-- Crear tabla de recursos
CREATE TABLE recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actividad_id UUID NOT NULL,
    tipo_recurso VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    cantidad INTEGER NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para recursos
CREATE INDEX idx_recursos_actividad_id ON recursos(actividad_id);
CREATE INDEX idx_recursos_tipo ON recursos(tipo_recurso);

-- Crear tabla de evaluaciones
CREATE TABLE evaluaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluador_id UUID NOT NULL,
    evaluado_id UUID NOT NULL,
    obra_id UUID NOT NULL,
    tipo_evaluacion VARCHAR(50) NOT NULL,
    criterios JSONB NOT NULL,
    puntuacion_total DECIMAL(5,2) NOT NULL,
    comentarios TEXT,
    fecha_evaluacion DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para evaluaciones
CREATE INDEX idx_evaluaciones_evaluador ON evaluaciones(evaluador_id);
CREATE INDEX idx_evaluaciones_evaluado ON evaluaciones(evaluado_id);
CREATE INDEX idx_evaluaciones_obra ON evaluaciones(obra_id);
CREATE INDEX idx_evaluaciones_fecha ON evaluaciones(fecha_evaluacion DESC);

-- Crear tabla de KPIs
CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obra_id UUID NOT NULL,
    fecha DATE NOT NULL,
    avance_fisico DECIMAL(5,2) DEFAULT 0,
    productividad DECIMAL(10,2) DEFAULT 0,
    desviacion_cronograma INTEGER DEFAULT 0,
    calidad DECIMAL(5,2) DEFAULT 0,
    metricas_adicionales JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(obra_id, fecha)
);

-- Crear índices para KPIs
CREATE INDEX idx_kpis_obra_id ON kpis(obra_id);
CREATE INDEX idx_kpis_fecha ON kpis(fecha DESC);

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE frentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuarios
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Políticas RLS para obras
CREATE POLICY "Users can view obras they are assigned to" ON obras FOR SELECT USING (
    id IN (SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text)
);

-- Políticas RLS para user_obras
CREATE POLICY "Users can view their obra assignments" ON user_obras FOR SELECT USING (
    user_id::text = auth.uid()::text
);

-- Políticas RLS para frentes
CREATE POLICY "Users can view frentes of their obras" ON frentes FOR SELECT USING (
    obra_id IN (SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text)
);

-- Políticas RLS para actividades
CREATE POLICY "Users can view actividades of their obras" ON actividades FOR SELECT USING (
    obra_id IN (SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text)
);
CREATE POLICY "Users can create actividades in their obras" ON actividades FOR INSERT WITH CHECK (
    obra_id IN (SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text)
);
CREATE POLICY "Users can update actividades in their obras" ON actividades FOR UPDATE USING (
    obra_id IN (SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text)
);

-- Políticas RLS para evidencias
CREATE POLICY "Users can view evidencias of their actividades" ON evidencias FOR SELECT USING (
    actividad_id IN (
        SELECT id FROM actividades WHERE obra_id IN (
            SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text
        )
    )
);
CREATE POLICY "Users can create evidencias for their actividades" ON evidencias FOR INSERT WITH CHECK (
    actividad_id IN (
        SELECT id FROM actividades WHERE obra_id IN (
            SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text
        )
    )
);

-- Políticas RLS para recursos
CREATE POLICY "Users can view recursos of their actividades" ON recursos FOR SELECT USING (
    actividad_id IN (
        SELECT id FROM actividades WHERE obra_id IN (
            SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text
        )
    )
);
CREATE POLICY "Users can create recursos for their actividades" ON recursos FOR INSERT WITH CHECK (
    actividad_id IN (
        SELECT id FROM actividades WHERE obra_id IN (
            SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text
        )
    )
);

-- Políticas RLS para evaluaciones
CREATE POLICY "Users can view evaluaciones of their obras" ON evaluaciones FOR SELECT USING (
    obra_id IN (SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text)
);
CREATE POLICY "Residents can create evaluaciones" ON evaluaciones FOR INSERT WITH CHECK (
    evaluador_id::text = auth.uid()::text AND
    obra_id IN (SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text AND rol_obra = 'residente')
);

-- Políticas RLS para KPIs
CREATE POLICY "Users can view KPIs of their obras" ON kpis FOR SELECT USING (
    obra_id IN (SELECT obra_id FROM user_obras WHERE user_id::text = auth.uid()::text)
);

-- Otorgar permisos a los roles
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

GRANT SELECT ON obras TO anon;
GRANT ALL PRIVILEGES ON obras TO authenticated;

GRANT SELECT ON user_obras TO anon;
GRANT ALL PRIVILEGES ON user_obras TO authenticated;

GRANT SELECT ON frentes TO anon;
GRANT ALL PRIVILEGES ON frentes TO authenticated;

GRANT SELECT ON actividades TO anon;
GRANT ALL PRIVILEGES ON actividades TO authenticated;

GRANT SELECT ON evidencias TO anon;
GRANT ALL PRIVILEGES ON evidencias TO authenticated;

GRANT SELECT ON recursos TO anon;
GRANT ALL PRIVILEGES ON recursos TO authenticated;

GRANT SELECT ON evaluaciones TO anon;
GRANT ALL PRIVILEGES ON evaluaciones TO authenticated;

GRANT SELECT ON kpis TO anon;
GRANT ALL PRIVILEGES ON kpis TO authenticated;

-- Insertar datos iniciales
INSERT INTO obras (nombre, descripcion, ubicacion, fecha_inicio, fecha_fin_estimada, estado)
VALUES 
('Carretera Nacional 001', 'Construcción de carretera de 50km', 'Región Norte', '2024-01-15', '2024-12-31', 'activa'),
('Autopista Central', 'Ampliación de autopista existente', 'Región Central', '2024-02-01', '2025-06-30', 'activa');

-- Insertar frentes para cada obra
INSERT INTO frentes (obra_id, nombre, descripcion, coordenadas_gps, estado)
SELECT 
    o.id,
    'Frente ' || generate_series(1,3),
    'Frente de trabajo número ' || generate_series(1,3),
    json_build_object('lat', -12.0464 + (random() * 0.1), 'lng', -77.0428 + (random() * 0.1)),
    'activo'
FROM obras o;