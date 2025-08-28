import { Injectable } from '@angular/core';
import Fuse from 'fuse.js';
import { Item, ProcessedPartida, ExcelRow, SuggestionItem } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class PartidaMatcherService {
  private fuse: Fuse<Item> | null = null;
  private items: Item[] = [];

  // Configuración de Fuse.js para búsqueda difusa
  private readonly fuseOptions = {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'description', weight: 0.3 }
    ],
    threshold: 0.4, // 0 = coincidencia exacta, 1 = coincidencia muy flexible
    distance: 100,
    minMatchCharLength: 3,
    includeScore: true,
    includeMatches: true
  };

  constructor() { }

  /**
   * Inicializa el servicio con la lista de items disponibles
   */
  initializeItems(items: Item[]): void {
    this.items = items;
    this.fuse = new Fuse(items, this.fuseOptions);
  }

  /**
   * Procesa una lista de filas de Excel y encuentra coincidencias
   */
  processExcelRows(excelRows: ExcelRow[]): ProcessedPartida[] {
    if (!this.fuse || this.items.length === 0) {
      throw new Error('El servicio no ha sido inicializado con items.');
    }

    const processedPartidas: ProcessedPartida[] = [];

    for (const excelRow of excelRows) {
      const processed = this.findBestMatch(excelRow);
      processedPartidas.push(processed);
    }

    return processedPartidas;
  }

  /**
   * Encuentra la mejor coincidencia para una fila de Excel
   */
  private findBestMatch(excelRow: ExcelRow): ProcessedPartida {
    const partidaName = excelRow.partida.trim();

    // 1. Búsqueda exacta (case-insensitive)
    const exactMatch = this.findExactMatch(partidaName);
    if (exactMatch) {
      return {
        excelRow,
        matchedItem: exactMatch,
        matchType: 'exact',
        confidence: 1.0,
        suggestions: [],
        selected: true
      };
    }

    // 2. Búsqueda difusa
    const fuzzyResults = this.fuse!.search(partidaName);
    
    if (fuzzyResults.length > 0) {
      const bestMatch = fuzzyResults[0];
      const confidence = 1 - (bestMatch.score || 0);
      
      // Si la confianza es alta (> 0.6), consideramos que es una coincidencia parcial
      if (confidence > 0.6) {
        const suggestions = fuzzyResults.slice(1, 4).map(result => ({
          item: result.item,
          confidence: 1 - (result.score || 0)
        }));

        return {
          excelRow,
          matchedItem: bestMatch.item,
          matchType: 'partial',
          confidence,
          suggestions,
          selected: true
        };
      }
    }

    // 3. No se encontró coincidencia
    const suggestions = this.getSimilarItems(partidaName, 3);
    
    return {
      excelRow,
      matchedItem: null,
      matchType: 'not_found',
      confidence: 0,
      suggestions,
      selected: false
    };
  }

  /**
   * Busca coincidencia exacta (case-insensitive)
   */
  private findExactMatch(partidaName: string): Item | null {
    const normalizedSearch = this.normalizeString(partidaName);
    
    return this.items.find(item => {
      const normalizedItemName = this.normalizeString(item.name);
      const normalizedItemDesc = this.normalizeString(item.description || '');
      
      return normalizedItemName === normalizedSearch || 
             normalizedItemDesc === normalizedSearch;
    }) || null;
  }

  /**
   * Obtiene items similares para sugerencias
   */
  private getSimilarItems(partidaName: string, limit: number = 3): SuggestionItem[] {
    if (!this.fuse) return [];

    const results = this.fuse.search(partidaName);
    return results.slice(0, limit).map(result => ({
      item: result.item,
      confidence: 1 - (result.score || 0)
    }));
  }

  /**
   * Normaliza strings para comparación
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9\s]/g, '');
  }

  /**
   * Busca items por texto libre
   */
  searchItems(query: string, limit: number = 10): Item[] {
    if (!this.fuse || !query.trim()) {
      return this.items.slice(0, limit);
    }

    const results = this.fuse.search(query.trim());
    return results.slice(0, limit).map(result => result.item);
  }

  /**
   * Obtiene estadísticas del procesamiento
   */
  getProcessingStats(processedPartidas: ProcessedPartida[]): {
    total: number;
    exact: number;
    partial: number;
    notFound: number;
    exactPercentage: number;
    partialPercentage: number;
    notFoundPercentage: number;
  } {
    const total = processedPartidas.length;
    const exact = processedPartidas.filter(p => p.matchType === 'exact').length;
    const partial = processedPartidas.filter(p => p.matchType === 'partial').length;
    const notFound = processedPartidas.filter(p => p.matchType === 'not_found').length;

    return {
      total,
      exact,
      partial,
      notFound,
      exactPercentage: total > 0 ? Math.round((exact / total) * 100) : 0,
      partialPercentage: total > 0 ? Math.round((partial / total) * 100) : 0,
      notFoundPercentage: total > 0 ? Math.round((notFound / total) * 100) : 0
    };
  }

  /**
   * Actualiza la coincidencia de una partida procesada
   */
  updateMatch(processedPartida: ProcessedPartida, newItem: Item | null): ProcessedPartida {
    if (!newItem) {
      return {
        ...processedPartida,
        matchedItem: null,
        matchType: 'not_found',
        confidence: 0,
        selected: false
      };
    }

    // Verificar si es coincidencia exacta
    const isExact = this.findExactMatch(processedPartida.excelRow.partida) === newItem;
    
    return {
      ...processedPartida,
      matchedItem: newItem,
      matchType: isExact ? 'exact' : 'partial',
      confidence: isExact ? 1.0 : 0.8,
      selected: true
    };
  }
}