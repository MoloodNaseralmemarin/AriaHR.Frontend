import { Routes } from '@angular/router';

/**
 * GUESS — تأیید نشده: چون فایل routing اصلی پروژه (app.routes.ts) دیده نشده،
 * فرض شده این فایل با lazy loading زیر مسیر «employees» به روت اصلی وصل
 * می‌شود، مثلاً:
 *
 *   {
 *     path: 'employees',
 *     loadChildren: () =>
 *       import('./features/employees/employees.routes')
 *         .then(m => m.EMPLOYEE_ROUTES)
 *   }
 */
export const EMPLOYEE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/employee-list/employee-list.component').then(
        (m) => m.EmployeeListComponent
      )
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/employee-form/employee-form.component').then(
        (m) => m.EmployeeFormComponent
      )
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/employee-form/employee-form.component').then(
        (m) => m.EmployeeFormComponent
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/employee-details/employee-details.component').then(
        (m) => m.EmployeeDetailsComponent
      )
  }
];
