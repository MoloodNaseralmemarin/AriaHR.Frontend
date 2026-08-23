import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Placeholder only. This exists so the login → verify-otp → dashboard flow
 * has a real route to land on; replace with the actual dashboard feature
 * when that work starts.
 */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main dir="rtl" lang="fa" class="min-h-dvh flex items-center justify-center bg-gray-50 px-4">
      <p class="text-gray-500 text-sm">ورود موفق بود — داشبورد به‌زودی اینجا خواهد بود.</p>
    </main>
  `,
})
export class DashboardPageComponent {}
