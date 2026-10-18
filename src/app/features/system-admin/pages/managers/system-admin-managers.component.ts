import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemAdminDataService } from '../../services/system-admin-data.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';

@Component({
  selector: 'app-system-admin-managers',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    PersianDigitsPipe,
  ],
  template: `
    <div dir="rtl" class="space-y-6">
      <app-page-header
        title="مدیران مراکز"
        [subtitle]="(data.managers().length | persianDigits) + ' مدیر ثبت شده در سامانه'"
      ></app-page-header>

      <!-- Desktop Table View -->
      <div class="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table class="w-full text-right text-sm text-slate-700">
          <thead class="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500">
            <tr>
              <th class="px-5 py-3.5">نام مدیر</th>
              <th class="px-5 py-3.5">مرکز مربوطه</th>
              <th class="px-5 py-3.5">شماره همراه</th>
              <th class="px-5 py-3.5">وضعیت</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (manager of data.managers(); track manager.id) {
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-5 py-4 font-bold text-slate-800">
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                      {{ manager.name.slice(0, 1) }}
                    </div>
                    <span>{{ manager.name }}</span>
                  </div>
                </td>
                <td class="px-5 py-4 font-medium text-slate-700">{{ manager.centerName }}</td>
                <td class="px-5 py-4 text-xs font-semibold text-slate-600">{{ manager.mobileNumber | persianDigits }}</td>
                <td class="px-5 py-4">
                  <app-status-badge
                    [tone]="manager.active ? 'success' : 'neutral'"
                    [label]="manager.active ? 'فعال' : 'غیرفعال'"
                  ></app-status-badge>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards View -->
      <div class="grid grid-cols-1 gap-3 md:hidden">
        @for (manager of data.managers(); track manager.id) {
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                  {{ manager.name.slice(0, 1) }}
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-800">{{ manager.name }}</h3>
                  <p class="text-xs text-slate-500">{{ manager.centerName }}</p>
                </div>
              </div>
              <app-status-badge
                [tone]="manager.active ? 'success' : 'neutral'"
                [label]="manager.active ? 'فعال' : 'غیرفعال'"
              ></app-status-badge>
            </div>
            <div class="border-t border-slate-100 pt-2 text-xs text-slate-600 flex justify-between">
              <span class="text-slate-400">شماره تماس:</span>
              <span class="font-medium text-slate-800">{{ manager.mobileNumber | persianDigits }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminManagersComponent {
  readonly data = inject(SystemAdminDataService);
}
