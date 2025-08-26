import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { SelectedItem, Specialty } from '../../models/interfaces';

@Component({
  selector: 'app-edit-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './edit-item-dialog.component.html',
  styleUrl: './edit-item-dialog.component.scss'
})
export class EditItemDialogComponent {
  editedItem: SelectedItem;
  
  specialties = [
    { value: 'arquitectura', label: 'Arquitectura' },
    { value: 'estructura', label: 'Estructura' },
    { value: 'instalaciones_sanitarias', label: 'Instalaciones Sanitarias' },
    { value: 'instalaciones_electricas', label: 'Instalaciones Eléctricas' },
    { value: 'instalaciones_mecanicas', label: 'Instalaciones Mecánicas' },
    { value: 'comunicaciones', label: 'Comunicaciones' }
  ];

  constructor(
    public dialogRef: MatDialogRef<EditItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SelectedItem
  ) {
    // Crear una copia profunda del item para editar
    this.editedItem = {
      item: { ...data.item },
      currentQuantity: data.currentQuantity,
      previousQuantity: data.previousQuantity
    };
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.editedItem);
  }

  getSpecialtyDisplayName(specialty: string): string {
    const specialtyObj = this.specialties.find(s => s.value === specialty);
    return specialtyObj ? specialtyObj.label : specialty;
  }
}