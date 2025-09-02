export type Specialty = 'arquitectura' | 'estructura' | 'instalaciones_sanitarias' | 'instalaciones_electricas' | 'instalaciones_mecanicas' | 'comunicaciones';

export interface Item {
  id: string;
  name: string;
  description?: string;
  unit?: string;
  materials?: string[];
  specialty: Specialty;
  metrado?: number;
  isDraft?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  name: string;
  location?: string;
  contractor?: string;
  supervisor?: string;
  start_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Report {
  id: string;
  project_id: string;
  report_number: string;
  report_date: string;
  period_start?: string;
  period_end?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  project?: Project;
}

export interface ReportItem {
  id: string;
  report_id: string;
  item_id: string;
  previous_quantity: number;
  current_quantity: number;
  accumulated_quantity: number;
  created_at?: string;
  updated_at?: string;
  item?: Item;
}

export interface SelectedItem {
  item: Item;
  currentQuantity: number;
  previousQuantity: number;
  metrado?: number;
}

// Interfaces para importación de Excel
export interface ExcelRow {
  partida: string;
  metradoAnterior: number;
  metradoActual: number;
  rowNumber: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SuggestionItem {
  item: Item;
  confidence: number;
}

export interface ProcessedPartida {
  excelRow: ExcelRow;
  matchType: 'exact' | 'partial' | 'not_found';
  matchedItem: Item | null;
  suggestions?: SuggestionItem[];
  selected?: boolean;
  confidence?: number;
}

export interface ImportResult {
  totalRows: number;
  exactMatches: number;
  partialMatches: number;
  notFound: number;
  processedPartidas: ProcessedPartida[];
  errors: string[];
}

export interface ImportConfig {
  exactMatchThreshold: number; // 0.95
  partialMatchThreshold: number; // 0.7
  maxSuggestions: number; // 5
  caseSensitive: boolean; // false
}