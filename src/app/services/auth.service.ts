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
        console.log('🔄 AuthService: Locks limpiados, reintentando operaciones...');
        // Opcional: reintentar la última operación fallida
      }
    });
    
    this.loadInitialSession();
  }

  // Limpiar locks de autenticación de manera agresiva
  private async clearAuthLocks(): Promise<void> {
    try {
      console.log('🧹 Limpiando locks de autenticación...');
      
      // Usar el servicio de monitoreo para limpieza coordinada
      await this.lockMonitor.forceCleanLocks();
      
      console.log('✅ Locks de autenticación limpiados');
    } catch (error) {
      console.warn('⚠️ Error limpiando locks:', error);
    }
  }

  // Cargar sesión inicial con manejo robusto de locks
  private async loadInitialSession(): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        console.log(`🔄 Intento ${attempt + 1}/${maxRetries} de carga de sesión inicial...`);
        
        const sessionPromise = this.supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout - No se pudo cargar la sesión')), 30000)
        );
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (error) {
          console.warn(`⚠️ Error loading initial session (attempt ${attempt + 1}):`, error);
          
          // Si es un error de NavigatorLockAcquireTimeoutError, limpiar locks y reintentar
          if (error.message && (
            error.message.includes('NavigatorLockAcquireTimeoutError') ||
            error.message.includes('lock') ||
            error.message.includes('timeout')
          )) {
            console.log('🔓 Detected lock-related error, clearing locks and retrying...');
            await this.clearAuthLocks();
            
            // Esperar con exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
            console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
            await this.delay(delay);
            
            attempt++;
            continue;
          }
          
          // Para otros errores, salir del bucle
          console.error('❌ Error no relacionado con locks:', error);
          return;
        }

        // Éxito - procesar la sesión
        console.log('✅ Sesión cargada exitosamente');
        console.log('📋 Contenido de la sesión:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          sessionId: session?.access_token ? 'presente' : 'ausente'
        });
        
        if (session?.user) {
          console.log('👤 Usuario de sesión:', session.user.email);
          console.log('🔑 Token de acceso:', session.access_token ? 'presente' : 'ausente');
        }
        
        this.sessionSubject.next(session);
        this.currentUserSubject.next(session?.user || null);
        
        if (session?.user) {
          await this.loadUserProfile(session.user.id);
          console.log('🔐 Estado de autenticación actualizado a: true');
        } else {
          console.log('🔐 Estado de autenticación actualizado a: false');
          console.log('❌ No hay usuario en la sesión - usuario debe hacer login');
        }
        return;
        
      } catch (error: any) {
        console.warn(`⚠️ Error en intento ${attempt + 1}:`, error);
        
        // Si es timeout o error de lock, reintentar
        if (error.message && (
          error.message.includes('timeout') ||
          error.message.includes('NavigatorLockAcquireTimeoutError') ||
          error.message.includes('lock')
        )) {
          await this.clearAuthLocks();
          
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
          await this.delay(delay);
          
          attempt++;
          continue;
        }
        
        // Para otros errores, salir del bucle
        console.error('❌ Error no recuperable:', error);
        return;
      }
    }
    
    console.error('❌ Se agotaron todos los intentos de carga de sesión');
  }

  async loadSession(): Promise<void> {
    try {
      console.log('🔄 Cargando sesión...');
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error al cargar sesión:', error);
        this.sessionSubject.next(null);
        return;
      }
      
      console.log('✅ Sesión cargada exitosamente');
      console.log('📋 Contenido de la sesión:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        sessionId: session?.access_token ? 'presente' : 'ausente'
      });
      
      this.sessionSubject.next(session);
      this.currentUserSubject.next(session?.user || null);
      
      if (session?.user) {
        await this.loadUserProfile(session.user.id);
        console.log('🔐 Estado de autenticación actualizado a: true');
      } else {
        console.log('🔐 Estado de autenticación actualizado a: false');
        console.log('❌ No hay usuario en la sesión - usuario debe hacer login');
      }
    } catch (error) {
      console.error('❌ Error inesperado al cargar sesión:', error);
      this.sessionSubject.next(null);
    }
  }

  private async loadUserProfile(userId: string) {
    try {
      console.log('👤 Cargando perfil del usuario:', userId);
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

      if (data) {
        console.log('✅ Perfil cargado:', data.nombre, '-', data.rol);
        this.currentProfileSubject.next(data);
        console.log('📊 Perfil actualizado en BehaviorSubject');
      }
    } catch (error) {
      console.warn('Error loading user profile:', error);
      // Continuar sin perfil en lugar de fallar completamente
    }
  }

  // Iniciar sesión con manejo robusto de locks
  signIn(email: string, password: string): Observable<{ user: User | null; error: any }> {
    return from(this.signInWithRetry(email, password)).pipe(
      map(({ data, error }) => {
        // Si el login es exitoso, cargar el perfil del usuario
        if (data?.user && !error) {
          console.log('✅ Login exitoso para:', email);
          this.loadUserProfile(data.user.id);
          return { user: data.user, error: null };
        }
        
        // Manejar errores específicos de Supabase
        if (error) {
          console.log('❌ Error de autenticación:', error);
          console.log('📝 Mensaje de error:', error.message);
          
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
        console.log(`🔄 Intento de login ${attempt + 1}/${maxRetries} para: ${email}`);
        
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
          console.log(`🔓 Error de lock detectado en intento ${attempt + 1}, limpiando locks...`);
          await this.clearAuthLocks();
          
          // Esperar con exponential backoff
          const delay = Math.min(2000 * Math.pow(2, attempt), 8000);
          console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
          await this.delay(delay);
          
          attempt++;
          continue;
        }
        
        // Si no hay error de lock, devolver el resultado
        console.log(`✅ Login completado en intento ${attempt + 1}`);
        return result;
        
      } catch (error: any) {
        console.warn(`⚠️ Error en intento de login ${attempt + 1}:`, error);
        
        // Si es timeout o error de lock, reintentar
        if (error.message && (
          error.message.includes('timeout') ||
          error.message.includes('NavigatorLockAcquireTimeoutError') ||
          error.message.includes('lock')
        )) {
          await this.clearAuthLocks();
          
          const delay = Math.min(2000 * Math.pow(2, attempt), 8000);
          console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
          await this.delay(delay);
          
          attempt++;
          continue;
        }
        
        // Para otros errores, devolver inmediatamente
        console.error('❌ Error no recuperable en login:', error);
        return { data: null, error };
      }
    }
    
    console.error('❌ Se agotaron todos los intentos de login');
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

  // Forzar actualización del estado de autenticación
  async forceAuthStateUpdate(): Promise<void> {
    try {
      console.log('🔄 Forzando actualización del estado de autenticación...');
      
      // Obtener la sesión actual
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error obteniendo sesión:', error);
        return;
      }
      
      if (session?.user) {
        console.log('✅ Sesión válida encontrada, actualizando estado...');
        
        // Actualizar todos los subjects
        this.currentUserSubject.next(session.user);
        this.sessionSubject.next(session);
        
        // Cargar el perfil del usuario
        await this.loadUserProfile(session.user.id);
        
        console.log('✅ Estado de autenticación actualizado correctamente');
      } else {
        console.log('⚠️ No hay sesión válida');
        this.currentUserSubject.next(null);
        this.currentProfileSubject.next(null);
        this.sessionSubject.next(null);
      }
    } catch (error) {
      console.error('❌ Error forzando actualización del estado:', error);
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