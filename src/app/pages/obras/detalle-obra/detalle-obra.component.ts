import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-detalle-obra',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule
  ],
  template: `
    <div class="detalle-obra-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Detalle de Obra</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Página de detalle de obra en construcción...</p>
          <p>ID de obra: {{ obraId }}</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .detalle-obra-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class DetalleObraComponent {
  obraId: string | null = null;

  constructor(private route: ActivatedRoute) {
    this.obraId = this.route.snapshot.paramMap.get('id');
  }
}