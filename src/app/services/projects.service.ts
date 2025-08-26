import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Project } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {

  constructor(private supabase: SupabaseService) { }

  // Obtener todos los proyectos
  getAllProjects(): Observable<Project[]> {
    return from(
      this.supabase.client
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching projects:', error);
            throw error;
          }
          return data || [];
        })
    );
  }

  // Obtener proyecto por ID
  getProjectById(id: string): Observable<Project | null> {
    return from(
      this.supabase.client
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching project:', error);
            throw error;
          }
          return data;
        })
    );
  }

  // Crear nuevo proyecto
  createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Observable<Project> {
    return from(
      this.supabase.client
        .from('projects')
        .insert([project])
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error creating project:', error);
            throw error;
          }
          return data;
        })
    );
  }

  // Actualizar proyecto
  updateProject(id: string, updates: Partial<Project>): Observable<Project> {
    return from(
      this.supabase.client
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error updating project:', error);
            throw error;
          }
          return data;
        })
    );
  }

  // Eliminar proyecto
  deleteProject(id: string): Observable<void> {
    return from(
      this.supabase.client
        .from('projects')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Error deleting project:', error);
            throw error;
          }
        })
    );
  }
}