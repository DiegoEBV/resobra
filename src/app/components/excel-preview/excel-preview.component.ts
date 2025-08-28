import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProcessedPartida, Item, SuggestionItem } from '../../models/interfaces';
import { PartidaMatcherService } from '../../services/partida-matcher.service';

@Component({
  selector: 'app-excel-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './excel-preview.component.html',
  styleUrls: ['./excel-preview.component.css']
})
export class ExcelPreviewComponent {
  @Input() processedPartidas: ProcessedPartida[] = [];
  @Input() availableItems: Item[] = [];
  @Output() partidaUpdated = new EventEmitter<{index: number, partida: ProcessedPartida}>();
  @Output() importConfirmed = new EventEmitter<ProcessedPartida[]>();
  @Output() cancelled = new EventEmitter<void>();

  searchQuery: string = '';
  selectedPartidaIndex: number = -1;
  showSuggestions: boolean = false;
  filteredSuggestions: Item[] = [];

  constructor(private partidaMatcherService: PartidaMatcherService) { }

  get stats() {
    return this.partidaMatcherService.getProcessingStats(this.processedPartidas);
  }

  get validPartidas(): ProcessedPartida[] {
    return this.processedPartidas.filter(p => p.matchedItem !== null && p.selected);
  }

  getMatchTypeClass(matchType: string): string {
    switch (matchType) {
      case 'exact': return 'match-exact';
      case 'partial': return 'match-partial';
      case 'not_found': return 'match-not-found';
      default: return '';
    }
  }

  getMatchTypeText(matchType: string): string {
    switch (matchType) {
      case 'exact': return 'Coincidencia exacta';
      case 'partial': return 'Coincidencia parcial';
      case 'not_found': return 'No encontrada';
      default: return 'Desconocido';
    }
  }

  getConfidenceText(confidence: number | undefined): string {
    if (confidence === undefined || confidence === null) {
      return '0%';
    }
    return `${Math.round(confidence * 100)}%`;
  }

  selectSuggestion(partidaIndex: number, item: Item): void {
    const updatedPartida = this.partidaMatcherService.updateMatch(
      this.processedPartidas[partidaIndex], 
      item
    );
    
    this.processedPartidas[partidaIndex] = updatedPartida;
    this.partidaUpdated.emit({ index: partidaIndex, partida: updatedPartida });
    this.closeSuggestions();
  }

  removeSuggestion(partidaIndex: number): void {
    const updatedPartida = this.partidaMatcherService.updateMatch(
      this.processedPartidas[partidaIndex], 
      null
    );
    
    this.processedPartidas[partidaIndex] = updatedPartida;
    this.partidaUpdated.emit({ index: partidaIndex, partida: updatedPartida });
  }

  openSuggestions(partidaIndex: number): void {
    this.selectedPartidaIndex = partidaIndex;
    this.searchQuery = '';
    this.showSuggestions = true;
    this.updateFilteredSuggestions();
  }

  closeSuggestions(): void {
    this.showSuggestions = false;
    this.selectedPartidaIndex = -1;
    this.searchQuery = '';
    this.filteredSuggestions = [];
  }

  onSearchQueryChange(): void {
    this.updateFilteredSuggestions();
  }

  private updateFilteredSuggestions(): void {
    if (this.searchQuery.trim()) {
      this.filteredSuggestions = this.partidaMatcherService.searchItems(
        this.searchQuery, 
        10
      );
    } else {
      // Mostrar sugerencias existentes si las hay
      const currentPartida = this.processedPartidas[this.selectedPartidaIndex];
      if (currentPartida && currentPartida.suggestions && currentPartida.suggestions.length > 0) {
         this.filteredSuggestions = currentPartida.suggestions.map(s => s.item);
      } else {
        this.filteredSuggestions = this.availableItems.slice(0, 10);
      }
    }
  }

  confirmImport(): void {
    const validPartidas = this.validPartidas;
    if (validPartidas.length === 0) {
      alert('No hay partidas válidas para importar.');
      return;
    }

    this.importConfirmed.emit(validPartidas);
  }

  cancel(): void {
    this.cancelled.emit();
  }

  togglePartidaSelection(partida: ProcessedPartida): void {
    partida.selected = !partida.selected;
  }

  getStatusIcon(matchType: string): string {
    switch (matchType) {
      case 'exact': return '✓';
      case 'partial': return '⚠';
      case 'not_found': return '✗';
      default: return '?';
    }
  }

  formatMetrado(value: number): string {
    return value.toFixed(2);
  }

  getSaldo(partida: ProcessedPartida): number {
    return partida.excelRow.metradoActual - partida.excelRow.metradoAnterior;
  }
}