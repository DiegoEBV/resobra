import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { Frente } from '../interfaces/database.interface';

@Injectable({
  providedIn: 'root'
})
export class FrentesService {

  constructor(private supabase: SupabaseService) { }

  // Obtener todos los frentes
  getFrente(): Observable<Frente[]> {
    // Obteniendo frentes
    return from(
      this.supabase.client
        .from('frentes')
        .select(`
          id,
          nombre,
          descripcion,
          ubicacion_lat,
          ubicacion_lng,
          estado,
          obra_id,
          supervisor_id,
          fecha_inicio,
          fecha_fin_estimada,
          progreso_general,
          presupuesto_asignado,
          presupuesto_utilizado,
          km_inicial,
          km_final,
          coordenadas_inicio,
          coordenadas_fin,
          coordenadas_intermedias,
          coordenadas_gps,
          estado_general,
          created_at,
          updated_at
        `)
        .order('nombre')
    ).pipe(
      map(response => {
        if (response.error) {
          // Error fetching frentes
          return [];
        }

        return response.data || [];
      }),
      catchError(error => {
        // Error in getFrente
        return of([]);
      })
    );
  }

  // Obtener frente por ID
  getFrenteById(id: string): Observable<Frente | null> {
    return from(
      this.supabase.client
        .from('frentes')
        .select(`
          id,
          nombre,
          descripcion,
          ubicacion_lat,
          ubicacion_lng,
          estado,
          obra_id,
          supervisor_id,
          fecha_inicio,
          fecha_fin_estimada,
          progreso_general,
          presupuesto_asignado,
          presupuesto_utilizado,
          km_inicial,
          km_final,
          coordenadas_inicio,
          coordenadas_fin,
          coordenadas_intermedias,
          coordenadas_gps,
          estado_general,
          created_at,
          updated_at
        `)
        .eq('id', id)
        .single()
    ).pipe(
      map(response => {
        if (response.error) {

          return null;
        }
        return response.data;
      }),
      catchError(error => {

        return of(null);
      })
    );
  }

  // Crear nuevo frente
  createFrente(frente: Omit<Frente, 'id' | 'created_at' | 'updated_at'>): Observable<Frente | null> {
    return from(
      this.supabase.client
        .from('frentes')
        .insert({
          ...frente,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
    ).pipe(
      map(response => {
        if (response.error) {

          return null;
        }
        return response.data;
      }),
      catchError(error => {

        return of(null);
      })
    );
  }

  // Actualizar frente
  updateFrente(id: string, frente: Partial<Frente>): Observable<Frente | null> {
    return from(
      this.supabase.client
        .from('frentes')
        .update({
          ...frente,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(response => {
        if (response.error) {

          return null;
        }
        return response.data;
      }),
      catchError(error => {

        return of(null);
      })
    );
  }

  // Eliminar frente
  deleteFrente(id: string): Observable<boolean> {
    return from(
      this.supabase.client
        .from('frentes')
        .delete()
        .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) {

          return false;
        }
        return true;
      }),
      catchError(error => {

        return of(false);
      })
    );
  }
}