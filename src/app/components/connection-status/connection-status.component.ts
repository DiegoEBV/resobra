import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OfflineSyncService, SyncStatus } from '../../services/offline-sync.service';

@Component({
  selector: 'app-connection-status',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './connection-status.component.html',
  styleUrls: ['./connection-status.component.scss']
})
export class ConnectionStatusComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingOperations: 0,
    syncErrors: []
  };
  
  showDetails = false;
  
  constructor(
    private offlineSyncService: OfflineSyncService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.offlineSyncService.syncStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        const wasOffline = !this.syncStatus.isOnline;
        this.syncStatus = status;
        
        // Mostrar notificación cuando se recupere la conexión
        if (wasOffline && status.isOnline) {
          this.snackBar.open('Conexión restaurada. Sincronizando datos...', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
        
        // Mostrar notificación cuando se pierda la conexión
        if (!wasOffline && !status.isOnline) {
          this.snackBar.open('Sin conexión. Trabajando en modo offline', 'Cerrar', {
            duration: 5000,
            panelClass: ['warning-snackbar']
          });
        }
        
        // Mostrar errores de sincronización
        if (status.syncErrors.length > 0) {
          status.syncErrors.forEach(error => {
            this.snackBar.open(error, 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          });
        }
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }
  
  async forcSync(): Promise<void> {
    if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
      await this.offlineSyncService.syncPendingOperations();
      this.snackBar.open('Sincronización iniciada', 'Cerrar', {
        duration: 2000
      });
    }
  }
  
  async clearPendingOperations(): Promise<void> {
    if (confirm('¿Estás seguro de que quieres eliminar todas las operaciones pendientes? Esta acción no se puede deshacer.')) {
      await this.offlineSyncService.clearPendingOperations();
      this.snackBar.open('Operaciones pendientes eliminadas', 'Cerrar', {
        duration: 3000
      });
    }
  }
  
  getStatusIcon(): string {
    if (this.syncStatus.isSyncing) {
      return 'sync';
    }
    return this.syncStatus.isOnline ? 'wifi' : 'wifi_off';
  }
  
  getStatusText(): string {
    if (this.syncStatus.isSyncing) {
      return 'Sincronizando...';
    }
    return this.syncStatus.isOnline ? 'En línea' : 'Sin conexión';
  }
  
  getStatusColor(): string {
    if (this.syncStatus.isSyncing) {
      return 'accent';
    }
    return this.syncStatus.isOnline ? 'primary' : 'warn';
  }
}