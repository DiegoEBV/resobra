import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';

import { ReportsService } from '../../services/reports.service';
import { ExportService } from '../../services/export.service';
import { Report, Project, SelectedItem } from '../../models/interfaces';

@Component({
    selector: 'app-generation',
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatDividerModule,
        MatChipsModule
    ],
    templateUrl: './generation.component.html',
    styleUrls: ['./generation.component.scss']
})
export class GenerationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  selectedItems: SelectedItem[] = [];
  selectedProject: Project | null = null;
  reportData: any = null;
  isGenerating = false;
  isExporting = false;
  
  displayedColumns: string[] = ['codigo', 'descripcion', 'unidad', 'anterior', 'actual', 'acumulado'];
  
  constructor(
    private router: Router,
    private reportsService: ReportsService,
    private exportService: ExportService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadDataFromStorage();
    this.generateReportPreview();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private loadDataFromStorage(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const storedItems = localStorage.getItem('selectedItems');
      const storedProject = localStorage.getItem('selectedProject');
      
      console.log('🔍 Datos en localStorage:');
      console.log('selectedItems raw:', storedItems);
      console.log('selectedProject raw:', storedProject);
      
      if (storedItems) {
        this.selectedItems = JSON.parse(storedItems);
        console.log('✅ selectedItems parseados:', this.selectedItems);
        console.log('📊 Cantidad de partidas:', this.selectedItems.length);
      }
      
      if (storedProject) {
        this.selectedProject = JSON.parse(storedProject);
        console.log('✅ selectedProject parseado:', this.selectedProject);
      }
    }
    
    // Validar que tenemos los datos necesarios
    if (!this.selectedItems.length || !this.selectedProject) {
      console.error('❌ Faltan datos para generar el informe');
      console.log('selectedItems.length:', this.selectedItems.length);
      console.log('selectedProject:', this.selectedProject);
      this.snackBar.open('No hay datos para generar el informe', 'Cerrar', {
        duration: 3000
      });
      this.router.navigate(['/']);
    }
  }
  
  private generateReportPreview(): void {
    if (!this.selectedProject || !this.selectedItems.length) return;
    
    const reportDate = new Date();
    const reportNumber = this.generateReportNumber();
    
    this.reportData = {
      numero: reportNumber,
      fecha: reportDate,
      proyecto: this.selectedProject,
      partidas: this.selectedItems,
      totales: this.calculateTotals()
    };
  }
  
  private generateReportNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = String(date.getHours()).padStart(2, '0') + String(date.getMinutes()).padStart(2, '0');
    
    return `INF-${year}${month}${day}-${time}`;
  }
  
  private calculateTotals(): any {
    const totals = {
      totalAnterior: 0,
      totalActual: 0,
      totalAcumulado: 0,
      cantidadPartidas: this.selectedItems.length
    };
    
    this.selectedItems.forEach(item => {
      totals.totalAnterior += item.previousQuantity || 0;
      totals.totalActual += item.currentQuantity || 0;
      totals.totalAcumulado += (item.previousQuantity || 0) + (item.currentQuantity || 0);
    });
    
    return totals;
  }
  
  async saveReport(): Promise<void> {
    if (!this.reportData || this.isGenerating) return;
    
    this.isGenerating = true;
    
    try {
      const reportToSave = {
        project_id: this.selectedProject!.id,
        report_number: this.reportData.numero,
        report_date: this.reportData.fecha,
        status: 'draft'
      };
      
      const savedReport = await this.reportsService.createReport(reportToSave);
      
      this.snackBar.open('Informe guardado exitosamente', 'Cerrar', {
        duration: 3000
      });
      
      // Limpiar localStorage
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem('selectedItems');
        localStorage.removeItem('selectedProject');
      }
      
      // Navegar de vuelta al inicio
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);
      
    } catch (error) {
      console.error('Error al guardar informe:', error);
      this.snackBar.open('Error al guardar el informe', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.isGenerating = false;
    }
  }
  
  private mapSelectedItemsForExport(): any[] {
    console.log('🔄 Mapeando partidas para exportación...');
    console.log('selectedItems antes del mapeo:', this.selectedItems);
    
    const mappedItems = this.selectedItems.map(selectedItem => {
      console.log('📝 Procesando partida:', selectedItem);
      const mapped = {
        ...selectedItem.item,
        current_quantity: selectedItem.currentQuantity || 0,
        previous_quantity: selectedItem.previousQuantity || 0,
        accumulated_quantity: (selectedItem.previousQuantity || 0) + (selectedItem.currentQuantity || 0)
      };
      console.log('✅ Partida mapeada:', mapped);
      return mapped;
    });
    
    console.log('🎯 Resultado final del mapeo:', mappedItems);
    return mappedItems;
  }

  private mapReportDataForExport(): any {
    return {
      id: '', // No necesario para exportación
      project_id: this.selectedProject?.id || '',
      report_number: this.reportData.numero,
      report_date: this.reportData.fecha,
      period_start: undefined,
      period_end: undefined,
      status: 'draft',
      project: this.selectedProject
    };
  }

  async exportToPDF(): Promise<void> {
    if (!this.reportData || this.isExporting) return;
    
    this.isExporting = true;
    
    try {
      console.log('📄 Iniciando exportación a PDF...');
      const mappedItems = this.mapSelectedItemsForExport();
      const mappedReport = this.mapReportDataForExport();
      
      console.log('📊 Datos enviados al export service:');
      console.log('mappedReport:', mappedReport);
      console.log('mappedItems:', mappedItems);
      
      await this.exportService.exportToPDF(mappedReport, mappedItems);
      this.snackBar.open('PDF exportado exitosamente', 'Cerrar', {
        duration: 3000
      });
    } catch (error) {
      console.error('❌ Error al exportar PDF:', error);
      this.snackBar.open('Error al exportar PDF', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.isExporting = false;
    }
  }
  
  async exportToWord(): Promise<void> {
    if (!this.reportData || this.isExporting) return;
    
    this.isExporting = true;
    
    try {
      console.log('📝 Iniciando exportación a Word...');
      const mappedItems = this.mapSelectedItemsForExport();
      const mappedReport = this.mapReportDataForExport();
      
      console.log('📊 Datos enviados al export service:');
      console.log('mappedReport:', mappedReport);
      console.log('mappedItems:', mappedItems);
      
      await this.exportService.exportToWord(mappedReport, mappedItems);
      this.snackBar.open('Documento Word exportado exitosamente', 'Cerrar', {
        duration: 3000
      });
    } catch (error) {
      console.error('❌ Error al exportar Word:', error);
      this.snackBar.open('Error al exportar documento Word', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.isExporting = false;
    }
  }
  
  goBack(): void {
    this.router.navigate(['/configuration']);
  }
  
  goHome(): void {
    this.router.navigate(['/']);
  }
}
