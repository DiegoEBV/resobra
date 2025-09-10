import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { ReportsService } from './reports.service';
import { ItemsService } from './items.service';
import { ProjectsService } from './projects.service';
import { Report, Item, ReportItem } from '../models/interfaces';

export interface AutoCompleteData {
  descriptions: string[];
  quantities: number[];
  observations: string[];
}

export interface FavoriteItem {
  item_id: string;
  item: Item;
  usage_count: number;
  last_used: string;
}

export interface QuickReportTemplate {
  project_id: string;
  favorite_items: string[];
  default_quantities: { [item_id: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class ProductivityService {
  private readonly STORAGE_KEYS = {
    AUTOCOMPLETE: 'bitepoint_autocomplete_data',
    FAVORITES: 'bitepoint_favorite_items',
    QUICK_TEMPLATES: 'bitepoint_quick_templates',
    LAST_BACKUP: 'bitepoint_last_backup'
  };

  constructor(
    private supabase: SupabaseService,
    private reportsService: ReportsService,
    private itemsService: ItemsService,
    private projectsService: ProjectsService
  ) {
    this.initializeAutoBackup();
  }

  // ============ AUTO-COMPLETADO INTELIGENTE ============

  // Obtener datos de auto-completado
  getAutoCompleteData(): AutoCompleteData {
    const stored = localStorage.getItem(this.STORAGE_KEYS.AUTOCOMPLETE);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      descriptions: [],
      quantities: [],
      observations: []
    };
  }

  // Actualizar datos de auto-completado
  updateAutoCompleteData(data: { itemId: string; projectId: string; quantity: number; description: string }): Promise<void> {
    return new Promise((resolve) => {
      // Actualizar descripciones
      this.updateAutoCompleteField('descriptions', data.description);
      
      // Actualizar cantidades
      this.updateAutoCompleteField('quantities', data.quantity.toString());
      
      resolve();
    });
  }

  // Método auxiliar para actualizar campos específicos
  private updateAutoCompleteField(field: 'descriptions' | 'quantities' | 'observations', value: string | number): void {
    const data = this.getAutoCompleteData();
    
    if (field === 'quantities' && typeof value === 'number') {
      if (!data.quantities.includes(value)) {
        data.quantities.push(value);
        data.quantities.sort((a, b) => b - a); // Ordenar descendente
        data.quantities = data.quantities.slice(0, 10); // Mantener solo los 10 más recientes
      }
    } else if (typeof value === 'string' && value.trim()) {
      const arrayKey = field as 'descriptions' | 'observations';
      if (!data[arrayKey].includes(value)) {
        data[arrayKey].unshift(value);
        data[arrayKey] = data[arrayKey].slice(0, 20); // Mantener solo los 20 más recientes
      }
    }

    localStorage.setItem(this.STORAGE_KEYS.AUTOCOMPLETE, JSON.stringify(data));
  }

  // Buscar sugerencias de auto-completado
  getAutoCompleteSuggestions(type: 'descriptions' | 'observations', query: string): string[] {
    const data = this.getAutoCompleteData();
    const items = data[type];
    
    if (!query.trim()) {
      return items.slice(0, 5);
    }

    return items
      .filter(item => item.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  }

  // ============ FAVORITOS DE PARTIDAS ============

  // Obtener partidas favoritas
  getFavoriteItems(): Observable<FavoriteItem[]> {
    const stored = localStorage.getItem(this.STORAGE_KEYS.FAVORITES);
    if (!stored) {
      return of([]);
    }

    const favorites: FavoriteItem[] = JSON.parse(stored);
    const itemIds = favorites.map(f => f.item_id);

    if (itemIds.length === 0) {
      return of([]);
    }

    return this.itemsService.getAllItems().pipe(
      map(allItems => {
        const favoriteItems = favorites
          .map(fav => {
            const item = allItems.find(i => i.id === fav.item_id);
            return item ? { ...fav, item } : null;
          })
          .filter(fav => fav !== null) as FavoriteItem[];
        
        return favoriteItems.sort((a: FavoriteItem, b: FavoriteItem) => b.usage_count - a.usage_count);
      }),
      catchError(() => of([]))
    );
  }

  // Marcar partida como usada (incrementa contador de favoritos)
  markItemAsUsed(itemId: string): void {
    const stored = localStorage.getItem(this.STORAGE_KEYS.FAVORITES);
    let favorites: FavoriteItem[] = stored ? JSON.parse(stored) : [];

    const existingIndex = favorites.findIndex(f => f.item_id === itemId);
    
    if (existingIndex >= 0) {
      favorites[existingIndex].usage_count++;
      favorites[existingIndex].last_used = new Date().toISOString();
    } else {
      // Obtener información del item para crear el favorito
      this.itemsService.getItemById(itemId).subscribe(item => {
        if (item) {
          favorites.push({
            item_id: itemId,
            item: item,
            usage_count: 1,
            last_used: new Date().toISOString()
          });
          localStorage.setItem(this.STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
        }
      });
      return;
    }

    localStorage.setItem(this.STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }

  // ============ COPIAR REPORTE ANTERIOR ============

  // Obtener el último reporte de un proyecto
  getLastReport(projectId: string): Observable<Report | null> {
    return this.reportsService.getReportsByProject(projectId).pipe(
      map(reports => reports.length > 0 ? reports[0] : null),
      catchError(() => of(null))
    );
  }

  // Copiar reporte anterior con nuevas cantidades
  async copyPreviousReport(reportId: string): Promise<{ items: any[]; project: any }> {
    try {
      // Obtener el reporte original con sus ítems incluidos
      const originalReport = await this.reportsService.getReportById(reportId).toPromise();
      if (!originalReport) {
        throw new Error('Reporte no encontrado');
      }

      // Los ítems ya vienen incluidos en el reporte
      const reportItems = (originalReport as any).report_items || [];
      
      // Obtener información del proyecto
      const project = await this.projectsService.getProjectById(originalReport.project_id).toPromise();

      return {
        items: reportItems,
        project: project
      };
    } catch (error) {
      console.error('Error copiando reporte anterior:', error);
      throw error;
    }
  }

  // ============ REPORTE RÁPIDO ============

  // Obtener plantilla de reporte rápido para un proyecto
  getQuickReportTemplate(projectId: string): QuickReportTemplate | null {
    const stored = localStorage.getItem(this.STORAGE_KEYS.QUICK_TEMPLATES);
    if (!stored) return null;

    const templates: { [projectId: string]: QuickReportTemplate } = JSON.parse(stored);
    return templates[projectId] || null;
  }

  // Obtener todas las plantillas de reporte rápido
  getQuickReportTemplates(): QuickReportTemplate[] {
    const stored = localStorage.getItem(this.STORAGE_KEYS.QUICK_TEMPLATES);
    if (!stored) return [];

    const templates: { [projectId: string]: QuickReportTemplate } = JSON.parse(stored);
    return Object.values(templates);
  }

  // Guardar plantilla de reporte rápido
  saveQuickReportTemplate(templateData: { name: string; projectId: string; items: any[] }): void {
    const stored = localStorage.getItem(this.STORAGE_KEYS.QUICK_TEMPLATES);
    const templates: { [projectId: string]: QuickReportTemplate } = stored ? JSON.parse(stored) : {};

    const favoriteItems = templateData.items.map(item => item.item?.id).filter(id => id);
    const defaultQuantities: { [itemId: string]: number } = {};
    
    templateData.items.forEach(item => {
      if (item.item?.id && item.currentQuantity) {
        defaultQuantities[item.item.id] = item.currentQuantity;
      }
    });

    templates[templateData.projectId] = {
      project_id: templateData.projectId,
      favorite_items: favoriteItems,
      default_quantities: defaultQuantities
    };

    localStorage.setItem(this.STORAGE_KEYS.QUICK_TEMPLATES, JSON.stringify(templates));
  }

  // Crear reporte rápido desde plantilla específica
  async createQuickReportFromTemplate(templateId: string, projectId: string): Promise<{ items: any[] }> {
    try {
      const template = this.getQuickReportTemplate(projectId);
      if (!template) {
        throw new Error('Plantilla no encontrada');
      }

      const allItems = await this.itemsService.getAllItems().toPromise() || [];
      const templateItems = template.favorite_items
        .map(itemId => allItems.find(item => item.id === itemId))
        .filter(item => item !== undefined);

      const items = templateItems.map(item => ({
        item: item,
        currentQuantity: template.default_quantities[item!.id] || 1,
        previousQuantity: 0
      }));

      return { items };
    } catch (error) {
      console.error('Error creando reporte desde plantilla:', error);
      throw error;
    }
  }

  // Crear reporte rápido usando plantilla
  createQuickReport(projectId: string): Observable<{ report: Omit<Report, 'id' | 'created_at' | 'updated_at'>, items: Item[] }> {
    const template = this.getQuickReportTemplate(projectId);
    
    if (!template) {
      // Si no hay plantilla, usar los favoritos generales
      return this.getFavoriteItems().pipe(
        map(favorites => {
          const topFavorites = favorites.slice(0, 5);
          return this.generateQuickReportData(projectId, topFavorites.map(f => f.item));
        })
      );
    }

    return this.itemsService.getAllItems().pipe(
      map(allItems => {
        const templateItems = template.favorite_items
          .map(itemId => allItems.find(item => item.id === itemId))
          .filter(item => item !== undefined) as Item[];
        
        return this.generateQuickReportData(projectId, templateItems);
      })
    );
  }

  private generateQuickReportData(projectId: string, items: Item[]): { report: Omit<Report, 'id' | 'created_at' | 'updated_at'>, items: Item[] } {
    const today = new Date();
    const reportNumber = `INF-${today.getFullYear()}-${(Math.floor(Math.random() * 900) + 100).toString()}`;

    const report: Omit<Report, 'id' | 'created_at' | 'updated_at'> = {
      project_id: projectId,
      report_number: reportNumber,
      report_date: today.toISOString().split('T')[0],
      period_start: undefined,
      period_end: undefined,
      status: 'draft'
    };

    return { report, items };
  }

  // ============ BACKUP AUTOMÁTICO ============

  // Método público para realizar backup manual
  performBackup(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.performAutoBackup();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Método público para inicializar backup automático
  initializeAutoBackup(): Promise<void> {
    return new Promise((resolve) => {
      this.initializeAutoBackupInternal();
      resolve();
    });
  }

  // Inicializar backup automático (método interno)
  private initializeAutoBackupInternal(): void {
    // DESHABILITADO: Timer de backup automático para resolver NavigatorLockAcquireTimeoutError
    console.log('Backup automático deshabilitado para resolver problemas de concurrencia con NavigatorLockManager');
    console.log('Use performBackup() manualmente cuando sea necesario');
    
    // Verificar si es necesario hacer backup (cada 24 horas)
    const lastBackup = localStorage.getItem(this.STORAGE_KEYS.LAST_BACKUP);
    const now = new Date().getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (!lastBackup || (now - parseInt(lastBackup)) > oneDayMs) {
      // Solo hacer backup inicial, sin timer
      this.performAutoBackup();
    }

    // DESHABILITADO: Programar próximo backup
    // setInterval(() => {
    //   this.performAutoBackup();
    // }, oneDayMs);
  }

  // Realizar backup automático
  private performAutoBackup(): void {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        autocomplete: this.getAutoCompleteData(),
        favorites: localStorage.getItem(this.STORAGE_KEYS.FAVORITES),
        templates: localStorage.getItem(this.STORAGE_KEYS.QUICK_TEMPLATES)
      };

      // Guardar backup en localStorage con timestamp
      const backupKey = `bitepoint_backup_${new Date().toISOString().split('T')[0]}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));

      // Limpiar backups antiguos (mantener solo los últimos 7 días)
      this.cleanOldBackups();

      // Actualizar timestamp del último backup
      localStorage.setItem(this.STORAGE_KEYS.LAST_BACKUP, new Date().getTime().toString());

      console.log('Backup automático completado:', new Date().toISOString());
    } catch (error) {
      console.error('Error en backup automático:', error);
    }
  }

  // Limpiar backups antiguos
  private cleanOldBackups(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

    Object.keys(localStorage)
      .filter(key => key.startsWith('bitepoint_backup_'))
      .forEach(key => {
        const dateStr = key.replace('bitepoint_backup_', '');
        if (dateStr < cutoffDate) {
          localStorage.removeItem(key);
        }
      });
  }

  // Restaurar desde backup
  restoreFromBackup(backupDate: string): boolean {
    try {
      const backupKey = `bitepoint_backup_${backupDate}`;
      const backupData = localStorage.getItem(backupKey);
      
      if (!backupData) {
        return false;
      }

      const backup = JSON.parse(backupData);
      
      // Restaurar datos
      if (backup.autocomplete) {
        localStorage.setItem(this.STORAGE_KEYS.AUTOCOMPLETE, JSON.stringify(backup.autocomplete));
      }
      if (backup.favorites) {
        localStorage.setItem(this.STORAGE_KEYS.FAVORITES, backup.favorites);
      }
      if (backup.templates) {
        localStorage.setItem(this.STORAGE_KEYS.QUICK_TEMPLATES, backup.templates);
      }

      console.log('Backup restaurado exitosamente:', backupDate);
      return true;
    } catch (error) {
      console.error('Error restaurando backup:', error);
      return false;
    }
  }

  // Obtener lista de backups disponibles
  getAvailableBackups(): string[] {
    return Object.keys(localStorage)
      .filter(key => key.startsWith('bitepoint_backup_'))
      .map(key => key.replace('bitepoint_backup_', ''))
      .sort()
      .reverse();
  }
}