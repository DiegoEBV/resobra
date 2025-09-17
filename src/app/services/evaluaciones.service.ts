import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

// Interfaces
export interface CriterioEvaluacion {
  id: string;
  nombre: string;
  descripcion: string;
  peso: number; // Porcentaje del peso en la evaluación total
  tipo_personal: string;
  activo: boolean;
  created_at?: string;
}

export interface RubricaEvaluacion {
  id: string;
  nombre: string;
  descripcion: string;
  tipo_personal: string; // operario, supervisor, ingeniero, administrativo
  criterios: CriterioEvaluacion[];
  activa: boolean;
  created_at?: string;
}

export interface Evaluacion {
  id: string;
  evaluado_id: string;
  evaluado_nombre?: string;
  evaluador_id: string;
  evaluador_nombre?: string;
  rubrica_id: string;
  rubrica_nombre?: string;
  periodo: string;
  fecha_evaluacion: string;
  calificaciones: { [criterio_id: string]: number };
  puntuacion_total: number;
  comentarios_generales?: string;
  estado: 'borrador' | 'completada' | 'revisada' | 'aprobada';
  created_at?: string;
  updated_at?: string;
}

export interface ResumenEvaluacion {
  empleado_id: string;
  empleado_nombre: string;
  puesto: string;
  promedio_general: number;
  evaluaciones_completadas: number;
  ultima_evaluacion: string;
  tendencia: 'mejorando' | 'estable' | 'declinando';
}

@Injectable({
  providedIn: 'root'
})
export class EvaluacionesService {
  private evaluacionesSubject = new BehaviorSubject<Evaluacion[]>([]);
  private rubricasSubject = new BehaviorSubject<RubricaEvaluacion[]>([]);
  private criteriosSubject = new BehaviorSubject<CriterioEvaluacion[]>([]);

  public evaluaciones$ = this.evaluacionesSubject.asObservable();
  public rubricas$ = this.rubricasSubject.asObservable();
  public criterios$ = this.criteriosSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    this.loadInitialData();
  }

  private async loadInitialData() {
    try {
      await Promise.all([
        this.loadEvaluaciones(),
        this.loadRubricas(),
        this.loadCriterios()
      ]);
    } catch (error) {
      // Error loading initial evaluation data
    }
  }

  // Cargar evaluaciones
  async loadEvaluaciones(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from('evaluaciones')
        .select(`
          *,
          evaluado:users!evaluado_id(nombre),
          evaluador:users!evaluador_id(nombre),
          rubrica:rubricas_evaluacion(nombre)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const evaluaciones = data?.map(item => ({
        ...item,
        evaluado_nombre: item.evaluado?.nombre,
        evaluador_nombre: item.evaluador?.nombre,
        rubrica_nombre: item.rubrica?.nombre
      })) || [];

      this.evaluacionesSubject.next(evaluaciones);
    } catch (error) {
      // Error loading evaluaciones
      throw error;
    }
  }

  // Cargar rúbricas
  async loadRubricas(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from('rubricas_evaluacion')
        .select(`
          *,
          criterios:criterios_evaluacion(*)
        `)
        .eq('activa', true)
        .order('nombre');

      if (error) throw error;

      this.rubricasSubject.next(data || []);
    } catch (error) {
      // Error loading rubricas
      throw error;
    }
  }

  // Cargar criterios
  async loadCriterios(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from('criterios_evaluacion')
        .select('*')
        .order('nombre');

      if (error) throw error;

      this.criteriosSubject.next(data || []);
    } catch (error) {
      // Error loading criterios
      throw error;
    }
  }

  // Crear nueva evaluación
  async createEvaluacion(evaluacionData: Partial<Evaluacion>): Promise<Evaluacion> {
    try {
      const evaluadorId = await this.supabase.getCurrentUserId();
      
      // Validar datos requeridos
      if (!evaluacionData.evaluado_id) {
        throw new Error('El ID del empleado a evaluar es requerido');
      }
      if (!evaluacionData.rubrica_id) {
        throw new Error('La rúbrica de evaluación es requerida');
      }
      if (!evaluacionData.calificaciones || Object.keys(evaluacionData.calificaciones).length === 0) {
        throw new Error('Las calificaciones son requeridas');
      }

      const { data, error } = await this.supabase.client
        .from('evaluaciones')
        .insert({
          ...evaluacionData,
          evaluador_id: evaluadorId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        // Error de Supabase al crear evaluación
        
        // Manejo específico de errores comunes
        if (error.code === 'PGRST204') {
          throw new Error('Error de estructura de base de datos. Contacte al administrador.');
        }
        if (error.code === '23505') {
          throw new Error('Ya existe una evaluación para este empleado en este período.');
        }
        if (error.code === '23503') {
          throw new Error('Datos de referencia inválidos. Verifique el empleado y la rúbrica seleccionados.');
        }
        
        throw new Error(`Error al guardar la evaluación: ${error.message}`);
      }

      await this.loadEvaluaciones();
      return data;
    } catch (error: any) {
      // Error creating evaluacion
      
      // Re-lanzar errores personalizados
      if (error.message && error.message.includes('requerido')) {
        throw error;
      }
      
      // Error genérico para otros casos
      throw new Error('Error inesperado al crear la evaluación. Intente nuevamente.');
    }
  }

  // Actualizar evaluación
  async updateEvaluacion(id: string, updates: Partial<Evaluacion>): Promise<Evaluacion> {
    try {
      const { data, error } = await this.supabase.client
        .from('evaluaciones')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await this.loadEvaluaciones();
      return data;
    } catch (error) {
      // Error updating evaluacion
      throw error;
    }
  }

  // Calcular puntuación total
  calcularPuntuacionTotal(calificaciones: { [criterio_id: string]: number }, criterios: CriterioEvaluacion[]): number {
    let puntuacionTotal = 0;
    let pesoTotal = 0;

    criterios.forEach(criterio => {
      const calificacion = calificaciones[criterio.id] || 0;
      puntuacionTotal += (calificacion * criterio.peso / 100);
      pesoTotal += criterio.peso;
    });

    // Normalizar a 100 si el peso total no es exactamente 100
    if (pesoTotal > 0 && pesoTotal !== 100) {
      puntuacionTotal = (puntuacionTotal * 100) / pesoTotal;
    }

    return Math.round(puntuacionTotal * 100) / 100; // Redondear a 2 decimales
  }

  // Obtener empleados para evaluar
  async getEmpleadosParaEvaluar(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('users')
        .select('id, nombre, email, rol')
        .order('nombre');

      if (error) throw error;

      return data || [];
    } catch (error) {
      // Error getting empleados
      return [];
    }
  }

  // Obtener resumen de evaluaciones
  async getResumenEvaluaciones(): Promise<ResumenEvaluacion[]> {
    try {
      // Esta consulta sería más compleja en una implementación real
      // Por ahora, simulamos datos de resumen
      const empleados = await this.getEmpleadosParaEvaluar();
      const evaluaciones = this.evaluacionesSubject.value;

      const resumen: ResumenEvaluacion[] = empleados.map(empleado => {
        const evaluacionesEmpleado = evaluaciones.filter(e => e.evaluado_id === empleado.id && e.estado === 'aprobada');
        const promedio = evaluacionesEmpleado.length > 0 
          ? evaluacionesEmpleado.reduce((sum, e) => sum + e.puntuacion_total, 0) / evaluacionesEmpleado.length
          : 0;
        
        const ultimaEvaluacion = evaluacionesEmpleado.length > 0 
          ? evaluacionesEmpleado.sort((a, b) => new Date(b.fecha_evaluacion).getTime() - new Date(a.fecha_evaluacion).getTime())[0].fecha_evaluacion
          : '';

        // Calcular tendencia (simplificado)
        let tendencia: 'mejorando' | 'estable' | 'declinando' = 'estable';
        if (evaluacionesEmpleado.length >= 2) {
          const evaluacionesOrdenadas = evaluacionesEmpleado.sort((a, b) => new Date(a.fecha_evaluacion).getTime() - new Date(b.fecha_evaluacion).getTime());
          const primera = evaluacionesOrdenadas[0].puntuacion_total;
          const ultima = evaluacionesOrdenadas[evaluacionesOrdenadas.length - 1].puntuacion_total;
          
          if (ultima > primera + 5) tendencia = 'mejorando';
          else if (ultima < primera - 5) tendencia = 'declinando';
        }

        return {
          empleado_id: empleado.id,
          empleado_nombre: empleado.nombre,
          puesto: empleado.rol || 'No especificado',
          promedio_general: promedio,
          evaluaciones_completadas: evaluacionesEmpleado.length,
          ultima_evaluacion: ultimaEvaluacion,
          tendencia
        };
      });

      return resumen;
    } catch (error) {
      // Error getting resumen evaluaciones
      return [];
    }
  }

  // Crear nueva rúbrica
  async createRubrica(rubricaData: Partial<RubricaEvaluacion>): Promise<RubricaEvaluacion> {
    try {
      const { data, error } = await this.supabase.client
        .from('rubricas_evaluacion')
        .insert({
          ...rubricaData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await this.loadRubricas();
      return data;
    } catch (error) {
      // Error creating rubrica
      throw error;
    }
  }

  // Crear nuevo criterio
  async createCriterio(criterioData: Partial<CriterioEvaluacion>): Promise<CriterioEvaluacion> {
    try {
      const { data, error } = await this.supabase.client
        .from('criterios_evaluacion')
        .insert({
          ...criterioData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await this.loadCriterios();
      return data;
    } catch (error) {
      // Error creating criterio
      throw error;
    }
  }

  // Refrescar todos los datos
  async refresh(): Promise<void> {
    await this.loadInitialData();
  }

  // Obtener evaluación por ID
  async getEvaluacionById(id: string): Promise<Evaluacion | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('evaluaciones')
        .select(`
          *,
          evaluado:users!evaluado_id(nombre),
          evaluador:users!evaluador_id(nombre),
          rubrica:rubricas_evaluacion(nombre)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        evaluado_nombre: data.evaluado?.nombre,
        evaluador_nombre: data.evaluador?.nombre,
        rubrica_nombre: data.rubrica?.nombre
      };
    } catch (error) {
      // Error getting evaluacion by id
      return null;
    }
  }

  // Obtener estadísticas de evaluaciones
  async getEstadisticasEvaluaciones(): Promise<any> {
    try {
      const evaluaciones = this.evaluacionesSubject.value;
      
      const stats = {
        total: evaluaciones.length,
        completadas: evaluaciones.filter(e => e.estado === 'completada' || e.estado === 'aprobada').length,
        pendientes: evaluaciones.filter(e => e.estado === 'borrador').length,
        promedio_general: 0,
        por_estado: {
          borrador: evaluaciones.filter(e => e.estado === 'borrador').length,
          completada: evaluaciones.filter(e => e.estado === 'completada').length,
          revisada: evaluaciones.filter(e => e.estado === 'revisada').length,
          aprobada: evaluaciones.filter(e => e.estado === 'aprobada').length
        }
      };

      const evaluacionesAprobadas = evaluaciones.filter(e => e.estado === 'aprobada');
      if (evaluacionesAprobadas.length > 0) {
        stats.promedio_general = evaluacionesAprobadas.reduce((sum, e) => sum + e.puntuacion_total, 0) / evaluacionesAprobadas.length;
      }

      return stats;
    } catch (error) {
      // Error getting estadisticas
      return null;
    }
  }
}