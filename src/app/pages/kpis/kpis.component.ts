import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { KpisService, KPI } from '../../services/kpis.service';
import { AuthService } from '../../services/auth.service';
import { DirectAuthService } from '../../services/direct-auth.service';
import { ObrasService } from '../../services/obras.service';
import { Obra } from '../../interfaces/database.interface';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-kpis',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule
  ],
  templateUrl: './kpis.component.html',
  styleUrls: ['./kpis.component.css']
})
export class KpisComponent implements OnInit {
  kpiForm!: FormGroup;
  kpis: KPI[] = [];
  obras: Obra[] = [];
  actividades: any[] = [];
  loading = false;
  submitting = false;
  editingKpi: KPI | null = null;
  displayedColumns: string[] = ['obra', 'actividad', 'fecha', 'estado', 'avance_fisico', 'productividad', 'calidad', 'personal_asignado', 'costos', 'desviacion_cronograma', 'incidentes_seguridad', 'actions'];
  dataSource = new MatTableDataSource(this.kpis);

  constructor(
    private fb: FormBuilder,
    private kpisService: KpisService,
    private obrasService: ObrasService,
    public directAuthService: DirectAuthService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  private initializeForm() {
    this.kpiForm = this.fb.group({
      // Información General
      obra_id: ['', Validators.required],
      actividad_id: [{value: '', disabled: true}],
      fecha: [new Date(), Validators.required],
      estado: ['activo', Validators.required],
      
      // Métricas de Rendimiento
      avance_fisico: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      productividad: [0, [Validators.required, Validators.min(0)]],
      personal_asignado: [0, [Validators.required, Validators.min(0)]],
      maquinaria_utilizada: [''],
      
      // Calidad y Seguridad
      calidad: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      incidentes_seguridad: [0, [Validators.min(0)]],
      clima_condiciones: [''],
      
      // Cronograma y Costos
      desviacion_cronograma: [0, [Validators.required]],
      costo_ejecutado: [0, [Validators.required, Validators.min(0)]],
      costo_presupuestado: [0, [Validators.required, Validators.min(0)]],
      
      // Observaciones
      observaciones_tecnicas: [''],
      metricas_adicionales: ['']
    });
  }

  ngOnInit() {
    // Verificar autenticación al cargar el componente
    const currentUser = this.directAuthService.getCurrentUser();
    if (!currentUser) {
      this.showMessage('Debe iniciar sesión para acceder a los KPIs. Redirigiendo al login...');
      // Opcional: redirigir al login después de un breve delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    this.loadObras();
    this.setupKpisSubscription();
  }

  private setupKpisSubscription(): void {
    this.loading = true;
    // Suscripción única al observable de KPIs
    this.kpisService.kpis$.subscribe({
      next: (kpis) => {
        this.kpis = kpis;
        this.dataSource.data = this.kpis;
        this.loading = false;
      },
      error: (error) => {
        // Error loading KPIs
        this.showMessage('Error al cargar los KPIs');
        this.loading = false;
      }
    });
  }

  loadObras(): void {
    this.obrasService.obras$.subscribe({
      next: (obras) => {
        this.obras = obras;
      },
      error: (error) => {
        // Error loading obras
        this.showMessage('Error al cargar las obras');
      }
    });
  }

  async onObraChange(obraId: string): Promise<void> {
    if (obraId) {
      try {
        this.actividades = await this.kpisService.getActividadesByObra(obraId);
        // Habilitar el campo de actividad y limpiar selección cuando cambia la obra
        this.kpiForm.get('actividad_id')?.enable();
        this.kpiForm.patchValue({ actividad_id: '' });
      } catch (error) {
        // Error loading actividades
        this.showMessage('Error al cargar las actividades');
        this.actividades = [];
        this.kpiForm.get('actividad_id')?.disable();
      }
    } else {
      this.actividades = [];
      this.kpiForm.get('actividad_id')?.disable();
      this.kpiForm.patchValue({ actividad_id: '' });
    }
  }

  loadKpis(): void {
    // Solo suscribirse una vez al observable en ngOnInit
    // El servicio ya maneja la actualización automática de datos
    this.loading = true;
  }

  async onSubmit() {
    if (this.kpiForm.valid && !this.submitting) {
      // Verificar autenticación antes de proceder
      const currentUser = this.directAuthService.getCurrentUser();
      if (!currentUser) {
        this.showMessage('Debe iniciar sesión para crear KPIs. Por favor, inicie sesión e intente nuevamente.');
        return;
      }

      const token = this.directAuthService.getAccessToken();
      if (!token) {
        this.showMessage('Token de autenticación no válido. Por favor, inicie sesión nuevamente.');
        return;
      }

      try {
        this.loading = true;
        this.submitting = true;
        
        // Obtener todos los valores incluyendo campos deshabilitados
        const formData = this.kpiForm.getRawValue();
        
        // Validar duplicados antes de enviar (solo para nuevos KPIs)
        if (!this.editingKpi) {
          // Verificando duplicados
          const isDuplicate = await this.checkForDuplicateKPI(formData);
          if (isDuplicate) {
            // KPI duplicado detectado
            this.showMessage('Ya existe un KPI para esta obra/actividad en la fecha seleccionada');
            this.loading = false;
            this.submitting = false;
            return;
          }
        }
        
        // Preparar datos que coincidan con el schema de la tabla kpis
        const kpiData = {
          obra_id: formData.obra_id,
          actividad_id: formData.actividad_id || null,
          fecha: formData.fecha instanceof Date ? formData.fecha.toISOString().split('T')[0] : formData.fecha,
          avance_fisico: formData.avance_fisico,
          productividad: formData.productividad,
          calidad: formData.calidad,
          desviacion_cronograma: formData.desviacion_cronograma,
          // Nuevos campos
          costo_ejecutado: formData.costo_ejecutado,
          costo_presupuestado: formData.costo_presupuestado,
          personal_asignado: formData.personal_asignado,
          maquinaria_utilizada: formData.maquinaria_utilizada,
          incidentes_seguridad: formData.incidentes_seguridad,
          clima_condiciones: formData.clima_condiciones,
          observaciones_tecnicas: formData.observaciones_tecnicas,
          estado: formData.estado,
          metricas_adicionales: formData.metricas_adicionales ? { notas: formData.metricas_adicionales } : null,
          // Campo requerido para RLS policies
          created_by: currentUser.id
        };
        
        if (this.editingKpi && this.editingKpi.id) {
          await this.kpisService.updateKPI(this.editingKpi.id, kpiData);
          this.showMessage('KPI actualizado exitosamente');
        } else {
          await this.kpisService.createKPI(kpiData);
          this.showMessage('KPI creado exitosamente');
        }
        
        this.resetForm();
        // No necesitamos llamar loadKpis() - el observable se actualiza automáticamente
      } catch (error: any) {
        // Error saving KPI
        
        // Manejo específico de errores de duplicación
        let errorMessage = 'Error al guardar el KPI';
        if (error?.message) {
          if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
            errorMessage = 'Ya existe un KPI para esta obra/actividad en la fecha seleccionada';
          } else if (error.message.includes('permission denied')) {
            errorMessage = 'No tiene permisos para crear/actualizar KPIs en esta obra';
          } else {
            errorMessage = `Error: ${error.message}`;
          }
        }
        
        this.showMessage(errorMessage);
      } finally {
        this.loading = false;
        this.submitting = false;
      }
    } else if (this.submitting) {
      // Envío ya en progreso, ignorando clic adicional
    }
  }

  async editKpi(kpi: KPI) {
    this.editingKpi = kpi;
    
    // Cargar actividades si hay obra_id
    if (kpi.obra_id) {
      await this.onObraChange(kpi.obra_id);
    } else {
      // Si no hay obra_id, deshabilitar el campo de actividad
      this.kpiForm.get('actividad_id')?.disable();
    }
    
    this.kpiForm.patchValue({
      obra_id: kpi.obra_id,
      actividad_id: kpi.actividad_id || '',
      fecha: new Date(kpi.fecha),
      estado: kpi.estado || 'activo',
      avance_fisico: kpi.avance_fisico || 0,
      productividad: kpi.productividad || 0,
      personal_asignado: kpi.personal_asignado || 0,
      maquinaria_utilizada: kpi.maquinaria_utilizada || '',
      calidad: kpi.calidad || 0,
      incidentes_seguridad: kpi.incidentes_seguridad || 0,
      clima_condiciones: kpi.clima_condiciones || '',
      desviacion_cronograma: kpi.desviacion_cronograma || 0,
      costo_ejecutado: kpi.costo_ejecutado || 0,
      costo_presupuestado: kpi.costo_presupuestado || 0,
      observaciones_tecnicas: kpi.observaciones_tecnicas || '',
      metricas_adicionales: kpi.metricas_adicionales?.notas || ''
    });
  }

  async deleteKpi(kpi: KPI) {
    if (confirm('¿Está seguro de que desea eliminar este KPI?')) {
      try {
        this.loading = true;
        if (kpi.id) {
          // Intentando eliminar KPI
          await this.kpisService.deleteKPI(kpi.id);
          this.showMessage('KPI eliminado exitosamente');
          // No necesitamos llamar loadKpis() - el observable se actualiza automáticamente
        } else {
          this.showMessage('Error: KPI sin ID válido');
        }
      } catch (error: any) {
        // Error deleting KPI
        
        // Proporcionar mensajes de error más específicos
        let errorMessage = 'Error al eliminar el KPI';
        
        if (error?.message) {
          if (error.message.includes('permission denied') || error.message.includes('RLS')) {
            errorMessage = 'No tiene permisos para eliminar este KPI. Verifique que esté asignado a la obra correspondiente.';
          } else if (error.message.includes('foreign key') || error.message.includes('constraint')) {
            errorMessage = 'No se puede eliminar el KPI porque tiene registros relacionados.';
          } else if (error.message.includes('not found')) {
            errorMessage = 'El KPI ya no existe o fue eliminado previamente.';
          } else {
            errorMessage = `Error: ${error.message}`;
          }
        }
        
        this.showMessage(errorMessage);
      } finally {
        this.loading = false;
      }
    }
  }

  resetForm() {
    this.editingKpi = null;
    this.actividades = []; // Limpiar actividades
    this.kpiForm.reset({
      obra_id: '',
      actividad_id: '',
      fecha: new Date(),
      avance_fisico: 0,
      productividad: 0,
      calidad: 0,
      desviacion_cronograma: 0,
      metricas_adicionales: ''
    });
    // Deshabilitar el campo de actividad al resetear
    this.kpiForm.get('actividad_id')?.disable();
  }

  async checkForDuplicateKPI(formData: any): Promise<boolean> {
    try {
      const fecha = formData.fecha instanceof Date ? formData.fecha.toISOString().split('T')[0] : formData.fecha;
      // Verificando duplicados
      
      // Buscar KPIs existentes con la misma obra/actividad y fecha
      const existingKpis = this.kpis.filter(kpi => {
        const kpiDate = new Date(kpi.fecha).toISOString().split('T')[0];
        
        // Si es KPI de obra (sin actividad)
        if (!formData.actividad_id && !kpi.actividad_id) {
          const match = kpi.obra_id === formData.obra_id && kpiDate === fecha;
          if (match) {
            // Duplicado encontrado (obra)
          }
          return match;
        }
        
        // Si es KPI de actividad
        if (formData.actividad_id && kpi.actividad_id) {
          const match = kpi.obra_id === formData.obra_id && 
                       kpi.actividad_id === formData.actividad_id && 
                       kpiDate === fecha;
          if (match) {
            // Duplicado encontrado (actividad)
          }
          return match;
        }
        
        return false;
      });
      
      // KPIs existentes encontrados
      return existingKpis.length > 0;
    } catch (error) {
      // Error checking for duplicate KPI
      return false; // En caso de error, permitir el envío
    }
  }

  private calculateOverallValue(data: any): number {
    // Calcular un valor general basado en los KPIs individuales
    const weights = {
      avance_fisico: 0.3,
      productividad: 0.3,
      calidad: 0.4
    };
    
    return Math.round(
      (data.avance_fisico * weights.avance_fisico) +
      (data.productividad * weights.productividad) +
      (data.calidad * weights.calidad)
    );
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  getObraNombre(obraId: string): string {
    const obra = this.obras.find(o => o.id === obraId);
    return obra ? obra.nombre : 'Obra no encontrada';
  }

  getActividadNombre(actividadId: string | null): string {
    if (!actividadId) return 'KPI General';
    const actividad = this.actividades.find(a => a.id === actividadId);
    return actividad ? `${actividad.tipo_actividad} - ${actividad.ubicacion}` : 'Actividad no encontrada';
  }

  // Métodos para la tabla mejorada
  getStatusIcon(estado: string): string {
    switch(estado) {
      case 'activo': return 'play_circle';
      case 'revision': return 'pending';
      case 'aprobado': return 'check_circle';
      default: return 'help';
    }
  }

  getProgressColor(value: number): string {
    if (value >= 80) return 'primary';
    if (value >= 60) return 'accent';
    return 'warn';
  }

  getMetricClass(value: number, threshold: number): string {
    if (value >= threshold) return 'metric-good';
    if (value >= threshold * 0.7) return 'metric-warning';
    return 'metric-poor';
  }

  getCostVariancePercent(ejecutado: number, presupuestado: number): number {
    if (!presupuestado) return 0;
    return Math.round(((ejecutado - presupuestado) / presupuestado) * 100);
  }

  getCostVarianceClass(ejecutado: number, presupuestado: number): string {
    const variance = this.getCostVariancePercent(ejecutado, presupuestado);
    if (variance <= 5) return 'cost-good';
    if (variance <= 15) return 'cost-warning';
    return 'cost-over';
  }

  getScheduleClass(dias: number): string {
    if (dias <= 0) return 'schedule-good';
    if (dias <= 5) return 'schedule-warning';
    return 'schedule-delayed';
  }

  getScheduleIcon(dias: number): string {
    if (dias <= 0) return 'schedule';
    if (dias <= 5) return 'schedule_send';
    return 'warning';
  }

  getSafetyClass(incidentes: number): string {
    if (incidentes === 0) return 'safety-good';
    if (incidentes <= 2) return 'safety-warning';
    return 'safety-critical';
  }

  getSafetyIcon(incidentes: number): string {
    if (incidentes === 0) return 'verified_user';
    if (incidentes <= 2) return 'warning';
    return 'dangerous';
  }

  // Métodos de filtrado y búsqueda
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByStatus(status: string) {
    if (status) {
      this.dataSource.data = this.kpis.filter(kpi => kpi.estado === status);
    } else {
      this.dataSource.data = this.kpis;
    }
  }

  viewDetails(kpi: any) {
    // Implementar vista de detalles
    // Ver detalles de KPI
  }

  // Métodos de cálculos automáticos y sugerencias
  calculateProductivitySuggestion(avanceFisico: number, diasTranscurridos: number): string {
    const productividadActual = avanceFisico / diasTranscurridos;
    const productividadEsperada = 100 / 30; // Asumiendo 30 días para completar
    
    if (productividadActual >= productividadEsperada) {
      return 'Excelente ritmo de trabajo. Mantener el rendimiento actual.';
    } else if (productividadActual >= productividadEsperada * 0.8) {
      return 'Ritmo adecuado. Considerar optimizar procesos para mejorar.';
    } else {
      return 'Ritmo bajo. Revisar recursos y planificación urgentemente.';
    }
  }

  calculateCostProjection(costoEjecutado: number, avanceFisico: number, costoPresupuestado: number): any {
    if (avanceFisico === 0) return { proyeccion: costoPresupuestado, varianza: 0, alerta: false };
    
    const proyeccionTotal = (costoEjecutado / avanceFisico) * 100;
    const varianza = ((proyeccionTotal - costoPresupuestado) / costoPresupuestado) * 100;
    const alerta = varianza > 10;
    
    return {
      proyeccion: Math.round(proyeccionTotal),
      varianza: Math.round(varianza),
      alerta: alerta,
      mensaje: alerta ? 'Riesgo de sobrecosto detectado' : 'Costos dentro del rango esperado'
    };
  }

  calculateQualityIndex(calidad: number, incidentesSeguridad: number): any {
    let indice = calidad;
    
    // Penalizar por incidentes de seguridad
    if (incidentesSeguridad > 0) {
      indice -= (incidentesSeguridad * 10);
    }
    
    indice = Math.max(0, Math.min(100, indice));
    
    let categoria = 'Excelente';
    let color = '#4caf50';
    
    if (indice < 60) {
      categoria = 'Deficiente';
      color = '#f44336';
    } else if (indice < 80) {
      categoria = 'Regular';
      color = '#ff9800';
    } else if (indice < 90) {
      categoria = 'Bueno';
      color = '#2196f3';
    }
    
    return { indice, categoria, color };
  }

  getWeatherImpactSuggestion(clima: string): string {
    switch (clima?.toLowerCase()) {
      case 'lluvia':
        return 'Considerar actividades bajo techo. Revisar drenajes y protecciones.';
      case 'viento fuerte':
        return 'Suspender trabajos en altura. Asegurar materiales y equipos.';
      case 'calor extremo':
        return 'Programar descansos frecuentes. Hidratación constante del personal.';
      case 'frio':
        return 'Verificar equipos de calefacción. Ajustar horarios de trabajo.';
      default:
        return 'Condiciones favorables para el trabajo normal.';
    }
  }

  calculateResourceOptimization(personalAsignado: number, avanceFisico: number): any {
    const eficienciaPersonal = avanceFisico / personalAsignado;
    let sugerencia = '';
    let accion = '';
    
    if (eficienciaPersonal > 5) {
      sugerencia = 'Excelente eficiencia del personal';
      accion = 'Mantener el equipo actual';
    } else if (eficienciaPersonal > 3) {
      sugerencia = 'Eficiencia adecuada';
      accion = 'Considerar capacitación adicional';
    } else {
      sugerencia = 'Baja eficiencia detectada';
      accion = 'Revisar asignación de tareas y capacidades';
    }
    
    return { eficiencia: Math.round(eficienciaPersonal * 100) / 100, sugerencia, accion };
  }

  // Método para aplicar cálculos automáticos al formulario
  applyAutomaticCalculations() {
    const formValue = this.kpiForm.value;
    
    if (formValue.avance_fisico && formValue.personal_asignado) {
      const resourceOpt = this.calculateResourceOptimization(
        formValue.personal_asignado, 
        formValue.avance_fisico
      );
      
      // Actualizar sugerencias en el formulario
      this.kpiForm.patchValue({
        observaciones_tecnicas: `${formValue.observaciones_tecnicas || ''}

Sugerencias automáticas:
- Eficiencia personal: ${resourceOpt.eficiencia}%
- ${resourceOpt.sugerencia}
- Acción recomendada: ${resourceOpt.accion}`
      });
    }
    
    if (formValue.costo_ejecutado && formValue.avance_fisico && formValue.costo_presupuestado) {
      const costProjection = this.calculateCostProjection(
        formValue.costo_ejecutado,
        formValue.avance_fisico,
        formValue.costo_presupuestado
      );
      
      if (costProjection.alerta) {
        // Mostrar alerta de costo
        // Alerta de costo
      }
    }
  }
}