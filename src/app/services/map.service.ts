import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as L from 'leaflet';
import { SupabaseService } from './supabase.service';
import { DirectAuthService } from './direct-auth.service';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  type: 'frente' | 'actividad' | 'recurso' | 'incidente';
  status: 'activo' | 'inactivo' | 'completado' | 'alerta';
  data?: any;
  icon?: string;
  color?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private mapInstance: L.Map | null = null;
  private markersLayer: L.LayerGroup | null = null;
  
  private markersSubject = new BehaviorSubject<MapMarker[]>([]);
  public markers$ = this.markersSubject.asObservable();
  
  private currentPositionSubject = new BehaviorSubject<GeolocationPosition | null>(null);
  public currentPosition$ = this.currentPositionSubject.asObservable();
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  // Configuración de iconos personalizados
  private customIcons = {
    frente: {
      activo: L.divIcon({
        className: 'custom-marker frente-activo',
        html: '<div class="marker-pin"><i class="material-icons">construction</i></div>',
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      }),
      inactivo: L.divIcon({
        className: 'custom-marker frente-inactivo',
        html: '<div class="marker-pin"><i class="material-icons">pause_circle</i></div>',
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      }),
      completado: L.divIcon({
        className: 'custom-marker frente-completado',
        html: '<div class="marker-pin"><i class="material-icons">check_circle</i></div>',
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      })
    },
    actividad: {
      activo: L.divIcon({
        className: 'custom-marker actividad-activo',
        html: '<div class="marker-pin"><i class="material-icons">assignment</i></div>',
        iconSize: [25, 35],
        iconAnchor: [12, 35]
      }),
      alerta: L.divIcon({
        className: 'custom-marker actividad-alerta',
        html: '<div class="marker-pin"><i class="material-icons">warning</i></div>',
        iconSize: [25, 35],
        iconAnchor: [12, 35]
      })
    },
    recurso: {
      activo: L.divIcon({
        className: 'custom-marker recurso-activo',
        html: '<div class="marker-pin"><i class="material-icons">build</i></div>',
        iconSize: [20, 28],
        iconAnchor: [10, 28]
      })
    },
    user: L.divIcon({
      className: 'custom-marker user-position',
      html: '<div class="marker-pin user-pin"><i class="material-icons">person_pin</i></div>',
      iconSize: [25, 35],
      iconAnchor: [12, 35]
    })
  };

  constructor(
    private supabase: SupabaseService,
    private directAuthService: DirectAuthService
  ) {
    this.loadMapData();
  }

  // Inicializar mapa
  initializeMap(containerId: string, options?: L.MapOptions): L.Map {
    const defaultOptions: L.MapOptions = {
      center: [-12.0464, -77.0428], // Lima, Perú como centro por defecto
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    };

    const mapOptions = { ...defaultOptions, ...options };
    
    this.mapInstance = L.map(containerId, mapOptions);

    // Agregar capa de tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.mapInstance);

    // Crear capa para marcadores
    this.markersLayer = L.layerGroup().addTo(this.mapInstance);

    // Cargar marcadores existentes
    this.loadMarkersOnMap();

    return this.mapInstance;
  }

  // Cargar datos del mapa
  private async loadMapData(): Promise<void> {
    this.isLoadingSubject.next(true);
    try {
      const markers = await this.loadAllMarkers();
      this.markersSubject.next(markers);
    } catch (error) {
      // Error loading map data
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  // Cargar todos los marcadores
  private async loadAllMarkers(): Promise<MapMarker[]> {
    try {
      const user = this.directAuthService.getCurrentUser();
      if (!user) return [];

      // Obtener obras asignadas al usuario
      const { data: userObras, error: userObrasError } = await this.supabase.client
        .from('user_obras')
        .select('obra_id')
        .eq('user_id', user.id);

      if (userObrasError) throw userObrasError;

      if (!userObras || userObras.length === 0) return [];

      const obraIds = userObras.map(uo => uo.obra_id);
      const markers: MapMarker[] = [];

      // Cargar frentes
      const frentesMarkers = await this.loadFrentesMarkers(obraIds);
      markers.push(...frentesMarkers);

      // Cargar actividades con ubicación
      const actividadesMarkers = await this.loadActividadesMarkers(obraIds);
      markers.push(...actividadesMarkers);

      return markers;
    } catch (error) {
      // Error loading markers
      return [];
    }
  }

  // Cargar marcadores de frentes
  private async loadFrentesMarkers(obraIds: string[]): Promise<MapMarker[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('frentes')
        .select(`
          id,
          nombre,
          descripcion,
          ubicacion_lat,
          ubicacion_lng,
          estado,
          progreso_general,
          obra:obras(nombre)
        `)
        .in('obra_id', obraIds)
        .not('ubicacion_lat', 'is', null)
        .not('ubicacion_lng', 'is', null);

      if (error) throw error;

      return (data || []).map(frente => ({
        id: frente.id,
        lat: frente.ubicacion_lat,
        lng: frente.ubicacion_lng,
        title: frente.nombre,
        description: `${frente.descripcion || ''} - Progreso: ${frente.progreso_general}%`,
        type: 'frente' as const,
        status: frente.estado,
        data: {
          ...frente,
          obra_nombre: Array.isArray(frente.obra) ? 
            (frente.obra.length > 0 ? frente.obra[0].nombre : 'Sin obra') : 
            (frente.obra ? (frente.obra as any).nombre : 'Sin obra')
        }
      }));
    } catch (error) {
      // Error loading frentes markers
      return [];
    }
  }

  // Cargar marcadores de actividades
  private async loadActividadesMarkers(obraIds: string[]): Promise<MapMarker[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('actividades')
        .select(`
          id,
          tipo_actividad,
          ubicacion,
          estado,
          responsable,
          frente:frentes!inner(id, nombre, obra_id)
        `)
        .in('frente.obra_id', obraIds)
        .not('ubicacion', 'is', null)
        .in('estado', ['ejecucion', 'programado']);

      if (error) throw error;

      return (data || []).map(actividad => ({
        id: actividad.id,
        lat: actividad.ubicacion?.lat || 0,
        lng: actividad.ubicacion?.lng || 0,
        title: actividad.tipo_actividad,
        description: `${actividad.responsable || 'Sin responsable'}`,
        type: 'actividad' as const,
        status: actividad.estado === 'ejecucion' ? 'activo' : 'inactivo',
        data: {
          ...actividad,
          frente_nombre: Array.isArray(actividad.frente) ? 
            (actividad.frente.length > 0 ? actividad.frente[0].nombre : 'Sin frente') : 
            (actividad.frente ? (actividad.frente as any).nombre : 'Sin frente')
        }
      }));
    } catch (error) {
      // Error loading actividades markers
      return [];
    }
  }

  // Cargar marcadores en el mapa
  private loadMarkersOnMap(): void {
    if (!this.mapInstance || !this.markersLayer) return;

    this.markers$.subscribe(markers => {
      if (!this.markersLayer) return;
      
      // Limpiar marcadores existentes
      this.markersLayer.clearLayers();

      // Agregar nuevos marcadores
      markers.forEach(marker => {
        this.addMarkerToMap(marker);
      });

      // Ajustar vista si hay marcadores
      if (markers.length > 0) {
        this.fitBoundsToMarkers(markers);
      }
    });
  }

  // Agregar marcador al mapa
  private addMarkerToMap(marker: MapMarker): void {
    if (!this.markersLayer) return;

    const icon = this.getMarkerIcon(marker.type, marker.status);
    const leafletMarker = L.marker([marker.lat, marker.lng], { icon })
      .bindPopup(this.createPopupContent(marker))
      .bindTooltip(marker.title, { 
        permanent: false, 
        direction: 'top',
        offset: [0, -35]
      });

    leafletMarker.addTo(this.markersLayer);
  }

  // Obtener icono para marcador
  private getMarkerIcon(type: string, status: string): L.DivIcon {
    if (type === 'frente' && this.customIcons.frente[status as keyof typeof this.customIcons.frente]) {
      return this.customIcons.frente[status as keyof typeof this.customIcons.frente];
    }
    if (type === 'actividad' && this.customIcons.actividad[status as keyof typeof this.customIcons.actividad]) {
      return this.customIcons.actividad[status as keyof typeof this.customIcons.actividad];
    }
    if (type === 'recurso') {
      return this.customIcons.recurso.activo;
    }
    
    // Icono por defecto
    return this.customIcons.frente.activo;
  }

  // Crear contenido del popup
  private createPopupContent(marker: MapMarker): string {
    let content = `
      <div class="map-popup">
        <h3 class="popup-title">${marker.title}</h3>
        <p class="popup-description">${marker.description || ''}</p>
        <div class="popup-details">
          <span class="popup-type">${this.getTypeLabel(marker.type)}</span>
          <span class="popup-status status-${marker.status}">${this.getStatusLabel(marker.status)}</span>
        </div>
    `;

    if (marker.data) {
      if (marker.type === 'frente') {
        content += `
          <div class="popup-extra">
            <p><strong>Obra:</strong> ${marker.data.obra_nombre || 'N/A'}</p>
            <p><strong>Progreso:</strong> ${marker.data.progreso_general || 0}%</p>
          </div>
        `;
      } else if (marker.type === 'actividad') {
        content += `
          <div class="popup-extra">
            <p><strong>Frente:</strong> ${marker.data.frente_nombre || 'N/A'}</p>
            <p><strong>Responsable:</strong> ${marker.data.responsable || 'Sin asignar'}</p>
          </div>
        `;
      }
    }

    content += `
        <div class="popup-actions">
          <button class="btn-popup" onclick="window.mapService?.viewDetails('${marker.type}', '${marker.id}')">
            Ver Detalles
          </button>
        </div>
      </div>
    `;

    return content;
  }

  // Obtener etiqueta de tipo
  private getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      frente: 'Frente',
      actividad: 'Actividad',
      recurso: 'Recurso',
      incidente: 'Incidente'
    };
    return labels[type] || type;
  }

  // Obtener etiqueta de estado
  private getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      activo: 'Activo',
      inactivo: 'Inactivo',
      completado: 'Completado',
      alerta: 'Alerta'
    };
    return labels[status] || status;
  }

  // Ajustar vista a marcadores
  private fitBoundsToMarkers(markers: MapMarker[]): void {
    if (!this.mapInstance || markers.length === 0) return;

    const group = new L.FeatureGroup();
    markers.forEach(marker => {
      L.marker([marker.lat, marker.lng]).addTo(group);
    });

    this.mapInstance.fitBounds(group.getBounds(), { padding: [20, 20] });
  }

  // Obtener posición actual del usuario
  async getCurrentPosition(): Promise<GeolocationPosition | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        // Geolocation is not supported by this browser
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoPosition: GeolocationPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          this.currentPositionSubject.next(geoPosition);
          resolve(geoPosition);
        },
        (error) => {
          // Error getting current position
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
      );
    });
  }

  // Agregar marcador de posición actual
  async addCurrentPositionMarker(): Promise<void> {
    const position = await this.getCurrentPosition();
    if (!position || !this.mapInstance || !this.markersLayer) return;

    const marker = L.marker([position.lat, position.lng], { 
      icon: this.customIcons.user 
    })
    .bindPopup('Tu ubicación actual')
    .addTo(this.markersLayer);

    // Centrar mapa en la posición actual
    this.mapInstance.setView([position.lat, position.lng], 16);
  }

  // Agregar marcador personalizado
  addCustomMarker(marker: MapMarker): void {
    const currentMarkers = this.markersSubject.value;
    const updatedMarkers = [...currentMarkers, marker];
    this.markersSubject.next(updatedMarkers);
  }

  // Remover marcador
  removeMarker(markerId: string): void {
    const currentMarkers = this.markersSubject.value;
    const updatedMarkers = currentMarkers.filter(m => m.id !== markerId);
    this.markersSubject.next(updatedMarkers);
  }

  // Centrar mapa en coordenadas
  centerMap(lat: number, lng: number, zoom: number = 15): void {
    if (this.mapInstance) {
      this.mapInstance.setView([lat, lng], zoom);
    }
  }

  // Obtener instancia del mapa
  getMapInstance(): L.Map | null {
    return this.mapInstance;
  }

  // Refrescar datos del mapa
  async refresh(): Promise<void> {
    await this.loadMapData();
  }

  // Limpiar mapa
  destroy(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
    this.markersLayer = null;
  }
}

// Hacer el servicio disponible globalmente para los popups
(window as any).mapService = null;