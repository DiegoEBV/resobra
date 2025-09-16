import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="text-orange-500 mr-2">warning</mat-icon>
      {{ data.title }}
    </h2>
    
    <mat-dialog-content class="py-4">
      <p class="text-gray-700">{{ data.message }}</p>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end" class="gap-2">
      <button 
        mat-button 
        (click)="onCancel()"
        class="text-gray-600">
        {{ data.cancelText || 'Cancelar' }}
      </button>
      <button 
        mat-raised-button 
        color="warn"
        (click)="onConfirm()"
        class="ml-2">
        {{ data.confirmText || 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 300px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}