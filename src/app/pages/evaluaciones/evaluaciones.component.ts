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
  evaluacionesColumns: string[] = ['evaluado', 'periodo', 'puntuacion_total', 'estado', 'fecha_evaluacion', 'acciones'];
  resumenColumns: string[] = ['empleado', 'puesto', 'promedio_general', 'evaluaciones_completadas', 'ultima_evaluacion', 'tendencia', 'acciones'];
  
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
    
    this.evaluacionForm = this.fb.group({
      evaluado_id: ['', Validators.required],
      rubrica_id: ['', Validators.required],
      periodo: ['', Validators.required],
      fecha_evaluacion: [new Date(), Validators.required],
      comentarios_generales: [''],
      estado: ['borrador', Validators.required]
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

  private async loadData() {
    try {
      const [empleados, resumen] = await Promise.all([
        this.evaluacionesService.getEmpleadosParaEvaluar(),
        this.evaluacionesService.getResumenEvaluaciones()
      ]);
      
      this.empleados = empleados;
      this.resumenDataSource.data = resumen;
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async onSubmitEvaluacion() {
    if (this.evaluacionForm.valid && this.selectedRubrica) {
      // Validar que se hayan ingresado calificaciones
      if (!this.calificaciones || Object.keys(this.calificaciones).length === 0) {
        this.showMessage('Por favor, ingrese las calificaciones para todos los criterios', 'error');
        return;
      }

      // Validar que todas las calificaciones estén completas
      const criteriosSinCalificar = this.selectedRubrica.criterios.filter(
        criterio => !this.calificaciones[criterio.id] || this.calificaciones[criterio.id] === 0
      );
      
      if (criteriosSinCalificar.length > 0) {
        this.showMessage(`Faltan calificaciones para: ${criteriosSinCalificar.map(c => c.nombre).join(', ')}`, 'error');
        return;
      }

      this.loading = true;
      
      try {
        const formValue = this.evaluacionForm.value;
        const puntuacionTotal = this.evaluacionesService.calcularPuntuacionTotal(
          this.calificaciones, 
          this.selectedRubrica.criterios
        );
        
        const evaluacionData = {
          ...formValue,
          calificaciones: this.calificaciones,
          puntuacion_total: puntuacionTotal,
          fecha_evaluacion: formValue.fecha_evaluacion.toISOString().split('T')[0]
        };
        
        await this.evaluacionesService.createEvaluacion(evaluacionData);
        
        this.showMessage('✅ Evaluación guardada exitosamente', 'success');
        this.resetForm();
        await this.loadData();
        
      } catch (error: any) {
        console.error('Error creating evaluacion:', error);
        
        // Mostrar mensaje de error específico
        const errorMessage = error.message || 'Error desconocido al crear la evaluación';
        this.showMessage(`❌ ${errorMessage}`, 'error');
      } finally {
        this.loading = false;
      }
    } else {
      // Validar campos del formulario
      if (!this.evaluacionForm.valid) {
        this.showMessage('Por favor, complete todos los campos requeridos', 'error');
        return;
      }
      
      if (!this.selectedRubrica) {
        this.showMessage('Por favor, seleccione una rúbrica de evaluación', 'error');
        return;
      }
    }
  }

  onRubricaChange() {
    const rubricaId = this.evaluacionForm.get('rubrica_id')?.value;
    this.selectedRubrica = this.rubricas.find(r => r.id === rubricaId) || null;
    this.calificaciones = {};
  }

  onCalificacionChange(criterioId: string, valor: number) {
    this.calificaciones[criterioId] = valor;
  }

  getCalificacion(criterioId: string): number {
    return this.calificaciones[criterioId] || 0;
  }

  getPuntuacionTotal(): number {
    if (!this.selectedRubrica) return 0;
    return this.evaluacionesService.calcularPuntuacionTotal(
      this.calificaciones, 
      this.selectedRubrica.criterios
    );
  }

  getPuntuacionColor(puntuacion: number): string {
    if (puntuacion >= 90) return '#10B981';
    if (puntuacion >= 80) return '#7DD3FC';
    if (puntuacion >= 70) return '#FCD34D';
    if (puntuacion >= 60) return '#F59E0B';
    return '#DC2626';
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'borrador': 'Borrador',
      'completada': 'Completada',
      'revisada': 'Revisada',
      'aprobada': 'Aprobada'
    };
    return labels[estado] || estado;
  }

  getEstadoColor(estado: string): string {
    const colors: { [key: string]: string } = {
      'borrador': '#6B7280',
      'completada': '#2D9596',
      'revisada': '#F59E0B',
      'aprobada': '#10B981'
    };
    return colors[estado] || '#6B7280';
  }

  getTendenciaIcon(tendencia: string): string {
    const icons: { [key: string]: string } = {
      'mejorando': 'trending_up',
      'estable': 'trending_flat',
      'declinando': 'trending_down'
    };
    return icons[tendencia] || 'trending_flat';
  }

  getTendenciaColor(tendencia: string): string {
    const colors: { [key: string]: string } = {
      'mejorando': '#10B981',
      'estable': '#F59E0B',
      'declinando': '#DC2626'
    };
    return colors[tendencia] || '#F59E0B';
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.evaluacionesDataSource.filter = filterValue.trim().toLowerCase();
  }

  resetForm() {
    this.evaluacionForm.reset({
      estado: 'borrador',
      fecha_evaluacion: new Date()
    });
    this.selectedRubrica = null;
    this.calificaciones = {};
  }

  async refreshData() {
    this.loading = true;
    try {
      await this.evaluacionesService.refresh();
      await this.loadData();
      this.showMessage('Datos actualizados');
    } catch (error) {
      console.error('Error refreshing data:', error);
      this.showMessage('Error al actualizar los datos');
    } finally {
      this.loading = false;
    }
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const config = {
      duration: type === 'error' ? 5000 : 3000,
      horizontalPosition: 'end' as const,
      verticalPosition: 'top' as const,
      panelClass: [
        type === 'success' ? 'success-snackbar' : 
        type === 'error' ? 'error-snackbar' : 'info-snackbar'
      ]
    };

    this.snackBar.open(message, 'Cerrar', config);
  }
}