/**
 * CONFIGURACIÓN DE DATOS PARA GRÁFICOS DE DASHBOARD
 * 
 * Para que los gráficos de Análisis de Costos y Cronograma de Proyectos muestren datos reales:
 * 
 * 1. GRÁFICO DE ANÁLISIS DE COSTOS (Presupuesto vs Ejecutado):
 *    - Crear servicio para obtener datos de costos desde la base de datos
 *    - Tablas necesarias: obras, partidas_presupuestarias, gastos_ejecutados
 *    - Campos requeridos: presupuesto_inicial, monto_ejecutado, fecha_reporte
 *    - Modificar método createCostChart() para usar datos reales del servicio
 * 
 * 2. GRÁFICO DE CRONOGRAMA DE PROYECTOS (Planificación vs Ejecución):
 *    - Usar datos de la tabla 'actividades' existente
 *    - Campos necesarios: fecha_inicio_planificada, fecha_fin_planificada, 
 *      fecha_inicio_real, fecha_fin_real, avance_fisico
 *    - Modificar método createPlanificacionChart() para calcular porcentajes de avance
 *    - Integrar con ActividadesService para obtener datos actualizados
 * 
 * 3. UBICACIÓN DE LOS DATOS BASE:
 *    - Los presupuestos se configuran en el módulo de gestión de obras
 *    - Los cronogramas se definen en el módulo de actividades
 *    - Los gastos ejecutados se registran en el módulo de control de costos
 */

import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, combineLatest, take, timer } from 'rxjs';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

import { DirectAuthService } from '../../services/direct-auth.service';
import { KpisService, DashboardKPIs, AlertaKPI } from '../../services/kpis.service';
import { ActividadesService } from '../../services/actividades.service';
import { DashboardService, DashboardStats as ServiceDashboardStats, DashboardCharts } from '../../services/dashboard.service';

Chart.register(...registerables);

interface ComponentDashboardStats {
  totalActividades: number;
  actividadesCompletadas: number;
  actividadesEnProgreso: number;
  progresoPromedio: number;
  alertasActivas: number;
  kpisCriticos: number;
  // Propiedades específicas para residente
  actividadesCampo?: number;
  evaluacionesPersonal?: number;
  progresoObra?: number;
  incidentesSeguridad?: number;
  // Propiedades específicas para logística
  obrasActivas?: number;
  presupuestoEjecutado?: number;
  recursosAsignados?: number;
  proyectosRetrasados?: number;
}

interface ChartData {
  labels: string[];
  datasets: any[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
     MatChipsModule,
     MatDividerModule,
     MatMenuModule,
     MatTooltipModule,
     MatBadgeModule,
     RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Estado de carga
  isLoading = true;
  
  // Datos del usuario
  currentUser: any = null;
  userProfile: any = null;
  
  // Estadísticas del dashboard
  stats: ComponentDashboardStats = {
    totalActividades: 0,
    actividadesCompletadas: 0,
    actividadesEnProgreso: 0,
    progresoPromedio: 0,
    alertasActivas: 0,
    kpisCriticos: 0
  };
  
  // KPIs y alertas
  dashboardKPIs: DashboardKPIs | null = null;
  alertas: AlertaKPI[] = [];
  
  // Gráficos
  private progressChart: Chart | null = null;
  private kpiChart: Chart | null = null;
  private activityChart: Chart | null = null;
  private costChart: Chart | null = null;
  private planificacionChart: Chart | null = null;
  
  // Datos para gráficos
  progressChartData: ChartData = { labels: [], datasets: [] };
  kpiChartData: ChartData = { labels: [], datasets: [] };
  activityChartData: ChartData = { labels: [], datasets: [] };
  costChartData: ChartData = { labels: [], datasets: [] };
  planificacionChartData: ChartData = { labels: [], datasets: [] };

  constructor(
    private directAuthService: DirectAuthService,
    private kpisService: KpisService,
    private actividadesService: ActividadesService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('🚀 [DashboardComponent] Inicializando dashboard...');
    
    try {
      // Mostrar loading inmediatamente
      this.isLoading = true;
      this.cdr.detectChanges();
      
      // Cargar datos del usuario y dashboard con manejo de errores independiente
      await this.loadDataWithErrorHandling();
      
      // Ejecutar diagnóstico de depuración (no crítico)
      this.runDebugDiagnostic().catch(error => {
        console.warn('⚠️ [DashboardComponent] Diagnóstico falló, continuando:', error);
      });
      
      // Asegurar que los cambios se detecten
      this.ngZone.run(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
      
      // Esperar a que el DOM esté completamente renderizado antes de crear gráficos
      setTimeout(() => {
        this.ngZone.run(() => {
          this.initializeCharts();
          this.cdr.detectChanges();
        });
      }, 500);
      
    } catch (error) {
      console.error('❌ [DashboardComponent] Error crítico inicializando dashboard:', error);
      this.ngZone.run(() => {
        this.isLoading = false;
        this.loadFallbackData(); // Cargar datos de respaldo
        this.cdr.detectChanges();
        // Inicializar gráficos con datos de fallback
        setTimeout(() => this.initializeCharts(), 500);
      });
    }
    
    // Verificar si el usuario está autenticado
    if (this.directAuthService.isAuthenticated()) {
      console.log('✅ [Dashboard] Usuario autenticado, inicializando servicios...');
      await this.initializeServices();
    }
  }

  private async initializeServices(): Promise<void> {
    try {
      // Inicializar el servicio KpisService después de la autenticación
      console.log('🔧 [Dashboard] Inicializando servicio KpisService...');
      await this.kpisService.initialize();
      console.log('✅ [Dashboard] Servicio KpisService inicializado correctamente');
      
      // Cargar datos del dashboard
      this.loadDashboardDataSafely();
    } catch (error) {
      console.error('❌ [Dashboard] Error inicializando servicio KpisService:', error);
      // Intentar cargar datos básicos aunque falle la inicialización
      this.loadDashboardDataSafely();
    }
    
    // Forzar recarga de KPIs para asegurar datos actualizados
    this.refreshKPIsData();
    // Ejecutar diagnóstico de debug después de que el usuario esté autenticado
    this.runDebugDiagnostic();
  }

  // Ejecutar diagnóstico de debug
  private async runDebugDiagnostic(): Promise<void> {
    try {
      console.log('🔧 [DASHBOARD] Ejecutando diagnóstico de debug...');
      await this.actividadesService.debugUserData();
    } catch (error) {
      console.error('❌ [DASHBOARD] Error en diagnóstico:', error);
    }
  }

  // Refrescar datos de KPIs
  private async refreshKPIsData(): Promise<void> {
    try {
      console.log('🔄 Refrescando datos de KPIs desde Supabase...');
      
      // Solo refrescar los datos existentes, no calcular automáticamente
      await this.kpisService.refresh();
      console.log('✅ Datos de KPIs actualizados correctamente');
    } catch (error) {
      console.error('❌ Error refrescando datos de KPIs:', error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  // Cargar datos del usuario de forma segura
  private async loadUserDataSafely(): Promise<void> {
    try {
      console.log('👤 [DashboardComponent] Cargando datos del usuario...');
      
      // Obtener usuario actual del DirectAuthService
      const user = this.directAuthService.getCurrentUser();
      if (user) {
        this.ngZone.run(() => {
          this.currentUser = user;
          this.cdr.detectChanges();
        });
        console.log('✅ [DashboardComponent] Usuario actual cargado:', user.email);
        
        // Obtener perfil del usuario
        const profile = this.directAuthService.getCurrentProfile();
        if (profile) {
          this.ngZone.run(() => {
            this.userProfile = profile;
            this.cdr.detectChanges();
          });
          console.log('✅ [DashboardComponent] Perfil del usuario cargado:', profile.rol);
          
          // Cargar datos específicos según el rol después de obtener el perfil
          this.loadRoleSpecificData();
        } else {
          console.warn('⚠️ [DashboardComponent] No se pudo cargar el perfil del usuario');
          this.loadFallbackUserData();
        }
      } else {
        console.warn('⚠️ [DashboardComponent] No hay usuario autenticado - usando datos por defecto');
        this.loadFallbackUserData();
      }
    } catch (error) {
      console.error('❌ [DashboardComponent] Error cargando datos del usuario:', error);
      this.loadFallbackUserData();
    }
  }

  /**
   * Cargar datos con manejo robusto de errores
   */
  private async loadDataWithErrorHandling(): Promise<void> {
    const loadPromises = [
      this.loadUserDataSafely(),
      this.loadRealDashboardDataSafely()
    ];
    
    // Ejecutar todas las cargas en paralelo, pero no fallar si alguna falla
    const results = await Promise.allSettled(loadPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const taskName = index === 0 ? 'datos de usuario' : 'datos del dashboard';
        console.warn(`⚠️ [DashboardComponent] Error cargando ${taskName}:`, result.reason);
      }
    });
  }

  /**
   * Cargar datos reales del dashboard usando el nuevo servicio
   */
  private async loadRealDashboardDataSafely(): Promise<void> {
    try {
      console.log('📊 [Dashboard] Cargando datos reales del dashboard...');
      
      // Cargar datos usando el nuevo servicio
      await this.dashboardService.loadDashboardData();
      
      // Suscribirse a los datos del dashboard con manejo de errores
      this.dashboardService.stats$.subscribe({
        next: (stats) => {
          this.ngZone.run(() => {
            this.updateStatsFromService(stats);
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('❌ [DashboardComponent] Error en stats$:', error);
          this.loadFallbackStats();
        }
      });
      
      this.dashboardService.charts$.subscribe({
        next: (charts) => {
          this.ngZone.run(() => {
            console.log('📈 [Dashboard] Datos de gráficos recibidos:', charts);
            this.updateChartsFromService(charts);
            // Recrear gráficos con nuevos datos
            setTimeout(() => this.initializeCharts(), 100);
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('❌ [DashboardComponent] Error en charts$:', error);
          this.loadFallbackCharts();
          setTimeout(() => this.initializeCharts(), 100);
        }
      });
      
      console.log('✅ [Dashboard] Datos reales del dashboard cargados');
    } catch (error) {
      console.error('❌ [Dashboard] Error cargando datos reales del dashboard:', error);
      // Fallback a datos de ejemplo si hay error
      await this.loadDashboardDataSafely();
    }
  }

  // Cargar datos del dashboard de forma segura (método original como fallback)
  private async loadDashboardDataSafely(): Promise<void> {
    try {
      // Verificar si el servicio está inicializado
      if (!this.kpisService.isServiceInitialized()) {
        console.warn('⚠️ [Dashboard] Servicio KpisService no está inicializado, esperando...');
        // Intentar inicializar nuevamente si no está listo
        await this.kpisService.initialize().then(() => {
          console.log('✅ [Dashboard] Servicio inicializado, cargando datos...');
        }).catch(error => {
          console.error('❌ [Dashboard] Error en inicialización tardía:', error);
          throw error; // Re-lanzar para que sea manejado por el catch principal
        });
      } else {
        console.log('✅ [Dashboard] Servicio ya inicializado, suscribiendo a datos...');
      }
      
      // Cargar KPIs del dashboard con manejo de errores
      this.kpisService.dashboardKPIs$
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (kpis: any) => {
            this.dashboardKPIs = kpis;
            this.updateStats();
            this.updateCharts();
          },
          error: (error) => {
            console.error('❌ [Dashboard] Error en dashboardKPIs$:', error);
            this.loadFallbackStats();
          }
        });
      
      // Cargar alertas con manejo de errores
      this.kpisService.alertas$
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (alertas: any[]) => {
            this.alertas = alertas;
            this.stats.alertasActivas = alertas.length;
          },
          error: (error) => {
            console.error('❌ [Dashboard] Error en alertas$:', error);
            this.alertas = [];
            this.stats.alertasActivas = 0;
          }
        });
      
      // Cargar estadísticas de actividades
      await this.loadActivityStatsSafely();
      
      // Dashboard data loaded successfully
      
    } catch (error) {
      // Error loading dashboard data
      this.loadFallbackData();
      throw error; // Re-lanzar el error para manejo en nivel superior
    }
  }

  private loadRoleSpecificData(): void {
    if (!this.userProfile?.rol) {
      console.warn('⚠️ [DashboardComponent] No se puede cargar datos específicos del rol: perfil no disponible');
      return;
    }

    console.log('📋 [DashboardComponent] Cargando datos específicos para el rol:', this.userProfile.rol);
    // Los datos ahora se cargan desde KpisService, no hay datos hardcodeados por rol
  }







  // Cargar estadísticas de actividades de forma segura
  private async loadActivityStatsSafely(): Promise<void> {
    try {
      console.log('🔍 [DASHBOARD] Iniciando carga de estadísticas de actividades...');
      console.log('🔍 [DASHBOARD] Estado del observable actividades$:', this.actividadesService.actividades$);
      
      const actividades = await this.actividadesService.actividades$.pipe(take(1)).toPromise();
      
      console.log('🔍 [DASHBOARD] Actividades recibidas del observable:', actividades);
      console.log('🔍 [DASHBOARD] Tipo de datos:', typeof actividades);
      console.log('🔍 [DASHBOARD] Es array:', Array.isArray(actividades));
      console.log('🔍 [DASHBOARD] Longitud:', actividades ? actividades.length : 'null/undefined');
      
      if (actividades) {
        this.stats.totalActividades = actividades.length;
        this.stats.actividadesCompletadas = actividades.filter((a: any) => a.estado === 'finalizado').length;
        this.stats.actividadesEnProgreso = actividades.filter((a: any) => a.estado === 'ejecucion').length;
        
        console.log('🔍 [DASHBOARD] Estadísticas calculadas:', {
          total: this.stats.totalActividades,
          completadas: this.stats.actividadesCompletadas,
          enProgreso: this.stats.actividadesEnProgreso
        });
        
        if (actividades.length > 0) {
          this.stats.progresoPromedio = Math.round(
            (this.stats.actividadesCompletadas / actividades.length) * 100
          );
          console.log('🔍 [DASHBOARD] Progreso promedio calculado:', this.stats.progresoPromedio + '%');
        }
      } else {
        console.warn('⚠️ [DASHBOARD] No se recibieron actividades del observable');
        this.loadFallbackActivityStats();
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Error loading activity stats:', error);
      this.loadFallbackActivityStats();
    }
  }

  // Métodos de fallback para manejo de errores
  private loadFallbackData(): void {
    console.log('🔄 [Dashboard] Cargando datos de respaldo...');
    this.loadFallbackUserData();
    this.loadFallbackStats();
    this.loadFallbackCharts();
  }

  private loadFallbackUserData(): void {
    this.currentUser = { email: 'usuario@ejemplo.com' };
    this.userProfile = { rol: 'residente', nombre: 'Usuario' };
  }

  private loadFallbackStats(): void {
    this.stats = {
      totalActividades: 0,
      actividadesCompletadas: 0,
      actividadesEnProgreso: 0,
      progresoPromedio: 0,
      alertasActivas: 0,
      kpisCriticos: 0,
      actividadesCampo: 0,
      evaluacionesPersonal: 0,
      progresoObra: 0,
      incidentesSeguridad: 0
    };
  }

  private loadFallbackActivityStats(): void {
    this.stats.totalActividades = 0;
    this.stats.actividadesCompletadas = 0;
    this.stats.actividadesEnProgreso = 0;
    this.stats.progresoPromedio = 0;
  }

  private loadFallbackCharts(): void {
    this.progressChartData = { labels: ['Sin datos'], datasets: [] };
    this.kpiChartData = { labels: ['Sin datos'], datasets: [] };
    this.activityChartData = { labels: ['Sin datos'], datasets: [] };
    this.costChartData = { labels: ['Sin datos'], datasets: [] };
    this.planificacionChartData = { labels: ['Sin datos'], datasets: [] };
  }

  // Actualizar estadísticas del dashboard
  private updateStats(): void {
    if (this.dashboardKPIs) {
      this.stats.kpisCriticos = 
        this.dashboardKPIs.rendimiento.criticos +
        this.dashboardKPIs.calidad.criticos +
        this.dashboardKPIs.seguridad.criticos +
        this.dashboardKPIs.costo.criticos +
        this.dashboardKPIs.tiempo.criticos;
      
      console.log('📊 Estadísticas actualizadas con datos reales:', {
        kpisCriticos: this.stats.kpisCriticos,
        alertasActivas: this.stats.alertasActivas,
        rendimiento: this.dashboardKPIs.rendimiento.promedio,
        calidad: this.dashboardKPIs.calidad.promedio
      });
    } else {
      // Manejo mejorado cuando no hay datos
      console.warn('⚠️ No hay datos de KPIs disponibles en la base de datos');
      console.log('💡 Esto puede ocurrir si:');
      console.log('   - No hay obras asignadas al usuario');
      console.log('   - No hay actividades registradas en las obras');
      console.log('   - Los KPIs automáticos aún no se han calculado');
      
      // Mantener valores por defecto cuando no hay datos
      this.stats.kpisCriticos = 0;
      
      console.log('📊 Estadísticas inicializadas con valores por defecto:', this.stats);
    }
  }

  // Inicializar todos los gráficos
  private initializeCharts(): void {
    console.log('📊 [Dashboard] Inicializando gráficos...');
    
    // Destruir gráficos existentes primero
    this.destroyCharts();
    
    // Esperar un momento para que el DOM se actualice
    setTimeout(() => {
      try {
        this.createProgressChart();
        this.createKPIChart();
        this.createActivityChart();
        this.createCostChart();
        this.createPlanificacionChart();
        console.log('✅ [Dashboard] Gráficos inicializados correctamente');
      } catch (error) {
        console.error('❌ [Dashboard] Error inicializando gráficos:', error);
      }
    }, 100);
  }

  // Actualizar gráficos con nuevos datos
  private updateCharts(): void {
    console.log('🔄 [Dashboard] Actualizando gráficos...');
    this.initializeCharts();
  }

  // Crear gráfico de progreso semanal
  private createProgressChart(): void {
    const canvas = document.getElementById('progresoChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('⚠️ [Dashboard] Canvas progresoChart no encontrado');
      return;
    }

    if (this.progressChart) {
      this.progressChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Usar datos reales si están disponibles, sino usar datos de ejemplo
    let chartData = this.progressChartData;
    
    if (!chartData.labels.length) {
      // Datos de ejemplo
      const semanas = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];
      const progreso = [15, 28, 42, 58, 75, 85];
      
      chartData = {
        labels: semanas,
        datasets: [{
          label: 'Progreso de Obra (%)',
          data: progreso,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      };
    }

    this.progressChart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
    
    console.log('✅ [Dashboard] Gráfico de progreso creado');
  }

  // Crear gráfico de KPIs
  private createKPIChart(): void {
    const canvas = document.getElementById('kpiChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('⚠️ [Dashboard] Canvas kpiChart no encontrado');
      return;
    }

    if (this.kpiChart) {
      this.kpiChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Usar datos reales si están disponibles, sino usar datos de ejemplo
    let chartData = this.kpiChartData;
    
    if (!chartData.labels.length) {
      // Datos de ejemplo
      const categorias = ['Calidad', 'Tiempo', 'Costo', 'Seguridad'];
      const valores = [85, 78, 92, 88];
      const colores = ['#4caf50', '#2196f3', '#ff9800', '#f44336'];
      
      chartData = {
        labels: categorias,
        datasets: [{
          label: 'KPI (%)',
          data: valores,
          backgroundColor: colores,
          borderColor: colores,
          borderWidth: 1
        }]
      };
    }

    this.kpiChart = new Chart(ctx, {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
    
    console.log('✅ [Dashboard] Gráfico de KPIs creado');
  }

  // Crear gráfico de actividades
  private createActivityChart(): void {
    const canvas = document.getElementById('actividadesChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('⚠️ [Dashboard] Canvas actividadesChart no encontrado');
      return;
    }

    if (this.activityChart) {
      this.activityChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Usar datos reales si están disponibles, sino usar datos de ejemplo
    let chartData = this.activityChartData;
    
    if (!chartData.labels.length) {
      // Datos de ejemplo
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
      const completadas = [12, 18, 25, 32, 28, 35];
      const pendientes = [8, 12, 15, 18, 22, 15];
      
      chartData = {
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
    }

    this.activityChart = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
    
    console.log('✅ [Dashboard] Gráfico de actividades creado');
  }

  // Crear gráfico de análisis de costos (Presupuesto vs Ejecutado)
  private createCostChart(): void {
    const canvas = document.getElementById('costosChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('⚠️ [Dashboard] Canvas costosChart no encontrado');
      return;
    }

    if (this.costChart) {
      this.costChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Usar datos reales si están disponibles, sino usar datos de ejemplo
    let chartData = this.costChartData;
    
    if (!chartData.labels.length) {
      // Datos de ejemplo mejorados
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
      const presupuestado = [850000, 920000, 1100000, 1250000, 1400000, 1550000];
      const ejecutado = [780000, 890000, 1050000, 1180000, 1320000, 1480000];
      
      chartData = {
        labels: meses,
        datasets: [
          {
            label: 'Presupuestado',
            data: presupuestado,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Ejecutado',
            data: ejecutado,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }
        ]
      };
    }

    this.costChart = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return '$' + (Number(value) / 1000).toFixed(0) + 'K';
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
              }
            }
          }
        }
      }
    });
    
    console.log('✅ [Dashboard] Gráfico de costos creado');
  }

  // Crear gráfico de cronograma de proyectos (Planificación vs Ejecución mensual)
  private createPlanificacionChart(): void {
    const canvas = document.getElementById('planificacionChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('⚠️ [Dashboard] Canvas planificacionChart no encontrado');
      return;
    }

    if (this.planificacionChart) {
      this.planificacionChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Usar datos reales si están disponibles, sino usar datos de ejemplo
    let chartData = this.planificacionChartData;
    
    if (!chartData.labels.length) {
      // Datos de ejemplo mejorados
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
      const planificado = [15, 28, 42, 58, 75, 90];
      const ejecutado = [12, 25, 38, 52, 68, 85];
      
      chartData = {
        labels: meses,
        datasets: [
          {
            label: 'Avance Planificado',
            data: planificado,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            fill: false,
            tension: 0.4
          },
          {
            label: 'Avance Real',
            data: ejecutado,
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderWidth: 2,
            fill: false,
            tension: 0.4
          }
        ]
      };
    }

    this.planificacionChart = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.parsed.y + '%';
              }
            }
          }
        }
      }
    });
    
    console.log('✅ [Dashboard] Gráfico de planificación creado');
  }

  // Destruir gráficos
  private destroyCharts(): void {
    if (this.progressChart) {
      this.progressChart.destroy();
      this.progressChart = null;
    }
    if (this.kpiChart) {
      this.kpiChart.destroy();
      this.kpiChart = null;
    }
    if (this.activityChart) {
      this.activityChart.destroy();
      this.activityChart = null;
    }
    if (this.costChart) {
      this.costChart.destroy();
      this.costChart = null;
    }
    if (this.planificacionChart) {
      this.planificacionChart.destroy();
      this.planificacionChart = null;
    }
  }

  // Obtener color de estado
  getStatusColor(estado: string): string {
    switch (estado) {
      case 'excelente': return 'success';
      case 'normal': return 'primary';
      case 'alerta': return 'warn';
      case 'critico': return 'danger';
      default: return 'primary';
    }
  }

  // Obtener icono de estado
  getStatusIcon(estado: string): string {
    switch (estado) {
      case 'excelente': return 'trending_up';
      case 'normal': return 'trending_flat';
      case 'alerta': return 'warning';
      case 'critico': return 'error';
      default: return 'info';
    }
  }

  // Obtener saludo según la hora
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  // Refrescar datos
  async refreshData(): Promise<void> {
    try {
      // Refrescando datos del dashboard
      this.isLoading = true;
      
      // Refrescar usando el nuevo servicio
      await this.dashboardService.refreshDashboard();
      
      // Refrescar KPIs como fallback
      await this.refreshKPIsData();
      
      // Dashboard actualizado exitosamente
    } catch (error) {
      // Error refreshing dashboard
      // Fallback al método original
      await this.loadDashboardDataSafely();
    } finally {
      this.isLoading = false;
    }
  }

  // Navegar a sección específica
  navigateToSection(section: string): void {
    // Implementar navegación según la sección
    console.log('Navigating to:', section);
  }

  // Resolver alerta
  resolveAlert(alerta: AlertaKPI): void {
    // Implementar resolución de alerta
    console.log('Resolving alert:', alerta);
  }

  // Obtener porcentaje de progreso general
  getOverallProgress(): number {
    if (this.stats.totalActividades === 0) return 0;
    return Math.round((this.stats.actividadesCompletadas / this.stats.totalActividades) * 100);
  }

  // Obtener color del progreso
  getProgressColor(value?: number): string {
    const progress = value !== undefined ? value : this.getOverallProgress();
    if (progress >= 80) return 'primary';
    if (progress >= 60) return 'accent';
    return 'warn';
  }

  /**
   * Actualizar estadísticas desde el servicio
   */
  private updateStatsFromService(stats: ServiceDashboardStats): void {
    // Mapear estadísticas del servicio a las del componente
    this.stats = {
      totalActividades: stats.actividadesTotales || 0,
      actividadesCompletadas: stats.actividadesCompletadas || 0,
      actividadesEnProgreso: stats.actividadesEnProgreso || 0,
      progresoPromedio: stats.progresoPromedio || 0,
      alertasActivas: 0, // Se calculará desde KPIs
      kpisCriticos: stats.kpisCriticos || 0
    };
    console.log('📊 Estadísticas actualizadas desde servicio:', this.stats);
  }

  /**
    * Actualizar gráficos desde el servicio
    */
   private updateChartsFromService(charts: DashboardCharts): void {
     // Actualizar datos de gráficos con datos reales
     this.activityChartData = charts.evaluacionesPorMes;
     this.costChartData = charts.evidenciasPorObra;
     this.kpiChartData = charts.kpisPorCategoria;
     this.progressChartData = charts.progresoActividades;
     this.planificacionChartData = charts.tendenciaCalidad;
     
     // Recrear gráficos con nuevos datos usando NgZone
     this.ngZone.runOutsideAngular(() => {
       setTimeout(() => {
         this.ngZone.run(() => {
           this.destroyCharts();
           this.createActivityChart();
           this.createCostChart();
           this.createKPIChart();
           this.createProgressChart();
           this.createPlanificacionChart();
           this.cdr.detectChanges();
         });
       }, 200);
     });
     
     console.log('📈 Gráficos actualizados desde servicio');
   }

  // Obtener icono de tendencia
  getTrendIcon(tendencia: string): string {
    switch (tendencia) {
      case 'subiendo': return 'trending_up';
      case 'bajando': return 'trending_down';
      case 'estable': return 'trending_flat';
      default: return 'trending_flat';
    }
  }
}