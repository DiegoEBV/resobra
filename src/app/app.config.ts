import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';
// import { provideClientHydration, withNoHttpTransferCache } from '@angular/platform-browser'; // Temporalmente deshabilitado
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { LockErrorInterceptor } from './interceptors/lock-error.interceptor';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    // provideClientHydration(withNoHttpTransferCache()), // Temporalmente deshabilitado para resolver NG0505
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    provideNativeDateAdapter(), // Proveedor para el DateAdapter
    provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }),
    // Interceptor global para manejar timeouts
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TimeoutInterceptor,
      multi: true
    },
    // Interceptor global para manejar errores de locks
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LockErrorInterceptor,
      multi: true
    }
  ]
};
