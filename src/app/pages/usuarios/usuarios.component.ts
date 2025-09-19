import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UsuariosService } from '../../services/usuarios.service';
import { Usuario, FiltrosUsuario } from '../../interfaces/usuario.interface';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="usuarios-container">
      <!-- Header con estadísticas -->
      <div class="header-section">
        <h1>Gestión de Usuarios</h1>
        <div class="stats-cards" *ngIf="estadisticas">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-number">{{ estadisticas.total }}</div>
              <div class="stat-label">Total</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-number">{{ estadisticas.activos }}</div>
              <div class="stat-label">Activos</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-number">{{ estadisticas.residentes }}</div>
              <div class="stat-label">Residentes</div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Filtros y acciones -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar usuarios</mat-label>
              <input matInput 
                     [(ngModel)]="filtros.busqueda" 
                     (input)="aplicarFiltros()"
                     placeholder="Nombre o email...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Rol</mat-label>
              <mat-select [(ngModel)]="filtros.rol" (selectionChange)="aplicarFiltros()">
                <mat-option value="todos">Todos los roles</mat-option>
                <mat-option value="residente">Residente</mat-option>
                <mat-option value="logistica">Logística</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select [(ngModel)]="filtros.activo" (selectionChange)="aplicarFiltros()">
                <mat-option [value]="null">Todos</mat-option>
                <mat-option [value]="true">Activos</mat-option>
                <mat-option [value]="false">Inactivos</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="actions-section">
              <button mat-raised-button 
                      color="primary" 
                      (click)="crearUsuario()"
                      [disabled]="cargando">
                <mat-icon>add</mat-icon>
                Nuevo Usuario
              </button>
              
              <button mat-icon-button 
                      (click)="cargarUsuarios()"
                      [disabled]="cargando"
                      matTooltip="Actualizar">
                <mat-icon>refresh</mat-icon>
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Tabla de usuarios -->
      <mat-card class="table-card">
        <mat-card-content>
          <div class="table-container">
            <mat-table [dataSource]="dataSource" 
                       matSort 
                       class="usuarios-table"
                       [class.loading]="cargando">
              
              <!-- Columna Avatar/Nombre -->
              <ng-container matColumnDef="nombre">
                <mat-header-cell *matHeaderCellDef mat-sort-header>Usuario</mat-header-cell>
                <mat-cell *matCellDef="let usuario">
                  <div class="user-info">
                    <div class="user-avatar">
                      {{ getInitials(usuario.nombre) }}
                    </div>
                    <div class="user-details">
                      <div class="user-name">{{ usuario.nombre }}</div>
                      <div class="user-email">{{ usuario.email }}</div>
                    </div>
                  </div>
                </mat-cell>
              </ng-container>

              <!-- Columna Rol -->
              <ng-container matColumnDef="rol">
                <mat-header-cell *matHeaderCellDef mat-sort-header>Rol</mat-header-cell>
                <mat-cell *matCellDef="let usuario">
                  <mat-chip-set>
                    <mat-chip [class]="'chip-' + usuario.rol">
                      {{ getRolLabel(usuario.rol) }}
                    </mat-chip>
                  </mat-chip-set>
                </mat-cell>
              </ng-container>

              <!-- Columna Estado -->
              <ng-container matColumnDef="activo">
                <mat-header-cell *matHeaderCellDef mat-sort-header>Estado</mat-header-cell>
                <mat-cell *matCellDef="let usuario">
                  <mat-chip-set>
                    <mat-chip [class]="usuario.activo !== false ? 'chip-activo' : 'chip-inactivo'">
                      {{ usuario.activo !== false ? 'Activo' : 'Inactivo' }}
                    </mat-chip>
                  </mat-chip-set>
                </mat-cell>
              </ng-container>

              <!-- Columna Fecha de creación -->
              <ng-container matColumnDef="created_at">
                <mat-header-cell *matHeaderCellDef mat-sort-header>Creado</mat-header-cell>
                <mat-cell *matCellDef="let usuario">
                  {{ formatDate(usuario.created_at) }}
                </mat-cell>
              </ng-container>

              <!-- Columna Acciones -->
              <ng-container matColumnDef="acciones">
                <mat-header-cell *matHeaderCellDef>Acciones</mat-header-cell>
                <mat-cell *matCellDef="let usuario">
                  <div class="actions-buttons">
                    <button mat-icon-button 
                            (click)="editarUsuario(usuario)"
                            matTooltip="Editar usuario">
                      <mat-icon>edit</mat-icon>
                    </button>
                    
                    <button mat-icon-button 
                            (click)="toggleEstadoUsuario(usuario)"
                            [matTooltip]="usuario.activo !== false ? 'Desactivar usuario' : 'Activar usuario'"
                            [color]="usuario.activo !== false ? 'warn' : 'primary'">
                      <mat-icon>{{ usuario.activo !== false ? 'block' : 'check_circle' }}</mat-icon>
                    </button>
                    
                    <button mat-icon-button 
                            (click)="cambiarPassword(usuario)"
                            matTooltip="Cambiar contraseña">
                      <mat-icon>lock_reset</mat-icon>
                    </button>
                    
                    <button mat-icon-button 
                            (click)="eliminarUsuario(usuario)"
                            color="warn"
                            matTooltip="Eliminar usuario">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </mat-cell>
              </ng-container>

              <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
              <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
            </mat-table>

            <!-- Spinner de carga -->
            <div class="loading-spinner" *ngIf="cargando">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Cargando usuarios...</p>
            </div>

            <!-- Mensaje cuando no hay datos -->
            <div class="no-data" *ngIf="!cargando && dataSource.data.length === 0">
              <mat-icon>people_outline</mat-icon>
              <h3>No se encontraron usuarios</h3>
              <p>No hay usuarios que coincidan con los filtros aplicados.</p>
              <button mat-raised-button color="primary" (click)="crearUsuario()">
                <mat-icon>add</mat-icon>
                Crear primer usuario
              </button>
            </div>
          </div>

          <!-- Paginador -->
          <mat-paginator [pageSizeOptions]="[5, 10, 25, 50]"
                         [pageSize]="10"
                         showFirstLastButtons
                         *ngIf="!cargando && dataSource.data.length > 0">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .usuarios-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-section {
      margin-bottom: 24px;
    }

    .header-section h1 {
      margin: 0 0 16px 0;
      font-size: 2rem;
      font-weight: 500;
      color: #333;
    }

    .stats-cards {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
    }

    .stat-card {
      min-width: 120px;
      text-align: center;
    }

    .stat-card mat-card-content {
      padding: 16px !important;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      color: #1976d2;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #666;
      margin-top: 4px;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    .actions-section {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }

    .table-card {
      overflow: hidden;
    }

    .table-container {
      position: relative;
      min-height: 400px;
    }

    .usuarios-table {
      width: 100%;
    }

    .usuarios-table.loading {
      opacity: 0.6;
      pointer-events: none;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .user-email {
      font-size: 0.875rem;
      color: #666;
    }

    .chip-residente {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .chip-logistica {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .chip-activo {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .chip-inactivo {
      background-color: #ffebee;
      color: #c62828;
    }

    .actions-buttons {
      display: flex;
      gap: 4px;
    }

    .loading-spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .loading-spinner p {
      margin-top: 16px;
      color: #666;
    }

    .no-data {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #666;
    }

    .no-data mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-data h3 {
      margin: 0 0 8px 0;
      font-weight: 500;
    }

    .no-data p {
      margin: 0 0 24px 0;
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .usuarios-container {
        padding: 16px;
      }

      .stats-cards {
        flex-direction: column;
      }

      .filters-row {
        flex-direction: column;
        align-items: stretch;
      }

      .actions-section {
        margin-left: 0;
        justify-content: center;
      }

      .search-field {
        min-width: auto;
      }
    }
  `]
})
export class UsuariosComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['nombre', 'rol', 'activo', 'created_at', 'acciones'];
  dataSource = new MatTableDataSource<Usuario>([]);
  cargando = false;
  
  filtros: FiltrosUsuario = {
    busqueda: '',
    rol: 'todos',
    activo: null
  };

  estadisticas: {
    total: number;
    activos: number;
    inactivos: number;
    residentes: number;
    logistica: number;
  } | null = null;

  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarEstadisticas();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  async cargarUsuarios() {
    try {
      this.cargando = true;
      const usuarios = await this.usuariosService.getUsuarios(this.filtros);
      this.dataSource.data = usuarios;
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      this.mostrarError('Error al cargar la lista de usuarios');
    } finally {
      this.cargando = false;
    }
  }

  async cargarEstadisticas() {
    try {
      this.estadisticas = await this.usuariosService.getEstadisticasUsuarios();
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }

  aplicarFiltros() {
    // Debounce para evitar muchas llamadas
    clearTimeout(this.filtroTimeout);
    this.filtroTimeout = setTimeout(() => {
      this.cargarUsuarios();
    }, 300);
  }

  private filtroTimeout: any;

  crearUsuario() {
    this.router.navigate(['/usuarios/crear']);
  }

  editarUsuario(usuario: Usuario) {
    this.router.navigate(['/usuarios/editar', usuario.id]);
  }

  async toggleEstadoUsuario(usuario: Usuario) {
    try {
      const accion = usuario.activo !== false ? 'desactivar' : 'activar';
      const confirmacion = confirm(`¿Está seguro que desea ${accion} al usuario ${usuario.nombre}?`);
      
      if (!confirmacion) return;

      await this.usuariosService.toggleUsuarioActivo(usuario.id);
      this.mostrarExito(`Usuario ${accion}do exitosamente`);
      await this.cargarUsuarios();
      await this.cargarEstadisticas();
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      this.mostrarError('Error al cambiar el estado del usuario');
    }
  }

  cambiarPassword(usuario: Usuario) {
    const newPassword = prompt(`Ingrese la nueva contraseña para ${usuario.nombre}:`);
    
    if (!newPassword) return;

    this.usuariosService.cambiarPassword(usuario.id, newPassword)
      .then(() => {
        this.mostrarExito('Contraseña cambiada exitosamente');
      })
      .catch(error => {
        console.error('Error al cambiar contraseña:', error);
        this.mostrarError('Error al cambiar la contraseña');
      });
  }

  async eliminarUsuario(usuario: Usuario) {
    const confirmacion = confirm(
      `¿Está seguro que desea eliminar al usuario ${usuario.nombre}?\n\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmacion) return;

    try {
      await this.usuariosService.deleteUsuario(usuario.id);
      this.mostrarExito('Usuario eliminado exitosamente');
      await this.cargarUsuarios();
      await this.cargarEstadisticas();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      this.mostrarError('Error al eliminar el usuario');
    }
  }

  getInitials(nombre: string): string {
    return nombre
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getRolLabel(rol: string): string {
    const roles: { [key: string]: string } = {
      'residente': 'Residente',
      'logistica': 'Logística'
    };
    return roles[rol] || rol;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private mostrarExito(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private mostrarError(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}