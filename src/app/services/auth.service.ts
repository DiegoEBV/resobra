import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, firstValueFrom } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { User, Session } from '@supabase/supabase-js';
import { LockMonitorService } from './lock-monitor.service';

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
  private lockMonitor = new LockMonitorService();

  public currentUser$ = this.currentUserSubject.asObservable();
  public currentProfile$ = this.currentProfileSubject.asObservable();
  public session$ = this.sessionSubject.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));
  constructor(private supabase: SupabaseService) {
    // Suscribirse a cambios en el estado de locks
    this.lockMonitor.lockStatus$.subscribe(locksCleaned => {
      if (locksCleaned) {
        // AuthService: Locks limpiados, reintentando operaciones
        // Opcional: reintentar la última operación fallida
      }
    });
    
    // Configurar listener de eventos de autenticación
    this.setupAuthStateListener();
    
    this.loadInitialSession();
  }

  // Configurar listener para cambios de estado de autenticación
  private setupAuthStateListener(): void {
    // Configurando listener de estado de autenticación
    
    this.supabase.auth.onAuthStateChange((event, session) => {
      // Evento de autenticación
      
      switch (event) {
        case 'SIGNED_IN':
          // Usuario autenticado
          this.sessionSubject.next(session);
          this.currentUserSubject.next(session?.user || null);
          if (session?.user) {
            this.loadUserProfile(session.user.id);
          }
          break;
          
        case 'SIGNED_OUT':
          // Usuario desautenticado
          this.sessionSubject.next(null);
          this.currentUserSubject.next(null);
          this.currentProfileSubject.next(null);
          break;
          
        case 'TOKEN_REFRESHED':
          // Token renovado
          this.sessionSubject.next(session);
          break;
          
        case 'USER_UPDATED':
          // Usuario actualizado
          if (session?.user) {
            this.currentUserSubject.next(session.user);
            this.loadUserProfile(session.user.id);
          }
          break;
      }
    });
  }

  // Limpiar locks de autenticación de manera agresiva
  private async clearAuthLocks(): Promise<void> {
    try {
      // Limpiando locks de autenticación
      
      // Limpiar storage directamente sin usar lockMonitor
      const lockKeys = [
        'lock:sb-auth-token',
        'lock:sb-auth-token-resobra',
        'sb-auth-token',
        'supabase.auth.token',
        'sb-' + window.location.hostname + '-auth-token'
      ];
      
      lockKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          // Error removing key
        }
      });
      
      // Locks de autenticación limpiados
    } catch (error) {
      // Error limpiando locks
    }
  }

  // Cargar sesión inicial con manejo robusto de locks
  private async loadInitialSession(): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        // Intento de carga de sesión inicial
        
        const sessionPromise = this.supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout - No se pudo cargar la sesión')), 30000)
        );
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (error) {
          // Error loading initial session
          
          // Si es un error de NavigatorLockAcquireTimeoutError, limpiar locks y reintentar
          if (error.message && (
            error.message.includes('NavigatorLockAcquireTimeoutError') ||
            error.message.includes('lock') ||
            error.message.includes('timeout')
          )) {
            // Detected lock-related error, clearing locks and retrying
            await this.clearAuthLocks();
            
            // Esperar con exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
            // Esperando antes del siguiente intento
            await this.delay(delay);
            
            attempt++;
            continue;
          }
          
          // Para otros errores, salir del bucle
          // Error no relacionado con locks
          return;
        }

        // Éxito - procesar la sesión
        // Sesión cargada exitosamente
        // Contenido de la sesión
        
        if (session?.user) {
          // Usuario de sesión y token de acceso
        }
        
        this.sessionSubject.next(session);
        this.currentUserSubject.next(session?.user || null);
        
        if (session?.user) {
          await this.loadUserProfile(session.user.id);
          // Estado de autenticación actualizado a: true
        } else {
          // Estado de autenticación actualizado a: false
          // No hay usuario en la sesión - usuario debe hacer login
        }
        return;
        
      } catch (error: any) {
        // Error en intento
        
        // Si es timeout o error de lock, reintentar
        if (error.message && (
          error.message.includes('timeout') ||
          error.message.includes('NavigatorLockAcquireTimeoutError') ||
          error.message.includes('lock')
        )) {
          await this.clearAuthLocks();
          
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          // Esperando antes del siguiente intento
          await this.delay(delay);
          
          attempt++;
          continue;
        }
        
        // Para otros errores, salir del bucle
        // Error no recuperable
        return;
      }
    }
    
    // Se agotaron todos los intentos de carga de sesión
  }

  async loadSession(): Promise<void> {
    try {
      // Cargando sesión
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        // Error al cargar sesión
        this.sessionSubject.next(null);
        return;
      }
      
      // Sesión cargada exitosamente
      // Contenido de la sesión
      
      this.sessionSubject.next(session);
      this.currentUserSubject.next(session?.user || null);
      
      if (session?.user) {
        await this.loadUserProfile(session.user.id);
        // Estado de autenticación actualizado a: true
      } else {
        // Estado de autenticación actualizado a: false
        // No hay usuario en la sesión - usuario debe hacer login
      }
    } catch (error) {
      // Error inesperado al cargar sesión
      this.sessionSubject.next(null);
    }
  }

  private async loadUserProfile(userId: string) {
    try {
      // Cargando perfil del usuario
      const { data, error } = await this.supabase.db
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Could not load user profile
        // Si el perfil no existe, crear uno básico
        if (error.code === 'PGRST116') {
          // User profile not found, creating basic profile
          await this.createBasicProfile(userId);
        }
        return;
      }

      if (data) {
        // Perfil cargado
        this.currentProfileSubject.next(data);
        // Perfil actualizado en BehaviorSubject
      }
    } catch (error) {
      // Error loading user profile
      // Continuar sin perfil en lugar de fallar completamente
    }
  }

  // Iniciar sesión con manejo robusto de locks
  signIn(email: string, password: string): Observable<{ user: User | null; error: any }> {
    return from(this.signInWithRetry(email, password)).pipe(
      map(({ data, error }) => {
        // Si el login es exitoso, cargar el perfil del usuario
        if (data?.user && !error) {
          // Login exitoso
          this.loadUserProfile(data.user.id);
          return { user: data.user, error: null };
        }
        
        // Manejar errores específicos de Supabase
        if (error) {
          // Error de autenticación
          // Mensaje de error
          
          // Traducir errores comunes
          let translatedError = error;
          if (error.message) {
            if (error.message.includes('Invalid login credentials')) {
              translatedError = { 
                ...error, 
                message: 'Credenciales de acceso inválidas. Verifique su email y contraseña.',
                __isAuthError: true
              } as any;

            } else if (error.message.includes('Too many requests')) {
              translatedError = { 
                ...error, 
                message: 'Demasiados intentos de acceso. Intente nuevamente en unos minutos.',
                __isAuthError: true
              } as any;
            } else if (error.message.includes('NavigatorLockAcquireTimeoutError') || error.message.includes('lock')) {
              translatedError = { 
                ...error, 
                message: 'Error temporal del sistema. Intente nuevamente en unos segundos.',
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

  // Método auxiliar para signIn con retry logic
  private async signInWithRetry(email: string, password: string, maxRetries: number = 3): Promise<{ data: any; error: any }> {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        // Intento de login
        
        // Crear promesa con timeout personalizado (45 segundos)
        const signInPromise = this.supabase.auth.signInWithPassword({ email, password });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Login timeout - La conexión tardó demasiado')), 45000)
        );
        
        const result = await Promise.race([signInPromise, timeoutPromise]) as any;
        
        // Si hay error de lock, limpiar y reintentar
        if (result.error && result.error.message && (
          result.error.message.includes('NavigatorLockAcquireTimeoutError') ||
          result.error.message.includes('lock') ||
          result.error.message.includes('timeout')
        )) {
          // Error de lock detectado, limpiando locks
          await this.clearAuthLocks();
          
          // Esperar con exponential backoff
          const delay = Math.min(2000 * Math.pow(2, attempt), 8000);
          // Esperando antes del siguiente intento
          await this.delay(delay);
          
          attempt++;
          continue;
        }
        
        // Si no hay error de lock, devolver el resultado
        // Login completado
        return result;
        
      } catch (error: any) {
        // Error en intento de login
        
        // Si es timeout o error de lock, reintentar
        if (error.message && (
          error.message.includes('timeout') ||
          error.message.includes('NavigatorLockAcquireTimeoutError') ||
          error.message.includes('lock')
        )) {
          await this.clearAuthLocks();
          
          const delay = Math.min(2000 * Math.pow(2, attempt), 8000);
          // Esperando antes del siguiente intento
          await this.delay(delay);
          
          attempt++;
          continue;
        }
        
        // Para otros errores, devolver inmediatamente
        // Error no recuperable en login
        return { data: null, error };
      }
    }
    
    // Se agotaron todos los intentos de login
    return { 
      data: null, 
      error: { 
        message: 'No se pudo conectar con el servidor. Verifique su conexión a internet e intente nuevamente.',
        __isAuthError: true,
        code: 'MAX_RETRIES_EXCEEDED'
      }
    };
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
        // Error buscando usuario por email
        return null;
      }

      return data;
    } catch (error) {
      // Error buscando usuario por email
      return null;
    }
  }

  // Registrar usuario
  signUp(email: string, password: string, nombre: string, rol: 'logistica' | 'residente' = 'logistica'): Observable<{ user: User | null; error: any }> {
    return from(
      this.supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: undefined // Deshabilitar redirección de email
        }
      })
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
        // Error creating user profile
      } else {
        // Cargar el perfil recién creado
        await this.loadUserProfile(userId);
        
        // Asignar automáticamente la primera obra disponible al usuario
        await this.assignDefaultObraToUser(userId, rol);
      }
    } catch (error) {
      // Error creating user profile
    }
  }

  private async assignDefaultObraToUser(userId: string, rol: 'logistica' | 'residente') {
    try {
      console.log('🔄 Asignando obra automáticamente al usuario:', userId);
      
      // Obtener la primera obra disponible
      const { data: obras, error: obrasError } = await this.supabase.db
        .from('obras')
        .select('id')
        .limit(1);

      if (obrasError || !obras || obras.length === 0) {
        console.warn('⚠️ No hay obras disponibles para asignar');
        return;
      }

      const obraId = obras[0].id;
      console.log('🏗️ Asignando obra:', obraId, 'al usuario:', userId);

      // Crear la asignación en user_obras
      const { error: assignError } = await this.supabase.db
        .from('user_obras')
        .insert({
          user_id: userId,
          obra_id: obraId,
          rol_obra: rol,
          assigned_at: new Date().toISOString()
        });

      if (assignError) {
        console.error('❌ Error al asignar obra automáticamente:', assignError);
      } else {
        console.log('✅ Obra asignada automáticamente exitosamente');
      }
    } catch (error) {
      console.error('💥 Error en asignación automática de obra:', error);
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
        // Error creating basic profile
      } else {
        // Cargar el perfil recién creado
        await this.loadUserProfile(userId);
      }
    } catch (error) {
      // Error creating basic profile
    }
  }

  // Forzar actualización del estado de autenticación
  async forceAuthStateUpdate(): Promise<void> {
    try {
      // Forzando actualización del estado de autenticación
      
      // Obtener la sesión actual
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        // Error obteniendo sesión
        return;
      }
      
      if (session?.user) {
        // Sesión válida encontrada, actualizando estado
        
        // Actualizar todos los subjects
        this.currentUserSubject.next(session.user);
        this.sessionSubject.next(session);
        
        // Cargar el perfil del usuario
        await this.loadUserProfile(session.user.id);
        
        // Estado de autenticación actualizado correctamente
      } else {
        // No hay sesión válida
        this.currentUserSubject.next(null);
        this.currentProfileSubject.next(null);
        this.sessionSubject.next(null);
      }
    } catch (error) {
      // Error forzando actualización del estado
    }
  }

  // Cerrar sesión
  signOut(): Observable<{ error: any }> {
    return from(
      this.supabase.auth.signOut()
    ).pipe(
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