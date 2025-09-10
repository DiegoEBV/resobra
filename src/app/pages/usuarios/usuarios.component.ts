import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule
  ],
  template: `
    <div class="usuarios-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Gestión de Usuarios</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Página de gestión de usuarios en construcción...</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .usuarios-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class UsuariosComponent {
  constructor() {}
}