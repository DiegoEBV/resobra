import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import * as L from 'leaflet';

// Angular Material
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';

// Services
import { MapService } from '../../services/map.service';
import { ActividadesService } from '../../services/actividades.service';
import { AuthService } from '../../services/auth.service';
import { KilometrosService } from '../../services/kilometros.service';

// Models
import { Frente as DatabaseFrente, Obra, Kilometro, EstadoConfig } from '../../interfaces/database.interface';
import { Actividad, Frente as ServiceFrente } from '../../services/actividades.service';

// Type union para manejar ambas definiciones de Frente
type Frente = DatabaseFrente | ServiceFrente;

// Interfaces
export interface FrenteFormData {
  mode: 'create' | 'edit';
  frente?: Frente;
  initialCoordinates?: { lat: number; lng: number };
}

// Components
import { FrenteFormComponent } from '../../components/frente-form/frente-form.component';
import { DirectAuthService } from '../../services/direct-auth.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule
  ],
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css'
})
export class MapaComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private map!: L.Map;
  private markers: L.LayerGroup = new L.LayerGroup();
  private kilometroLayers: L.LayerGroup = new L.LayerGroup();
  private actividadLayers: L.LayerGroup = new L.LayerGroup(); // Nueva capa para trazos de actividades
  
  // Estado del componente
  loading = true;
  sidenavOpened = true;
  selectedFrente: Frente | null = null;
  isCreatingFrente = false;
  tempMarker: L.Marker | null = null;
  isDragMode = false;
  showKilometricView = false;
  showActividadTraces = true; // Nueva opción para mostrar trazos de actividades

  // Datos
  frentes: Frente[] = [];
  actividades: Actividad[] = [];
  filteredFrente: Frente[] = [];
  kilometros: Kilometro[] = [];
  estadosConfig: EstadoConfig[] = [];
  
  // Filtros
  estadoFilter = 'todos';
  tipoFilter = 'todos';
  searchTerm = '';
  
  // Opciones de filtro
  estadosFrente = [
    { value: 'todos', label: 'Todos los Estados' },
    { value: 'activo', label: 'Activo' },
    { value: 'pausado', label: 'Pausado' },
    { value: 'completado', label: 'Completado' },
    { value: 'planificado', label: 'Planificado' }
  ];
  
  tiposActividad = [
    { value: 'todos', label: 'Todos los Tipos' },
    { value: 'excavacion', label: 'Excavación' },
    { value: 'pavimentacion', label: 'Pavimentación' },
    { value: 'señalizacion', label: 'Señalización' },
    { value: 'drenaje', label: 'Drenaje' },
    { value: 'puentes', label: 'Puentes y Estructuras' },
    { value: 'mantenimiento', label: 'Mantenimiento' }
  ];

  constructor(
    private mapService: MapService,
    private actividadesService: ActividadesService,
    private authService: AuthService,
    private kilometrosService: KilometrosService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    public directAuthService: DirectAuthService // Hacer público para usar en template
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('🗺️ [MapaComponent] Inicializando componente de mapa');
    this.loading = true;
    
    try {
      // Verificar autenticación antes de cargar datos
      const user = this.directAuthService.getCurrentUser();
      if (!user) {
        console.warn('⚠️ [MapaComponent] Usuario no autenticado, mostrando mapa básico');
        this.snackBar.open('Para ver los frentes y actividades, inicia sesión', 'Ir a Login', {
          duration: 8000,
          panelClass: ['warning-snackbar']
        }).onAction().subscribe(() => {
          this.router.navigate(['/login']);
        });
        this.initializeMap();
        this.loading = false;
        return;
      }

      await this.loadData();
      this.initializeMap();
      
      // NUEVA FUNCIONALIDAD: Suscribirse a cambios de progreso de actividades
      this.actividadesService.progresoUpdated$.pipe(
        takeUntil(this.destroy$)
      ).subscribe(({ actividadId, progreso }) => {
        console.log(`[MAPA] Progreso actualizado para actividad ${actividadId}: ${progreso}%`);
        // Recargar trazos de actividades para reflejar cambios
        this.updateActividadTraces();
      });
      
      // Cargar datos kilométricos si la vista está activada
      if (this.showKilometricView) {
        await this.loadKilometricData();
      }

      // Cargar trazos de actividades
      if (this.showActividadTraces) {
        await this.updateActividadTraces();
      }
    } catch (error) {
      console.error('❌ [MapaComponent] Error al inicializar:', error);
      this.snackBar.open('Error al cargar los datos del mapa', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.loading = false;
    }
  }

  ngAfterViewInit(): void {
    // Esperar un tick para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
      if (!this.map) {
        this.initializeMap();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }

  private async loadData(): Promise<void> {
    try {
      // [LoadData] Iniciando carga de datos del mapa
      this.loading = true;
      
      // Verificar autenticación nuevamente
      const user = this.directAuthService.getCurrentUser();
      if (!user) {
        console.warn('⚠️ [LoadData] Usuario no autenticado, no se pueden cargar datos');
        return;
      }
      
      // Cargar frentes
      this.actividadesService.frentes$
        .pipe(takeUntil(this.destroy$))
        .subscribe(frentes => {
          // [LoadData] Frentes recibidos
          console.log(`📍 [LoadData] ${frentes.length} frentes recibidos`);
          frentes.forEach(frente => {
            console.log(`📍 [LoadData] Frente: ${frente.nombre} - Estado: ${frente.estado} - Coords: ${frente.ubicacion_lat}, ${frente.ubicacion_lng}`);
          });
          this.frentes = frentes;
          this.applyFilters();
          this.updateMapMarkers();
        });
      
      // Cargar actividades
      this.actividadesService.actividades$
        .pipe(takeUntil(this.destroy$))
        .subscribe(actividades => {
          // [LoadData] Actividades recibidas
          console.log(`🔧 [LoadData] ${actividades.length} actividades recibidas`);
          this.actividades = actividades;
          this.updateMapMarkers();
        });
      
      // Refrescar datos
      // [LoadData] Refrescando datos del servicio
      console.log('🔄 [LoadData] Refrescando datos del servicio...');
      await this.actividadesService.refresh();
      console.log('✅ [LoadData] Datos del servicio refrescados');
      
      // Cargar datos kilométricos
      // [LoadData] Iniciando carga de datos kilométricos
      console.log('📏 [LoadData] Iniciando carga de datos kilométricos...');
      await this.loadKilometricData();
      console.log('✅ [LoadData] Datos kilométricos cargados');
      
    } catch (error) {
      console.error('❌ [LoadData] Error loading map data:', error);
      this.snackBar.open('Error al cargar los datos del mapa. Verifica tu conexión e inicia sesión.', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.loading = false;
      console.log('✅ [LoadData] Carga de datos completada');
    }
  }

  private initializeMap(): void {
    try {
      console.log('🗺️ [MapaComponent] Iniciando inicialización del mapa');
      
      // Verificar si el contenedor del mapa existe
      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        console.error('❌ [MapaComponent] Contenedor del mapa no encontrado');
        return;
      }

      // Si el mapa ya existe, destruirlo primero
      if (this.map) {
        console.log('🗺️ [MapaComponent] Removiendo mapa existente');
        this.map.remove();
      }

      // Configurar iconos de Leaflet con fallback
      try {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          tooltipAnchor: [16, -28],
          shadowSize: [41, 41]
        });
      } catch (iconError) {
        console.warn('⚠️ [MapaComponent] Error configurando iconos, usando iconos por defecto:', iconError);
      }

      // Pequeña pausa adicional para asegurar que el contenedor esté listo
      setTimeout(() => {
        try {
          // Inicializar mapa centrado en Colombia con configuración más robusta
          this.map = L.map('map', {
            center: [4.5709, -74.2973],
            zoom: 6,
            zoomControl: true,
            attributionControl: true,
            preferCanvas: false,
            fadeAnimation: false, // Desactivar animaciones que pueden causar problemas
            zoomAnimation: false,
            markerZoomAnimation: false
          });

          // Agregar capa base con manejo de errores
          const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          });

          tileLayer.on('tileerror', (e) => {
            console.warn('⚠️ [MapaComponent] Error cargando tile:', e);
          });

          tileLayer.addTo(this.map);

          // Inicializar capas de grupo
          this.markers = new L.LayerGroup();
          this.kilometroLayers = new L.LayerGroup();
          this.actividadLayers = new L.LayerGroup();

          // Agregar capas al mapa
          this.markers.addTo(this.map);
          this.kilometroLayers.addTo(this.map);
          this.actividadLayers.addTo(this.map);

          // Configurar eventos del mapa
          this.map.on('click', (e: L.LeafletMouseEvent) => {
            if (this.isCreatingFrente) {
              this.handleMapClickForFrente(e);
            } else {
              this.selectedFrente = null;
            }
          });

          // Manejar errores del mapa
          this.map.on('error', (e) => {
            console.error('❌ [MapaComponent] Error del mapa:', e);
          });

          console.log('✅ [MapaComponent] Mapa inicializado correctamente');
          
          // Actualizar marcadores si hay datos disponibles
          if (this.frentes && this.frentes.length > 0) {
            this.updateMapMarkers();
          }

          // Actualizar trazos de actividades si están habilitados
          if (this.showActividadTraces) {
            this.updateActividadTraces();
          }

        } catch (mapCreationError) {
          console.error('❌ [MapaComponent] Error creando instancia del mapa:', mapCreationError);
          throw mapCreationError;
        }
      }, 50);

    } catch (error) {
      console.error('❌ [MapaComponent] Error crítico inicializando mapa:', error);
      this.snackBar.open('Error al inicializar el mapa. Recarga la página.', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private updateMapMarkers(): void {
    if (!this.map) return;

    // Limpiar marcadores existentes
    this.markers.clearLayers();

    // Agregar marcadores para cada frente filtrado
    this.filteredFrente.forEach(frente => {
      if (frente.ubicacion_lat && frente.ubicacion_lng) {
        const marker = this.isDragMode ? 
          this.createDraggableFrenteMarker(frente) : 
          this.createFrenteMarker(frente);
        this.markers.addLayer(marker);
      }
    });

    // Ajustar vista si hay marcadores
    if (this.filteredFrente.length > 0) {
      const group = new L.FeatureGroup(this.markers.getLayers());
      if (group.getBounds().isValid()) {
        this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    }
  }

  private createFrenteMarker(frente: Frente): L.Marker {
    const actividadesFrente = this.actividades.filter(a => a.frente_id === frente.id);
    const actividadesActivas = actividadesFrente.filter(a => a.estado === 'ejecucion').length;
    
    // Crear icono personalizado usando CSS en lugar de mat-icon
    const iconColor = this.getFrenteIconColor(frente.estado);
    const customIcon = L.divIcon({
      html: `
        <div class="custom-marker-container" style="background-color: ${iconColor}; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          <span style="color: white; font-weight: bold; font-size: 12px;">${this.getFrenteIconText(frente.estado)}</span>
          ${actividadesActivas > 0 ? `<div class="activity-badge" style="position: absolute; top: -5px; right: -5px; background: #ff4444; color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">${actividadesActivas}</div>` : ''}
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([frente.ubicacion_lat!, frente.ubicacion_lng!], { icon: customIcon });

    // Crear popup con información del frente
    const popupContent = this.createFrentePopup(frente);
    marker.bindPopup(popupContent, { maxWidth: 300 });

    // Evento click en marcador
    marker.on('click', () => {
      this.selectedFrente = frente;
      this.sidenavOpened = true;
    });

    return marker;
  }

  private createFrentePopup(frente: Frente): string {
    const actividades = this.getActividadesByFrente(frente.id);
    const actividadesCompletadas = actividades.filter(a => a.estado === 'finalizado').length;
    const actividadesEnProgreso = actividades.filter(a => a.estado === 'ejecucion').length;
    const progresoPromedio = actividades.length > 0 ? 
      Math.round((actividadesCompletadas / actividades.length) * 100) : 0;

    return `
      <div class="frente-popup">
        <h3>${frente.nombre}</h3>
        <p><strong>Estado:</strong> <span class="estado-${frente.estado}">${this.getEstadoLabel(frente.estado)}</span></p>
        <p><strong>Ubicación:</strong> ${frente.ubicacion_lat?.toFixed(4) || 'N/A'}, ${frente.ubicacion_lng?.toFixed(4) || 'N/A'}</p>
        <div class="actividades-summary">
          <h4>Actividades:</h4>
          <p>Total: ${actividades.length}</p>
          <p>En progreso: ${actividadesEnProgreso}</p>
          <p>Completadas: ${actividadesCompletadas}</p>
          <p>Progreso promedio: ${progresoPromedio.toFixed(1)}%</p>
        </div>
        ${frente.descripcion ? `<p><strong>Descripción:</strong> ${frente.descripcion}</p>` : ''}
      </div>
    `;
  }

  getFrenteIconColor(estado: string): string {
    const colors = {
      'activo': '#4caf50',
      'pausado': '#ff9800',
      'completado': '#2196f3',
      'planificado': '#9e9e9e'
    };
    return colors[estado as keyof typeof colors] || '#9e9e9e';
  }

  getFrenteIconText(estado: string): string {
    const icons = {
      'activo': 'A',
      'pausado': 'P',
      'completado': 'C',
      'planificado': 'PL'
    };
    return icons[estado as keyof typeof icons] || 'F';
  }

  getFrenteIcon(estado: string): string {
    const icons = {
      'activo': 'construction',
      'pausado': 'pause_circle',
      'completado': 'check_circle',
      'planificado': 'schedule'
    };
    return icons[estado as keyof typeof icons] || 'location_on';
  }

  getFrenteMarkerIcon(estado: string): L.DivIcon {
    const iconColor = this.getFrenteIconColor(estado);
    return L.divIcon({
      html: `
        <div class="custom-marker-container" style="background-color: ${iconColor}; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          <span style="color: white; font-weight: bold; font-size: 12px;">${this.getFrenteIconText(estado)}</span>
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }

  getEstadoLabel(estado: string): string {
    const labels = {
      'activo': 'Activo',
      'pausado': 'Pausado',
      'completado': 'Completado',
      'planificado': 'Planificado'
    };
    return labels[estado as keyof typeof labels] || estado;
  }

  // Métodos de filtrado
  applyFilters(): void {
    this.filteredFrente = this.frentes.filter(frente => {
      const matchesEstado = this.estadoFilter === 'todos' || frente.estado === this.estadoFilter;
      const matchesSearch = !this.searchTerm || 
        frente.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        frente.descripcion?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      let matchesTipo = this.tipoFilter === 'todos';
      if (!matchesTipo) {
        const actividadesFrente = this.actividades.filter(a => a.frente_id === frente.id);
        matchesTipo = actividadesFrente.some(a => a.tipo_actividad === this.tipoFilter);
      }
      
      return matchesEstado && matchesSearch && matchesTipo;
    });
    
    this.updateMapMarkers();
  }

  onEstadoFilterChange(): void {
    this.applyFilters();
  }

  onTipoFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  // Métodos de navegación
  centerOnFrente(frente: Frente): void {
    if (frente.ubicacion_lat && frente.ubicacion_lng) {
      this.map.setView([frente.ubicacion_lat, frente.ubicacion_lng], 15);
      this.selectedFrente = frente;
    }
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

  // Métodos de utilidad
  getActividadesByFrente(frenteId: string): Actividad[] {
    return this.actividades.filter(a => a.frente_id === frenteId);
  }

  getProgresoPromedio(frenteId: string): number {
    const actividades = this.getActividadesByFrente(frenteId);
    if (actividades.length === 0) return 0;
    const completadas = actividades.filter(a => a.estado === 'finalizado').length;
    return Math.round((completadas / actividades.length) * 100);
  }

  getActividadesEnProgreso(frenteId: string): number {
    return this.getActividadesByFrente(frenteId).filter(a => a.estado === 'ejecucion').length;
  }

  getActividadesCompletadas(frenteId: string): number {
    return this.getActividadesByFrente(frenteId).filter(a => a.estado === 'finalizado').length;
  }

  getEstadoColor(estado: string): string {
    const colors = {
      'activo': 'primary',
      'pausado': 'warn',
      'completado': 'accent',
      'planificado': ''
    };
    return colors[estado as keyof typeof colors] || '';
  }

  refreshData(): void {
    this.loadData();
  }

  // Métodos kilométricos
  async loadKilometricData(): Promise<void> {
    console.log('📊 [MapaComponent] Cargando datos kilométricos');
    console.log('📊 [MapaComponent] Frentes disponibles:', this.frentes.length);
    
    try {
      // Obtener todos los kilómetros
      this.kilometrosService.getKilometros().subscribe({
        next: (kilometros) => {
          console.log('📊 [MapaComponent] Kilómetros cargados:', kilometros.length);
          console.log('📊 [MapaComponent] Datos kilómetros:', kilometros);
          this.kilometros = kilometros;
          
          // Verificar si hay kilómetros con colores válidos
          const kilometrosConColor = kilometros.filter(k => k.color && k.color !== '#6B7280');
          console.log('📊 [MapaComponent] Kilómetros con color específico:', kilometrosConColor.length);
          
          // Si la vista kilométrica está activada, actualizar visualización
          if (this.showKilometricView) {
            console.log('📊 [MapaComponent] Vista kilométrica activa, actualizando visualización');
            this.updateKilometricVisualization();
          } else {
            console.log('📊 [MapaComponent] Vista kilométrica no activa');
          }
        },
        error: (error) => {
          console.error('❌ [MapaComponent] Error al cargar kilómetros:', error);
          this.snackBar.open('Error al cargar datos kilométricos', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } catch (error) {
      console.error('❌ [MapaComponent] Error en loadKilometricData:', error);
    }
  }

  async toggleKilometricView(): Promise<void> {
    this.showKilometricView = !this.showKilometricView;
    // [ToggleKilometricView] Vista kilométrica
    
    if (this.showKilometricView) {
      // [ToggleKilometricView] Iniciando visualización kilométrica
      
      // Recargar datos kilométricos para obtener los colores actualizados
      await this.loadKilometricData();
      
      // [ToggleKilometricView] Frentes y kilómetros disponibles
      
      this.updateKilometricVisualization();
      this.snackBar.open('Vista kilométrica activada - Datos actualizados', 'Cerrar', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } else {
      this.kilometroLayers.clearLayers();
      this.snackBar.open('Vista kilométrica desactivada', 'Cerrar', {
        duration: 3000,
        panelClass: ['info-snackbar']
      });
    }
  }

  private updateKilometricVisualization(): void {
    console.log('🗺️ [UpdateKilometricVisualization] Iniciando actualización de visualización');
    console.log('🗺️ [UpdateKilometricVisualization] Map exists:', !!this.map);
    console.log('🗺️ [UpdateKilometricVisualization] Show kilometric view:', this.showKilometricView);
    console.log('🗺️ [UpdateKilometricVisualization] Kilómetros disponibles:', this.kilometros.length);
    
    if (!this.map || !this.showKilometricView) {
      console.log('🗺️ [UpdateKilometricVisualization] Saliendo: mapa no existe o vista kilométrica desactivada');
      return;
    }

    // Limpiar capas kilométricas existentes
    this.kilometroLayers.clearLayers();
    console.log('🗺️ [UpdateKilometricVisualization] Capas kilométricas limpiadas');

    // Agrupar kilómetros por frente
    const kilometrosByFrente = this.groupKilometrosByFrente();
    console.log('🗺️ [UpdateKilometricVisualization] Kilómetros agrupados por frente:', Object.keys(kilometrosByFrente).length);

    // Crear visualización para cada frente
    Object.entries(kilometrosByFrente).forEach(([frenteId, kilometros]) => {
      const frente = this.frentes.find(f => f.id === frenteId);
      console.log('🗺️ [UpdateKilometricVisualization] Procesando frente:', frenteId);
      console.log('🗺️ [UpdateKilometricVisualization] Frente encontrado:', !!frente);
      
      if (frente) {
        console.log('🗺️ [UpdateKilometricVisualization] Coordenadas inicio:', frente.coordenadas_inicio);
        console.log('🗺️ [UpdateKilometricVisualization] Coordenadas fin:', frente.coordenadas_fin);
        console.log('🗺️ [UpdateKilometricVisualization] Kilómetros en frente:', kilometros.length);
      }
      
      if (frente && frente.coordenadas_inicio && frente.coordenadas_fin) {
        console.log('🗺️ [UpdateKilometricVisualization] Creando ruta kilométrica para frente:', frente.nombre);
        this.createKilometricRoute(frente, kilometros);
      } else {
        console.log('🗺️ [UpdateKilometricVisualization] Frente no tiene coordenadas completas:', frente?.nombre || 'Frente no encontrado');
      }
    });
    
    console.log('🗺️ [UpdateKilometricVisualization] Visualización kilométrica completada');
  }

  private groupKilometrosByFrente(): { [frenteId: string]: Kilometro[] } {
    return this.kilometros.reduce((acc, kilometro) => {
      if (!acc[kilometro.frente_id]) {
        acc[kilometro.frente_id] = [];
      }
      acc[kilometro.frente_id].push(kilometro);
      return acc;
    }, {} as { [frenteId: string]: Kilometro[] });
  }

  private createKilometricRoute(frente: Frente, kilometros: Kilometro[]): void {
    if (!frente.coordenadas_inicio || !frente.coordenadas_fin) return;

    // Obtener todos los puntos de la ruta (incluyendo intermedios)
    const routePoints = this.getRoutePoints(frente);

    // Crear línea base del frente siguiendo todos los puntos de control
    const routeLine = L.polyline(routePoints, {
      color: '#cccccc',
      weight: 8,
      opacity: 0.7
    });

    this.kilometroLayers.addLayer(routeLine);

    // Crear segmentos coloreados para cada kilómetro usando interpolación por curva
    kilometros.sort((a, b) => a.kilometro - b.kilometro).forEach((kilometro, index) => {
      // Usar interpolación por curva para obtener la posición exacta del kilómetro
      const kmPosition = this.interpolateAlongCurve(frente, kilometro.kilometro);
      
      if (!kmPosition) return;

      // Calcular posición del siguiente kilómetro para crear el segmento
      let nextKmPosition: [number, number] | null = null;
      if (index < kilometros.length - 1) {
        nextKmPosition = this.interpolateAlongCurve(frente, kilometros[index + 1].kilometro);
      } else {
        // Para el último kilómetro, usar el punto final
        if (frente.coordenadas_fin) {
          nextKmPosition = [frente.coordenadas_fin.lat, frente.coordenadas_fin.lng];
        }
      }

      if (nextKmPosition) {
        // Crear segmento coloreado siguiendo la curva
        const segmentPoints = this.getSegmentPoints(frente, kilometro.kilometro, 
          index < kilometros.length - 1 ? kilometros[index + 1].kilometro : frente.km_final!);
        
        const segment = L.polyline(segmentPoints, {
          color: kilometro.color,
          weight: 6,
          opacity: 0.9
        });

        // Agregar popup con información del kilómetro
        const popupContent = this.createKilometroPopup(kilometro, frente);
        segment.bindPopup(popupContent);

        this.kilometroLayers.addLayer(segment);
      }

      // Agregar marcador en el punto exacto del kilómetro
      const kmMarker = L.circleMarker(kmPosition, {
        radius: 8,
        fillColor: kilometro.color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      });

      const popupContent = this.createKilometroPopup(kilometro, frente);
      kmMarker.bindPopup(popupContent);
      this.kilometroLayers.addLayer(kmMarker);
    });

    // Agregar marcadores para puntos de control intermedios (solo en modo de edición)
    if (frente.coordenadas_intermedias && frente.coordenadas_intermedias.length > 0) {
      frente.coordenadas_intermedias.forEach((punto, index) => {
        const controlMarker = L.circleMarker([punto.lat, punto.lng], {
          radius: 6,
          fillColor: '#ff9800',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        });

        controlMarker.bindPopup(`
          <div class="control-point-popup">
            <h4>Punto de Control ${index + 1}</h4>
            <p><strong>Kilometraje:</strong> ${punto.kilometraje}</p>
            <p><strong>Coordenadas:</strong> ${punto.lat.toFixed(6)}, ${punto.lng.toFixed(6)}</p>
          </div>
        `);

        this.kilometroLayers.addLayer(controlMarker);
      });
    }
  }

  /**
   * Obtiene los puntos que forman un segmento de la ruta entre dos kilometrajes
   * @param frente Frente con coordenadas
   * @param startKm Kilometraje inicial del segmento
   * @param endKm Kilometraje final del segmento
   * @returns Array de coordenadas del segmento
   */
  private getSegmentPoints(frente: Frente, startKm: number, endKm: number): [number, number][] {
    const points: [number, number][] = [];
    
    // Obtener todos los puntos de control
    const allPoints = this.getRoutePoints(frente);
    
    if (!frente.km_inicial || !frente.km_final) return points;
    
    // Si no hay puntos intermedios, usar interpolación simple
    if (!frente.coordenadas_intermedias || frente.coordenadas_intermedias.length === 0) {
      const startPos = this.interpolateAlongCurve(frente, startKm);
      const endPos = this.interpolateAlongCurve(frente, endKm);
      if (startPos && endPos) {
        points.push(startPos, endPos);
      }
      return points;
    }

    // Crear array de todos los puntos de control
    const controlPoints: { lat: number; lng: number; kilometraje: number }[] = [];
    
    if (frente.coordenadas_inicio && frente.km_inicial) {
      controlPoints.push({
        lat: frente.coordenadas_inicio.lat, 
        lng: frente.coordenadas_inicio.lng, 
        kilometraje: frente.km_inicial
      });
    }
    
    controlPoints.push(...frente.coordenadas_intermedias);
    if (frente.coordenadas_fin && frente.km_final) {
      controlPoints.push({
        lat: frente.coordenadas_fin.lat,
        lng: frente.coordenadas_fin.lng,
        kilometraje: frente.km_final
      });
    }
    
    controlPoints.sort((a, b) => a.kilometraje - b.kilometraje);

    // Agregar punto inicial del segmento
    const startPos = this.interpolateAlongCurve(frente, startKm);
    if (startPos) points.push(startPos);

    // Agregar puntos de control que estén dentro del rango del segmento
    controlPoints.forEach(point => {
      if (point.kilometraje > startKm && point.kilometraje < endKm) {
        points.push([point.lat, point.lng]);
      }
    });

    // Agregar punto final del segmento
    const endPos = this.interpolateAlongCurve(frente, endKm);
    if (endPos) points.push(endPos);

    return points;
  }

  

  /**
   * Interpola puntos a lo largo de una curva definida por puntos de control intermedios
   * @param frente Frente con coordenadas de inicio, fin y puntos intermedios
   * @param targetKilometraje Kilometraje objetivo para interpolar
   * @returns Coordenadas interpoladas en el kilometraje objetivo
   */
  private interpolateAlongCurve(frente: Frente, targetKilometraje: number): [number, number] | null {
    if (!frente.coordenadas_inicio || !frente.coordenadas_fin) return null;
    if (!frente.km_inicial || !frente.km_final) return null;

    // Crear array de todos los puntos de control ordenados por kilometraje
    const controlPoints: { lat: number; lng: number; kilometraje: number }[] = [];
    
    // Agregar punto inicial
    controlPoints.push({ 
      lat: frente.coordenadas_inicio.lat, 
      lng: frente.coordenadas_inicio.lng, 
      kilometraje: frente.km_inicial 
    });

    // Agregar puntos intermedios si existen
    if (frente.coordenadas_intermedias && frente.coordenadas_intermedias.length > 0) {
      controlPoints.push(...frente.coordenadas_intermedias);
    }

    // Agregar punto final
    controlPoints.push({
      lat: frente.coordenadas_fin.lat,
      lng: frente.coordenadas_fin.lng,
      kilometraje: frente.km_final
    });

    // Ordenar puntos por kilometraje
    controlPoints.sort((a, b) => a.kilometraje - b.kilometraje);

    // Encontrar el segmento que contiene el kilometraje objetivo
    for (let i = 0; i < controlPoints.length - 1; i++) {
      const startPoint = controlPoints[i];
      const endPoint = controlPoints[i + 1];

      if (targetKilometraje >= startPoint.kilometraje && targetKilometraje <= endPoint.kilometraje) {
        // Calcular progreso dentro del segmento
        const segmentLength = endPoint.kilometraje - startPoint.kilometraje;
        const progress = segmentLength > 0 ? (targetKilometraje - startPoint.kilometraje) / segmentLength : 0;

        // Interpolar linealmente dentro del segmento
        return this.interpolatePoint(
          [startPoint.lat, startPoint.lng],
          [endPoint.lat, endPoint.lng],
          progress
        );
      }
    }

    // Si no se encuentra el segmento, usar interpolación lineal simple como fallback
    const totalLength = frente.km_final - frente.km_inicial;
    const progress = totalLength > 0 ? (targetKilometraje - frente.km_inicial) / totalLength : 0;
    return this.interpolatePoint(
      [frente.coordenadas_inicio.lat, frente.coordenadas_inicio.lng],
      [frente.coordenadas_fin.lat, frente.coordenadas_fin.lng],
      progress
    );
  }

  /**
   * Obtiene todos los puntos de la ruta incluyendo puntos intermedios
   * @param frente Frente con coordenadas
   * @returns Array de coordenadas que definen la ruta completa
   */
  private getRoutePoints(frente: Frente): [number, number][] {
    if (!frente.coordenadas_inicio || !frente.coordenadas_fin) return [];

    const points: [number, number][] = [];
    
    // Agregar punto inicial
    points.push([frente.coordenadas_inicio.lat, frente.coordenadas_inicio.lng]);

    // Agregar puntos intermedios ordenados por kilometraje
    if (frente.coordenadas_intermedias && frente.coordenadas_intermedias.length > 0) {
      const sortedIntermediates = [...frente.coordenadas_intermedias]
        .sort((a, b) => a.kilometraje - b.kilometraje);
      
      sortedIntermediates.forEach(point => {
        points.push([point.lat, point.lng]);
      });
    }

    // Agregar punto final
    points.push([frente.coordenadas_fin.lat, frente.coordenadas_fin.lng]);

    return points;
  }

  private createKilometroPopup(kilometro: Kilometro, frente: Frente): string {
    return `
      <div class="kilometro-popup">
        <h4>Kilómetro ${kilometro.kilometro}</h4>
        <p><strong>Frente:</strong> ${frente.nombre}</p>
        <p><strong>Estado:</strong> <span style="color: ${kilometro.color}">${kilometro.estado}</span></p>
        <p><strong>Progreso:</strong> ${kilometro.progreso_porcentaje}%</p>
        <p><strong>Actividades:</strong> ${kilometro.actividades_count}</p>
        <p><strong>Última actualización:</strong> ${new Date(kilometro.fecha_ultima_actualizacion).toLocaleDateString()}</p>
      </div>
    `;
  }

  async generateKilometrosForFrente(frente: Frente): Promise<void> {
    if (!frente.km_inicial || !frente.km_final) {
      this.snackBar.open('El frente debe tener rangos kilométricos definidos', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    try {
      await this.kilometrosService.generateKilometrosForFrente(
        frente.id,
        frente.km_inicial,
        frente.km_final
      ).toPromise();

      this.snackBar.open('Kilómetros generados exitosamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      // Recargar datos kilométricos
      await this.loadKilometricData();
    } catch (error) {
      // Error generating kilometros
      this.snackBar.open('Error al generar kilómetros', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  // Métodos para gestión de frentes
  startCreatingFrente(): void {
    this.isCreatingFrente = true;
    this.snackBar.open('Haz clic en el mapa para seleccionar la ubicación del frente', 'Cancelar', {
      duration: 0,
      panelClass: ['info-snackbar']
    }).onAction().subscribe(() => {
      this.cancelFrenteCreation();
    });
  }

  cancelFrenteCreation(): void {
    this.isCreatingFrente = false;
    if (this.tempMarker) {
      this.map.removeLayer(this.tempMarker);
      this.tempMarker = null;
    }
    this.snackBar.dismiss();
  }

  private handleMapClickForFrente(e: L.LeafletMouseEvent): void {
    const { lat, lng } = e.latlng;
    
    // Remover marcador temporal anterior si existe
    if (this.tempMarker) {
      this.map.removeLayer(this.tempMarker);
    }

    // Crear marcador temporal con icono simple
    this.tempMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `
          <div style="background-color: #ff9800; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            <span style="color: white; font-weight: bold; font-size: 14px;">+</span>
          </div>
        `,
        className: 'temp-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    }).addTo(this.map);

    // Abrir formulario de creación
    this.openFrenteForm('create', { lat, lng });
  }

  openFrenteForm(mode: 'create' | 'edit', coordinates?: { lat: number; lng: number }, frente?: Frente): void {
    const dialogData: FrenteFormData = {
      mode,
      frente,
      initialCoordinates: coordinates
    };

    const dialogRef = this.dialog.open(FrenteFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Frente creado o actualizado exitosamente
        this.refreshData();
      }
      
      // Limpiar estado de creación
      if (mode === 'create') {
        this.cancelFrenteCreation();
      }
    });
  }

  editFrente(frente: Frente): void {
    this.openFrenteForm('edit', undefined, frente);
  }

  async deleteFrente(frente: Frente): Promise<void> {
    if (confirm(`¿Estás seguro de que deseas eliminar el frente "${frente.nombre}"?`)) {
      try {
        await this.actividadesService.deleteFrente(frente.id);
        this.snackBar.open('Frente eliminado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.refreshData();
        if (this.selectedFrente?.id === frente.id) {
          this.selectedFrente = null;
        }
      } catch (error) {
        // Error deleting frente
        this.snackBar.open('Error al eliminar el frente', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    }
  }

  // Método para hacer draggable los marcadores existentes
  private createDraggableFrenteMarker(frente: Frente): L.Marker {
    // Crear marcador draggable directamente
    const marker = L.marker([frente.ubicacion_lat!, frente.ubicacion_lng!], {
      icon: this.getFrenteMarkerIcon(frente.estado),
      draggable: true
    });
    
    // Agregar popup
    marker.bindPopup(this.createFrentePopup(frente));
    
    // Evento cuando se termina de arrastrar
    marker.on('dragend', async (e: L.DragEndEvent) => {
      const newPosition = e.target.getLatLng();
      try {
        await this.actividadesService.updateFrenteLocation(frente.id, newPosition.lat, newPosition.lng);
        
        this.snackBar.open('Ubicación del frente actualizada', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        // Actualizar el frente en la lista local
        const index = this.frentes.findIndex(f => f.id === frente.id);
        if (index !== -1) {
          this.frentes[index] = {
            ...this.frentes[index],
            ubicacion_lat: newPosition.lat,
            ubicacion_lng: newPosition.lng
          };
          this.applyFilters();
        }
      } catch (error) {
        console.error('❌ [MapaComponent] Error updating frente location:', error);
        this.snackBar.open('Error al actualizar la ubicación', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        // Revertir la posición del marcador
        marker.setLatLng([frente.ubicacion_lat!, frente.ubicacion_lng!]);
      }
    });
    
    return marker;
  }

  toggleDragMode(): void {
    this.isDragMode = !this.isDragMode;
    
    // Mostrar notificación del estado actual
    const message = this.isDragMode ? 
      'Modo arrastrar activado - Puedes mover los frentes arrastrando los marcadores' : 
      'Modo arrastrar desactivado';
    
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
    
    // Actualizar marcadores
    this.updateMapMarkers();
  }

  // Métodos de navegación
  navigateToCreateFrente(): void {
    this.router.navigate(['/frentes/nuevo']);
  }

  navigateToEditFrente(frenteId: string): void {
    this.router.navigate(['/frentes', frenteId, 'editar']);
  }

  navigateToFrentesManagement(): void {
    this.router.navigate(['/frentes']);
  }

  // Nueva funcionalidad: Actualizar trazos de actividades
  async updateActividadTraces(): Promise<void> {
    console.log('🎯 [UpdateActividadTraces] Iniciando actualización de trazos de actividades');

    if (!this.map || !this.showActividadTraces) {
      console.log('🎯 [UpdateActividadTraces] Saliendo: mapa no existe o trazos desactivados');
      return;
    }

    // Limpiar trazos existentes
    this.actividadLayers.clearLayers();
    console.log('🎯 [UpdateActividadTraces] Trazos existentes limpiados');

    // Filtrar actividades que tienen puntos de inicio y final
    const actividadesConTrazos = this.actividades.filter(actividad => 
      actividad.ubicacion_inicio?.lat && actividad.ubicacion_inicio?.lng &&
      actividad.ubicacion_fin?.lat && actividad.ubicacion_fin?.lng
    );

    console.log('🎯 [UpdateActividadTraces] Actividades con trazos:', actividadesConTrazos.length);

    // Procesar cada actividad
    for (const actividad of actividadesConTrazos) {
      try {
        // Calcular progreso basado en tareas
        const progreso = await this.calcularProgresoActividad(actividad.id);

        // Crear trazo de la actividad
        await this.createActividadTrace(actividad, progreso);
      } catch (error) {
        console.error('❌ [UpdateActividadTraces] Error procesando actividad:', actividad.id, error);
      }
    }

    console.log('✅ [UpdateActividadTraces] Trazos de actividades actualizados');
  }

  // Calcular progreso de actividad basado en tareas completadas
  private async calcularProgresoActividad(actividadId: string): Promise<number> {
try {
const tareas = await this.actividadesService.getTareasByActividad(actividadId);

if (tareas.length === 0) {
return 0; // Sin tareas, progreso 0%
}

const tareasCompletadas = tareas.filter(tarea => tarea.completada).length;
const progreso = Math.round((tareasCompletadas / tareas.length) * 100);

console.log(`📊 [CalcProgreso] Actividad ${actividadId}: ${tareasCompletadas}/${tareas.length} tareas = ${progreso}%`);
return progreso;
} catch (error) {
console.error('❌ [CalcProgreso] Error calculando progreso:', error);
return 0;
  }
}

// Crear trazo visual de una actividad
private async createActividadTrace(actividad: Actividad, progreso: number): Promise<void> {
if (!actividad.ubicacion_inicio || !actividad.ubicacion_fin) {
return;
}

const startPoint = [actividad.ubicacion_inicio.lat, actividad.ubicacion_inicio.lng] as [number, number];
const endPoint = [actividad.ubicacion_fin.lat, actividad.ubicacion_fin.lng] as [number, number];

// Determinar color basado en progreso y estado
const color = this.getActividadTraceColor(actividad.estado, progreso);
const opacity = this.getActividadTraceOpacity(progreso);

// Crear línea principal del trazo
const mainLine = L.polyline([startPoint, endPoint], {
color: color,
weight: 6,
opacity: opacity,
dashArray: progreso < 100 ? '10, 5' : undefined // Línea punteada si no está completa
});

// Crear línea de progreso (parte completada)
if (progreso > 0) {
const progressPoint = this.interpolatePoint(startPoint, endPoint, progreso / 100);
const progressLine = L.polyline([startPoint, progressPoint], {
color: '#22c55e', // Verde para progreso completado
weight: 8,
opacity: 0.8
});
this.actividadLayers.addLayer(progressLine);
}

// Agregar línea principal
this.actividadLayers.addLayer(mainLine);

// Crear marcadores de inicio y fin
const startMarker = L.circleMarker(startPoint, {
radius: 8,
fillColor: '#3b82f6',
color: 'white',
weight: 2,
opacity: 1,
fillOpacity: 0.8
});

const endMarker = L.circleMarker(endPoint, {
radius: 8,
fillColor: progreso >= 100 ? '#22c55e' : '#ef4444',
color: 'white',
weight: 2,
opacity: 1,
fillOpacity: 0.8
});

// Agregar tooltips informativos
const tooltipContent = this.createActividadTooltip(actividad, progreso);
mainLine.bindTooltip(tooltipContent, {
permanent: false,
direction: 'top',
className: 'actividad-tooltip'
});

startMarker.bindTooltip('Inicio: ' + actividad.tipo_actividad, {
permanent: false,
direction: 'top'
});

endMarker.bindTooltip(`Fin: ${progreso}% completado`, {
permanent: false,
direction: 'top'
});

// Agregar marcadores a la capa
this.actividadLayers.addLayer(startMarker);
this.actividadLayers.addLayer(endMarker);

// Evento click para mostrar detalles
mainLine.on('click', () => {
this.showActividadDetails(actividad, progreso);
});
}

// Determinar color del trazo basado únicamente en el porcentaje de progreso
private getActividadTraceColor(estado: string, progreso: number): string {
// Sistema de colores basado en porcentaje de cumplimiento
if (progreso === 0) {
return '#ef4444'; // Rojo - No iniciado (0%)
} else if (progreso >= 1 && progreso <= 50) {
return '#eab308'; // Amarillo - Progreso inicial (1-50%)
} else if (progreso >= 51 && progreso <= 80) {
return '#f97316'; // Naranja - Progreso medio (51-80%)
} else if (progreso >= 81 && progreso <= 100) {
return '#22c55e'; // Verde - Progreso avanzado/completado (81-100%)
} else {
return '#6b7280'; // Gris - Caso por defecto
}
}

// Determinar opacidad del trazo basado en progreso
private getActividadTraceOpacity(progreso: number): number {
return Math.max(0.4, progreso / 100 * 0.8 + 0.2);
}

// Interpolar punto entre inicio y fin basado en progreso
private interpolatePoint(start: [number, number], end: [number, number], ratio: number): [number, number] {
const lat = start[0] + (end[0] - start[0]) * ratio;
const lng = start[1] + (end[1] - start[1]) * ratio;
return [lat, lng];
}

// Crear contenido del tooltip para actividad
private createActividadTooltip(actividad: Actividad, progreso: number): string {
const estadoLabel = this.getEstadoLabel(actividad.estado);
const fechaFormateada = new Date(actividad.fecha).toLocaleDateString('es-ES');

return `
<div class="actividad-tooltip-content">
<h4>${actividad.tipo_actividad}</h4>
<p><strong>Estado:</strong> ${estadoLabel}</p>
<p><strong>Progreso:</strong> ${progreso}%</p>
<p><strong>Fecha:</strong> ${fechaFormateada}</p>
${actividad.responsable ? `<p><strong>Responsable:</strong> ${actividad.responsable}</p>` : ''}
<p><em>Click para ver detalles</em></p>
</div>
`;
}

// Mostrar detalles de actividad
private showActividadDetails(actividad: Actividad, progreso: number): void {
const message = `
Actividad: ${actividad.tipo_actividad}
Estado: ${this.getEstadoLabel(actividad.estado)}
Progreso: ${progreso}%
Fecha: ${new Date(actividad.fecha).toLocaleDateString('es-ES')}
${actividad.responsable ? `Responsable: ${actividad.responsable}` : ''}
`;

this.snackBar.open(message, 'Ver Detalles', {
duration: 8000,
panelClass: ['info-snackbar']
});
}

// Toggle para mostrar/ocultar trazos de actividades
async toggleActividadTraces(): Promise<void> {
this.showActividadTraces = !this.showActividadTraces;

if (this.showActividadTraces) {
console.log('🎯 [ToggleTraces] Activando trazos de actividades');
await this.updateActividadTraces();
this.snackBar.open('Trazos de actividades activados', 'Cerrar', {
duration: 3000,
panelClass: ['success-snackbar']
});
} else {
console.log('🎯 [ToggleTraces] Desactivando trazos de actividades');
this.actividadLayers.clearLayers();
this.snackBar.open('Trazos de actividades desactivados', 'Cerrar', {
duration: 3000,
panelClass: ['info-snackbar']
});
}
}
}