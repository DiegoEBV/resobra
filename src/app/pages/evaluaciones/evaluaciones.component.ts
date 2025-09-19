import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { EvaluacionesService, Evaluacion, RubricaEvaluacion, CriterioEvaluacion, ResumenEvaluacion } from '../../services/evaluaciones.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-evaluaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    MatTooltipModule,
    RouterModule
  ],
  templateUrl: './evaluaciones.component.html',
  styleUrls: ['./evaluaciones.component.css']
})
export class EvaluacionesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Datos
  evaluaciones$: Observable<Evaluacion[]>;
  rubricas$: Observable<RubricaEvaluacion[]>;
  criterios$: Observable<CriterioEvaluacion[]>;
  
  // Tablas
  evaluacionesDataSource = new MatTableDataSource<Evaluacion>();
  resumenDataSource = new MatTableDataSource<ResumenEvaluacion>();
  
  // Columnas de tablas
  evaluacionesColumns: string[] = ['evaluado', 'tipo_evaluacion', 'periodo', 'puntuacion_total', 'calificacion_general', 'estado', 'fecha_evaluacion', 'acciones'];
  resumenColumns: string[] = ['empleado', 'puesto', 'promedio_general', 'evaluaciones_completadas', 'ultima_evaluacion', 'tendencia'];
  
  // Formularios
  evaluacionForm: FormGroup;
  
  // Estados
  loading = false;
  selectedTab = 0;
  empleados: any[] = [];
  rubricas: RubricaEvaluacion[] = [];
  selectedRubrica: RubricaEvaluacion | null = null;
  calificaciones: { [criterio_id: string]: number } = {};
  
  // Filtros
  estadosEvaluacion = [
    { value: '', label: 'Todos los estados' },
    { value: 'borrador', label: 'Borrador' },
    { value: 'completada', label: 'Completada' },
    { value: 'revisada', label: 'Revisada' },
    { value: 'aprobada', label: 'Aprobada' }
  ];
  
  tiposPersonal = [
    { value: 'operario', label: 'Operario' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'ingeniero', label: 'Ingeniero' },
    { value: 'administrativo', label: 'Administrativo' }
  ];

  constructor(
    private evaluacionesService: EvaluacionesService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.evaluaciones$ = this.evaluacionesService.evaluaciones$;
    this.rubricas$ = this.evaluacionesService.rubricas$;
    this.criterios$ = this.evaluacionesService.criterios$;
    
    // Formulario completo con todos los campos de evaluación
    this.evaluacionForm = this.fb.group({
      // Información General
      evaluado_id: ['', Validators.required],
      tipo_evaluacion: ['desempeño', Validators.required],
      periodo: ['', Validators.required],
      fecha_evaluacion: [new Date(), Validators.required],
      
      // Competencias Técnicas
      conocimiento_tecnico: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      obs_conocimiento_tecnico: [''],
      calidad_trabajo: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      obs_calidad_trabajo: [''],
      productividad: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      obs_productividad: [''],
      seguridad_laboral: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      obs_seguridad_laboral: [''],
      
      // Competencias Interpersonales
      trabajo_equipo: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      obs_trabajo_equipo: [''],
      comunicacion: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      obs_comunicacion: [''],
      liderazgo: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      obs_liderazgo: [''],
      adaptabilidad: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      obs_adaptabilidad: [''],
      
      // Competencias Organizacionales
      puntualidad: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      obs_puntualidad: [''],
      iniciativa: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      obs_iniciativa: [''],
      compromiso: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      obs_compromiso: [''],
      resolucion_problemas: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      obs_resolucion_problemas: [''],
      
      // Objetivos y Metas
      objetivos_cumplidos: [''],
      objetivos_pendientes: [''],
      porcentaje_cumplimiento: [''],
      calificacion_general: [''],
      
      // Plan de Desarrollo
      fortalezas: [''],
      areas_mejora: [''],
      recomendaciones_capacitacion: [''],
      objetivos_proximos: [''],
      
      // Comentarios
      comentarios_generales: [''],
      comentarios_empleado: [''],
      
      // Estado y Seguimiento
      estado: ['borrador', Validators.required],
      requiere_seguimiento: ['no']
    });
  }

  async ngOnInit() {
    this.loading = true;
    
    try {
      await this.loadData();
      
      this.evaluaciones$.subscribe(evaluaciones => {
        this.evaluacionesDataSource.data = evaluaciones;
        if (this.paginator) {
          this.evaluacionesDataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.evaluacionesDataSource.sort = this.sort;
        }
      });
      
      this.rubricas$.subscribe(rubricas => {
        this.rubricas = rubricas;
      });
      
    } catch (error) {
      console.error('Error initializing evaluaciones:', error);
      this.showMessage('Error al cargar las evaluaciones');
    } finally {
      this.loading = false;
    }
  }

  async loadData() {
    try {
      this.loading = true;
      
      // Cargar empleados
      const empleados = await this.evaluacionesService.getEmpleadosParaEvaluar();
      this.empleados = empleados;
      
      // Suscribirse a las evaluaciones
      this.evaluacionesService.evaluaciones$.subscribe(evaluaciones => {
        this.evaluacionesDataSource.data = evaluaciones;
      });
      
      // Cargar resumen - usar datos simulados que coincidan con la interfaz
      const resumenData: ResumenEvaluacion[] = [
        {
          empleado_id: '1',
          empleado_nombre: 'Juan Pérez',
          promedio_general: 4.2,
          evaluaciones_completadas: 3,
          ultima_evaluacion: new Date('2024-01-15'),
          tendencia: 'mejorando'
        },
        {
          empleado_id: '2',
          empleado_nombre: 'María García',
          promedio_general: 4.7,
          evaluaciones_completadas: 4,
          ultima_evaluacion: new Date('2024-01-20'),
          tendencia: 'estable'
        }
      ];
      
      this.resumenDataSource.data = resumenData;
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.loading = false;
    }
  }

  // Calcular puntuación total basada en todas las competencias
  getPuntuacionTotal(): number {
    const form = this.evaluacionForm.value;
    const competencias = [
      'conocimiento_tecnico', 'calidad_trabajo', 'productividad', 'seguridad_laboral',
      'trabajo_equipo', 'comunicacion', 'liderazgo', 'adaptabilidad',
      'puntualidad', 'iniciativa', 'compromiso', 'resolucion_problemas'
    ];
    
    const suma = competencias.reduce((total, competencia) => {
      return total + (form[competencia] || 0);
    }, 0);
    
    return suma / competencias.length;
  }

  // Obtener descripción de la puntuación
  getDescripcionPuntuacion(puntuacion: number): string {
    if (puntuacion >= 4.5) return 'Desempeño Excelente';
    if (puntuacion >= 4.0) return 'Desempeño Muy Bueno';
    if (puntuacion >= 3.5) return 'Desempeño Bueno';
    if (puntuacion >= 3.0) return 'Desempeño Regular';
    return 'Desempeño Deficiente';
  }

  // Obtener color según puntuación
  getPuntuacionColor(puntuacion: number): string {
    if (puntuacion >= 4.5) return '#4caf50'; // Verde
    if (puntuacion >= 4.0) return '#8bc34a'; // Verde claro
    if (puntuacion >= 3.5) return '#ffeb3b'; // Amarillo
    if (puntuacion >= 3.0) return '#ff9800'; // Naranja
    return '#f44336'; // Rojo
  }

  // Métodos para el historial
  getCalificacionColor(calificacion: string): string {
    switch (calificacion) {
      case 'excelente': return '#4caf50';
      case 'muy-bueno': return '#8bc34a';
      case 'bueno': return '#ffeb3b';
      case 'regular': return '#ff9800';
      case 'deficiente': return '#f44336';
      default: return '#9e9e9e';
    }
  }

  getCalificacionLabel(calificacion: string): string {
    switch (calificacion) {
      case 'excelente': return 'Excelente';
      case 'muy-bueno': return 'Muy Bueno';
      case 'bueno': return 'Bueno';
      case 'regular': return 'Regular';
      case 'deficiente': return 'Deficiente';
      default: return 'Sin calificar';
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'borrador': return '#9e9e9e';
      case 'completada': return '#2196f3';
      case 'revisada': return '#ff9800';
      case 'aprobada': return '#4caf50';
      default: return '#9e9e9e';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'borrador': return 'Borrador';
      case 'completada': return 'Completada';
      case 'revisada': return 'Revisada';
      case 'aprobada': return 'Aprobada';
      default: return 'Sin estado';
    }
  }

  // Métodos para tendencias
  getTendenciaColor(tendencia: string): string {
    switch (tendencia) {
      case 'mejorando': return '#4caf50';
      case 'estable': return '#2196f3';
      case 'declinando': return '#f44336';
      default: return '#9e9e9e';
    }
  }

  getTendenciaIcon(tendencia: string): string {
    switch (tendencia) {
      case 'mejorando': return 'trending_up';
      case 'estable': return 'trending_flat';
      case 'declinando': return 'trending_down';
      default: return 'help';
    }
  }

  getTendenciaLabel(tendencia: string): string {
    switch (tendencia) {
      case 'mejorando': return 'Mejorando';
      case 'estable': return 'Estable';
      case 'declinando': return 'Declinando';
      default: return 'Sin datos';
    }
  }

  async onSubmitEvaluacion() {
    if (this.evaluacionForm.valid) {
      this.loading = true;
      
      try {
        const formValue = this.evaluacionForm.value;
        const puntuacionTotal = this.getPuntuacionTotal();
        
        const evaluacionData = {
          ...formValue,
          puntuacion_total: puntuacionTotal,
          fecha_evaluacion: formValue.fecha_evaluacion.toISOString().split('T')[0]
        };
        
        console.log('Guardando evaluación:', evaluacionData);
        
        // Llamar al servicio real para guardar la evaluación
        const evaluacionGuardada = await this.evaluacionesService.createEvaluacion(evaluacionData);
        
        console.log('Evaluación guardada exitosamente:', evaluacionGuardada);
        this.showMessage('✅ Evaluación guardada exitosamente', 'success');
        this.resetForm();
        await this.loadData();
        
      } catch (error) {
        console.error('Error al guardar evaluación:', error);
        this.showMessage('❌ Error al guardar la evaluación: ' + (error as any).message, 'error');
      } finally {
        this.loading = false;
      }
    } else {
      this.showMessage('Por favor, complete todos los campos requeridos', 'error');
    }
  }

  async guardarBorrador() {
    this.evaluacionForm.patchValue({ estado: 'borrador' });
    await this.onSubmitEvaluacion();
  }

  resetForm() {
    this.evaluacionForm.reset();
    this.evaluacionForm.patchValue({
      fecha_evaluacion: new Date(),
      tipo_evaluacion: 'desempeño',
      estado: 'borrador',
      requiere_seguimiento: 'no',
      // Resetear todas las calificaciones a 3
      conocimiento_tecnico: 3,
      calidad_trabajo: 3,
      productividad: 3,
      seguridad_laboral: 3,
      trabajo_equipo: 3,
      comunicacion: 3,
      liderazgo: 3,
      adaptabilidad: 3,
      puntualidad: 3,
      iniciativa: 3,
      compromiso: 3,
      resolucion_problemas: 3
    });
  }

  refreshData() {
    this.loadData();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.evaluacionesDataSource.filter = filterValue.trim().toLowerCase();
  }

  // Métodos para acciones del historial
  verDetalleEvaluacion(evaluacion: any) {
    console.log('Ver detalle de evaluación:', evaluacion);
    this.showMessage('Funcionalidad de detalle en desarrollo');
  }

  editarEvaluacion(evaluacion: any) {
    console.log('Editar evaluación:', evaluacion);
    this.showMessage('Funcionalidad de edición en desarrollo');
  }

  generarReporte(evaluacion: any) {
    console.log('Generar reporte de evaluación:', evaluacion);
    this.showMessage('Funcionalidad de reporte en desarrollo');
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: type === 'error' ? 'error-snackbar' : 
                 type === 'success' ? 'success-snackbar' : 'info-snackbar'
    });
  }

  // Métodos heredados del código original (mantenidos para compatibilidad)
  onRubricaChange() {
    // Método mantenido para compatibilidad
  }

  getCalificacion(criterioId: string): number {
    return this.calificaciones[criterioId] || 0;
  }

  onCalificacionChange(criterioId: string, valor: number) {
    this.calificaciones[criterioId] = valor;
  }
}