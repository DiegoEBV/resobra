import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { EvaluacionesService } from './evaluaciones.service';
import { EvidenciaFotograficaService } from './evidencia-fotografica.service';
import { KpisService } from './kpis.service';

// Interfaces para el dashboard
export interface DashboardStats {
  // Estadísticas generales
  totalEvaluaciones: number;
  evaluacionesCompletadas: number;
  evaluacionesPendientes: number;
  
  // Evidencias fotográficas
  totalEvidencias: number;
  evidenciasEstesMes: number;
  evidenciasPorObra: { [obraId: string]: number };
  
  // KPIs
  promedioKPIs: number;
  kpisCriticos: number;
  tendenciaGeneral: 'subiendo' | 'bajando' | 'estable';
  
  // Actividades
  actividadesCompletadas: number;
  actividadesTotales: number;
  actividadesEnProgreso: number;
  
  // Obras
  obrasActivas: number;
  progresoPromedio: number;
}

export interface ChartData {
  labels: string[];
  datasets: any[];
}

export interface DashboardCharts {
  evaluacionesPorMes: ChartData;
  evidenciasPorObra: ChartData;
  kpisPorCategoria: ChartData;
  progresoActividades: ChartData;
  tendenciaCalidad: ChartData;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private statsSubject = new BehaviorSubject<DashboardStats>({
    totalEvaluaciones: 0,
    evaluacionesCompletadas: 0,
    evaluacionesPendientes: 0,
    totalEvidencias: 0,
    evidenciasEstesMes: 0,
    evidenciasPorObra: {},
    promedioKPIs: 0,
    kpisCriticos: 0,
    tendenciaGeneral: 'estable',
    actividadesCompletadas: 0,
    actividadesTotales: 0,
    actividadesEnProgreso: 0,
    obrasActivas: 0,
    progresoPromedio: 0
  });

  private chartsSubject = new BehaviorSubject<DashboardCharts>({
    evaluacionesPorMes: { labels: [], datasets: [] },
    evidenciasPorObra: { labels: [], datasets: [] },
    kpisPorCategoria: { labels: [], datasets: [] },
    progresoActividades: { labels: [], datasets: [] },
    tendenciaCalidad: { labels: [], datasets: [] }
  });

  public stats$ = this.statsSubject.asObservable();
  public charts$ = this.chartsSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private evaluacionesService: EvaluacionesService,
    private evidenciaService: EvidenciaFotograficaService,
    private kpisService: KpisService
  ) {}

  /**
   * Cargar todos los datos del dashboard
   */
  async loadDashboardData(): Promise<void> {
    try {
      console.log('📊 [DashboardService] Iniciando carga de datos del dashboard...');
      
      const user = await this.authService.getCurrentUser();
      if (!user) {
        console.warn('⚠️ [DashboardService] No hay usuario autenticado');
        return;
      }

      // Cargar datos en paralelo
      const [stats, charts] = await Promise.all([
        this.loadDashboardStats(),
        this.loadDashboardCharts()
      ]);

      this.statsSubject.next(stats);
      this.chartsSubject.next(charts);
      
      console.log('✅ [DashboardService] Datos del dashboard cargados exitosamente');
    } catch (error) {
      console.error('❌ [DashboardService] Error cargando datos del dashboard:', error);
      throw error;
    }
  }

  /**
   * Cargar estadísticas del dashboard
   */
  private async loadDashboardStats(): Promise<DashboardStats> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Obtener obras del usuario
      const { data: userObras } = await this.supabase.client
        .from('user_obras')
        .select('obra_id')
        .eq('user_id', user.id);

      const obraIds = userObras?.map(uo => uo.obra_id) || [];
      
      if (obraIds.length === 0) {
        console.warn('⚠️ [DashboardService] Usuario no tiene obras asignadas');
        return this.getEmptyStats();
      }

      // Cargar estadísticas en paralelo
      const [evaluacionesStats, evidenciasStats, kpisStats, actividadesStats, obrasStats] = await Promise.all([
        this.getEvaluacionesStats(),
        this.getEvidenciasStats(obraIds),
        this.getKPIsStats(obraIds),
        this.getActividadesStats(obraIds),
        this.getObrasStats(obraIds)
      ]);

      const stats: DashboardStats = {
        totalEvaluaciones: evaluacionesStats.totalEvaluaciones || 0,
        evaluacionesCompletadas: evaluacionesStats.evaluacionesCompletadas || 0,
        evaluacionesPendientes: evaluacionesStats.evaluacionesPendientes || 0,
        totalEvidencias: evidenciasStats.totalEvidencias || 0,
        evidenciasEstesMes: evidenciasStats.evidenciasEstesMes || 0,
        evidenciasPorObra: evidenciasStats.evidenciasPorObra || {},
        promedioKPIs: kpisStats.promedioKPIs || 0,
        kpisCriticos: kpisStats.kpisCriticos || 0,
        tendenciaGeneral: kpisStats.tendenciaGeneral || 'estable',
        actividadesCompletadas: actividadesStats.actividadesCompletadas || 0,
        actividadesTotales: actividadesStats.actividadesTotales || 0,
        actividadesEnProgreso: actividadesStats.actividadesEnProgreso || 0,
        obrasActivas: obrasStats.obrasActivas || 0,
        progresoPromedio: obrasStats.progresoPromedio || 0
      };
      
      return stats;
    } catch (error) {
      console.error('❌ [DashboardService] Error cargando estadísticas:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Obtener estadísticas de evaluaciones
   */
  private async getEvaluacionesStats(): Promise<Partial<DashboardStats>> {
    try {
      const { data: evaluaciones, error } = await this.supabase.client
        .from('evaluaciones')
        .select('id, estado, created_at');

      if (error) throw error;

      const total = evaluaciones?.length || 0;
      const completadas = evaluaciones?.filter(e => e.estado === 'completada' || e.estado === 'aprobada').length || 0;
      const pendientes = total - completadas;

      return {
        totalEvaluaciones: total,
        evaluacionesCompletadas: completadas,
        evaluacionesPendientes: pendientes
      };
    } catch (error) {
      console.error('❌ [DashboardService] Error obteniendo estadísticas de evaluaciones:', error);
      return {
        totalEvaluaciones: 0,
        evaluacionesCompletadas: 0,
        evaluacionesPendientes: 0
      };
    }
  }

  /**
   * Obtener estadísticas de evidencias fotográficas
   */
  private async getEvidenciasStats(obraIds: string[]): Promise<Partial<DashboardStats>> {
    try {
      // Obtener actividades de las obras
      const { data: actividades } = await this.supabase.client
        .from('actividades')
        .select('id, obra_id')
        .in('obra_id', obraIds);

      const actividadIds = actividades?.map(a => a.id) || [];
      
      if (actividadIds.length === 0) {
        return {
          totalEvidencias: 0,
          evidenciasEstesMes: 0,
          evidenciasPorObra: {}
        };
      }

      const { data: evidencias, error } = await this.supabase.client
        .from('evidencia_fotografica')
        .select('id, actividad_id, created_at')
        .in('actividad_id', actividadIds);

      if (error) throw error;

      const total = evidencias?.length || 0;
      
      // Evidencias de este mes
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      
      const evidenciasEstesMes = evidencias?.filter(e => 
        new Date(e.created_at || '') >= inicioMes
      ).length || 0;

      // Evidencias por obra
      const evidenciasPorObra: { [obraId: string]: number } = {};
      actividades?.forEach(actividad => {
        const obraId = actividad.obra_id;
        const evidenciasActividad = evidencias?.filter(e => e.actividad_id === actividad.id).length || 0;
        evidenciasPorObra[obraId] = (evidenciasPorObra[obraId] || 0) + evidenciasActividad;
      });

      return {
        totalEvidencias: total,
        evidenciasEstesMes,
        evidenciasPorObra
      };
    } catch (error) {
      console.error('❌ [DashboardService] Error obteniendo estadísticas de evidencias:', error);
      return {
        totalEvidencias: 0,
        evidenciasEstesMes: 0,
        evidenciasPorObra: {}
      };
    }
  }

  /**
   * Obtener estadísticas de KPIs
   */
  private async getKPIsStats(obraIds: string[]): Promise<Partial<DashboardStats>> {
    try {
      const { data: kpis, error } = await this.supabase.client
        .from('kpis')
        .select('avance_fisico, productividad, calidad, desviacion_cronograma, created_at')
        .in('obra_id', obraIds)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      if (!kpis || kpis.length === 0) {
        return {
          promedioKPIs: 0,
          kpisCriticos: 0,
          tendenciaGeneral: 'estable'
        };
      }

      // Calcular promedio general
      const promedios = kpis.map(kpi => {
        const valores = [
          kpi.avance_fisico || 0,
          kpi.productividad || 0,
          kpi.calidad || 0,
          100 - (kpi.desviacion_cronograma || 0) // Convertir desviación a positivo
        ].filter(v => v > 0);
        return valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
      });

      const promedioGeneral = promedios.length > 0 ? 
        promedios.reduce((a, b) => a + b, 0) / promedios.length : 0;

      // Contar KPIs críticos (< 70%)
      const kpisCriticos = promedios.filter(p => p < 70).length;

      // Calcular tendencia (comparar primera y segunda mitad del período)
      let tendencia: 'subiendo' | 'bajando' | 'estable' = 'estable';
      if (kpis.length >= 4) {
        const mitad = Math.floor(kpis.length / 2);
        const primeraMetad = promedios.slice(0, mitad);
        const segundaMetad = promedios.slice(mitad);
        
        const promedioPrimera = primeraMetad.reduce((a, b) => a + b, 0) / primeraMetad.length;
        const promedioSegunda = segundaMetad.reduce((a, b) => a + b, 0) / segundaMetad.length;
        
        const diferencia = promedioSegunda - promedioPrimera;
        if (diferencia > 5) tendencia = 'subiendo';
        else if (diferencia < -5) tendencia = 'bajando';
      }

      return {
        promedioKPIs: Math.round(promedioGeneral),
        kpisCriticos,
        tendenciaGeneral: tendencia
      };
    } catch (error) {
      console.error('❌ [DashboardService] Error obteniendo estadísticas de KPIs:', error);
      return {
        promedioKPIs: 0,
        kpisCriticos: 0,
        tendenciaGeneral: 'estable'
      };
    }
  }

  /**
   * Obtener estadísticas de actividades
   */
  private async getActividadesStats(obraIds: string[]): Promise<Partial<DashboardStats>> {
    try {
      const { data: actividades, error } = await this.supabase.client
        .from('actividades')
        .select('id, estado')
        .in('obra_id', obraIds);

      if (error) throw error;

      const total = actividades?.length || 0;
      const completadas = actividades?.filter(a => a.estado === 'completada').length || 0;
      const enProgreso = actividades?.filter(a => a.estado === 'en_progreso').length || 0;

      return {
        actividadesTotales: total,
        actividadesCompletadas: completadas,
        actividadesEnProgreso: enProgreso
      };
    } catch (error) {
      console.error('❌ [DashboardService] Error obteniendo estadísticas de actividades:', error);
      return {
        actividadesTotales: 0,
        actividadesCompletadas: 0,
        actividadesEnProgreso: 0
      };
    }
  }

  /**
   * Obtener estadísticas de obras
   */
  private async getObrasStats(obraIds: string[]): Promise<Partial<DashboardStats>> {
    try {
      const { data: obras, error } = await this.supabase.client
        .from('obras')
        .select('id, estado, progreso')
        .in('id', obraIds);

      if (error) throw error;

      const activas = obras?.filter(o => o.estado === 'activa' || o.estado === 'en_progreso').length || 0;
      const progresoPromedio = obras && obras.length > 0 ? 
        obras.reduce((sum, obra) => sum + (obra.progreso || 0), 0) / obras.length : 0;

      return {
        obrasActivas: activas,
        progresoPromedio: Math.round(progresoPromedio)
      };
    } catch (error) {
      console.error('❌ [DashboardService] Error obteniendo estadísticas de obras:', error);
      return {
        obrasActivas: 0,
        progresoPromedio: 0
      };
    }
  }

  /**
   * Cargar datos para gráficos
   */
  private async loadDashboardCharts(): Promise<DashboardCharts> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Obtener obras del usuario
      const { data: userObras } = await this.supabase.client
        .from('user_obras')
        .select('obra_id')
        .eq('user_id', user.id);

      const obraIds = userObras?.map(uo => uo.obra_id) || [];
      
      if (obraIds.length === 0) {
        return this.getEmptyCharts();
      }

      // Cargar datos para gráficos en paralelo
      const [evaluacionesPorMes, evidenciasPorObra, kpisPorCategoria, progresoActividades, tendenciaCalidad] = await Promise.all([
        this.getEvaluacionesPorMesChart(),
        this.getEvidenciasPorObraChart(obraIds),
        this.getKPIsPorCategoriaChart(obraIds),
        this.getProgresoActividadesChart(obraIds),
        this.getTendenciaCalidadChart(obraIds)
      ]);

      return {
        evaluacionesPorMes,
        evidenciasPorObra,
        kpisPorCategoria,
        progresoActividades,
        tendenciaCalidad
      };
    } catch (error) {
      console.error('❌ [DashboardService] Error cargando gráficos:', error);
      return this.getEmptyCharts();
    }
  }

  /**
   * Gráfico de evaluaciones por mes
   */
  private async getEvaluacionesPorMesChart(): Promise<ChartData> {
    try {
      const { data: evaluaciones, error } = await this.supabase.client
        .from('evaluaciones')
        .select('created_at, estado')
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Generar últimos 6 meses
      const meses = [];
      const completadas = [];
      const pendientes = [];
      
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'short' });
        meses.push(mesNombre);
        
        const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
        
        const evaluacionesMes = evaluaciones?.filter(e => {
          const fechaEval = new Date(e.created_at || '');
          return fechaEval >= inicioMes && fechaEval <= finMes;
        }) || [];
        
        const completadasMes = evaluacionesMes.filter(e => e.estado === 'completada' || e.estado === 'aprobada').length;
        const pendientesMes = evaluacionesMes.length - completadasMes;
        
        completadas.push(completadasMes);
        pendientes.push(pendientesMes);
      }

      return {
        labels: meses,
        datasets: [
          {
            label: 'Completadas',
            data: completadas,
            backgroundColor: '#4caf50',
            borderColor: '#4caf50',
            borderWidth: 1
          },
          {
            label: 'Pendientes',
            data: pendientes,
            backgroundColor: '#ff9800',
            borderColor: '#ff9800',
            borderWidth: 1
          }
        ]
      };
    } catch (error) {
      console.error('❌ [DashboardService] Error en gráfico de evaluaciones por mes:', error);
      return this.getEmptyChart(['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']);
    }
  }

  /**
   * Gráfico de evidencias por obra
   */
  private async getEvidenciasPorObraChart(obraIds: string[]): Promise<ChartData> {
    try {
      // Obtener nombres de obras
      const { data: obras } = await this.supabase.client
        .from('obras')
        .select('id, nombre')
        .in('id', obraIds);

      // Obtener actividades por obra
      const { data: actividades } = await this.supabase.client
        .from('actividades')
        .select('id, obra_id')
        .in('obra_id', obraIds);

      const actividadIds = actividades?.map(a => a.id) || [];
      
      if (actividadIds.length === 0) {
        const labels = obras?.map(o => o.nombre) || ['Sin obras'];
        return this.getEmptyChart(labels);
      }

      // Obtener evidencias
      const { data: evidencias } = await this.supabase.client
        .from('evidencia_fotografica')
        .select('actividad_id')
        .in('actividad_id', actividadIds);

      // Contar evidencias por obra
      const labels: string[] = [];
      const data: number[] = [];
      const colors: string[] = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4'];
      
      obras?.forEach((obra, index) => {
        labels.push(obra.nombre);
        const actividadesObra = actividades?.filter(a => a.obra_id === obra.id) || [];
        const evidenciasObra = evidencias?.filter(e => 
          actividadesObra.some(a => a.id === e.actividad_id)
        ).length || 0;
        data.push(evidenciasObra);
      });

      return {
        labels,
        datasets: [{
          label: 'Evidencias',
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 1
        }]
      };
    } catch (error) {
      console.error('❌ [DashboardService] Error en gráfico de evidencias por obra:', error);
      return this.getEmptyChart(['Obra 1', 'Obra 2', 'Obra 3']);
    }
  }

  /**
   * Gráfico de KPIs por categoría
   */
  private async getKPIsPorCategoriaChart(obraIds: string[]): Promise<ChartData> {
    try {
      const { data: kpis, error } = await this.supabase.client
        .from('kpis')
        .select('avance_fisico, productividad, calidad, desviacion_cronograma')
        .in('obra_id', obraIds)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const labels = ['Avance Físico', 'Productividad', 'Calidad', 'Cronograma'];
      
      if (!kpis || kpis.length === 0) {
        return {
          labels,
          datasets: [{
            label: 'Promedio (%)',
            data: [0, 0, 0, 0],
            backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#f44336'],
            borderWidth: 1
          }]
        };
      }

      // Calcular promedios
      const avanceFisico = kpis.reduce((sum, k) => sum + (k.avance_fisico || 0), 0) / kpis.length;
      const productividad = kpis.reduce((sum, k) => sum + (k.productividad || 0), 0) / kpis.length;
      const calidad = kpis.reduce((sum, k) => sum + (k.calidad || 0), 0) / kpis.length;
      const cronograma = 100 - (kpis.reduce((sum, k) => sum + (k.desviacion_cronograma || 0), 0) / kpis.length);

      return {
        labels,
        datasets: [{
          label: 'Promedio (%)',
          data: [Math.round(avanceFisico), Math.round(productividad), Math.round(calidad), Math.round(cronograma)],
          backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#f44336'],
          borderWidth: 1
        }]
      };
    } catch (error) {
      console.error('❌ [DashboardService] Error en gráfico de KPIs por categoría:', error);
      return this.getEmptyChart(['Avance Físico', 'Productividad', 'Calidad', 'Cronograma']);
    }
  }

  /**
   * Gráfico de progreso de actividades
   */
  private async getProgresoActividadesChart(obraIds: string[]): Promise<ChartData> {
    try {
      const { data: actividades, error } = await this.supabase.client
        .from('actividades')
        .select('estado')
        .in('obra_id', obraIds);

      if (error) throw error;

      const completadas = actividades?.filter(a => a.estado === 'completada').length || 0;
      const enProgreso = actividades?.filter(a => a.estado === 'en_progreso').length || 0;
      const pendientes = actividades?.filter(a => a.estado === 'pendiente' || a.estado === 'planificada').length || 0;

      return {
        labels: ['Completadas', 'En Progreso', 'Pendientes'],
        datasets: [{
          data: [completadas, enProgreso, pendientes],
          backgroundColor: ['#4caf50', '#2196f3', '#ff9800'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };
    } catch (error) {
      console.error('❌ [DashboardService] Error en gráfico de progreso de actividades:', error);
      return {
        labels: ['Completadas', 'En Progreso', 'Pendientes'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: ['#4caf50', '#2196f3', '#ff9800'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      };
    }
  }

  /**
   * Gráfico de tendencia de calidad
   */
  private async getTendenciaCalidadChart(obraIds: string[]): Promise<ChartData> {
    try {
      const { data: kpis, error } = await this.supabase.client
        .from('kpis')
        .select('calidad, created_at')
        .in('obra_id', obraIds)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      if (error) throw error;

      // Generar últimos 7 días
      const labels = [];
      const data = [];
      
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        labels.push(fecha.toLocaleDateString('es-ES', { weekday: 'short' }));
        
        const inicioDay = new Date(fecha);
        inicioDay.setHours(0, 0, 0, 0);
        const finDay = new Date(fecha);
        finDay.setHours(23, 59, 59, 999);
        
        const kpisDia = kpis?.filter(k => {
          const fechaKpi = new Date(k.created_at || '');
          return fechaKpi >= inicioDay && fechaKpi <= finDay;
        }) || [];
        
        const promedioCalidad = kpisDia.length > 0 ? 
          kpisDia.reduce((sum, k) => sum + (k.calidad || 0), 0) / kpisDia.length : 0;
        
        data.push(Math.round(promedioCalidad));
      }

      return {
        labels,
        datasets: [{
          label: 'Calidad (%)',
          data,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      };
    } catch (error) {
      console.error('❌ [DashboardService] Error en gráfico de tendencia de calidad:', error);
      const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      return {
        labels,
        datasets: [{
          label: 'Calidad (%)',
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      };
    }
  }

  /**
   * Obtener estadísticas vacías por defecto
   */
  private getEmptyStats(): DashboardStats {
    return {
      totalEvaluaciones: 0,
      evaluacionesCompletadas: 0,
      evaluacionesPendientes: 0,
      totalEvidencias: 0,
      evidenciasEstesMes: 0,
      evidenciasPorObra: {},
      promedioKPIs: 0,
      kpisCriticos: 0,
      tendenciaGeneral: 'estable',
      actividadesCompletadas: 0,
      actividadesTotales: 0,
      actividadesEnProgreso: 0,
      obrasActivas: 0,
      progresoPromedio: 0
    };
  }

  /**
   * Obtener gráficos vacíos por defecto
   */
  private getEmptyCharts(): DashboardCharts {
    return {
      evaluacionesPorMes: this.getEmptyChart(['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']),
      evidenciasPorObra: this.getEmptyChart(['Sin obras']),
      kpisPorCategoria: this.getEmptyChart(['Avance Físico', 'Productividad', 'Calidad', 'Cronograma']),
      progresoActividades: {
        labels: ['Completadas', 'En Progreso', 'Pendientes'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: ['#4caf50', '#2196f3', '#ff9800'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      tendenciaCalidad: {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Calidad (%)',
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      }
    };
  }

  /**
   * Obtener gráfico vacío con etiquetas personalizadas
   */
  private getEmptyChart(labels: string[]): ChartData {
    return {
      labels,
      datasets: [{
        label: 'Sin datos',
        data: new Array(labels.length).fill(0),
        backgroundColor: '#e0e0e0',
        borderColor: '#bdbdbd',
        borderWidth: 1
      }]
    };
  }

  /**
   * Refrescar todos los datos del dashboard
   */
  async refreshDashboard(): Promise<void> {
    await this.loadDashboardData();
  }

  /**
   * Obtener estadísticas actuales
   */
  getCurrentStats(): DashboardStats {
    return this.statsSubject.value;
  }

  /**
   * Obtener gráficos actuales
   */
  getCurrentCharts(): DashboardCharts {
    return this.chartsSubject.value;
  }
}