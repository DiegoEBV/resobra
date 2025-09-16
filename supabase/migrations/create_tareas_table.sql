-- Crear tabla 'tareas' para el seguimiento de progreso de actividades
CREATE TABLE IF NOT EXISTS public.tareas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actividad_id UUID NOT NULL REFERENCES public.actividades(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    completada BOOLEAN DEFAULT FALSE,
    orden INTEGER DEFAULT 1,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_completado TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_tareas_actividad_id ON public.tareas(actividad_id);
CREATE INDEX IF NOT EXISTS idx_tareas_completada ON public.tareas(completada);
CREATE INDEX IF NOT EXISTS idx_tareas_orden ON public.tareas(orden);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para tareas
CREATE POLICY "Users can view all tareas" ON public.tareas
    FOR SELECT USING (true);

CREATE POLICY "Users can insert tareas" ON public.tareas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update tareas" ON public.tareas
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete tareas" ON public.tareas
    FOR DELETE USING (true);

-- Otorgar permisos a los roles
GRANT ALL PRIVILEGES ON public.tareas TO authenticated;
GRANT SELECT ON public.tareas TO anon;

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_tareas_updated_at
    BEFORE UPDATE ON public.tareas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Crear función para actualizar fecha_completado cuando se marca como completada
CREATE OR REPLACE FUNCTION update_fecha_completado()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completada = TRUE AND OLD.completada = FALSE THEN
        NEW.fecha_completado = NOW();
    ELSIF NEW.completada = FALSE AND OLD.completada = TRUE THEN
        NEW.fecha_completado = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar fecha_completado
CREATE TRIGGER update_tareas_fecha_completado
    BEFORE UPDATE ON public.tareas
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_completado();

COMMIT;