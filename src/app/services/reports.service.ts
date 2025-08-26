import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Report, ReportItem } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  constructor(private supabase: SupabaseService) { }

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
            console.error('Error fetching reports:', error);
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
            console.error('Error fetching reports by project:', error);
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
            console.error('Error fetching report:', error);
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
            console.error('Error generating report number:', error);
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
            console.error('Error creating report:', error);
            throw error;
          }
          return data;
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
            console.error('Error creating report items:', error);
            throw error;
          }
          return data || [];
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
            console.error('Error updating report:', error);
            throw error;
          }
          return data;
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
            console.error('Error deleting report:', error);
            throw error;
          }
        })
    );
  }
}