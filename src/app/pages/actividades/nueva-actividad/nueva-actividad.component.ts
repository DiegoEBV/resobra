import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormArray, FormControl, Validators, ValidationErrors, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, Subject } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Tarea } from '../../../interfaces/database.interface';

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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSliderModule } from '@angular/material/slider';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';

// Leaflet
import * as L from 'leaflet';

// Services
import { ActividadesService } from '../../../services/actividades.service';
import { AuthService } from '../../../services/auth.service';
import { DirectAuthService } from '../../../services/direct-auth.service';
import { MapService } from '../../../services/map.service';
import { UsuariosService } from '../../../services/usuarios.service';

// Components
import { LocationSelectorDialogComponent } from '../../../components/location-selector-dialog/location-selector-dialog.component';

@Component({
  selector: 'app-nueva-actividad',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatStepperModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatSliderModule,
    MatDialogModule
  ],
  templateUrl: './nueva-actividad.component.html',
  styleUrl: './nueva-actividad.component.css'
})
export class NuevaActividadComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  private destroy$ = new Subject<void>();
  private map!: L.Map;
  private currentMarker?: L.Marker;
  private rangeLayer?: L.LayerGroup;
  
  actividadForm: FormGroup;
  loading = false;
  
  // Propiedades de tareas - ahora manejadas por FormArray
  // tareas: Partial<Tarea>[] = []; // Removido - ahora se usa FormArray
  
  // Map and GPS properties
  currentLatitude: number = 0;
  currentLongitude: number = 0;
  selectedFrente: any = null;
  progressoInicial: number = 0;
  mapInitialized = false;
  
  // Nuevas propiedades para los dos puntos
  private startMarker?: L.Marker;
  private endMarker?: L.Marker;
  private routeLine?: L.Polyline;
  startPoint?: L.LatLng;
  endPoint?: L.LatLng;
  totalDistance: number = 0;
  isSelectingStartPoint: boolean = true; // true = seleccionando inicio, false = seleccionando fin
  isSelectingLocation: boolean = false;
  
  // Opciones para los selects
  tiposActividad = [
    { value: 'excavacion', label: 'Excavación' },
    { value: 'pavimentacion', label: 'Pavimentación' },
    { value: 'señalizacion', label: 'Señalización' },
    { value: 'drenaje', label: 'Drenaje' },
    { value: 'puentes', label: 'Puentes y Estructuras' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'control_calidad', label: 'Control de Calidad' },
    { value: 'seguridad', label: 'Seguridad Vial' }
  ];
  
  prioridades = [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' },
    { value: 'critica', label: 'Crítica' }
  ];
  
  responsables: any[] = [];
  usuarios: any[] = [];
  
  frentes: any[] = [];
  obras: any[] = [];

  constructor(
    private fb: FormBuilder,
    private actividadesService: ActividadesService,
    private authService: AuthService,
    private directAuthService: DirectAuthService,
    private usuariosService: UsuariosService,
    private router: Router,
    private snackBar: MatSnackBar,
    private mapService: MapService,
    private dialog: MatDialog
  ) {
    this.actividadForm = this.createForm();
  }

  ngOnInit(): void {
    console.log('🚀 NuevaActividadComponent.ngOnInit() - Componente inicializado');
    
    // Verificar estado de autenticación usando DirectAuthService
    const currentUser = this.directAuthService.getCurrentUser();
    console.log('👤 Usuario actual en ngOnInit:', {
      hasUser: !!currentUser,
      userId: currentUser?.id || 'null',
      email: currentUser?.email || 'null'
    });
    
    if (!currentUser) {
      console.warn('⚠️ No hay usuario autenticado en ngOnInit');
    }
    
    this.loadObrasAndFrente();
    this.loadUsuarios();
  }

  private async loadUsuarios(): Promise<void> {
    try {
      console.log('🔄 Cargando usuarios para dropdown de responsables...');
      
      // Obtener usuarios activos
      const usuarios = await this.usuariosService.getUsuarios({ activo: true });
      
      // Mapear usuarios para el dropdown
      this.responsables = usuarios.map(usuario => ({
        value: usuario.id,
        label: `${usuario.nombre} - ${usuario.rol === 'residente' ? 'Residente' : 'Logística'}`
      }));
      
      console.log('✅ Usuarios cargados:', this.responsables.length);
      
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      this.snackBar.open('Error al cargar la lista de usuarios', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      
      // Fallback a lista vacía
      this.responsables = [];
    }
  }

  private async loadObrasAndFrente(): Promise<void> {
    try {
      // Iniciando carga de frentes
      
      // Forzar recarga de frentes desde el servicio
      await this.actividadesService.reloadUserFrente();
      
      // Cargar frentes disponibles
      this.actividadesService.frentes$.pipe(
        takeUntil(this.destroy$)
      ).subscribe(frentes => {
        // Frentes recibidos
        
        this.frentes = frentes.map(f => ({
          value: f.id,
          label: f.nombre
        }));
        
        // Frentes mapeados para dropdown
      });
    } catch (error) {
       // Error loading data
     }
   }

   private async getFrenteById(frenteId: string): Promise<any> {
     return new Promise((resolve) => {
       this.actividadesService.frentes$.pipe(
         takeUntil(this.destroy$)
       ).subscribe(frentes => {
         const frente = frentes.find(f => f.id === frenteId);
         resolve(frente);
       });
     });
   }

  ngAfterViewInit(): void {
    // Inicializar el mapa después de que la vista esté lista
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeMap(): void {
    if (this.mapInitialized) {
      return;
    }

    try {
      // Buscar el elemento del mapa por ID
      const mapElement = document.getElementById('nueva-actividad-map');
      if (!mapElement) {
        // Elemento del mapa no encontrado
        return;
      }

      // Configurar iconos de Leaflet
      const iconRetinaUrl = 'assets/marker-icon-2x.png';
      const iconUrl = 'assets/marker-icon.png';
      const shadowUrl = 'assets/marker-shadow.png';
      const iconDefault = L.icon({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });
      L.Marker.prototype.options.icon = iconDefault;

      // Inicializar mapa
      this.map = L.map(mapElement).setView([-16.5, -68.15], 10);

      // Agregar capa de tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // Manejar clics en el mapa
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.onMapClick(e.latlng.lat, e.latlng.lng);
      });

      this.mapInitialized = true;
      // Mapa inicializado correctamente
    } catch (error) {
      // Error al inicializar mapa
    }
  }

  // Manejar clics en el mapa para seleccionar puntos inicial y final
  private onMapClick(lat: number, lng: number): void {
    if (this.isSelectingStartPoint) {
      // Seleccionar punto inicial
      this.startPoint = L.latLng(lat, lng);
      this.addStartMarker(this.startPoint);
      this.isSelectingStartPoint = false;
      
      this.snackBar.open('Punto inicial seleccionado. Ahora seleccione el punto final.', 'Cerrar', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } else {
      // Seleccionar punto final
      this.endPoint = L.latLng(lat, lng);
      this.addEndMarker(this.endPoint);
      
      // Calcular y mostrar la ruta
      this.calculateAndDisplayRoute();
      
      this.snackBar.open('Punto final seleccionado. Distancia calculada automáticamente.', 'Cerrar', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      
      // Resetear para permitir nueva selección
      this.isSelectingStartPoint = true;
    }
  }

  private updateLocation(lat: number, lng: number): void {
    this.currentLatitude = lat;
    this.currentLongitude = lng;
    
    // Actualizar formulario
    this.actividadForm.patchValue({
      ubicacion_lat: lat,
      ubicacion_lng: lng
    });

    // Actualizar marcador en el mapa
    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    this.currentMarker = L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(`Ubicación seleccionada<br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);

    // Ubicación actualizada
  }

  // Agregar marcador de punto inicial
  addStartMarker(point: L.LatLng): void {
    if (this.map) {
      // Remover marcador anterior si existe
      if (this.startMarker) {
        this.map.removeLayer(this.startMarker);
      }
      
      // Crear icono personalizado para punto inicial
      const startIcon = L.divIcon({
        className: 'start-point-marker',
        html: '<div style="background-color: #4CAF50; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">I</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      
      this.startMarker = L.marker(point, { icon: startIcon })
        .addTo(this.map)
        .bindPopup('Punto Inicial');
    }
  }
  
  // Agregar marcador de punto final
  addEndMarker(point: L.LatLng): void {
    if (this.map) {
      // Remover marcador anterior si existe
      if (this.endMarker) {
        this.map.removeLayer(this.endMarker);
      }
      
      // Crear icono personalizado para punto final
      const endIcon = L.divIcon({
        className: 'end-point-marker',
        html: '<div style="background-color: #F44336; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">F</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      
      this.endMarker = L.marker(point, { icon: endIcon })
        .addTo(this.map)
        .bindPopup('Punto Final');
    }
  }
  
  // Calcular distancia y mostrar ruta
  calculateAndDisplayRoute(): void {
    if (this.startPoint && this.endPoint && this.map) {
      // Calcular distancia en kilómetros
      this.totalDistance = this.startPoint.distanceTo(this.endPoint) / 1000;
      
      // Distancia calculada
      
      // Remover línea anterior si existe
      if (this.routeLine) {
        this.map.removeLayer(this.routeLine);
      }
      
      // Crear línea de ruta
      this.routeLine = L.polyline([this.startPoint, this.endPoint], {
        color: '#2196F3',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 5'
      }).addTo(this.map)
        .bindPopup(`Distancia: ${this.totalDistance.toFixed(3)} km`);
      
      // Actualizar campos del formulario con valores numéricos válidos
      const kmInicio = 0;
      const kmFin = Number(this.totalDistance.toFixed(3));
      
      // Actualizando formulario
      
      this.actividadForm.patchValue({
        kilometraje_inicio: kmInicio,
        kilometraje_fin: kmFin
      });
      
      // Forzar actualización de validadores
      this.actividadForm.get('kilometraje_inicio')?.updateValueAndValidity();
      this.actividadForm.get('kilometraje_fin')?.updateValueAndValidity();
      
      // Formulario actualizado
      
      // Ajustar vista para mostrar ambos puntos
      const bounds = L.latLngBounds([this.startPoint, this.endPoint]);
      this.map.fitBounds(bounds, { padding: [20, 20] });
    }
  }
  
  // Limpiar todos los puntos del mapa
  clearMapPoints(): void {
    if (this.map) {
      // Remover marcadores
      if (this.startMarker) {
        this.map.removeLayer(this.startMarker);
        this.startMarker = undefined;
      }
      if (this.endMarker) {
        this.map.removeLayer(this.endMarker);
        this.endMarker = undefined;
      }
      
      // Remover línea de ruta
      if (this.routeLine) {
        this.map.removeLayer(this.routeLine);
        this.routeLine = undefined;
      }
      
      // Resetear variables
      this.startPoint = undefined;
      this.endPoint = undefined;
      this.totalDistance = 0;
      this.isSelectingStartPoint = true;
      
      // Limpiar campos del formulario
      this.actividadForm.patchValue({
        kilometraje_inicio: null,
        kilometraje_fin: null
      });
      
      // Forzar actualización de validadores
      this.actividadForm.get('kilometraje_inicio')?.updateValueAndValidity();
      this.actividadForm.get('kilometraje_fin')?.updateValueAndValidity();
      
      // Campos limpiados
      
      this.snackBar.open('Puntos del mapa limpiados. Seleccione nuevamente el punto inicial.', 'Cerrar', {
        duration: 3000,
        panelClass: ['info-snackbar']
      });
    }
  }

  // Método para manejar cambios en las coordenadas
  onCoordinatesChange(): void {
    const lat = this.actividadForm.get('ubicacion_lat')?.value;
    const lng = this.actividadForm.get('ubicacion_lng')?.value;
    
    if (lat && lng && this.isValidCoordinates(lat, lng)) {
      this.updateLocation(lat, lng);
      
      // Centrar mapa en las nuevas coordenadas
      if (this.map) {
        this.map.setView([lat, lng], 15);
      }
    }
  }

  private isValidCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      tipo: ['', Validators.required],
      frente_trabajo: ['', Validators.required],
      responsable: ['', Validators.required],
      fecha_inicio: ['', [Validators.required, this.dateValidator]],
      fecha_fin_estimada: ['', [Validators.required, this.dateValidator]],
      kilometro: [0, [Validators.required, Validators.min(0)]],
      progreso_porcentaje: [0, [Validators.min(0), Validators.max(100)]],
      progreso_general: [0, [Validators.min(0), Validators.max(100)]],
      progreso_inicial: [0, [Validators.min(0), Validators.max(100)]],
      // Los campos de ubicación ahora se manejan automáticamente desde el mapa
      ubicacion_lat: [null],
      ubicacion_lng: [null],
      // Kilometraje - ahora calculado automáticamente desde el mapa
      kilometraje_inicio: [null, [Validators.required, Validators.min(0)]],
      kilometraje_fin: [null, [Validators.required, Validators.min(0)]],
      estado: ['planificada', Validators.required],
      prioridad: ['media', Validators.required],
      observaciones: [''],
      recursos_necesarios: [''],
      costo_estimado: [0, [Validators.min(0)]],
      // Campos de configuración
      requiere_evidencia: [false],
      notificar_inicio: [false],
      // FormArray para las tareas
      tareas: this.fb.array([])
    }, {
      validators: [this.dateRangeValidator, this.kilometrajeValidator]
    });
  }

  // Validador de fecha
  private dateValidator(control: any) {
    if (!control.value) return null;
    
    const date = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return { pastDate: true };
    }
    
    return null;
  }

  // Validador personalizado para fechas
  private dateRangeValidator(form: FormGroup) {
    const fechaInicio = form.get('fecha_inicio')?.value;
    const fechaFin = form.get('fecha_fin_estimada')?.value;
    
    if (fechaInicio && fechaFin && new Date(fechaInicio) >= new Date(fechaFin)) {
      return { dateRange: true };
    }
    
    return null;
  }

  // Validador personalizado para kilometraje
  private kilometrajeValidator(form: FormGroup) {
    const kmInicio = form.get('kilometraje_inicio')?.value;
    const kmFin = form.get('kilometraje_fin')?.value;
    
    // Solo validar si ambos valores están presentes y no son null/undefined
    if (kmInicio !== null && kmInicio !== undefined && kmFin !== null && kmFin !== undefined) {
      const kmInicioNum = Number(kmInicio);
      const kmFinNum = Number(kmFin);
      
      // Validar que sean números válidos
      if (isNaN(kmInicioNum) || isNaN(kmFinNum)) {
        return { kilometraje: 'Los valores de kilometraje deben ser números válidos' };
      }
      
      // Validar que inicio <= fin (permitir igualdad)
      if (kmInicioNum > kmFinNum) {
        return { kilometraje: 'El kilometraje inicial debe ser menor o igual al final' };
      }
      
      // Validar que no sean negativos
      if (kmInicioNum < 0 || kmFinNum < 0) {
        return { kilometraje: 'Los valores de kilometraje no pueden ser negativos' };
      }
    }
    
    return null;
  }

  // Métodos para manejar GPS y ubicación
  // Método obsoleto - mantenido para compatibilidad
  selectLocationOnMap(): void {
    this.snackBar.open('Seleccione directamente en el mapa el punto inicial y final de la actividad', 'Cerrar', {
      duration: 4000,
      panelClass: ['info-snackbar']
    });
  }

  // Callback para cuando se selecciona ubicación en mapa
  onSelectLocationOnMap(): void {
    this.selectLocationOnMap();
  }

  getCurrentLocation(): void {
    // Verificar si la geolocalización está disponible
    if (!navigator.geolocation) {
      this.handleGeolocationUnavailable();
      return;
    }

    // Verificar permisos antes de solicitar ubicación
    this.checkGeolocationPermission().then((hasPermission) => {
      if (!hasPermission) {
        this.handlePermissionDenied();
        return;
      }

      this.loading = true;
      this.snackBar.open('Obteniendo ubicación GPS...', 'Cerrar', { duration: 2000 });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.handleGeolocationSuccess(position);
        },
        (error) => {
          this.handleGeolocationError(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Aumentado a 15 segundos
          maximumAge: 300000 // 5 minutos
        }
      );
    }).catch((error) => {
      console.error('Error checking geolocation permission:', error);
      this.handleGeolocationUnavailable();
    });
  }

  // Verificar permisos de geolocalización
  private async checkGeolocationPermission(): Promise<boolean> {
    if (!('permissions' in navigator)) {
      // Si no hay API de permisos, asumir que está disponible
      return true;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state === 'granted' || permission.state === 'prompt';
    } catch (error) {
      // Si hay error verificando permisos, intentar de todas formas
      return true;
    }
  }

  // Manejar éxito en obtener geolocalización
  private handleGeolocationSuccess(position: GeolocationPosition): void {
    const lat = Number(position.coords.latitude.toFixed(6));
    const lng = Number(position.coords.longitude.toFixed(6));
    
    this.updateLocation(lat, lng);
    
    // Centrar mapa en la ubicación actual
    if (this.map) {
      this.map.setView([lat, lng], 15);
    }
    
    this.loading = false;
    this.snackBar.open('Ubicación GPS obtenida correctamente', 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  // Manejar errores de geolocalización con códigos específicos
  private handleGeolocationError(error: GeolocationPositionError): void {
    this.loading = false;
    console.error('Error obteniendo GPS:', error);
    
    let errorMessage = 'Error al obtener ubicación GPS';
    let fallbackMessage = '';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permisos de ubicación denegados';
        fallbackMessage = 'Puede seleccionar la ubicación manualmente en el mapa';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Ubicación no disponible';
        fallbackMessage = 'Verifique su conexión y active el GPS';
        break;
      case error.TIMEOUT:
        errorMessage = 'Tiempo de espera agotado para obtener ubicación';
        fallbackMessage = 'Intente nuevamente o seleccione manualmente';
        break;
      default:
        errorMessage = 'Error desconocido al obtener ubicación';
        fallbackMessage = 'Use la selección manual en el mapa';
        break;
    }
    
    // Mostrar error principal
    this.snackBar.open(errorMessage, 'Cerrar', {
      duration: 4000,
      panelClass: ['error-snackbar']
    });
    
    // Mostrar mensaje de fallback después de un momento
    setTimeout(() => {
      this.snackBar.open(fallbackMessage, 'Cerrar', {
        duration: 5000,
        panelClass: ['info-snackbar']
      });
    }, 4500);
    
    // Aplicar ubicación por defecto si no hay coordenadas
    this.applyDefaultLocationIfNeeded();
  }

  // Manejar cuando la geolocalización no está disponible
  private handleGeolocationUnavailable(): void {
    this.snackBar.open('GPS no disponible en este dispositivo', 'Cerrar', {
      duration: 4000,
      panelClass: ['warning-snackbar']
    });
    
    setTimeout(() => {
      this.snackBar.open('Use el botón "Seleccionar en Mapa" para elegir ubicación', 'Cerrar', {
        duration: 5000,
        panelClass: ['info-snackbar']
      });
    }, 4500);
    
    this.applyDefaultLocationIfNeeded();
  }

  // Manejar cuando los permisos son denegados
  private handlePermissionDenied(): void {
    this.snackBar.open('Permisos de ubicación requeridos', 'Cerrar', {
      duration: 4000,
      panelClass: ['warning-snackbar']
    });
    
    setTimeout(() => {
      this.snackBar.open('Active los permisos en configuración o seleccione manualmente', 'Cerrar', {
        duration: 6000,
        panelClass: ['info-snackbar']
      });
    }, 4500);
    
    this.applyDefaultLocationIfNeeded();
  }

  // Aplicar ubicación por defecto si no hay coordenadas establecidas
  private applyDefaultLocationIfNeeded(): void {
    const currentLat = this.actividadForm.get('ubicacion_lat')?.value;
    const currentLng = this.actividadForm.get('ubicacion_lng')?.value;
    
    // Solo aplicar ubicación por defecto si no hay coordenadas válidas
    if (!currentLat || !currentLng || (currentLat === 0 && currentLng === 0)) {
      // Coordenadas por defecto (Lima, Perú)
      const defaultLat = -12.0464;
      const defaultLng = -77.0428;
      
      this.updateLocation(defaultLat, defaultLng);
      
      if (this.map) {
        this.map.setView([defaultLat, defaultLng], 12);
      }
      
      // Informar al usuario sobre la ubicación por defecto
      setTimeout(() => {
        this.snackBar.open('Ubicación establecida por defecto - Puede cambiarla manualmente', 'Cerrar', {
          duration: 4000,
          panelClass: ['info-snackbar']
        });
      }, 1000);
    }
  }

  onUseCurrentGPS(): void {
    this.getCurrentLocation();
  }

  // Método para actualizar el progreso inicial
  onProgressChange(value: number): void {
    this.progressoInicial = value;
    this.actividadForm.patchValue({
      progreso_inicial: value
    });
  }

  // Método para mostrar el rango kilométrico en el mapa
  updateKilometrageRange(): void {
    const kmInicio = this.actividadForm.get('kilometraje_inicio')?.value;
    const kmFin = this.actividadForm.get('kilometraje_fin')?.value;
    const frenteId = this.actividadForm.get('frente_trabajo')?.value;

    if (kmInicio && kmFin && frenteId && this.map) {
      // Limpiar capa anterior
      if (this.rangeLayer) {
        this.map.removeLayer(this.rangeLayer);
      }

      // Crear nueva capa para el rango
      this.rangeLayer = L.layerGroup();
      
      // Simular coordenadas del rango kilométrico basado en el frente
      // En una implementación real, esto vendría de los datos del frente
      const baseLatitude = this.currentLatitude || -12.0464;
    const baseLongitude = this.currentLongitude || -77.0428;
      
      // Calcular puntos del rango (simulación lineal)
      const latOffset = 0.001; // Aproximadamente 100m por cada km
      const lngOffset = 0.001;
      
      const startPoint: [number, number] = [
        baseLatitude + (kmInicio * latOffset),
        baseLongitude + (kmInicio * lngOffset)
      ];
      
      const endPoint: [number, number] = [
        baseLatitude + (kmFin * latOffset),
        baseLongitude + (kmFin * lngOffset)
      ];
      
      // Crear línea del rango
      const rangeLine = L.polyline([startPoint, endPoint], {
        color: '#2196F3',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 5'
      }).bindPopup(`Rango: Km ${kmInicio} - Km ${kmFin}`);
      
      // Crear marcadores de inicio y fin
      const startMarker = L.marker(startPoint, {
        icon: L.divIcon({
          className: 'km-marker start-marker',
          html: `<div class="km-marker-content">Km ${kmInicio}</div>`,
          iconSize: [60, 30],
          iconAnchor: [30, 15]
        })
      }).bindPopup(`Kilometraje Inicio: ${kmInicio}`);
      
      const endMarker = L.marker(endPoint, {
        icon: L.divIcon({
          className: 'km-marker end-marker',
          html: `<div class="km-marker-content">Km ${kmFin}</div>`,
          iconSize: [60, 30],
          iconAnchor: [30, 15]
        })
      }).bindPopup(`Kilometraje Fin: ${kmFin}`);
      
      // Agregar elementos a la capa
      this.rangeLayer.addLayer(rangeLine);
      this.rangeLayer.addLayer(startMarker);
      this.rangeLayer.addLayer(endMarker);
      
      // Agregar capa al mapa
      this.rangeLayer.addTo(this.map);
      
      // Ajustar vista del mapa para mostrar el rango completo
      const bounds = L.latLngBounds([startPoint, endPoint]);
      this.map.fitBounds(bounds, { padding: [20, 20] });
    }
  }

  // Método para validar que el kilometraje esté dentro del rango del frente
  private validateKilometrageRange(): boolean {
    const kmInicio = this.actividadForm.get('kilometraje_inicio')?.value;
    const kmFin = this.actividadForm.get('kilometraje_fin')?.value;
    
    // Validando kilometraje
    
    // Permitir valores null o undefined (campos opcionales)
    if (kmInicio === null || kmInicio === undefined || kmFin === null || kmFin === undefined) {
      // Valores null/undefined detectados
      return false;
    }
    
    // Convertir a números para asegurar comparación correcta
    const kmInicioNum = Number(kmInicio);
    const kmFinNum = Number(kmFin);
    
    // Valores convertidos a números
    
    // Validar que sean números válidos
    if (isNaN(kmInicioNum) || isNaN(kmFinNum)) {
      // Valores no son números válidos
      return false;
    }
    
    // Validar que inicio <= fin (permitir igualdad para puntos específicos)
    if (kmInicioNum > kmFinNum) {
      // Inicio mayor que fin
      return false;
    }
    
    // Validar que ambos valores sean no negativos
    if (kmInicioNum < 0 || kmFinNum < 0) {
      // Valores negativos detectados
      return false;
    }
    
    // Si hay un frente seleccionado, validar contra sus límites
    if (this.selectedFrente) {
      // En una implementación real, aquí validarías contra los límites del frente
      // Por ahora, asumimos que el frente tiene un rango válido de 0 a 100 km
      const frenteKmMin = 0;
      const frenteKmMax = 100;
      
      if (kmInicioNum < frenteKmMin || kmFinNum > frenteKmMax) {
        // Fuera del rango del frente
        return false;
      }
    }
    
    // Validación exitosa
    return true;
  }
  
  // Validador personalizado para puntos del mapa
  private mapPointsValidator = (): ValidationErrors | null => {
    if (!this.startPoint || !this.endPoint) {
      return { mapPointsRequired: 'Debe seleccionar tanto el punto inicial como el final en el mapa' };
    }
    
    if (this.totalDistance <= 0) {
      return { invalidDistance: 'La distancia entre los puntos debe ser mayor a 0' };
    }
    
    return null;
  }

  // Validador personalizado para el rango de kilometraje
  private kilometrajeRangeValidator = (control: AbstractControl): ValidationErrors | null => {
    const kmInicio = control.get('kilometraje_inicio')?.value;
    const kmFin = control.get('kilometraje_fin')?.value;
    
    if (!kmInicio || !kmFin) {
      return null; // Dejar que los validadores required manejen campos vacíos
    }
    
    const errors: ValidationErrors = {};
    
    // Validar que inicio < fin
    if (kmInicio >= kmFin) {
      errors['rangeInvalid'] = 'El kilometraje inicial debe ser menor al final';
    }
    
    // Validar rango mínimo
    if ((kmFin - kmInicio) < 0.1) {
      errors['rangeMinimum'] = 'El rango mínimo debe ser de 0.1 km';
    }
    
    // Validar límites del frente (simulado)
    const frenteKmMin = 0;
    const frenteKmMax = 100;
    
    if (kmInicio < frenteKmMin) {
      errors['inicioOutOfRange'] = `El kilometraje inicial debe ser mayor a ${frenteKmMin}`;
    }
    
    if (kmFin > frenteKmMax) {
      errors['finOutOfRange'] = `El kilometraje final debe ser menor a ${frenteKmMax}`;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  // Método para manejar cambios en el frente seleccionado
  onFrenteChange(frenteId: string): void {
    this.actividadesService.frentes$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(frentes => {
      this.selectedFrente = frentes.find(f => f.id === frenteId);
      if (this.selectedFrente) {
        // Frente seleccionado
        this.updateKilometrageRange();
      }
    });
  }

  async onSubmit(): Promise<void> {
    console.log('🚀 NuevaActividadComponent.onSubmit() iniciado');
    console.log('📋 Estado del formulario:', {
      valid: this.actividadForm.valid,
      errors: this.actividadForm.errors,
      loading: this.loading
    });
    
    if (this.actividadForm.valid) {
      this.loading = true;
      
      const formData = this.actividadForm.value;
      console.log('📊 Datos del formulario:', {
        tipo: formData.tipo,
        frente_trabajo: formData.frente_trabajo,
        fecha_inicio: formData.fecha_inicio
      });
      
      try {
        // Obtener el frente seleccionado para obtener la obra_id
        console.log('🔍 Obteniendo frente seleccionado...');
        const frenteSeleccionado = await this.getFrenteById(formData.frente_trabajo);
        if (!frenteSeleccionado) {
          console.error('❌ Frente no encontrado:', formData.frente_trabajo);
          throw new Error('Frente no encontrado');
        }
        console.log('✅ Frente encontrado:', { id: frenteSeleccionado.id, obra_id: frenteSeleccionado.obra_id });
        
        // Obtener el usuario actual usando DirectAuthService
        console.log('🔍 Obteniendo usuario actual desde DirectAuthService...');
        const currentUser = this.directAuthService.getCurrentUser();
        console.log('👤 Usuario desde DirectAuthService:', {
          hasUser: !!currentUser,
          userId: currentUser?.id || 'null',
          userEmail: currentUser?.email || 'null',
          isAuthenticated: this.directAuthService.isAuthenticated()
        });
        
        if (!currentUser) {
          console.error('❌ Usuario no autenticado desde DirectAuthService');
          console.log('🔍 Verificando estado de autenticación completo...');
          console.log('📊 DirectAuthService state:', {
            hasToken: !!this.directAuthService.getAccessToken(),
            isAuthenticated: this.directAuthService.isAuthenticated()
          });
          throw new Error('Usuario no autenticado');
        }
        
        console.log('✅ Usuario autenticado, preparando datos de actividad...');
        
        // Validando rango de kilometraje
        // Validar rango de kilometraje
        if (!this.validateKilometrageRange()) {
          throw new Error('El rango de kilometraje no es válido');
        }
        // Rango de kilometraje válido

        // Validar que se hayan seleccionado ambos puntos
        if (!this.startPoint || !this.endPoint) {
          throw new Error('Debe seleccionar tanto el punto inicial como el punto final en el mapa');
        }
        // Puntos del mapa válidos

        // Preparar datos para envío
        const actividadData = {
          obra_id: frenteSeleccionado.obra_id,
          frente_id: formData.frente_trabajo,
          user_id: currentUser.id,
          tipo_actividad: formData.tipo,
          fecha: formData.fecha_inicio,
          ubicacion: {
            lat: this.startPoint.lat,
            lng: this.startPoint.lng,
            direccion: `Punto inicial: ${this.startPoint.lat}, ${this.startPoint.lng} - Punto final: ${this.endPoint.lat}, ${this.endPoint.lng}`
          },
          ubicacion_inicio: {
            lat: this.startPoint.lat,
            lng: this.startPoint.lng,
            direccion: 'Punto inicial seleccionado en mapa'
          },
          ubicacion_fin: {
            lat: this.endPoint.lat,
            lng: this.endPoint.lng,
            direccion: 'Punto final seleccionado en mapa'
          },
          responsable: formData.responsable,
          estado: 'programado' as 'programado',
          observaciones: formData.observaciones || null,
          kilometraje_inicio: formData.kilometraje_inicio,
          kilometraje_fin: formData.kilometraje_fin,
          distancia_total: this.totalDistance,
          progreso_inicial: formData.progreso_inicial || formData.progreso_general || 0
        };
      
        console.log('🎯 Llamando a actividadesService.createActividad...');
        console.log('📦 Datos de actividad preparados:', {
          obra_id: actividadData.obra_id,
          frente_id: actividadData.frente_id,
          user_id: actividadData.user_id,
          tipo_actividad: actividadData.tipo_actividad
        });
        
        const response = await this.actividadesService.createActividad(actividadData);
        console.log('✅ Actividad creada exitosamente:', { id: response?.id });
        
        // Si hay tareas, crearlas después de crear la actividad
        if (this.tareasFormArray.length > 0 && response?.id) {
          // Creando tareas para la actividad
          try {
            for (let i = 0; i < this.tareasFormArray.length; i++) {
              const tareaControl = this.tareasFormArray.at(i);
              const tareaValue = tareaControl.value;
              if (tareaValue.nombre && tareaValue.nombre.trim()) {
                const tareaData = {
                  actividad_id: response.id,
                  nombre: tareaValue.nombre.trim(),
                  descripcion: tareaValue.descripcion?.trim() || null,
                  completada: tareaValue.completada || false,
                  orden: tareaValue.orden || (i + 1),
                  fecha_creacion: new Date().toISOString()
                };
                await this.actividadesService.createTarea(tareaData);
              }
            }
            // Todas las tareas creadas exitosamente
          } catch (tareaError) {
            // Error al crear tareas
            this.snackBar.open('Actividad creada, pero hubo un error al crear algunas tareas', 'Cerrar', {
              duration: 5000,
              panelClass: ['warning-snackbar']
            });
          }
        }
        
        this.loading = false;
        this.snackBar.open('Actividad creada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/actividades']);
      } catch (error: any) {
        this.loading = false;
        console.error('Error al crear actividad:', error);
        this.snackBar.open('Error al crear la actividad: ' + (error.message || 'Error desconocido'), 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Por favor, complete todos los campos requeridos', 'Cerrar', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.actividadForm.controls).forEach(key => {
      const control = this.actividadForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/actividades']);
  }

  // Getters para validación en template
  get nombre() { return this.actividadForm.get('nombre'); }
  get descripcion() { return this.actividadForm.get('descripcion'); }
  get tipo() { return this.actividadForm.get('tipo'); }
  get prioridad() { return this.actividadForm.get('prioridad'); }
  get frente_trabajo() { return this.actividadForm.get('frente_trabajo'); }
  get responsable() { return this.actividadForm.get('responsable'); }
  get fecha_inicio() { return this.actividadForm.get('fecha_inicio'); }
  get fecha_fin_estimada() { return this.actividadForm.get('fecha_fin_estimada'); }
  get kilometraje_inicio() { return this.actividadForm.get('kilometraje_inicio'); }
  get kilometraje_fin() { return this.actividadForm.get('kilometraje_fin'); }
  get progreso_inicial() { return this.actividadForm.get('progreso_inicial'); }
  get progreso_general() { return this.actividadForm.get('progreso_general'); }
  
  // Getter para FormArray de tareas
  get tareasFormArray() { return this.actividadForm.get('tareas') as FormArray; }

  // Computed properties
  get progressText(): string {
    return `${this.progressoInicial}% completado`;
  }

  get coordinatesText(): string {
    if (this.currentLatitude === 0 && this.currentLongitude === 0) {
      return 'No seleccionada';
    }
    return `${this.currentLatitude.toFixed(6)}, ${this.currentLongitude.toFixed(6)}`;
  }

  // Métodos para manejo de tareas
  agregarTarea(): void {
    const nuevaTareaGroup = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      orden: [this.tareasFormArray.length + 1],
      completada: [false]
    });
    this.tareasFormArray.push(nuevaTareaGroup);
    // Nueva tarea agregada
  }

  eliminarTarea(index: number): void {
    if (index >= 0 && index < this.tareasFormArray.length) {
      this.tareasFormArray.removeAt(index);
      // Reordenar las tareas restantes
      for (let i = 0; i < this.tareasFormArray.length; i++) {
        this.tareasFormArray.at(i).get('orden')?.setValue(i + 1);
      }
      // Tarea eliminada
    }
  }
}