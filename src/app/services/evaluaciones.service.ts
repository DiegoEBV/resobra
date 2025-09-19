import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { DirectAuthService } from './direct-auth.service';

// Interfaces actualizadas para el nuevo formulario
export interface CriterioEvaluacion {
  id: string;
  nombre: string;
  descripcion: string;
  peso: number;
  categoria: 'tecnica' | 'interpersonal' | 'organizacional';
}

export interface RubricaEvaluacion {
  id: string;
  nombre: string;
  descripcion: string;
  criterios: CriterioEvaluacion[];
  activa: boolean;
}

export interface Evaluacion {
  id?: string;
  evaluado_id: string;
  evaluado_nombre?: string;
  evaluador_id?: string;
  obra_id?: string;
  tipo_evaluacion: 'desempeño' | 'competencias' | '360' | 'objetivos';
  fecha_evaluacion: string;
  
  // Competencias Técnicas
  conocimiento_tecnico: number;
  obs_conocimiento_tecnico?: string;
  calidad_trabajo: number;
  obs_calidad_trabajo?: string;
  productividad: number;
  obs_productividad?: string;
  seguridad_laboral: number;
  obs_seguridad_laboral?: string;
  
  // Competencias Interpersonales
  trabajo_equipo: number;
  obs_trabajo_equipo?: string;
  comunicacion: number;
  obs_comunicacion?: string;
  liderazgo: number;
  obs_liderazgo?: string;
  adaptabilidad: number;
  obs_adaptabilidad?: string;
  
  // Competencias Organizacionales
  puntualidad: number;
  obs_puntualidad?: string;
  iniciativa: number;
  obs_iniciativa?: string;
  compromiso: number;
  obs_compromiso?: string;
  resolucion_problemas: number;
  obs_resolucion_problemas?: string;
  
  // Objetivos y Metas
  objetivos_cumplidos?: string;
  objetivos_pendientes?: string;
  porcentaje_cumplimiento?: string;
  calificacion_general?: string;
  
  // Plan de Desarrollo
  fortalezas?: string;
  areas_mejora?: string;
  recomendaciones_capacitacion?: string;
  objetivos_proximos?: string;
  
  // Comentarios
  comentarios_generales?: string;
  comentarios_empleado?: string;
  
  // Puntuación y Estado
  puntuacion_total: number;
  estado: 'borrador' | 'completada' | 'revisada' | 'aprobada';
  requiere_seguimiento: 'si' | 'no';
  
  // Metadatos
  created_at?: string;
  updated_at?: string;
}

export interface ResumenEvaluacion {
  empleado_id: string;
  empleado_nombre: string;
  promedio_general: number;
  evaluaciones_completadas: number;
  ultima_evaluacion: Date;
  tendencia: string;
}

export interface EmpleadoEvaluacion {
  id: string;
  nombre: string;
  puesto: string;
  departamento: string;
  fecha_ingreso?: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EvaluacionesService {
  private supabase: SupabaseClient;
  
  // BehaviorSubjects para datos reactivos
  private evaluacionesSubject = new BehaviorSubject<Evaluacion[]>([]);
  private rubricasSubject = new BehaviorSubject<RubricaEvaluacion[]>([]);
  private criteriosSubject = new BehaviorSubject<CriterioEvaluacion[]>([]);
  
  // Observables públicos
  public evaluaciones$ = this.evaluacionesSubject.asObservable();
  public rubricas$ = this.rubricasSubject.asObservable();
  public criterios$ = this.criteriosSubject.asObservable();

  constructor(private directAuthService: DirectAuthService) {
    // Inicializar Supabase con configuración del environment y storage key único
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          storageKey: 'sb-evaluaciones-auth-token',
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    this.loadInitialData();
  }

  private async loadInitialData() {
    try {
      // Cargar datos iniciales
      await Promise.all([
        this.loadEvaluaciones(),
        this.loadRubricas(),
        this.loadCriterios()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  // Métodos para Evaluaciones
  async loadEvaluaciones(): Promise<void> {
    try {
      console.log('Cargando evaluaciones desde Supabase...');
      
      // Cargar evaluaciones reales desde Supabase
      const { data, error } = await this.supabase
        .from('evaluaciones')
        .select(`
          *,
          evaluado:evaluado_id(nombre, email),
          evaluador:evaluador_id(nombre, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando evaluaciones:', error);
        // Si hay error, usar datos de ejemplo como fallback
        const evaluacionesEjemplo: Evaluacion[] = [
          {
            id: '1',
            evaluado_id: '1',
            evaluado_nombre: 'Juan Pérez',
            tipo_evaluacion: 'desempeño',
            fecha_evaluacion: '2024-01-15',
            conocimiento_tecnico: 4,
            calidad_trabajo: 4,
            productividad: 3,
            seguridad_laboral: 5,
            trabajo_equipo: 4,
            comunicacion: 3,
            liderazgo: 3,
            adaptabilidad: 4,
            puntualidad: 5,
            iniciativa: 3,
            compromiso: 4,
            resolucion_problemas: 4,
            puntuacion_total: 3.8,
            calificacion_general: 'bueno',
            estado: 'completada',
            requiere_seguimiento: 'no',
            fortalezas: 'Excelente en seguridad laboral y puntualidad',
            areas_mejora: 'Mejorar comunicación y liderazgo',
            comentarios_generales: 'Empleado confiable con potencial de crecimiento'
          },
          {
            id: '2',
            evaluado_id: '2',
            evaluado_nombre: 'María García',
            tipo_evaluacion: 'desempeño',
            fecha_evaluacion: '2024-01-20',
            conocimiento_tecnico: 5,
            calidad_trabajo: 5,
            productividad: 4,
            seguridad_laboral: 4,
            trabajo_equipo: 5,
            comunicacion: 5,
            liderazgo: 4,
            adaptabilidad: 4,
            puntualidad: 4,
            iniciativa: 5,
            compromiso: 5,
            resolucion_problemas: 4,
            puntuacion_total: 4.5,
            calificacion_general: 'excelente',
            estado: 'aprobada',
            requiere_seguimiento: 'no',
            fortalezas: 'Liderazgo natural y excelente comunicación',
            areas_mejora: 'Continuar desarrollando habilidades técnicas',
            comentarios_generales: 'Candidata ideal para promoción'
          }
        ];
        this.evaluacionesSubject.next(evaluacionesEjemplo);
        return;
      }

      console.log('Evaluaciones cargadas:', data);
      
      // Procesar datos para agregar nombre del evaluado si no está presente
      const evaluacionesProcesadas = data.map(evaluacion => ({
        ...evaluacion,
        evaluado_nombre: evaluacion.evaluado?.nombre || `Usuario ${evaluacion.evaluado_id}`,
        evaluador_nombre: evaluacion.evaluador?.nombre || `Evaluador ${evaluacion.evaluador_id}`
      }));
      
      this.evaluacionesSubject.next(evaluacionesProcesadas);
    } catch (error) {
      console.error('Error loading evaluaciones:', error);
      throw error;
    }
  }

  async loadRubricas(): Promise<void> {
    try {
      const rubricasEjemplo: RubricaEvaluacion[] = [
        {
          id: '1',
          nombre: 'Evaluación de Desempeño General',
          descripcion: 'Rúbrica estándar para evaluación de desempeño',
          activa: true,
          criterios: [
            {
              id: '1',
              nombre: 'Conocimiento Técnico',
              descripcion: 'Dominio de habilidades técnicas requeridas',
              peso: 0.2,
              categoria: 'tecnica'
            },
            {
              id: '2',
              nombre: 'Trabajo en Equipo',
              descripcion: 'Capacidad de colaborar efectivamente',
              peso: 0.15,
              categoria: 'interpersonal'
            }
          ]
        }
      ];
      
      this.rubricasSubject.next(rubricasEjemplo);
    } catch (error) {
      console.error('Error loading rubricas:', error);
      throw error;
    }
  }

  async loadCriterios(): Promise<void> {
    try {
      const criteriosEjemplo: CriterioEvaluacion[] = [
        {
          id: '1',
          nombre: 'Conocimiento Técnico',
          descripcion: 'Dominio de habilidades técnicas requeridas para el puesto',
          peso: 0.2,
          categoria: 'tecnica'
        },
        {
          id: '2',
          nombre: 'Calidad del Trabajo',
          descripcion: 'Precisión y excelencia en la ejecución de tareas',
          peso: 0.15,
          categoria: 'tecnica'
        },
        {
          id: '3',
          nombre: 'Trabajo en Equipo',
          descripcion: 'Capacidad de colaborar efectivamente con colegas',
          peso: 0.15,
          categoria: 'interpersonal'
        },
        {
          id: '4',
          nombre: 'Comunicación',
          descripcion: 'Habilidad para transmitir información clara y efectivamente',
          peso: 0.1,
          categoria: 'interpersonal'
        },
        {
          id: '5',
          nombre: 'Puntualidad',
          descripcion: 'Cumplimiento de horarios y compromisos',
          peso: 0.1,
          categoria: 'organizacional'
        }
      ];
      
      this.criteriosSubject.next(criteriosEjemplo);
    } catch (error) {
      console.error('Error loading criterios:', error);
      throw error;
    }
  }

  // Crear nueva evaluación
  async createEvaluacion(evaluacionData: Partial<Evaluacion>): Promise<Evaluacion> {
    try {
      // Validaciones
      if (!evaluacionData.evaluado_id) {
        throw new Error('El ID del empleado evaluado es requerido');
      }
      
      // Calcular puntuación total si no se proporciona
      if (!evaluacionData.puntuacion_total) {
        evaluacionData.puntuacion_total = this.calcularPuntuacionTotal(evaluacionData);
      }
      
      // Determinar calificación general basada en puntuación
      if (!evaluacionData.calificacion_general) {
        evaluacionData.calificacion_general = this.determinarCalificacionGeneral(evaluacionData.puntuacion_total);
      }

      // Obtener el usuario actual usando DirectAuthService
      const user = this.directAuthService.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener obra_id por defecto (primera obra disponible o crear una por defecto)
      const obra_id = await this.getDefaultObraId();

      // Preparar datos para inserción según la estructura real de la tabla
      const evaluacionParaInsertar = {
        evaluador_id: user.id,
        evaluado_id: evaluacionData.evaluado_id,
        obra_id: obra_id, // Campo requerido en la tabla
        tipo_evaluacion: evaluacionData.tipo_evaluacion || 'desempeño',
        fecha_evaluacion: evaluacionData.fecha_evaluacion,
        estado: evaluacionData.estado || 'completada',
        
        // Competencias técnicas (campos directos en la tabla)
        conocimiento_tecnico: evaluacionData.conocimiento_tecnico || 3,
        obs_conocimiento_tecnico: evaluacionData.obs_conocimiento_tecnico || '',
        calidad_trabajo: evaluacionData.calidad_trabajo || 3,
        obs_calidad_trabajo: evaluacionData.obs_calidad_trabajo || '',
        productividad: evaluacionData.productividad || 3,
        obs_productividad: evaluacionData.obs_productividad || '',
        seguridad_laboral: evaluacionData.seguridad_laboral || 3,
        obs_seguridad_laboral: evaluacionData.obs_seguridad_laboral || '',
        resolucion_problemas: evaluacionData.resolucion_problemas || 3,
        obs_resolucion_problemas: evaluacionData.obs_resolucion_problemas || '',
        
        // Competencias interpersonales (campos directos en la tabla)
        trabajo_equipo: evaluacionData.trabajo_equipo || 3,
        obs_trabajo_equipo: evaluacionData.obs_trabajo_equipo || '',
        comunicacion: evaluacionData.comunicacion || 3,
        obs_comunicacion: evaluacionData.obs_comunicacion || '',
        liderazgo: evaluacionData.liderazgo || 3,
        obs_liderazgo: evaluacionData.obs_liderazgo || '',
        adaptabilidad: evaluacionData.adaptabilidad || 3,
        obs_adaptabilidad: evaluacionData.obs_adaptabilidad || '',
        
        // Competencias organizacionales (campos directos en la tabla)
        puntualidad: evaluacionData.puntualidad || 3,
        obs_puntualidad: evaluacionData.obs_puntualidad || '',
        iniciativa: evaluacionData.iniciativa || 3,
        obs_iniciativa: evaluacionData.obs_iniciativa || '',
        compromiso: evaluacionData.compromiso || 3,
        obs_compromiso: evaluacionData.obs_compromiso || '',
        
        // Campos de objetivos y desarrollo (campos directos en la tabla)
        objetivos_cumplidos: evaluacionData.objetivos_cumplidos || '',
        objetivos_pendientes: evaluacionData.objetivos_pendientes || '',
        porcentaje_cumplimiento: evaluacionData.porcentaje_cumplimiento || '',
        fortalezas: evaluacionData.fortalezas || '',
        areas_mejora: evaluacionData.areas_mejora || '',
        recomendaciones_capacitacion: evaluacionData.recomendaciones_capacitacion || '',
        objetivos_proximos: evaluacionData.objetivos_proximos || '',
        comentarios_empleado: evaluacionData.comentarios_empleado || '',
        requiere_seguimiento: evaluacionData.requiere_seguimiento || 'no',
        
        // Campos JSONB para información adicional
        criterios: {
          fortalezas: evaluacionData.fortalezas || '',
          areas_mejora: evaluacionData.areas_mejora || '',
          objetivos_cumplidos: evaluacionData.objetivos_cumplidos || '',
          objetivos_pendientes: evaluacionData.objetivos_pendientes || '',
          plan_desarrollo: evaluacionData.recomendaciones_capacitacion || '',
          requiere_seguimiento: evaluacionData.requiere_seguimiento || 'no'
        },
        
        // Comentarios generales
        comentarios: evaluacionData.comentarios_generales || '',
        
        // Puntuación y calificación
        puntuacion_total: evaluacionData.puntuacion_total,
        calificacion_general: evaluacionData.calificacion_general
      };

      console.log('Insertando evaluación en Supabase:', evaluacionParaInsertar);
      
      // Configurar headers de autenticación
      const token = this.directAuthService.getAccessToken();
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      
      // Crear cliente temporal con token de autenticación
      const authenticatedClient = createClient(
        environment.supabase.url,
        environment.supabase.anonKey,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
      
      // Insertar en Supabase con cliente autenticado
      const { data, error } = await authenticatedClient
        .from('evaluaciones')
        .insert([evaluacionParaInsertar])
        .select()
        .single();

      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }

      console.log('Evaluación insertada exitosamente:', data);
      
      // Actualizar lista local
      const evaluacionesActuales = this.evaluacionesSubject.value;
      this.evaluacionesSubject.next([...evaluacionesActuales, data]);
      
      return data;
      
    } catch (error: any) {
      console.error('Error creating evaluacion:', error);
      
      // Manejo de errores específicos de Supabase
      if (error.code === '23505') {
        throw new Error('Ya existe una evaluación para este empleado en el período seleccionado');
      }
      
      if (error.code === '23503') {
        throw new Error('El empleado seleccionado no existe en el sistema');
      }
      
      if (error.code === '42501') {
        throw new Error('No tiene permisos para crear evaluaciones');
      }

      if (error.code === '23514') {
        throw new Error('Los valores de calificación deben estar entre 1 y 5');
      }
      
      throw new Error(error.message || 'Error desconocido al crear la evaluación');
    }
  }

  // Método para obtener obra_id por defecto
  private async getDefaultObraId(): Promise<string> {
    try {
      // Intentar obtener la primera obra disponible
      const { data: obras, error } = await this.supabase
        .from('obras')
        .select('id')
        .limit(1);

      if (error) {
        console.warn('Error obteniendo obras:', error);
        // Usar un ID por defecto si no se pueden obtener obras
        return '00000000-0000-0000-0000-000000000000';
      }

      if (obras && obras.length > 0) {
        return obras[0].id;
      }

      // Si no hay obras, usar un ID por defecto
      return '00000000-0000-0000-0000-000000000000';
    } catch (error) {
      console.warn('Error en getDefaultObraId:', error);
      return '00000000-0000-0000-0000-000000000000';
    }
  }

  // Calcular puntuación total basada en competencias
  calcularPuntuacionTotal(evaluacion: Partial<Evaluacion>): number {
    const competencias = [
      'conocimiento_tecnico', 'calidad_trabajo', 'productividad', 'seguridad_laboral',
      'trabajo_equipo', 'comunicacion', 'liderazgo', 'adaptabilidad',
      'puntualidad', 'iniciativa', 'compromiso', 'resolucion_problemas'
    ];
    
    let suma = 0;
    let contador = 0;
    
    competencias.forEach(competencia => {
      const valor = (evaluacion as any)[competencia];
      if (valor && valor > 0) {
        suma += valor;
        contador++;
      }
    });
    
    return contador > 0 ? suma / contador : 0;
  }

  // Determinar calificación general basada en puntuación
  determinarCalificacionGeneral(puntuacion: number): string {
    if (puntuacion >= 4.5) return 'excelente';
    if (puntuacion >= 4.0) return 'muy-bueno';
    if (puntuacion >= 3.5) return 'bueno';
    if (puntuacion >= 3.0) return 'regular';
    return 'deficiente';
  }

  // Obtener empleados para evaluar
  async getEmpleadosParaEvaluar(): Promise<EmpleadoEvaluacion[]> {
    try {
      // Intentar obtener usuarios reales de Supabase
      const { data: usuarios, error } = await this.supabase
        .from('users')
        .select('id, nombre, email, rol')
        .eq('activo', true)
        .order('nombre');

      if (!error && usuarios && usuarios.length > 0) {
        // Mapear usuarios reales a empleados
        return usuarios.map(usuario => ({
          id: usuario.id,
          nombre: usuario.nombre || usuario.email,
          puesto: usuario.rol || 'Empleado',
          departamento: this.getDepartamentoPorRol(usuario.rol),
          fecha_ingreso: '2023-01-01',
          activo: true
        }));
      }

      // Si no hay usuarios en la base de datos, usar datos de ejemplo con UUIDs válidos
      return [
        {
          id: '4fb82129-7475-4b55-ac52-8a712baa409b',
          nombre: 'Juan Pérez',
          puesto: 'Operario',
          departamento: 'Construcción',
          fecha_ingreso: '2023-01-15',
          activo: true
        },
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          nombre: 'María García',
          puesto: 'Supervisora',
          departamento: 'Calidad',
          fecha_ingreso: '2022-03-10',
          activo: true
        },
        {
          id: 'b2c3d4e5-f678-9012-bcde-f23456789012',
          nombre: 'Carlos López',
          puesto: 'Ingeniero',
          departamento: 'Proyectos',
          fecha_ingreso: '2021-06-20',
          activo: true
        },
        {
          id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
          nombre: 'Ana Martínez',
          puesto: 'Administrativa',
          departamento: 'Recursos Humanos',
          fecha_ingreso: '2023-08-05',
          activo: true
        },
        {
          id: 'd4e5f6a7-b8c9-0123-def4-456789012345',
          nombre: 'Roberto Silva',
          puesto: 'Operario',
          departamento: 'Mantenimiento',
          fecha_ingreso: '2023-11-12',
          activo: true
        }
      ];
    } catch (error) {
      console.error('Error getting empleados:', error);
      
      // En caso de error, devolver datos de ejemplo con UUIDs válidos
      return [
        {
          id: '4fb82129-7475-4b55-ac52-8a712baa409b',
          nombre: 'Juan Pérez',
          puesto: 'Operario',
          departamento: 'Construcción',
          fecha_ingreso: '2023-01-15',
          activo: true
        },
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          nombre: 'María García',
          puesto: 'Supervisora',
          departamento: 'Calidad',
          fecha_ingreso: '2022-03-10',
          activo: true
        }
      ];
    }
  }

  // Método auxiliar para mapear roles a departamentos
  private getDepartamentoPorRol(rol: string): string {
    switch (rol) {
      case 'supervisor':
      case 'jefe_obra':
        return 'Supervisión';
      case 'ingeniero':
        return 'Ingeniería';
      case 'trabajador':
      case 'operario':
        return 'Construcción';
      case 'residente':
        return 'Residencia';
      case 'admin':
        return 'Administración';
      default:
        return 'General';
    }
  }

  // Obtener resumen de evaluaciones
  async getResumenEvaluaciones(): Promise<ResumenEvaluacion[]> {
    try {
      // Datos de ejemplo
      return [
        {
          empleado_id: '1',
          empleado_nombre: 'Juan Pérez',
          promedio_general: 4.2,
          evaluaciones_completadas: 3,
          ultima_evaluacion: new Date('2024-01-15'),
          tendencia: 'mejorando'
        },
        {
          empleado_id: '2',
          empleado_nombre: 'María García',
          promedio_general: 4.7,
          evaluaciones_completadas: 4,
          ultima_evaluacion: new Date('2024-01-20'),
          tendencia: 'estable'
        },
        {
          empleado_id: '3',
          empleado_nombre: 'Carlos López',
          promedio_general: 4.1,
          evaluaciones_completadas: 2,
          ultima_evaluacion: new Date('2024-01-10'),
          tendencia: 'mejorando'
        }
      ];
    } catch (error) {
      console.error('Error getting resumen:', error);
      throw error;
    }
  }

  // Actualizar evaluación existente
  async updateEvaluacion(id: string, evaluacionData: Partial<Evaluacion>): Promise<Evaluacion> {
    try {
      // Recalcular puntuación si se modificaron competencias
      if (!evaluacionData.puntuacion_total) {
        evaluacionData.puntuacion_total = this.calcularPuntuacionTotal(evaluacionData);
      }
      
      // Actualizar calificación general
      if (evaluacionData.puntuacion_total) {
        evaluacionData.calificacion_general = this.determinarCalificacionGeneral(evaluacionData.puntuacion_total);
      }
      
      evaluacionData.updated_at = new Date().toISOString();
      
      // Simular actualización en base de datos
      const evaluacionesActuales = this.evaluacionesSubject.value;
      const index = evaluacionesActuales.findIndex(e => e.id === id);
      
      if (index === -1) {
        throw new Error('Evaluación no encontrada');
      }
      
      const evaluacionActualizada = { ...evaluacionesActuales[index], ...evaluacionData };
      evaluacionesActuales[index] = evaluacionActualizada;
      
      this.evaluacionesSubject.next([...evaluacionesActuales]);
      
      return evaluacionActualizada;
      
    } catch (error: any) {
      console.error('Error updating evaluacion:', error);
      throw new Error(error.message || 'Error al actualizar la evaluación');
    }
  }

  // Eliminar evaluación
  async deleteEvaluacion(id: string): Promise<void> {
    try {
      const evaluacionesActuales = this.evaluacionesSubject.value;
      const evaluacionesFiltradas = evaluacionesActuales.filter(e => e.id !== id);
      
      this.evaluacionesSubject.next(evaluacionesFiltradas);
      
    } catch (error: any) {
      console.error('Error deleting evaluacion:', error);
      throw new Error(error.message || 'Error al eliminar la evaluación');
    }
  }

  // Obtener evaluación por ID
  async getEvaluacionById(id: string): Promise<Evaluacion | null> {
    try {
      const evaluaciones = this.evaluacionesSubject.value;
      return evaluaciones.find(e => e.id === id) || null;
    } catch (error) {
      console.error('Error getting evaluacion by ID:', error);
      return null;
    }
  }

  // Refrescar todos los datos
  async refresh(): Promise<void> {
    await this.loadInitialData();
  }

  // Obtener estadísticas generales
  async getEstadisticas(): Promise<any> {
    try {
      const evaluaciones = this.evaluacionesSubject.value;
      
      return {
        total_evaluaciones: evaluaciones.length,
        evaluaciones_completadas: evaluaciones.filter(e => e.estado === 'completada').length,
        evaluaciones_pendientes: evaluaciones.filter(e => e.estado === 'borrador').length,
        promedio_general: evaluaciones.reduce((sum, e) => sum + e.puntuacion_total, 0) / evaluaciones.length || 0,
        empleados_evaluados: new Set(evaluaciones.map(e => e.evaluado_id)).size
      };
    } catch (error) {
      console.error('Error getting estadisticas:', error);
      return {};
    }
  }
}