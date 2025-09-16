import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-exportar',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="exportar-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Exportar Reportes</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Página de exportación de reportes en construcción...</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .exportar-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
  `]
})
export class ExportarComponent {
  constructor() {}
}