import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActividadesService } from '../../../services/actividades.service';
import { Actividad, Tarea } from '../../../interfaces/database.interface';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private actividadesService: ActividadesService,
    private snackBar: MatSnackBar
  ) {
    this.actividadId = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.actividadId = params['id'];
      console.log('🔍 [DetalleActividad] ID de actividad obtenido:', this.actividadId);
      if (this.actividadId) {
        this.loadActividad();
        // Cargar tareas después de un pequeño delay para asegurar que la actividad esté cargada
        setTimeout(() => {
          this.loadTareas();
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
      console.error('Error cargando actividad:', error);
      this.snackBar.open('Error cargando actividad', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  async loadTareas() {
    try {
      this.loadingTareas = true;
      console.log('🔍 [DetalleActividad] Cargando tareas para actividad ID:', this.actividadId);
      
      if (!this.actividadId) {
        console.error('❌ [DetalleActividad] No hay actividadId disponible');
        return;
      }
      
      this.tareas = await this.actividadesService.getTareasByActividad(this.actividadId!);
      console.log('📋 [DetalleActividad] Tareas obtenidas:', this.tareas.length, this.tareas);
      
      this.calcularProgreso();
    } catch (error) {
      console.error('❌ [DetalleActividad] Error cargando tareas:', error);
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
      
      console.error('Error actualizando tarea:', error);
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
    console.log('🔄 [DetalleActividad] Refrescando tareas manualmente');
    await this.loadTareas();
  }

  volver() {
    this.router.navigate(['/actividades']);
  }
}