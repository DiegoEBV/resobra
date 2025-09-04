import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
// import { provideClientHydration, withNoHttpTransferCache } from '@angular/platform-browser'; // Temporalmente deshabilitado
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    // provideClientHydration(withNoHttpTransferCache()), // Temporalmente deshabilitado para resolver NG0505
    provideAnimationsAsync(),
    provideHttpClient(withFetch()), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ]
};
