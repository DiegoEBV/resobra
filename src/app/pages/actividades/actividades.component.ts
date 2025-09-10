import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { Router, RouterModule } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { ActividadesService } from '../../services/actividades.service';
import { TareasService } from '../../services/tareas.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule
  ],
  templateUrl: './actividades.component.html',
  styleUrls: ['./actividades.component.css']
})
export class ActividadesComponent implements OnInit, OnDestroy, AfterViewInit {

  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  // Datos de la tabla
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [
    'tipo_actividad',
    'estado',
    'fecha_inicio',
    'responsable',
    'ubicacion',
    'progreso',
    'acciones'
  ];
  
  // Filtros
  estadoFiltro: string = '';
  tipoFiltro: string = '';
  
  // Estados y tipos disponibles
  estados = [
    { value: 'planificada', label: 'Planificada' },
    { value: 'en_progreso', label: 'En Progreso' },
    { value: 'completada', label: 'Completada' },
    { value: 'pausada', label: 'Pausada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];
  
  tipos = [
    { value: 'construccion', label: 'Construcción' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'inspeccion', label: 'Inspección' },
    { value: 'reparacion', label: 'Reparación' }
  ];
  
  // Estado de carga
  isLoading = false;
  private subscriptions: Subscription[] = [];
  
  constructor(
    private actividadesService: ActividadesService,
    private tareasService: TareasService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.loadActividades();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  verDetalle(actividad: any): void {
    this.router.navigate(['/actividades', actividad.id]);
  }

  editarActividad(actividad: any): void {
    this.router.navigate(['/actividades/editar', actividad.id]);
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'completada': return 'primary';
      case 'en_progreso': return 'accent';
      case 'planificada': return 'basic';
      case 'pausada': return 'warn';
      case 'cancelada': return 'warn';
      default: return 'basic';
    }
  }

  getProgresoColor(progreso: number): string {
    if (progreso >= 80) return 'primary';
    if (progreso >= 50) return 'accent';
    if (progreso >= 25) return 'warn';
    return 'warn';
  }

  // Método de debug para verificar el ID de cada actividad
  logActividadId(actividad: any): string {
    console.log('🔍 [ActividadesComponent] ===== DEBUG ACTIVIDAD =====');
    console.log('🔍 [ActividadesComponent] Actividad completa:', JSON.stringify(actividad, null, 2));
    console.log('🔍 [ActividadesComponent] ID de actividad:', actividad?.id);
    console.log('🔍 [ActividadesComponent] Tipo de ID:', typeof actividad?.id);
    console.log('🔍 [ActividadesComponent] Claves de actividad:', Object.keys(actividad || {}));
    console.log('🔍 [ActividadesComponent] ================================');
    return '';
  }

  getEstadoLabel(estado: string): string {
    const estadoObj = this.estados.find(e => e.value === estado);
    return estadoObj ? estadoObj.label : estado;
  }
  
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  
  // Cargar actividades
  async loadActividades(): Promise<void> {
    try {
      this.isLoading = true;
      console.log('🔄 Cargando actividades...');
      
      const actividades = await this.actividadesService.getActividades();
      console.log('📋 Actividades cargadas:', actividades.length);
      console.log('🔍 DEBUG: Primera actividad completa:', JSON.stringify(actividades[0], null, 2));
      
      // Verificar estructura de IDs
      actividades.forEach((actividad, index) => {
        console.log(`🔍 DEBUG: Actividad ${index} - ID:`, actividad.id, 'Tipo:', typeof actividad.id);
      });
      
      // Cargar progreso de tareas para cada actividad
      const actividadesConProgreso = await Promise.all(
        actividades.map(async (actividad) => {
          try {
            const tareas = await this.tareasService.getTareasByActividad(actividad.id);
            const totalTareas = tareas.length;
            const tareasCompletadas = tareas.filter(t => t.completada === true).length;
            const progreso = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;
            
            const actividadConProgreso = {
              ...actividad,
              progreso,
              totalTareas,
              tareasCompletadas
            };
            
            console.log(`🔍 DEBUG: Actividad procesada - ID: ${actividadConProgreso.id}, Tipo: ${typeof actividadConProgreso.id}`);
            return actividadConProgreso;
          } catch (error) {
            console.error(`Error cargando tareas para actividad ${actividad.id}:`, error);
            return {
              ...actividad,
              progreso: 0,
              totalTareas: 0,
              tareasCompletadas: 0
            };
          }
        })
      );
      
      console.log('🔍 DEBUG: Actividades finales en dataSource:', actividadesConProgreso.map(a => ({ id: a.id, tipo: typeof a.id })));
      this.dataSource.data = actividadesConProgreso;
      this.applyFilters();
      
    } catch (error) {
      console.error('Error cargando actividades:', error);
      this.snackBar.open('Error al cargar las actividades', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.isLoading = false;
    }
  }
  
  // Aplicar filtro de búsqueda
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  // Filtrar por estado
  filterByEstado(): void {
    this.applyFilters();
  }
  
  // Filtrar por tipo
  filterByTipo(): void {
    this.applyFilters();
  }
  
  // Aplicar filtros combinados
  private applyFilters(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const estadoMatch = !this.estadoFiltro || data.estado === this.estadoFiltro;
      const tipoMatch = !this.tipoFiltro || data.tipo_actividad === this.tipoFiltro;
      return estadoMatch && tipoMatch;
    };
    
    // Trigger filter
    this.dataSource.filter = Math.random().toString();
  }
  
  // Obtener icono del estado
  getEstadoIcon(estado: string): string {
    const icons: { [key: string]: string } = {
      'programado': 'schedule',
      'ejecucion': 'play_circle',
      'finalizado': 'check_circle'
    };
    return icons[estado] || 'help';
  }
  

  
  async deleteActividad(id: string): Promise<void> {
    console.log('🔍 DEBUG: deleteActividad called with ID:', id);
    console.log('🔍 DEBUG: ID type:', typeof id);
    console.log('🔍 DEBUG: ID value:', JSON.stringify(id));
    
    if (!id) {
      console.error('❌ Error: ID is undefined or null');
      this.snackBar.open('Error: ID de actividad no válido', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar eliminación',
        message: '¿Está seguro de que desea eliminar esta actividad?'
      }
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      try {
        console.log('🔍 DEBUG: Calling service deleteActividad with ID:', id);
        await this.actividadesService.deleteActividad(id);
        console.log('✅ Actividad eliminada exitosamente');
        this.snackBar.open('Actividad eliminada exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadActividades();
      } catch (error: any) {
        console.error('❌ Error deleting actividad:', error);
        this.snackBar.open('Error al eliminar la actividad', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    }
  }
  
  // Refrescar datos
  refreshData(): void {
    this.actividadesService.refresh();
  }
}