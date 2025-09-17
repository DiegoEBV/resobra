import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { OfflineSyncService } from './offline-sync.service';
import { Report, ReportItem } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  constructor(
    private supabase: SupabaseService,
    private offlineSync: OfflineSyncService
  ) { }

  // Obtener todos los informes
  getAllReports(): Observable<Report[]> {
    return from(
      this.supabase.client
        .from('reports')
        .select(`
          *,
          project:projects(*)
        `)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            // Error fetching reports
            throw error;
          }
          return data || [];
        })
    );
  }

  // Obtener informes por proyecto
  getReportsByProject(projectId: string): Observable<Report[]> {
    return from(
      this.supabase.client
        .from('reports')
        .select(`
          *,
          project:projects(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            // Error fetching reports by project
            throw error;
          }
          return data || [];
        })
    );
  }

  // Obtener informe por ID con partidas
  getReportById(id: string): Observable<Report | null> {
    return from(
      this.supabase.client
        .from('reports')
        .select(`
          *,
          project:projects(*),
          report_items(
            *,
            item:items(*)
          )
        `)
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            // Error fetching report
            throw error;
          }
          return data;
        })
    );
  }

  // Generar número de informe automático
  generateReportNumber(projectId: string): Observable<string> {
    return from(
      this.supabase.client
        .from('reports')
        .select('report_number')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data, error }) => {
          if (error) {
            // Error generating report number
            throw error;
          }
          
          let nextNumber = 1;
          if (data && data.length > 0) {
            const lastNumber = data[0].report_number;
            const match = lastNumber.match(/(\d+)$/);
            if (match) {
              nextNumber = parseInt(match[1]) + 1;
            }
          }
          
          const currentYear = new Date().getFullYear();
          return `INF-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;
        })
    );
  }

  // Crear nuevo informe
  createReport(report: Omit<Report, 'id' | 'created_at' | 'updated_at'>): Observable<Report> {
    return from(
      this.supabase.client
        .from('reports')
        .insert([report])
        .select(`
          *,
          project:projects(*)
        `)
        .single()
        .then(({ data, error }) => {
          if (error) {
            // Error creating report
            throw error;
          }
          return data;
        })
    ).pipe(
      catchError((error) => {
        // Si hay error de conexión, encolar para sincronización offline
        // Connection error, queuing report for offline sync
        this.offlineSync.createReportOffline(report);
        // Retornar un reporte temporal con ID generado
        const tempReport: Report = {
          ...report,
          id: this.offlineSync.generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Report;
        return of(tempReport);
      })
    );
  }

  // Crear partidas del informe
  createReportItems(reportItems: Omit<ReportItem, 'id' | 'created_at' | 'updated_at'>[]): Observable<ReportItem[]> {
    return from(
      this.supabase.client
        .from('report_items')
        .insert(reportItems)
        .select(`
          *,
          item:items(*)
        `)
        .then(({ data, error }) => {
          if (error) {
            // Error creating report items
            throw error;
          }
          return data || [];
        })
    ).pipe(
      catchError((error) => {
        // Si hay error de conexión, encolar cada item para sincronización offline
        // Connection error, queuing report items for offline sync
        reportItems.forEach(item => {
          this.offlineSync.createReportItemOffline(item);
        });
        // Retornar items temporales con IDs generados
        const tempItems: ReportItem[] = reportItems.map(item => ({
          ...item,
          id: this.offlineSync.generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as ReportItem));
        return of(tempItems);
      })
    );
  }

  // Actualizar informe
  updateReport(id: string, updates: Partial<Report>): Observable<Report> {
    return from(
      this.supabase.client
        .from('reports')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          project:projects(*)
        `)
        .single()
        .then(({ data, error }) => {
          if (error) {
            // Error updating report
            throw error;
          }
          return data;
        })
    ).pipe(
      catchError((error) => {
        // Si hay error de conexión, encolar para sincronización offline
        // Connection error, queuing report update for offline sync
        this.offlineSync.updateReportOffline(id, updates);
        // Retornar el reporte con las actualizaciones aplicadas localmente
        const updatedReport = { ...updates, id, updated_at: new Date().toISOString() } as Report;
        return of(updatedReport);
      })
    );
  }

  // Eliminar informe
  deleteReport(id: string): Observable<void> {
    return from(
      this.supabase.client
        .from('reports')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            // Error deleting report
            throw error;
          }
        })
    );
  }
}