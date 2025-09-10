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
        
        this.showMessage('Evaluación creada exitosamente');
        this.resetForm();
        await this.loadData();
        
      } catch (error) {
        console.error('Error creating evaluacion:', error);
        this.showMessage('Error al crear la evaluación');
      } finally {
        this.loading = false;
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
    if (puntuacion >= 90) return '#4caf50';
    if (puntuacion >= 80) return '#8bc34a';
    if (puntuacion >= 70) return '#ffeb3b';
    if (puntuacion >= 60) return '#ff9800';
    return '#f44336';
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
      'borrador': '#9e9e9e',
      'completada': '#2196f3',
      'revisada': '#ff9800',
      'aprobada': '#4caf50'
    };
    return colors[estado] || '#9e9e9e';
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
      'mejorando': '#4caf50',
      'estable': '#ff9800',
      'declinando': '#f44336'
    };
    return colors[tendencia] || '#ff9800';
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

  private showMessage(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}