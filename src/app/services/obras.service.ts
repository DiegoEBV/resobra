import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Obra } from '../interfaces/database.interface';

@Injectable({
  providedIn: 'root'
})
export class ObrasService {
  private obrasSubject = new BehaviorSubject<Obra[]>([]);
  public obras$ = this.obrasSubject.asObservable();
  


  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {
    this.loadObras();
  }

  // Cargar obras asignadas al usuario
  async loadObras(): Promise<void> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user) {
        this.obrasSubject.next([]);
        return;
      }

      // Primero obtenemos los IDs de las obras del usuario
      const { data: userObras, error: userObrasError } = await this.supabase.client
        .from('user_obras')
        .select('obra_id')
        .eq('user_id', user.id);

      if (userObrasError) {
        console.error('Error loading user obras:', userObrasError);
        throw userObrasError;
      }

      if (!userObras || userObras.length === 0) {
        this.obrasSubject.next([]);
        return;
      }

      const obraIds = userObras.map(item => item.obra_id);

      // Luego obtenemos las obras completas
      const { data: obras, error: obrasError } = await this.supabase.client
        .from('obras')
        .select('*')
        .in('id', obraIds)
        .order('nombre');

      if (obrasError) {
        console.error('Error loading obras:', obrasError);
        throw obrasError;
      }

      this.obrasSubject.next(obras as Obra[] || []);
    } catch (error) {
      console.error('Error in loadObras:', error);
      this.obrasSubject.next([]);
    }
  }

  // Obtener obra por ID
  getObraById(id: string): Observable<Obra | null> {
    return from(this.supabase.client
      .from('obras')
      .select('*')
      .eq('id', id)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error getting obra:', error);
          return null;
        }
        return data as Obra;
      }),
      catchError(error => {
        console.error('Error in getObraById:', error);
        return [null];
      })
    );
  }

  // Obtener todas las obras (para administradores)
  async getAllObras(): Promise<Obra[]> {
    try {
      console.log('📋 ObrasService: Cargando todas las obras desde Supabase');
      
      // Verificar autenticación
      const user = await this.authService.getCurrentUser();
      console.log('👤 ObrasService: Usuario actual:', user ? user.email : 'No autenticado');
      
      const { data, error } = await this.supabase.client
        .from('obras')
        .select('*')
        .order('nombre');

      if (error) {
        console.error('❌ Error getting all obras:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.details);
        throw error;
      }

      const obras = data as Obra[] || [];
      console.log('✅ ObrasService: Obras cargadas desde Supabase:', obras.length);
      console.log('📊 ObrasService: Datos de obras:', obras);
      return obras;
    } catch (error) {
      console.error('❌ Error in getAllObras:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  // Crear nueva obra
  async createObra(obra: Omit<Obra, 'id' | 'created_at' | 'updated_at'>): Promise<Obra | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('obras')
        .insert([obra])
        .select()
        .single();

      if (error) {
        console.error('Error creating obra:', error);
        throw error;
      }

      await this.loadObras(); // Recargar la lista
      return data as Obra;
    } catch (error) {
      console.error('Error in createObra:', error);
      return null;
    }
  }

  // Actualizar obra
  async updateObra(id: string, updates: Partial<Obra>): Promise<Obra | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('obras')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating obra:', error);
        throw error;
      }

      await this.loadObras(); // Recargar la lista
      return data as Obra;
    } catch (error) {
      console.error('Error in updateObra:', error);
      return null;
    }
  }

  // Eliminar obra
  async deleteObra(id: string): Promise<boolean> {
    try {
      console.log('🗑️ ObrasService: Eliminando obra desde Supabase:', id);
      
      const { error } = await this.supabase.client
        .from('obras')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting obra:', error);
        throw error;
      }

      console.log('✅ ObrasService: Obra eliminada exitosamente');
      await this.loadObras(); // Recargar la lista
      return true;
    } catch (error) {
      console.error('❌ Error in deleteObra:', error);
      return false;
    }
  }
}