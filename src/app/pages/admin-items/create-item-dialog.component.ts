import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Item } from '../../models/interfaces';

@Component({
  selector: 'app-create-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>add_circle</mat-icon>
      Crear Nueva Partida
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="itemForm" class="item-form">
        <mat-form-field appearance="outline">
          <mat-label>Código</mat-label>
          <input matInput formControlName="codigo" placeholder="Ej: ARQ-001">
          <mat-error *ngIf="itemForm.get('codigo')?.hasError('required')">
            El código es requerido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Descripción</mat-label>
          <textarea matInput 
                    formControlName="descripcion" 
                    rows="3"
                    placeholder="Descripción detallada de la partida">
          </textarea>
          <mat-error *ngIf="itemForm.get('descripcion')?.hasError('required')">
            La descripción es requerida
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Unidad</mat-label>
          <input matInput formControlName="unidad" placeholder="Ej: m², ml, und">
          <mat-error *ngIf="itemForm.get('unidad')?.hasError('required')">
            La unidad es requerida
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Especialidad</mat-label>
          <mat-select formControlName="especialidad">
            <mat-option value="Arquitectura">Arquitectura</mat-option>
            <mat-option value="Estructura">Estructura</mat-option>
            <mat-option value="Sanitaria">Sanitaria</mat-option>
            <mat-option value="Eléctrica">Eléctrica</mat-option>
            <mat-option value="Mecánica">Mecánica</mat-option>
            <mat-option value="Comunicaciones">Comunicaciones</mat-option>
          </mat-select>
          <mat-error *ngIf="itemForm.get('especialidad')?.hasError('required')">
            La especialidad es requerida
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Materiales</mat-label>
          <textarea matInput 
                    formControlName="materiales" 
                    rows="2"
                    placeholder="Materiales necesarios (opcional)">
          </textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        <mat-icon>cancel</mat-icon>
        Cancelar
      </button>
      <button mat-raised-button 
              color="primary" 
              (click)="onCreate()"
              [disabled]="!itemForm.valid">
        <mat-icon>save</mat-icon>
        Crear Partida
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .item-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      padding: 16px 0;
    }
    
    mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
    }
    
    mat-dialog-content {
      max-height: 60vh;
      overflow-y: auto;
    }
    
    mat-dialog-actions {
      padding: 16px 0;
      gap: 8px;
    }
    
    mat-dialog-actions button {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    @media (max-width: 480px) {
      .item-form {
        min-width: 300px;
      }
    }
  `]
})
export class CreateItemDialogComponent {
  itemForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.itemForm = this.fb.group({
      codigo: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      unidad: ['', [Validators.required]],
      especialidad: ['', [Validators.required]],
      materiales: ['']
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (this.itemForm.valid) {
      const formValue = this.itemForm.value;
      const newItem: Partial<Item> = {
        name: formValue.codigo,
        description: formValue.descripcion,
        unit: formValue.unidad,
        specialty: formValue.especialidad,
        materials: formValue.materiales ? formValue.materiales.split(',').map((m: string) => m.trim()).filter((m: string) => m) : []
      };
      this.dialogRef.close(newItem);
    }
  }
}