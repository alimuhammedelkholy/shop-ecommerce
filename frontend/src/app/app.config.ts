import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions,
} from '@angular/router';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/auth.interceptor';
import { HttpShopApi, MockShopApi, ShopApi } from './core/shop-api';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(), // route params + query params become component inputs
      withViewTransitions(), // native View Transitions API between pages
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: ShopApi, useClass: environment.useMock ? MockShopApi : HttpShopApi },
  ],
};
