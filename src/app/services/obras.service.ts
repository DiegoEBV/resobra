import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { DirectAuthService } from './direct-auth.service';
import { Obra } from '../interfaces/database.interface';

@Injectable({
  providedIn: 'root'
})
export class ObrasService {
  private obrasSubject = new BehaviorSubject<Obra[]>([]);
  public obras$ = this.obrasSubject.asObservable();
  


  constructor(
    private supabase: SupabaseService,
    private directAuthService: DirectAuthService
  ) {
    this.loadObras();
  }

  // Cargar obras asignadas al usuario
  async loadObras(): Promise<void> {
    try {
      const user = this.directAuthService.getCurrentUser();
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

        throw obrasError;
      }

      this.obrasSubject.next(obras as Obra[] || []);
    } catch (error) {

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
    
          return null;
        }
        return data as Obra;
      }),
      catchError(error => {
    
        return [null];
      })
    );
  }

  // Obtener todas las obras (para administradores)
  async getAllObras(): Promise<Obra[]> {
    try {
      const { data: obras, error } = await this.supabase.client
        .from('obras')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return obras || [];
    } catch (error) {
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
  
        throw error;
      }

      await this.loadObras(); // Recargar la lista
      return data as Obra;
    } catch (error) {
  
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
  
        throw error;
      }

      await this.loadObras(); // Recargar la lista
      return data as Obra;
    } catch (error) {
  
      return null;
    }
  }

  // Eliminar obra
  async deleteObra(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.client
        .from('obras')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      // Actualizar la lista local
      await this.loadObras();
      return true;
    } catch (error) {
      return false;
    }
  }
}