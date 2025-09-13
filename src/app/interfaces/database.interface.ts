export interface Frente {
  id: string;
  nombre: string;
  descripcion?: string;
  ubicacion_lat: number;
  ubicacion_lng: number;
  estado: 'activo' | 'inactivo' | 'completado';
  obra_id: string;
  supervisor_id?: string;
  fecha_inicio: string;
  fecha_fin_estimada?: string;
  progreso_general: number;
  presupuesto_asignado?: number;
  presupuesto_utilizado?: number;
  // Campos kilométricos
  km_inicial?: number;
  km_final?: number;
  coordenadas_inicio?: {
    lat: number;
    lng: number;
  };
  coordenadas_fin?: {
    lat: number;
    lng: number;
  };
  // Puntos de control intermedios para curvas
  coordenadas_intermedias?: {
    lat: number;
    lng: number;
    kilometraje: number;
  }[];
  created_at: string;
  updated_at: string;
  obra?: {
    id: string;
    nombre: string;
    descripcion?: string;
  };
  supervisor?: {
    id: string;
    nombre: string;
    email: string;
  };
  actividades?: Actividad[];
}

export interface Actividad {
  id: string;
  obra_id: string;
  frente_id: string;
  user_id: string;
  tipo_actividad: string;
  fecha: string;
  ubicacion: {
    lat: number;
    lng: number;
    direccion?: string;
  };
  responsable?: string;
  estado: 'programado' | 'ejecucion' | 'finalizado';
  observaciones?: string;
  // Campos kilométricos
  kilometro?: number;
  progreso_porcentaje?: number;
  created_at?: string;
  updated_at?: string;
  tareas?: Tarea[];
}

export interface Tarea {
  id: string;
  actividad_id: string;
  nombre: string;
  descripcion?: string;
  completada: boolean;
  orden: number;
  fecha_creacion: string;
  fecha_completado?: string;
  created_at: string;
  updated_at: string;
}

export interface Evidencia {
  id: string;
  actividad_id: string;
  tipo: 'foto' | 'video' | 'documento';
  url: string;
  descripcion?: string;
  fecha_subida: string;
  subido_por: string;
  created_at: string;
}

export interface Recurso {
  id: string;
  actividad_id: string;
  tipo: 'maquinaria' | 'material' | 'personal';
  nombre: string;
  cantidad: number;
  unidad: string;
  costo_unitario?: number;
  costo_total?: number;
  fecha_asignacion: string;
  created_at: string;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'admin' | 'supervisor' | 'operario';
  telefono?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Obra {
  id: string;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  fecha_inicio: string;
  fecha_fin_estimada?: string;
  estado: 'planificacion' | 'activa' | 'suspendida' | 'finalizada';
  created_at?: string;
  frentes?: Frente[];
}

export interface KPI {
  id: string;
  nombre: string;
  valor_actual: number;
  valor_objetivo: number;
  unidad: string;
  tipo: 'porcentaje' | 'numero' | 'tiempo' | 'costo';
  categoria: 'productividad' | 'calidad' | 'seguridad' | 'costo';
  fecha_calculo: string;
  frente_id?: string;
  obra_id?: string;
  created_at: string;
}

export interface Alerta {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  estado: 'activa' | 'resuelta' | 'descartada';
  frente_id?: string;
  actividad_id?: string;
  usuario_id?: string;
  fecha_creacion: string;
  fecha_resolucion?: string;
  created_at: string;
}

export interface Evaluacion {
  id: string;
  evaluado_id: string;
  evaluador_id: string;
  periodo: string;
  puntuacion_total: number;
  comentarios?: string;
  estado: 'borrador' | 'completada' | 'aprobada';
  fecha_evaluacion: string;
  created_at: string;
  criterios?: CriterioEvaluacion[];
}

export interface CriterioEvaluacion {
  id: string;
  evaluacion_id: string;
  nombre: string;
  descripcion?: string;
  puntuacion: number;
  peso: number;
  comentarios?: string;
  created_at: string;
}

export interface Reporte {
  id: string;
  titulo: string;
  tipo: 'actividades' | 'kpis' | 'evaluaciones' | 'recursos';
  parametros: any;
  generado_por: string;
  fecha_generacion: string;
  url_archivo?: string;
  estado: 'generando' | 'completado' | 'error';
  created_at: string;
}

export interface Kilometro {
  id: string;
  frente_id: string;
  kilometro: number;
  estado: string;
  color: string;
  progreso_porcentaje: number;
  actividades_count: number;
  fecha_ultima_actualizacion: string;
  created_at: string;
  updated_at: string;
  frente?: Frente;
  actividades?: Actividad[];
}

export interface EstadoConfig {
  id: string;
  estado_nombre: string;
  color_hex: string;
  umbral_minimo: number;
  umbral_maximo: number;
  activo: boolean;
  created_at: string;
}