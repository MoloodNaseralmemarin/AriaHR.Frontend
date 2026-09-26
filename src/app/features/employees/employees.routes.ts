import { Routes } from '@angular/router';

export const EMPLOYEE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/employee-list/employee-list.component').then(
        (m) => m.EmployeeListComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/employee-form/employee-form.component').then(
        (m) => m.EmployeeFormComponent
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/employee-form/employee-form.component').then(
        (m) => m.EmployeeFormComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/employee-details/employee-details.component').then(
        (m) => m.EmployeeDetailsComponent
      ),
  },
];
