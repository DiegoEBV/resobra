import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PartidasImportService, ImportProgress } from '../../services/partidas-import.service';

@Component({
  selector: 'app-import-estructura-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="import-dialog">
      <h2 mat-dialog-title>
        <mat-icon>upload</mat-icon>
        Importar Partidas de Estructura
      </h2>
      
      <mat-dialog-content>
        <div class="import-content">
          <ng-container *ngIf="!importing && !completed">
            <mat-card class="info-card">
              <mat-card-content>
                <p><strong>Se importarán 57 partidas de estructura desde el archivo partestr.txt</strong></p>
                <p>Esta operación agregará todas las partidas de estructura predefinidas a la base de datos.</p>
                <ul>
                  <li>Trazo y replanteo</li>
                  <li>Excavaciones y rellenos</li>
                  <li>Concreto armado (cimientos, columnas, vigas, losas)</li>
                  <li>Estructuras metálicas</li>
                  <li>Juntas y dispositivos especiales</li>
                </ul>
              </mat-card-content>
            </mat-card>
          </ng-container>

          <ng-container *ngIf="importing">
            <div class="progress-section">
              <h3>Importando partidas...</h3>
              
              <div class="progress-info">
                <span>Progreso: {{progress.processed}} / {{progress.total}}</span>
                <span class="success-count">Exitosas: {{progress.success}}</span>
              </div>
              
              <mat-progress-bar 
                mode="determinate" 
                [value]="getProgressPercentage()">
              </mat-progress-bar>
              
              <div class="current-item" *ngIf="progress.currentItem">
                <small>Procesando: {{progress.currentItem}}</small>
              </div>
            </div>
          </ng-container>

          <ng-container *ngIf="completed">
            <div class="results-section">
              <div class="success-message" *ngIf="progress.errors.length === 0">
                <mat-icon color="primary">check_circle</mat-icon>
                <h3>¡Importación completada exitosamente!</h3>
                <p>Se importaron {{progress.success}} partidas de estructura.</p>
              </div>
              
              <div class="partial-success" *ngIf="progress.errors.length > 0 && progress.success > 0">
                <mat-icon color="warn">warning</mat-icon>
                <h3>Importación completada con advertencias</h3>
                <p>Se importaron {{progress.success}} partidas de {{progress.total}}.</p>
              </div>
              
              <div class="error-section" *ngIf="progress.errors.length > 0">
                <h4>Errores encontrados:</h4>
                <div class="error-list">
                  <div class="error-item" *ngFor="let error of progress.errors">
                    <mat-icon>error</mat-icon>
                    <span>{{error}}</span>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button 
          mat-button 
          (click)="onCancel()" 
          [disabled]="importing">
          {{completed ? 'Cerrar' : 'Cancelar'}}
        </button>
        
        <button 
          mat-raised-button 
          color="primary" 
          (click)="startImport()" 
          [disabled]="importing || completed">
          <mat-icon>download</mat-icon>
          Importar Partidas
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .import-dialog {
      min-width: 500px;
      max-width: 600px;
    }
    
    .import-content {
      min-height: 200px;
      padding: 16px 0;
    }
    
    .info-card {
      margin-bottom: 16px;
    }
    
    .info-card ul {
      margin: 12px 0;
      padding-left: 20px;
    }
    
    .progress-section {
      text-align: center;
    }
    
    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
      font-size: 14px;
    }
    
    .success-count {
      color: #4caf50;
      font-weight: 500;
    }
    
    .current-item {
      margin-top: 12px;
      color: #666;
      font-style: italic;
    }
    
    .results-section {
      text-align: center;
    }
    
    .success-message, .partial-success {
      margin-bottom: 20px;
    }
    
    .success-message mat-icon {
      color: #4caf50;
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    
    .partial-success mat-icon {
      color: #ff9800;
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    
    .error-section {
      margin-top: 20px;
      text-align: left;
    }
    
    .error-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px;
    }
    
    .error-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 12px;
    }
    
    .error-item mat-icon {
      color: #f44336;
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    /* Mobile responsive styles */
    @media (max-width: 768px) {
      .import-dialog {
        min-width: 320px;
        max-width: 95vw;
      }
      
      .import-content {
        padding: 12px 0;
      }
      
      .info-card ul {
        padding-left: 16px;
        font-size: 14px;
      }
      
      .progress-info {
        flex-direction: column;
        gap: 8px;
        text-align: center;
      }
      
      .success-message mat-icon,
      .partial-success mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }
      
      .error-list {
        max-height: 150px;
        font-size: 12px;
      }
      
      h2 {
        font-size: 1.2rem;
        justify-content: center;
      }
    }
    
    @media (max-width: 480px) {
      .import-dialog {
        min-width: 280px;
        max-width: 98vw;
      }
      
      .info-card {
        margin-bottom: 12px;
      }
      
      .success-message mat-icon,
      .partial-success mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        margin-bottom: 12px;
      }
      
      .current-item {
        font-size: 12px;
      }
      
      h2 {
        font-size: 1.1rem;
      }
    }
  `]
})
export class ImportEstructuraDialogComponent implements OnInit {
  importing = false;
  completed = false;
  progress: ImportProgress = {
    total: 0,
    processed: 0,
    success: 0,
    errors: []
  };

  constructor(
    private dialogRef: MatDialogRef<ImportEstructuraDialogComponent>,
    private importService: PartidasImportService
  ) { }

  ngOnInit(): void {
    // Componente inicializado
  }

  startImport(): void {
    this.importing = true;
    this.completed = false;
    
    this.importService.importEstructuraPartidas().subscribe({
      next: (progress) => {
        this.progress = progress;
        
        // Verificar si la importación está completa
        if (progress.processed >= progress.total) {
          this.importing = false;
          this.completed = true;
        }
      },
      error: (error) => {
        // Error during import
        this.importing = false;
        this.progress.errors.push(`Error general: ${error.message || error}`);
      }
    });
  }

  getProgressPercentage(): number {
    if (this.progress.total === 0) return 0;
    return (this.progress.processed / this.progress.total) * 100;
  }

  onCancel(): void {
    this.dialogRef.close(this.completed ? this.progress : null);
  }
}