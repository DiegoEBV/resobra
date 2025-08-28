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
import { CopyReportPreviewComponent } from '../../components/copy-report-preview/copy-report-preview.component';
import { QuickReportSelectorComponent } from '../../components/quick-report-selector/quick-report-selector.component';
import { ExcelImportDialogComponent } from '../../components/excel-import-dialog/excel-import-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';
import { ItemsService } from '../../services/items.service';
import { ProductivityService } from '../../services/productivity.service';
import { Item, SelectedItem, Specialty, ProcessedPartida } from '../../models/interfaces';
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
        MatTooltipModule,
        ExcelImportDialogComponent
    ],
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {
  searchTerm = '';
  searchResults: Item[] = [];
  selectedItems: SelectedItem[] = [];
  favoriteItems: Item[] = [];
  isLoading = false;
  showGroupedView = false;
  showFavorites = false;
  groupedItems: { [key in Specialty]: Item[] } = {
    'arquitectura': [],
    'estructura': [],
    'instalaciones_sanitarias': [],
    'instalaciones_electricas': [],
    'instalaciones_mecanicas': [],
    'comunicaciones': []
  };
  selectedSpecialty: Specialty | null = null;
  selectedSpecialtyGrouped: Specialty | null = null;
  specialties: Specialty[] = [];
  showExcelImportDialog = false;
  allItems: Item[] = [];
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private itemsService: ItemsService,
    private productivityService: ProductivityService,
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
    
    // Cargar partidas favoritas
    this.loadFavoriteItems();
    
    // Cargar vista agrupada por defecto
    this.loadGroupedItems();
    
    // Cargar todos los ítems para el diálogo de importación Excel
    this.loadAllItems();
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

  filterBySpecialtyGrouped(specialty: Specialty | null) {
    this.selectedSpecialtyGrouped = specialty;
  }

  getFilteredSpecialties(): Specialty[] {
    if (this.selectedSpecialtyGrouped === null) {
      return this.specialties;
    }
    return [this.selectedSpecialtyGrouped];
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
      previousQuantity: 0,
      metrado: item.metrado || 0
    };

    this.selectedItems.push(selectedItem);
    this.saveSelectedItems();
    
    // Marcar como usado para favoritos
    this.productivityService.markItemAsUsed(item.id!);
    
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



  getSaldo(selectedItem: SelectedItem): number {
    const metrado = selectedItem.metrado || 0;
    const acumulado = (selectedItem.previousQuantity || 0) + (selectedItem.currentQuantity || 0);
    return metrado - acumulado;
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

  // Métodos para favoritos
  loadFavoriteItems() {
    this.productivityService.getFavoriteItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (favorites) => {
          this.favoriteItems = favorites.map(fav => fav.item);
        },
        error: (error) => {
          console.error('Error loading favorite items:', error);
          this.favoriteItems = [];
        }
      });
  }

  toggleFavorites() {
    this.showFavorites = !this.showFavorites;
  }

  isFavorite(item: Item): boolean {
    return this.favoriteItems.some(fav => fav.id === item.id);
  }

  // ============ FUNCIONES DE PRODUCTIVIDAD ============

  // Copiar reporte anterior
  async copyPreviousReport() {
    try {
      // Obtener el último reporte del proyecto actual (usando un ID de proyecto por defecto)
      const projectId = 'default-project'; // En una implementación real, esto vendría del contexto
      const lastReport = await this.productivityService.getLastReport(projectId).toPromise();
      
      if (!lastReport) {
        this.snackBar.open('No se encontró un reporte anterior para copiar', 'Cerrar', { duration: 3000 });
        return;
      }

      // Copiar todas las partidas del reporte anterior
      const copiedData = await this.productivityService.copyPreviousReport(lastReport.id!);
      
      // Convertir los items del reporte a SelectedItems y organizarlos por especialidad
      const copiedItems: SelectedItem[] = copiedData.items.map((reportItem: any) => ({
        item: reportItem.item,
        currentQuantity: reportItem.current_quantity || 0, // Mantener la cantidad original
        previousQuantity: reportItem.previous_quantity || 0
      }));

      // Organizar por especialidad
      const itemsBySpecialty = this.groupItemsBySpecialty(copiedItems);
      
      // Mostrar modal de confirmación con preview
      const dialogRef = this.dialog.open(CopyReportPreviewComponent, {
        width: '800px',
        maxHeight: '80vh',
        data: {
          reportDate: lastReport.created_at,
          itemsBySpecialty: itemsBySpecialty,
          totalItems: copiedItems.length
        }
      });

      const result = await dialogRef.afterClosed().toPromise();
      
      if (result === 'confirm') {
        // Agregar las partidas copiadas a las seleccionadas
        this.selectedItems = [...this.selectedItems, ...copiedItems];
        this.saveSelectedItems();
        
        this.snackBar.open(`Se copiaron ${copiedItems.length} partidas del reporte anterior`, 'Cerrar', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error copiando reporte anterior:', error);
      this.snackBar.open('Error al copiar el reporte anterior', 'Cerrar', { duration: 3000 });
    }
  }

  // Función auxiliar para agrupar items por especialidad
  private groupItemsBySpecialty(items: SelectedItem[]): { [key: string]: SelectedItem[] } {
    return items.reduce((groups, item) => {
      const specialty = item.item.specialty || 'Sin Especialidad';
      if (!groups[specialty]) {
        groups[specialty] = [];
      }
      groups[specialty].push(item);
      return groups;
    }, {} as { [key: string]: SelectedItem[] });
  }

  // Crear reporte rápido
  async createQuickReport() {
    try {
      const projectId = 'default-project'; // En una implementación real, esto vendría del contexto
      
      // Obtener partidas favoritas organizadas por especialidad
      const favoriteItems = await this.productivityService.getFavoriteItems().toPromise() || [];
      
      if (favoriteItems.length === 0) {
        this.snackBar.open('No tienes partidas favoritas. Usa algunas partidas primero.', 'Cerrar', { duration: 3000 });
        return;
      }

      // Organizar favoritas por especialidad
      const favoritesBySpecialty = this.groupFavoritesBySpecialty(favoriteItems);
      
      // Mostrar modal de selección rápida
      const dialogRef = this.dialog.open(QuickReportSelectorComponent, {
        width: '900px',
        maxHeight: '80vh',
        data: {
          favoritesBySpecialty: favoritesBySpecialty,
          totalFavorites: favoriteItems.length
        }
      });

      const result = await dialogRef.afterClosed().toPromise();
      
      if (result && result.selectedItems) {
        // Convertir a SelectedItems con cantidades por defecto
        const quickItems: SelectedItem[] = result.selectedItems.map((fav: any) => ({
          item: fav.item,
          currentQuantity: 1, // Cantidad por defecto
          previousQuantity: 0
        }));

        // Agregar las partidas del reporte rápido
        this.selectedItems = [...this.selectedItems, ...quickItems];
        this.saveSelectedItems();
        
        this.snackBar.open(`Reporte rápido creado con ${quickItems.length} partidas favoritas`, 'Cerrar', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error creando reporte rápido:', error);
      this.snackBar.open('Error al crear el reporte rápido', 'Cerrar', { duration: 3000 });
    }
  }

  // Función auxiliar para agrupar favoritas por especialidad
  private groupFavoritesBySpecialty(favorites: any[]): { [key: string]: any[] } {
    return favorites.reduce((groups, fav) => {
      const specialty = fav.item.specialty || 'Sin Especialidad';
      if (!groups[specialty]) {
        groups[specialty] = [];
      }
      groups[specialty].push(fav);
      return groups;
    }, {} as { [key: string]: any[] });
  }

  // Guardar plantilla
  saveTemplate() {
    if (this.selectedItems.length === 0) {
      this.snackBar.open('No hay partidas seleccionadas para guardar como plantilla', 'Cerrar', { duration: 3000 });
      return;
    }

    try {
      const projectId = 'default-project'; // En una implementación real, esto vendría del contexto
      
      this.productivityService.saveQuickReportTemplate({
        name: `Plantilla ${new Date().toLocaleDateString()}`,
        projectId: projectId,
        items: this.selectedItems
      });
      
      this.snackBar.open('Plantilla guardada exitosamente', 'Cerrar', { duration: 3000 });
    } catch (error) {
      console.error('Error guardando plantilla:', error);
      this.snackBar.open('Error al guardar la plantilla', 'Cerrar', { duration: 3000 });
    }
  }

  // Realizar backup manual
  async performManualBackup() {
    try {
      await this.productivityService.performBackup();
      this.snackBar.open('Backup realizado exitosamente', 'Cerrar', { duration: 3000 });
    } catch (error) {
      console.error('Error realizando backup:', error);
      this.snackBar.open('Error al realizar el backup', 'Cerrar', { duration: 3000 });
    }
  }

  // ============ FUNCIONES DE IMPORTACIÓN EXCEL ============

  loadAllItems() {
    this.itemsService.getAllItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.allItems = items;
        },
        error: (error) => {
          console.error('Error loading all items:', error);
          this.snackBar.open('Error al cargar partidas', 'Cerrar', { duration: 3000 });
        }
      });
  }

  openExcelImportDialog() {
    this.showExcelImportDialog = true;
  }

  closeExcelImportDialog() {
    this.showExcelImportDialog = false;
  }

  onExcelImportComplete(processedPartidas: ProcessedPartida[]): void {
    if (processedPartidas && processedPartidas.length > 0) {
      // Convertir ProcessedPartida a SelectedItem para las partidas con coincidencias
      const newSelectedItems: SelectedItem[] = processedPartidas
        .filter(partida => partida.matchedItem && partida.selected)
        .map(partida => ({
          item: partida.matchedItem!,
          // Mantener el metrado original de la partida (no importar desde Excel)
          metrado: partida.matchedItem!.metrado || 0,
          // Solo importar los metrados anterior y actual desde Excel
          previousQuantity: partida.excelRow.metradoAnterior || 0,
          currentQuantity: partida.excelRow.metradoActual || 0
        }));
      
      // Filtrar partidas que ya están seleccionadas
      const itemsToAdd = newSelectedItems.filter(imported => 
        !this.selectedItems.some(selected => selected.item.id === imported.item.id)
      );
      
      if (itemsToAdd.length > 0) {
        this.selectedItems.push(...itemsToAdd);
        this.saveSelectedItems();
        
        // Mostrar mensaje de éxito
        console.log(`Se importaron ${itemsToAdd.length} partidas desde Excel`);
      } else {
        console.log('Todas las partidas del Excel ya estaban seleccionadas');
      }
    }
    
    this.closeExcelImportDialog();
  }
}
