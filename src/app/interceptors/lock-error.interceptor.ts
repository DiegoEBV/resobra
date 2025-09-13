import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retryWhen, concatMap, finalize } from 'rxjs/operators';

@Injectable()
export class LockErrorInterceptor implements HttpInterceptor {
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 segundo base

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retryWhen(errors => 
        errors.pipe(
          concatMap((error, attempt) => {
            // Solo reintentar para errores relacionados con locks
            if (this.isLockError(error) && attempt < this.maxRetries) {
              const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
              console.log(`🔄 Reintentando request después de error de lock (intento ${attempt + 1}/${this.maxRetries}) en ${delay}ms`);
              
              // Limpiar locks antes de reintentar
              this.clearLocks();
              
              return timer(delay);
            }
            
            // Para otros errores o si se agotaron los reintentos, propagar el error
            return throwError(() => error);
          })
        )
      ),
      catchError((error: HttpErrorResponse) => {
        // Log del error final si no se pudo resolver
        if (this.isLockError(error)) {
          console.error('❌ Error de lock no resuelto después de reintentos:', error);
          
          // Limpiar locks una vez más
          this.clearLocks();
          
          // Transformar el error para el usuario
          const userFriendlyError = new HttpErrorResponse({
            error: error.error,
            headers: error.headers,
            status: error.status,
            statusText: error.statusText,
            url: error.url || undefined
          });
          
          return throwError(() => userFriendlyError);
        }
        
        return throwError(() => error);
      })
    );
  }

  private isLockError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.error?.message || '';
    
    return errorMessage.includes('NavigatorLockAcquireTimeoutError') ||
           errorMessage.includes('lock') ||
           errorMessage.includes('timeout') ||
           (error.status === 0 && errorMessage.includes('Unknown Error'));
  }

  private clearLocks(): void {
    try {
      console.log('🔓 Interceptor: Limpiando locks...');
      
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
          console.warn(`⚠️ Error removing lock key ${key}:`, e);
        }
      });
      
      console.log('✅ Interceptor: Locks limpiados');
    } catch (error) {
      console.warn('❌ Interceptor: Error limpiando locks:', error);
    }
  }
}