import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

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
  // Campos de configuración
  requiere_maquinaria?: boolean;
  requiere_materiales?: boolean;
  es_critica?: boolean;
  created_at?: string;
  updated_at?: string;
  // Relaciones
  frente?: Frente;
  evidencias?: any[];
  recursos?: any[];
}

export interface Evidencia {
  id?: string;
  actividad_id: string;
  tipo: 'foto' | 'video' | 'documento';
  url: string;
  descripcion?: string;
  fecha_captura: string;
  created_at?: string;
}

export interface Recurso {
  id?: string;
  actividad_id: string;
  tipo_recurso: 'personal' | 'maquinaria' | 'material';
  nombre: string;
  cantidad: number;
  unidad: string;
  costo_unitario?: number;
  costo_total?: number;
  fecha_asignacion: string;
  created_at?: string;
}

export interface Frente {
  id: string;
  obra_id: string;
  nombre: string;
  descripcion?: string;
  ubicacion_lat?: number;
  ubicacion_lng?: number;
  estado: 'activo' | 'inactivo' | 'completado';
  fecha_inicio: string;
  fecha_fin_estimada?: string;
  progreso_general: number;
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
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActividadesService {
  private actividadesSubject = new BehaviorSubject<Actividad[]>([]);
  public actividades$ = this.actividadesSubject.asObservable();

  private frentesSubject = new BehaviorSubject<Frente[]>([]);
  public frentes$ = this.frentesSubject.asObservable();
  private progresoUpdatedSubject = new Subject<{actividadId: string, progreso: number}>();
  public progresoUpdated$ = this.progresoUpdatedSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {
    // Escuchar cambios en la autenticación
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        console.log('Usuario autenticado, cargando datos:', user.email);
        this.loadUserActividades();
        this.loadUserFrente();
      } else {
        console.log('Usuario no autenticado, limpiando datos');
        this.actividadesSubject.next([]);
        this.frentesSubject.next([]);
      }
    });
  }

  // Cargar actividades del usuario
  private async loadUserActividades(): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        console.log('No hay usuario autenticado para cargar actividades');
        return;
      }

      const { data, error } = await this.supabase.client
        .from('actividades')
        .select(`
          *,
          frente:frentes(*),
          evidencias(*),
          recursos(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Debug: Verificar los datos que llegan de Supabase
      console.log('🔍 [ActividadesService] Datos recibidos de Supabase:', data);
      if (data && data.length > 0) {
        console.log('🔍 [ActividadesService] Primera actividad:', data[0]);
        console.log('🔍 [ActividadesService] ID de primera actividad:', data[0].id);
        console.log('🔍 [ActividadesService] Claves de primera actividad:', Object.keys(data[0]));
      }
      
      this.actividadesSubject.next(data || []);
    } catch (error) {
      console.error('Error loading actividades:', error);
    }
  }

  // Cargar frentes del usuario
  async reloadUserFrente(): Promise<void> {
    await this.loadUserFrente();
  }

  // Cargar frentes del usuario
  private async loadUserFrente(): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        console.log('No hay usuario autenticado para cargar frentes');
        return;
      }
      
      console.log('Cargando frentes para usuario:', user.email);

      // Obtener obras asignadas al usuario
      const { data: userObras, error: userObrasError } = await this.supabase.client
        .from('user_obras')
        .select('obra_id')
        .eq('user_id', user.id);

      if (userObrasError) {
        console.error('Error obteniendo obras del usuario:', userObrasError);
        throw userObrasError;
      }

      console.log('Obras asignadas al usuario:', userObras);

      if (userObras && userObras.length > 0) {
        const obraIds = userObras.map(uo => uo.obra_id);
        console.log('IDs de obras:', obraIds);
        
        const { data, error } = await this.supabase.client
          .from('frentes')
          .select('*')
          .in('obra_id', obraIds)
          .eq('estado', 'activo')
          .order('nombre');

        if (error) {
          console.error('Error obteniendo frentes:', error);
          throw error;
        }
        
        console.log('Frentes encontrados:', data);
        this.frentesSubject.next(data || []);
      } else {
        console.log('El usuario no tiene obras asignadas');
        this.frentesSubject.next([]);
      }
    } catch (error) {
      console.error('Error loading frentes:', error);
    }
  }

  // Crear nueva actividad
  async createActividad(actividad: Omit<Actividad, 'id' | 'created_at' | 'updated_at'>): Promise<Actividad> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const actividadData = {
        ...actividad,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase.client
        .from('actividades')
        .insert([actividadData])
        .select(`
          *,
          frente:frentes(*)
        `)
        .single();

      if (error) throw error;

      // Actualizar la lista local
      await this.loadUserActividades();
      
      return data;
    } catch (error) {
      console.error('Error creating actividad:', error);
      throw error;
    }
  }

  // Actualizar actividad
  async updateActividad(id: string, updates: Partial<Actividad>): Promise<Actividad> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase.client
        .from('actividades')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          frente:frentes(*)
        `)
        .single();

      if (error) throw error;

      // Actualizar la lista local
      await this.loadUserActividades();
      
      return data;
    } catch (error) {
      console.error('Error updating actividad:', error);
      throw error;
    }
  }

  // Eliminar actividad
  async deleteActividad(id: string): Promise<void> {
    try {
      console.log('🗑️ [ActividadesService] Intentando eliminar actividad con ID:', id);
      console.log('🗑️ [ActividadesService] Tipo de ID:', typeof id);
      console.log('🗑️ [ActividadesService] Valor del ID:', JSON.stringify(id));
      
      // Validar que el ID sea un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        console.error('❌ [ActividadesService] ID no es un UUID válido:', id);
        throw new Error(`ID no es un UUID válido: ${id}`);
      }
      
      const { error } = await this.supabase.client
        .from('actividades')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ [ActividadesService] Error de Supabase al eliminar:', error);
        throw error;
      }
      
      console.log('✅ [ActividadesService] Actividad eliminada exitosamente');

      // Actualizar la lista local
      await this.loadUserActividades();
    } catch (error) {
      console.error('❌ [ActividadesService] Error deleting actividad:', error);
      throw error;
    }
  }

  // Obtener actividad por ID
  async getActividadById(id: string): Promise<Actividad | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('actividades')
        .select(`
          *,
          frente:frentes(*),
          evidencias(*),
          recursos(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting actividad:', error);
      return null;
    }
  }

  // Agregar evidencia a actividad
  async addEvidencia(evidencia: Omit<Evidencia, 'id' | 'created_at'>): Promise<Evidencia> {
    try {
      const evidenciaData = {
        ...evidencia,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase.client
        .from('evidencias')
        .insert([evidenciaData])
        .select()
        .single();

      if (error) throw error;

      // Actualizar la lista local
      await this.loadUserActividades();
      
      return data;
    } catch (error) {
      console.error('Error adding evidencia:', error);
      throw error;
    }
  }

  // Agregar recurso a actividad
  async addRecurso(recurso: Omit<Recurso, 'id' | 'created_at'>): Promise<Recurso> {
    try {
      const recursoData = {
        ...recurso,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase.client
        .from('recursos')
        .insert([recursoData])
        .select()
        .single();

      if (error) throw error;

      // Actualizar la lista local
      await this.loadUserActividades();
      
      return data;
    } catch (error) {
      console.error('Error adding recurso:', error);
      throw error;
    }
  }

  // Obtener actividades por frente
  async getActividadesByFrente(frenteId: string): Promise<Actividad[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('actividades')
        .select(`
          *,
          frente:frentes(*),
          evidencias(*),
          recursos(*)
        `)
        .eq('frente_id', frenteId)
        .order('fecha', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting actividades by frente:', error);
      return [];
    }
  }

  // Obtener todas las actividades del usuario
  async getActividades(): Promise<Actividad[]> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        console.log('🔍 DEBUG: No hay usuario autenticado');
        return [];
      }

      console.log('🔍 DEBUG: Obteniendo actividades para usuario:', user.id);
      
      const { data, error } = await this.supabase.client
        .from('actividades')
        .select(`
          *,
          frente:frentes(*),
          evidencias(*),
          recursos(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🔍 DEBUG: Error de Supabase:', error);
        throw error;
      }
      
      console.log('🔍 DEBUG: Datos recibidos de Supabase:', data);
      console.log('🔍 DEBUG: Número de actividades:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('🔍 DEBUG: Primera actividad completa:', JSON.stringify(data[0], null, 2));
        console.log('🔍 DEBUG: ID de primera actividad:', data[0].id, 'Tipo:', typeof data[0].id);
      }
      
      return data || [];
    } catch (error) {
      console.error('🔍 DEBUG: Error en getActividades:', error);
      return [];
    }
  }

  // Obtener estadísticas de actividades
  async getActividadesStats(): Promise<any> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) return null;

      const { data, error } = await this.supabase.client
        .from('actividades')
        .select('estado')
        .eq('user_id', user.id);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        programado: data?.filter(a => a.estado === 'programado').length || 0,
        ejecucion: data?.filter(a => a.estado === 'ejecucion').length || 0,
        finalizado: data?.filter(a => a.estado === 'finalizado').length || 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting actividades stats:', error);
      return null;
    }
  }

  // MÉTODOS CRUD PARA TAREAS

  // Crear nueva tarea
  async createTarea(tarea: any): Promise<any> {
    try {
      console.log('📝 [ActividadesService] Creando nueva tarea:', tarea);
      
      const tareaData = {
        ...tarea,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase.client
        .from('tareas')
        .insert([tareaData])
        .select()
        .single();

      if (error) {
        console.error('❌ [ActividadesService] Error creando tarea:', error);
        throw error;
      }

      console.log('✅ [ActividadesService] Tarea creada exitosamente:', data);
      return data;
    } catch (error) {
      console.error('❌ [ActividadesService] Error en createTarea:', error);
      throw error;
    }
  }

  // Obtener tareas por actividad
  async getTareasByActividad(actividadId: string): Promise<any[]> {
    try {
      console.log('📋 [ActividadesService] Obteniendo tareas para actividad:', actividadId);
      console.log('📋 [ActividadesService] Tipo de actividadId:', typeof actividadId, 'Valor:', actividadId);
      
      const { data, error } = await this.supabase.client
        .from('tareas')
        .select('*')
        .eq('actividad_id', actividadId)
        .order('orden', { ascending: true });

      if (error) {
        console.error('❌ [ActividadesService] Error obteniendo tareas:', error);
        throw error;
      }

      console.log('✅ [ActividadesService] Tareas obtenidas:', data?.length || 0);
      console.log('📋 [ActividadesService] Datos completos:', data);
      return data || [];
    } catch (error) {
      console.error('❌ [ActividadesService] Error en getTareasByActividad:', error);
      throw error;
    }
  }

  // Calcular progreso de actividad basado en tareas completadas
  async calcularProgresoActividad(actividadId: string): Promise<number> {
    try {
      const tareas = await this.getTareasByActividad(actividadId);
      
      if (tareas.length === 0) {
        return 0; // Sin tareas, progreso 0%
      }

      const tareasCompletadas = tareas.filter(tarea => tarea.completada).length;
      const progreso = Math.round((tareasCompletadas / tareas.length) * 100);
      
      console.log(`📊 [ActividadesService] Progreso actividad ${actividadId}: ${progreso}% (${tareasCompletadas}/${tareas.length})`);
      return progreso;
    } catch (error) {
      console.error('❌ [ActividadesService] Error calculando progreso:', error);
      return 0;
    }
  }

  // Actualizar estado de tarea
  async updateTareaEstado(tareaId: string, completada: boolean): Promise<any> {
    try {
      console.log('🔄 [ActividadesService] Actualizando estado de tarea:', tareaId, completada);
      
      // Primero obtener la actividad_id de la tarea
      const { data: tarea, error: tareaError } = await this.supabase.client
        .from('tareas')
        .select('actividad_id')
        .eq('id', tareaId)
        .single();

      if (tareaError) {
        console.error('❌ [ActividadesService] Error obteniendo tarea:', tareaError);
        throw tareaError;
      }
      
      const updateData: any = {
        completada,
        updated_at: new Date().toISOString()
      };

      // Si se marca como completada, agregar fecha de completado
      if (completada) {
        updateData.fecha_completado = new Date().toISOString();
      } else {
        updateData.fecha_completado = null;
      }

      const { data, error } = await this.supabase.client
        .from('tareas')
        .update(updateData)
        .eq('id', tareaId)
        .select()
        .single();

      if (error) {
        console.error('❌ [ActividadesService] Error actualizando tarea:', error);
        throw error;
      }

      // Calcular y emitir el nuevo progreso
      const nuevoProgreso = await this.calcularProgresoActividad(tarea.actividad_id);
      this.progresoUpdatedSubject.next({
        actividadId: tarea.actividad_id,
        progreso: nuevoProgreso
      });

      console.log('✅ [ActividadesService] Tarea actualizada exitosamente:', data);
      return data;
    } catch (error) {
      console.error('❌ [ActividadesService] Error en updateTareaEstado:', error);
      throw error;
    }
  }

  // MÉTODOS CRUD PARA FRENTES

  // Crear nuevo frente
  async createFrente(frente: Omit<Frente, 'id' | 'created_at'>): Promise<Frente> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const frenteData = {
        ...frente,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase.client
        .from('frentes')
        .insert([frenteData])
        .select()
        .single();

      if (error) throw error;

      // Actualizar la lista local
      await this.loadUserFrente();
      
      return data;
    } catch (error) {
      console.error('Error creating frente:', error);
      throw error;
    }
  }

  // Actualizar frente
  async updateFrente(id: string, updates: Partial<Frente>): Promise<Frente> {
    try {
      const { data, error } = await this.supabase.client
        .from('frentes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar la lista local
      await this.loadUserFrente();
      
      return data;
    } catch (error) {
      console.error('Error updating frente:', error);
      throw error;
    }
  }

  // Actualizar ubicación de frente
  async updateFrenteLocation(id: string, lat: number, lng: number): Promise<Frente> {
    try {
      const { data, error } = await this.supabase.client
        .from('frentes')
        .update({ 
          ubicacion_lat: lat, 
          ubicacion_lng: lng 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar la lista local
      await this.loadUserFrente();
      
      return data;
    } catch (error) {
      console.error('Error updating frente location:', error);
      throw error;
    }
  }

  // Eliminar frente
  async deleteFrente(id: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('frentes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Actualizar la lista local
      await this.loadUserFrente();
    } catch (error) {
      console.error('Error deleting frente:', error);
      throw error;
    }
  }

  // Obtener frente por ID
  async getFrenteById(id: string): Promise<Frente | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('frentes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting frente:', error);
      return null;
    }
  }

  // Obtener obras disponibles para el usuario
  async getUserObras(): Promise<any[]> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await this.supabase.client
        .from('user_obras')
        .select(`
          obra_id,
          obras(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map(uo => uo.obras) || [];
    } catch (error) {
      console.error('Error getting user obras:', error);
      return [];
    }
  }

  // Refrescar datos
  async refresh(): Promise<void> {
    await Promise.all([
      this.loadUserActividades(),
      this.loadUserFrente()
    ]);
  }
}