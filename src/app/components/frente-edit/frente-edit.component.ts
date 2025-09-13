import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { Router, ActivatedRoute } from '@angular/router';
import { ActividadesService, Frente } from '../../services/actividades.service';
import * as L from 'leaflet';

// Configurar iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl: 'assets/marker-icon.png',
  shadowUrl: 'assets/marker-shadow.png',
});

interface CoordenadasIntermedias {
  lat: number;
  lng: number;
  kilometraje: number;
}

@Component({
  selector: 'app-frente-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatCardModule,
    MatExpansionModule,
    MatListModule,
    MatDividerModule
  ],
  templateUrl: './frente-edit.component.html',
  styleUrl: './frente-edit.component.css'
})
export class FrenteEditComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  frenteForm: FormGroup;
  obras: any[] = [];
  frenteId: string | null = null;
  isLoading = false;
  isEditMode = false;
  
  // Propiedades del mapa
  private map!: L.Map;
  private startMarker?: L.Marker;
  private endMarker?: L.Marker;
  private intermediateMarkers: L.Marker[] = [];
  private routeLine?: L.Polyline;
  private isMapInitialized = false;
  frente: Frente | null = null;

  estadosFrente = [
    { value: 'activo', label: 'Activo' },
    { value: 'pausado', label: 'Pausado' },
    { value: 'completado', label: 'Completado' },
    { value: 'planificado', label: 'Planificado' }
  ];

  constructor(
    private fb: FormBuilder,
    private actividadesService: ActividadesService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.frenteForm = this.createForm();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  private initializeMap(): void {
    if (this.isMapInitialized || !this.mapContainer) return;

    this.map = L.map(this.mapContainer.nativeElement).setView([-16.5, -68.15], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Configurar eventos del mapa
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onMapClick(e);
    });

    this.isMapInitialized = true;

    // Si hay datos del frente, mostrarlos en el mapa
    if (this.frente) {
      this.updateMapFromForm();
    }
  }

  private onMapClick(e: L.LeafletMouseEvent): void {
    const { lat, lng } = e.latlng;
    
    // Si no hay coordenadas de inicio, establecerlas
    if (!this.frenteForm.get('coordenadas_inicio.lat')?.value) {
      this.setStartCoordinates(lat, lng);
    }
    // Si hay inicio pero no fin, establecer fin
    else if (!this.frenteForm.get('coordenadas_fin.lat')?.value) {
      this.setEndCoordinates(lat, lng);
    }
    // Si hay inicio y fin, agregar punto intermedio
    else {
      this.addIntermediatePoint(lat, lng);
    }
  }

  private setStartCoordinates(lat: number, lng: number): void {
    this.frenteForm.patchValue({
      coordenadas_inicio: { lat, lng },
      ubicacion_lat: lat,
      ubicacion_lng: lng
    });

    if (this.startMarker) {
      this.map.removeLayer(this.startMarker);
    }

    this.startMarker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'assets/marker-icon.png',
        shadowUrl: 'assets/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
    }).addTo(this.map)
      .bindPopup('Punto de inicio')
      .openPopup();

    this.updateRoute();
  }

  private setEndCoordinates(lat: number, lng: number): void {
    this.frenteForm.patchValue({
      coordenadas_fin: { lat, lng }
    });

    if (this.endMarker) {
      this.map.removeLayer(this.endMarker);
    }

    this.endMarker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'assets/marker-icon.png',
        shadowUrl: 'assets/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
    }).addTo(this.map)
      .bindPopup('Punto final')
      .openPopup();

    this.updateRoute();
  }

  private addIntermediatePoint(lat: number, lng: number): void {
    const kmInicial = this.frenteForm.get('km_inicial')?.value || 0;
    const kmFinal = this.frenteForm.get('km_final')?.value || 0;
    const intermediateCount = this.coordenadasIntermedias.length;
    
    // Calcular kilometraje estimado para el nuevo punto
    const estimatedKm = kmInicial + ((kmFinal - kmInicial) * (intermediateCount + 1) / (intermediateCount + 2));

    const newPoint = this.fb.group({
      lat: [lat, Validators.required],
      lng: [lng, Validators.required],
      kilometraje: [estimatedKm, [Validators.required, Validators.min(0)]]
    });

    this.coordenadasIntermedias.push(newPoint);

    const marker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: 'assets/marker-icon.png',
        shadowUrl: 'assets/marker-shadow.png',
        iconSize: [20, 33],
        iconAnchor: [10, 33]
      })
    }).addTo(this.map)
      .bindPopup(`Punto intermedio - Km ${estimatedKm.toFixed(2)}`);

    this.intermediateMarkers.push(marker);
    this.updateRoute();
  }

  get coordenadasIntermedias(): FormArray {
    return this.frenteForm.get('coordenadas_intermedias') as FormArray;
  }

  removeIntermediatePoint(index: number): void {
    if (index >= 0 && index < this.intermediateMarkers.length) {
      // Remover marcador del mapa
      this.map.removeLayer(this.intermediateMarkers[index]);
      this.intermediateMarkers.splice(index, 1);
      
      // Remover del FormArray
      this.coordenadasIntermedias.removeAt(index);
      
      this.updateRoute();
    }
  }

  private updateRoute(): void {
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    const startCoords = this.frenteForm.get('coordenadas_inicio')?.value;
    const endCoords = this.frenteForm.get('coordenadas_fin')?.value;

    if (startCoords?.lat && startCoords?.lng && endCoords?.lat && endCoords?.lng) {
      const points: [number, number][] = [[startCoords.lat, startCoords.lng]];
      
      // Agregar puntos intermedios ordenados por kilometraje
      const intermediatePoints = this.coordenadasIntermedias.controls
        .map((control, index) => ({ ...control.value, index }))
        .sort((a, b) => a.kilometraje - b.kilometraje);
      
      intermediatePoints.forEach(point => {
        points.push([point.lat, point.lng]);
      });
      
      points.push([endCoords.lat, endCoords.lng]);

      this.routeLine = L.polyline(points, {
        color: '#3388ff',
        weight: 4,
        opacity: 0.8
      }).addTo(this.map);

      // Ajustar vista para mostrar toda la ruta
      this.map.fitBounds(this.routeLine.getBounds(), { padding: [20, 20] });
    }
  }

  private updateMapFromForm(): void {
    if (!this.isMapInitialized) return;

    const startCoords = this.frenteForm.get('coordenadas_inicio')?.value;
    const endCoords = this.frenteForm.get('coordenadas_fin')?.value;

    if (startCoords?.lat && startCoords?.lng) {
      this.setStartCoordinates(startCoords.lat, startCoords.lng);
    }

    if (endCoords?.lat && endCoords?.lng) {
      this.setEndCoordinates(endCoords.lat, endCoords.lng);
    }

    // Cargar puntos intermedios si existen
    const intermediateCoords = this.frente?.coordenadas_intermedias;
    if (intermediateCoords && Array.isArray(intermediateCoords)) {
      intermediateCoords.forEach(coord => {
        const pointGroup = this.fb.group({
          lat: [coord.lat, Validators.required],
          lng: [coord.lng, Validators.required],
          kilometraje: [coord.kilometraje, [Validators.required, Validators.min(0)]]
        });
        
        this.coordenadasIntermedias.push(pointGroup);
        
        const marker = L.marker([coord.lat, coord.lng], {
          icon: L.icon({
            iconUrl: 'assets/marker-icon.png',
            shadowUrl: 'assets/marker-shadow.png',
            iconSize: [20, 33],
            iconAnchor: [10, 33]
          })
        }).addTo(this.map)
          .bindPopup(`Punto intermedio - Km ${coord.kilometraje}`);
        
        this.intermediateMarkers.push(marker);
      });
    }

    this.updateRoute();
  }

  clearMap(): void {
    // Limpiar marcadores
    if (this.startMarker) {
      this.map.removeLayer(this.startMarker);
      this.startMarker = undefined;
    }
    
    if (this.endMarker) {
      this.map.removeLayer(this.endMarker);
      this.endMarker = undefined;
    }
    
    this.intermediateMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.intermediateMarkers = [];
    
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = undefined;
    }

    // Limpiar formulario
    this.frenteForm.patchValue({
      coordenadas_inicio: { lat: null, lng: null },
      coordenadas_fin: { lat: null, lng: null }
    });
    
    // Limpiar array de coordenadas intermedias
    while (this.coordenadasIntermedias.length !== 0) {
      this.coordenadasIntermedias.removeAt(0);
    }
  }

  ngOnInit(): void {
    this.frenteId = this.route.snapshot.paramMap.get('id');
    if (this.frenteId) {
      this.loadFrente();
      this.loadObras();
    } else {
      this.router.navigate(['/frentes']);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      obra_id: ['', Validators.required],
      estado: ['activo', Validators.required],
      fecha_inicio: [new Date(), Validators.required],
      fecha_fin_estimada: [''],
      ubicacion_lat: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      ubicacion_lng: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      progreso_general: [0, [Validators.min(0), Validators.max(100)]],
      km_inicial: [null, [Validators.required, Validators.min(0)]],
      km_final: [null, [Validators.required, Validators.min(0)]],
      coordenadas_inicio: this.fb.group({
        lat: [null, [Validators.required]],
        lng: [null, [Validators.required]]
      }),
      coordenadas_fin: this.fb.group({
        lat: [null, [Validators.required]],
        lng: [null, [Validators.required]]
      }),
      coordenadas_intermedias: this.fb.array([])
    });
  }

  private async loadFrente(): Promise<void> {
    if (!this.frenteId) return;
    
    try {
      this.isLoading = true;
      this.frente = await this.actividadesService.getFrenteById(this.frenteId);
      
      if (this.frente) {
        this.populateForm(this.frente);
      } else {
        this.snackBar.open('Frente no encontrado', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/mapa']);
      }
    } catch (error) {
      console.error('Error loading frente:', error);
      this.snackBar.open('Error al cargar el frente', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      this.router.navigate(['/mapa']);
    } finally {
      this.isLoading = false;
    }
  }

  private populateForm(frente: Frente): void {
    this.frenteForm.patchValue({
      nombre: frente.nombre,
      descripcion: frente.descripcion || '',
      obra_id: frente.obra_id,
      estado: frente.estado,
      fecha_inicio: new Date(frente.fecha_inicio),
      fecha_fin_estimada: frente.fecha_fin_estimada ? new Date(frente.fecha_fin_estimada) : null,
      ubicacion_lat: frente.ubicacion_lat,
      ubicacion_lng: frente.ubicacion_lng,
      progreso_general: frente.progreso_general,
      km_inicial: frente.km_inicial || null,
      km_final: frente.km_final || null,
      coordenadas_inicio: frente.coordenadas_inicio || { lat: null, lng: null },
      coordenadas_fin: frente.coordenadas_fin || { lat: null, lng: null }
    });

    // Actualizar mapa después de poblar el formulario
    if (this.isMapInitialized) {
      this.updateMapFromForm();
    }
  }

  private async loadObras(): Promise<void> {
    try {
      this.obras = await this.actividadesService.getUserObras();
    } catch (error) {
      console.error('Error loading obras:', error);
      this.snackBar.open('Error al cargar las obras', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.frenteForm.valid && this.frenteId) {
      this.isLoading = true;
      try {
        const formValue = this.frenteForm.value;
        
        const frenteData = {
          ...formValue,
          fecha_inicio: formValue.fecha_inicio.toISOString().split('T')[0],
          fecha_fin_estimada: formValue.fecha_fin_estimada ? 
            formValue.fecha_fin_estimada.toISOString().split('T')[0] : null,
          coordenadas_intermedias: formValue.coordenadas_intermedias || []
        };

        await this.actividadesService.updateFrente(this.frenteId, frenteData);
        
        this.snackBar.open('Frente actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        this.router.navigate(['/frentes']);
      } catch (error) {
        console.error('Error updating frente:', error);
        this.snackBar.open('Error al actualizar el frente', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      } finally {
        this.isLoading = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.frenteForm.controls).forEach(key => {
      const control = this.frenteForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/frentes']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.frenteForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} es requerido`;
    }
    if (control?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} debe tener al menos ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} debe ser mayor a ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `${this.getFieldLabel(fieldName)} debe ser menor a ${control.errors?.['max'].max}`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nombre: 'Nombre',
      descripcion: 'Descripción',
      obra_id: 'Obra',
      estado: 'Estado',
      fecha_inicio: 'Fecha de inicio',
      fecha_fin_estimada: 'Fecha fin estimada',
      ubicacion_lat: 'Latitud',
      ubicacion_lng: 'Longitud',
      progreso_general: 'Progreso general'
    };
    return labels[fieldName] || fieldName;
  }
}