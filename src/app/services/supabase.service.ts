import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Crear un storage en memoria para evitar completamente los problemas de NavigatorLockManager
    const memoryStorage = new Map<string, string>();
    
    const customStorage = {
      getItem: (key: string): string | null => {
        try {
          // Intentar primero localStorage, si falla usar memoria
          const value = localStorage.getItem(key);
          if (value !== null) {
            memoryStorage.set(key, value);
            return value;
          }
          return memoryStorage.get(key) || null;
        } catch (error) {
          console.warn('localStorage no disponible, usando memoria:', error);
          return memoryStorage.get(key) || null;
        }
      },
      setItem: (key: string, value: string): void => {
        try {
          localStorage.setItem(key, value);
          memoryStorage.set(key, value);
        } catch (error) {
          console.warn('localStorage no disponible, guardando en memoria:', error);
          memoryStorage.set(key, value);
        }
      },
      removeItem: (key: string): void => {
        try {
          localStorage.removeItem(key);
          memoryStorage.delete(key);
        } catch (error) {
          console.warn('localStorage no disponible, eliminando de memoria:', error);
          memoryStorage.delete(key);
        }
      }
    };

    // Configuración de autenticación personalizada para evitar NavigatorLockManager
    const authConfig = {
      storage: customStorage,
      storageKey: 'sb-auth-token-resobra',
      autoRefreshToken: false, // Deshabilitar auto-refresh para evitar locks
      persistSession: false, // Deshabilitar persistencia para evitar locks
      detectSessionInUrl: false, // Deshabilitar detección de URL para evitar locks
      flowType: 'pkce' as const
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