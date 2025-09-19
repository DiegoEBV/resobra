import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Crear cliente Supabase con configuración actualizada del environment
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          // Usar configuración del environment si existe, sino usar valores por defecto
          autoRefreshToken: environment.supabase.auth?.autoRefreshToken ?? false,
          persistSession: environment.supabase.auth?.persistSession ?? false,
          detectSessionInUrl: environment.supabase.auth?.detectSessionInUrl ?? false,
          storageKey: 'sb-data-only-token',
          storage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {}
          }
        }
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

  // Set session with access token
  async setSession(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      await this.supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      });
    } catch (error) {
      console.error('Error setting session:', error);
    }
  }
}