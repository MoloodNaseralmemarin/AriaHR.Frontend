import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { EmployeeSidebarNavComponent } from '../components/employee-sidebar-nav/employee-sidebar-nav.component';
import { EmployeeBottomNavComponent } from '../components/employee-bottom-nav/employee-bottom-nav.component';

@Component({
  selector: 'app-employee-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, EmployeeSidebarNavComponent, EmployeeBottomNavComponent],
  template: `
    <div dir="rtl" class="flex min-h-screen bg-slate-50 text-slate-800" style="font-family: 'IRANSans', 'Vazirmatn', sans-serif;">
      <app-employee-sidebar-nav></app-employee-sidebar-nav>

      <div class="flex min-h-screen w-full flex-1 flex-col">
        <main class="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-8 md:pt-8">
          <router-outlet></router-outlet>
        </main>
      </div>

      <app-employee-bottom-nav></app-employee-bottom-nav>
    </div>
  `,
})
export class EmployeeLayoutComponent {}
