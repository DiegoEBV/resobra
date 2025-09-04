import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ItemsService } from './items.service';
import { Item, Specialty } from '../models/interfaces';

export interface ImportProgress {
  total: number;
  processed: number;
  success: number;
  errors: string[];
  currentItem?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PartidasImportService {

  constructor(private itemsService: ItemsService) { }

  /**
   * Parsea una línea del archivo partestr.txt y convierte a objeto Item
   */
  private parsePartidaLine(line: string): Omit<Item, 'id' | 'created_at' | 'updated_at'> | null {
    try {
      // Remover paréntesis externos y coma final
      const cleanLine = line.trim().replace(/^\(/, '').replace(/\),?$/, '');
      
      // Dividir por comas, pero respetando las comillas y arrays
      const parts = this.splitRespectingQuotes(cleanLine);
      
      if (parts.length < 6) {
        throw new Error(`Línea incompleta: ${line}`);
      }

      const codigo = this.cleanQuotes(parts[0]);
      const nombre = this.cleanQuotes(parts[1]);
      const descripcion = this.cleanQuotes(parts[2]);
      const unidad = parts[3] === 'NULL' ? undefined : this.cleanQuotes(parts[3]);
      const materialesStr = parts[4];
      const especialidad = this.cleanQuotes(parts[5]) as Specialty;

      // Parsear array de materiales
      const materiales = this.parseArrayField(materialesStr);

      return {
        name: `${codigo} - ${nombre}`,
        description: descripcion,
        unit: unidad,
        materials: materiales,
        specialty: especialidad,
        metrado: 0
      };
    } catch (error) {
      console.error('Error parsing line:', line, error);
      return null;
    }
  }

  /**
   * Divide una cadena por comas respetando comillas y arrays
   */
  private splitRespectingQuotes(str: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let inArray = false;
    let quoteChar = '';
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const nextChar = str[i + 1];
      
      if ((char === '"' || char === "'") && !inArray) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = '';
        }
        current += char;
      } else if (char === '[' && !inQuotes) {
        inArray = true;
        current += char;
      } else if (char === ']' && !inQuotes) {
        inArray = false;
        current += char;
      } else if (char === ',' && !inQuotes && !inArray) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      parts.push(current.trim());
    }
    
    return parts;
  }

  /**
   * Limpia las comillas de una cadena
   */
  private cleanQuotes(str: string): string {
    return str.replace(/^['"]/, '').replace(/['"]$/, '').trim();
  }

  /**
   * Parsea un campo de array de PostgreSQL
   */
  private parseArrayField(arrayStr: string): string[] {
    try {
      // Si es un array vacío
      if (arrayStr.includes('ARRAY[]') || arrayStr === '[]') {
        return [];
      }
      
      // Extraer contenido entre corchetes
      const match = arrayStr.match(/ARRAY\[([^\]]+)\]/);
      if (!match) {
        return [];
      }
      
      const content = match[1];
      
      // Dividir por comas y limpiar comillas
      return content.split(',').map(item => 
        this.cleanQuotes(item.trim())
      ).filter(item => item.length > 0);
    } catch (error) {
      console.error('Error parsing array field:', arrayStr, error);
      return [];
    }
  }

  /**
   * Importa todas las partidas desde el archivo de texto
   */
  importPartidasFromText(fileContent: string): Observable<ImportProgress> {
    return new Observable(observer => {
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
      const total = lines.length;
      let processed = 0;
      let success = 0;
      const errors: string[] = [];

      const progress: ImportProgress = {
        total,
        processed: 0,
        success: 0,
        errors: []
      };

      // Procesar líneas secuencialmente
      const processNext = (index: number) => {
        if (index >= lines.length) {
          // Completado
          progress.processed = processed;
          progress.success = success;
          progress.errors = errors;
          observer.next(progress);
          observer.complete();
          return;
        }

        const line = lines[index];
        const partida = this.parsePartidaLine(line);
        
        if (!partida) {
          processed++;
          errors.push(`Error en línea ${index + 1}: No se pudo parsear`);
          progress.processed = processed;
          progress.errors = [...errors];
          observer.next(progress);
          setTimeout(() => processNext(index + 1), 10);
          return;
        }

        progress.currentItem = partida.name;
        observer.next(progress);

        // Crear la partida en la base de datos
        this.itemsService.createItem(partida).subscribe({
          next: (createdItem) => {
            processed++;
            success++;
            progress.processed = processed;
            progress.success = success;
            observer.next(progress);
            setTimeout(() => processNext(index + 1), 10);
          },
          error: (error) => {
            processed++;
            const errorMsg = `Error creando ${partida.name}: ${error.message || error}`;
            errors.push(errorMsg);
            progress.processed = processed;
            progress.errors = [...errors];
            observer.next(progress);
            setTimeout(() => processNext(index + 1), 10);
          }
        });
      };

      // Iniciar procesamiento
      processNext(0);
    });
  }

  /**
   * Lee el archivo partestr.txt desde assets
   */
  loadPartestrFile(): Observable<string> {
    return from(
      fetch('/assets/partestr.txt')
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error loading file: ${response.statusText}`);
          }
          return response.text();
        })
    ).pipe(
      catchError(error => {
        console.error('Error loading partestr.txt:', error);
        throw error;
      })
    );
  }

  /**
   * Importa todas las partidas de estructura desde el archivo
   */
  importEstructuraPartidas(): Observable<ImportProgress> {
    return this.loadPartestrFile().pipe(
      switchMap(content => this.importPartidasFromText(content))
    );
  }
}