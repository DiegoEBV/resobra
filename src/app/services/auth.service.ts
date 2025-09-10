import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, firstValueFrom } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  rol: 'logistica' | 'residente';
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private currentProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  private sessionSubject = new BehaviorSubject<Session | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public currentProfile$ = this.currentProfileSubject.asObservable();
  public session$ = this.sessionSubject.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));
  constructor(private supabase: SupabaseService) {
    // Limpiar posibles locks de autenticación al inicializar
    this.clearAuthLocks();
    
    // Escuchar cambios en la autenticación
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state change:', event, session?.user?.email || 'no user');
      this.sessionSubject.next(session);
      this.currentUserSubject.next(session?.user || null);
      
      if (session?.user) {
        this.loadUserProfile(session.user.id);
      } else {
        this.currentProfileSubject.next(null);
      }
    });

    // Cargar sesión inicial
    this.loadInitialSession();
  }

  // Método para limpiar locks de autenticación (solo locks problemáticos, no sesiones válidas)
  private async clearAuthLocks() {
    try {
      // Solo limpiar claves específicas de locks, no las sesiones
      const lockKeysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Solo eliminar claves que contengan 'lock' o sean específicamente problemáticas
        if (key && (key.includes('lock') || key.includes('navigator-lock') || key.includes('auth-lock'))) {
          lockKeysToRemove.push(key);
        }
      }
      
      lockKeysToRemove.forEach(key => {
        console.log('🧹 Limpiando clave de lock:', key);
        localStorage.removeItem(key);
      });
      
      // También limpiar sessionStorage de locks específicos
      const sessionLockKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('lock') || key.includes('navigator-lock') || key.includes('auth-lock'))) {
          sessionLockKeysToRemove.push(key);
        }
      }
      
      sessionLockKeysToRemove.forEach(key => {
        console.log('🧹 Limpiando clave de session lock:', key);
        sessionStorage.removeItem(key);
      });
      
    } catch (error) {
      console.warn('Error limpiando locks de auth:', error);
    }
  }

  private async loadInitialSession(): Promise<void> {
    try {
      console.log('🔄 Cargando sesión inicial...');
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error obteniendo sesión:', error);
        // Si hay error de lock, intentar limpiar y reintentar
        if (error.message?.includes('NavigatorLockAcquireTimeoutError')) {
          console.log('🔧 Detectado error de lock, limpiando y reintentando...');
          await this.clearAuthLocks();
          // Esperar un poco antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.loadInitialSession();
        }
        return;
      }
      
      if (session) {
        console.log('✅ Sesión encontrada para:', session.user.email);
        this.sessionSubject.next(session);
        this.currentUserSubject.next(session.user);
        await this.loadUserProfile(session.user.id);
      } else {
        console.log('ℹ️ No hay sesión activa');
      }
    } catch (error) {
      console.error('❌ Error cargando sesión inicial:', error);
      // Si es un error de lock, limpiar storage
      if (error instanceof Error && error.message?.includes('NavigatorLockAcquireTimeoutError')) {
        console.log('🔧 Limpiando locks debido a error...');
        await this.clearAuthLocks();
      }
    }
  }

  private async loadUserProfile(userId: string) {
    try {
      const { data, error } = await this.supabase.db
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Could not load user profile:', error.message);
        // Si el perfil no existe, crear uno básico
        if (error.code === 'PGRST116') {
          console.log('User profile not found, creating basic profile...');
          await this.createBasicProfile(userId);
        }
        return;
      }

      this.currentProfileSubject.next(data);
    } catch (error) {
      console.warn('Error loading user profile:', error);
      // Continuar sin perfil en lugar de fallar completamente
    }
  }

  // Iniciar sesión
  signIn(email: string, password: string): Observable<{ user: User | null; error: any }> {
    return from(
      this.supabase.auth.signInWithPassword({ email, password })
    ).pipe(
      map(({ data, error }) => {
        // Si el login es exitoso, cargar el perfil del usuario
        if (data?.user && !error) {
          console.log('Login exitoso para:', email);
          this.loadUserProfile(data.user.id);
          return { user: data.user, error: null };
        }
        
        // Manejar errores específicos de Supabase
        if (error) {
          console.log('Error de autenticación:', error);
          console.log('Mensaje de error:', error.message);
          
          // Traducir errores comunes
          let translatedError = error;
          if (error.message) {
            if (error.message.includes('Invalid login credentials')) {
              translatedError = { 
                ...error, 
                message: 'Credenciales de acceso inválidas. Verifique su email y contraseña.',
                __isAuthError: true
              } as any;
            } else if (error.message.includes('Email not confirmed')) {
              translatedError = { 
                ...error, 
                message: 'La cuenta no ha sido confirmada. Por favor contacte al administrador.',
                __isAuthError: true
              } as any;
            } else if (error.message.includes('Too many requests')) {
              translatedError = { 
                ...error, 
                message: 'Demasiados intentos de acceso. Intente nuevamente en unos minutos.',
                __isAuthError: true
              } as any;
            } else {
              translatedError = { 
                ...error, 
                message: error.message || 'Error de autenticación',
                __isAuthError: true
              } as any;
            }
          }
          
          return { user: null, error: translatedError };
        }
        
        return { user: data?.user || null, error };
      })
    );
  }

  // Método auxiliar para buscar un usuario por email
  private async findUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase.db
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error buscando usuario por email:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error buscando usuario por email:', error);
      return null;
    }
  }

  // Registrar usuario
  signUp(email: string, password: string, nombre: string, rol: 'logistica' | 'residente' = 'logistica'): Observable<{ user: User | null; error: any }> {
    return from(
      this.supabase.auth.signUp({ email, password })
    ).pipe(
      tap(async ({ data, error }) => {
        if (data.user && !error) {
          // Crear perfil de usuario en la tabla users
          await this.createUserProfile(data.user.id, email, nombre, rol);
        }
      }),
      map(({ data, error }) => ({ user: data.user, error }))
    );
  }

  private async createUserProfile(userId: string, email: string, nombre: string, rol: 'logistica' | 'residente') {
    try {
      const { error } = await this.supabase.db
        .from('users')
        .insert({
          id: userId,
          email,
          nombre,
          rol
        });

      if (error) {
        console.error('Error creating user profile:', error);
      } else {
        // Cargar el perfil recién creado
        await this.loadUserProfile(userId);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }

  private async createBasicProfile(userId: string) {
    try {
      const user = this.getCurrentUser();
      if (!user) return;

      const { error } = await this.supabase.db
        .from('users')
        .insert({
          id: userId,
          email: user.email || 'usuario@ejemplo.com',
          nombre: user.email?.split('@')[0] || 'Usuario',
          rol: 'logistica'
        });

      if (error) {
        console.error('Error creating basic profile:', error);
      } else {
        // Cargar el perfil recién creado
        await this.loadUserProfile(userId);
      }
    } catch (error) {
      console.error('Error creating basic profile:', error);
    }
  }

  // Cerrar sesión
  signOut(): Observable<{ error: any }> {
    return from(this.supabase.auth.signOut()).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        this.currentProfileSubject.next(null);
        this.sessionSubject.next(null);
      }),
      map(({ error }) => ({ error }))
    );
  }

  // Obtener usuario actual
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Obtener perfil actual
  getCurrentProfile(): UserProfile | null {
    return this.currentProfileSubject.value;
  }

  // Verificar si el usuario es residente
  isResident(): boolean {
    const profile = this.getCurrentProfile();
    return profile?.rol === 'residente';
  }

  // Verificar si el usuario es logística
  isLogistics(): boolean {
    const profile = this.getCurrentProfile();
    return profile?.rol === 'logistica';
  }

  // Actualizar perfil de usuario
  updateProfile(updates: Partial<UserProfile>): Observable<{ data: any; error: any }> {
    const userId = this.getCurrentUser()?.id;
    if (!userId) {
      throw new Error('No user logged in');
    }

    return from(
      this.supabase.db
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()
    ).pipe(
      tap(({ data, error }) => {
        if (data && !error) {
          this.currentProfileSubject.next(data);
        }
      })
    );
  }

  // Resetear contraseña
  resetPassword(email: string): Observable<{ error: any }> {
    return from(
      this.supabase.auth.resetPasswordForEmail(email)
    ).pipe(
      map(({ error }) => ({ error }))
    );
  }

  // MÉTODO ELIMINADO: createPredefinedUsers ha sido completamente removido
  // para resolver definitivamente el NavigatorLockAcquireTimeoutError
  // Si necesita crear usuarios, hágalo manualmente a través de la interfaz de registro

  // Método auxiliar para delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}