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
import { Subject, takeUntil } from 'rxjs';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

import { KilometrosService } from '../../services/kilometros.service';
import { FrentesService } from '../../services/frentes.service';
import { ActividadesService } from '../../services/actividades.service';
import { Frente } from '../../interfaces/frente.interface';
import { Kilometro } from '../../interfaces/kilometro.interface';
import { Actividad } from '../../interfaces/actividad.interface';

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
    private actividadesService: ActividadesService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  private async loadDashboardData(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Cargar frentes
      await this.loadFrente();
      
      // Cargar métricas kilométricas
      await this.loadMetricasKilometricas();
      
      // Cargar estadísticas por estado
      await this.loadEstadisticasPorEstado();
      
      // Cargar progreso kilométrico
      await this.loadProgresoKilometrico();
      
      // Cargar tendencia de progreso
      await this.loadTendenciaProgreso();
      
      // Crear gráficos
      setTimeout(() => {
        this.createCharts();
      }, 100);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadFrente(): Promise<void> {
    try {
      this.frentes = await this.frentesService.getFrente().toPromise() || [];
    } catch (error) {
      console.error('Error loading frentes:', error);
      this.frentes = [];
    }
  }

  private async loadMetricasKilometricas(): Promise<void> {
    try {
      // Obtener todos los kilómetros
      const kilometros = await this.kilometrosService.getKilometros().toPromise() || [];
      
      // Filtrar por frente si está seleccionado
      const kilometrosFiltrados = this.frenteSeleccionado === 'todos' 
        ? kilometros 
        : kilometros.filter(k => k.frente_id === this.frenteSeleccionado);
      
      // Calcular métricas
      this.metricas.totalKilometros = kilometrosFiltrados.length;
      this.metricas.kilometrosCompletados = kilometrosFiltrados.filter(k => k.estado === 'completado').length;
      this.metricas.kilometrosEnProgreso = kilometrosFiltrados.filter(k => k.estado === 'en_progreso').length;
      this.metricas.kilometrosPendientes = kilometrosFiltrados.filter(k => k.estado === 'pendiente').length;
      
      // Calcular progreso promedio
      if (kilometrosFiltrados.length > 0) {
        const progresoTotal = kilometrosFiltrados.reduce((sum, k) => sum + (k.progreso_porcentaje || 0), 0);
        this.metricas.progresoPromedio = Math.round(progresoTotal / kilometrosFiltrados.length);
      }
      
      // Obtener actividades relacionadas
      const actividades = await this.actividadesService.getActividades().toPromise() || [];
      const actividadesKilometricas = actividades.filter(a => a.kilometro !== null && a.kilometro !== undefined);
      
      this.metricas.actividadesTotales = actividadesKilometricas.length;
      this.metricas.actividadesCompletadas = actividadesKilometricas.filter(a => a.estado === 'completada').length;
      
      // Contar frentes activos (que tienen kilómetros)
      const frentesConKilometros = new Set(kilometrosFiltrados.map(k => k.frente_id));
      this.metricas.frentesActivos = frentesConKilometros.size;
      
      // Calcular alertas (kilómetros con progreso bajo)
      this.metricas.alertasKilometricas = kilometrosFiltrados.filter(k => 
        k.estado === 'en_progreso' && (k.progreso_porcentaje || 0) < 30
      ).length;
      
    } catch (error) {
      console.error('Error loading métricas kilométricas:', error);
    }
  }

  private async loadEstadisticasPorEstado(): Promise<void> {
    try {
      const kilometros = await this.kilometrosService.getKilometros().toPromise() || [];
      
      // Filtrar por frente si está seleccionado
      const kilometrosFiltrados = this.frenteSeleccionado === 'todos' 
        ? kilometros 
        : kilometros.filter(k => k.frente_id === this.frenteSeleccionado);
      
      // Contar por estado
      const estadosCount = kilometrosFiltrados.reduce((acc, k) => {
        acc[k.estado] = (acc[k.estado] || 0) + 1;
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
      
    } catch (error) {
      console.error('Error loading estadísticas por estado:', error);
    }
  }

  private async loadProgresoKilometrico(): Promise<void> {
    try {
      const kilometros = await this.kilometrosService.getKilometros().toPromise() || [];
      
      // Filtrar por frente si está seleccionado
      const kilometrosFiltrados = this.frenteSeleccionado === 'todos' 
        ? kilometros 
        : kilometros.filter(k => k.frente_id === this.frenteSeleccionado);
      
      // Obtener actividades para contar por kilómetro
      const actividades = await this.actividadesService.getActividades().toPromise() || [];
      
      this.progresoKilometrico = kilometrosFiltrados.map(k => {
        const actividadesKm = actividades.filter(a => a.kilometro === k.kilometro);
        const frente = this.frentes.find(f => f.id === k.frente_id);
        
        return {
          kilometro: k.kilometro,
          progreso: k.progreso_porcentaje || 0,
          actividades: actividadesKm.length,
          estado: k.estado,
          frente: frente?.nombre || 'Sin frente'
        };
      }).sort((a, b) => a.kilometro - b.kilometro);
      
    } catch (error) {
      console.error('Error loading progreso kilométrico:', error);
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