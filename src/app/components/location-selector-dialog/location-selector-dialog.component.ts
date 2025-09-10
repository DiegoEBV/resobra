import { Component, Inject, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import * as L from 'leaflet';
import { MapService } from '../../services/map.service';

export interface LocationSelectorData {
  currentLat?: number;
  currentLng?: number;
}

export interface LocationResult {
  lat: number;
  lng: number;
  direccion?: string;
}

@Component({
  selector: 'app-location-selector-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  template: `
    <div class="location-selector-dialog">
      <h2 mat-dialog-title>
        <mat-icon>location_on</mat-icon>
        Seleccionar Ubicación
      </h2>
      
      <mat-dialog-content>
        <div class="coordinates-form">
          <form [formGroup]="coordinatesForm" class="coordinates-inputs">
            <mat-form-field appearance="outline">
              <mat-label>Latitud</mat-label>
              <input matInput 
                     type="number" 
                     formControlName="lat" 
                     step="0.000001"
                     (input)="onCoordinatesChange()">
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Longitud</mat-label>
              <input matInput 
                     type="number" 
                     formControlName="lng" 
                     step="0.000001"
                     (input)="onCoordinatesChange()">
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Dirección (opcional)</mat-label>
              <input matInput formControlName="direccion">
            </mat-form-field>
          </form>
        </div>
        
        <div class="map-container">
          <div id="location-map" class="map"></div>
        </div>
        
        <div class="instructions">
          <mat-icon>info</mat-icon>
          <span>Haz clic en el mapa para seleccionar una ubicación o ingresa las coordenadas manualmente</span>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>
        
        <button mat-raised-button 
                color="primary" 
                (click)="onConfirm()"
                [disabled]="!isValidLocation()">
          <mat-icon>check</mat-icon>
          Confirmar Ubicación
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .location-selector-dialog {
      width: 100%;
      height: 100%;
    }
    
    mat-dialog-content {
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      height: 70vh;
      min-height: 500px;
    }
    
    .coordinates-form {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .coordinates-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      align-items: start;
    }
    
    .full-width {
      grid-column: 1 / -1;
    }
    
    .map-container {
      flex: 1;
      position: relative;
    }
    
    .map {
      width: 100%;
      height: 100%;
      min-height: 400px;
    }
    
    .instructions {
      padding: 12px 16px;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: #666;
    }
    
    .instructions mat-icon {
      color: #1976d2;
      font-size: 18px;
    }
    
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
    
    @media (max-width: 768px) {
      .coordinates-inputs {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LocationSelectorDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  coordinatesForm: FormGroup;
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  
  constructor(
    private fb: FormBuilder,
    private mapService: MapService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<LocationSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LocationSelectorData
  ) {
    this.coordinatesForm = this.fb.group({
      lat: [data.currentLat || -17.783327],
      lng: [data.currentLng || -63.182140],
      direccion: ['']
    });
  }
  
  ngOnInit(): void {
    // Configurar iconos de Leaflet
    this.setupLeafletIcons();
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }
  
  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
  
  private setupLeafletIcons(): void {
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
  }
  
  private initializeMap(): void {
    const lat = this.coordinatesForm.get('lat')?.value || -17.783327;
    const lng = this.coordinatesForm.get('lng')?.value || -63.182140;
    
    this.map = L.map('location-map').setView([lat, lng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    
    // Agregar marcador inicial si hay coordenadas
    if (lat && lng) {
      this.addMarker(lat, lng);
    }
    
    // Manejar clics en el mapa
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.updateLocation(lat, lng);
    });
  }
  
  private addMarker(lat: number, lng: number): void {
    if (!this.map) return;
    
    // Remover marcador anterior
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }
    
    // Agregar nuevo marcador
    this.marker = L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(`Ubicación seleccionada<br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);
  }
  
  private updateLocation(lat: number, lng: number): void {
    this.coordinatesForm.patchValue({ lat, lng });
    this.addMarker(lat, lng);
  }
  
  onCoordinatesChange(): void {
    const lat = this.coordinatesForm.get('lat')?.value;
    const lng = this.coordinatesForm.get('lng')?.value;
    
    if (lat && lng && this.isValidCoordinates(lat, lng)) {
      this.addMarker(lat, lng);
      if (this.map) {
        this.map.setView([lat, lng], this.map.getZoom());
      }
    }
  }
  
  private isValidCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
  
  isValidLocation(): boolean {
    const lat = this.coordinatesForm.get('lat')?.value;
    const lng = this.coordinatesForm.get('lng')?.value;
    return lat && lng && this.isValidCoordinates(lat, lng);
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
  
  onConfirm(): void {
    if (this.isValidLocation()) {
      const result: LocationResult = {
        lat: this.coordinatesForm.get('lat')?.value,
        lng: this.coordinatesForm.get('lng')?.value,
        direccion: this.coordinatesForm.get('direccion')?.value || ''
      };
      this.dialogRef.close(result);
    }
  }
}