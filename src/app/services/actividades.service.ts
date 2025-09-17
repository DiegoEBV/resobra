import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { DirectAuthService } from './direct-auth.service';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  // Puntos de control intermedios para curvas
  coordenadas_intermedias?: {
    lat: number;
    lng: number;
    kilometraje: number;
  }[];
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActividadesService implements OnDestroy {
  private actividadesSubject = new BehaviorSubject<Actividad[]>([]);
  public actividades$ = this.actividadesSubject.asObservable().pipe(
    tap(actividades => {
      // Emitiendo actividades
    })
  );

  private frentesSubject = new BehaviorSubject<Frente[]>([]);
  public frentes$ = this.frentesSubject.asObservable().pipe(
    tap(frentes => {
      // Emitiendo frentes
    })
  );
  private progresoUpdatedSubject = new Subject<{actividadId: string, progreso: number}>();
  public progresoUpdated$ = this.progresoUpdatedSubject.asObservable();
  
  // Suscripciones en tiempo real
  private actividadesChannel: RealtimeChannel | null = null;
  private frentesChannel: RealtimeChannel | null = null;

  constructor(
    private supabase: SupabaseService,
    private directAuthService: DirectAuthService
  ) {
    // Constructor iniciado
    
    // Cargar datos iniciales si hay usuario autenticado
    const user = this.directAuthService.getCurrentUser();
    if (user) {
      // Usuario autenticado, cargando datos
      this.loadUserActividades().catch(error => {
        // Error cargando actividades
      });
      this.loadUserFrente().catch(error => {
        // Error cargando frentes
      });
      this.setupRealtimeSubscriptions();
    }
  }

  ngOnDestroy(): void {
    this.cleanupRealtimeSubscriptions();
  }

  // Configurar suscripciones en tiempo real
  private setupRealtimeSubscriptions(): void {
    // Configurando suscripciones en tiempo real
    
    // Limpiar suscripciones existentes
    this.cleanupRealtimeSubscriptions();
    
    const user = this.directAuthService.getCurrentUser();
    if (!user) {
      // No hay usuario para configurar suscripciones
      return;
    }

    // Suscripción para actividades
    this.actividadesChannel = this.supabase.client
      .channel('actividades-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'actividades'
        },
        (payload) => {
          // Cambio en actividades
          this.handleActividadChange(payload);
        }
      )
      .subscribe();

    // Suscripción para frentes
    this.frentesChannel = this.supabase.client
      .channel('frentes-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'frentes'
        },
        (payload) => {
          // Cambio en frentes
          this.handleFrenteChange(payload);
        }
      )
      .subscribe();

    // Suscripciones en tiempo real configuradas
  }

  // Limpiar suscripciones en tiempo real
  private cleanupRealtimeSubscriptions(): void {
    // Limpiando suscripciones en tiempo real
    
    if (this.actividadesChannel) {
      this.supabase.client.removeChannel(this.actividadesChannel);
      this.actividadesChannel = null;
    }
    
    if (this.frentesChannel) {
      this.supabase.client.removeChannel(this.frentesChannel);
      this.frentesChannel = null;
    }
  }

  // Manejar cambios en actividades
  private async handleActividadChange(payload: any): Promise<void> {
    const user = this.directAuthService.getCurrentUser();
    if (!user) return;

    // Procesando cambio en actividad
    
    // Verificar si el cambio es relevante para el usuario actual
    const isRelevant = await this.isActividadRelevantForUser(payload, user.id);
    
    if (isRelevant) {
      // Cambio relevante, recargando actividades
      await this.loadUserActividades();
    } else {
      // Cambio no relevante para el usuario actual
    }
  }

  // Manejar cambios en frentes
  private async handleFrenteChange(payload: any): Promise<void> {
    const user = this.directAuthService.getCurrentUser();
    if (!user) return;

    // Procesando cambio en frente
    
    // Verificar si el cambio es relevante para el usuario actual
    const isRelevant = await this.isFrenteRelevantForUser(payload, user.id);
    
    if (isRelevant) {
      // Cambio relevante, recargando frentes
      await this.loadUserFrente();
    } else {
      // Cambio no relevante para el usuario actual
    }
  }

  // Verificar si una actividad es relevante para el usuario
  private async isActividadRelevantForUser(payload: any, userId: string): Promise<boolean> {
    try {
      const actividad = payload.new || payload.old;
      if (!actividad) return false;

      // Todas las actividades son relevantes para ambos usuarios (residente y logística)
      // Esto permite que las actividades se comuniquen entre usuarios
      return true;
    } catch (error) {
      // Error verificando relevancia de actividad
      return false;
    }
  }

  // Verificar si un frente es relevante para el usuario
  private async isFrenteRelevantForUser(payload: any, userId: string): Promise<boolean> {
    try {
      const frente = payload.new || payload.old;
      if (!frente) return false;

      // Todos los frentes son relevantes para ambos usuarios (residente y logística)
      return true;
    } catch (error) {
      // Error verificando relevancia del frente
      return false;
    }
  }

  // Cargar actividades del usuario
  async loadUserActividades(): Promise<void> {
    // Iniciando loadUserActividades
    try {
      // Verificando usuario autenticado
      const user = this.directAuthService.getCurrentUser();
      // Usuario obtenido
      
      if (!user) {
        // No hay usuario autenticado para cargar actividades
        return;
      }

      // Usuario actual obtenido

      // Estado de conexión Supabase verificado

      let data, error;

      // Verificar el rol del usuario para aplicar filtros diferentes
      // Cargar todas las actividades para ambos roles (residente y logística)
      // Esto permite que ambos usuarios vean todas las actividades del sistema
      // Cargando todas las actividades para usuario
      
      // Ejecutando consulta a Supabase
      
      // Primero intentar una consulta simple sin joins
      // Probando consulta simple sin joins
      const simpleResult = await this.supabase.client
        .from('actividades')
        .select('*')
        .limit(10);
        
      // Resultado consulta simple obtenido
      
      // Ahora la consulta completa
      // Ejecutando consulta completa con joins
      const result = await this.supabase.client
        .from('actividades')
        .select(`
          *,
          frente:frentes(*),
          evidencias(*),
          recursos(*)
        `)
        .order('created_at', { ascending: false });
        
      // Resultado completo de actividades obtenido
      
      // Verificar si hay diferencia entre consulta simple y completa
       if (simpleResult.data && simpleResult.data.length > 0 && (!result.data || result.data.length === 0)) {
         // La consulta simple tiene datos pero la completa no. Usando datos simples
         data = simpleResult.data;
         error = simpleResult.error;
       } else {
         data = result.data;
         error = result.error;
       }

      if (error) {
        // Error en consulta Supabase
        throw error;
      }
      
      // Debug: Verificar los datos que llegan de Supabase
      // Datos recibidos de Supabase
      
      if (data && data.length > 0) {
        // Primera actividad obtenida
      } else {
        // No se encontraron actividades en la base de datos
      }
      
      // Enviando datos al BehaviorSubject
      this.actividadesSubject.next(data || []);
      // Datos enviados al BehaviorSubject
      
      // Verificar el estado actual del BehaviorSubject
      const currentValue = this.actividadesSubject.value;
      // Debug: Valor actual del BehaviorSubject
    // Debug: Longitud del BehaviorSubject
      
    } catch (error: any) {
      // Error completo en loadUserActividades
      // Stack trace del error
    }
  }

  // Cargar frentes del usuario
  async reloadUserFrente(): Promise<void> {
    await this.loadUserFrente();
  }

  // Cargar frentes del usuario
  private async loadUserFrente(): Promise<void> {
    try {
      const user = this.directAuthService.getCurrentUser();
      if (!user) {
        // No hay usuario autenticado para cargar frentes
        return;
      }
      
      // Cargando frentes para usuario

      // Cargar todos los frentes activos para ambos usuarios (residente y logística)
      const { data, error } = await this.supabase.client
        .from('frentes')
        .select('*')
        .eq('estado', 'activo')
        .order('nombre');

      if (error) {
        // Error obteniendo frentes
        throw error;
      }
      
      // Frentes encontrados
      this.frentesSubject.next(data || []);
    } catch (error) {
      // Error loading frentes
    }
  }

  // Crear nueva actividad
  async createActividad(actividad: Omit<Actividad, 'id' | 'created_at' | 'updated_at'>): Promise<Actividad> {
    try {
      const user = this.directAuthService.getCurrentUser();
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
      // Error creating actividad
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
      // Error updating actividad
      throw error;
    }
  }

  // Eliminar actividad
  async deleteActividad(id: string): Promise<void> {
    try {
      // Intentando eliminar actividad con ID
    // Tipo de ID
    // Valor del ID
      
      // Validar que el ID sea un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        // ID no es un UUID válido
        throw new Error(`ID no es un UUID válido: ${id}`);
      }
      
      const { error } = await this.supabase.client
        .from('actividades')
        .delete()
        .eq('id', id);

      if (error) {
        // Error de Supabase al eliminar
        throw error;
      }
      
      // Actividad eliminada exitosamente

      // Actualizar la lista local
      await this.loadUserActividades();
    } catch (error) {
      // Error deleting actividad
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
      // Error getting actividad
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
      // Error adding evidencia
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
      // Error adding recurso
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
      // Error getting actividades by frente
      return [];
    }
  }

  // Obtener todas las actividades del usuario
  async getActividades(): Promise<Actividad[]> {
    try {
      const user = this.directAuthService.getCurrentUser();
      if (!user) {
        // DEBUG: No hay usuario autenticado
        return [];
      }

      // DEBUG: Obteniendo actividades para usuario
      
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
        // DEBUG: Error de Supabase
        throw error;
      }
      
      // DEBUG: Datos recibidos de Supabase
    // DEBUG: Número de actividades
      
      if (data && data.length > 0) {
        // DEBUG: Primera actividad completa
      // DEBUG: ID de primera actividad
      }
      
      return data || [];
    } catch (error) {
      // DEBUG: Error en getActividades
      return [];
    }
  }

  // Obtener estadísticas de actividades
  async getActividadesStats(): Promise<any> {
    try {
      const user = await this.directAuthService.getCurrentUser();
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
      // Error getting actividades stats
      return null;
    }
  }

  // MÉTODOS CRUD PARA TAREAS

  // Crear nueva tarea
  async createTarea(tarea: any): Promise<any> {
    try {
      // Creando nueva tarea
      
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
        // Error creando tarea
        throw error;
      }

      // Tarea creada exitosamente
      return data;
    } catch (error) {
      // Error en createTarea
      throw error;
    }
  }

  // Obtener tareas por actividad
  async getTareasByActividad(actividadId: string): Promise<any[]> {
    try {
      // Obteniendo tareas para actividad
    // Tipo de actividadId
      
      const { data, error } = await this.supabase.client
        .from('tareas')
        .select('*')
        .eq('actividad_id', actividadId)
        .order('orden', { ascending: true });

      if (error) {
        // Error obteniendo tareas
        throw error;
      }

      // Tareas obtenidas
    // Datos completos
      return data || [];
    } catch (error) {
      // Error en getTareasByActividad
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
      
      // Progreso actividad calculado
      return progreso;
    } catch (error) {
      // Error calculando progreso
      return 0;
    }
  }

  // Actualizar estado de tarea
  async updateTareaEstado(tareaId: string, completada: boolean): Promise<any> {
    try {
      // Actualizando estado de tarea
      
      // Primero obtener la actividad_id de la tarea
      const { data: tarea, error: tareaError } = await this.supabase.client
        .from('tareas')
        .select('actividad_id')
        .eq('id', tareaId)
        .single();

      if (tareaError) {
        // Error obteniendo tarea
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
        // Error actualizando tarea
        throw error;
      }

      // Calcular y emitir el nuevo progreso
      const nuevoProgreso = await this.calcularProgresoActividad(tarea.actividad_id);
      this.progresoUpdatedSubject.next({
        actividadId: tarea.actividad_id,
        progreso: nuevoProgreso
      });

      // Tarea actualizada exitosamente
      return data;
    } catch (error) {
      // Error en updateTareaEstado
      throw error;
    }
  }

  // MÉTODOS CRUD PARA FRENTES

  // Crear nuevo frente
  async createFrente(frente: Omit<Frente, 'id' | 'created_at'>): Promise<Frente> {
    try {
      const user = this.directAuthService.getCurrentUser();
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
      // Error creating frente
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
      // Error updating frente
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
      // Error updating frente location
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
      // Error deleting frente
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
      // Error getting frente
      return null;
    }
  }

  // Método de debug para diagnosticar problemas de carga
  async debugUserData(): Promise<void> {
    try {
      // === INICIANDO DIAGNÓSTICO COMPLETO ===
      
      const user = this.directAuthService.getCurrentUser();
      const profile = this.directAuthService.getCurrentProfile();
      
      // Usuario actual
      
      if (!user) {
        // No hay usuario autenticado
        return;
      }

      // 1. Verificar obras asignadas
      // Verificando obras asignadas...
      const { data: userObras, error: userObrasError } = await this.supabase.client
        .from('user_obras')
        .select('*')
        .eq('user_id', user.id);
        
      // user_obras resultado
      
      // 2. Verificar todas las actividades en la base de datos
      // Verificando todas las actividades...
      const { data: allActividades, error: allActError } = await this.supabase.client
        .from('actividades')
        .select('id, tipo_actividad, obra_id, user_id, created_at, estado')
        .order('created_at', { ascending: false })
        .limit(10);
        
      // Últimas 10 actividades
      
      // 3. Si hay obras asignadas, verificar actividades específicas
      if (userObras && userObras.length > 0) {
        const obraIds = userObras.map(uo => uo.obra_id);
        // Verificando actividades para obras
        
        const { data: obraActividades, error: obraActError } = await this.supabase.client
          .from('actividades')
          .select('id, tipo_actividad, obra_id, user_id, created_at, estado')
          .in('obra_id', obraIds)
          .order('created_at', { ascending: false });
          
        // Actividades de obras asignadas
      }
      
      // === FIN DEL DIAGNÓSTICO ===
      
    } catch (error) {
      // Error en diagnóstico
    }
  }

  // Obtener obras disponibles para el usuario
  async getUserObras(): Promise<any[]> {
    try {
      // getUserObras() - Iniciando carga de obras del usuario
      
      const user = this.directAuthService.getCurrentUser();
      // Usuario actual
      
      if (!user) {
        // Usuario no autenticado
        throw new Error('Usuario no autenticado');
      }

      // Ejecutando consulta a user_obras para user_id
      
      const { data, error } = await this.supabase.client
        .from('user_obras')
        .select(`
          obra_id,
          obras(*)
        `)
        .eq('user_id', user.id);

      // Datos recibidos de user_obras
      // Error en consulta

      if (error) {
        // Error en consulta user_obras
        throw error;
      }
      
      const obras = data?.map(uo => uo.obras) || [];
      // Obras mapeadas (resultado final)
      // Cantidad de obras encontradas
      
      return obras;
    } catch (error) {
      // Error getting user obras
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