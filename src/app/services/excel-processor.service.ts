import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ExcelRow, ValidationResult } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ExcelProcessorService {
  private readonly REQUIRED_COLUMNS = ['partida', 'metrado anterior', 'metrado actual'];
  private readonly MAX_ROWS = 1000;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  constructor() { }

  async readExcelFile(file: File): Promise<ExcelRow[]> {
    // Validar tamaño del archivo
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('El archivo es demasiado grande. Máximo 5MB.');
    }

    // Validar tipo de archivo
    if (!this.isValidExcelFile(file)) {
      throw new Error('Formato de archivo no válido. Solo se permiten archivos .xlsx y .xls.');
    }

    try {
      // Leer archivo Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      if (workbook.SheetNames.length === 0) {
        throw new Error('El archivo Excel no contiene hojas de cálculo.');
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Validar estructura
      const validation = this.validateExcelStructure(jsonData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Procesar datos
      return this.parseExcelData(jsonData);
    } catch (error: any) {
      if (error.message.includes('Unsupported file')) {
        throw new Error('Archivo Excel corrupto o formato no soportado.');
      }
      throw error;
    }
  }

  private isValidExcelFile(file: File): boolean {
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(ext => fileName.endsWith(ext));
  }

  private validateExcelStructure(data: any[][]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validar que hay datos
    if (data.length < 2) {
      result.isValid = false;
      result.errors.push('El archivo debe contener al menos una fila de datos además del encabezado.');
      return result;
    }

    // Validar encabezados
    const headers = data[0].map(h => h?.toString().toLowerCase().trim());
    const missingColumns = this.REQUIRED_COLUMNS.filter(col => 
      !headers.some(h => h && h.includes(col.toLowerCase()))
    );

    if (missingColumns.length > 0) {
      result.isValid = false;
      result.errors.push(`Faltan las siguientes columnas: ${missingColumns.join(', ')}`);
    }

    // Validar cantidad de filas
    if (data.length > this.MAX_ROWS + 1) {
      result.isValid = false;
      result.errors.push(`Máximo ${this.MAX_ROWS} filas permitidas.`);
    }

    // Validar que hay al menos 3 columnas
    if (data[0].length < 3) {
      result.isValid = false;
      result.errors.push('El archivo debe contener al menos 3 columnas.');
    }

    return result;
  }

  private parseExcelData(data: any[][]): ExcelRow[] {
    const headers = data[0].map(h => h?.toString().toLowerCase().trim());
    
    // Encontrar índices de las columnas requeridas
    const partidaIndex = this.findColumnIndex(headers, ['partida', 'nombre', 'descripcion']);
    const metradoAnteriorIndex = this.findColumnIndex(headers, ['anterior', 'previo', 'pasado']);
    const metradoActualIndex = this.findColumnIndex(headers, ['actual', 'presente', 'corriente']);

    if (partidaIndex === -1 || metradoAnteriorIndex === -1 || metradoActualIndex === -1) {
      throw new Error('No se pudieron identificar todas las columnas requeridas.');
    }

    const excelRows: ExcelRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;

      try {
        const partida = row[partidaIndex]?.toString().trim();
        const metradoAnterior = this.parseNumber(row[metradoAnteriorIndex]);
        const metradoActual = this.parseNumber(row[metradoActualIndex]);

        // Validar que la partida no esté vacía
        if (!partida) {
          errors.push(`Fila ${rowNumber}: El nombre de la partida no puede estar vacío.`);
          continue;
        }

        // Validar que los metrados sean números válidos
        if (isNaN(metradoAnterior) || isNaN(metradoActual)) {
          errors.push(`Fila ${rowNumber}: Los valores de metrado deben ser números válidos.`);
          continue;
        }

        // Validar que los metrados no sean negativos
        if (metradoAnterior < 0 || metradoActual < 0) {
          errors.push(`Fila ${rowNumber}: Los valores de metrado no pueden ser negativos.`);
          continue;
        }

        excelRows.push({
          partida,
          metradoAnterior,
          metradoActual,
          rowNumber
        });
      } catch (error) {
        errors.push(`Fila ${rowNumber}: Error al procesar los datos.`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Errores en el procesamiento:\n${errors.join('\n')}`);
    }

    if (excelRows.length === 0) {
      throw new Error('No se encontraron filas válidas para procesar.');
    }

    return excelRows;
  }

  private findColumnIndex(headers: string[], keywords: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (keywords.some(keyword => header.includes(keyword))) {
        return i;
      }
    }
    return -1;
  }

  private parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    const num = parseFloat(value.toString().replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  }

  // Método para validar archivo antes de procesarlo
  async validateFile(file: File): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validar tamaño del archivo
    if (file.size > this.MAX_FILE_SIZE) {
      result.isValid = false;
      result.errors.push('El archivo es demasiado grande. Máximo 5MB.');
      return result;
    }

    // Validar tipo de archivo
    if (!this.isValidExcelFile(file)) {
      result.isValid = false;
      result.errors.push('Formato de archivo no válido. Solo se permiten archivos .xlsx y .xls.');
      return result;
    }

    try {
      // Leer archivo Excel para validar estructura
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      if (workbook.SheetNames.length === 0) {
        result.isValid = false;
        result.errors.push('El archivo Excel no contiene hojas de cálculo.');
        return result;
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Validar estructura
      return this.validateExcelStructure(jsonData);
    } catch (error: any) {
      result.isValid = false;
      result.errors.push('Error al leer el archivo Excel.');
      return result;
    }
  }

  // Método para procesar archivo (alias de readExcelFile)
  async processFile(file: File): Promise<ExcelRow[]> {
    return this.readExcelFile(file);
  }

  // Método para generar plantilla de Excel
  generateTemplate(): void {
    const templateData = [
      ['Partida', 'Metrado Anterior', 'Metrado Actual'],
      ['Mampostería de ladrillo', 42.53, 56.78],
      ['Cable THW 12 AWG', 42.53, 56.78],
      ['Rack de comunicaciones', 42.53, 56.78],
      ['Concreto f\'c=210 kg/cm²', 42.53, 56.78]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');
    
    // Descargar archivo
    XLSX.writeFile(workbook, 'plantilla_importacion_partidas.xlsx');
  }

  /**
   * Descarga una plantilla de Excel con el formato esperado
   */
  downloadTemplate(): void {
    const templateData = [
      ['Partida', 'Metrado Anterior', 'Metrado Actual'],
      ['Ejemplo: Excavación manual', '10.50', '15.75'],
      ['Ejemplo: Concreto f\'c=210 kg/cm²', '25.00', '30.25']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');

    // Aplicar estilos básicos
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'CCCCCC' } }
      };
    }

    XLSX.writeFile(wb, 'plantilla_importacion.xlsx');
  }
}