import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, timeout, retryWhen, concatMap, finalize } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements HttpInterceptor {
  private readonly DEFAULT_TIMEOUT = 30000; // 30 segundos
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 2000; // 2 segundos

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Configurar timeout más largo para requests de autenticación
    const timeoutDuration = this.getTimeoutForRequest(req);
    
    console.log(`⏱️ Configurando timeout de ${timeoutDuration}ms para:`, req.url);

    return next.handle(req).pipe(
      timeout(timeoutDuration),
      retryWhen(errors => 
        errors.pipe(
          concatMap((error, attempt) => {
            // Solo reintentar para errores de timeout o conexión
            if (this.shouldRetry(error, attempt)) {
              const delay = this.RETRY_DELAY * Math.pow(2, attempt);
              console.log(`🔄 Reintentando request después de timeout (intento ${attempt + 1}/${this.MAX_RETRIES}) en ${delay}ms`);
              console.log(`📍 URL: ${req.url}`);
              
              return timer(delay);
            }
            
            // Para otros errores o si se agotaron los reintentos, propagar el error
            return throwError(() => error);
          })
        )
      ),
      catchError((error: any) => {
        // Mejorar el manejo de errores de timeout
        if (error.name === 'TimeoutError') {
          console.error('❌ Timeout definitivo en request:', {
            url: req.url,
            timeout: timeoutDuration,
            method: req.method
          });
          
          const timeoutError = new HttpErrorResponse({
            error: {
              message: 'La solicitud ha tardado demasiado tiempo. Por favor, verifica tu conexión a internet.',
              code: 'TIMEOUT_ERROR',
              originalError: error
            },
            status: 0,
            statusText: 'Timeout',
            url: req.url || undefined
          });
          
          return throwError(() => timeoutError);
        }
        
        // Para errores de conexión
        if (error.status === 0 && error.error instanceof ProgressEvent) {
          console.error('❌ Error de conexión:', {
            url: req.url,
            error: error.message
          });
          
          const connectionError = new HttpErrorResponse({
            error: {
              message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
              code: 'CONNECTION_ERROR',
              originalError: error
            },
            status: 0,
            statusText: 'Connection Error',
            url: req.url || undefined
          });
          
          return throwError(() => connectionError);
        }
        
        return throwError(() => error);
      })
    );
  }

  private getTimeoutForRequest(req: HttpRequest<any>): number {
    const url = req.url.toLowerCase();
    
    // Timeouts más largos para operaciones de autenticación
    if (url.includes('/auth/') || url.includes('supabase.co/auth/')) {
      return 45000; // 45 segundos para auth
    }
    
    // Timeouts más largos para uploads
    if (req.method === 'POST' && (url.includes('/storage/') || url.includes('upload'))) {
      return 60000; // 60 segundos para uploads
    }
    
    // Timeout por defecto
    return this.DEFAULT_TIMEOUT;
  }

  private shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.MAX_RETRIES) {
      return false;
    }
    
    // Reintentar para timeouts
    if (error.name === 'TimeoutError') {
      return true;
    }
    
    // Reintentar para errores de conexión
    if (error.status === 0 && error.error instanceof ProgressEvent) {
      return true;
    }
    
    // Reintentar para errores 5xx del servidor
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    
    return false;
  }
}