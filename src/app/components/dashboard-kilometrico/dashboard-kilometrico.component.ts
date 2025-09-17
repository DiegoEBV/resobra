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
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

import { KilometrosService } from '../../services/kilometros.service';
import { FrentesService } from '../../services/frentes.service';
import { ActividadesService } from '../../services/actividades.service';
import { TareasService } from '../../services/tareas.service';
import { Frente, Kilometro, Actividad } from '../../interfaces/database.interface';

Chart.register(...registerables);

interface MetricasKilometricas {
  totalKilometros: number;
  kilometrosCompletados: number;
  kilometrosEnProgreso: number;
  kilometrosPendientes: number;
  progresoPromedio: number;
  actividadesTotales: number;
  actividadesCompletadas: number;
  frentesActivos: number;
  alertasKilometricas: number;
}

interface EstadisticasPorEstado {
  estado: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

interface ProgresoKilometrico {
  kilometro: number;
  progreso: number;
  actividades: number;
  estado: string;
  frente: string;
}

@Component({
  selector: 'app-dashboard-kilometrico',
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
    MatSelectModule,
    MatFormFieldModule,
    RouterModule
  ],
  templateUrl: './dashboard-kilometrico.component.html',
  styleUrls: ['./dashboard-kilometrico.component.css']
})
export class DashboardKilometricoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Estado de carga
  isLoading = true;
  
  // Datos principales
  metricas: MetricasKilometricas = {
    totalKilometros: 0,
    kilometrosCompletados: 0,
    kilometrosEnProgreso: 0,
    kilometrosPendientes: 0,
    progresoPromedio: 0,
    actividadesTotales: 0,
    actividadesCompletadas: 0,
    frentesActivos: 0,
    alertasKilometricas: 0
  };
  
  // Datos para visualizaciones
  estadisticasPorEstado: EstadisticasPorEstado[] = [];
  progresoKilometrico: ProgresoKilometrico[] = [];
  
  // Filtros
  frenteSeleccionado: string = 'todos';
  frentes: Frente[] = [];
  
  // Gráficos
  private estadosChart: Chart | null = null;
  private progresoChart: Chart | null = null;
  private tendenciaChart: Chart | null = null;
  
  // Datos de tendencia (últimos 7 días)
  tendenciaProgreso: { fecha: string; progreso: number }[] = [];
  
  constructor(
    private kilometrosService: KilometrosService,
    private frentesService: FrentesService,
    private actividadesService: ActividadesService,
    private tareasService: TareasService
  ) {
    // Dashboard Kilométrico initialized
  }

  ngOnInit(): void {
    console.log('🚀 [DashboardKilometrico] ngOnInit ejecutado - iniciando carga de datos');
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  private async loadDashboardData(): Promise<void> {
    try {
      console.log('🔄 [Dashboard] Iniciando carga de datos del dashboard kilométrico');
      this.isLoading = true;
      
      // Cargar datos en paralelo
      await Promise.all([
        this.loadFrente(),
        this.loadMetricasKilometricas(),
        this.loadEstadisticasPorEstado(),
        this.loadProgresoKilometrico(),
        this.loadTendenciaProgreso()
      ]);
      
      // Datos cargados
      
      // Crear gráficos después de cargar los datos
      setTimeout(() => {
        this.createCharts();
      }, 100);
      
    } catch (error) {
      // Error cargando datos
    } finally {
      this.isLoading = false;
    }
  }

  private async loadFrente(): Promise<void> {
    try {
      console.log('🔄 [Dashboard] Cargando frentes...');
      this.frentes = await firstValueFrom(this.frentesService.getFrente()) || [];
      console.log('✅ [Dashboard] Frentes cargados:', this.frentes.length, this.frentes);
    } catch (error) {
      console.error('❌ [Dashboard] Error loading frentes:', error);
      this.frentes = [];
    }
  }

  private async loadMetricasKilometricas(): Promise<void> {
    try {
      console.log('📊 [DashboardKilometrico] Cargando métricas kilométricas basadas en tareas');
      
      // Obtener kilómetros usando Observable
      this.kilometrosService.getKilometros().subscribe({
        next: async (kilometros) => {
          // Filtrar por frente si está seleccionado
          const kilometrosFiltrados = this.frenteSeleccionado === 'todos' 
            ? kilometros 
            : kilometros.filter((k: any) => k.frente_id === this.frenteSeleccionado);
          
          try {
            // Obtener actividades
            const actividades = await this.actividadesService.getActividades() || [];
            
            // Calcular métricas para cada kilómetro basado en tareas
            const metricasPromises = kilometrosFiltrados.map(async (k: any) => {
              const actividadesKm = actividades.filter((a: any) => a.kilometro === k.kilometro);
              
              if (actividadesKm.length === 0) {
                return {
                  progreso: 0,
                  estado: 'pendiente'
                };
              }
              
              // Calcular progreso promedio de las actividades del kilómetro
              const progresosActividades = await Promise.all(
                actividadesKm.map(async (actividad: any) => {
                  try {
                    const estadisticas = await this.tareasService.getEstadisticasTareas(actividad.id);
                    return estadisticas.progreso;
                  } catch (error) {
                    return actividad.progreso_porcentaje || 0;
                  }
                })
              );
              
              const progresoPromedio = progresosActividades.length > 0 
                ? progresosActividades.reduce((sum, p) => sum + p, 0) / progresosActividades.length
                : 0;
              
              // Determinar estado basado en el progreso
              let estado = 'pendiente';
              if (progresoPromedio === 0) {
                estado = 'pendiente';
              } else if (progresoPromedio >= 100) {
                estado = 'completado';
              } else {
                estado = 'en_progreso';
              }
              
              return {
                progreso: progresoPromedio,
                estado: estado
              };
            });
            
            const metricas = await Promise.all(metricasPromises);
            
            // Calcular métricas finales
            this.metricas.totalKilometros = kilometrosFiltrados.length;
            this.metricas.kilometrosCompletados = metricas.filter(m => m.estado === 'completado').length;
            this.metricas.kilometrosEnProgreso = metricas.filter(m => m.estado === 'en_progreso').length;
            this.metricas.kilometrosPendientes = metricas.filter(m => m.estado === 'pendiente').length;
            
            // Calcular progreso promedio
            if (metricas.length > 0) {
              const progresoTotal = metricas.reduce((sum, m) => sum + m.progreso, 0);
              this.metricas.progresoPromedio = Math.round(progresoTotal / metricas.length);
            }
            
            // Obtener actividades relacionadas
            const actividadesKilometricas = actividades.filter((a: any) => a.kilometro !== null && a.kilometro !== undefined);
            
            this.metricas.actividadesTotales = actividadesKilometricas.length;
            this.metricas.actividadesCompletadas = actividadesKilometricas.filter((a: any) => a.estado === 'finalizado').length;
            
            // Contar frentes activos (que tienen kilómetros)
            const frentesConKilometros = new Set(kilometrosFiltrados.map((k: any) => k.frente_id));
            this.metricas.frentesActivos = frentesConKilometros.size;
            
            // Calcular alertas (kilómetros con progreso bajo)
            this.metricas.alertasKilometricas = metricas.filter(m => 
              m.estado === 'en_progreso' && m.progreso < 30
            ).length;
            
            console.log('✅ [DashboardKilometrico] Métricas kilométricas calculadas:', this.metricas);
          } catch (error) {
            console.error('❌ [DashboardKilometrico] Error calculando métricas:', error);
          }
        },
        error: (error) => {
          console.error('❌ [DashboardKilometrico] Error loading métricas kilométricas:', error);
        }
      });
    } catch (error) {
      console.error('❌ [DashboardKilometrico] Error in loadMetricasKilometricas:', error);
    }
  }

  private async loadEstadisticasPorEstado(): Promise<void> {
    try {
      console.log('📊 [DashboardKilometrico] Cargando estadísticas por estado basadas en tareas');
      
      // Obtener kilómetros usando Observable
      this.kilometrosService.getKilometros().subscribe({
        next: async (kilometros) => {
          // Filtrar por frente si está seleccionado
          const kilometrosFiltrados = this.frenteSeleccionado === 'todos' 
            ? kilometros 
            : kilometros.filter((k: any) => k.frente_id === this.frenteSeleccionado);
          
          try {
            // Obtener actividades
            const actividades = await this.actividadesService.getActividades() || [];
            
            // Calcular estado para cada kilómetro basado en tareas
            const estadosPromises = kilometrosFiltrados.map(async (k: any) => {
              const actividadesKm = actividades.filter((a: any) => a.kilometro === k.kilometro);
              
              if (actividadesKm.length === 0) {
                return 'pendiente';
              }
              
              // Calcular progreso promedio de las actividades del kilómetro
              const progresosActividades = await Promise.all(
                actividadesKm.map(async (actividad: any) => {
                  try {
                    const estadisticas = await this.tareasService.getEstadisticasTareas(actividad.id);
                    return estadisticas.progreso;
                  } catch (error) {
                    return actividad.progreso_porcentaje || 0;
                  }
                })
              );
              
              const progresoPromedio = progresosActividades.length > 0 
                ? progresosActividades.reduce((sum, p) => sum + p, 0) / progresosActividades.length
                : 0;
              
              // Determinar estado basado en el progreso
              if (progresoPromedio === 0) {
                return 'pendiente';
              } else if (progresoPromedio >= 100) {
                return 'completado';
              } else {
                return 'en_progreso';
              }
            });
            
            const estados = await Promise.all(estadosPromises);
            
            // Contar por estado
            const estadosCount = estados.reduce((acc, estado) => {
              acc[estado] = (acc[estado] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            // Convertir a array con colores
            const colores = {
              'pendiente': '#ff9800',
              'en_progreso': '#2196f3',
              'completado': '#4caf50',
              'pausado': '#f44336'
            };
            
            this.estadisticasPorEstado = Object.entries(estadosCount).map(([estado, cantidad]) => ({
              estado: this.getEstadoLabel(estado),
              cantidad,
              porcentaje: Math.round((cantidad / kilometrosFiltrados.length) * 100),
              color: colores[estado as keyof typeof colores] || '#9e9e9e'
            }));
            
            console.log('✅ [DashboardKilometrico] Estadísticas por estado calculadas:', estadosCount);
          } catch (error) {
            console.error('❌ [DashboardKilometrico] Error calculando estadísticas:', error);
          }
        },
        error: (error) => {
          console.error('❌ [DashboardKilometrico] Error loading estadísticas por estado:', error);
        }
      });
    } catch (error) {
      console.error('❌ [DashboardKilometrico] Error in loadEstadisticasPorEstado:', error);
    }
  }

  private async loadProgresoKilometrico(): Promise<void> {
    try {
      console.log('📊 [DashboardKilometrico] Cargando progreso kilométrico con cálculo basado en tareas');
      
      // Obtener kilómetros usando Observable
      this.kilometrosService.getKilometros().subscribe({
        next: async (kilometros) => {
          // Filtrar por frente si está seleccionado
          const kilometrosFiltrados = this.frenteSeleccionado === 'todos' 
            ? kilometros 
            : kilometros.filter((k: any) => k.frente_id === this.frenteSeleccionado);
          
          try {
            // Obtener actividades usando Promise
            const actividades = await this.actividadesService.getActividades() || [];
            
            // Calcular progreso para cada kilómetro basado en tareas
            const progresoPromises = kilometrosFiltrados.map(async (k: any) => {
              const actividadesKm = actividades.filter((a: any) => a.kilometro === k.kilometro);
              const frente = this.frentes.find((f: any) => f.id === k.frente_id);
              
              // Calcular progreso promedio basado en tareas de todas las actividades del kilómetro
              let progresoPromedio = 0;
              let estadoCalculado = 'pendiente';
              
              if (actividadesKm.length > 0) {
                const progresosActividades = await Promise.all(
                  actividadesKm.map(async (actividad: any) => {
                    try {
                      const estadisticas = await this.tareasService.getEstadisticasTareas(actividad.id);
                      return estadisticas.progreso;
                    } catch (error) {
                      console.warn(`No se pudieron obtener tareas para actividad ${actividad.id}:`, error);
                      return actividad.progreso_porcentaje || 0;
                    }
                  })
                );
                
                progresoPromedio = progresosActividades.length > 0 
                  ? Math.round(progresosActividades.reduce((sum, p) => sum + p, 0) / progresosActividades.length)
                  : 0;
                
                // Calcular estado basado en el progreso promedio
                if (progresoPromedio === 0) {
                  estadoCalculado = 'pendiente';
                } else if (progresoPromedio >= 100) {
                  estadoCalculado = 'completado';
                } else {
                  estadoCalculado = 'en_progreso';
                }
              }
              
              console.log(`📊 [DashboardKilometrico] KM ${k.kilometro}: ${actividadesKm.length} actividades, progreso: ${progresoPromedio}%, estado: ${estadoCalculado}`);
              
              return {
                kilometro: k.kilometro,
                progreso: progresoPromedio,
                actividades: actividadesKm.length,
                estado: estadoCalculado,
                frente: frente?.nombre || 'Sin frente'
              };
            });
            
            this.progresoKilometrico = (await Promise.all(progresoPromises))
              .sort((a: any, b: any) => a.kilometro - b.kilometro);
              
            console.log('✅ [DashboardKilometrico] Progreso kilométrico calculado:', this.progresoKilometrico);
          } catch (error) {
            console.error('❌ [DashboardKilometrico] Error loading actividades:', error);
          }
        },
        error: (error) => {
          console.error('❌ [DashboardKilometrico] Error loading progreso kilométrico:', error);
        }
      });
    } catch (error) {
      console.error('❌ [DashboardKilometrico] Error in loadProgresoKilometrico:', error);
    }
  }

  private async loadTendenciaProgreso(): Promise<void> {
    try {
      // Simular datos de tendencia (en una implementación real, esto vendría de la base de datos)
      const fechas = [];
      const hoy = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - i);
        fechas.push({
          fecha: fecha.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
          progreso: Math.round(this.metricas.progresoPromedio - (i * 2) + Math.random() * 5)
        });
      }
      
      this.tendenciaProgreso = fechas;
      
    } catch (error) {
      console.error('Error loading tendencia progreso:', error);
    }
  }

  private createCharts(): void {
    this.createEstadosChart();
    this.createProgresoChart();
    this.createTendenciaChart();
  }

  private createEstadosChart(): void {
    const canvas = document.getElementById('estadosChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.estadosChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: this.estadisticasPorEstado.map(e => e.estado),
        datasets: [{
          data: this.estadisticasPorEstado.map(e => e.cantidad),
          backgroundColor: this.estadisticasPorEstado.map(e => e.color),
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

  private createProgresoChart(): void {
    const canvas = document.getElementById('progresoChart') as HTMLCanvasElement;
    if (!canvas) return;

    const colores = this.progresoKilometrico.map(p => {
      if (p.progreso >= 80) return '#4caf50';
      if (p.progreso >= 50) return '#2196f3';
      if (p.progreso >= 20) return '#ff9800';
      return '#f44336';
    });

    this.progresoChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.progresoKilometrico.map(p => `KM ${p.kilometro}`),
        datasets: [{
          label: 'Progreso (%)',
          data: this.progresoKilometrico.map(p => p.progreso),
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
          },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const index = context.dataIndex;
                const item = this.progresoKilometrico[index];
                return [
                  `Actividades: ${item.actividades}`,
                  `Estado: ${this.getEstadoLabel(item.estado)}`,
                  `Frente: ${item.frente}`
                ];
              }
            }
          }
        }
      }
    });
  }

  private createTendenciaChart(): void {
    const canvas = document.getElementById('tendenciaChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.tendenciaChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.tendenciaProgreso.map(t => t.fecha),
        datasets: [{
          label: 'Progreso Promedio (%)',
          data: this.tendenciaProgreso.map(t => t.progreso),
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#1976d2',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
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

  private destroyCharts(): void {
    if (this.estadosChart) {
      this.estadosChart.destroy();
      this.estadosChart = null;
    }
    if (this.progresoChart) {
      this.progresoChart.destroy();
      this.progresoChart = null;
    }
    if (this.tendenciaChart) {
      this.tendenciaChart.destroy();
      this.tendenciaChart = null;
    }
  }

  // Métodos de utilidad
  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      'pendiente': 'Pendiente',
      'en_progreso': 'En Progreso',
      'completado': 'Completado',
      'pausado': 'Pausado'
    };
    return labels[estado] || estado;
  }

  getEstadoColor(estado: string): string {
    const colores: Record<string, string> = {
      'pendiente': '#ff9800',
      'en_progreso': '#2196f3',
      'completado': '#4caf50',
      'pausado': '#f44336'
    };
    return colores[estado] || '#9e9e9e';
  }

  getProgressColor(progreso: number): string {
    if (progreso >= 80) return 'primary';
    if (progreso >= 50) return 'accent';
    if (progreso >= 20) return 'warn';
    return 'warn';
  }

  // Eventos
  onFrenteChange(): void {
    this.loadDashboardData();
  }

  refreshData(): void {
    // Refrescando datos
    this.loadDashboardData();
  }

  exportData(): void {
    // Implementar exportación de datos
    console.log('Exportando datos kilométricos...');
  }

  viewKilometroDetails(kilometro: number): void {
    // Navegar a detalles del kilómetro
    console.log('Ver detalles del kilómetro:', kilometro);
  }
}