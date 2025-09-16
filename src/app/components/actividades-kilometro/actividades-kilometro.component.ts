import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LocationSelectorDialogComponent } from '../location-selector-dialog/location-selector-dialog.component';
import { ProgressUpdateDialogComponent } from '../progress-update-dialog/progress-update-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ActividadesService } from '../../services/actividades.service';
import { KilometrosService } from '../../services/kilometros.service';
import { Actividad, Frente, Kilometro } from '../../models/actividades.model';

interface ActividadKilometro extends Actividad {
  kilometro?: number;
  progreso_porcentaje?: number;
}

@Component({
  selector: 'app-actividades-kilometro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule
  ],
  templateUrl: './actividades-kilometro.component.html',
  styleUrls: ['./actividades-kilometro.component.css']
})
export class ActividadesKilometroComponent implements OnInit, OnDestroy {
  @Input() frente!: Frente;
  @Input() kilometro?: number;
  @Output() actividadCreated = new EventEmitter<ActividadKilometro>();
  @Output() actividadUpdated = new EventEmitter<ActividadKilometro>();

  private destroy$ = new Subject<void>();
  
  // Estado del componente
  loading = false;
  showForm = false;
  editingActividad: ActividadKilometro | null = null;
  
  // Datos
  actividades: ActividadKilometro[] = [];
  kilometros: Kilometro[] = [];
  
  // Formulario
  actividadForm!: FormGroup;
  
  // Configuraciones
  tiposActividad = [
    { value: 'excavacion', label: 'Excavación' },
    { value: 'pavimentacion', label: 'Pavimentación' },
    { value: 'señalizacion', label: 'Señalización' },
    { value: 'drenaje', label: 'Drenaje' },
    { value: 'puentes', label: 'Puentes' },
    { value: 'mantenimiento', label: 'Mantenimiento' }
  ];
  
  prioridades = [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' },
    { value: 'critica', label: 'Crítica' }
  ];
  
  estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_progreso', label: 'En Progreso' },
    { value: 'completada', label: 'Completada' },
    { value: 'pausada', label: 'Pausada' }
  ];

  constructor(
    private fb: FormBuilder,
    private actividadesService: ActividadesService,
    private kilometrosService: KilometrosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.loadData();
    this.subscribeToProgresoUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToProgresoUpdates(): void {
    this.actividadesService.progresoUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ actividadId, progreso }) => {
        // Actualizar el progreso de la actividad específica
        const actividad = this.actividades.find(a => a.id === actividadId);
        if (actividad) {
          actividad.progreso_porcentaje = progreso;
        }
      });
  }

  private createForm(): void {
    this.actividadForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      tipo: ['', Validators.required],
      prioridad: ['media', Validators.required],
      estado: ['pendiente', Validators.required],
      fecha_inicio: [new Date(), Validators.required],
      fecha_fin_estimada: [''],
      kilometro: [this.kilometro || null, [Validators.required, Validators.min(0)]],
      progreso_porcentaje: [0, [Validators.min(0), Validators.max(100)]],
      responsable: [''],
      observaciones: [''],
      // Campos de ubicación
      ubicacion_lat: [null, [Validators.min(-90), Validators.max(90)]],
      ubicacion_lng: [null, [Validators.min(-180), Validators.max(180)]],
      ubicacion_direccion: ['']
    }, { validators: this.locationValidator });
  }

  private async loadData(): Promise<void> {
    try {
      this.loading = true;
      
      // Cargar actividades del frente
      if (this.frente?.id) {
        const actividades = await this.actividadesService.getActividadesByFrente(this.frente.id);
        let actividadesFiltradas = actividades.filter(act => 
          this.kilometro ? act.kilometro === this.kilometro : true
        );
        
        // Calcular progreso basado en tareas para cada actividad
        for (const actividad of actividadesFiltradas) {
          try {
            const progreso = await this.actividadesService.calcularProgresoActividad(actividad.id!);
            (actividad as ActividadKilometro).progreso_porcentaje = progreso;
          } catch (error) {
            console.error(`Error calculando progreso para actividad ${actividad.id}:`, error);
            (actividad as ActividadKilometro).progreso_porcentaje = 0;
          }
        }
        
        this.actividades = actividadesFiltradas;
      }
      
      // Cargar kilómetros del frente
      if (this.frente?.id) {
        this.kilometros = await this.kilometrosService.getKilometrosByFrente(this.frente.id);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      this.snackBar.open('Error al cargar los datos', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  showCreateForm(): void {
    this.showForm = true;
    this.editingActividad = null;
    this.actividadForm.reset({
      prioridad: 'media',
      estado: 'pendiente',
      fecha_inicio: new Date(),
      kilometro: this.kilometro || null,
      progreso_porcentaje: 0
    });
  }

  editActividad(actividad: ActividadKilometro): void {
    this.showForm = true;
    this.editingActividad = actividad;
    this.actividadForm.patchValue({
      nombre: actividad.nombre,
      descripcion: actividad.descripcion,
      tipo: actividad.tipo,
      prioridad: actividad.prioridad,
      estado: actividad.estado,
      fecha_inicio: new Date(actividad.fecha_inicio),
      fecha_fin_estimada: actividad.fecha_fin_estimada ? new Date(actividad.fecha_fin_estimada) : null,
      kilometro: actividad.kilometro,
      progreso_porcentaje: actividad.progreso_porcentaje || 0,
      responsable: actividad.responsable,
      observaciones: actividad.observaciones,
      // Campos de ubicación
      ubicacion_lat: actividad.ubicacion?.lat || null,
      ubicacion_lng: actividad.ubicacion?.lng || null,
      ubicacion_direccion: actividad.ubicacion?.direccion || ''
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingActividad = null;
    this.actividadForm.reset();
  }

  async onSubmit(): Promise<void> {
    if (this.actividadForm.valid && this.frente?.id) {
      try {
        this.loading = true;
        
        const formValues = this.actividadForm.value;
        
        const formData = {
          nombre: formValues.nombre,
          descripcion: formValues.descripcion,
          tipo_actividad: formValues.tipo,
          fecha: formValues.fecha_inicio,
          ubicacion: {
            lat: formValues.ubicacion_lat,
            lng: formValues.ubicacion_lng,
            direccion: formValues.ubicacion_direccion
          },
          responsable: formValues.responsable,
          estado: formValues.estado,
          observaciones: formValues.observaciones,
          kilometro: formValues.kilometro,
          progreso_porcentaje: formValues.progreso_porcentaje,
          frente_id: this.frente.id,
          obra_id: this.frente.obra_id,
          user_id: 'current-user' // TODO: obtener del servicio de auth
        };
        
        let result: ActividadKilometro;
        
        if (this.editingActividad) {
          // Actualizar actividad existente
          result = await this.actividadesService.updateActividad(
            this.editingActividad.id!, 
            formData
          ) as ActividadKilometro;
          this.actividadUpdated.emit(result);
          this.snackBar.open('Actividad actualizada correctamente', 'Cerrar', { duration: 3000 });
        } else {
          // Crear nueva actividad
          result = await this.actividadesService.createActividad(formData) as ActividadKilometro;
          this.actividadCreated.emit(result);
          this.snackBar.open('Actividad creada correctamente', 'Cerrar', { duration: 3000 });
        }
        
        this.cancelForm();
        await this.loadData();
        
      } catch (error) {
        console.error('Error saving actividad:', error);
        this.snackBar.open('Error al guardar la actividad', 'Cerrar', { duration: 3000 });
      } finally {
        this.loading = false;
      }
    }
  }

  async deleteActividad(actividad: ActividadKilometro): Promise<void> {
    if (confirm('¿Estás seguro de que deseas eliminar esta actividad?')) {
      try {
        this.loading = true;
        await this.actividadesService.deleteActividad(actividad.id!);
        this.snackBar.open('Actividad eliminada correctamente', 'Cerrar', { duration: 3000 });
        await this.loadData();
      } catch (error) {
        console.error('Error deleting actividad:', error);
        this.snackBar.open('Error al eliminar la actividad', 'Cerrar', { duration: 3000 });
      } finally {
        this.loading = false;
      }
    }
  }

  getEstadoColor(estado: string): string {
    const colors: { [key: string]: string } = {
      'pendiente': '#F59E0B',
      'en_progreso': '#2D9596',
      'completada': '#10B981',
      'pausada': '#DC2626'
    };
    return colors[estado] || '#6B7280';
  }

  getPrioridadColor(prioridad: string): string {
    const colors: { [key: string]: string } = {
      'baja': '#10B981',
      'media': '#F59E0B',
      'alta': '#DC2626',
      'critica': '#EA580C'
    };
    return colors[prioridad] || '#6B7280';
  }

  getProgressColor(progreso: number): string {
    if (progreso >= 80) return 'primary';
    if (progreso >= 50) return 'accent';
    if (progreso >= 25) return 'warn';
    return 'warn';
  }

  getProgressText(progreso: number): string {
    if (progreso === 0) return 'Sin iniciar';
    if (progreso === 100) return 'Completado';
    return `${progreso}% completado`;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.actividadForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.actividadForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} debe ser mayor o igual a ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `${this.getFieldLabel(fieldName)} debe ser menor o igual a ${field.errors['max'].max}`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nombre: 'Nombre',
      descripcion: 'Descripción',
      tipo: 'Tipo',
      prioridad: 'Prioridad',
      estado: 'Estado',
      fecha_inicio: 'Fecha de inicio',
      fecha_fin_estimada: 'Fecha fin estimada',
      kilometro: 'Kilómetro',
      progreso_porcentaje: 'Progreso',
      responsable: 'Responsable',
      observaciones: 'Observaciones',
      ubicacion_lat: 'Latitud',
      ubicacion_lng: 'Longitud',
      ubicacion_direccion: 'Dirección'
    };
    return labels[fieldName] || fieldName;
  }

  // Seleccionar ubicación en el mapa
  selectLocationOnMap(): void {
    // Crear un diálogo simple para seleccionar coordenadas
    const dialogRef = this.dialog.open(LocationSelectorDialogComponent, {
      width: '80vw',
      height: '80vh',
      maxWidth: '1000px',
      maxHeight: '800px',
      data: {
        currentLat: this.actividadForm.get('ubicacion_lat')?.value,
        currentLng: this.actividadForm.get('ubicacion_lng')?.value
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.actividadForm.patchValue({
          ubicacion_lat: result.lat,
          ubicacion_lng: result.lng,
          ubicacion_direccion: result.direccion || ''
        });
        
        this.snackBar.open('Ubicación seleccionada correctamente', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  // Navegar al detalle de actividad para gestionar tareas
  updateProgress(actividad: any): void {
    // Importar Router si no está importado
    import('@angular/router').then(routerModule => {
      const router = routerModule.Router;
      // Navegar al detalle de actividad
      window.location.href = `/actividades/detalle/${actividad.id}`;
    }).catch(() => {
      // Fallback: mostrar mensaje informativo
      this.snackBar.open(
        'Para actualizar el progreso, vaya al detalle de la actividad y complete las tareas asignadas', 
        'Cerrar', 
        { duration: 5000 }
      );
    });
  }

  // Validador personalizado para ubicación
  locationValidator(control: AbstractControl): ValidationErrors | null {
    const lat = control.get('ubicacion_lat')?.value;
    const lng = control.get('ubicacion_lng')?.value;
    
    // Si ambos están vacíos, es válido (ubicación opcional)
    if (!lat && !lng) {
      return null;
    }
    
    // Si uno está lleno y el otro vacío, es inválido
    if ((lat && !lng) || (!lat && lng)) {
      return { incompleteLocation: true };
    }
    
    // Validar rangos de coordenadas
    if (lat && (lat < -90 || lat > 90)) {
      return { invalidLatitude: true };
    }
    
    if (lng && (lng < -180 || lng > 180)) {
      return { invalidLongitude: true };
    }
    
    return null;
  }
  
  // Método para obtener coordenadas actuales del dispositivo
  getCurrentLocation(): void {
    if (navigator.geolocation) {
      this.snackBar.open('Obteniendo ubicación...', 'Cerrar', { duration: 2000 });
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Number(position.coords.latitude.toFixed(6));
          const lng = Number(position.coords.longitude.toFixed(6));
          
          this.actividadForm.patchValue({
            ubicacion_lat: lat,
            ubicacion_lng: lng
          });
          
          this.snackBar.open('Ubicación obtenida correctamente', 'Cerrar', { duration: 3000 });
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Error al obtener la ubicación';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Ubicación no disponible';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado';
              break;
          }
          
          this.snackBar.open(errorMessage, 'Cerrar', { duration: 4000 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
      );
    } else {
      this.snackBar.open('Geolocalización no soportada en este navegador', 'Cerrar', { duration: 4000 });
    }
  }
}