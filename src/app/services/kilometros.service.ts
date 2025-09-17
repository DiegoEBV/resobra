import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, map, catchError, of, switchMap } from 'rxjs';
import { Kilometro, EstadoConfig } from '../interfaces/database.interface';

export interface KilometroConActividades extends Kilometro {
  actividades?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class KilometrosService {

  constructor(private supabase: SupabaseService) { }

  // CRUD para Kilómetros
  getKilometros(): Observable<Kilometro[]> {

    return from(
      this.supabase.client
        .from('kilometros')
        .select('*')
        .order('frente_id', { ascending: true })
        .order('kilometro', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) {

          return [];
        }

        return response.data || [];
      }),
      catchError(error => {

        return of([]);
      })
    );
  }

  getKilometrosByFrente(frenteId: string): Observable<Kilometro[]> {
    return from(
      this.supabase.client
        .from('kilometros')
        .select('*')
        .eq('frente_id', frenteId)
        .order('kilometro', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) {

          return [];
        }
        return response.data || [];
      }),
      catchError(error => {

        return of([]);
      })
    );
  }

  getKilometro(frenteId: string, kilometro: number): Observable<Kilometro | null> {
    return from(
      this.supabase.client
        .from('kilometros')
        .select('*')
        .eq('frente_id', frenteId)
        .eq('kilometro', kilometro)
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

  createKilometro(kilometro: Omit<Kilometro, 'id'>): Observable<Kilometro | null> {
    const now = new Date().toISOString();
    const kilometroWithTimestamps = {
      ...kilometro,
      created_at: now,
      updated_at: now
    };
    
    return from(
      this.supabase.client
        .from('kilometros')
        .insert([kilometroWithTimestamps])
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

  updateKilometro(id: string, updates: Partial<Kilometro>): Observable<Kilometro | null> {
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    return from(
      this.supabase.client
        .from('kilometros')
        .update(updatesWithTimestamp)
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

  updateKilometroEstado(id: string, estado: string, progreso: number): Observable<Kilometro | null> {
    return this.getColorByEstado(estado).pipe(
      switchMap(color => {
        const now = new Date().toISOString();
        const updates = {
          estado,
          progreso_porcentaje: progreso,
          color: color || '#6B7280',
          fecha_ultima_actualizacion: now,
          updated_at: now
        };
        
        return from(
          this.supabase.client
            .from('kilometros')
            .update(updates)
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
      }),
      catchError(error => {

        return of(null);
      })
    );
  }

  deleteKilometro(id: string): Observable<boolean> {
    return from(
      this.supabase.client
        .from('kilometros')
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

  // Generar kilómetros automáticamente para un frente
  generateKilometrosForFrente(frenteId: string, kmInicial: number, kmFinal: number): Observable<Kilometro[]> {
    const kilometros: Omit<Kilometro, 'id'>[] = [];
    const now = new Date().toISOString();
    
    for (let km = Math.ceil(kmInicial); km <= Math.floor(kmFinal); km++) {
      kilometros.push({
        frente_id: frenteId,
        kilometro: km,
        estado: 'no_iniciado',
        color: '#6B7280',
        progreso_porcentaje: 0,
        actividades_count: 0,
        fecha_ultima_actualizacion: now,
        created_at: now,
        updated_at: now
      });
    }

    return from(
      this.supabase.client
        .from('kilometros')
        .insert(kilometros)
        .select()
    ).pipe(
      map(response => {
        if (response.error) {

          return [];
        }
        return response.data || [];
      }),
      catchError(error => {

        return of([]);
      })
    );
  }

  // CRUD para Estados Config
  getEstadosConfig(): Observable<EstadoConfig[]> {
    return from(
      this.supabase.client
        .from('estados_config')
        .select('*')
        .eq('activo', true)
        .order('umbral_minimo', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) {

          return [];
        }
        return response.data || [];
      }),
      catchError(error => {

        return of([]);
      })
    );
  }

  getColorByEstado(estado: string): Observable<string | null> {
    return from(
      this.supabase.client
        .from('estados_config')
        .select('color_hex')
        .eq('estado_nombre', estado)
        .eq('activo', true)
        .single()
    ).pipe(
      map(response => {
        if (response.error) {

          return null;
        }
        return response.data?.color_hex || null;
      }),
      catchError(error => {

        return of(null);
      })
    );
  }

  updateEstadoConfig(id: string, updates: Partial<EstadoConfig>): Observable<EstadoConfig | null> {
    return from(
      this.supabase.client
        .from('estados_config')
        .update(updates)
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

  // Métodos de utilidad
  getKilometrosConActividades(frenteId: string): Observable<KilometroConActividades[]> {
    return from(
      this.supabase.client
        .from('kilometros')
        .select(`
          *,
          actividades:actividades!frente_id(
            id,
            nombre,
            descripcion,
            estado,
            progreso_porcentaje,
            kilometro
          )
        `)
        .eq('frente_id', frenteId)
        .order('kilometro', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) {

          return [];
        }
        return response.data || [];
      }),
      catchError(error => {

        return of([]);
      })
    );
  }

  getEstadisticasKilometricas(frenteId: string): Observable<any> {
    return this.getKilometrosByFrente(frenteId).pipe(
      map(kilometros => {
        const total = kilometros.length;
        const noIniciados = kilometros.filter(k => k.estado === 'no_iniciado').length;
        const enProgreso = kilometros.filter(k => k.estado === 'en_progreso').length;
        const completados = kilometros.filter(k => k.estado === 'completado').length;
        const conObservaciones = kilometros.filter(k => k.estado === 'con_observaciones').length;
        
        const progresoPromedio = total > 0 
          ? kilometros.reduce((sum, k) => sum + k.progreso_porcentaje, 0) / total 
          : 0;

        return {
          total,
          noIniciados,
          enProgreso,
          completados,
          conObservaciones,
          progresoPromedio: Math.round(progresoPromedio * 100) / 100,
          porcentajeCompletado: total > 0 ? Math.round((completados / total) * 100) : 0
        };
      })
    );
  }
}