import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { Platform } from '@angular/cdk/platform';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ActividadesService, Frente } from '../../services/actividades.service';

export interface FrenteFormData {
  frente?: Frente;
  mode: 'create' | 'edit';
  initialCoordinates?: { lat: number; lng: number };
}

@Component({
  selector: 'app-frente-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: NativeDateAdapter,
      deps: [MAT_DATE_LOCALE]
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'DD/MM/YYYY',
        },
        display: {
          dateInput: 'DD/MM/YYYY',
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ],
  templateUrl: './frente-form.component.html',
  styleUrl: './frente-form.component.css'
})
export class FrenteFormComponent implements OnInit {
  @Output() frenteCreated = new EventEmitter<Frente>();
  @Output() frenteUpdated = new EventEmitter<Frente>();

  frenteForm: FormGroup;
  loading = false;
  obras: any[] = [];
  isEditMode = false;

  estadosFrente = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
    { value: 'completado', label: 'Completado' }
  ];

  constructor(
    private fb: FormBuilder,
    private actividadesService: ActividadesService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<FrenteFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FrenteFormData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.frenteForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadObras();
    if (this.isEditMode && this.data.frente) {
      this.populateForm(this.data.frente);
    } else if (this.data.initialCoordinates) {
      this.frenteForm.patchValue({
        ubicacion_lat: this.data.initialCoordinates.lat,
        ubicacion_lng: this.data.initialCoordinates.lng
      });
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      obra_id: ['', Validators.required],
      estado: ['activo', Validators.required],
      fecha_inicio: [new Date(), Validators.required],
      fecha_fin_estimada: [''],
      ubicacion_lat: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      ubicacion_lng: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      progreso_general: [0, [Validators.min(0), Validators.max(100)]],
      // Campos kilométricos
      km_inicial: [null, [Validators.min(0)]],
      km_final: [null, [Validators.min(0)]],
      coordenadas_inicio: this.fb.group({
        lat: [null],
        lng: [null]
      }),
      coordenadas_fin: this.fb.group({
        lat: [null],
        lng: [null]
      })
    });
  }

  private populateForm(frente: Frente): void {
    this.frenteForm.patchValue({
      nombre: frente.nombre,
      descripcion: frente.descripcion || '',
      obra_id: frente.obra_id,
      estado: frente.estado,
      fecha_inicio: new Date(frente.fecha_inicio),
      fecha_fin_estimada: frente.fecha_fin_estimada ? new Date(frente.fecha_fin_estimada) : null,
      ubicacion_lat: frente.ubicacion_lat,
      ubicacion_lng: frente.ubicacion_lng,
      progreso_general: frente.progreso_general,
      // Campos kilométricos
      km_inicial: frente.km_inicial,
      km_final: frente.km_final,
      coordenadas_inicio: {
        lat: frente.coordenadas_inicio?.lat || null,
        lng: frente.coordenadas_inicio?.lng || null
      },
      coordenadas_fin: {
        lat: frente.coordenadas_fin?.lat || null,
        lng: frente.coordenadas_fin?.lng || null
      }
    });
  }

  private async loadObras(): Promise<void> {
    try {
      this.obras = await this.actividadesService.getUserObras();
    } catch (error) {
      console.error('Error loading obras:', error);
      this.snackBar.open('Error al cargar las obras', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.frenteForm.valid) {
      this.loading = true;
      try {
        const formValue = this.frenteForm.value;
        
        // Formatear fechas
        const frenteData = {
          ...formValue,
          fecha_inicio: formValue.fecha_inicio.toISOString().split('T')[0],
          fecha_fin_estimada: formValue.fecha_fin_estimada ? 
            formValue.fecha_fin_estimada.toISOString().split('T')[0] : null
        };

        let result: Frente;
        
        if (this.isEditMode && this.data.frente) {
          result = await this.actividadesService.updateFrente(this.data.frente.id, frenteData);
          this.frenteUpdated.emit(result);
          this.snackBar.open('Frente actualizado exitosamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        } else {
          result = await this.actividadesService.createFrente(frenteData);
          this.frenteCreated.emit(result);
          this.snackBar.open('Frente creado exitosamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }

        this.dialogRef.close(result);
      } catch (error) {
        console.error('Error saving frente:', error);
        this.snackBar.open(
          this.isEditMode ? 'Error al actualizar el frente' : 'Error al crear el frente', 
          'Cerrar', 
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      } finally {
        this.loading = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.frenteForm.controls).forEach(key => {
      const control = this.frenteForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Métodos de validación para mostrar errores
  getErrorMessage(fieldName: string): string {
    const control = this.frenteForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} es requerido`;
    }
    if (control?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} debe tener al menos ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} debe ser mayor a ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `${this.getFieldLabel(fieldName)} debe ser menor a ${control.errors?.['max'].max}`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nombre: 'Nombre',
      descripcion: 'Descripción',
      obra_id: 'Obra',
      estado: 'Estado',
      fecha_inicio: 'Fecha de inicio',
      fecha_fin_estimada: 'Fecha fin estimada',
      ubicacion_lat: 'Latitud',
      ubicacion_lng: 'Longitud',
      progreso_general: 'Progreso general',
      km_inicial: 'Kilómetro inicial',
      km_final: 'Kilómetro final'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.frenteForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}