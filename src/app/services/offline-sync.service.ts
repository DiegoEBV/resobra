import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ReportsService } from './reports.service';
import { Report, ReportItem } from '../models/interfaces';

export interface OfflineOperation {
  id: string;
  type: 'create_report' | 'update_report' | 'create_report_item';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSyncTime?: Date;
  syncErrors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {
  private readonly DB_NAME = 'OfflineSyncDB';
  private readonly DB_VERSION = 1;
  private readonly OPERATIONS_STORE = 'operations';
  
  private db: IDBDatabase | null = null;
  private syncStatusSubject = new BehaviorSubject<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingOperations: 0,
    syncErrors: []
  });
  
  public syncStatus$ = this.syncStatusSubject.asObservable();
  public isOnline$: Observable<boolean>;
  
  private reportsService: ReportsService | null = null;

  constructor(
    private injector: Injector
  ) {
    this.initDatabase();
    this.setupOnlineDetection();
    this.startPeriodicSync();
    
    // Observable para detectar cambios en el estado de conexión
    this.isOnline$ = merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).pipe(startWith(navigator.onLine));
    
    // Sincronizar cuando se recupere la conexión
    this.isOnline$.subscribe(isOnline => {
      this.updateSyncStatus({ isOnline });
      if (isOnline) {
        this.syncPendingOperations();
      }
    });
  }
  
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.loadPendingOperationsCount();
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.OPERATIONS_STORE)) {
          const store = db.createObjectStore(this.OPERATIONS_STORE, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }
  
  private setupOnlineDetection(): void {
    window.addEventListener('online', () => {
      this.updateSyncStatus({ isOnline: true });
      this.syncPendingOperations();
    });
    
    window.addEventListener('offline', () => {
      this.updateSyncStatus({ isOnline: false });
    });
  }
  
  private startPeriodicSync(): void {
    // Sincronizar cada 5 minutos si hay conexión
    setInterval(() => {
      if (navigator.onLine) {
        this.syncPendingOperations();
      }
    }, 5 * 60 * 1000);
  }
  
  private getReportsService(): ReportsService {
    if (!this.reportsService) {
      this.reportsService = this.injector.get(ReportsService);
    }
    return this.reportsService;
  }



  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    const currentStatus = this.syncStatusSubject.value;
    this.syncStatusSubject.next({ ...currentStatus, ...updates });
  }
  
  private async loadPendingOperationsCount(): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction([this.OPERATIONS_STORE], 'readonly');
    const store = transaction.objectStore(this.OPERATIONS_STORE);
    const countRequest = store.count();
    
    countRequest.onsuccess = () => {
      this.updateSyncStatus({ pendingOperations: countRequest.result });
    };
  }
  
  async queueOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    if (!this.db) return;
    
    const fullOperation: OfflineOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0
    };
    
    const transaction = this.db.transaction([this.OPERATIONS_STORE], 'readwrite');
    const store = transaction.objectStore(this.OPERATIONS_STORE);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.add(fullOperation);
      request.onsuccess = () => {
        this.loadPendingOperationsCount();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
    
    // Intentar sincronizar inmediatamente si hay conexión
    if (navigator.onLine) {
      this.syncPendingOperations();
    }
  }
  
  async syncPendingOperations(): Promise<void> {
    if (!this.db || !navigator.onLine) return;
    
    const currentStatus = this.syncStatusSubject.value;
    if (currentStatus.isSyncing) return;
    
    this.updateSyncStatus({ isSyncing: true, syncErrors: [] });
    
    try {
      const operations = await this.getPendingOperations();
      const errors: string[] = [];
      
      for (const operation of operations) {
        try {
          await this.executeOperation(operation);
          await this.removeOperation(operation.id);
        } catch (error) {
          console.error(`Error executing operation ${operation.id}:`, error);
          errors.push(`Error en operación ${operation.type}: ${error}`);
          
          // Incrementar contador de reintentos
          operation.retryCount++;
          if (operation.retryCount >= operation.maxRetries) {
            // Eliminar operación si se excedieron los reintentos
            await this.removeOperation(operation.id);
            errors.push(`Operación ${operation.type} eliminada tras ${operation.maxRetries} intentos fallidos`);
          } else {
            // Actualizar operación con nuevo contador de reintentos
            await this.updateOperation(operation);
          }
        }
      }
      
      this.updateSyncStatus({
        isSyncing: false,
        lastSyncTime: new Date(),
        syncErrors: errors
      });
      
      await this.loadPendingOperationsCount();
      
    } catch (error) {
      console.error('Error during sync:', error);
      this.updateSyncStatus({
        isSyncing: false,
        syncErrors: [`Error general de sincronización: ${error}`]
      });
    }
  }
  
  private async getPendingOperations(): Promise<OfflineOperation[]> {
    if (!this.db) return [];
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.OPERATIONS_STORE], 'readonly');
      const store = transaction.objectStore(this.OPERATIONS_STORE);
      const index = store.index('timestamp');
      const request = index.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }
  
  private async executeOperation(operation: OfflineOperation): Promise<void> {
    switch (operation.type) {
      case 'create_report':
        await this.getReportsService().createReport(operation.data).toPromise();
        break;
        
      case 'update_report':
        await this.getReportsService().updateReport(operation.data.id, operation.data.updates).toPromise();
        break;
        
      case 'create_report_item':
        await this.getReportsService().createReportItems([operation.data]).toPromise();
        break;
        
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }
  
  private async removeOperation(operationId: string): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction([this.OPERATIONS_STORE], 'readwrite');
    const store = transaction.objectStore(this.OPERATIONS_STORE);
    
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(operationId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  private async updateOperation(operation: OfflineOperation): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction([this.OPERATIONS_STORE], 'readwrite');
    const store = transaction.objectStore(this.OPERATIONS_STORE);
    
    return new Promise<void>((resolve, reject) => {
      const request = store.put(operation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  public generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // Métodos públicos para usar en los componentes
  async createReportOffline(reportData: Partial<Report>): Promise<void> {
    await this.queueOperation({
      type: 'create_report',
      data: reportData,
      maxRetries: 3
    });
  }
  
  async updateReportOffline(reportId: string, updates: Partial<Report>): Promise<void> {
    await this.queueOperation({
      type: 'update_report',
      data: { id: reportId, updates },
      maxRetries: 3
    });
  }
  
  async createReportItemOffline(itemData: Partial<ReportItem>): Promise<void> {
    await this.queueOperation({
      type: 'create_report_item',
      data: itemData,
      maxRetries: 3
    });
  }
  

  
  // Limpiar todas las operaciones pendientes (usar con cuidado)
  async clearPendingOperations(): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction([this.OPERATIONS_STORE], 'readwrite');
    const store = transaction.objectStore(this.OPERATIONS_STORE);
    
    return new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        this.loadPendingOperationsCount();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
}