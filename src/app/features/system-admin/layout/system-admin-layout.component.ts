import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SystemAdminSidebarNavComponent } from '../components/system-admin-sidebar-nav/system-admin-sidebar-nav.component';
import { SystemAdminBottomNavComponent } from '../components/system-admin-bottom-nav/system-admin-bottom-nav.component';

@Component({
  selector: 'app-system-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SystemAdminSidebarNavComponent, SystemAdminBottomNavComponent],
  template: `
    <div dir="rtl" class="flex min-h-screen bg-slate-50 text-slate-800" style="font-family: 'IRANSans', 'Vazirmatn', sans-serif;">
      <app-system-admin-sidebar-nav></app-system-admin-sidebar-nav>

      <div class="flex min-h-screen w-full flex-1 flex-col">
        <main class="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-8 md:pt-8">
          <router-outlet></router-outlet>
        </main>
      </div>

      <app-system-admin-bottom-nav></app-system-admin-bottom-nav>
    </div>
  `,
})
export class SystemAdminLayoutComponent {}
