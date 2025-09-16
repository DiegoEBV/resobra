import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
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
      console.log('📡 [ActividadesService] Emitiendo actividades:', {
        count: actividades.length,
        data: actividades
      });
    })
  );

  private frentesSubject = new BehaviorSubject<Frente[]>([]);
  public frentes$ = this.frentesSubject.asObservable().pipe(
    tap(frentes => {
      console.log('📡 [ActividadesService] Emitiendo frentes:', {
        count: frentes.length,
        data: frentes
      });
    })
  );
  private progresoUpdatedSubject = new Subject<{actividadId: string, progreso: number}>();
  public progresoUpdated$ = this.progresoUpdatedSubject.asObservable();
  
  // Suscripciones en tiempo real
  private actividadesChannel: RealtimeChannel | null = null;
  private frentesChannel: RealtimeChannel | null = null;

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {
    console.log('🏗️ [ActividadesService] Constructor iniciado');
    
    // Escuchar cambios en la autenticación
    this.authService.currentUser$.subscribe({
      next: (user) => {
        console.log('👤 [ActividadesService] Estado de autenticación cambió:', {
          authenticated: !!user,
          userId: user?.id,
          email: user?.email
        });
        
        if (user) {
          console.log('✅ [ActividadesService] Usuario autenticado, cargando datos...');
          this.loadUserActividades().catch(error => {
            console.error('❌ [ActividadesService] Error cargando actividades:', error);
          });
          this.loadUserFrente().catch(error => {
            console.error('❌ [ActividadesService] Error cargando frentes:', error);
          });
          this.setupRealtimeSubscriptions();
        } else {
          console.log('❌ [ActividadesService] Usuario no autenticado, limpiando datos');
          this.actividadesSubject.next([]);
          this.frentesSubject.next([]);
          this.cleanupRealtimeSubscriptions();
        }
      },
      error: (error) => {
        console.error('❌ [ActividadesService] Error en suscripción de autenticación:', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanupRealtimeSubscriptions();
  }

  // Configurar suscripciones en tiempo real
  private setupRealtimeSubscriptions(): void {
    console.log('🔄 [ActividadesService] Configurando suscripciones en tiempo real');
    
    // Limpiar suscripciones existentes
    this.cleanupRealtimeSubscriptions();
    
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.log('❌ [ActividadesService] No hay usuario para configurar suscripciones');
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
          console.log('🔄 [ActividadesService] Cambio en actividades:', payload);
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
          console.log('🔄 [ActividadesService] Cambio en frentes:', payload);
          this.handleFrenteChange(payload);
        }
      )
      .subscribe();

    console.log('✅ [ActividadesService] Suscripciones en tiempo real configuradas');
  }

  // Limpiar suscripciones en tiempo real
  private cleanupRealtimeSubscriptions(): void {
    console.log('🧹 [ActividadesService] Limpiando suscripciones en tiempo real');
    
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
    const user = this.authService.getCurrentUser();
    if (!user) return;

    console.log('🔄 [ActividadesService] Procesando cambio en actividad:', payload.eventType);
    
    // Verificar si el cambio es relevante para el usuario actual
    const isRelevant = await this.isActividadRelevantForUser(payload, user.id);
    
    if (isRelevant) {
      console.log('✅ [ActividadesService] Cambio relevante, recargando actividades');
      await this.loadUserActividades();
    } else {
      console.log('⏭️ [ActividadesService] Cambio no relevante para el usuario actual');
    }
  }

  // Manejar cambios en frentes
  private async handleFrenteChange(payload: any): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    console.log('🔄 [ActividadesService] Procesando cambio en frente:', payload.eventType);
    
    // Verificar si el cambio es relevante para el usuario actual
    const isRelevant = await this.isFrenteRelevantForUser(payload, user.id);
    
    if (isRelevant) {
      console.log('✅ [ActividadesService] Cambio relevante, recargando frentes');
      await this.loadUserFrente();
    } else {
      console.log('⏭️ [ActividadesService] Cambio no relevante para el usuario actual');
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
      console.error('Error verificando relevancia de actividad:', error);
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
      console.error('Error verificando relevancia del frente:', error);
      return false;
    }
  }

  // Cargar actividades del usuario
  async loadUserActividades(): Promise<void> {
    console.log('🚀 [SERVICE] ===== INICIANDO loadUserActividades =====');
    try {
      console.log('🔍 [SERVICE] Verificando usuario autenticado...');
      const user = this.authService.getCurrentUser();
      console.log('👤 [SERVICE] Usuario obtenido:', user);
      
      if (!user) {
        console.log('❌ [SERVICE] No hay usuario autenticado para cargar actividades');
        console.log('🔍 [SERVICE] AuthService estado:', this.authService);
        return;
      }

      console.log('🔍 [DEBUG] Usuario actual:', {
        id: user.id,
        email: user.email,
        rol: this.authService.getCurrentProfile()?.rol
      });

      console.log('🔗 [DEBUG] Estado de conexión Supabase:', {
        client: !!this.supabase.client,
        connected: this.supabase.client ? 'Conectado' : 'Desconectado'
      });

      let data, error;

      // Verificar el rol del usuario para aplicar filtros diferentes
      // Cargar todas las actividades para ambos roles (residente y logística)
      // Esto permite que ambos usuarios vean todas las actividades del sistema
      console.log('👥 [DEBUG] Cargando todas las actividades para usuario:', this.authService.isResident() ? 'residente' : 'logística');
      
      console.log('📡 [DEBUG] Ejecutando consulta a Supabase...');
      
      // Primero intentar una consulta simple sin joins
      console.log('🔍 [DEBUG] Probando consulta simple sin joins...');
      const simpleResult = await this.supabase.client
        .from('actividades')
        .select('*')
        .limit(10);
        
      console.log('📊 [DEBUG] Resultado consulta simple:', simpleResult);
      console.log('📊 [DEBUG] Datos simples:', simpleResult.data);
      console.log('📊 [DEBUG] Error simple:', simpleResult.error);
      console.log('📊 [DEBUG] Count simple:', simpleResult.data?.length || 0);
      
      // Ahora la consulta completa
      console.log('📡 [DEBUG] Ejecutando consulta completa con joins...');
      const result = await this.supabase.client
        .from('actividades')
        .select(`
          *,
          frente:frentes(*),
          evidencias(*),
          recursos(*)
        `)
        .order('created_at', { ascending: false });
        
      console.log('📊 [DEBUG] Resultado completo de actividades:', result);
      console.log('📊 [DEBUG] Datos:', result.data);
      console.log('📊 [DEBUG] Error:', result.error);
      console.log('📊 [DEBUG] Status:', result.status);
      console.log('📊 [DEBUG] StatusText:', result.statusText);
      
      // Verificar si hay diferencia entre consulta simple y completa
       if (simpleResult.data && simpleResult.data.length > 0 && (!result.data || result.data.length === 0)) {
         console.log('⚠️ [DEBUG] La consulta simple tiene datos pero la completa no. Usando datos simples.');
         data = simpleResult.data;
         error = simpleResult.error;
       } else {
         data = result.data;
         error = result.error;
       }

      if (error) {
        console.error('❌ [DEBUG] Error en consulta Supabase:', error);
        throw error;
      }
      
      // Debug: Verificar los datos que llegan de Supabase
      console.log('🔍 [ActividadesService] Datos recibidos de Supabase:', data);
      console.log('🔍 [ActividadesService] Tipo de datos:', typeof data);
      console.log('🔍 [ActividadesService] Es array:', Array.isArray(data));
      console.log('🔍 [ActividadesService] Longitud:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('🔍 [ActividadesService] Primera actividad:', data[0]);
        console.log('🔍 [ActividadesService] ID de primera actividad:', data[0].id);
        console.log('🔍 [ActividadesService] Claves de primera actividad:', Object.keys(data[0]));
      } else {
        console.log('⚠️ [ActividadesService] No se encontraron actividades en la base de datos');
      }
      
      console.log('📤 [DEBUG] Enviando datos al BehaviorSubject...');
      this.actividadesSubject.next(data || []);
      console.log('✅ [DEBUG] Datos enviados al BehaviorSubject');
      
      // Verificar el estado actual del BehaviorSubject
      const currentValue = this.actividadesSubject.value;
      console.log('🔍 [DEBUG] Valor actual del BehaviorSubject:', currentValue);
      console.log('🔍 [DEBUG] Longitud del BehaviorSubject:', currentValue.length);
      
    } catch (error: any) {
      console.error('❌ [DEBUG] Error completo en loadUserActividades:', error);
      console.error('❌ [DEBUG] Stack trace:', error?.stack || 'No stack trace available');
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

      // Cargar todos los frentes activos para ambos usuarios (residente y logística)
      const { data, error } = await this.supabase.client
        .from('frentes')
        .select('*')
        .eq('estado', 'activo')
        .order('nombre');

      if (error) {
        console.error('Error obteniendo frentes:', error);
        throw error;
      }
      
      console.log('Frentes encontrados:', data);
      this.frentesSubject.next(data || []);
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

  // Método de debug para diagnosticar problemas de carga
  async debugUserData(): Promise<void> {
    try {
      console.log('🔧 [DEBUG] === INICIANDO DIAGNÓSTICO COMPLETO ===');
      
      const user = this.authService.getCurrentUser();
      const profile = this.authService.getCurrentProfile();
      
      console.log('👤 [DEBUG] Usuario actual:', {
        user: user ? { id: user.id, email: user.email } : 'No autenticado',
        profile: profile ? { id: profile.id, nombre: profile.nombre, rol: profile.rol } : 'No profile'
      });
      
      if (!user) {
        console.error('❌ [DEBUG] No hay usuario autenticado');
        return;
      }

      // 1. Verificar obras asignadas
      console.log('🔍 [DEBUG] 1. Verificando obras asignadas...');
      const { data: userObras, error: userObrasError } = await this.supabase.client
        .from('user_obras')
        .select('*')
        .eq('user_id', user.id);
        
      console.log('📊 [DEBUG] user_obras resultado:', { userObras, userObrasError });
      
      // 2. Verificar todas las actividades en la base de datos
      console.log('🔍 [DEBUG] 2. Verificando todas las actividades...');
      const { data: allActividades, error: allActError } = await this.supabase.client
        .from('actividades')
        .select('id, tipo_actividad, obra_id, user_id, created_at, estado')
        .order('created_at', { ascending: false })
        .limit(10);
        
      console.log('📊 [DEBUG] Últimas 10 actividades:', { allActividades, allActError });
      
      // 3. Si hay obras asignadas, verificar actividades específicas
      if (userObras && userObras.length > 0) {
        const obraIds = userObras.map(uo => uo.obra_id);
        console.log('🔍 [DEBUG] 3. Verificando actividades para obras:', obraIds);
        
        const { data: obraActividades, error: obraActError } = await this.supabase.client
          .from('actividades')
          .select('id, tipo_actividad, obra_id, user_id, created_at, estado')
          .in('obra_id', obraIds)
          .order('created_at', { ascending: false });
          
        console.log('📊 [DEBUG] Actividades de obras asignadas:', { obraActividades, obraActError });
      }
      
      console.log('🔧 [DEBUG] === FIN DEL DIAGNÓSTICO ===');
      
    } catch (error) {
      console.error('❌ [DEBUG] Error en diagnóstico:', error);
    }
  }

  // Obtener obras disponibles para el usuario
  async getUserObras(): Promise<any[]> {
    try {
      console.log('🔍 [ActividadesService] getUserObras() - Iniciando carga de obras del usuario');
      
      const user = this.authService.getCurrentUser();
      console.log('👤 [ActividadesService] Usuario actual:', user ? { id: user.id, email: user.email } : 'No autenticado');
      
      if (!user) {
        console.error('❌ [ActividadesService] Usuario no autenticado');
        throw new Error('Usuario no autenticado');
      }

      console.log('🔍 [ActividadesService] Ejecutando consulta a user_obras para user_id:', user.id);
      
      const { data, error } = await this.supabase.client
        .from('user_obras')
        .select(`
          obra_id,
          obras(*)
        `)
        .eq('user_id', user.id);

      console.log('📊 [ActividadesService] Datos recibidos de user_obras:', data);
      console.log('⚠️ [ActividadesService] Error en consulta:', error);

      if (error) {
        console.error('❌ [ActividadesService] Error en consulta user_obras:', error);
        throw error;
      }
      
      const obras = data?.map(uo => uo.obras) || [];
      console.log('🏗️ [ActividadesService] Obras mapeadas (resultado final):', obras);
      console.log('📈 [ActividadesService] Cantidad de obras encontradas:', obras.length);
      
      return obras;
    } catch (error) {
      console.error('❌ [ActividadesService] Error getting user obras:', error);
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