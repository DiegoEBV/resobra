import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Obra } from '../../interfaces/database.interface';

@Component({
  selector: 'app-create-project-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  styleUrls: ['./create-project-dialog.component.scss'],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ isEditMode ? 'edit' : 'add_circle' }}</mat-icon>
      {{ isEditMode ? 'Editar Obra' : 'Crear Nueva Obra' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="projectForm" class="project-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre de la Obra</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej: Edificio Residencial Los Pinos" maxlength="1000">
          <mat-hint align="end">{{projectForm.get('nombre')?.value?.length || 0}}/1000</mat-hint>
          <mat-error *ngIf="projectForm.get('nombre')?.hasError('required')">
            El nombre de la obra es requerido
          </mat-error>
          <mat-error *ngIf="projectForm.get('nombre')?.hasError('maxlength')">
            El nombre no puede exceder los 1000 caracteres
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ubicación</mat-label>
          <input matInput formControlName="ubicacion" placeholder="Ej: Av. Principal 123, Ciudad" maxlength="300">
          <mat-hint align="end">{{projectForm.get('ubicacion')?.value?.length || 0}}/300</mat-hint>
          <mat-error *ngIf="projectForm.get('ubicacion')?.hasError('required')">
            La ubicación es requerida
          </mat-error>
          <mat-error *ngIf="projectForm.get('ubicacion')?.hasError('maxlength')">
            La ubicación no puede exceder los 300 caracteres
          </mat-error>
        </mat-form-field>



        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Fecha de Inicio</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="fecha_inicio">
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-error *ngIf="projectForm.get('fecha_inicio')?.hasError('required')">
            La fecha de inicio es requerida
          </mat-error>
        </mat-form-field>



        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Fecha de Finalización Estimada (Opcional)</mat-label>
          <input matInput [matDatepicker]="endPicker" formControlName="fecha_fin_estimada">
          <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción (Opcional)</mat-label>
          <textarea matInput formControlName="descripcion" rows="3" placeholder="Descripción de la obra..."></textarea>
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
              [disabled]="!projectForm.valid">
        <mat-icon>save</mat-icon>
        {{ isEditMode ? 'Actualizar Obra' : 'Crear Obra' }}
      </button>
    </mat-dialog-actions>
  `
})
export class CreateProjectDialogComponent {
  projectForm: FormGroup;
  isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditMode = this.data?.mode === 'edit';
    
    this.projectForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(1000)]],
      ubicacion: ['', [Validators.required, Validators.maxLength(300)]],
      fecha_inicio: ['', [Validators.required]],
      fecha_fin_estimada: [null],
      descripcion: ['']
    });

    // Si estamos en modo edición, pre-llenar el formulario
    if (this.isEditMode && this.data?.obra) {
      this.populateForm(this.data.obra);
    }
  }

  private populateForm(obra: Obra): void {
    this.projectForm.patchValue({
      nombre: obra.nombre || '',
      ubicacion: obra.ubicacion || '',
      fecha_inicio: obra.fecha_inicio ? new Date(obra.fecha_inicio) : '',
      fecha_fin_estimada: obra.fecha_fin_estimada ? new Date(obra.fecha_fin_estimada) : null,
      descripcion: obra.descripcion || ''
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (this.projectForm.valid) {
      const formValue = this.projectForm.value;
      // Formatear fechas para Supabase
      const formatDate = (date: any) => {
        if (!date) return null;
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        return date;
      };

      const newObra: Omit<Obra, 'id' | 'created_at' | 'updated_at'> = {
        nombre: formValue.nombre,
        ubicacion: formValue.ubicacion,
        fecha_inicio: formatDate(formValue.fecha_inicio),
        estado: 'planificacion',
        descripcion: formValue.descripcion || undefined,
        fecha_fin_estimada: formatDate(formValue.fecha_fin_estimada)
      };
      
      // Si estamos en modo edición, incluir el ID de la obra
      if (this.isEditMode && this.data?.obra?.id) {
        (newObra as any).id = this.data.obra.id;
      }
      
      this.dialogRef.close({ data: newObra, mode: this.isEditMode ? 'edit' : 'create' });
    }
  }
}