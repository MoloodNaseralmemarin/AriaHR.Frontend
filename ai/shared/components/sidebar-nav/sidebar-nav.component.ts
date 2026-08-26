import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string; // key into the inline icon switch below
}

/**
 * Desktop / tablet sidebar navigation (≥ 768px). Hidden on mobile in favor
 * of <app-bottom-nav>. Both read from the same NAV_ITEMS list conceptually —
 * kept as two small components so each stays simple and each targets its
 * own layout constraints (icons+labels vertical vs icons+labels horizontal).
 */
@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside
      class="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-slate-200 bg-white md:flex"
    >
      <div class="flex items-center gap-2 border-b border-slate-100 px-5 py-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
          A
        </div>
        <div>
          <p class="text-sm font-bold text-slate-800">آریا اچ‌آر</p>
          <p class="text-xs text-slate-400">پنل مدیر مرکز</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <a
          *ngFor="let item of items"
          [routerLink]="item.route"
          routerLinkActive="bg-blue-50 text-blue-700"
          [routerLinkActiveOptions]="{ exact: false }"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
        >
          <span class="flex h-5 w-5 items-center justify-center" [innerHTML]="icon(item.icon)"></span>
          {{ item.label }}
        </a>
      </nav>

      <div class="border-t border-slate-100 px-4 py-4">
        <div class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            م‌ک
          </div>
          <div class="min-w-0">
            <p class="truncate text-xs font-semibold text-slate-700">مدیر مرکز</p>
            <p class="truncate text-[11px] text-slate-400">مرکز سلامت بهار</p>
          </div>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarNavComponent {
  items: NavItem[] = [
    { label: 'داشبورد', route: '/center/dashboard', icon: 'dashboard' },
    { label: 'کارکنان', route: '/center/employees', icon: 'employees' },
    { label: 'حضور و غیاب', route: '/center/attendance', icon: 'attendance' },
    { label: 'شیفت‌ها', route: '/center/shifts', icon: 'shifts' },
    { label: 'درخواست‌ها', route: '/center/requests', icon: 'requests' },
    { label: 'گزارش‌ها', route: '/center/reports', icon: 'reports' },
    { label: 'اعلان‌ها', route: '/center/notifications', icon: 'notifications' },
    { label: 'تنظیمات مرکز', route: '/center/settings', icon: 'settings' },
  ];

  private icons: Record<string, string> = {
    dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    employees: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    attendance: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    shifts: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    requests: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg>',
    reports: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/></svg>',
    notifications: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    settings: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  };

  icon(key: string): string {
    return this.icons[key] ?? '';
  }
}
