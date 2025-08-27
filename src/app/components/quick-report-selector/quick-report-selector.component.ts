import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'app-quick-report-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule
  ],
  templateUrl: './quick-report-selector.component.html',
  styleUrls: ['./quick-report-selector.component.scss']
})
export class QuickReportSelectorComponent {
  specialties: string[] = [];
  selection = new SelectionModel<any>(true, []);
  expandedSpecialties = new Set<string>();

  constructor(
    public dialogRef: MatDialogRef<QuickReportSelectorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      favoritesBySpecialty: { [key: string]: any[] };
      totalFavorites: number;
    }
  ) {
    this.specialties = Object.keys(this.data.favoritesBySpecialty);
    // Expandir la primera especialidad por defecto
    if (this.specialties.length > 0) {
      this.expandedSpecialties.add(this.specialties[0]);
    }
  }

  // Alternar expansión de especialidad
  toggleSpecialty(specialty: string): void {
    if (this.expandedSpecialties.has(specialty)) {
      this.expandedSpecialties.delete(specialty);
    } else {
      this.expandedSpecialties.add(specialty);
    }
  }

  // Verificar si una especialidad está expandida
  isSpecialtyExpanded(specialty: string): boolean {
    return this.expandedSpecialties.has(specialty);
  }

  // Seleccionar/deseleccionar todas las partidas de una especialidad
  toggleSpecialtySelection(specialty: string): void {
    const items = this.data.favoritesBySpecialty[specialty];
    const allSelected = items.every(item => this.selection.isSelected(item));
    
    if (allSelected) {
      // Deseleccionar todas
      items.forEach(item => this.selection.deselect(item));
    } else {
      // Seleccionar todas
      items.forEach(item => this.selection.select(item));
    }
  }

  // Verificar si todas las partidas de una especialidad están seleccionadas
  isSpecialtyFullySelected(specialty: string): boolean {
    const items = this.data.favoritesBySpecialty[specialty];
    return items.length > 0 && items.every(item => this.selection.isSelected(item));
  }

  // Verificar si algunas partidas de una especialidad están seleccionadas
  isSpecialtyPartiallySelected(specialty: string): boolean {
    const items = this.data.favoritesBySpecialty[specialty];
    return items.some(item => this.selection.isSelected(item)) && !this.isSpecialtyFullySelected(specialty);
  }

  // Seleccionar partidas más usadas (top 5 por especialidad)
  selectTopUsed(): void {
    this.selection.clear();
    
    this.specialties.forEach(specialty => {
      const items = this.data.favoritesBySpecialty[specialty]
        .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
        .slice(0, 5);
      
      items.forEach(item => this.selection.select(item));
    });
  }

  // Seleccionar todas las partidas
  selectAll(): void {
    this.specialties.forEach(specialty => {
      this.data.favoritesBySpecialty[specialty].forEach(item => {
        this.selection.select(item);
      });
    });
  }

  // Limpiar selección
  clearSelection(): void {
    this.selection.clear();
  }

  // Confirmar selección
  onConfirm(): void {
    if (this.selection.selected.length === 0) {
      return;
    }
    
    this.dialogRef.close({
      selectedItems: this.selection.selected
    });
  }

  // Cancelar
  onCancel(): void {
    this.dialogRef.close();
  }

  // Obtener el número de partidas seleccionadas por especialidad
  getSelectedCountBySpecialty(specialty: string): number {
    return this.data.favoritesBySpecialty[specialty]
      .filter(item => this.selection.isSelected(item)).length;
  }

  // Formatear fecha de último uso
  formatLastUsed(dateString: string): string {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
    return date.toLocaleDateString('es-ES');
  }
}