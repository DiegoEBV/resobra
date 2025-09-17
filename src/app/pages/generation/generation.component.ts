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
import { ProductivityService } from '../../services/productivity.service';
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
  
  // Nuevas propiedades para funcionalidades de productividad
  showQuickReportOptions = false;
  quickReportTemplates: any[] = [];
  canCopyPreviousReport = false;
  lastReport: any = null;
  selectedTemplate: string = '';
  

  
  displayedColumns: string[] = ['codigo', 'descripcion', 'unidad', 'anterior', 'actual', 'acumulado'];
  
  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private reportsService: ReportsService,
    private exportService: ExportService,
    private productivityService: ProductivityService
  ) {}
  
  async ngOnInit(): Promise<void> {
    await this.loadDataFromStorage();
    // generateReportPreview() se llama desde loadDataFromStorage() cuando es necesario
    // Para el flujo normal (nuevo informe), se llama aquí
    if (this.selectedProject && this.selectedItems.length) {
      this.generateReportPreview();
    }
    
    // Inicializar funcionalidades de productividad
    await this.initializeProductivityFeatures();
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
      
      // Datos en localStorage
      
      // Si estamos visualizando un informe existente
      if (editingReport) {
        try {
          const report = JSON.parse(editingReport);
          // Cargando informe existente
          
          // Cargar el informe completo con sus partidas desde el servicio
           this.reportsService.getReportById(report.id).subscribe({
             next: (fullReport: any) => {
               if (fullReport) {
                 // Informe completo cargado
                 
                 // Establecer el proyecto
                 this.selectedProject = fullReport.project || null;
                 
                 // Mapear las partidas del informe a selectedItems
                 const reportItems = fullReport.report_items || [];
                 this.selectedItems = reportItems.map((reportItem: any) => ({
                   item: reportItem.item,
                   currentQuantity: reportItem.current_quantity || 0,
                   previousQuantity: reportItem.previous_quantity || 0
                 }));
                 
                 // Proyecto y partidas cargadas
                 
                 // Generar la vista previa con los datos cargados
                 this.generateReportPreview(fullReport);
                 
                 // Limpiar editingReport del localStorage
                 localStorage.removeItem('editingReport');
               } else {
                 throw new Error('No se pudo cargar el informe');
               }
             },
            error: (error) => {
              // Error cargando informe
              this.snackBar.open('Error al cargar el informe', 'Cerrar', {
                duration: 3000
              });
              this.router.navigate(['/configuration']);
            }
          });
          
          return; // Salir temprano para el flujo de informe existente
        } catch (error) {
          // Error parseando editingReport
          localStorage.removeItem('editingReport');
        }
      }
      
      // Flujo normal para crear nuevo informe
      if (storedItems) {
        this.selectedItems = JSON.parse(storedItems);
        // selectedItems parseados
      }
      
      if (storedProject) {
        this.selectedProject = JSON.parse(storedProject);
        // selectedProject parseado
      }
    }
    
    // Validar que tenemos los datos necesarios (solo para flujo de nuevo informe)
    if (!this.selectedItems.length || !this.selectedProject) {
      // Faltan datos para generar el informe
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
    
    // Partidas mapeadas para mostrar
    
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
  

  
  private mapSelectedItemsForExport(): any[] {
    // Mapeando partidas para exportación
    
    const mappedItems = this.selectedItems.map(selectedItem => {
      const mapped = {
        ...selectedItem.item,
        current_quantity: selectedItem.currentQuantity || 0,
        previous_quantity: selectedItem.previousQuantity || 0,
        accumulated_quantity: (selectedItem.previousQuantity || 0) + (selectedItem.currentQuantity || 0)
      };
      return mapped;
    });
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
      // Iniciando exportación a PDF
      const mappedItems = this.mapSelectedItemsForExport();
      const mappedReport = this.mapReportDataForExport();
      
      await this.exportService.exportToPDF(mappedReport, mappedItems);
      this.snackBar.open('PDF exportado exitosamente', 'Cerrar', {
        duration: 3000
      });
    } catch (error) {
      // Error al exportar PDF
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
      // Iniciando exportación a Word
      const mappedItems = this.mapSelectedItemsForExport();
      const mappedReport = this.mapReportDataForExport();
      
      await this.exportService.exportToWord(mappedReport, mappedItems);
      this.snackBar.open('Documento Word exportado exitosamente', 'Cerrar', {
        duration: 3000
      });
    } catch (error) {
      // Error al exportar Word
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
  
  // ===== NUEVAS FUNCIONALIDADES DE PRODUCTIVIDAD =====
  
  private async initializeProductivityFeatures(): Promise<void> {
    try {
      // Cargar plantillas de reporte rápido
      this.quickReportTemplates = await this.productivityService.getQuickReportTemplates();
      
      // Verificar si hay un reporte anterior para copiar
      if (this.selectedProject) {
        this.lastReport = await this.productivityService.getLastReport(this.selectedProject.id);
        this.canCopyPreviousReport = !!this.lastReport;
      }
      
      // Inicializar backup automático
      await this.productivityService.initializeAutoBackup();
    } catch (error) {
      // Error inicializando funcionalidades de productividad
    }
  }
  
  // Funcionalidad: Copiar reporte anterior
  async copyPreviousReport(): Promise<void> {
    if (!this.lastReport || !this.selectedProject) {
      this.snackBar.open('No hay reporte anterior disponible', 'Cerrar', { duration: 3000 });
      return;
    }
    
    try {
      const copiedData = await this.productivityService.copyPreviousReport(this.lastReport.id);
      
      // Actualizar los datos del componente
      this.selectedItems = copiedData.items.map((item: any) => ({
        item: item.item,
        currentQuantity: 0, // Las cantidades actuales se resetean
        previousQuantity: item.current_quantity // La cantidad actual se convierte en anterior
      }));
      
      this.selectedProject = copiedData.project;
      
      // Regenerar la vista previa
      this.generateReportPreview();
      
      this.snackBar.open('Reporte anterior copiado exitosamente', 'Cerrar', { duration: 3000 });
    } catch (error) {
      // Error copiando reporte anterior
      this.snackBar.open('Error al copiar reporte anterior', 'Cerrar', { duration: 3000 });
    }
  }
  
  // Funcionalidad: Reporte rápido
  toggleQuickReportOptions(): void {
    this.showQuickReportOptions = !this.showQuickReportOptions;
  }
  
  async createQuickReport(templateId?: string): Promise<void> {
    if (!this.selectedProject) {
      this.snackBar.open('Seleccione un proyecto primero', 'Cerrar', { duration: 3000 });
      return;
    }
    
    try {
      let reportData;
      
      if (templateId) {
        // Usar plantilla existente
        reportData = await this.productivityService.createQuickReportFromTemplate(templateId, this.selectedProject.id);
      } else {
        // Crear reporte rápido con partidas favoritas
        this.productivityService.getFavoriteItems().subscribe({
          next: (favoriteItems) => {
            if (favoriteItems.length === 0) {
              this.snackBar.open('No hay partidas favoritas disponibles', 'Cerrar', { duration: 3000 });
              return;
            }
            
            // Tomar las primeras 5 partidas favoritas
            const topFavorites = favoriteItems.slice(0, 5);
            
            this.selectedItems = topFavorites.map((fav: any) => ({
              item: fav.item,
              currentQuantity: fav.suggestedQuantity || 1,
              previousQuantity: 0
            }));
            
            // Regenerar vista previa
            this.generateReportPreview();
            
            this.snackBar.open('Reporte rápido creado con partidas favoritas', 'Cerrar', { duration: 3000 });
          },
          error: (error) => {
            // Error obteniendo partidas favoritas
            this.snackBar.open('Error al obtener partidas favoritas', 'Cerrar', { duration: 3000 });
          }
        });
        return;
      }
      
      // Si se usó una plantilla, actualizar los datos
      if (reportData) {
        this.selectedItems = reportData.items;
        this.generateReportPreview();
        this.snackBar.open('Reporte rápido creado desde plantilla', 'Cerrar', { duration: 3000 });
      }
      
    } catch (error) {
      // Error creando reporte rápido
      this.snackBar.open('Error al crear reporte rápido', 'Cerrar', { duration: 3000 });
    } finally {
      this.showQuickReportOptions = false;
    }
  }
  
  // Funcionalidad: Guardar como plantilla de reporte rápido
  async saveAsQuickTemplate(): Promise<void> {
    if (!this.selectedItems.length || !this.selectedProject) {
      this.snackBar.open('No hay datos para guardar como plantilla', 'Cerrar', { duration: 3000 });
      return;
    }
    
    try {
      const templateName = `Plantilla ${this.selectedProject.name} - ${new Date().toLocaleDateString()}`;
      
      await this.productivityService.saveQuickReportTemplate({
        name: templateName,
        projectId: this.selectedProject.id,
        items: this.selectedItems
      });
      
      // Recargar plantillas
      this.quickReportTemplates = await this.productivityService.getQuickReportTemplates();
      
      this.snackBar.open('Plantilla guardada exitosamente', 'Cerrar', { duration: 3000 });
    } catch (error) {
      // Error guardando plantilla
      this.snackBar.open('Error al guardar plantilla', 'Cerrar', { duration: 3000 });
    }
  }
  
  // Método para realizar backup manual
  async performManualBackup(): Promise<void> {
    try {
      await this.productivityService.performBackup();
      this.snackBar.open('Backup realizado exitosamente', 'Cerrar', { duration: 3000 });
    } catch (error) {
      // Error al realizar backup
      this.snackBar.open('Error al realizar el backup. Inténtelo nuevamente.', 'Cerrar', { duration: 3000 });
    }
  }
  
  // Funcionalidad: Actualizar datos de auto-completado
  private async updateAutoCompleteData(): Promise<void> {
    if (!this.selectedItems.length || !this.selectedProject) return;
    
    try {
      // Actualizar datos de auto-completado con las cantidades usadas
      for (const item of this.selectedItems) {
        if (item.currentQuantity && item.currentQuantity > 0) {
          await this.productivityService.updateAutoCompleteData({
            itemId: item.item?.id || '',
            projectId: this.selectedProject.id,
            quantity: item.currentQuantity,
            description: item.item?.description || ''
          });
        }
      }
    } catch (error) {
      // Error actualizando datos de auto-completado
    }
  }
  
  // Override del método saveReport para incluir funcionalidades de productividad
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
      
      // Actualizar datos de auto-completado y favoritos
      await this.updateAutoCompleteData();
      
      // Marcar cada item como usado individualmente
      for (const selectedItem of this.selectedItems) {
        if (selectedItem.item?.id) {
          this.productivityService.markItemAsUsed(selectedItem.item.id);
        }
      }
      
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
      // Error al guardar informe
      this.snackBar.open('Error al guardar el informe', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.isGenerating = false;
    }
  }

}
