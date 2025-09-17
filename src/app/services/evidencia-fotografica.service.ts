import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable, from, throwError, timer } from 'rxjs';
import { map, catchError, switchMap, retry, retryWhen, delayWhen, take } from 'rxjs/operators';

export interface EvidenciaFotografica {
  id?: string;
  actividad_id: string;
  url_imagen: string;
  descripcion?: string | null;
  fecha_subida?: string;
  subido_por?: string;
  nombre_archivo?: string;
  tamaño_archivo?: number;
  tipo_archivo?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class EvidenciaFotograficaService {
  private evidenciasSubject = new BehaviorSubject<EvidenciaFotografica[]>([]);
  public evidencias$ = this.evidenciasSubject.asObservable();
  
  private uploadProgressSubject = new BehaviorSubject<UploadProgress | null>(null);
  public uploadProgress$ = this.uploadProgressSubject.asObservable();

  // Configuración de validación
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly STORAGE_BUCKET = 'evidencia-fotografica';
  
  // Configuración de retry
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 segundo
  
  // Control de concurrencia mejorado
  private uploadQueue: Map<string, Promise<any>> = new Map();
  private bucketInitialized = false;
  private maxConcurrentUploads = 2; // Reducido para evitar timeouts
  private activeUploads = 0;
  private lockTimeout = 10000; // 10 segundos timeout para locks
  private uploadSemaphore: Promise<void> = Promise.resolve();

  constructor(private supabaseService: SupabaseService) {
    this.initializeStorageBucket();
  }

  /**
   * Inicializa el bucket de storage si no existe
   */
  private async initializeStorageBucket(): Promise<void> {
    if (this.bucketInitialized) {
      return;
    }

    try {
      // Verificar si el bucket existe
      const { data: buckets, error: listError } = await this.supabaseService.storage.listBuckets();
      
      if (listError) {
        throw listError;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === this.STORAGE_BUCKET);
      
      if (!bucketExists) {
        const { error: createError } = await this.supabaseService.storage.createBucket(this.STORAGE_BUCKET, {
          public: false,
          allowedMimeTypes: this.ALLOWED_TYPES,
          fileSizeLimit: this.MAX_FILE_SIZE
        });
        
        if (createError) {
          // No lanzar error aquí, el bucket puede existir pero no ser visible
          // debido a permisos. Intentaremos usarlo de todas formas.
        }
      }
      
      this.bucketInitialized = true;
    } catch (error) {
      // Marcar como inicializado para evitar intentos repetidos
      this.bucketInitialized = true;
    }
  }

  /**
   * Valida un archivo antes de subirlo
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no permitido. Solo se permiten: ${this.ALLOWED_TYPES.join(', ')}`
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `El archivo es demasiado grande. Tamaño máximo: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Sube una imagen al storage y guarda la referencia en la base de datos
   */
  async subirEvidencia(file: File, actividadId: string, descripcion?: string): Promise<EvidenciaFotografica> {
    this.logInfo('subirEvidencia', '🚀 INICIANDO SUBIDA DE EVIDENCIA', { 
      fileName: file.name, 
      fileSize: file.size,
      fileType: file.type,
      actividadId,
      timestamp: new Date().toISOString()
    });
    
    // Validar archivo
    this.logDebug('subirEvidencia', '📋 Validando archivo', { fileName: file.name });
    const validationResult = this.validateFile(file);
    if (!validationResult.valid) {
      const error = new Error(`Archivo inválido: ${validationResult.error}`);
      this.logError('subirEvidencia', '❌ ERROR DE VALIDACIÓN', { fileName: file.name, validationError: validationResult.error });
      throw error;
    }
    this.logDebug('subirEvidencia', '✅ Archivo validado correctamente', { fileName: file.name });

    // Obtener slot de subida
    this.logDebug('subirEvidencia', '🎫 Obteniendo slot de subida', { fileName: file.name });
    const slotId = await this.acquireUploadSlot(file.name);
    this.logDebug('subirEvidencia', '✅ Slot obtenido', { fileName: file.name, slotId });
    
    try {
      // Actualizar progreso
      this.updateProgress(file.name, 0, 'Iniciando subida...');
      this.logDebug('subirEvidencia', '📊 Progreso actualizado: 0%', { fileName: file.name });
      
      const result = await this.performUploadWithRetry(file, actividadId, descripcion, slotId);
      
      this.logInfo('subirEvidencia', '🎉 EVIDENCIA SUBIDA EXITOSAMENTE', { 
        fileName: file.name, 
        actividadId,
        evidenciaId: result.id,
        urlImagen: result.url_imagen,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } finally {
      this.logDebug('subirEvidencia', '🔓 Liberando slot de subida', { fileName: file.name, slotId });
      this.releaseUploadSlot(slotId);
    }
  }

  /**
   * Adquiere un slot para subida con control de concurrencia
   */
  private async acquireUploadSlot(uploadId: string): Promise<string> {
    this.logDebug('acquireUploadSlot', 'Esperando slot disponible', { uploadId, activeUploads: this.activeUploads });
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.logError('acquireUploadSlot', 'Timeout esperando slot', { uploadId, timeout: this.lockTimeout });
        reject(new Error('Timeout esperando slot de subida disponible'));
      }, this.lockTimeout);

      const checkSlot = () => {
        if (this.activeUploads < this.maxConcurrentUploads) {
          this.activeUploads++;
          clearTimeout(timeout);
          this.logDebug('acquireUploadSlot', 'Slot adquirido', { uploadId, activeUploads: this.activeUploads });
          resolve(uploadId);
        } else {
          // Esperar un poco y volver a intentar
          setTimeout(checkSlot, 100);
        }
      };
      
      checkSlot();
    });
  }

  /**
   * Libera un slot de subida
   */
  private releaseUploadSlot(slotId: string): void {
    this.activeUploads = Math.max(0, this.activeUploads - 1);
    this.logDebug('releaseUploadSlot', 'Slot liberado', { slotId, activeUploads: this.activeUploads });
  }

  /**
   * Actualiza el progreso de subida
   */
  private updateProgress(fileName: string, percentage: number, message: string): void {
    const progress: UploadProgress = {
      loaded: percentage,
      total: 100,
      percentage
    };
    this.uploadProgressSubject.next(progress);
    this.logDebug('updateProgress', message, { fileName, percentage });
  }

  /**
   * Realiza la subida con retry logic mejorado
   */
  private async performUploadWithRetry(
    file: File,
    actividadId: string, 
    descripcion: string | undefined, 
    slotId: string,
    maxRetries: number = 3
  ): Promise<EvidenciaFotografica> {
    let lastError: Error;
    
    this.logInfo('performUploadWithRetry', '🔄 INICIANDO PROCESO DE SUBIDA CON REINTENTOS', {
      fileName: file.name,
      actividadId,
      slotId,
      maxRetries,
      timestamp: new Date().toISOString()
    });
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logInfo('performUploadWithRetry', `🎯 INTENTO ${attempt}/${maxRetries}`, { 
          fileName: file.name, 
          actividadId,
          slotId,
          attempt 
        });
        
        const result = await this.performUpload(file, actividadId, descripcion, slotId);
        
        this.logInfo('performUploadWithRetry', '✅ UPLOAD EXITOSO EN INTENTO', { 
          fileName: file.name, 
          actividadId,
          slotId,
          attempt,
          evidenciaId: result.id,
          urlImagen: result.url_imagen,
          timestamp: new Date().toISOString()
        });
        
        return result;
      } catch (error) {
        lastError = error as Error;
        this.logError('performUploadWithRetry', `❌ INTENTO ${attempt} FALLÓ`, { 
          fileName: file.name, 
          actividadId,
          slotId,
          attempt,
          errorName: lastError.name,
          errorMessage: lastError.message,
          errorStack: lastError.stack
        });
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
          this.logInfo('performUploadWithRetry', `⏳ ESPERANDO ${delay}ms ANTES DEL SIGUIENTE INTENTO`, { 
            fileName: file.name,
            slotId,
            delay,
            nextAttempt: attempt + 1
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    this.logError('performUploadWithRetry', '💥 TODOS LOS INTENTOS FALLARON', { 
      fileName: file.name,
      actividadId,
      slotId,
      maxRetries,
      finalError: lastError!.message,
      timestamp: new Date().toISOString()
    });
    throw lastError!;
  }

  /**
   * Realiza la subida del archivo
   */
  private async performUpload(
    file: File,
    actividadId: string, 
    descripcion: string | undefined, 
    slotId: string
  ): Promise<EvidenciaFotografica> {
    this.logInfo('performUpload', '🔧 INICIANDO PERFORM UPLOAD', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      actividadId,
      slotId,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Asegurar que el bucket existe
      this.logDebug('performUpload', '🪣 Verificando bucket existe', { slotId });
      await this.ensureBucketExists();
      this.logDebug('performUpload', '✅ Bucket verificado', { slotId });
      
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${actividadId}_${timestamp}_${randomString}.${fileExtension}`;
      const filePath = `evidencias/${fileName}`;
      
      this.logInfo('performUpload', '📁 ARCHIVO PREPARADO PARA SUBIDA', { 
        originalName: file.name,
        generatedFileName: fileName, 
        filePath, 
        fileSize: file.size,
        slotId
      });
      
      // Actualizar progreso
      this.updateProgress(file.name, 25, 'Subiendo archivo...');
      this.logDebug('performUpload', '📊 Progreso actualizado: 25%', { fileName: file.name, slotId });
      
      // Subir archivo a Supabase Storage
      this.logInfo('performUpload', '☁️ SUBIENDO ARCHIVO A SUPABASE STORAGE', { 
        filePath,
        bucketName: 'evidencia-fotografica',
        slotId
      });
      
      const { data: uploadData, error: uploadError } = await this.supabaseService.client
        .storage
        .from('evidencia-fotografica')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        this.logError('performUpload', '❌ ERROR SUBIENDO ARCHIVO A STORAGE', { 
          slotId, 
          filePath,
          errorMessage: uploadError.message,
          errorDetails: uploadError
        });
        throw new Error(`Error subiendo archivo: ${uploadError.message}`);
      }
      
      this.logInfo('performUpload', '✅ ARCHIVO SUBIDO A STORAGE EXITOSAMENTE', { 
        slotId, 
        filePath, 
        uploadPath: uploadData?.path,
        uploadId: uploadData?.id
      });
      
      // Actualizar progreso
      this.updateProgress(file.name, 75, 'Guardando en base de datos...');
      this.logDebug('performUpload', '📊 Progreso actualizado: 75%', { fileName: file.name, slotId });
      
      // Obtener URL pública del archivo
      this.logDebug('performUpload', '🔗 Obteniendo URL pública', { slotId, filePath });
      const { data: urlData } = this.supabaseService.client
        .storage
        .from('evidencia-fotografica')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;
      this.logInfo('performUpload', '✅ URL PÚBLICA OBTENIDA', { slotId, publicUrl });
      
      // Obtener ID del usuario actual
      const currentUserId = await this.supabaseService.getCurrentUserId();
      this.logDebug('performUpload', '👤 Usuario actual obtenido', { slotId, currentUserId });
      
      // Guardar referencia en la base de datos
      const evidenciaData = {
        actividad_id: actividadId,
        url_imagen: publicUrl,
        descripcion: descripcion || null,
        subido_por: currentUserId,
        nombre_archivo: file.name,
        tamaño_archivo: file.size,
        tipo_archivo: file.type
      };
      
      this.logInfo('performUpload', '💾 GUARDANDO EN BASE DE DATOS', { 
        slotId, 
        evidenciaData: {
          ...evidenciaData,
          subido_por: currentUserId ? 'USER_ID_SET' : 'NO_USER_ID'
        }
      });
      
      const { data: evidencia, error: dbError } = await this.supabaseService.client
        .from('evidencia_fotografica')
        .insert(evidenciaData)
        .select()
        .single();
      
      if (dbError) {
        this.logError('performUpload', '❌ ERROR GUARDANDO EN BASE DE DATOS', { 
          slotId, 
          evidenciaData,
          errorCode: dbError.code,
          errorMessage: dbError.message,
          errorDetails: dbError,
          errorHint: dbError.hint
        });
        
        // Intentar limpiar el archivo subido si falla la inserción en BD
        this.logInfo('performUpload', '🧹 LIMPIANDO ARCHIVO DESPUÉS DE ERROR EN BD', { slotId, filePath });
        try {
          await this.supabaseService.client
            .storage
            .from('evidencia-fotografica')
            .remove([filePath]);
          this.logDebug('performUpload', '✅ Archivo limpiado exitosamente', { slotId, filePath });
        } catch (cleanupError) {
          this.logError('performUpload', '❌ Error limpiando archivo', { slotId, filePath });
        }
        
        throw new Error(`Error guardando en base de datos: ${dbError.message}`);
      }
      
      // Actualizar progreso
      this.updateProgress(file.name, 100, 'Completado');
      this.logDebug('performUpload', '📊 Progreso actualizado: 100%', { fileName: file.name, slotId });
      
      this.logInfo('performUpload', '🎉 EVIDENCIA GUARDADA EXITOSAMENTE', { 
        slotId, 
        evidenciaId: evidencia.id,
        publicUrl,
        fileName: file.name,
        actividadId,
        timestamp: new Date().toISOString()
      });
      
      return evidencia as EvidenciaFotografica;
      
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logError('performUpload', '💥 ERROR CRÍTICO EN PERFORM UPLOAD', { 
        slotId,
        fileName: file.name,
        actividadId,
        errorName: (error as Error).name,
        errorMessage,
        errorStack: (error as Error).stack,
        timestamp: new Date().toISOString()
      });
      this.updateProgress(file.name, 0, 'Error en subida');
      throw error;
    }
  }

  /**
   * Asegura que el bucket existe antes de realizar operaciones
   */
  private async ensureBucketExists(): Promise<void> {
    if (!this.bucketInitialized) {
      await this.initializeStorageBucket();
    }
  }

  /**
   * Obtiene un mensaje de error más descriptivo
   */
  private getErrorMessage(error: any): Error {
    if (error?.message?.includes('Bucket not found')) {
      return new Error('El almacenamiento de evidencias no está configurado correctamente. Por favor, contacta al administrador.');
    }
    if (error?.message?.includes('not authenticated')) {
      return new Error('Debes iniciar sesión para subir evidencias.');
    }
    if (error?.message?.includes('file size')) {
      return new Error('El archivo es demasiado grande. Tamaño máximo permitido: 10MB.');
    }
    return new Error(error?.message || 'Error desconocido al subir la evidencia.');
  }

  /**
   * Obtiene todas las evidencias fotográficas de una actividad
   */
  obtenerEvidenciasPorActividad(actividadId: string): Observable<EvidenciaFotografica[]> {

    
    return from(this.supabaseService.db
      .from('evidencia_fotografica')
      .select('*')
      .eq('actividad_id', actividadId)
      .order('fecha_subida', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        
        const evidencias = data as EvidenciaFotografica[];
        
        this.evidenciasSubject.next(evidencias);
        return evidencias;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza la descripción de una evidencia fotográfica
   */
  actualizarDescripcion(evidenciaId: string, descripcion: string): Observable<EvidenciaFotografica> {
    return from(this.supabaseService.db
      .from('evidencia_fotografica')
      .update({ descripcion, updated_at: new Date().toISOString() })
      .eq('id', evidenciaId)
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return data as EvidenciaFotografica;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Elimina una evidencia fotográfica (archivo y registro)
   */
  eliminarEvidencia(evidenciaId: string): Observable<boolean> {
    this.logInfo('eliminarEvidencia', 'Iniciando eliminación de evidencia', { evidenciaId });
    
    return from(this.supabaseService.db
      .from('evidencia_fotografica')
      .select('url_imagen, subido_por, nombre_archivo')
      .eq('id', evidenciaId)
      .single()
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          this.logError('eliminarEvidencia', 'Error obteniendo datos de evidencia', { error, evidenciaId });
          throw error;
        }

        const evidencia = data as EvidenciaFotografica;
        this.logInfo('eliminarEvidencia', 'Datos de evidencia obtenidos', { evidencia });
        
        // Extraer el path del archivo de la URL de manera más robusta
        let filePath: string;
        try {
          const url = new URL(evidencia.url_imagen);
          const pathParts = url.pathname.split('/').filter(part => part.length > 0);
          
          // El path típico es: /storage/v1/object/public/evidencia-fotografica/userId/fileName
          // Necesitamos: userId/fileName
          if (pathParts.length >= 2) {
            const bucketIndex = pathParts.findIndex(part => part === 'evidencia-fotografica');
            if (bucketIndex >= 0 && bucketIndex < pathParts.length - 2) {
              const userId = pathParts[bucketIndex + 1];
              const fileName = pathParts[bucketIndex + 2];
              filePath = `${userId}/${fileName}`;
            } else {
              // Fallback: usar los últimos dos segmentos
              filePath = `${pathParts[pathParts.length - 2]}/${pathParts[pathParts.length - 1]}`;
            }
          } else {
            throw new Error('URL de imagen inválida');
          }
        } catch (urlError) {
          this.logError('eliminarEvidencia', 'Error extrayendo path del archivo', { urlError, url: evidencia.url_imagen });
          // Intentar usar nombre_archivo como fallback
          if (evidencia.nombre_archivo && evidencia.subido_por) {
            filePath = `${evidencia.subido_por}/${evidencia.nombre_archivo}`;
          } else {
            throw new Error('No se pudo determinar el path del archivo');
          }
        }

        this.logInfo('eliminarEvidencia', 'Path del archivo extraído', { filePath });

        // Eliminar archivo del storage
        return from(this.supabaseService.storage
          .from(this.STORAGE_BUCKET)
          .remove([filePath])
        ).pipe(
          switchMap(({ data: storageData, error: storageError }) => {
            if (storageError) {
              this.logError('eliminarEvidencia', 'Error eliminando archivo del storage', { storageError, filePath });
              // No lanzar error aquí, continuar con eliminación de BD
            } else {
              this.logInfo('eliminarEvidencia', 'Archivo eliminado del storage exitosamente', { storageData, filePath });
            }

            // Eliminar registro de la base de datos
            return from(this.supabaseService.db
              .from('evidencia_fotografica')
              .delete()
              .eq('id', evidenciaId)
            );
          })
        );
      }),
      map(({ data, error }) => {
        if (error) {
          this.logError('eliminarEvidencia', 'Error eliminando registro de BD', { error, evidenciaId });
          throw error;
        }
        
        this.logInfo('eliminarEvidencia', 'Evidencia eliminada exitosamente', { evidenciaId, data });
        
        // Actualizar el estado local removiendo la evidencia eliminada
        const evidenciasActuales = this.evidenciasSubject.value;
        const evidenciasActualizadas = evidenciasActuales.filter(e => e.id !== evidenciaId);
        this.evidenciasSubject.next(evidenciasActualizadas);
        
        return true;
      }),
      catchError(error => {
        this.logError('eliminarEvidencia', 'Error general eliminando evidencia fotográfica', { error, evidenciaId });
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza una evidencia fotográfica
   */
  actualizarEvidencia(id: string, datos: Partial<EvidenciaFotografica>): Observable<EvidenciaFotografica> {
    return from(this.supabaseService.db
      .from('evidencia_fotografica')
      .update(datos)
      .eq('id', id)
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return data as EvidenciaFotografica;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene estadísticas de evidencias por actividad
   */
  obtenerEstadisticasEvidencia(actividadId: string): Observable<{ total: number; conDescripcion: number; sinDescripcion: number }> {
    return this.obtenerEvidenciasPorActividad(actividadId).pipe(
      map(evidencias => ({
        total: evidencias.length,
        conDescripcion: evidencias.filter(e => e.descripcion && e.descripcion.trim().length > 0).length,
        sinDescripcion: evidencias.filter(e => !e.descripcion || e.descripcion.trim().length === 0).length
      }))
    );
  }

  /**
   * Limpia el estado del servicio
   */
  limpiarEstado(): void {
    this.evidenciasSubject.next([]);
    this.uploadProgressSubject.next(null);
  }

  /**
   * Obtiene la URL de thumbnail para una imagen
   */
  obtenerThumbnailUrl(urlImagen: string, width: number = 200, height: number = 200): string {
    // Por ahora retornamos la URL original, pero se puede implementar
    // transformación de imágenes con Supabase Transform o un servicio externo
    return urlImagen;
  }

  /**
   * Log de debug con contexto estructurado
   */
  private logDebug(method: string, message: string, context?: any): void {
    // Debug logging disabled
  }

  /**
   * Log de errores con contexto estructurado
   */
  private logError(method: string, message: string, context?: any): void {
    // Error logging disabled
  }

  /**
   * Log de información con contexto estructurado
   */
  private logInfo(method: string, message: string, context?: any): void {
    // Info logging disabled
  }

  /**
   * Obtiene estadísticas de concurrencia para debugging
   */
  getUploadStats(): { activeUploads: number; queueSize: number; maxConcurrent: number } {
    return {
      activeUploads: this.activeUploads,
      queueSize: this.uploadQueue.size,
      maxConcurrent: this.maxConcurrentUploads
    };
  }
}