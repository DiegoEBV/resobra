import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Tarea } from '../interfaces/database.interface';

@Injectable({
  providedIn: 'root'
})
export class TareasService {
  private tareasSubject = new BehaviorSubject<Tarea[]>([]);
  public tareas$ = this.tareasSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {
    console.log('🔧 [TareasService] Servicio inicializado');
  }

  // Crear nueva tarea
  async createTarea(tarea: Omit<Tarea, 'id' | 'created_at' | 'updated_at'>): Promise<Tarea> {
    try {
      console.log('📝 [TareasService] Creando nueva tarea:', tarea);
      
      const tareaData = {
        ...tarea,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase.client
        .from('tareas')
        .insert([tareaData])
        .select()
        .single();

      if (error) {
        console.error('❌ [TareasService] Error creando tarea:', error);
        throw error;
      }

      console.log('✅ [TareasService] Tarea creada exitosamente:', data);
      return data;
    } catch (error) {
      console.error('❌ [TareasService] Error en createTarea:', error);
      throw error;
    }
  }

  // Obtener tareas por actividad
  async getTareasByActividad(actividadId: string): Promise<Tarea[]> {
    try {
      console.log('🔍 [TareasService] Obteniendo tareas para actividad:', actividadId);
      
      const { data, error } = await this.supabase.client
        .from('tareas')
        .select('*')
        .eq('actividad_id', actividadId)
        .order('orden', { ascending: true });

      if (error) {
        console.error('❌ [TareasService] Error obteniendo tareas:', error);
        throw error;
      }

      console.log('✅ [TareasService] Tareas obtenidas:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ [TareasService] Error en getTareasByActividad:', error);
      return [];
    }
  }

  // Actualizar estado de tarea (completada/no completada)
  async updateTareaEstado(tareaId: string, completada: boolean): Promise<Tarea> {
    try {
      console.log('🔄 [TareasService] Actualizando estado de tarea:', tareaId, 'completada:', completada);
      
      const updateData: any = {
        completada,
        updated_at: new Date().toISOString()
      };

      // Si se marca como completada, agregar fecha de completado
      if (completada) {
        updateData.fecha_completado = new Date().toISOString();
      } else {
        updateData.fecha_completado = null;
      }

      const { data, error } = await this.supabase.client
        .from('tareas')
        .update(updateData)
        .eq('id', tareaId)
        .select()
        .single();

      if (error) {
        console.error('❌ [TareasService] Error actualizando tarea:', error);
        throw error;
      }

      console.log('✅ [TareasService] Estado de tarea actualizado:', data);
      return data;
    } catch (error) {
      console.error('❌ [TareasService] Error en updateTareaEstado:', error);
      throw error;
    }
  }

  // Actualizar tarea completa
  async updateTarea(tareaId: string, updates: Partial<Tarea>): Promise<Tarea> {
    try {
      console.log('🔄 [TareasService] Actualizando tarea:', tareaId, updates);
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase.client
        .from('tareas')
        .update(updateData)
        .eq('id', tareaId)
        .select()
        .single();

      if (error) {
        console.error('❌ [TareasService] Error actualizando tarea:', error);
        throw error;
      }

      console.log('✅ [TareasService] Tarea actualizada:', data);
      return data;
    } catch (error) {
      console.error('❌ [TareasService] Error en updateTarea:', error);
      throw error;
    }
  }

  // Eliminar tarea
  async deleteTarea(tareaId: string): Promise<void> {
    try {
      console.log('🗑️ [TareasService] Eliminando tarea:', tareaId);
      
      const { error } = await this.supabase.client
        .from('tareas')
        .delete()
        .eq('id', tareaId);

      if (error) {
        console.error('❌ [TareasService] Error eliminando tarea:', error);
        throw error;
      }

      console.log('✅ [TareasService] Tarea eliminada exitosamente');
    } catch (error) {
      console.error('❌ [TareasService] Error en deleteTarea:', error);
      throw error;
    }
  }

  // Calcular progreso de actividad basado en tareas
  async calcularProgresoActividad(actividadId: string): Promise<number> {
    try {
      console.log('📊 [TareasService] Calculando progreso para actividad:', actividadId);
      
      const tareas = await this.getTareasByActividad(actividadId);
      
      if (tareas.length === 0) {
        console.log('📊 [TareasService] No hay tareas, progreso: 0%');
        return 0;
      }

      const tareasCompletadas = tareas.filter(tarea => tarea.completada).length;
      const progreso = Math.round((tareasCompletadas / tareas.length) * 100);
      
      console.log(`📊 [TareasService] Progreso calculado: ${tareasCompletadas}/${tareas.length} = ${progreso}%`);
      return progreso;
    } catch (error) {
      console.error('❌ [TareasService] Error calculando progreso:', error);
      return 0;
    }
  }

  // Obtener estadísticas de tareas por actividad
  async getEstadisticasTareas(actividadId: string): Promise<{
    total: number;
    completadas: number;
    pendientes: number;
    progreso: number;
  }> {
    try {
      const tareas = await this.getTareasByActividad(actividadId);
      const completadas = tareas.filter(tarea => tarea.completada).length;
      const pendientes = tareas.length - completadas;
      const progreso = tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0;

      return {
        total: tareas.length,
        completadas,
        pendientes,
        progreso
      };
    } catch (error) {
      console.error('❌ [TareasService] Error obteniendo estadísticas:', error);
      return {
        total: 0,
        completadas: 0,
        pendientes: 0,
        progreso: 0
      };
    }
  }

  // Reordenar tareas
  async reordenarTareas(actividadId: string, tareasOrdenadas: { id: string; orden: number }[]): Promise<void> {
    try {
      console.log('🔄 [TareasService] Reordenando tareas para actividad:', actividadId);
      
      for (const tarea of tareasOrdenadas) {
        await this.supabase.client
          .from('tareas')
          .update({ 
            orden: tarea.orden,
            updated_at: new Date().toISOString()
          })
          .eq('id', tarea.id);
      }

      console.log('✅ [TareasService] Tareas reordenadas exitosamente');
    } catch (error) {
      console.error('❌ [TareasService] Error reordenando tareas:', error);
      throw error;
    }
  }
}