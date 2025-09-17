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
      // 🔧 [DEBUG COMPONENT] Iniciando diagnóstico...
      
      // 1. Verificar configuración de Supabase
      // 🔧 [DEBUG] Verificando configuración de Supabase...
      const supabaseClient = this.actividadesService['supabase'].client;
      // 🔧 [DEBUG] Cliente Supabase: configured check
      
      // 2. Verificar estado de autenticación
      // 🔐 [DEBUG] Verificando estado de autenticación...
      try {
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        // 🔐 [DEBUG] Sesión actual: session check
        // 🔐 [DEBUG] Error de sesión: error check
        
        if (sessionData?.session?.user) {
          // 👤 [DEBUG] Usuario de sesión: user info logged
        }
      } catch (authError: any) {
        // ❌ [DEBUG] Error verificando autenticación: logged
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
      
      // 👤 [DEBUG] Usuario del servicio: user info set
      
      if (!user) {
        this.error = 'No hay usuario autenticado. Intente cerrar otras pestañas y volver a iniciar sesión.';
        return;
      }

      // 4. Verificar obras asignadas
      // 🔍 [DEBUG] Consultando user_obras...
      const userObrasResult = await supabaseClient
        .from('user_obras')
        .select('*')
        .eq('user_id', user.id);
        
      this.userObras = userObrasResult.data || [];
      // 📊 [DEBUG] user_obras: result logged
      
      // 5. Verificar todas las actividades
      // 🔍 [DEBUG] Consultando todas las actividades...
      const allActResult = await supabaseClient
        .from('actividades')
        .select('id, titulo, obra_id, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
        
      this.allActividades = allActResult.data || [];
      // 📊 [DEBUG] Todas las actividades: result logged
      
      // 6. Si hay obras asignadas, verificar actividades específicas
      if (this.userObras.length > 0) {
        const obraIds = this.userObras.map(uo => uo.obra_id);
        // 🔍 [DEBUG] Consultando actividades para obras: obra IDs
        
        const obraActResult = await supabaseClient
          .from('actividades')
          .select('id, titulo, obra_id, user_id, created_at')
          .in('obra_id', obraIds)
          .order('created_at', { ascending: false });
          
        this.obraActividades = obraActResult.data || [];
        // 📊 [DEBUG] Actividades de obras asignadas: result logged
      }
      
      // ✅ [DEBUG] Diagnóstico completado
      
    } catch (error) {
      // ❌ [DEBUG] Error en diagnóstico: logged
      this.error = error;
    }
  }
}