import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  @Input() accept: string = '.xlsx,.xls';
  @Input() maxSize: number = 5 * 1024 * 1024; // 5MB
  @Input() disabled: boolean = false;
  @Output() fileSelected = new EventEmitter<File>();
  @Output() error = new EventEmitter<string>();

  isDragOver = false;
  isProcessing = false;

  constructor() { }

  onDragOver(event: DragEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    if (this.disabled) return;
    
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    // Validar tipo de archivo
    if (!this.isValidFileType(file)) {
      this.error.emit('Tipo de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls).');
      return;
    }

    // Validar tamaño
    if (file.size > this.maxSize) {
      const maxSizeMB = Math.round(this.maxSize / (1024 * 1024));
      this.error.emit(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB.`);
      return;
    }

    // Emitir archivo válido
    this.fileSelected.emit(file);
  }

  private isValidFileType(file: File): boolean {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => fileName.endsWith(ext));
  }

  triggerFileInput(): void {
    if (this.disabled) return;
    
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput?.click();
  }

  getFileSizeText(): string {
    const maxSizeMB = Math.round(this.maxSize / (1024 * 1024));
    return `Máximo ${maxSizeMB}MB`;
  }
}