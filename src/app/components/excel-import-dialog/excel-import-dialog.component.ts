import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { ExcelPreviewComponent } from '../excel-preview/excel-preview.component';
import { ExcelProcessorService } from '../../services/excel-processor.service';
import { PartidaMatcherService } from '../../services/partida-matcher.service';
import { Item, ProcessedPartida, ImportResult } from '../../models/interfaces';

@Component({
  selector: 'app-excel-import-dialog',
  standalone: true,
  imports: [CommonModule, FileUploadComponent, ExcelPreviewComponent],
  templateUrl: './excel-import-dialog.component.html',
  styleUrls: ['./excel-import-dialog.component.css']
})
export class ExcelImportDialogComponent {
  @Input() isOpen = false;
  @Input() availableItems: Item[] = [];
  @Output() closeDialog = new EventEmitter<void>();
  @Output() importCompleted = new EventEmitter<ProcessedPartida[]>();

  currentStep: 'upload' | 'preview' = 'upload';
  isProcessing = false;
  processedPartidas: ProcessedPartida[] = [];
  processingError: string | null = null;

  constructor(
    private excelProcessor: ExcelProcessorService,
    private partidaMatcher: PartidaMatcherService
  ) {}

  onFileSelected(file: File): void {
    this.processExcelFile(file);
  }

  onFileError(error: string): void {
    this.processingError = error;
  }

  private async processExcelFile(file: File): Promise<void> {
    this.isProcessing = true;
    this.processingError = null;

    try {
      // Validar archivo
      const validation = await this.excelProcessor.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Procesar archivo
      const excelData = await this.excelProcessor.processFile(file);

      // Inicializar matcher con items disponibles
      this.partidaMatcher.initializeItems(this.availableItems);

      // Procesar partidas
      this.processedPartidas = this.partidaMatcher.processExcelRows(excelData);

      // Cambiar a vista previa
      this.currentStep = 'preview';
    } catch (error) {
      this.processingError = error instanceof Error ? error.message : 'Error desconocido al procesar el archivo';
    } finally {
      this.isProcessing = false;
    }
  }

  onPreviewCancel(): void {
    this.resetDialog();
  }

  onPreviewConfirm(confirmedPartidas: ProcessedPartida[]): void {
    this.importCompleted.emit(confirmedPartidas);
    this.resetDialog();
    this.closeDialog.emit();
  }

  onClose(): void {
    this.resetDialog();
    this.closeDialog.emit();
  }

  private resetDialog(): void {
    this.currentStep = 'upload';
    this.isProcessing = false;
    this.processedPartidas = [];
    this.processingError = null;
  }

  downloadTemplate(): void {
    this.excelProcessor.downloadTemplate();
  }

  get dialogTitle(): string {
    switch (this.currentStep) {
      case 'upload':
        return 'Importar Excel - Cargar Archivo';
      case 'preview':
        return 'Importar Excel - Vista Previa';
      default:
        return 'Importar Excel';
    }
  }

  get canGoBack(): boolean {
    return this.currentStep === 'preview' && !this.isProcessing;
  }

  goBack(): void {
    if (this.canGoBack) {
      this.currentStep = 'upload';
      this.processedPartidas = [];
      this.processingError = null;
    }
  }
}