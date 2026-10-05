import { Routes } from '@angular/router';

export const LEAVE_CATEGORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/leave-category-list/leave-category-list.component').then(
        (m) => m.LeaveCategoryListComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/leave-category-form/leave-category-form.component').then(
        (m) => m.LeaveCategoryFormComponent
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/leave-category-form/leave-category-form.component').then(
        (m) => m.LeaveCategoryFormComponent
      ),
  },
];
