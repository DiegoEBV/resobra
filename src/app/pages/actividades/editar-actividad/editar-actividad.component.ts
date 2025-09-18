import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormArray, Validators, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, from, Subject } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSliderModule } from '@angular/material/slider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

// Leaflet
import * as L from 'leaflet';

// Services
import { ActividadesService, Actividad, Frente } from '../../../services/actividades.service';
import { AuthService } from '../../../services/auth.service';
import { MapService } from '../../../services/map.service';
import { TareasService } from '../../../services/tareas.service';

// Components
import { LocationSelectorDialogComponent } from '../../../components/location-selector-dialog/location-selector-dialog.component';

@Component({
  selector: 'app-editar-actividad',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSliderModule,
    MatDialogModule,
    MatExpansionModule,
    MatTooltipModule
  ],
  templateUrl: './editar-actividad.component.html',
  styleUrls: ['./editar-actividad.component.css']
})
export class EditarActividadComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  actividadForm!: FormGroup;
  loading = false;
  actividadId!: string;
  actividad: Actividad | null = null;
  showMap = false;
  
  // Opciones para los selects
  tiposActividad = [
    'excavacion',
    'relleno',
    'pavimentacion',
    'señalizacion',
    'drenaje',
    'puentes',
    'otros'
  ];
  estadosActividad = ['programado', 'ejecucion', 'finalizado'];
  
  // Frentes de trabajo
  frentes$ = new BehaviorSubject<Frente[]>([]);
  
  // Mapa
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  selectedLocation: { lat: number; lng: number } | null = null;
  
  // Observables
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private actividadesService: ActividadesService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private mapService: MapService,
    private dialog: MatDialog,
    private tareasService: TareasService
  ) {
    this.actividadForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.actividadId = params['id'];
      if (this.actividadId) {
        this.loadActividad();
      }
    });
    this.loadFrentes();
  }

  ngAfterViewInit(): void {
    // El mapa se inicializará después de cargar la actividad
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      tipo_actividad: ['', Validators.required],
      estado: ['programado', Validators.required],
      fecha: [new Date(), Validators.required],
      frente_id: ['', Validators.required],
      responsable: [''],
      ubicacion_direccion: [''],
      ubicacion_lat: [null],
      ubicacion_lng: [null],
      kilometro: [0, [Validators.min(0)]],
      progreso_porcentaje: [0, [Validators.min(0), Validators.max(100)]],
      observaciones: [''],
      requiere_maquinaria: [false],
      requiere_materiales: [false],
      es_critica: [false],
      tareas: this.fb.array([])
    });
  }

  private async loadActividad(): Promise<void> {
    try {
      this.loading = true;
      const actividad = await this.actividadesService.getActividadById(this.actividadId);
      
      if (actividad) {
        this.actividad = actividad;
        await this.populateForm(actividad);
        
        // Inicializar mapa con las coordenadas de la actividad
        if (actividad.ubicacion && this.mapContainer) {
          setTimeout(() => {
            this.initializeMap(actividad.ubicacion);
          }, 100);
        }
      } else {
        this.snackBar.open('Actividad no encontrada', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/actividades']);
      }
    } catch (error) {
      console.error('Error al cargar actividad:', error);
      this.snackBar.open('Error al cargar la actividad', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  private async populateForm(actividad: Actividad): Promise<void> {
    this.actividadForm.patchValue({
      tipo_actividad: actividad.tipo_actividad,
      estado: actividad.estado,
      fecha: new Date(actividad.fecha),
      frente_id: actividad.frente_id,
      responsable: actividad.responsable || '',
      ubicacion_direccion: actividad.ubicacion?.direccion || '',
      ubicacion_lat: actividad.ubicacion?.lat || null,
      ubicacion_lng: actividad.ubicacion?.lng || null,
      kilometro: actividad.kilometro || 0,
      progreso_porcentaje: actividad.progreso_porcentaje || 0,
      observaciones: actividad.observaciones || '',
      requiere_maquinaria: actividad.requiere_maquinaria || false,
      requiere_materiales: actividad.requiere_materiales || false,
      es_critica: actividad.es_critica || false
    });

    if (actividad.ubicacion) {
      this.selectedLocation = { lat: actividad.ubicacion.lat, lng: actividad.ubicacion.lng };
    }

    // Cargar tareas existentes
    await this.loadTareas(actividad.id!);
  }

  private async loadTareas(actividadId: string): Promise<void> {
    try {
      const tareas = await this.tareasService.getTareasByActividad(actividadId);
      
      // Limpiar el FormArray actual
      while (this.tareasFormArray.length !== 0) {
        this.tareasFormArray.removeAt(0);
      }
      
      // Agregar las tareas existentes al FormArray
      tareas.forEach(tarea => {
        const tareaForm = this.fb.group({
          id: [tarea.id],
          nombre: [tarea.nombre, [Validators.required, Validators.minLength(3)]],
          descripcion: [tarea.descripcion || ''],
          orden: [tarea.orden],
          completada: [tarea.completada || false]
        });
        this.tareasFormArray.push(tareaForm);
      });
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    }
  }

  private async loadFrentes(): Promise<void> {
    try {
      // Recargar frentes del usuario
      await this.actividadesService.reloadUserFrente();
      
      // Suscribirse al observable de frentes
      this.actividadesService.frentes$.pipe(
        takeUntil(this.destroy$)
      ).subscribe(frentes => {
        this.frentes$.next(frentes);
      });
    } catch (error) {
      console.error('Error al cargar frentes:', error);
    }
  }

  private initializeMap(coordenadas: { lat: number; lng: number }): void {
    if (!this.mapContainer) return;

    this.map = L.map(this.mapContainer.nativeElement).setView(
      [coordenadas.lat, coordenadas.lng], 
      15
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Agregar marcador en la ubicación actual
    this.marker = L.marker([coordenadas.lat, coordenadas.lng])
      .addTo(this.map)
      .bindPopup('Ubicación de la actividad');

    // Permitir cambiar la ubicación haciendo clic en el mapa
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.updateLocation(e.latlng.lat, e.latlng.lng);
    });
  }

  private updateLocation(lat: number, lng: number): void {
    this.selectedLocation = { lat, lng };
    this.actividadForm.patchValue({
      ubicacion_lat: lat,
      ubicacion_lng: lng
    });

    if (this.marker && this.map) {
      this.marker.setLatLng([lat, lng]);
    }
  }

  openLocationSelector(): void {
    const dialogRef = this.dialog.open(LocationSelectorDialogComponent, {
      width: '80vw',
      height: '80vh',
      data: {
        currentLocation: this.selectedLocation
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedLocation = result;
        this.actividadForm.patchValue({
          ubicacion_lat: result.lat,
          ubicacion_lng: result.lng,
          ubicacion_direccion: `${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`
        });

        if (this.map && this.marker) {
          this.map.setView([result.lat, result.lng], 15);
          this.marker.setLatLng([result.lat, result.lng]);
        }
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.actividadForm.valid && !this.loading) {
      try {
        this.loading = true;
        
        const formData = this.actividadForm.value;
        const actividadData: Partial<Actividad> = {
          ...formData,
          id: this.actividadId,
          fecha: formData.fecha.toISOString().split('T')[0],
          ubicacion: {
            lat: formData.ubicacion_lat || this.selectedLocation?.lat || 0,
            lng: formData.ubicacion_lng || this.selectedLocation?.lng || 0,
            direccion: formData.ubicacion_direccion || ''
          }
        };

        await this.actividadesService.updateActividad(this.actividadId, actividadData);
        
        // Guardar tareas
        await this.saveTareas();
        
        this.snackBar.open('Actividad actualizada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        this.router.navigate(['/actividades']);
      } catch (error) {
        console.error('Error al actualizar actividad:', error);
        this.snackBar.open('Error al actualizar la actividad', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      } finally {
        this.loading = false;
      }
    } else {
      this.markFormGroupTouched(this.actividadForm);
      this.snackBar.open('Por favor, complete todos los campos requeridos', 'Cerrar', {
        duration: 3000
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/actividades']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Getters para validación de formulario
  get tipo_actividad() { return this.actividadForm.get('tipo_actividad'); }
  get estado() { return this.actividadForm.get('estado'); }
  get fecha() { return this.actividadForm.get('fecha'); }
  get frente_id() { return this.actividadForm.get('frente_id'); }
  get responsable() { return this.actividadForm.get('responsable'); }
  get observaciones() { return this.actividadForm.get('observaciones'); }
  
  // Getter para tareas
  get tareasFormArray(): FormArray {
    return this.actividadForm.get('tareas') as FormArray;
  }

  private async saveTareas(): Promise<void> {
    try {
      const tareasFormValue = this.tareasFormArray.value;
      
      for (const tareaData of tareasFormValue) {
        const tareaToSave = {
          ...tareaData,
          actividad_id: this.actividadId
        };
        
        if (tareaData.id) {
          // Actualizar tarea existente
          await this.tareasService.updateTarea(tareaData.id, tareaToSave);
        } else {
          // Crear nueva tarea
          await this.tareasService.createTarea(tareaToSave);
        }
      }
    } catch (error) {
      console.error('Error al guardar tareas:', error);
      throw error;
    }
  }

  // Métodos para manejar tareas
  agregarTarea(): void {
    const tareaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      orden: [this.tareasFormArray.length + 1],
      completada: [false]
    });
    
    this.tareasFormArray.push(tareaForm);
  }

  eliminarTarea(index: number): void {
    this.tareasFormArray.removeAt(index);
    
    // Reordenar las tareas restantes
    for (let i = 0; i < this.tareasFormArray.length; i++) {
      this.tareasFormArray.at(i).patchValue({ orden: i + 1 });
    }
  }
}