import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, Router } from '@angular/router';
import { ObrasService } from '../../services/obras.service';
import { Obra } from '../../interfaces/database.interface';
import { CreateProjectDialogComponent } from '../admin-projects/create-project-dialog.component';

@Component({
  selector: 'app-obras',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    RouterModule
  ],
  template: `
    <div class="obras-container">
      <!-- Debug: Componente cargado -->
      <div style="display: none;">{{ logComponentLoaded() }}</div>
      <mat-card>
        <mat-card-header>
          <div class="header-content">
            <mat-card-title>Gestión de Obras</mat-card-title>
            <button mat-raised-button color="primary" (click)="openCreateDialog()">
              <mat-icon>add</mat-icon>
              Nueva Obra
            </button>
          </div>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Filtro de búsqueda -->
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar obras</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="Buscar por nombre, ubicación o contratista...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <!-- Estado de carga -->
          <div *ngIf="loading" class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Cargando obras...</p>
          </div>

          <!-- Tabla de obras -->
          <div *ngIf="!loading" class="table-container">
            <table mat-table [dataSource]="dataSource" matSort class="obras-table">
              <!-- Columna Nombre -->
              <ng-container matColumnDef="nombre">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Nombre</th>
                <td mat-cell *matCellDef="let obra">{{ obra.nombre }}</td>
              </ng-container>

              <!-- Columna Ubicación -->
              <ng-container matColumnDef="ubicacion">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Ubicación</th>
                <td mat-cell *matCellDef="let obra">{{ obra.ubicacion }}</td>
              </ng-container>

              <!-- Columna Estado -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Estado</th>
                <td mat-cell *matCellDef="let obra">
                  <span class="estado-badge" [ngClass]="'estado-' + obra.estado">
                    {{ getEstadoLabel(obra.estado) }}
                  </span>
                </td>
              </ng-container>



              <!-- Columna Fecha Inicio -->
              <ng-container matColumnDef="fecha_inicio">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha Inicio</th>
                <td mat-cell *matCellDef="let obra">
                  {{ obra.fecha_inicio | date:'dd/MM/yyyy' }}
                </td>
              </ng-container>

              <!-- Columna Fecha Fin Estimada -->
              <ng-container matColumnDef="fecha_fin_estimada">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha Fin Estimada</th>
                <td mat-cell *matCellDef="let obra">
                  {{ obra.fecha_fin_estimada ? (obra.fecha_fin_estimada | date:'dd/MM/yyyy') : 'No definida' }}
                </td>
              </ng-container>

              <!-- Columna Acciones -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let obra">
                  <button mat-icon-button (click)="editObra(obra)" matTooltip="Editar obra">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="viewObra(obra)" matTooltip="Ver detalles">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteObra(obra)" matTooltip="Eliminar obra">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <!-- Mensaje cuando no hay datos -->
            <div *ngIf="dataSource.data.length === 0" class="no-data">
              <mat-icon>info</mat-icon>
              <p>No se encontraron obras</p>
            </div>
          </div>

          <!-- Paginador -->
          <mat-paginator 
            *ngIf="!loading && dataSource.data.length > 0"
            [pageSizeOptions]="[5, 10, 20]"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .obras-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .search-field {
      width: 100%;
      margin-bottom: 20px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .table-container {
      overflow-x: auto;
    }

    .obras-table {
      width: 100%;
    }

    .estado-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .estado-planificacion {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .estado-activa {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .estado-finalizada {
      background-color: #e8f5e8;
      color: #388e3c;
    }

    .estado-suspendida {
      background-color: #fce4ec;
      color: #c2185b;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      color: #666;
    }

    .no-data mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
  `]
})
export class ObrasComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'nombre',
    'ubicacion', 
    'estado',
    'fecha_inicio',
    'fecha_fin_estimada',
    'acciones'
  ];

  dataSource = new MatTableDataSource<Obra>([]);
  loading = false;

  constructor(
    private obrasService: ObrasService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // ObrasComponent: Constructor ejecutado
  }

  ngOnInit(): void {
    // ObrasComponent ngOnInit called
    this.loadObras();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  async loadObras(): Promise<void> {
    // ObrasComponent: Iniciando carga de obras
    this.loading = true;
    try {
      // ObrasComponent: Llamando a obrasService.getAllObras()
      const obras = await this.obrasService.getAllObras();
      // ObrasComponent: Obras recibidas
      // ObrasComponent: Número de obras
      
      if (!obras || obras.length === 0) {
        // ObrasComponent: No se encontraron obras
      }
      
      this.dataSource.data = obras || [];
      // ObrasComponent: DataSource actualizado
    } catch (error) {
      // Error loading obras
      // Error details
    } finally {
      this.loading = false;
      // ObrasComponent: Carga de obras finalizada
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateProjectDialogComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.data) {
        this.createObra(result.data);
      }
    });
  }

  editObra(obra: Obra): void {
    const dialogRef = this.dialog.open(CreateProjectDialogComponent, {
      width: '600px',
      data: { mode: 'edit', obra: obra }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.data && result.mode === 'edit') {
        this.updateObra(obra.id, result.data);
      }
    });
  }

  viewObra(obra: Obra): void {
    this.router.navigate(['/obras', obra.id]);
  }

  async createObra(obraData: any): Promise<void> {
    try {
      const newObra = await this.obrasService.createObra(obraData);
      if (newObra) {
        this.showMessage('Obra creada exitosamente');
        this.loadObras();
      } else {
        this.showMessage('Error al crear la obra');
      }
    } catch (error) {
      // Error creating obra
      this.showMessage('Error al crear la obra');
    }
  }

  async updateObra(id: string, updates: any): Promise<void> {
    try {
      const updatedObra = await this.obrasService.updateObra(id, updates);
      if (updatedObra) {
        this.showMessage('Obra actualizada exitosamente');
        this.loadObras();
      } else {
        this.showMessage('Error al actualizar la obra');
      }
    } catch (error) {
      // Error updating obra
      this.showMessage('Error al actualizar la obra');
    }
  }

  async deleteObra(obra: Obra): Promise<void> {
    if (confirm(`¿Está seguro de que desea eliminar la obra "${obra.nombre}"?`)) {
      try {
        const success = await this.obrasService.deleteObra(obra.id);
        if (success) {
          this.showMessage('Obra eliminada exitosamente');
          this.loadObras();
        } else {
          this.showMessage('Error al eliminar la obra');
        }
      } catch (error) {
        // Error deleting obra
        this.showMessage('Error al eliminar la obra');
      }
    }
  }

  getEstadoLabel(estado: string): string {
    const estados: { [key: string]: string } = {
      'planificacion': 'Planificación',
      'activa': 'Activa',
      'suspendida': 'Suspendida',
      'finalizada': 'Finalizada'
    };
    return estados[estado] || estado;
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  logComponentLoaded(): string {
    // ObrasComponent: Template renderizado
    return '';
  }
}