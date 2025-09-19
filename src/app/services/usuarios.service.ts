import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { DirectAuthService } from './direct-auth.service';
import { Usuario, CrearUsuarioRequest, ActualizarUsuarioRequest, FiltrosUsuario } from '../interfaces/usuario.interface';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private supabase: SupabaseClient;

  constructor(private directAuthService: DirectAuthService) {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          storageKey: 'usuarios-service-auth'
        }
      }
    );
  }

  /**
   * Obtiene la lista de usuarios con filtros opcionales
   */
  async getUsuarios(filtros?: FiltrosUsuario): Promise<Usuario[]> {
    try {
      console.log('Obteniendo usuarios desde Supabase...');
      
      // Configurar autenticación
      const token = this.directAuthService.getAccessToken();
      if (token) {
        await this.supabase.auth.setSession({
          access_token: token,
          refresh_token: ''
        });
      }

      let query = this.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtros) {
        if (filtros.busqueda) {
          query = query.or(`nombre.ilike.%${filtros.busqueda}%,email.ilike.%${filtros.busqueda}%`);
        }
        
        if (filtros.rol && filtros.rol !== 'todos') {
          query = query.eq('rol', filtros.rol);
        }
        
        if (filtros.activo !== null && filtros.activo !== undefined) {
          query = query.eq('activo', filtros.activo);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al obtener usuarios:', error);
        throw error;
      }

      console.log('Usuarios obtenidos:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('Error en getUsuarios:', error);
      throw error;
    }
  }

  /**
   * Obtiene un usuario por su ID
   */
  async getUsuarioById(id: string): Promise<Usuario | null> {
    try {
      console.log('Obteniendo usuario por ID:', id);
      
      // Configurar autenticación
      const token = this.directAuthService.getAccessToken();
      if (token) {
        await this.supabase.auth.setSession({
          access_token: token,
          refresh_token: ''
        });
      }

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error al obtener usuario:', error);
        throw error;
      }

      return data;

    } catch (error) {
      console.error('Error en getUsuarioById:', error);
      throw error;
    }
  }

  /**
   * Obtiene las obras disponibles para asignar a usuarios
   */
  async getObrasDisponibles(): Promise<any[]> {
    try {
      console.log('Obteniendo obras disponibles...');
      
      // Configurar autenticación
      const token = this.directAuthService.getAccessToken();
      if (token) {
        await this.supabase.auth.setSession({
          access_token: token,
          refresh_token: ''
        });
      }

      const { data, error } = await this.supabase
        .from('obras')
        .select('id, nombre, descripcion, estado')
        .order('nombre');

      if (error) {
        console.error('Error al obtener obras:', error);
        throw error;
      }

      console.log('Obras obtenidas:', data?.length || 0);
      return data || [];

    } catch (error) {
      console.error('Error en getObrasDisponibles:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo usuario
   */
  async createUsuario(usuario: CrearUsuarioRequest): Promise<Usuario> {
    try {
      console.log('Creando usuario:', usuario.email);
      
      // Configurar autenticación
       const token = this.directAuthService.getAccessToken();
       if (token) {
         await this.supabase.auth.setSession({
           access_token: token,
           refresh_token: ''
         });
       }

      // Validar que las contraseñas coincidan
      if (usuario.password !== usuario.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      // Validar fortaleza de contraseña
      if (!this.validarPassword(usuario.password)) {
        throw new Error('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números');
      }

      // Verificar que el email no exista
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', usuario.email)
        .single();

      if (existingUser) {
        throw new Error('Ya existe un usuario con este email');
      }

      // Crear usuario en auth.users (Supabase Auth)
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: usuario.email,
        password: usuario.password,
        options: {
          data: {
            nombre: usuario.nombre,
            rol: usuario.rol
          }
        }
      });

      if (authError) {
        console.error('Error al crear usuario en auth:', authError);
        throw authError;
      }

      // Crear usuario en la tabla users
      const nuevoUsuario = {
        id: authData.user?.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        activo: true
      };

      const { data, error } = await this.supabase
        .from('users')
        .insert([nuevoUsuario])
        .select()
        .single();

      if (error) {
        console.error('Error al crear usuario en tabla users:', error);
        // Si falla la inserción en users, eliminar el usuario de auth
        if (authData.user?.id) {
          await this.supabase.auth.admin.deleteUser(authData.user.id);
        }
        throw error;
      }

      // Si se especificó una obra, crear la asignación en user_obras
      if (usuario.obra_id && authData.user?.id) {
        try {
          console.log('Intentando asignar obra:', {
            user_id: authData.user.id,
            obra_id: usuario.obra_id,
            rol_obra: usuario.rol
          });

          // Usar el service role key para la inserción en user_obras
          const { error: obraError } = await this.supabase
            .from('user_obras')
            .insert({
              user_id: authData.user.id,
              obra_id: usuario.obra_id,
              rol_obra: usuario.rol,
              assigned_at: new Date().toISOString()
            });

          if (obraError) {
            console.error('Error detallado al asignar obra al usuario:', {
              error: obraError,
              message: obraError.message,
              details: obraError.details,
              hint: obraError.hint,
              code: obraError.code
            });
            // No lanzar error aquí, el usuario ya fue creado exitosamente
            console.warn('Usuario creado pero no se pudo asignar la obra');
          } else {
            console.log('✅ Obra asignada exitosamente al usuario');
            
            // Verificar que se insertó correctamente
            const { data: verification, error: verifyError } = await this.supabase
              .from('user_obras')
              .select('*')
              .eq('user_id', authData.user.id)
              .eq('obra_id', usuario.obra_id);
            
            if (verifyError) {
              console.error('Error al verificar inserción:', verifyError);
            } else {
              console.log('✅ Verificación exitosa - Registro encontrado:', verification);
            }
          }
        } catch (obraAssignError) {
          console.error('Error en asignación de obra:', obraAssignError);
        }
      }

      console.log('Usuario creado exitosamente:', data.id);
      return data;

    } catch (error) {
      console.error('Error en createUsuario:', error);
      throw error;
    }
  }

  /**
   * Actualiza un usuario existente
   */
  async updateUsuario(id: string, updates: ActualizarUsuarioRequest): Promise<Usuario> {
    try {
      console.log('Actualizando usuario:', id);
      
      // Configurar autenticación
       const token = this.directAuthService.getAccessToken();
       if (token) {
         await this.supabase.auth.setSession({
           access_token: token,
           refresh_token: ''
         });
       }

      // Si se actualiza el email, verificar que no exista
      if (updates.email) {
        const { data: existingUser } = await this.supabase
          .from('users')
          .select('id')
          .eq('email', updates.email)
          .neq('id', id)
          .single();

        if (existingUser) {
          throw new Error('Ya existe un usuario con este email');
        }
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar usuario:', error);
        throw error;
      }

      // Si se actualiza el email, también actualizar en auth.users
      if (updates.email) {
        await this.supabase.auth.admin.updateUserById(id, {
          email: updates.email
        });
      }

      console.log('Usuario actualizado exitosamente:', data.id);
      return data;

    } catch (error) {
      console.error('Error en updateUsuario:', error);
      throw error;
    }
  }

  /**
   * Elimina un usuario
   */
  async deleteUsuario(id: string): Promise<void> {
    try {
      console.log('Eliminando usuario:', id);
      
      // Configurar autenticación
       const token = this.directAuthService.getAccessToken();
       if (token) {
         await this.supabase.auth.setSession({
           access_token: token,
           refresh_token: ''
         });
       }

      // Eliminar de la tabla users
      const { error: deleteError } = await this.supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error al eliminar usuario de tabla users:', deleteError);
        throw deleteError;
      }

      // Eliminar de auth.users
      const { error: authError } = await this.supabase.auth.admin.deleteUser(id);
      
      if (authError) {
        console.error('Error al eliminar usuario de auth:', authError);
        // No lanzar error aquí ya que el usuario ya fue eliminado de la tabla users
      }

      console.log('Usuario eliminado exitosamente:', id);

    } catch (error) {
      console.error('Error en deleteUsuario:', error);
      throw error;
    }
  }

  /**
   * Cambia la contraseña de un usuario
   */
  async cambiarPassword(id: string, newPassword: string): Promise<void> {
    try {
      console.log('Cambiando contraseña para usuario:', id);
      
      // Configurar autenticación
       const token = this.directAuthService.getAccessToken();
       if (token) {
         await this.supabase.auth.setSession({
           access_token: token,
           refresh_token: ''
         });
       }

      // Validar fortaleza de contraseña
      if (!this.validarPassword(newPassword)) {
        throw new Error('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números');
      }

      const { error } = await this.supabase.auth.admin.updateUserById(id, {
        password: newPassword
      });

      if (error) {
        console.error('Error al cambiar contraseña:', error);
        throw error;
      }

      console.log('Contraseña cambiada exitosamente para usuario:', id);

    } catch (error) {
      console.error('Error en cambiarPassword:', error);
      throw error;
    }
  }

  /**
   * Activa o desactiva un usuario
   */
  async toggleUsuarioActivo(id: string): Promise<Usuario> {
    try {
      console.log('Cambiando estado activo del usuario:', id);
      
      // Obtener estado actual
      const usuario = await this.getUsuarioById(id);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      // Cambiar estado
      const nuevoEstado = !usuario.activo;
      
      return await this.updateUsuario(id, { activo: nuevoEstado });

    } catch (error) {
      console.error('Error en toggleUsuarioActivo:', error);
      throw error;
    }
  }

  /**
   * Valida la fortaleza de una contraseña
   */
  private validarPassword(password: string): boolean {
    // Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  }

  /**
   * Verifica si el usuario actual tiene permisos de residente
   */
  async verificarPermisosResidente(): Promise<boolean> {
    try {
      const currentUser = this.directAuthService.getCurrentUser();
      if (!currentUser) {
        return false;
      }

      const usuario = await this.getUsuarioById(currentUser.id);
      return usuario?.rol === 'residente';

    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de usuarios
   */
  async getEstadisticasUsuarios(): Promise<{
    total: number;
    activos: number;
    inactivos: number;
    residentes: number;
    logistica: number;
  }> {
    try {
      const usuarios = await this.getUsuarios();
      
      return {
        total: usuarios.length,
        activos: usuarios.filter(u => u.activo !== false).length,
        inactivos: usuarios.filter(u => u.activo === false).length,
        residentes: usuarios.filter(u => u.rol === 'residente').length,
        logistica: usuarios.filter(u => u.rol === 'logistica').length
      };

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }
}