import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/auth/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-employee-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div dir="rtl" lang="fa" class="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <!-- Desktop & Tablet Header -->
      <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-xs">
        <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-xs text-lg">
              آ
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900 leading-tight">آریا اچ‌آر</p>
              <p class="text-[11px] text-slate-500 font-medium">پنل کارمند</p>
            </div>
          </div>

          <!-- Desktop & Tablet Horizontal Nav -->
          <nav class="hidden md:flex items-center gap-1 lg:gap-1.5 overflow-x-auto py-1 px-2" aria-label="ناوبری اصلی دسکتاپ">
            @for (item of navItems; track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                [routerLinkActiveOptions]="{ exact: item.route === '/employee/dashboard' }"
                class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                <span class="text-sm">{{ item.icon }}</span>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>

          <!-- User Actions & Profile -->
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- Notifications Link Button -->
            <a
              routerLink="/employee/notifications"
              routerLinkActive="bg-blue-50 text-blue-700"
              class="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer shadow-2xs"
              title="اعلان‌ها"
            >
              <span class="text-base">🔔</span>
            </a>

            <!-- User Info Badge -->
            <div class="hidden sm:flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5">
              <div class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-2xs">
                {{ userInitial() }}
              </div>
              <span class="text-xs font-semibold text-slate-700 max-w-[120px] truncate">{{ userName() }}</span>
            </div>

            <!-- Mobile Submenu Toggle Button -->
            <button
              type="button"
              (click)="toggleMobileMenu()"
              class="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 cursor-pointer"
              [attr.aria-expanded]="isMobileMenuOpen()"
              aria-label="منوی گزینه‌ها"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <!-- Logout Button -->
            <button
              type="button"
              (click)="onLogout()"
              class="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 cursor-pointer shadow-2xs"
              title="خروج از حساب"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span class="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>

        <!-- Tablet / Small Screen Secondary Nav Scroll Row -->
        <div class="hidden sm:flex md:hidden border-t border-slate-100 px-4 py-2 bg-slate-50/80 overflow-x-auto gap-2">
          @for (item of navItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-blue-600 text-white font-semibold"
              [routerLinkActiveOptions]="{ exact: item.route === '/employee/dashboard' }"
              class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              <span>{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </div>

        <!-- Mobile Dropdown Menu for secondary items -->
        @if (isMobileMenuOpen()) {
          <div class="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg animate-in">
            <div class="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100 sm:hidden">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {{ userInitial() }}
              </div>
              <div>
                <p class="text-xs font-bold text-slate-900">{{ userName() }}</p>
                <p class="text-[10px] text-slate-500">کارمند سازمان</p>
              </div>
            </div>
            @for (item of navItems; track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
                [routerLinkActiveOptions]="{ exact: item.route === '/employee/dashboard' }"
                (click)="closeMobileMenu()"
                class="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span class="text-base">{{ item.icon }}</span>
                <span>{{ item.label }}</span>
              </a>
            }
          </div>
        }
      </header>

      <!-- Main Content Container -->
      <main class="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-8 md:pt-8">
        <router-outlet></router-outlet>
      </main>

      <!-- Bottom Mobile Nav -->
      <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:hidden shadow-lg" aria-label="ناوبری همراه">
        <div class="mx-auto grid h-[60px] max-w-lg grid-cols-4 px-2">
          <a
            routerLink="/employee/dashboard"
            routerLinkActive="text-blue-600 font-bold"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex flex-col items-center justify-center text-[11px] text-slate-500 transition-colors"
          >
            <span class="text-lg leading-none">⌂</span>
            <span class="mt-0.5">داشبورد</span>
          </a>
          <a
            routerLink="/employee/attendance"
            routerLinkActive="text-blue-600 font-bold"
            class="flex flex-col items-center justify-center text-[11px] text-slate-500 transition-colors"
          >
            <span class="text-lg leading-none">⏱</span>
            <span class="mt-0.5">تردد</span>
          </a>
          <a
            routerLink="/employee/leave-requests"
            routerLinkActive="text-blue-600 font-bold"
            class="flex flex-col items-center justify-center text-[11px] text-slate-500 transition-colors"
          >
            <span class="text-lg leading-none">🌴</span>
            <span class="mt-0.5">مرخصی</span>
          </a>
          <a
            routerLink="/employee/profile"
            routerLinkActive="text-blue-600 font-bold"
            class="flex flex-col items-center justify-center text-[11px] text-slate-500 transition-colors"
          >
            <span class="text-lg leading-none">👤</span>
            <span class="mt-0.5">پروفایل</span>
          </a>
        </div>
      </nav>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeLayoutComponent {
  private readonly authService = inject(AuthService);

  readonly isMobileMenuOpen = signal<boolean>(false);

  readonly navItems: NavItem[] = [
    { label: 'داشبورد', route: '/employee/dashboard', icon: '⌂' },
    { label: 'پروفایل من', route: '/employee/profile', icon: '👤' },
    { label: 'تردد و حضور', route: '/employee/attendance', icon: '⏱' },
    { label: 'مرخصی‌ها', route: '/employee/leave-requests', icon: '🌴' },
    { label: 'درخواست‌ها', route: '/employee/requests', icon: '📝' },
    { label: 'اعلان‌ها', route: '/employee/notifications', icon: '🔔' },
    { label: 'تنظیمات', route: '/employee/settings', icon: '⚙' },
  ];

  readonly userName = computed(() => {
    const user = this.authService.userDetails();
    if (user && user.firstName) {
      return `${user.firstName} ${user.lastName || ''}`.trim();
    }
    return 'کارمند';
  });

  readonly userInitial = computed(() => {
    const name = this.userName();
    return name ? name.charAt(0) : 'ک';
  });

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  onLogout(): void {
    this.authService.logout();
  }
}
