import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ItemsService } from '../../services/items.service';
import { Item, Specialty } from '../../models/interfaces';

@Component({
  selector: 'app-add-item-modal',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './add-item-modal.component.html',
  styleUrl: './add-item-modal.component.scss'
})
export class AddItemModalComponent {
  itemForm: FormGroup;
  specialties: Specialty[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddItemModalComponent>,
    private itemsService: ItemsService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.specialties = this.itemsService.getSpecialties();
    
    this.itemForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      unit: ['', Validators.required],
      materials: [''],
      specialty: ['', Validators.required]
    });
  }

  getSpecialtyDisplayName(specialty: Specialty): string {
    return this.itemsService.getSpecialtyDisplayName(specialty);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.itemForm.valid) {
      this.isLoading = true;
      const newItem = this.itemForm.value;
      
      this.itemsService.createItem(newItem).subscribe({
        next: (createdItem) => {
          this.isLoading = false;
          this.snackBar.open('Partida creada exitosamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(createdItem);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error creating item:', error);
          this.snackBar.open('Error al crear la partida', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.itemForm.controls).forEach(key => {
      const control = this.itemForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.itemForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} es requerido`;
    }
    if (control?.hasError('minlength')) {
      return `${this.getFieldDisplayName(fieldName)} debe tener al menos 3 caracteres`;
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'name': 'Nombre',
      'description': 'Descripción',
      'unit': 'Unidad',
      'materials': 'Materiales',
      'specialty': 'Especialidad'
    };
    return displayNames[fieldName] || fieldName;
  }
}
