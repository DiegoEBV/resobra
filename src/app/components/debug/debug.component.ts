import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ActividadesService } from '../../services/actividades.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-debug',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="debug-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>🔧 Diagnóstico de Actividades</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="debug-info">
            <h3>Usuario Actual:</h3>
            <pre>{{ userInfo | json }}</pre>
            
            <h3>Obras Asignadas:</h3>
            <pre>{{ userObras | json }}</pre>
            
            <h3>Últimas Actividades:</h3>
            <pre>{{ allActividades | json }}</pre>
            
            <h3>Actividades de Obras Asignadas:</h3>
            <pre>{{ obraActividades | json }}</pre>
            
            <div *ngIf="error" class="error">
              <h3>Error:</h3>
              <pre>{{ error | json }}</pre>
            </div>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="runDiagnostic()">Ejecutar Diagnóstico</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .debug-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .debug-info {
      margin: 20px 0;
    }
    pre {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      max-height: 300px;
      overflow-y: auto;
    }
    .error {
      color: red;
    }
    h3 {
      margin-top: 20px;
      margin-bottom: 10px;
    }
  `]
})
export class DebugComponent implements OnInit {
  userInfo: any = null;
  userObras: any[] = [];
  allActividades: any[] = [];
  obraActividades: any[] = [];
  error: any = null;

  constructor(
    private actividadesService: ActividadesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.runDiagnostic();
  }

  async runDiagnostic(): Promise<void> {
    try {
      this.error = null;
      console.log('🔧 [DEBUG COMPONENT] Iniciando diagnóstico...');
      
      // 1. Verificar configuración de Supabase
      console.log('🔧 [DEBUG] Verificando configuración de Supabase...');
      const supabaseClient = this.actividadesService['supabase'].client;
      console.log('🔧 [DEBUG] Cliente Supabase:', supabaseClient ? 'Configurado' : 'No configurado');
      
      // 2. Verificar estado de autenticación
      console.log('🔐 [DEBUG] Verificando estado de autenticación...');
      try {
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        console.log('🔐 [DEBUG] Sesión actual:', sessionData?.session ? 'Activa' : 'No activa');
        console.log('🔐 [DEBUG] Error de sesión:', sessionError);
        
        if (sessionData?.session?.user) {
          console.log('👤 [DEBUG] Usuario de sesión:', {
            id: sessionData.session.user.id,
            email: sessionData.session.user.email,
            role: sessionData.session.user.role
          });
        }
      } catch (authError: any) {
        console.error('❌ [DEBUG] Error verificando autenticación:', authError);
        if (authError.message?.includes('NavigatorLockAcquireTimeoutError')) {
          this.error = 'Error de locks de autenticación de Supabase. Esto puede deberse a múltiples pestañas abiertas o problemas de sincronización.';
          return;
        }
      }
      
      // 3. Obtener información del usuario del servicio
      const user = this.authService.getCurrentUser();
      const profile = this.authService.getCurrentProfile();
      
      this.userInfo = {
        user: user ? { id: user.id, email: user.email } : 'No autenticado',
        profile: profile ? { id: profile.id, nombre: profile.nombre, rol: profile.rol } : 'No profile'
      };
      
      console.log('👤 [DEBUG] Usuario del servicio:', this.userInfo);
      
      if (!user) {
        this.error = 'No hay usuario autenticado. Intente cerrar otras pestañas y volver a iniciar sesión.';
        return;
      }

      // 4. Verificar obras asignadas
      console.log('🔍 [DEBUG] Consultando user_obras...');
      const userObrasResult = await supabaseClient
        .from('user_obras')
        .select('*')
        .eq('user_id', user.id);
        
      this.userObras = userObrasResult.data || [];
      console.log('📊 [DEBUG] user_obras:', userObrasResult);
      
      // 5. Verificar todas las actividades
      console.log('🔍 [DEBUG] Consultando todas las actividades...');
      const allActResult = await supabaseClient
        .from('actividades')
        .select('id, titulo, obra_id, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
        
      this.allActividades = allActResult.data || [];
      console.log('📊 [DEBUG] Todas las actividades:', allActResult);
      
      // 6. Si hay obras asignadas, verificar actividades específicas
      if (this.userObras.length > 0) {
        const obraIds = this.userObras.map(uo => uo.obra_id);
        console.log('🔍 [DEBUG] Consultando actividades para obras:', obraIds);
        
        const obraActResult = await supabaseClient
          .from('actividades')
          .select('id, titulo, obra_id, user_id, created_at')
          .in('obra_id', obraIds)
          .order('created_at', { ascending: false });
          
        this.obraActividades = obraActResult.data || [];
        console.log('📊 [DEBUG] Actividades de obras asignadas:', obraActResult);
      }
      
      console.log('✅ [DEBUG] Diagnóstico completado');
      
    } catch (error) {
      console.error('❌ [DEBUG] Error en diagnóstico:', error);
      this.error = error;
    }
  }
}