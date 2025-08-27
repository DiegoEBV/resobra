import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ItemsService } from '../../services/items.service';
import { CreateItemDialogComponent } from './create-item-dialog.component';
import { Item, Specialty } from '../../models/interfaces';

@Component({
  selector: 'app-admin-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatToolbarModule
  ],
  templateUrl: './admin-items.component.html',
  styleUrls: ['./admin-items.component.scss']
})
export class AdminItemsComponent implements OnInit {
  items: Item[] = [];
  filteredItems: Item[] = [];
  specialties: string[] = ['Arquitectura', 'Estructura', 'Sanitaria', 'Eléctrica', 'Mecánica', 'Comunicaciones'];
  displayedColumns: string[] = ['codigo', 'descripcion', 'unidad', 'metrado', 'materiales', 'acciones'];
  searchTerm: string = '';
  selectedSpecialty: string = 'all';
  isLoading: boolean = false;
  editingItem: Item | null = null;
  editForm: FormGroup;

  constructor(
    private itemsService: ItemsService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.editForm = this.fb.group({
      codigo: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      unidad: ['', [Validators.required]],
      materiales: [''],
      metrado: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadItems();
  }

  async loadItems(): Promise<void> {
    this.isLoading = true;
    try {
      this.itemsService.getAllItems().subscribe({
        next: (items) => {
          this.items = items;
          this.filterItems();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading items:', error);
          this.showMessage('Error al cargar las partidas', 'error');
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error loading items:', error);
      this.showMessage('Error al cargar las partidas', 'error');
      this.isLoading = false;
    }
  }

  filterItems(): void {
    let filtered = this.items;

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.materials && item.materials.some(m => m.toLowerCase().includes(term)))
      );
    }

    // Filter by specialty
    if (this.selectedSpecialty !== 'all') {
      const specialtyMap: { [key: string]: Specialty } = {
        'Arquitectura': 'arquitectura',
        'Estructura': 'estructura',
        'Sanitaria': 'instalaciones_sanitarias',
        'Eléctrica': 'instalaciones_electricas',
        'Mecánica': 'instalaciones_mecanicas',
        'Comunicaciones': 'comunicaciones'
      };
      const mappedSpecialty = specialtyMap[this.selectedSpecialty];
      if (mappedSpecialty) {
        filtered = filtered.filter(item => item.specialty === mappedSpecialty);
      }
    }

    this.filteredItems = filtered;
  }

  getItemsBySpecialty(specialty: string): Item[] {
    const specialtyMap: { [key: string]: Specialty } = {
      'Arquitectura': 'arquitectura',
      'Estructura': 'estructura',
      'Sanitaria': 'instalaciones_sanitarias',
      'Eléctrica': 'instalaciones_electricas',
      'Mecánica': 'instalaciones_mecanicas',
      'Comunicaciones': 'comunicaciones'
    };
    const mappedSpecialty = specialtyMap[specialty];
    return this.filteredItems.filter(item => item.specialty === mappedSpecialty);
  }

  getFilteredItemsBySpecialty(specialty: string): Item[] {
    return this.getItemsBySpecialty(specialty);
  }

  openCreateDialog(): void {
     const dialogRef = this.dialog.open(CreateItemDialogComponent, {
       width: '500px',
       disableClose: true
     });

     dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          // Map AdminItem format to Item format
          const specialtyMap: { [key: string]: Specialty } = {
            'Arquitectura': 'arquitectura',
            'Estructura': 'estructura',
            'Sanitaria': 'instalaciones_sanitarias',
            'Eléctrica': 'instalaciones_electricas',
            'Mecánica': 'instalaciones_mecanicas',
            'Comunicaciones': 'comunicaciones'
          };
          
          const newItem = {
            name: result.codigo,
            description: result.descripcion,
            unit: result.unidad,
            materials: result.materiales ? [result.materiales] : [],
            specialty: specialtyMap[result.especialidad] || 'arquitectura'
          };
          
          this.itemsService.createItem(newItem).subscribe({
            next: () => {
              this.loadItems();
              this.showMessage('Partida creada exitosamente', 'success');
            },
            error: (error) => {
              console.error('Error creating item:', error);
              this.showMessage('Error al crear la partida', 'error');
            }
          });
        }
      });
   }

  startEdit(item: Item): void {
    this.editingItem = item;
    this.editForm.patchValue({
      codigo: item.name,
      descripcion: item.description || '',
      unidad: item.unit || '',
      materiales: item.materials ? item.materials.join(', ') : '',
      metrado: item.metrado || 0
    });
  }

  cancelEdit(): void {
    this.editingItem = null;
    this.editForm.reset();
  }

  saveEdit(): void {
    if (this.editForm.valid && this.editingItem) {
      // Map form values to Item format
      const formValue = this.editForm.value;
      const updates = {
        name: formValue.codigo,
        description: formValue.descripcion,
        unit: formValue.unidad,
        materials: formValue.materiales ? formValue.materiales.split(',').map((m: string) => m.trim()).filter((m: string) => m) : [],
        metrado: formValue.metrado || 0
      };
      
      this.itemsService.updateItem(this.editingItem.id, updates).subscribe({
        next: () => {
          this.loadItems();
          this.cancelEdit();
          this.showMessage('Partida actualizada exitosamente', 'success');
        },
        error: (error) => {
          console.error('Error updating item:', error);
          this.showMessage('Error al actualizar la partida', 'error');
        }
      });
    }
  }

  deleteItem(item: Item): void {
    const confirmed = this.showConfirmDialog(
      `¿Está seguro de eliminar la partida "${item.name} - ${item.description || ''}"?`,
      'Esta acción no se puede deshacer.'
    );
    
    if (confirmed) {
      this.itemsService.deleteItem(item.id).subscribe({
        next: () => {
          this.loadItems();
          this.showMessage('Partida eliminada exitosamente', 'success');
        },
        error: (error) => {
          console.error('Error deleting item:', error);
          this.showMessage('Error al eliminar la partida', 'error');
        }
      });
    }
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar'
    });
  }

  private showConfirmDialog(title: string, message: string): boolean {
    return confirm(`${title}\n\n${message}`);
  }
}