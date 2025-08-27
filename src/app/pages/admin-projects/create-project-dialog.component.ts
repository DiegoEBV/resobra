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
import { Project } from '../../models/interfaces';

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
      <mat-icon>add_circle</mat-icon>
      Crear Nueva Obra
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="projectForm" class="project-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre del Proyecto</mat-label>
          <input matInput formControlName="name" placeholder="Ej: Edificio Residencial Los Pinos">
          <mat-error *ngIf="projectForm.get('name')?.hasError('required')">
            El nombre del proyecto es requerido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ubicación</mat-label>
          <input matInput formControlName="location" placeholder="Ej: Av. Principal 123, Ciudad">
          <mat-error *ngIf="projectForm.get('location')?.hasError('required')">
            La ubicación es requerida
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Contratista</mat-label>
          <input matInput formControlName="contractor" placeholder="Ej: Constructora ABC S.A.">
          <mat-error *ngIf="projectForm.get('contractor')?.hasError('required')">
            El contratista es requerido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Supervisor</mat-label>
          <input matInput formControlName="supervisor" placeholder="Ej: Ing. Juan Pérez">
          <mat-error *ngIf="projectForm.get('supervisor')?.hasError('required')">
            El supervisor es requerido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Fecha de Inicio</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="start_date">
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-error *ngIf="projectForm.get('start_date')?.hasError('required')">
            La fecha de inicio es requerida
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción (Opcional)</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Descripción del proyecto..."></textarea>
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
        Crear Obra
      </button>
    </mat-dialog-actions>
  `
})
export class CreateProjectDialogComponent {
  projectForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required]],
      location: ['', [Validators.required]],
      contractor: ['', [Validators.required]],
      supervisor: ['', [Validators.required]],
      start_date: ['', [Validators.required]],
      description: ['']
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (this.projectForm.valid) {
      const formValue = this.projectForm.value;
      const newProject: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
        name: formValue.name,
        location: formValue.location,
        contractor: formValue.contractor,
        supervisor: formValue.supervisor,
        start_date: formValue.start_date
      };
      this.dialogRef.close(newProject);
    }
  }
}