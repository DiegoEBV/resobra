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

import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { Subject, takeUntil, combineLatest, take } from 'rxjs';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

import { AuthService } from '../../services/auth.service';
import { KpisService, DashboardKPIs, AlertaKPI } from '../../services/kpis.service';
import { ActividadesService } from '../../services/actividades.service';

Chart.register(...registerables);

interface DashboardStats {
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
  stats: DashboardStats = {
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

  constructor(
    private authService: AuthService,
    private kpisService: KpisService,
    private actividadesService: ActividadesService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
    // Forzar recarga de KPIs para asegurar datos actualizados
    this.refreshKPIsData();
  }

  // Refrescar datos de KPIs
  private async refreshKPIsData(): Promise<void> {
    try {
      console.log('🔄 Refrescando datos de KPIs desde Supabase...');
      
      // Primero calcular KPIs automáticos basándose en datos de obras
      console.log('Calculando KPIs automáticos basándose en datos de obras...');
      await this.kpisService.calculateAllAutomaticKPIs();
      
      // Luego refrescar los datos
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

  // Cargar datos del usuario
  private loadUserData(): void {
    try {
      // Obtener usuario actual
      const user = this.authService.getCurrentUser();
      if (user) {
        this.currentUser = user;
        console.log('Usuario actual cargado:', user.email);
        
        // Obtener perfil del usuario
        const profile = this.authService.getCurrentProfile();
        if (profile) {
          this.userProfile = profile;
          console.log('Perfil del usuario cargado:', profile.rol);
          
          // Cargar datos específicos según el rol después de obtener el perfil
          this.loadRoleSpecificData();
        } else {
          console.warn('No se pudo cargar el perfil del usuario');
          // Suscribirse a cambios en el perfil si no está disponible inmediatamente
          this.authService.currentProfile$
            .pipe(takeUntil(this.destroy$))
            .subscribe(profile => {
              if (profile) {
                this.userProfile = profile;
                console.log('Perfil del usuario cargado desde observable:', profile.rol);
                this.loadRoleSpecificData();
              }
            });
        }
      } else {
        console.warn('No hay usuario autenticado - usando datos por defecto');
        // Sin usuario autenticado, usar valores por defecto
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      // En caso de error, usar valores por defecto
    }
  }

  // Cargar datos del dashboard
  private async loadDashboardData(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Cargar KPIs del dashboard
      this.kpisService.dashboardKPIs$
        .pipe(takeUntil(this.destroy$))
        .subscribe((kpis: any) => {
          this.dashboardKPIs = kpis;
          this.updateStats();
          this.updateCharts();
        });
      
      // Cargar alertas
      this.kpisService.alertas$
        .pipe(takeUntil(this.destroy$))
        .subscribe((alertas: any[]) => {
          this.alertas = alertas;
          this.stats.alertasActivas = alertas.length;
        });
      
      // Cargar estadísticas de actividades
      await this.loadActivityStats();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private loadRoleSpecificData(): void {
    if (!this.userProfile?.rol) {
      console.warn('No se puede cargar datos específicos del rol: perfil no disponible');
      return;
    }

    console.log('Cargando datos específicos para el rol:', this.userProfile.rol);
    // Los datos ahora se cargan desde KpisService, no hay datos hardcodeados por rol
  }







  // Cargar estadísticas de actividades
  private async loadActivityStats(): Promise<void> {
    try {
      const actividades = await this.actividadesService.actividades$.pipe(take(1)).toPromise();
      
      if (actividades) {
        this.stats.totalActividades = actividades.length;
        this.stats.actividadesCompletadas = actividades.filter((a: any) => a.estado === 'finalizado').length;
        this.stats.actividadesEnProgreso = actividades.filter((a: any) => a.estado === 'ejecucion').length;
        
        if (actividades.length > 0) {
          this.stats.progresoPromedio = Math.round(
            (this.stats.actividadesCompletadas / actividades.length) * 100
          );
        }
      }
    } catch (error) {
      console.error('Error loading activity stats:', error);
    }
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

  // Actualizar gráficos
  private updateCharts(): void {
    setTimeout(() => {
      this.createProgressChart();
      this.createKPIChart();
      this.createActivityChart();
      this.createCostChart();
      this.createPlanificacionChart();
    }, 100);
  }

  // Crear gráfico de progreso
  private createProgressChart(): void {
    const canvas = document.getElementById('progressChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.progressChart) {
      this.progressChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const completadas = this.stats.actividadesCompletadas;
    const enProgreso = this.stats.actividadesEnProgreso;
    const pendientes = this.stats.totalActividades - completadas - enProgreso;

    this.progressChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completadas', 'En Progreso', 'Pendientes'],
        datasets: [{
          data: [completadas, enProgreso, pendientes],
          backgroundColor: ['#4caf50', '#2196f3', '#ff9800'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
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
  }

  // Crear gráfico de KPIs
  private createKPIChart(): void {
    const canvas = document.getElementById('kpiChart') as HTMLCanvasElement;
    if (!canvas || !this.dashboardKPIs) return;

    if (this.kpiChart) {
      this.kpiChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const kpisData = [
      { nombre: 'Rendimiento', valor: this.dashboardKPIs.rendimiento.promedio, tendencia: this.dashboardKPIs.rendimiento.tendencia },
      { nombre: 'Calidad', valor: this.dashboardKPIs.calidad.promedio, tendencia: this.dashboardKPIs.calidad.tendencia },
      { nombre: 'Seguridad', valor: this.dashboardKPIs.seguridad.promedio, tendencia: this.dashboardKPIs.seguridad.tendencia },
      { nombre: 'Costo', valor: this.dashboardKPIs.costo.promedio, tendencia: this.dashboardKPIs.costo.tendencia },
      { nombre: 'Tiempo', valor: this.dashboardKPIs.tiempo.promedio, tendencia: this.dashboardKPIs.tiempo.tendencia }
    ];
    const labels = kpisData.map(k => k.nombre);
    const valores = kpisData.map(k => k.valor);
    const colores = kpisData.map(k => {
      if (k.valor >= 90) return '#4caf50';
      if (k.valor >= 70) return '#2196f3';
      if (k.valor >= 50) return '#ff9800';
      return '#f44336';
    });

    this.kpiChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cumplimiento (%)',
          data: valores,
          backgroundColor: colores,
          borderColor: colores,
          borderWidth: 1
        }]
      },
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
  }

  // Crear gráfico de actividades por día
  private createActivityChart(): void {
    const canvas = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.activityChart) {
      this.activityChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generar datos de los últimos 7 días
    const labels = [];
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      labels.push(date.toLocaleDateString('es-ES', { weekday: 'short' }));
      // Datos simulados - en producción vendrían de la base de datos
      data.push(Math.floor(Math.random() * 10) + 1);
    }

    this.activityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Actividades',
          data: data,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
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
  }

  // Crear gráfico de análisis de costos (Presupuesto vs Ejecutado)
  private createCostChart(): void {
    const canvas = document.getElementById('costosChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.costChart) {
      this.costChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // DATOS DE EJEMPLO - En producción estos datos deberían venir de:
    // - Tabla de obras/proyectos con campos: presupuesto_inicial, monto_ejecutado
    // - Tabla de partidas presupuestarias con seguimiento de gastos
    // - Sistema de control de costos con reportes mensuales
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const presupuestado = [850000, 920000, 1100000, 1250000, 1400000, 1550000];
    const ejecutado = [780000, 890000, 1050000, 1180000, 1320000, 1480000];

    this.costChart = new Chart(ctx, {
      type: 'bar',
      data: {
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
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
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
  }

  // Crear gráfico de cronograma de proyectos (Planificación vs Ejecución mensual)
  private createPlanificacionChart(): void {
    const canvas = document.getElementById('planificacionChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.planificacionChart) {
      this.planificacionChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // DATOS DE EJEMPLO - En producción estos datos deberían venir de:
    // - Tabla de actividades con campos: fecha_inicio_planificada, fecha_fin_planificada, fecha_inicio_real, fecha_fin_real
    // - Cronograma maestro con hitos y fechas críticas
    // - Sistema de seguimiento de avance físico vs programado
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const planificado = [15, 28, 42, 58, 75, 90];
    const ejecutado = [12, 25, 38, 52, 68, 85];

    this.planificacionChart = new Chart(ctx, {
      type: 'line',
      data: {
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
      },
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
  refreshData(): void {
    this.loadDashboardData();
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