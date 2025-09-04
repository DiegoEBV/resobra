import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';
import { provideClientHydration } from '@angular/platform-browser';

const bootstrap = () => bootstrapApplication(AppComponent, config);
export const serverConfig = {
  providers: [provideClientHydration()]
};

export default bootstrap;
