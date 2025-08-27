import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { SelectedItem } from '../../models/interfaces';

@Component({
  selector: 'app-copy-report-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './copy-report-preview.component.html',
  styleUrls: ['./copy-report-preview.component.scss']
})
export class CopyReportPreviewComponent {
  specialties: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<CopyReportPreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      reportDate: string;
      itemsBySpecialty: { [key: string]: SelectedItem[] };
      totalItems: number;
    }
  ) {
    this.specialties = Object.keys(this.data.itemsBySpecialty);
  }

  onConfirm(): void {
    this.dialogRef.close('confirm');
  }

  onCancel(): void {
    this.dialogRef.close('cancel');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalQuantityBySpecialty(specialty: string): number {
    return this.data.itemsBySpecialty[specialty].reduce(
      (total, item) => total + (item.currentQuantity || 0),
      0
    );
  }
}