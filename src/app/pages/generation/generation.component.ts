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
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
        MatChipsModule,
        MatSelectModule,
        MatOptionModule
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
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private reportsService: ReportsService,
    private exportService: ExportService
  ) {}
  
  async ngOnInit(): Promise<void> {
    await this.loadDataFromStorage();
    // generateReportPreview() se llama desde loadDataFromStorage() cuando es necesario
    // Para el flujo normal (nuevo informe), se llama aquí
    if (this.selectedProject && this.selectedItems.length) {
      this.generateReportPreview();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private async loadDataFromStorage(): Promise<void> {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const editingReport = localStorage.getItem('editingReport');
      const storedItems = localStorage.getItem('selectedItems');
      const storedProject = localStorage.getItem('selectedProject');
      
      console.log('🔍 Datos en localStorage:');
      console.log('editingReport raw:', editingReport);
      console.log('selectedItems raw:', storedItems);
      console.log('selectedProject raw:', storedProject);
      
      // Si estamos visualizando un informe existente
      if (editingReport) {
        try {
          const report = JSON.parse(editingReport);
          console.log('📋 Cargando informe existente:', report);
          
          // Cargar el informe completo con sus partidas desde el servicio
           this.reportsService.getReportById(report.id).subscribe({
             next: (fullReport: any) => {
               if (fullReport) {
                 console.log('✅ Informe completo cargado:', fullReport);
                 
                 // Establecer el proyecto
                 this.selectedProject = fullReport.project || null;
                 
                 // Mapear las partidas del informe a selectedItems
                 const reportItems = fullReport.report_items || [];
                 this.selectedItems = reportItems.map((reportItem: any) => ({
                   item: reportItem.item,
                   currentQuantity: reportItem.current_quantity || 0,
                   previousQuantity: reportItem.previous_quantity || 0
                 }));
                 
                 console.log('✅ Proyecto cargado:', this.selectedProject);
                 console.log('✅ Partidas cargadas:', this.selectedItems);
                 
                 // Generar la vista previa con los datos cargados
                 this.generateReportPreview(fullReport);
                 
                 // Limpiar editingReport del localStorage
                 localStorage.removeItem('editingReport');
               } else {
                 throw new Error('No se pudo cargar el informe');
               }
             },
            error: (error) => {
              console.error('❌ Error cargando informe:', error);
              this.snackBar.open('Error al cargar el informe', 'Cerrar', {
                duration: 3000
              });
              this.router.navigate(['/configuration']);
            }
          });
          
          return; // Salir temprano para el flujo de informe existente
        } catch (error) {
          console.error('❌ Error parseando editingReport:', error);
          localStorage.removeItem('editingReport');
        }
      }
      
      // Flujo normal para crear nuevo informe
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
    
    // Validar que tenemos los datos necesarios (solo para flujo de nuevo informe)
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
  
  private generateReportPreview(existingReport?: any): void {
    if (!this.selectedProject || !this.selectedItems.length) return;
    
    // Usar datos del informe existente si están disponibles, sino generar nuevos
    const reportDate = existingReport?.report_date ? new Date(existingReport.report_date) : new Date();
    const reportNumber = existingReport?.report_number || this.generateReportNumber();
    
    // Mapear las partidas con las propiedades correctas para el HTML
    const mappedPartidas = this.selectedItems.map(selectedItem => ({
      codigo: selectedItem.item?.name || '',
      descripcion: selectedItem.item?.description || '',
      unidad: selectedItem.item?.unit || '',
      anterior: selectedItem.previousQuantity || 0,
      actual: selectedItem.currentQuantity || 0,
      acumulado: (selectedItem.previousQuantity || 0) + (selectedItem.currentQuantity || 0)
    }));
    
    console.log('🔍 Partidas mapeadas para mostrar:', mappedPartidas);
    
    this.reportData = {
      numero: reportNumber,
      fecha: reportDate,
      proyecto: this.selectedProject,
      partidas: mappedPartidas,
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
      const anterior = item.previousQuantity || 0;
      const actual = item.currentQuantity || 0;
      
      totals.totalAnterior += anterior;
      totals.totalActual += actual;
      totals.totalAcumulado += anterior + actual;
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
