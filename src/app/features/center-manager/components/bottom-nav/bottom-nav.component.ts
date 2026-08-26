import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface BottomNavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav
      class="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-slate-200 bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] backdrop-blur md:hidden"
    >
      <a
        *ngFor="let item of items"
        [routerLink]="item.route"
        routerLinkActive="text-blue-600"
        class="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-slate-400"
      >
        <span class="flex h-5 w-5 items-center justify-center">
          <svg *ngIf="item.icon === 'dashboard'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
          <svg *ngIf="item.icon === 'employees'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <svg *ngIf="item.icon === 'attendance'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <svg *ngIf="item.icon === 'shifts'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          <svg *ngIf="item.icon === 'requests'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg>
        </span>
        {{ item.label }}
      </a>
    </nav>
  `,
})
export class BottomNavComponent {
  items: BottomNavItem[] = [
    { label: 'داشبورد', route: '/center-manager/dashboard', icon: 'dashboard' },
    { label: 'کارکنان', route: '/center-manager/employees', icon: 'employees' },
    { label: 'حضور', route: '/center-manager/attendance', icon: 'attendance' },
    { label: 'شیفت‌ها', route: '/center-manager/shifts', icon: 'shifts' },
    { label: 'درخواست‌ها', route: '/center-manager/requests', icon: 'requests' },
  ];
}
