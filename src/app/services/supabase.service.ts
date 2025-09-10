import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Crear un objeto de almacenamiento personalizado para evitar problemas de bloqueo
    const customStorage = {
      getItem: (key: string): string | null => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('Error al obtener item de localStorage:', error);
          return null;
        }
      },
      setItem: (key: string, value: string): void => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error al guardar item en localStorage:', error);
        }
      },
      removeItem: (key: string): void => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error al eliminar item de localStorage:', error);
        }
      }
    };

    // Configuración de autenticación personalizada para evitar NavigatorLockManager
    const authConfig = {
      storage: customStorage,
      storageKey: 'sb-auth-token-resobra',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    };

    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: authConfig
      }
    );
  }

  get client() {
    return this.supabase;
  }

  // Auth methods
  get auth() {
    return this.supabase.auth;
  }

  // Database methods
  get db() {
    return this.supabase;
  }

  // Storage methods
  get storage() {
    return this.supabase.storage;
  }

  // Real-time subscriptions
  get realtime() {
    return this.supabase.realtime;
  }

  // Get current user ID
  async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user?.id || null;
  }

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }
}