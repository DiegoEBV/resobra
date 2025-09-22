import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { AlertaKPI } from '../../services/kpis.service';

@Component({
  selector: 'app-alert-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule
  ],
  template: `
    <div class="alert-detail-modal">
      <mat-dialog-content>
        <div class="modal-header">
          <div class="alert-icon">
            <mat-icon color="warn">warning</mat-icon>
          </div>
          <div class="alert-title">
            <h2>Detalle de Alerta KPI</h2>
            <p class="alert-date">{{ data.alerta.fecha | date:'dd/MM/yyyy HH:mm' }}</p>
          </div>
        </div>

        <div class="alert-content">
          <div class="kpi-metrics">
            <div class="metric-card">
              <div class="metric-label">Avance Físico</div>
              <div class="metric-value" [class.critical]="data.alerta.avance_fisico < 50">
                {{ data.alerta.avance_fisico }}%
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Productividad</div>
              <div class="metric-value" [class.critical]="data.alerta.productividad < 50">
                {{ data.alerta.productividad }}%
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-label">Calidad</div>
              <div class="metric-value" [class.critical]="data.alerta.calidad < 50">
                {{ data.alerta.calidad }}%
              </div>
            </div>
          </div>

          <div class="alert-details" *ngIf="data.alerta.obra_nombre || data.alerta.actividad_tipo">
            <h3>Información Adicional</h3>
            <div class="detail-item" *ngIf="data.alerta.obra_nombre">
              <mat-icon>business</mat-icon>
              <span><strong>Obra:</strong> {{ data.alerta.obra_nombre }}</span>
            </div>
            <div class="detail-item" *ngIf="data.alerta.actividad_tipo">
              <mat-icon>construction</mat-icon>
              <span><strong>Tipo de Actividad:</strong> {{ data.alerta.actividad_tipo }}</span>
            </div>
            <div class="detail-item" *ngIf="data.alerta.actividad_ubicacion">
              <mat-icon>location_on</mat-icon>
              <span><strong>Ubicación:</strong> {{ data.alerta.actividad_ubicacion }}</span>
            </div>
          </div>

          <div class="alert-status">
            <mat-chip color="warn" selected>
              <mat-icon>priority_high</mat-icon>
              Requiere Atención
            </mat-chip>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onClose()">
          <mat-icon>close</mat-icon>
          Cerrar
        </button>
        <button mat-raised-button color="warn" (click)="onDelete()">
          <mat-icon>delete</mat-icon>
          Eliminar Alerta
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .alert-detail-modal {
      min-width: 500px;
      max-width: 600px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .alert-icon mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .alert-title h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      color: #333;
    }

    .alert-date {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .alert-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .kpi-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .metric-card {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      border: 2px solid transparent;
      transition: all 0.3s ease;
    }

    .metric-card:hover {
      background: #eeeeee;
    }

    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #2196F3;
    }

    .metric-value.critical {
      color: #f44336;
    }

    .alert-details h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: #333;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding: 8px;
      background: #fafafa;
      border-radius: 4px;
    }

    .detail-item mat-icon {
      color: #666;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .detail-item span {
      font-size: 14px;
      color: #333;
    }

    .alert-status {
      display: flex;
      justify-content: center;
      padding-top: 16px;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      margin: 0;
    }

    mat-dialog-actions button {
      margin-left: 8px;
    }

    @media (max-width: 600px) {
      .alert-detail-modal {
        min-width: 90vw;
      }
      
      .kpi-metrics {
        grid-template-columns: 1fr;
      }
      
      .modal-header {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class AlertDetailModalComponent {
  constructor(
    public dialogRef: MatDialogRef<AlertDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { alerta: AlertaKPI }
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  onDelete(): void {
    this.dialogRef.close({ action: 'delete', alerta: this.data.alerta });
  }
}