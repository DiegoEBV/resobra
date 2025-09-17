import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActividadesService } from '../../../services/actividades.service';
import { EvidenciaFotograficaService, EvidenciaFotografica } from '../../../services/evidencia-fotografica.service';
import { TareasService } from '../../../services/tareas.service';
import { Actividad, Tarea } from '../../../interfaces/database.interface';

// Interfaz para imágenes con previsualización
interface PreviewImage {
  id: string;
  file: File;
  url: string;
  descripcion?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

@Component({
  selector: 'app-detalle-actividad',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatListModule,
    MatChipsModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    FormsModule
  ],
  template: `
    <div class="detalle-actividad-container">
      <!-- Header con botón de volver -->
      <div class="header-section">
        <button mat-icon-button (click)="volver()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Detalle de Actividad</h1>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-card>
          <mat-card-content>
            <p>Cargando actividad...</p>
          </mat-card-content>
        </mat-card>
      </div>

      <div *ngIf="!loading && actividad">
        <!-- Información básica de la actividad -->
        <mat-card class="activity-info">
          <mat-card-header>
            <mat-card-title>{{ actividad.tipo_actividad | titlecase }}</mat-card-title>
            <mat-card-subtitle>
              <span class="estado-badge" [style.background-color]="getEstadoColor(actividad.estado)">
                {{ actividad.estado | titlecase }}
              </span>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p class="description">{{ actividad.observaciones }}</p>
            
            <div class="activity-details">
              <div class="detail-row">
                <div class="detail-item">
                  <mat-icon>category</mat-icon>
                  <span>{{ actividad.tipo_actividad }}</span>
                </div>
                <div class="detail-item">
                  <mat-icon>flag</mat-icon>
                  <span>{{ actividad.tipo_actividad | titlecase }}</span>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-item">
                  <mat-icon>person</mat-icon>
                  <span>{{ actividad.responsable }}</span>
                </div>
                <div class="detail-item" *ngIf="actividad.fecha">
                  <mat-icon>event</mat-icon>
                  <span>{{ actividad.fecha | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Progreso y Tareas -->
        <mat-card class="tasks-section">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>assignment</mat-icon>
              Tareas y Progreso
            </mat-card-title>
            <mat-card-subtitle>
              {{ tareas.length }} tarea(s) - {{ progreso }}% completado
            </mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <!-- Barra de progreso -->
            <div class="progress-container">
              <div class="progress-info">
                <span class="progress-label">Progreso General</span>
                <span class="progress-percentage">{{ progreso }}%</span>
              </div>
              <mat-progress-bar 
                [value]="progreso" 
                [color]="getProgresoColor()"
                mode="determinate">
              </mat-progress-bar>
            </div>

            <mat-divider></mat-divider>

            <!-- Lista de tareas -->
            <div class="tasks-list" *ngIf="!loadingTareas">
              <div class="tasks-header">
                <h3>Tareas y Progreso</h3>
                <button mat-icon-button (click)="refreshTareas()" title="Refrescar tareas">
                  <mat-icon>refresh</mat-icon>
                </button>
              </div>
              <div *ngIf="tareas.length === 0" class="no-tasks">
                <mat-icon>info</mat-icon>
                <p>No hay tareas definidas para esta actividad</p>
                <p class="debug-info">Actividad ID: {{ actividadId }}</p>
              </div>

              <div *ngFor="let tarea of tareas; let i = index" class="task-item">
                <mat-checkbox 
                  [checked]="tarea.completada"
                  (change)="toggleTareaCompletada(tarea)"
                  [color]="'primary'">
                </mat-checkbox>
                
                <div class="task-content">
                  <div class="task-header">
                    <span class="task-name" [class.completed]="tarea.completada">
                      {{ tarea.nombre }}
                    </span>
                    <span class="task-order">#{{ tarea.orden }}</span>
                  </div>
                  
                  <p class="task-description" *ngIf="tarea.descripcion">
                    {{ tarea.descripcion }}
                  </p>
                  
                  <div class="task-meta" *ngIf="tarea.fecha_completado">
                    <mat-icon>check_circle</mat-icon>
                    <span>Completada el {{ tarea.fecha_completado | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="loadingTareas" class="loading-tasks">
              <p>Cargando tareas...</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Evidencia Fotográfica -->
        <mat-card class="evidence-section">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>photo_camera</mat-icon>
              Evidencia Fotográfica
            </mat-card-title>
            <mat-card-subtitle>
              {{ evidencias.length }} foto(s) subida(s)
            </mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <!-- Zona de subida de archivos -->
            <div class="upload-zone" 
                 [class.drag-over]="dragOver"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)">
              
              <div class="upload-content">
                <mat-icon class="upload-icon">cloud_upload</mat-icon>
                <p>Arrastra las imágenes aquí o haz clic para seleccionar</p>
                <input type="file" 
                       #fileInput 
                       multiple 
                       accept="image/*" 
                       (change)="onFileSelected($event)"
                       style="display: none;">
                <button mat-raised-button 
                        color="primary" 
                        (click)="fileInput.click()"
                        [disabled]="uploadingFile">
                  <mat-icon>add_photo_alternate</mat-icon>
                  Seleccionar Fotos
                </button>
              </div>
            </div>

            <!-- Previsualización de imágenes seleccionadas -->
            <div *ngIf="previewImages.length > 0" class="preview-section">
              <h4>Imágenes seleccionadas ({{ previewImages.length }}/{{ maxFiles }}):</h4>
              
              <div class="preview-grid">
                <div *ngFor="let preview of previewImages" class="preview-item" [attr.data-status]="preview.status">
                  <div class="preview-image-container">
                    <img [src]="preview.url" [alt]="preview.file.name" class="preview-image">
                    
                    <!-- Overlay de estado -->
                    <div class="preview-overlay" [ngClass]="'status-' + preview.status">
                      <div class="status-indicator">
                        <mat-icon [style.color]="getStatusColor(preview.status)">{{ getStatusIcon(preview.status) }}</mat-icon>
                        <span class="status-text">{{ getStatusText(preview.status) }}</span>
                      </div>
                      
                      <!-- Barra de progreso -->
                      <mat-progress-bar 
                        *ngIf="preview.status === 'uploading' && preview.progress !== undefined"
                        mode="determinate" 
                        [value]="preview.progress"
                        class="upload-progress">
                      </mat-progress-bar>
                      
                      <!-- Mensaje de error -->
                      <div *ngIf="preview.status === 'error' && preview.error" class="error-message">
                        <small>{{ preview.error }}</small>
                      </div>
                    </div>
                    
                    <!-- Botones de acción -->
                    <div class="preview-actions">
                      <button mat-icon-button 
                              *ngIf="preview.status === 'pending' || preview.status === 'error'"
                              color="warn" 
                              (click)="removePreviewImage(preview.id)"
                              matTooltip="Eliminar">
                        <mat-icon>close</mat-icon>
                      </button>
                      
                      <button mat-icon-button 
                              *ngIf="preview.status === 'error'"
                              color="primary" 
                              (click)="retryUpload(preview.id)"
                              matTooltip="Reintentar">
                        <mat-icon>refresh</mat-icon>
                      </button>
                      
                      <button mat-icon-button 
                              *ngIf="preview.status === 'pending'"
                              color="primary" 
                              (click)="uploadSingleImage(preview.id)"
                              matTooltip="Subir esta imagen">
                        <mat-icon>upload</mat-icon>
                      </button>
                    </div>
                  </div>
                  
                  <!-- Información de la imagen -->
                  <div class="preview-info">
                    <div class="file-details">
                      <span class="file-name">{{ preview.file.name }}</span>
                      <span class="file-size">({{ (preview.file.size / 1024 / 1024).toFixed(2) }} MB)</span>
                    </div>
                    
                    <!-- Campo de descripción -->
                    <mat-form-field appearance="outline" class="description-field" *ngIf="preview.status !== 'success'">
                      <mat-label>Descripción (opcional)</mat-label>
                      <input matInput 
                             [value]="preview.descripcion || ''"
                             (input)="updatePreviewDescription(preview.id, $any($event.target).value)"
                             placeholder="Describe esta imagen..."
                             [disabled]="preview.status === 'uploading'">
                    </mat-form-field>
                  </div>
                </div>
              </div>
              
              <!-- Acciones globales -->
              <div class="upload-actions">
                <button mat-raised-button 
                        color="primary" 
                        (click)="uploadFiles()"
                        [disabled]="uploadingFile || !hasPendingImages()">
                  <mat-spinner *ngIf="uploadingFile" diameter="20" style="margin-right: 8px;"></mat-spinner>
                  <mat-icon *ngIf="!uploadingFile">upload</mat-icon>
                  {{ uploadingFile ? 'Subiendo...' : 'Subir Todas (' + getPendingCount() + ')' }}
                </button>
                
                <button mat-button 
                        (click)="clearAllPreviews()"
                        [disabled]="uploadingFile">
                  <mat-icon>clear_all</mat-icon>
                  Limpiar Todo
                </button>
              </div>
            </div>

            <mat-divider *ngIf="selectedFiles.length > 0"></mat-divider>

            <!-- Galería de evidencias -->
            <div *ngIf="!loadingEvidencias && evidencias.length > 0" class="evidence-gallery">
              <h4>Evidencias Subidas:</h4>
              <div class="gallery-grid">
                <div *ngFor="let evidencia of evidencias" class="evidence-item">
                  <div class="image-container">
                    <img [src]="evidencia.url_imagen" 
                         [alt]="evidencia.descripcion || 'Evidencia fotográfica'"
                         class="evidence-image">
                    <div class="image-overlay">
                      <button mat-icon-button 
                              color="warn" 
                              (click)="eliminarEvidencia(evidencia)"
                              matTooltip="Eliminar evidencia">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                  
                  <div class="evidence-info">
                    <mat-form-field appearance="outline" class="description-field">
                      <mat-label>Descripción</mat-label>
                      <input matInput 
                             [value]="evidencia.descripcion || ''"
                             (blur)="actualizarDescripcion(evidencia, $any($event.target).value)"
                             placeholder="Agregar descripción...">
                    </mat-form-field>
                    
                    <div class="evidence-meta">
                      <small class="upload-date">
                        <mat-icon>schedule</mat-icon>
                        {{ evidencia.fecha_subida | date:'dd/MM/yyyy HH:mm' }}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Estado de carga -->
            <div *ngIf="loadingEvidencias" class="loading-evidence">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Cargando evidencias...</p>
            </div>

            <!-- Sin evidencias -->
            <div *ngIf="!loadingEvidencias && evidencias.length === 0" class="no-evidence">
              <mat-icon>photo_library</mat-icon>
              <p>No hay evidencias fotográficas subidas</p>
              <p class="hint">Sube fotos para documentar el progreso de esta actividad</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .detalle-actividad-container {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .header-section {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      gap: 16px;
    }

    .header-section h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }

    .back-button {
      color: #666;
    }

    .activity-info {
      margin-bottom: 20px;
    }

    .estado-badge {
      padding: 4px 12px;
      border-radius: 12px;
      color: white;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .description {
      margin: 16px 0;
      color: #666;
      line-height: 1.5;
    }

    .activity-details {
      margin-top: 16px;
    }

    .detail-row {
      display: flex;
      gap: 32px;
      margin-bottom: 12px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
    }

    .detail-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .tasks-section {
      margin-bottom: 20px;
    }

    .progress-container {
      margin-bottom: 20px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .progress-label {
      font-weight: 500;
      color: #333;
    }

    .progress-percentage {
      font-weight: 600;
      color: #1976d2;
    }

    mat-divider {
      margin: 20px 0;
    }

    .tasks-list {
      margin-top: 20px;
    }

    .tasks-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .tasks-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .no-tasks {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .debug-info {
      font-size: 12px;
      color: #999;
      margin-top: 8px;
    }

    .no-tasks mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid #eee;
    }

    .task-item:last-child {
      border-bottom: none;
    }

    .task-content {
      flex: 1;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .task-name {
      font-weight: 500;
      color: #333;
      transition: all 0.3s ease;
    }

    .task-name.completed {
      text-decoration: line-through;
      color: #999;
    }

    .task-order {
      background: #f5f5f5;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      color: #666;
    }

    .task-description {
      margin: 8px 0;
      color: #666;
      font-size: 14px;
      line-height: 1.4;
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #4caf50;
      font-size: 12px;
      margin-top: 8px;
    }

    .task-meta mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .loading-container,
    .loading-tasks {
      text-align: center;
      padding: 20px;
      color: #666;
    }

    /* Estilos para evidencia fotográfica */
    .evidence-section {
      margin-bottom: 20px;
    }

    .upload-zone {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
      margin-bottom: 20px;
    }

    .upload-zone:hover,
    .upload-zone.drag-over {
      border-color: #1976d2;
      background-color: #f3f8ff;
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .upload-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #666;
    }

    .upload-zone p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .selected-files {
      margin-bottom: 20px;
      padding: 16px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }

    .selected-files h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .file-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background-color: white;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }

    .file-name {
      flex: 1;
      font-weight: 500;
    }

    .file-size {
      color: #666;
      font-size: 12px;
    }

    .upload-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    /* Estilos para previsualización de imágenes */
    .preview-section {
      margin-top: 20px;
    }

    .preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin: 16px 0;
    }

    .preview-item {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      background: white;
      transition: all 0.3s ease;
    }

    .preview-item[data-status="pending"] {
      border-color: #ff9800;
    }

    .preview-item[data-status="uploading"] {
      border-color: #2196f3;
    }

    .preview-item[data-status="success"] {
      border-color: #4caf50;
    }

    .preview-item[data-status="error"] {
      border-color: #f44336;
    }

    .preview-image-container {
      position: relative;
      width: 100%;
      height: 150px;
      overflow: hidden;
    }

    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .preview-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .preview-item:hover .preview-overlay,
    .preview-overlay.status-uploading,
    .preview-overlay.status-error {
      opacity: 1;
    }

    .status-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: white;
    }

    .status-text {
      font-size: 12px;
      font-weight: 500;
    }

    .upload-progress {
      width: 80%;
      margin-top: 8px;
    }

    .error-message {
      color: #ffcdd2;
      text-align: center;
      margin-top: 8px;
      padding: 0 8px;
    }

    .preview-actions {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .preview-item:hover .preview-actions {
      opacity: 1;
    }

    .preview-actions button {
      background: rgba(255, 255, 255, 0.9);
      width: 32px;
      height: 32px;
      min-width: unset;
    }

    .preview-info {
      padding: 12px;
    }

    .file-details {
      margin-bottom: 8px;
    }

    .file-name {
      display: block;
      font-weight: 500;
      font-size: 14px;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 12px;
      color: #666;
    }

    .description-field {
      width: 100%;
      margin-top: 8px;
    }

    .description-field .mat-mdc-form-field-wrapper {
      padding-bottom: 0;
    }

    /* Responsive para móviles */
    @media (max-width: 768px) {
      .preview-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 12px;
      }

      .preview-image-container {
        height: 120px;
      }

      .preview-info {
        padding: 8px;
      }

      .upload-actions {
        flex-direction: column;
      }

      .upload-actions button {
        width: 100%;
      }
    }

    .evidence-gallery {
      margin-top: 20px;
    }

    .evidence-gallery h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .evidence-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      background-color: white;
    }

    .image-container {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
    }

    .evidence-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .evidence-image:hover {
      transform: scale(1.05);
    }

    .image-overlay {
      position: absolute;
      top: 8px;
      right: 8px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .image-container:hover .image-overlay {
      opacity: 1;
    }

    .evidence-info {
      padding: 16px;
    }

    .description-field {
      width: 100%;
      margin-bottom: 12px;
    }

    .evidence-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .upload-date {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #666;
      font-size: 12px;
    }

    .upload-date mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .loading-evidence,
    .no-evidence {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .loading-evidence {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .no-evidence mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-evidence .hint {
      font-size: 14px;
      color: #999;
      margin-top: 8px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .detalle-actividad-container {
        padding: 16px;
      }

      .detail-row {
        flex-direction: column;
        gap: 12px;
      }

      .task-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .gallery-grid {
        grid-template-columns: 1fr;
      }

      .upload-zone {
        padding: 20px 16px;
      }

      .upload-actions {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class DetalleActividadComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  actividadId: string | null = null;
  actividad: Actividad | null = null;
  tareas: Tarea[] = [];
  progreso: number = 0;
  loading = true;
  loadingTareas = false;
  
  // Propiedades para evidencia fotográfica
  evidencias: EvidenciaFotografica[] = [];
  loadingEvidencias = false;
  uploadingFile = false;
  selectedFiles: File[] = [];
  dragOver = false;
  
  // Nuevas propiedades para previsualización
  previewImages: PreviewImage[] = [];
  uploadProgress: { [key: string]: number } = {};
  maxFiles = 10;
  
  // Control de concurrencia para evitar NavigatorLockAcquireTimeoutError
  private readonly MAX_CONCURRENT_UPLOADS = 2;
  private currentUploads = 0;
  private uploadQueue: PreviewImage[] = [];
  private uploadLock = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private actividadesService: ActividadesService,
    private evidenciaService: EvidenciaFotograficaService,
    private tareasService: TareasService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.actividadId = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.actividadId = params['id'];
      // ID de actividad obtenido
      if (this.actividadId) {
        this.loadActividad();
        // Cargar tareas después de un pequeño delay para asegurar que la actividad esté cargada
        setTimeout(() => {
          this.loadTareas();
          this.loadEvidencias();
        }, 100);
        this.subscribeToProgresoUpdates();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToProgresoUpdates(): void {
    this.actividadesService.progresoUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ actividadId, progreso }) => {
        // Si es la actividad actual, actualizar el progreso
        if (actividadId === this.actividadId && this.actividad) {
          this.actividad.progreso_porcentaje = progreso;
          this.progreso = progreso;
        }
      });
  }

  async loadActividad() {
    try {
      this.loading = true;
      this.actividad = await this.actividadesService.getActividadById(this.actividadId!);
      
      if (!this.actividad) {
        this.snackBar.open('Actividad no encontrada', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/actividades']);
        return;
      }
    } catch (error) {
      // Error cargando actividad
      this.snackBar.open('Error cargando actividad', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  async loadTareas() {
    try {
      this.loadingTareas = true;
      // Cargando tareas para actividad ID
      
      if (!this.actividadId) {
        // No hay actividadId disponible
        return;
      }
      
      this.tareas = await this.actividadesService.getTareasByActividad(this.actividadId!);
      // Tareas obtenidas
      
      this.calcularProgreso();
    } catch (error) {
      // Error cargando tareas
      this.snackBar.open('Error cargando tareas', 'Cerrar', { duration: 3000 });
    } finally {
      this.loadingTareas = false;
    }
  }

  calcularProgreso() {
    if (this.tareas.length === 0) {
      this.progreso = 0;
      return;
    }

    const tareasCompletadas = this.tareas.filter(tarea => tarea.completada).length;
    this.progreso = Math.round((tareasCompletadas / this.tareas.length) * 100);
  }

  async toggleTareaCompletada(tarea: Tarea) {
    const estadoAnterior = tarea.completada;
    const nuevoEstado = !tarea.completada;
    
    // Actualizar el estado local inmediatamente para respuesta instantánea
    tarea.completada = nuevoEstado;
    if (nuevoEstado) {
      tarea.fecha_completado = new Date().toISOString();
    } else {
      tarea.fecha_completado = undefined;
    }
    
    this.calcularProgreso();
    
    try {
      await this.actividadesService.updateTareaEstado(tarea.id, nuevoEstado);
      
      const mensaje = nuevoEstado ? 'Tarea marcada como completada' : 'Tarea marcada como pendiente';
      this.snackBar.open(mensaje, 'Cerrar', { duration: 2000 });
    } catch (error) {
      // Revertir el estado local si falla la actualización
      tarea.completada = estadoAnterior;
      if (estadoAnterior) {
        tarea.fecha_completado = new Date().toISOString();
      } else {
        tarea.fecha_completado = undefined;
      }
      this.calcularProgreso();
      
      // Error actualizando tarea
      this.snackBar.open('Error actualizando tarea', 'Cerrar', { duration: 3000 });
    }
  }

  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'programado': '#2196F3',
      'ejecucion': '#FF9800', 
      'finalizado': '#4CAF50',
      'pausado': '#9E9E9E',
      'cancelado': '#F44336'
    };
    return colores[estado] || '#9E9E9E';
  }

  getProgresoColor(): string {
    if (this.progreso === 100) return 'primary';
    if (this.progreso >= 50) return 'accent';
    return 'warn';
  }

  // Método para refrescar las tareas manualmente
  async refreshTareas() {
    // Refrescando tareas manualmente
    await this.loadTareas();
  }

  // Métodos para evidencia fotográfica
  async loadEvidencias(): Promise<void> {
    if (!this.actividadId) {
      // No se puede cargar evidencias: actividadId no definido
      return;
    }

    try {
      this.loadingEvidencias = true;
      // INICIANDO CARGA DE EVIDENCIAS
      
      const evidencias = await firstValueFrom(this.evidenciaService.obtenerEvidenciasPorActividad(this.actividadId));
      
      if (evidencias) {
        this.evidencias = evidencias;
        // EVIDENCIAS CARGADAS EXITOSAMENTE
        
        // Log detallado de cada evidencia
        
      } else {
        this.evidencias = [];
        // NO SE ENCONTRARON EVIDENCIAS
      }
      
    } catch (error) {
      // ERROR CARGANDO EVIDENCIAS
      
      this.evidencias = [];
      this.snackBar.open('Error cargando evidencias fotográficas', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.loadingEvidencias = false;
      // CARGA DE EVIDENCIAS FINALIZADA
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    
    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }

  onFileSelected(event: any) {
    const files = event.target.files as FileList;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  private handleFiles(files: File[]) {
    // Procesando archivos
    
    // Verificar límite de archivos
    const totalFiles = this.previewImages.length + files.length;
    if (totalFiles > this.maxFiles) {
      this.snackBar.open(`Máximo ${this.maxFiles} archivos permitidos`, 'Cerrar', { duration: 3000 });
      return;
    }

    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      
      if (!isValidType) {
        this.snackBar.open(`${file.name} no es una imagen válida`, 'Cerrar', { duration: 3000 });
        return false;
      }
      
      if (!isValidSize) {
        this.snackBar.open(`${file.name} es muy grande (máximo 5MB)`, 'Cerrar', { duration: 3000 });
        return false;
      }
      
      return true;
    });
    
    // Archivos válidos
    
    // Crear previsualizaciones inmediatas
    validFiles.forEach(file => {
      const reader = new FileReader();
      const previewId = this.generateId();
      
      // Leyendo archivo
      
      reader.onload = (e) => {
        const previewImage: PreviewImage = {
          id: previewId,
          file: file,
          url: e.target?.result as string,
          status: 'pending',
          descripcion: ''
        };
        
        // Imagen cargada
        this.previewImages.push(previewImage);
        
        // Forzar detección de cambios para mostrar la imagen inmediatamente
        this.cdr.detectChanges();
        // Vista actualizada
      };
      
      reader.onerror = (error) => {
        // Error leyendo archivo
        this.snackBar.open(`Error cargando ${file.name}`, 'Cerrar', { duration: 3000 });
      };
      
      reader.readAsDataURL(file);
    });
    
    // Mantener compatibilidad con el código existente
    this.selectedFiles = [...this.selectedFiles, ...validFiles];
    // Total selectedFiles
  }

  async uploadFiles() {
    if (!this.actividadId || this.previewImages.length === 0 || this.uploadLock) return;
    
    this.uploadingFile = true;
    this.uploadLock = true;
    
    try {
      const pendingImages = this.previewImages.filter(img => img.status === 'pending');
      
      // Agregar imágenes a la cola de subida
      this.uploadQueue.push(...pendingImages);
      
      // Procesar cola con límite de concurrencia
      await this.processUploadQueue();
      
      // Limpiar imágenes exitosas después de un delay
      setTimeout(() => {
        this.previewImages = this.previewImages.filter(img => img.status !== 'success');
        this.selectedFiles = [];
      }, 2000);
      
      await this.loadEvidencias();
      
      const successCount = pendingImages.filter(img => img.status === 'success').length;
      if (successCount > 0) {
        this.snackBar.open(`${successCount} evidencia(s) subida(s) correctamente`, 'Cerrar', { duration: 3000 });
      }
    } finally {
      this.uploadingFile = false;
      this.uploadLock = false;
    }
  }
  
  private async processUploadQueue(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    while (this.uploadQueue.length > 0 && this.currentUploads < this.MAX_CONCURRENT_UPLOADS) {
      const previewImage = this.uploadQueue.shift();
      if (previewImage) {
        this.currentUploads++;
        const uploadPromise = this.uploadWithConcurrencyControl(previewImage)
          .finally(() => {
            this.currentUploads--;
          });
        promises.push(uploadPromise);
      }
    }
    
    if (promises.length > 0) {
      await Promise.all(promises);
      
      // Si aún hay elementos en la cola, continuar procesando
      if (this.uploadQueue.length > 0) {
        await this.processUploadQueue();
      }
    }
  }
  
  private async uploadWithConcurrencyControl(previewImage: PreviewImage): Promise<void> {
    try {
      previewImage.status = 'uploading';
      previewImage.progress = 0;
      
      // Simular progreso
      const progressInterval = setInterval(() => {
        if (previewImage.progress! < 90) {
          previewImage.progress! += 10;
        }
      }, 200); // Intervalo más lento para reducir carga
      
      // Subir archivo con timeout
      const uploadPromise = this.evidenciaService.subirEvidencia(
        previewImage.file,
        this.actividadId!, 
        previewImage.descripcion
      );
      
      // Timeout de 30 segundos para evitar bloqueos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout')), 30000);
      });
      
      await Promise.race([uploadPromise, timeoutPromise]);
      
      clearInterval(progressInterval);
      previewImage.progress = 100;
      previewImage.status = 'success';
      
    } catch (error) {
      // Error subiendo evidencia
      previewImage.status = 'error';
      previewImage.error = this.getErrorMessage(error);
    }
  }
  
  private getErrorMessage(error: any): string {
    if (error?.message?.includes('timeout')) {
      return 'Tiempo de espera agotado. Intenta de nuevo.';
    }
    if (error?.message?.includes('NavigatorLockAcquireTimeoutError')) {
      return 'Sistema ocupado. Intenta de nuevo en unos segundos.';
    }
    if (error?.message?.includes('Bucket not found')) {
      return 'Error de configuración. Contacta al administrador.';
    }
    return 'Error al subir la imagen. Intenta de nuevo.';
  }

  removeSelectedFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  // Nuevos métodos para previsualización
  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  removePreviewImage(previewId: string) {
    // Eliminando imagen de previsualización
    const index = this.previewImages.findIndex(img => img.id === previewId);
    if (index > -1) {
      // Liberar memoria de la URL del objeto
      const previewImage = this.previewImages[index];
      // Imagen encontrada para eliminar
      
      if (previewImage.url.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage.url);
        // URL de blob revocada
      }
      
      // Eliminar de previewImages
      this.previewImages.splice(index, 1);
      // Imagen eliminada del array previewImages
      
      // También remover del array de selectedFiles
      const fileIndex = this.selectedFiles.findIndex(file => file.name === previewImage.file.name);
      if (fileIndex > -1) {
        this.selectedFiles.splice(fileIndex, 1);
        // Archivo eliminado del array selectedFiles
      }
      
      // Forzar detección de cambios para actualizar la vista
      this.cdr.detectChanges();
      // Detección de cambios forzada
    } else {
      // No se encontró la imagen con ID
    }
  }

  updatePreviewDescription(previewId: string, descripcion: string) {
    const previewImage = this.previewImages.find(img => img.id === previewId);
    if (previewImage) {
      previewImage.descripcion = descripcion;
    }
  }

  retryUpload(previewId: string) {
    const previewImage = this.previewImages.find(img => img.id === previewId);
    if (previewImage && previewImage.status === 'error') {
      previewImage.status = 'pending';
      previewImage.error = undefined;
      previewImage.progress = 0;
    }
  }

  uploadSingleImage(previewId: string) {
    const previewImage = this.previewImages.find(img => img.id === previewId);
    if (!previewImage || !this.actividadId || this.currentUploads >= this.MAX_CONCURRENT_UPLOADS) {
      if (this.currentUploads >= this.MAX_CONCURRENT_UPLOADS) {
        this.snackBar.open('Máximo de subidas simultáneas alcanzado. Espera un momento.', 'Cerrar', { duration: 3000 });
      }
      return;
    }

    this.uploadSinglePreviewImage(previewImage);
  }

  private async uploadSinglePreviewImage(previewImage: PreviewImage) {
    this.currentUploads++;
    const fileName = previewImage.file.name;
    
    try {
      // INICIANDO SUBIDA INDIVIDUAL
      
      previewImage.status = 'uploading';
      previewImage.progress = 0;
      // Estado actualizado a uploading
      
      const progressInterval = setInterval(() => {
        if (previewImage.progress! < 90) {
          previewImage.progress! += 10;
        }
      }, 200);
      
      // Timeout para evitar bloqueos
      // Llamando al servicio de evidencia
      
      const uploadPromise = this.evidenciaService.subirEvidencia(
        previewImage.file,
        this.actividadId!, 
        previewImage.descripcion
      );
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout')), 30000);
      });
      
      const evidencia = await Promise.race([uploadPromise, timeoutPromise]) as EvidenciaFotografica;
      
      // EVIDENCIA SUBIDA EXITOSAMENTE
      
      clearInterval(progressInterval);
      previewImage.progress = 100;
      previewImage.status = 'success';
      // Estado actualizado a success
      
      setTimeout(() => {
        this.removePreviewImage(previewImage.id);
      }, 2000);
      
      // Recargando evidencias
      await this.loadEvidencias();
      // Evidencias recargadas exitosamente
      
      this.snackBar.open('Evidencia subida correctamente', 'Cerrar', { duration: 2000 });
      // Notificación de éxito mostrada
      
    } catch (error) {
      // ERROR EN SUBIDA INDIVIDUAL
      
      previewImage.status = 'error';
      previewImage.error = this.getErrorMessage(error);
      // Estado actualizado a error
      
      const errorMessage = this.getErrorMessage(error);
      this.snackBar.open(`Error subiendo "${fileName}": ${errorMessage}`, 'Cerrar', { duration: 3000 });
      // Notificación de error mostrada
    } finally {
      this.currentUploads--;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'schedule';
      case 'uploading': return 'cloud_upload';
      case 'success': return 'check_circle';
      case 'error': return 'error';
      default: return 'help';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'uploading': return '#2196F3';
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'uploading': return 'Subiendo...';
      case 'success': return 'Subida exitosa';
      case 'error': return 'Error';
      default: return 'Desconocido';
    }
  }

  hasPendingImages(): boolean {
    return this.previewImages.some(img => img.status === 'pending');
  }

  getPendingCount(): number {
    return this.previewImages.filter(img => img.status === 'pending').length;
  }

  clearAllPreviews(): void {
    // Limpiando todas las previsualizaciones
    
    // Liberar URLs de objeto para evitar memory leaks
    this.previewImages.forEach(preview => {
      if (preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url);
        // URL de blob revocada
      }
    });
    
    this.previewImages = [];
    this.selectedFiles = [];
    
    // Forzar detección de cambios para actualizar la vista
    this.cdr.detectChanges();
    // Todas las previsualizaciones limpiadas y vista actualizada
  }

  eliminarEvidencia(evidencia: EvidenciaFotografica) {
    if (!evidencia.id) {
      // ID de evidencia no válido
      this.snackBar.open('Error: ID de evidencia no válido', 'Cerrar', { duration: 3000 });
      return;
    }
    
    const confirmMessage = `¿Estás seguro de que deseas eliminar esta evidencia?\n\nArchivo: ${evidencia.nombre_archivo || 'Sin nombre'}\nDescripción: ${evidencia.descripcion || 'Sin descripción'}`;
    
    if (confirm(confirmMessage)) {
      // Iniciando eliminación de evidencia
      
      // Mostrar indicador de carga
      this.snackBar.open('Eliminando evidencia...', '', { duration: 1000 });
      
      this.evidenciaService.eliminarEvidencia(evidencia.id).subscribe({
        next: (success) => {
          if (success) {
            // Evidencia eliminada exitosamente
            
            // Remover la evidencia de la lista local inmediatamente
            this.evidencias = this.evidencias.filter(e => e.id !== evidencia.id);
            
            // Recargar evidencias para asegurar sincronización
            this.loadEvidencias();
            
            this.snackBar.open('Evidencia eliminada correctamente', 'Cerrar', { 
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          } else {
            // La eliminación no fue exitosa
            this.snackBar.open('Error: La eliminación no fue exitosa', 'Cerrar', { 
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        },
        error: (error) => {
          // Error eliminando evidencia
          
          let errorMessage = 'Error eliminando evidencia';
          
          if (error?.message) {
            if (error.message.includes('permission')) {
              errorMessage = 'No tienes permisos para eliminar esta evidencia';
            } else if (error.message.includes('not found')) {
              errorMessage = 'La evidencia ya no existe';
              // Si no existe, removerla de la lista local
              this.evidencias = this.evidencias.filter(e => e.id !== evidencia.id);
            } else if (error.message.includes('storage')) {
              errorMessage = 'Error eliminando el archivo. El registro fue eliminado.';
            } else {
              errorMessage = `Error: ${error.message}`;
            }
          }
          
          this.snackBar.open(errorMessage, 'Cerrar', { 
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  async actualizarDescripcion(evidencia: EvidenciaFotografica, nuevaDescripcion: string) {
    if (!evidencia.id) {
      // ID de evidencia no válido
      return;
    }
    
    try {
      await this.evidenciaService.actualizarEvidencia(evidencia.id, { descripcion: nuevaDescripcion });
      evidencia.descripcion = nuevaDescripcion;
      this.snackBar.open('Descripción actualizada', 'Cerrar', { duration: 2000 });
    } catch (error) {
      // Error actualizando descripción
      this.snackBar.open('Error actualizando descripción', 'Cerrar', { duration: 3000 });
    }
  }

  volver() {
    this.router.navigate(['/actividades']);
  }
}