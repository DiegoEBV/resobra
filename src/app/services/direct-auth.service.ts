import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

interface User {
  id: string;
  email: string;
  [key: string]: any;
}

interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class DirectAuthService {
  private currentUser: User | null = null;
  private currentProfile: UserProfile | null = null;
  private accessToken: string | null = null;
  private supabaseClient: SupabaseClient;

  constructor(private http: HttpClient) {
    // Crear cliente Supabase sin locks
    this.supabaseClient = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          storageKey: 'sb-direct-auth-token',
          autoRefreshToken: false,
          persistSession: false,
          flowType: 'implicit'
        }
      }
    );
    
    this.loadStoredAuth();
  }

  async login(email: string, password: string): Promise<{ user: User | null; error: any }> {
    try {
      console.log('🔐 DirectAuthService - Iniciando login directo...');
      
      const { data, error } = await this.supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('❌ DirectAuthService - Error en login:', error);
        return { user: null, error };
      }
      
      if (data?.user && data?.session) {
        this.accessToken = data.session.access_token;
        this.currentUser = data.user as User;
        
        // Guardar en sessionStorage
        sessionStorage.setItem('direct_auth_token', this.accessToken);
        sessionStorage.setItem('direct_auth_user', JSON.stringify(this.currentUser));
        
        // Cargar perfil del usuario
        await this.loadUserProfile();
        
        console.log('✅ DirectAuthService - Login exitoso');
        return { user: this.currentUser, error: null };
      } else {
        console.error('❌ DirectAuthService - No se recibió token de acceso');
        return { user: null, error: { message: 'Error de autenticación' } };
      }
    } catch (error: any) {
      console.error('❌ DirectAuthService - Error en login:', error);
      return { user: null, error };
    }
  }

  private loadStoredAuth(): void {
    const token = sessionStorage.getItem('direct_auth_token');
    const userStr = sessionStorage.getItem('direct_auth_user');
    const profileStr = sessionStorage.getItem('direct_auth_profile');
    
    if (token && userStr) {
      this.accessToken = token;
      this.currentUser = JSON.parse(userStr);
      
      if (profileStr) {
        this.currentProfile = JSON.parse(profileStr);
      }
    }
  }

  private async loadUserProfile(): Promise<void> {
    if (!this.accessToken || !this.currentUser) return;
    
    try {
      console.log('🔍 Cargando perfil para user id:', this.currentUser.id);
      
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();
      
      if (error) {
        console.error('❌ Error cargando perfil desde tabla users:', error);
        console.error('Error details:', error);
        return;
      }
      
      if (data) {
        this.currentProfile = data as UserProfile;
        sessionStorage.setItem('direct_auth_profile', JSON.stringify(this.currentProfile));
        console.log('✅ Perfil cargado exitosamente:', this.currentProfile);
        console.log('✅ Rol del usuario:', this.currentProfile.rol);
      } else {
        console.warn('⚠️ No se encontró perfil para el usuario');
      }
    } catch (error) {
      console.error('❌ Error en loadUserProfile:', error);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getCurrentProfile(): UserProfile | null {
    return this.currentProfile;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.currentUser;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async logout(): Promise<void> {
    try {
      await this.supabaseClient.auth.signOut();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      this.accessToken = null;
      this.currentUser = null;
      this.currentProfile = null;
      sessionStorage.removeItem('direct_auth_token');
      sessionStorage.removeItem('direct_auth_user');
      sessionStorage.removeItem('direct_auth_profile');
    }
  }

  // Método para hacer peticiones autenticadas
  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'apikey': environment.supabase.anonKey,
      'Authorization': `Bearer ${this.accessToken}`
    });
  }
}