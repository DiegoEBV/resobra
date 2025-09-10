import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export interface ProgressUpdateData {
  actividad: any;
  currentProgress: number;
}

export interface ProgressUpdateResult {
  progress: number;
  observaciones?: string;
}

@Component({
  selector: 'app-progress-update-dialog',
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
    MatSliderModule,
    MatProgressBarModule
  ],
  template: `
    <div class="progress-update-dialog">
      <h2 mat-dialog-title>
        <mat-icon>trending_up</mat-icon>
        Actualizar Progreso
      </h2>
      
      <mat-dialog-content>
        <div class="activity-info">
          <h3>{{ data.actividad.nombre }}</h3>
          <p class="activity-description">{{ data.actividad.descripcion }}</p>
        </div>
        
        <form [formGroup]="progressForm" class="progress-form">
          <div class="progress-section">
            <div class="progress-header">
              <span>Progreso Actual</span>
              <span class="progress-value">{{ progressForm.get('progress')?.value }}%</span>
            </div>
            
            <mat-progress-bar 
              mode="determinate" 
              [value]="progressForm.get('progress')?.value">
            </mat-progress-bar>
            
            <div class="slider-container">
              <mat-slider 
                min="0" 
                max="100" 
                step="1" 
                discrete
                [displayWith]="formatLabel">
                <input matSliderThumb formControlName="progress">
              </mat-slider>
            </div>
          </div>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Observaciones (opcional)</mat-label>
            <textarea matInput 
                      formControlName="observaciones" 
                      rows="3"
                      placeholder="Agregar comentarios sobre el progreso..."></textarea>
            <mat-icon matSuffix>note</mat-icon>
          </mat-form-field>
          
          <div class="progress-indicators">
            <div class="indicator" [class.active]="progressForm.get('progress')?.value === 0">
              <mat-icon>play_arrow</mat-icon>
              <span>Iniciado (0%)</span>
            </div>
            <div class="indicator" [class.active]="progressForm.get('progress')?.value >= 25 && progressForm.get('progress')?.value < 50">
              <mat-icon>trending_up</mat-icon>
              <span>En Progreso (25%)</span>
            </div>
            <div class="indicator" [class.active]="progressForm.get('progress')?.value >= 50 && progressForm.get('progress')?.value < 75">
              <mat-icon>schedule</mat-icon>
              <span>Medio Camino (50%)</span>
            </div>
            <div class="indicator" [class.active]="progressForm.get('progress')?.value >= 75 && progressForm.get('progress')?.value < 100">
              <mat-icon>near_me</mat-icon>
              <span>Casi Completo (75%)</span>
            </div>
            <div class="indicator" [class.active]="progressForm.get('progress')?.value === 100">
              <mat-icon>check_circle</mat-icon>
              <span>Completado (100%)</span>
            </div>
          </div>
        </form>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>
        
        <button mat-raised-button 
                color="primary" 
                (click)="onConfirm()"
                [disabled]="progressForm.invalid">
          <mat-icon>save</mat-icon>
          Actualizar Progreso
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .progress-update-dialog {
      width: 100%;
    }
    
    .activity-info {
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    
    .activity-info h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 1.2rem;
    }
    
    .activity-description {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }
    
    .progress-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .progress-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
    }
    
    .progress-value {
      color: #1976d2;
      font-size: 1.2rem;
      font-weight: 600;
    }
    
    .slider-container {
      padding: 0 12px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .progress-indicators {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }
    
    .indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 8px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.3s ease;
      text-align: center;
    }
    
    .indicator.active {
      border-color: #1976d2;
      background: #e3f2fd;
      color: #1976d2;
    }
    
    .indicator mat-icon {
      margin-bottom: 4px;
      font-size: 20px;
    }
    
    .indicator.active mat-icon {
      color: #1976d2;
    }
    
    .indicator span {
      font-size: 0.8rem;
      font-weight: 500;
    }
    
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
    
    @media (max-width: 600px) {
      .progress-indicators {
        grid-template-columns: 1fr;
      }
      
      .indicator {
        flex-direction: row;
        justify-content: flex-start;
        text-align: left;
      }
      
      .indicator mat-icon {
        margin-bottom: 0;
        margin-right: 8px;
      }
    }
  `]
})
export class ProgressUpdateDialogComponent implements OnInit {
  progressForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProgressUpdateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProgressUpdateData
  ) {
    this.progressForm = this.fb.group({
      progress: [data.currentProgress, [Validators.required, Validators.min(0), Validators.max(100)]],
      observaciones: [data.actividad.observaciones || '']
    });
  }
  
  ngOnInit(): void {
    // Inicialización adicional si es necesaria
  }
  
  formatLabel(value: number): string {
    return `${value}%`;
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
  
  onConfirm(): void {
    if (this.progressForm.valid) {
      const result: ProgressUpdateResult = {
        progress: this.progressForm.get('progress')?.value,
        observaciones: this.progressForm.get('observaciones')?.value
      };
      this.dialogRef.close(result);
    }
  }
}