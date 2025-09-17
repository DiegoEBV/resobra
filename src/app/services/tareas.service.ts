import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Tarea } from '../interfaces/database.interface';

@Injectable({
  providedIn: 'root'
})
export class TareasService {
  private tareasSubject = new BehaviorSubject<Tarea[]>([]);
  public tareas$ = this.tareasSubject.asObservable();

  constructor(private supabase: SupabaseService) {
  }

  // Crear nueva tarea
  async createTarea(tarea: Omit<Tarea, 'id' | 'created_at' | 'updated_at' | 'fecha_creacion'>): Promise<Tarea | null> {
    try {
      const tareaData = {
        actividad_id: tarea.actividad_id,
        nombre: tarea.nombre,
        descripcion: tarea.descripcion,
        orden: tarea.orden || 0,
        completada: tarea.completada || false,
        fecha_creacion: new Date().toISOString()
      };

      const { data, error } = await this.supabase.client
        .from('tareas')
        .insert([tareaData])
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Obtener tareas por actividad
  async getTareasByActividad(actividadId: string): Promise<Tarea[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('tareas')
        .select('*')
        .eq('actividad_id', actividadId)
        .order('orden', { ascending: true });

      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      throw error;
    }
  }

  // Actualizar estado de tarea (completada/no completada)
  async updateTareaEstado(tareaId: string, completada: boolean): Promise<Tarea | null> {
    try {
      const updateData = {
        completada,
        fecha_completado: completada ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase.client
        .from('tareas')
        .update(updateData)
        .eq('id', tareaId)
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Actualizar tarea completa
  async updateTarea(tareaId: string, updates: Partial<Tarea>): Promise<Tarea | null> {
    try {
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
        throw error;
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar tarea
  async deleteTarea(tareaId: string): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('tareas')
        .delete()
        .eq('id', tareaId);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  // Calcular progreso de actividad basado en tareas
  async calcularProgresoActividad(actividadId: string): Promise<number> {
    try {
      const tareas = await this.getTareasByActividad(actividadId);
      
      if (tareas.length === 0) {
        return 0;
      }
      
      const tareasCompletadas = tareas.filter(t => t.completada).length;
      const progreso = Math.round((tareasCompletadas / tareas.length) * 100);
      
      return progreso;
    } catch (error) {
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
      return {
        total: 0,
        completadas: 0,
        pendientes: 0,
        progreso: 0
      };
    }
  }

  // Reordenar tareas
  async reorderTareas(actividadId: string, tareasOrdenadas: { id: string; orden: number }[]): Promise<void> {
    try {
      // Actualizar el orden de cada tarea
      for (const tarea of tareasOrdenadas) {
        await this.supabase.client
          .from('tareas')
          .update({ orden: tarea.orden })
          .eq('id', tarea.id);
      }
    } catch (error) {
      throw error;
    }
  }
}