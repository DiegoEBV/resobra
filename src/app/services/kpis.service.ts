import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { DirectAuthService } from './direct-auth.service';

export interface KPI {
  id?: string;
  obra_id?: string; // Ahora opcional
  actividad_id?: string; // Nuevo campo para actividades
  fecha: string;
  avance_fisico?: number;
  productividad?: number;
  desviacion_cronograma?: number;
  calidad?: number;
  metricas_adicionales?: any;
  calculated_at?: string;
  // Nuevos campos agregados
  costo_ejecutado?: number;
  costo_presupuestado?: number;
  personal_asignado?: number;
  maquinaria_utilizada?: string;
  incidentes_seguridad?: number;
  clima_condiciones?: string;
  observaciones_tecnicas?: string;
  estado?: string;
  created_by?: string;
  updated_at?: string;
  // Relaciones
  obra?: any;
  actividad?: any; // Nueva relación con actividad
}

export interface KPIHistorial {
  id?: string;
  kpi_id: string;
  valor: number;
  fecha_registro: string;
  observaciones?: string;
  created_at?: string;
}

export interface DashboardKPIs {
  rendimiento: {
    promedio: number;
    tendencia: string;
    criticos: number;
  };
  calidad: {
    promedio: number;
    tendencia: string;
    criticos: number;
  };
  seguridad: {
    promedio: number;
    tendencia: string;
    criticos: number;
  };
  costo: {
    promedio: number;
    tendencia: string;
    criticos: number;
  };
  tiempo: {
    promedio: number;
    tendencia: string;
    criticos: number;
  };
}

export interface AlertaKPI {
  id: string;
  avance_fisico: number;
  productividad: number;
  calidad: number;
  fecha: string;
  obra_nombre?: string;
  actividad_tipo?: string;
  actividad_ubicacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KpisService {
  private kpisSubject = new BehaviorSubject<KPI[]>([]);
  public kpis$ = this.kpisSubject.asObservable();

  private dashboardKPIsSubject = new BehaviorSubject<DashboardKPIs | null>(null);
  public dashboardKPIs$ = this.dashboardKPIsSubject.asObservable();

  private alertasSubject = new BehaviorSubject<AlertaKPI[]>([]);
  public alertas$ = this.alertasSubject.asObservable();

  private isInitialized = false;

  constructor(
    private supabase: SupabaseService,
    private directAuthService: DirectAuthService
  ) {
    // No cargar datos en el constructor - esperar a que se inicialice explícitamente
    // Servicio inicializado - esperando autenticación
  }

  // Método de inicialización explícita que debe llamarse después de la autenticación
  async initialize(): Promise<void> {
    try {
      console.log('🔄 KpisService - Iniciando carga de datos...');
      
      const user = this.directAuthService.getCurrentUser();
      if (!user) {
        console.log('❌ No hay usuario autenticado - no se pueden cargar KPIs');
        return;
      }
      console.log('✅ Usuario autenticado para inicialización:', user.id);

      const token = this.directAuthService.getAccessToken();
      if (token) {
        // Configurar sesión global antes de cargar datos
        await this.supabase.setSession(token);
        console.log('✅ Sesión global configurada');
      }
      
      // Cargar datos en paralelo
      await Promise.all([
        this.loadUserKPIs(),
        this.loadDashboardKPIs(),
        this.loadAlertas()
      ]);
      
      this.isInitialized = true;
      console.log('✅ Inicialización completada');
    } catch (error: any) {
      console.error('❌ Error en inicialización:', error);
      throw error;
    }
  }

  // Verificar si el servicio está inicializado
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  // Cargar KPIs del usuario
  async loadUserKPIs(): Promise<void> {
    try {
      console.log('🔄 KpisService - Cargando KPIs del usuario...');
      
      const user = this.directAuthService.getCurrentUser();
      if (!user) {
        console.error('❌ Usuario no autenticado');
        return;
      }
      console.log('✅ Usuario autenticado:', user.id);

      // Obtener token de autenticación
      const token = this.directAuthService.getAccessToken();
      if (!token) throw new Error('Token de autenticación no disponible');
      
      // Configurar sesión si hay token disponible
      await this.supabase.setSession(token);
      console.log('✅ Sesión configurada para carga de KPIs');

      // Obtener obras asignadas al usuario
      // Obteniendo obras del usuario
      const { data: userObras, error: userObrasError } = await this.supabase.client
        .from('user_obras')
        .select('obra_id')
        .eq('user_id', user.id);

      if (userObrasError) {
        // Error obteniendo obras del usuario
        throw new Error(`Error obteniendo obras: ${userObrasError.message}`);
      }

      if (!userObras || userObras.length === 0) {
        // Usuario no tiene obras asignadas
        this.kpisSubject.next([]);
        return;
      }

      const obraIds = userObras.map(uo => uo.obra_id);
      // Obras encontradas

      // Cargar KPIs por obra
      // Cargando KPIs por obra
      const { data: kpisObra, error: errorObra } = await this.supabase.client
        .from('kpis')
        .select(`
          *,
          obra:obras(nombre)
        `)
        .in('obra_id', obraIds)
        .is('actividad_id', null);

      if (errorObra) {
        // Error cargando KPIs de obra
        throw new Error(`Error cargando KPIs de obra: ${errorObra.message}`);
      }

      // KPIs de obra cargados

      // Cargar KPIs por actividad
      // Cargando actividades de las obras
      const { data: actividades, error: actError } = await this.supabase.client
        .from('actividades')
        .select('id')
        .in('obra_id', obraIds);

      let kpisActividad: any[] = [];
      if (!actError && actividades && actividades.length > 0) {
        const actividadIds = actividades.map(a => a.id);
        // Actividades encontradas
        
        // Cargando KPIs de actividades
        const { data: kpisAct, error: errorAct } = await this.supabase.client
          .from('kpis')
          .select(`
            *,
            actividad:actividades(tipo_actividad, ubicacion)
          `)
          .in('actividad_id', actividadIds);

        if (errorAct) {
          // Error cargando KPIs de actividad
          throw new Error(`Error cargando KPIs de actividad: ${errorAct.message}`);
        }

        kpisActividad = kpisAct || [];
        // KPIs de actividad cargados
      } else {
        // No se encontraron actividades
      }

      // Combinar y procesar KPIs
      const allKPIs = [...(kpisObra || []), ...kpisActividad];
      // Total KPIs antes de filtrar duplicados
      
      // Eliminar duplicados por ID
      const uniqueKPIs = allKPIs.filter((kpi, index, self) => 
        index === self.findIndex(k => k.id === kpi.id)
      );

      // KPIs únicos procesados
      this.kpisSubject.next(uniqueKPIs);
      
    } catch (error) {
      // Error crítico en loadUserKPIs
      // Emitir array vacío en caso de error para evitar que el observable se quede colgado
      this.kpisSubject.next([]);
      throw error;
    }
  }

  // Cargar KPIs para dashboard
  private async loadDashboardKPIs(): Promise<void> {
    try {
      console.log('🔄 KpisService - Cargando KPIs para dashboard...');
      
      const user = await this.directAuthService.getCurrentUser();
      if (!user) {
        console.log('❌ No hay usuario autenticado para cargar dashboard KPIs');
        return;
      }
      console.log('✅ Usuario autenticado para dashboard:', user.id);

      // Obtener token de autenticación
      const token = this.directAuthService.getAccessToken();
      if (!token) {
        console.error('❌ Token de autenticación no disponible');
        throw new Error('Token de autenticación no disponible');
      }
      
      // Configurar sesión antes de las consultas
      await this.supabase.setSession(token);
      console.log('✅ Sesión configurada para dashboard KPIs');

      // Obtener obras asignadas al usuario
      // Obteniendo obras del usuario
      const { data: userObras, error: userObrasError } = await this.supabase.client
        .from('user_obras')
        .select('obra_id')
        .eq('user_id', user.id);

      if (userObrasError) {
        // Error obteniendo obras del usuario
        throw new Error(`Error obteniendo obras: ${userObrasError.message}`);
      }

      if (!userObras || userObras.length === 0) {
        // Usuario no tiene obras asignadas
        this.dashboardKPIsSubject.next({
          rendimiento: { promedio: 0, tendencia: 'estable', criticos: 0 },
          calidad: { promedio: 0, tendencia: 'estable', criticos: 0 },
          seguridad: { promedio: 0, tendencia: 'estable', criticos: 0 },
          costo: { promedio: 0, tendencia: 'estable', criticos: 0 },
          tiempo: { promedio: 0, tendencia: 'estable', criticos: 0 }
        });
        return;
      }

      const obraIds = userObras.map(uo => uo.obra_id);
      // Obras encontradas
      
      const fechaLimite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Consulta simplificada para dashboard
      // Cargando KPIs de obras
      const { data: kpisObra, error: errorObra } = await this.supabase.client
        .from('kpis')
        .select('avance_fisico, productividad, calidad, desviacion_cronograma')
        .in('obra_id', obraIds)
        .gte('fecha', fechaLimite);

      if (errorObra) {
        // Error cargando KPIs de obras
        throw new Error(`Error cargando KPIs de obras: ${errorObra.message}`);
      }

      // KPIs de obras cargados

      // Consulta para KPIs de actividades
      // Cargando actividades de las obras
      const { data: actividades, error: actError } = await this.supabase.client
        .from('actividades')
        .select('id')
        .in('obra_id', obraIds);

      if (actError) {
        // Error cargando actividades
        throw new Error(`Error cargando actividades: ${actError.message}`);
      }

      let kpisActividad: any[] = [];
      if (actividades && actividades.length > 0) {
        const actividadIds = actividades.map(a => a.id);
        // Actividades encontradas
        
        // Cargando KPIs de actividades
        const { data: kpisAct, error: errorAct } = await this.supabase.client
          .from('kpis')
          .select('avance_fisico, productividad, calidad, desviacion_cronograma')
          .in('actividad_id', actividadIds)
          .gte('fecha', fechaLimite);

        if (errorAct) {
          // Error cargando KPIs de actividades
          throw new Error(`Error cargando KPIs de actividades: ${errorAct.message}`);
        }

        kpisActividad = kpisAct || [];
        // KPIs de actividades cargados
      } else {
        // No se encontraron actividades
      }

      // Combinar y procesar datos
      const kpisObraArray = kpisObra || [];
      const kpisActividadArray = kpisActividad || [];
      
      // Combinar todos los KPIs
      const allKpis = [...kpisObraArray, ...kpisActividadArray];
      // Total KPIs para procesar
      
      const dashboardData = this.processDashboardKPIs(allKpis);
      // Datos procesados para dashboard
      
      this.dashboardKPIsSubject.next(dashboardData);
      
    } catch (error) {
      // Error crítico en loadDashboardKPIs
      // Emitir datos por defecto en caso de error
      this.dashboardKPIsSubject.next({
        rendimiento: { promedio: 0, tendencia: 'estable', criticos: 0 },
        calidad: { promedio: 0, tendencia: 'estable', criticos: 0 },
        seguridad: { promedio: 0, tendencia: 'estable', criticos: 0 },
        costo: { promedio: 0, tendencia: 'estable', criticos: 0 },
        tiempo: { promedio: 0, tendencia: 'estable', criticos: 0 }
      });
      throw error;
    }
  }

  // Procesar datos para dashboard
  private processDashboardKPIs(kpis: any[]): DashboardKPIs {
    const dashboard: any = {};

    if (kpis.length > 0) {
      // Calcular promedios de los KPIs disponibles
      const promedioAvance = kpis.reduce((sum, k) => sum + (k.avance_fisico || 0), 0) / kpis.length;
      const promedioProductividad = kpis.reduce((sum, k) => sum + (k.productividad || 0), 0) / kpis.length;
      const promedioCalidad = kpis.reduce((sum, k) => sum + (k.calidad || 0), 0) / kpis.length;
      
      // Simular tendencias basadas en valores recientes vs anteriores
      const tendencia = 'estable'; // Por simplicidad, se puede mejorar con lógica temporal
      
      dashboard.rendimiento = {
        promedio: Math.round(promedioAvance),
        tendencia,
        criticos: kpis.filter(k => (k.avance_fisico || 0) < 50).length
      };
      
      dashboard.calidad = {
        promedio: Math.round(promedioCalidad),
        tendencia,
        criticos: kpis.filter(k => (k.calidad || 0) < 70).length
      };
      
      dashboard.seguridad = {
        promedio: 85, // Valor por defecto
        tendencia,
        criticos: 0
      };
      
      dashboard.costo = {
        promedio: 80, // Valor por defecto
        tendencia,
        criticos: 0
      };
      
      dashboard.tiempo = {
        promedio: Math.round(100 - Math.abs(kpis.reduce((sum, k) => sum + (k.desviacion_cronograma || 0), 0) / kpis.length)),
        tendencia,
        criticos: kpis.filter(k => Math.abs(k.desviacion_cronograma || 0) > 10).length
      };
    } else {
      // Valores por defecto cuando no hay datos
      dashboard.rendimiento = { promedio: 0, tendencia: 'estable', criticos: 0 };
      dashboard.calidad = { promedio: 0, tendencia: 'estable', criticos: 0 };
      dashboard.seguridad = { promedio: 0, tendencia: 'estable', criticos: 0 };
      dashboard.costo = { promedio: 0, tendencia: 'estable', criticos: 0 };
      dashboard.tiempo = { promedio: 0, tendencia: 'estable', criticos: 0 };
    }

    return dashboard;
  }

  // Cargar alertas
  private async loadAlertas(): Promise<void> {
    try {
      console.log('🔄 KpisService - Cargando alertas...');
      
      const user = await this.directAuthService.getCurrentUser();
      if (!user) {
        console.log('❌ No hay usuario autenticado para cargar alertas');
        return;
      }
      console.log('✅ Usuario autenticado para alertas:', user.id);

      // Obtener token de autenticación
      const token = this.directAuthService.getAccessToken();
      if (!token) {
        console.error('❌ Token de autenticación no disponible');
        throw new Error('Token de autenticación no disponible');
      }
      
      // Configurar sesión antes de las consultas
      await this.supabase.setSession(token);
      console.log('✅ Sesión configurada para alertas');

      // Obtener obras asignadas al usuario
      // Obteniendo obras del usuario para alertas
      const { data: userObras, error: userObrasError } = await this.supabase.client
        .from('user_obras')
        .select('obra_id')
        .eq('user_id', user.id);

      if (userObrasError) {
        // Error obteniendo obras para alertas
        throw new Error(`Error obteniendo obras para alertas: ${userObrasError.message}`);
      }

      if (!userObras || userObras.length === 0) {
        // Usuario no tiene obras asignadas - no hay alertas
        this.alertasSubject.next([]);
        return;
      }

      const obraIds = userObras.map(uo => uo.obra_id);
      // Obras para alertas encontradas
      
      // Consulta simplificada para alertas
      // Cargando KPIs para alertas
      const { data: kpisObra, error: errorObra } = await this.supabase.client
        .from('kpis')
        .select(`
          id,
          avance_fisico,
          productividad,
          calidad,
          fecha,
          obra:obras(nombre)
        `)
        .in('obra_id', obraIds)
        .order('fecha', { ascending: false })
        .limit(5);

      if (errorObra) {
        // Error cargando KPIs de obras para alertas
        throw new Error(`Error cargando KPIs de obras para alertas: ${errorObra.message}`);
      }

      // KPIs de obras para alertas cargados

      // Consulta para KPIs de actividades
      // Cargando actividades para alertas
      const { data: actividades, error: actError } = await this.supabase.client
        .from('actividades')
        .select('id')
        .in('obra_id', obraIds);

      let kpisActividad: any[] = [];
      if (!actError && actividades && actividades.length > 0) {
        const actividadIds = actividades.map(a => a.id);
        // Actividades para alertas encontradas
        
        // Cargando KPIs de actividades para alertas
        const { data: kpisAct, error: errorAct } = await this.supabase.client
          .from('kpis')
          .select(`
            id,
            avance_fisico,
            productividad,
            calidad,
            fecha,
            actividad:actividades(tipo_actividad, ubicacion)
          `)
          .in('actividad_id', actividadIds)
          .order('fecha', { ascending: false })
          .limit(5);

        if (!errorAct) {
          kpisActividad = kpisAct || [];
          // KPIs de actividades para alertas cargados
        } else {
          // Error cargando KPIs de actividades para alertas
        }
      } else {
        // No se encontraron actividades para alertas
      }

      // Combinar y procesar alertas
      const allKpis = [...(kpisObra || []), ...kpisActividad];
      // Total KPIs para alertas
      
      const alertas = allKpis.map((kpi: any) => ({
        id: kpi.id,
        avance_fisico: kpi.avance_fisico,
        productividad: kpi.productividad,
        calidad: kpi.calidad,
        fecha: kpi.fecha,
        obra_nombre: kpi.obra?.nombre || 'Sin asignar',
        actividad_tipo: kpi.actividad?.tipo_actividad || null,
        actividad_ubicacion: kpi.actividad?.ubicacion || null
      }));

      // Alertas procesadas
      this.alertasSubject.next(alertas.slice(0, 10));
      
    } catch (error) {
      // Error crítico en loadAlertas
      // Emitir array vacío en caso de error
      this.alertasSubject.next([]);
      throw error;
    }
  }

  // Crear nuevo KPI
  async createKPI(kpi: Omit<KPI, 'id' | 'calculated_at'>): Promise<KPI> {
    try {
      console.log('🔄 KpisService - Iniciando creación de KPI...');
      
      const user = this.directAuthService.getCurrentUser();
      if (!user) {
        console.error('❌ Usuario no autenticado');
        throw new Error('Usuario no autenticado');
      }
      console.log('✅ Usuario autenticado:', user.id);

      const token = this.directAuthService.getAccessToken();
      if (!token) {
        console.error('❌ Token de autenticación no disponible');
        throw new Error('Token de autenticación no disponible');
      }
      console.log('✅ Token disponible:', token.substring(0, 20) + '...');

      // CRÍTICO: Configurar la sesión en el cliente Supabase antes de la petición
      console.log('🔧 Configurando sesión en cliente Supabase...');
      await this.supabase.setSession(token);
      console.log('✅ Sesión configurada');

      const kpiData = {
        ...kpi,
        calculated_at: new Date().toISOString(),
        created_by: user.id
      };
      
      console.log('📤 Enviando datos KPI:', kpiData);
      
      const { data, error } = await this.supabase.client
        .from('kpis')
        .insert([kpiData])
        .select(`
          *,
          obra:obras(id, nombre),
          actividad:actividades(id, tipo_actividad, ubicacion, responsable)
        `)
        .single();

      if (error) {
        console.error('❌ Error en inserción:', error);
        throw error;
      }
      
      console.log('✅ KPI creado exitosamente:', data);

      // Actualizar listas locales
      await this.refresh();
      
      return data;
    } catch (error: any) {
      console.error('❌ Error creating KPI:', error);
      throw error;
    }
  }

  // Actualizar KPI
  async updateKPI(id: string, updates: Partial<KPI>): Promise<KPI> {
    try {
      console.log('🔄 KpisService - Actualizando KPI:', id);
      
      const token = this.directAuthService.getAccessToken();
      if (!token) {
        console.error('❌ Token de autenticación no disponible');
        throw new Error('Token de autenticación no disponible');
      }

      // Configurar sesión antes de la petición
      await this.supabase.setSession(token);

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      console.log('📤 Actualizando con datos:', updateData);

      const { data, error } = await this.supabase.client
        .from('kpis')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          obra:obras(id, nombre),
          actividad:actividades(id, tipo_actividad, ubicacion, responsable)
        `)
        .single();

      if (error) {
        console.error('❌ Error actualizando KPI:', error);
        throw error;
      }
      
      console.log('✅ KPI actualizado exitosamente:', data);

      // Registrar en historial si hay cambios en métricas
      if (updates.avance_fisico !== undefined) {
        await this.addKPIHistorial(id, updates.avance_fisico, 'Avance físico actualizado');
      }

      // Actualizar listas locales
      await this.refresh();
      
      return data;
    } catch (error) {
      // Error updating KPI
      throw error;
    }
  }

  // Eliminar KPI
  async deleteKPI(id: string): Promise<void> {
    try {
      console.log('🔄 KpisService - Eliminando KPI:', id);
      
      // Validar que el ID no esté vacío o sea inválido
      if (!id || typeof id !== 'string' || id.trim() === '') {
        console.error('❌ ID de KPI inválido o vacío');
        throw new Error('ID de KPI inválido o vacío');
      }

      // Eliminando KPI con ID
      
      // Verificar que el KPI existe antes de intentar eliminarlo
      const token = this.directAuthService.getAccessToken();
      if (!token) {
        console.error('❌ Token de autenticación no disponible');
        throw new Error('Token de autenticación no disponible');
      }

      // Configurar sesión antes de la petición
      await this.supabase.setSession(token);

      const { data: existingKPI, error: checkError } = await this.supabase.client
        .from('kpis')
        .select('id, obra_id, actividad_id, created_by')
        .eq('id', id.trim())
        .single();

      if (checkError) {
        console.error('❌ Error verificando KPI:', checkError);
        if (checkError.code === 'PGRST116') {
          throw new Error('KPI no encontrado - puede haber sido eliminado previamente');
        }
        throw new Error(`No se pudo verificar el KPI: ${checkError.message}`);
      }

      if (!existingKPI) {
        console.error('❌ El KPI no existe o ya fue eliminado');
        throw new Error('El KPI no existe o ya fue eliminado');
      }

      console.log('✅ KPI encontrado:', existingKPI.id);

      // Verificar permisos del usuario
      const user = await this.directAuthService.getCurrentUser();
      if (!user) {
        console.error('❌ Usuario no autenticado');
        throw new Error('Usuario no autenticado');
      }

      console.log('✅ Usuario autenticado:', user.id);

      // Intentar eliminar el KPI
      const { error } = await this.supabase.client
        .from('kpis')
        .delete()
        .eq('id', id.trim());

      if (error) {
        console.error('❌ Error en eliminación:', error);
        if (error.code === '42501') {
          throw new Error('No tiene permisos para eliminar este KPI');
        }
        throw new Error(`Error al eliminar KPI: ${error.message}`);
      }

      console.log('✅ KPI eliminado exitosamente');

      // Actualizar listas locales
      await this.refresh();
    } catch (error: any) {
      console.error('❌ Error deleting KPI:', error);
      throw error;
    }
  }

  // Agregar registro al historial de KPI
  private async addKPIHistorial(kpiId: string, valor: number, observaciones?: string): Promise<void> {
    try {
      const token = this.directAuthService.getAccessToken();
      if (!token) throw new Error('Token de autenticación no disponible');

      const historialData = {
        kpi_id: kpiId,
        valor,
        fecha_registro: new Date().toISOString(),
        observaciones
      };

      const { error } = await this.supabase.client
        .from('kpi_historial')
        .insert([historialData]);

      if (error) throw error;
    } catch (error) {
      // Error adding KPI historial
    }
  }

  // Obtener historial de KPI
  async getKPIHistorial(kpiId: string, limite: number = 30): Promise<KPIHistorial[]> {
    try {
      const token = this.directAuthService.getAccessToken();
      if (!token) throw new Error('Token de autenticación no disponible');

      const { data, error } = await this.supabase.client
        .from('kpi_historial')
        .select('*')
        .eq('kpi_id', kpiId)
        .order('fecha_registro', { ascending: false })
        .limit(limite);

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Error getting KPI historial
      return [];
    }
  }

  // Obtener KPIs por tipo
  async getKPIsByTipo(tipo: string): Promise<KPI[]> {
    try {
      const user = await this.directAuthService.getCurrentUser();
      if (!user) return [];

      const token = this.directAuthService.getAccessToken();
      if (!token) throw new Error('Token de autenticación no disponible');

      // Obtener obras asignadas al usuario
      const { data: userObras, error: userObrasError } = await this.supabase.client
        .from('user_obras')
        .select('obra_id')
        .eq('user_id', user.id);

      if (userObrasError) throw userObrasError;

      if (userObras && userObras.length > 0) {
        const obraIds = userObras.map(uo => uo.obra_id);
        
        // Consulta simplificada
        const { data, error } = await this.supabase.client
          .from('kpis')
          .select(`
            *,
            obra:obras(id, nombre),
            actividad:actividades(id, tipo_actividad, ubicacion, responsable)
          `)
          .in('obra_id', obraIds)
          .order('fecha', { ascending: false });

        if (error) throw error;
        return data || [];
      }
      return [];
    } catch (error) {
      // Error getting KPIs by tipo
      return [];
    }
  }

  // Obtener estadísticas generales
  async getEstadisticasGenerales(): Promise<any> {
    try {
      const user = await this.directAuthService.getCurrentUser();
      if (!user) return null;

      const token = this.directAuthService.getAccessToken();
      if (!token) throw new Error('Token de autenticación no disponible');

      // Obtener obras asignadas al usuario
      const { data: userObras, error: userObrasError } = await this.supabase.client
        .from('user_obras')
        .select('obra_id')
        .eq('user_id', user.id);

      if (userObrasError) throw userObrasError;

      if (userObras && userObras.length > 0) {
        const obraIds = userObras.map(uo => uo.obra_id);
        
        const { data, error } = await this.supabase.client
          .from('kpis')
          .select('avance_fisico, productividad, calidad, desviacion_cronograma')
          .in('obra_id', obraIds);

        if (error) throw error;

        const stats = {
          total: data?.length || 0,
          avance_fisico_promedio: data?.length ? 
            data.reduce((sum, k) => sum + (k.avance_fisico || 0), 0) / data.length : 0,
          productividad_promedio: data?.length ? 
            data.reduce((sum, k) => sum + (k.productividad || 0), 0) / data.length : 0,
          calidad_promedio: data?.length ? 
            data.reduce((sum, k) => sum + (k.calidad || 0), 0) / data.length : 0,
          desviacion_cronograma_promedio: data?.length ? 
            data.reduce((sum, k) => sum + (k.desviacion_cronograma || 0), 0) / data.length : 0
        };

        return stats;
      }
      return null;
    } catch (error) {
      // Error getting estadísticas generales
      return null;
    }
  }

  // Calcular KPIs automáticamente basándose en datos de obras
  async calculateAutomaticKPIs(obraId: string): Promise<void> {
    try {
      // Calculando KPIs automáticos para obra
      
      const token = this.directAuthService.getAccessToken();
      if (!token) throw new Error('Token de autenticación no disponible');
      
      // Obtener actividades de la obra
      const { data: actividades, error: actError } = await this.supabase.client
        .from('actividades')
        .select('*')
        .eq('obra_id', obraId);

      if (actError) throw actError;

      if (actividades && actividades.length > 0) {
        // Calcular métricas automáticas
        const actividadesCompletadas = actividades.filter(a => a.estado === 'finalizado').length;
        const totalActividades = actividades.length;
        const avanceFisico = totalActividades > 0 ? Math.round((actividadesCompletadas / totalActividades) * 100) : 0;
        
        // Calcular productividad basada en progreso promedio
        const progresoPromedio = actividades.reduce((sum, a) => sum + (a.progreso_porcentaje || 0), 0) / totalActividades;
        const productividad = Math.round(progresoPromedio);
        
        // Calcular calidad basada en evaluaciones (simulado por ahora)
        const calidad = Math.min(100, Math.max(70, productividad + Math.random() * 20 - 10));
        
        // Verificar si ya existe un KPI para esta obra hoy
        const hoy = new Date().toISOString().split('T')[0];
        const { data: existingKPI } = await this.supabase.client
          .from('kpis')
          .select('id')
          .eq('obra_id', obraId)
          .gte('fecha', hoy)
          .lt('fecha', `${hoy}T23:59:59`)
          .single();

        const kpiData = {
          obra_id: obraId,
          fecha: new Date().toISOString(),
          avance_fisico: avanceFisico,
          productividad: productividad,
          calidad: Math.round(calidad),
          desviacion_cronograma: 0, // Se puede calcular comparando fechas planificadas vs reales
          calculated_at: new Date().toISOString()
        };

        if (existingKPI) {
          // Actualizar KPI existente
          await this.updateKPI(existingKPI.id, kpiData);
          // KPI automático actualizado para obra
        } else {
          // Crear nuevo KPI
          await this.createKPI(kpiData);
          // KPI automático creado para obra
        }
      } else {
        // No hay actividades para calcular KPIs en obra
      }
    } catch (error) {
      // Error calculando KPIs automáticos
    }
  }

  // Calcular KPIs para todas las obras del usuario
  async calculateAllAutomaticKPIs(): Promise<void> {
    try {
      const user = await this.directAuthService.getCurrentUser();
      if (!user) return;

      const token = this.directAuthService.getAccessToken();
      if (!token) throw new Error('Token de autenticación no disponible');

      // Obtener obras asignadas al usuario
      const { data: userObras, error: userObrasError } = await this.supabase.client
        .from('user_obras')
        .select('obra_id')
        .eq('user_id', user.id);

      if (userObrasError) throw userObrasError;

      if (userObras && userObras.length > 0) {
        // Calculando KPIs automáticos
        
        // Calcular KPIs para cada obra
        for (const userObra of userObras) {
          await this.calculateAutomaticKPIs(userObra.obra_id);
        }
        
        // Refrescar datos después del cálculo
        await this.refresh();
        // KPIs automáticos calculados para todas las obras
      }
    } catch (error) {
      // Error calculando KPIs automáticos para todas las obras
    }
  }

  // Obtener actividades de una obra para selección en formulario
  async getActividadesByObra(obraId: string): Promise<any[]> {
    try {
      const token = this.directAuthService.getAccessToken();
      if (!token) throw new Error('Token de autenticación no disponible');

      const { data, error } = await this.supabase.client
        .from('actividades')
        .select('id, tipo_actividad, ubicacion, responsable, estado')
        .eq('obra_id', obraId)
        .order('fecha', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Error getting actividades by obra
      return [];
    }
  }

  // Obtener KPIs específicos de una actividad
  async getKPIsByActividad(actividadId: string): Promise<KPI[]> {
    try {
      const token = this.directAuthService.getAccessToken();
      if (!token) throw new Error('Token de autenticación no disponible');

      const { data, error } = await this.supabase.client
        .from('kpis')
        .select(`
          *,
          obra:obras(id, nombre),
          actividad:actividades(id, tipo_actividad, ubicacion, responsable)
        `)
        .eq('actividad_id', actividadId)
        .order('fecha', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Error getting KPIs by actividad
      return [];
    }
  }

  // Calcular KPIs automáticamente para una actividad específica
  async calculateAutomaticKPIsForActividad(actividadId: string): Promise<void> {
    try {
      // Calculando KPIs automáticos para actividad
      
      const token = this.directAuthService.getAccessToken();
      if (!token) throw new Error('Token de autenticación no disponible');
      
      // Obtener datos de la actividad
      const { data: actividad, error: actError } = await this.supabase.client
        .from('actividades')
        .select('*')
        .eq('id', actividadId)
        .single();

      if (actError) throw actError;

      if (actividad) {
        // Calcular métricas automáticas basadas en la actividad
        const avanceFisico = actividad.progreso_porcentaje || 0;
        const productividad = this.calculateProductividadFromActividad(actividad);
        const calidad = this.calculateCalidadFromActividad(actividad);
        
        // Verificar si ya existe un KPI para esta actividad hoy
        const hoy = new Date().toISOString().split('T')[0];
        const { data: existingKPI } = await this.supabase.client
          .from('kpis')
          .select('id')
          .eq('actividad_id', actividadId)
          .gte('fecha', hoy)
          .lt('fecha', `${hoy}T23:59:59`)
          .single();

        const kpiData = {
          actividad_id: actividadId,
          fecha: new Date().toISOString(),
          avance_fisico: avanceFisico,
          productividad: productividad,
          calidad: calidad,
          desviacion_cronograma: this.calculateDesviacionFromActividad(actividad),
          calculated_at: new Date().toISOString()
        };

        if (existingKPI) {
          // Actualizar KPI existente
          await this.updateKPI(existingKPI.id, kpiData);
          // KPI automático actualizado para actividad
        } else {
          // Crear nuevo KPI
          await this.createKPI(kpiData);
          // KPI automático creado para actividad
        }
      }
    } catch (error) {
      // Error calculando KPIs automáticos para actividad
    }
  }

  // Métodos auxiliares para cálculo de métricas por actividad
  private calculateProductividadFromActividad(actividad: any): number {
    // Lógica para calcular productividad basada en datos de la actividad
    const baseProductividad = actividad.progreso_porcentaje || 0;
    const tiempoFactor = actividad.estado === 'finalizado' ? 1.1 : 0.9;
    return Math.min(100, Math.round(baseProductividad * tiempoFactor));
  }

  private calculateCalidadFromActividad(actividad: any): number {
    // Lógica para calcular calidad basada en datos de la actividad
    const baseCalidad = 80; // Valor base
    const estadoFactor = actividad.estado === 'finalizado' ? 1.2 : 1.0;
    return Math.min(100, Math.round(baseCalidad * estadoFactor));
  }

  private calculateDesviacionFromActividad(actividad: any): number {
    // Lógica para calcular desviación de cronograma
    // Por ahora retorna 0, se puede implementar comparando fechas planificadas vs reales
    return 0;
  }

  // Refrescar todos los datos
  async refresh(): Promise<void> {
    try {
      console.log('🔄 Iniciando refresh de datos KPI');
      
      const user = await this.directAuthService.getCurrentUser();
      if (!user) {
        console.error('❌ Usuario no autenticado para refresh');
        return;
      }

      const token = this.directAuthService.getAccessToken();
      if (!token) {
        console.error('❌ Token no disponible para refresh');
        return;
      }

      console.log('🔐 Configurando sesión Supabase para refresh');
      await this.supabase.setSession(token);

      await Promise.all([
        this.loadUserKPIs(),
        this.loadDashboardKPIs(),
        this.loadAlertas()
      ]);
      
      console.log('✅ Refresh de datos KPI completado');
    } catch (error) {
      console.error('❌ Error en refresh de datos KPI:', error);
      throw error;
    }
  }
}