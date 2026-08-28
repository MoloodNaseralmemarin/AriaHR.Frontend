import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarNavComponent } from '../components/sidebar-nav/sidebar-nav.component';
import { BottomNavComponent } from '../components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-center-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarNavComponent, BottomNavComponent],
  template: `
    <div dir="rtl" class="flex min-h-screen bg-slate-50 text-slate-800" style="font-family: 'IRANSans', 'Vazirmatn', sans-serif;">
      <app-sidebar-nav></app-sidebar-nav>

      <div class="flex min-h-screen w-full flex-1 flex-col">
        <main class="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-8 md:pt-8">
          <router-outlet></router-outlet>
        </main>
      </div>

      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
})
export class CenterLayoutComponent {}
