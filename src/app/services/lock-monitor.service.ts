import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LockMonitorService {
  private monitoringSubscription?: Subscription;
  private lockStatusSubject = new BehaviorSubject<boolean>(false);
  public lockStatus$ = this.lockStatusSubject.asObservable();

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Monitorear locks cada 30 segundos
    this.monitoringSubscription = interval(30000).subscribe(() => {
      this.checkAndCleanLocks();
    });

    // También verificar al inicio
    setTimeout(() => this.checkAndCleanLocks(), 1000);
  }

  private async checkAndCleanLocks(): Promise<void> {
    try {
      if ('locks' in navigator && navigator.locks) {
        const lockInfo = await navigator.locks.query();
        
        // Verificar si hay locks pendientes por mucho tiempo
        const hasStuckLocks = lockInfo.pending && lockInfo.pending.length > 0;
        
        if (hasStuckLocks && lockInfo.pending) {
          console.log('🔍 LockMonitor: Detectados locks pendientes:', lockInfo.pending);
          
          // Si hay locks pendientes por más de 1 minuto, limpiar
          const oldLocks = lockInfo.pending.filter(lock => {
            // Verificar si el lock parece estar atascado
            return lock.name && (
              lock.name.includes('sb-auth-token') ||
              lock.name.includes('supabase')
            );
          });
          
          if (oldLocks.length > 0) {
            console.log('🧹 LockMonitor: Limpiando locks atascados...');
            await this.forceCleanLocks();
            this.lockStatusSubject.next(true); // Indicar que se limpiaron locks
          }
        } else {
          this.lockStatusSubject.next(false); // No hay problemas de locks
        }
      }
    } catch (error) {
      console.warn('⚠️ LockMonitor: Error verificando locks:', error);
    }
  }

  public async forceCleanLocks(): Promise<void> {
    try {
      console.log('🔓 LockMonitor: Iniciando limpieza forzada de locks...');
      
      // Limpiar storage
      const lockKeys = [
        'lock:sb-auth-token',
        'lock:sb-auth-token-resobra',
        'sb-auth-token',
        'supabase.auth.token',
        'sb-' + window.location.hostname + '-auth-token',
        // Agregar más patrones comunes
        'sb-auth-token-' + window.location.hostname,
        'supabase-auth-token'
      ];
      
      // Limpiar localStorage y sessionStorage
      lockKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(`⚠️ Error removing ${key}:`, e);
        }
      });
      
      // También limpiar cualquier clave que contenga 'lock' o 'sb-'
      this.cleanStorageByPattern(['lock', 'sb-']);
      
      console.log('✅ LockMonitor: Limpieza forzada completada');
    } catch (error) {
      console.error('❌ LockMonitor: Error en limpieza forzada:', error);
    }
  }

  private cleanStorageByPattern(patterns: string[]): void {
    try {
      // Limpiar localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && patterns.some(pattern => key.includes(pattern))) {
          console.log(`🗑️ Removing localStorage key: ${key}`);
          localStorage.removeItem(key);
        }
      }
      
      // Limpiar sessionStorage
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && patterns.some(pattern => key.includes(pattern))) {
          console.log(`🗑️ Removing sessionStorage key: ${key}`);
          sessionStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cleaning storage by pattern:', error);
    }
  }

  public async getLockInfo(): Promise<any> {
    try {
      if ('locks' in navigator && navigator.locks) {
        return await navigator.locks.query();
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Error getting lock info:', error);
      return null;
    }
  }

  public stopMonitoring(): void {
    if (this.monitoringSubscription) {
      this.monitoringSubscription.unsubscribe();
      this.monitoringSubscription = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }
}