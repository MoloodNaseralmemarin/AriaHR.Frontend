import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button.component';

export interface MobileDrawerNavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

/**
 * Standardized reusable bottom sheet / drawer for mobile navigation across all 3 roles.
 * Appears when user taps "بیشتر" (More) in the bottom navigation bar.
 */
@Component({
  selector: 'app-mobile-nav-drawer',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LogoutButtonComponent],
  template: `
    @if (isOpen) {
      <div
        class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200 md:hidden"
        (click)="close.emit()"
      ></div>

      <div
        class="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-slate-200 bg-white px-4 pb-8 pt-3 shadow-2xl md:hidden transition-transform duration-300"
        dir="rtl"
      >
        <!-- Drag Handle Indicator -->
        <div class="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300"></div>

        <div class="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 px-1">
          <div>
            <h3 class="text-sm font-bold text-slate-800">{{ title }}</h3>
            <p class="text-[11px] text-slate-400">سایر بخش‌ها و دسترسی‌های سامانه</p>
          </div>
          <button
            type="button"
            (click)="close.emit()"
            class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
            aria-label="بستن"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Navigation Links Grid/List -->
        <div class="space-y-1 max-h-[60vh] overflow-y-auto py-1">
          @for (item of items; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-blue-50 text-blue-700 font-semibold"
              (click)="close.emit()"
              class="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <span class="flex h-5 w-5 items-center justify-center text-slate-500">
                  <svg *ngIf="item.icon === 'dashboard'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
                  <svg *ngIf="item.icon === 'employees'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <svg *ngIf="item.icon === 'attendance'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  <svg *ngIf="item.icon === 'shifts'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                  <svg *ngIf="item.icon === 'work-location'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <svg *ngIf="item.icon === 'leave-categories'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
                  <svg *ngIf="item.icon === 'leave'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <svg *ngIf="item.icon === 'centers'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1"/></svg>
                  <svg *ngIf="item.icon === 'reports'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/></svg>
                  <svg *ngIf="item.icon === 'notifications'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  <svg *ngIf="item.icon === 'profile'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <svg *ngIf="item.icon === 'settings'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </span>
                <span>{{ item.label }}</span>
              </div>

              <span
                *ngIf="item.badge && item.badge > 0"
                class="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white"
              >
                {{ item.badge }}
              </span>
            </a>
          }
        </div>

        <div class="mt-3 border-t border-slate-100 pt-2">
          <app-logout-button variant="menu-item"></app-logout-button>
        </div>
      </div>
    }
  `,
})
export class MobileNavDrawerComponent {
  @Input() isOpen = false;
  @Input() title = 'منوی دسترسی سریع';
  @Input() items: MobileDrawerNavItem[] = [];
  @Output() close = new EventEmitter<void>();
}
