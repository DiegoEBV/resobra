import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-nueva-evaluacion',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="nueva-evaluacion-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Nueva Evaluación</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Página de nueva evaluación en construcción...</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .nueva-evaluacion-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
  `]
})
export class NuevaEvaluacionComponent {
  constructor() {}
}