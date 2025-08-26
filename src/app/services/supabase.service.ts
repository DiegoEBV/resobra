import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase!: SupabaseClient;
  private isInitialized = false;

  constructor() {
    try {
      this.supabase = createClient(
        environment.supabase.url,
        environment.supabase.anonKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          },
          global: {
            fetch: (url, options = {}) => {
              return fetch(url, {
                ...options,
                signal: AbortSignal.timeout(10000) // 10 second timeout
              });
            }
          }
        }
      );
      this.isInitialized = true;
      console.log('Supabase client initialized successfully');
    } catch (error: any) {
      console.error('Error initializing Supabase client:', error);
      this.isInitialized = false;
    }
  }

  get client() {
    if (!this.isInitialized) {
      throw new Error('Supabase client not initialized');
    }
    return this.supabase;
  }

  get initialized() {
    return this.isInitialized;
  }
}