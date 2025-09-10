import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface KPI {
  id?: string;
  obra_id: string;
  fecha: string;
  avance_fisico?: number;
  productividad?: number;
  desviacion_cronograma?: number;
  calidad?: number;
  metricas_adicionales?: any;
  calculated_at?: string;
  // Relaciones
  obra?: any;
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

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {
    this.loadUserKPIs();
    this.loadDashboardKPIs();
    this.loadAlertas();
  }

  // Cargar KPIs del usuario
  private async loadUserKPIs(): Promise<void> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) return;

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
          .select(`
            *,
            obra:obras(id, nombre)
          `)
          .in('obra_id', obraIds)
          .order('fecha', { ascending: false });

        if (error) throw error;
        this.kpisSubject.next(data || []);
      }
    } catch (error) {
      console.error('Error loading KPIs:', error);
    }
  }

  // Cargar KPIs para dashboard
  private async loadDashboardKPIs(): Promise<void> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) return;

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
          .select('avance_fisico, productividad, calidad')
          .in('obra_id', obraIds)
          .gte('fecha', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Últimos 30 días

        if (error) throw error;

        const dashboardData = this.processDashboardKPIs(data || []);
        this.dashboardKPIsSubject.next(dashboardData);
      }
    } catch (error) {
      console.error('Error loading dashboard KPIs:', error);
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
      const user = await this.authService.getCurrentUser();
      if (!user) return;

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
          .limit(10);

        if (error) throw error;

        const alertas = (data || []).map((kpi: any) => ({
          id: kpi.id,
          avance_fisico: kpi.avance_fisico,
          productividad: kpi.productividad,
          calidad: kpi.calidad,
          fecha: kpi.fecha,
          obra_nombre: kpi.obra?.nombre || 'Sin asignar'
        }));

        this.alertasSubject.next(alertas);
      }
    } catch (error) {
      console.error('Error loading alertas:', error);
    }
  }

  // Crear nuevo KPI
  async createKPI(kpi: Omit<KPI, 'id' | 'calculated_at'>): Promise<KPI> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      const kpiData = {
        ...kpi,
        calculated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase.client
        .from('kpis')
        .insert([kpiData])
        .select(`
          *,
          obra:obras(id, nombre)
        `)
        .single();

      if (error) throw error;

      // Actualizar listas locales
      await this.refresh();
      
      return data;
    } catch (error) {
      console.error('Error creating KPI:', error);
      throw error;
    }
  }

  // Actualizar KPI
  async updateKPI(id: string, updates: Partial<KPI>): Promise<KPI> {
    try {
      const updateData = {
        ...updates,
        calculated_at: new Date().toISOString()
      };

      // Los KPIs se actualizan directamente sin cálculo de estado
      // ya que la tabla no tiene campos de estado

      const { data, error } = await this.supabase.client
        .from('kpis')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          obra:obras(id, nombre)
        `)
        .single();

      if (error) throw error;

      // Registrar en historial si hay cambios en métricas
      if (updates.avance_fisico !== undefined) {
        await this.addKPIHistorial(id, updates.avance_fisico, 'Avance físico actualizado');
      }

      // Actualizar listas locales
      await this.refresh();
      
      return data;
    } catch (error) {
      console.error('Error updating KPI:', error);
      throw error;
    }
  }

  // Eliminar KPI
  async deleteKPI(id: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('kpis')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Actualizar listas locales
      await this.refresh();
    } catch (error) {
      console.error('Error deleting KPI:', error);
      throw error;
    }
  }

  // Agregar registro al historial de KPI
  private async addKPIHistorial(kpiId: string, valor: number, observaciones?: string): Promise<void> {
    try {
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
      console.error('Error adding KPI historial:', error);
    }
  }

  // Obtener historial de KPI
  async getKPIHistorial(kpiId: string, limite: number = 30): Promise<KPIHistorial[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('kpi_historial')
        .select('*')
        .eq('kpi_id', kpiId)
        .order('fecha_registro', { ascending: false })
        .limit(limite);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting KPI historial:', error);
      return [];
    }
  }

  // Obtener KPIs por tipo
  async getKPIsByTipo(tipo: string): Promise<KPI[]> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) return [];

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
          .select(`
            *,
            obra:obras(id, nombre)
          `)
          .in('obra_id', obraIds)
          .order('fecha', { ascending: false });

        if (error) throw error;
        return data || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting KPIs by tipo:', error);
      return [];
    }
  }

  // Obtener estadísticas generales
  async getEstadisticasGenerales(): Promise<any> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) return null;

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
      console.error('Error getting estadísticas generales:', error);
      return null;
    }
  }

  // Calcular KPIs automáticamente basándose en datos de obras
  async calculateAutomaticKPIs(obraId: string): Promise<void> {
    try {
      console.log('Calculando KPIs automáticos para obra:', obraId);
      
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
          .lt('fecha', hoy + 'T23:59:59')
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
          console.log('KPI automático actualizado para obra:', obraId);
        } else {
          // Crear nuevo KPI
          await this.createKPI(kpiData);
          console.log('KPI automático creado para obra:', obraId);
        }
      } else {
        console.log('No hay actividades para calcular KPIs en obra:', obraId);
      }
    } catch (error) {
      console.error('Error calculando KPIs automáticos:', error);
    }
  }

  // Calcular KPIs para todas las obras del usuario
  async calculateAllAutomaticKPIs(): Promise<void> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) return;

      // Obtener obras asignadas al usuario
      const { data: userObras, error: userObrasError } = await this.supabase.client
        .from('user_obras')
        .select('obra_id')
        .eq('user_id', user.id);

      if (userObrasError) throw userObrasError;

      if (userObras && userObras.length > 0) {
        console.log('Calculando KPIs automáticos para', userObras.length, 'obras');
        
        // Calcular KPIs para cada obra
        for (const userObra of userObras) {
          await this.calculateAutomaticKPIs(userObra.obra_id);
        }
        
        // Refrescar datos después del cálculo
        await this.refresh();
        console.log('KPIs automáticos calculados para todas las obras');
      }
    } catch (error) {
      console.error('Error calculando KPIs automáticos para todas las obras:', error);
    }
  }

  // Refrescar todos los datos
  async refresh(): Promise<void> {
    await Promise.all([
      this.loadUserKPIs(),
      this.loadDashboardKPIs(),
      this.loadAlertas()
    ]);
  }
}