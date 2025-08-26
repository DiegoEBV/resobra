import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddItemModalComponent } from '../../components/add-item-modal/add-item-modal.component';
import { EditItemDialogComponent } from '../../components/edit-item-dialog/edit-item-dialog.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';
import { ItemsService } from '../../services/items.service';
import { Item, SelectedItem, Specialty } from '../../models/interfaces';
import { Router } from '@angular/router';

@Component({
    selector: 'app-main',
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatListModule,
        MatChipsModule,
        MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
    ],
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {
  searchTerm = '';
  searchResults: Item[] = [];
  selectedItems: SelectedItem[] = [];
  isLoading = false;
  showGroupedView = false;
  groupedItems: { [key in Specialty]: Item[] } = {
    'arquitectura': [],
    'estructura': [],
    'instalaciones_sanitarias': [],
    'instalaciones_electricas': [],
    'instalaciones_mecanicas': [],
    'comunicaciones': []
  };
  selectedSpecialty: Specialty | null = null;
  specialties: Specialty[] = [];
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private itemsService: ItemsService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Configurar búsqueda con debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          if (term.trim().length < 2) {
            return of([]);
          }
          this.isLoading = true;
          return this.itemsService.searchItems(term, this.selectedSpecialty || undefined);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (results) => {
          this.searchResults = results;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error searching items:', error);
          this.isLoading = false;
          this.snackBar.open('Error al buscar partidas', 'Cerrar', { duration: 3000 });
        }
      });

    // Cargar especialidades
    this.specialties = this.itemsService.getSpecialties();
    
    // Cargar partidas seleccionadas del localStorage si existen
    this.loadSelectedItems();
    
    // Cargar vista agrupada por defecto
    this.loadGroupedItems();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  toggleView() {
    this.showGroupedView = !this.showGroupedView;
    if (this.showGroupedView) {
      this.loadGroupedItems();
    }
    // Limpiar búsqueda al cambiar vista
    this.searchTerm = '';
    this.searchResults = [];
  }

  loadGroupedItems() {
    this.isLoading = true;
    this.itemsService.getItemsBySpecialty()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (grouped) => {
          this.groupedItems = grouped;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading grouped items:', error);
          this.isLoading = false;
          this.snackBar.open('Error al cargar partidas', 'Cerrar', { duration: 3000 });
        }
      });
  }

  filterBySpecialty(specialty: Specialty | null) {
    this.selectedSpecialty = specialty;
    if (this.searchTerm.length >= 2) {
      this.onSearchChange();
    }
  }

  getSpecialtyDisplayName(specialty: Specialty): string {
    return this.itemsService.getSpecialtyDisplayName(specialty);
  }

  getSpecialtyItemCount(specialty: Specialty): number {
    return this.groupedItems[specialty]?.length || 0;
  }

  openAddItemModal(): void {
    const dialogRef = this.dialog.open(AddItemModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the items after adding a new one
        this.loadGroupedItems();
        this.snackBar.open('Partida agregada exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  selectItem(item: Item) {
    // Verificar si ya está seleccionada
    const exists = this.selectedItems.find(selected => selected.item.id === item.id);
    if (exists) {
      this.snackBar.open('Esta partida ya está seleccionada', 'Cerrar', { duration: 2000 });
      return;
    }

    // Agregar a la lista de seleccionadas
    const selectedItem: SelectedItem = {
      item: item,
      currentQuantity: 0,
      previousQuantity: 0
    };

    this.selectedItems.push(selectedItem);
    this.saveSelectedItems();
    this.snackBar.open('Partida agregada', 'Cerrar', { duration: 2000 });

    // Limpiar búsqueda
    this.searchTerm = '';
    this.searchResults = [];
  }

  removeSelectedItem(index: number) {
    this.selectedItems.splice(index, 1);
    this.saveSelectedItems();
    this.snackBar.open('Partida eliminada', 'Cerrar', { duration: 2000 });
  }

  editSelectedItem(index: number) {
    const itemToEdit = this.selectedItems[index];
    
    const dialogRef = this.dialog.open(EditItemDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      data: { ...itemToEdit } // Pasar una copia del item
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateSelectedItem(index, result);
      }
    });
  }

  updateSelectedItem(index: number, updatedItem: SelectedItem) {
    this.selectedItems[index] = updatedItem;
    this.saveSelectedItems();
    this.snackBar.open('Partida actualizada exitosamente', 'Cerrar', { duration: 3000 });
  }

  updateQuantity(index: number, field: 'currentQuantity' | 'previousQuantity', value: number) {
    this.selectedItems[index][field] = value;
    this.saveSelectedItems();
  }

  clearAllItems() {
    this.selectedItems = [];
    this.saveSelectedItems();
    this.snackBar.open('Todas las partidas eliminadas', 'Cerrar', { duration: 2000 });
  }

  proceedToConfiguration() {
    if (this.selectedItems.length === 0) {
      this.snackBar.open('Debe seleccionar al menos una partida', 'Cerrar', { duration: 3000 });
      return;
    }

    // Validar que todas las partidas tengan cantidades válidas
    const hasInvalidQuantities = this.selectedItems.some(item => 
      item.currentQuantity < 0 || item.previousQuantity < 0
    );

    if (hasInvalidQuantities) {
      this.snackBar.open('Las cantidades no pueden ser negativas', 'Cerrar', { duration: 3000 });
      return;
    }

    this.router.navigate(['/configuration']);
  }

  private saveSelectedItems() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('selectedItems', JSON.stringify(this.selectedItems));
    }
  }

  private loadSelectedItems() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('selectedItems');
      if (saved) {
        try {
          this.selectedItems = JSON.parse(saved);
        } catch (error) {
          console.error('Error loading selected items:', error);
          this.selectedItems = [];
        }
      }
    }
  }
}
