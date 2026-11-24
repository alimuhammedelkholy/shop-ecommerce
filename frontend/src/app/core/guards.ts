import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, Cart } from './stores';

export const cartNotEmpty: CanActivateFn = () =>
  inject(Cart).count() > 0 || inject(Router).createUrlTree(['/cart']);

export const authRequired: CanActivateFn = (_route, state) =>
  inject(Auth).isLoggedIn() || inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
