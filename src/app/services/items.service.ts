import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Item, Specialty } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ItemsService {

  constructor(private supabase: SupabaseService) { }

  // Buscar partidas por nombre con filtro en tiempo real
  searchItems(searchTerm: string, specialty?: Specialty): Observable<Item[]> {
    let query = this.supabase.client
      .from('items')
      .select('*');
    
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
    
    if (specialty) {
      query = query.eq('specialty', specialty);
    }
    
    return from(
      query
        .order('name')
        .limit(50)
        .then(({ data, error }) => {
          if (error) {
            console.error('Error searching items:', error);
            throw error;
          }
          return data || [];
        })
    );
  }

  // Obtener todas las partidas
  getAllItems(): Observable<Item[]> {
    if (!this.supabase.initialized) {
      console.warn('Supabase not initialized, returning empty array');
      return from(Promise.resolve([]));
    }

    return from(
      this.supabase.client
        .from('items')
        .select('*')
        .order('specialty', { ascending: true })
        .order('name', { ascending: true })
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching items:', error);
            return []; // Return empty array instead of throwing
          }
          return data || [];
        })
    );
  }

  // Obtener partidas agrupadas por especialidad
  getItemsBySpecialty(): Observable<{ [key in Specialty]: Item[] }> {
    if (!this.supabase.initialized) {
      console.warn('Supabase not initialized, returning empty groups');
      const emptyGroups: { [key in Specialty]: Item[] } = {
        'arquitectura': [],
        'estructura': [],
        'instalaciones_sanitarias': [],
        'instalaciones_electricas': [],
        'instalaciones_mecanicas': [],
        'comunicaciones': []
      };
      return from(Promise.resolve(emptyGroups));
    }

    return from(
      this.supabase.client
        .from('items')
        .select('*')
        .order('specialty', { ascending: true })
        .order('name', { ascending: true })
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching items by specialty:', error);
            // Return empty groups instead of throwing error
            const emptyGroups: { [key in Specialty]: Item[] } = {
              'arquitectura': [],
              'estructura': [],
              'instalaciones_sanitarias': [],
              'instalaciones_electricas': [],
              'instalaciones_mecanicas': [],
              'comunicaciones': []
            };
            return emptyGroups;
          }
          
          const groupedItems: { [key in Specialty]: Item[] } = {
            'arquitectura': [],
            'estructura': [],
            'instalaciones_sanitarias': [],
            'instalaciones_electricas': [],
            'instalaciones_mecanicas': [],
            'comunicaciones': []
          };
          
          (data || []).forEach(item => {
            if (item.specialty && item.specialty in groupedItems) {
              (groupedItems as any)[item.specialty].push(item);
            }
          });
          
          return groupedItems;
        })
    );
  }

  // Obtener partida por ID
  getItemById(id: string): Observable<Item | null> {
    return from(
      this.supabase.client
        .from('items')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching item:', error);
            throw error;
          }
          return data;
        })
    );
  }

  // Crear nueva partida
  createItem(item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Observable<Item> {
    return from(
      this.supabase.client
        .from('items')
        .insert([item])
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error creating item:', error);
            throw error;
          }
          return data;
        })
    );
  }

  // Actualizar partida
  updateItem(id: string, updates: Partial<Item>): Observable<Item> {
    return from(
      this.supabase.client
        .from('items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error updating item:', error);
            throw error;
          }
          return data;
        })
    );
  }

  // Eliminar partida
  deleteItem(id: string): Observable<void> {
    return from(
      this.supabase.client
        .from('items')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Error deleting item:', error);
            throw error;
          }
        })
    );
  }

  // Obtener especialidades disponibles
  getSpecialties(): Specialty[] {
    return ['arquitectura', 'estructura', 'instalaciones_sanitarias', 'instalaciones_electricas', 'instalaciones_mecanicas', 'comunicaciones'];
  }

  // Obtener nombre legible de especialidad
  getSpecialtyDisplayName(specialty: Specialty): string {
    const displayNames: { [key in Specialty]: string } = {
      'arquitectura': 'Arquitectura',
      'estructura': 'Estructura',
      'instalaciones_sanitarias': 'Instalaciones Sanitarias',
      'instalaciones_electricas': 'Instalaciones Eléctricas',
      'instalaciones_mecanicas': 'Instalaciones Mecánicas',
      'comunicaciones': 'Comunicaciones'
    };
    return displayNames[specialty];
  }
}