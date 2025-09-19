import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';

import { ReportesService, ReporteRendimiento, ReportePersonal, ReporteActividades, ReporteKPIs, FiltrosReporte } from '../../services/reportes.service';
import { ReportGeneratorComponent } from '../../components/report-generator/report-generator.component';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterModule,
    ReportGeneratorComponent
  ],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
  // Datos de reportes
  reportesRendimiento: ReporteRendimiento[] = [];
  reportesPersonal: ReportePersonal[] = [];
  reportesActividades: ReporteActividades[] = [];
  reporteKPIs: ReporteKPIs | null = null;

  // Filtros
  filtros: FiltrosReporte = {
    fecha_inicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
    fecha_fin: new Date().toISOString(),
    tipo_reporte: 'rendimiento'
  };

  // Listas para filtros
  obras: any[] = [];
  frentes: any[] = [];
  empleados: any[] = [];

  // Estados de carga
  cargando = false;
  error = '';

  // Configuración de tablas
  dataSourceRendimiento = new MatTableDataSource<ReporteRendimiento>();
  dataSourcePersonal = new MatTableDataSource<ReportePersonal>();
  dataSourceActividades = new MatTableDataSource<ReporteActividades>();

  columnasRendimiento: string[] = ['obra', 'frente', 'actividades_completadas', 'actividades_pendientes', 'progreso_promedio', 'rendimiento_diario', 'acciones'];
  columnasPersonal: string[] = ['empleado', 'rol', 'evaluaciones_completadas', 'puntuacion_promedio', 'ultima_evaluacion', 'acciones'];
  columnasActividades: string[] = ['fecha', 'obra', 'actividad', 'estado', 'progreso', 'responsable', 'acciones'];

  periodos = [
    { valor: 'semana', texto: 'Última Semana' },
    { valor: 'mes', texto: 'Último Mes' },
    { valor: 'trimestre', texto: 'Último Trimestre' },
    { valor: 'año', texto: 'Último Año' }
  ];

  periodoSeleccionado = 'mes';

  @ViewChild('paginatorRendimiento') paginatorRendimiento!: MatPaginator;
  @ViewChild('paginatorPersonal') paginatorPersonal!: MatPaginator;
  @ViewChild('paginatorActividades') paginatorActividades!: MatPaginator;
  @ViewChild('sortRendimiento') sortRendimiento!: MatSort;
  @ViewChild('sortPersonal') sortPersonal!: MatSort;
  @ViewChild('sortActividades') sortActividades!: MatSort;

  constructor(
    private reportesService: ReportesService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
    this.cargarListasFiltros();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';

    Promise.all([
      this.cargarReporteRendimiento(),
      this.cargarReportePersonal(),
      this.cargarReporteActividades(),
      this.cargarReporteKPIs()
    ])
    .then(() => {
      this.cargando = false;
    })
    .catch(error => {
      this.error = 'Error al cargar los reportes: ' + error.message;
      this.cargando = false;
    });
  }

  async cargarReporteRendimiento(): Promise<void> {
    try {
      this.reportesRendimiento = await this.reportesService.getReporteRendimiento(this.filtros);
      this.dataSourceRendimiento.data = this.reportesRendimiento;
      setTimeout(() => {
        if (this.paginatorRendimiento) {
          this.dataSourceRendimiento.paginator = this.paginatorRendimiento;
        }
        if (this.sortRendimiento) {
          this.dataSourceRendimiento.sort = this.sortRendimiento;
        }
      });
    } catch (error) {
      // Error loading reporte de rendimiento
      throw error;
    }
  }

  async cargarReportePersonal(): Promise<void> {
    try {
      this.reportesPersonal = await this.reportesService.getReportePersonal(this.filtros);
      this.dataSourcePersonal.data = this.reportesPersonal;
      setTimeout(() => {
        if (this.paginatorPersonal) {
          this.dataSourcePersonal.paginator = this.paginatorPersonal;
        }
        if (this.sortPersonal) {
          this.dataSourcePersonal.sort = this.sortPersonal;
        }
      });
    } catch (error) {
      // Error loading reporte de personal
      throw error;
    }
  }

  async cargarReporteActividades(): Promise<void> {
    try {
      this.reportesActividades = await this.reportesService.getReporteActividades(this.filtros);
      this.dataSourceActividades.data = this.reportesActividades;
      setTimeout(() => {
        if (this.paginatorActividades) {
          this.dataSourceActividades.paginator = this.paginatorActividades;
        }
        if (this.sortActividades) {
          this.dataSourceActividades.sort = this.sortActividades;
        }
      });
    } catch (error) {
      // Error loading reporte de actividades
      throw error;
    }
  }

  async cargarReporteKPIs(): Promise<void> {
    try {
      this.reporteKPIs = await this.reportesService.getReporteKPIs(this.periodoSeleccionado);
    } catch (error) {
      // Error loading reporte de KPIs
      throw error;
    }
  }

  async cargarListasFiltros(): Promise<void> {
    try {
      this.obras = await this.reportesService.getObras();
      this.frentes = await this.reportesService.getFrente();
      this.empleados = await this.reportesService.getEmpleados();
    } catch (error) {
      // Error al cargar listas para filtros
      this.snackBar.open('Error al cargar datos para filtros', 'Cerrar', { duration: 3000 });
    }
  }

  aplicarFiltros(): void {
    console.log('Aplicando filtros:', this.filtros);
    this.cargarDatos();
  }

  limpiarFiltros(): void {
    this.filtros = {
      fecha_inicio: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
      fecha_fin: new Date().toISOString(),
      tipo_reporte: 'rendimiento'
    };
    console.log('Filtros limpiados');
    this.cargarDatos();
  }

  onPeriodoChange(): void {
    console.log('Periodo cambiado a:', this.periodoSeleccionado);
    this.cargarReporteKPIs();
  }

  async exportarPDF(tipoReporte: string): Promise<void> {
    try {
      console.log(`Iniciando exportación PDF para: ${tipoReporte}`);
      this.cargando = true;
      
      let datos: any[] = [];
      let titulo = '';

      switch (tipoReporte) {
        case 'rendimiento':
          datos = this.reportesRendimiento;
          titulo = 'Reporte de Rendimiento';
          break;
        case 'personal':
          datos = this.reportesPersonal;
          titulo = 'Reporte de Personal';
          break;
        case 'actividades':
          datos = this.reportesActividades;
          titulo = 'Reporte de Actividades';
          break;
        case 'kpis':
          datos = this.reporteKPIs ? [this.reporteKPIs] : [];
          titulo = 'Reporte de KPIs';
          break;
        default:
          throw new Error('Tipo de reporte no válido');
      }

      if (datos.length === 0) {
        this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 3000 });
        return;
      }

      await this.reportesService.exportarPDF(tipoReporte, datos, titulo);
      this.snackBar.open('PDF generado exitosamente', 'Cerrar', { duration: 3000 });
    } catch (error: any) {
      console.error('Error al exportar PDF:', error);
      this.snackBar.open(`Error al generar PDF: ${error.message}`, 'Cerrar', { duration: 5000 });
    } finally {
      this.cargando = false;
    }
  }

  formatearPorcentaje(valor: number): string {
    return `${valor}%`;
  }

  formatearFecha(fecha: string): string {
    if (!fecha || fecha === 'Sin evaluaciones') return fecha;
    try {
      return new Date(fecha).toLocaleDateString('es-ES');
    } catch {
      return fecha;
    }
  }

  formatearFortalezas(fortalezas: string[]): string {
    return fortalezas.join(', ');
  }

  formatearAreasMejora(areas: string[]): string {
    return areas.join(', ');
  }

  getTendenciaIcon(tendencia: string): string {
    switch (tendencia) {
      case 'subiendo': return 'trending_up';
      case 'bajando': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  getTendenciaColor(tendencia: string): string {
    switch (tendencia) {
      case 'subiendo': return 'success';
      case 'bajando': return 'warn';
      default: return 'primary';
    }
  }

  // Métodos adicionales para el template
  obtenerColorTendencia(tendencia: string): string {
    switch (tendencia) {
      case 'subiendo': return '#4caf50'; // Verde
      case 'bajando': return '#f44336'; // Rojo
      default: return '#2196f3'; // Azul
    }
  }

  obtenerIconoTendencia(tendencia: string): string {
    switch (tendencia) {
      case 'subiendo': return 'trending_up';
      case 'bajando': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  obtenerColorProgreso(progreso: number): string {
    if (progreso >= 80) return '#4caf50'; // Verde
    if (progreso >= 60) return '#ff9800'; // Naranja
    if (progreso >= 40) return '#ffc107'; // Amarillo
    return '#f44336'; // Rojo
  }

  cambiarPeriodoKPI(periodo: string): void {
    this.periodoSeleccionado = periodo;
    this.onPeriodoChange();
  }
}