import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../../core/auth/auth.service';
import { CurrentUserDto } from '../../../../core/auth/auth.models';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';

@Component({
  selector: 'app-system-admin-settings',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SkeletonLoaderComponent,
    ToastComponent,
    PersianDigitsPipe,
  ],
  templateUrl: './system-admin-settings.component.html',
  styleUrls: ['./system-admin-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminSettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly errorMessage = signal('');
  readonly showLogoutModal = signal(false);

  readonly user = signal<CurrentUserDto | null>(null);

  readonly adminName = computed(() => {
    const u = this.user();
    if (!u) return '—';
    if (u.fullName) return u.fullName;
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
    return name || 'مدیر سیستم';
  });

  readonly adminPhone = computed(() => {
    return this.user()?.phoneNumber || '—';
  });

  readonly adminRole = computed(() => {
    const roles = this.user()?.roles;
    if (roles && roles.length > 0) {
      return roles[0] === 'SystemAdmin'
        ? 'مدیر سیستم (SystemAdmin)'
        : roles.join(', ');
    }
    return 'مدیر سیستم (SystemAdmin)';
  });

  readonly nationalCode = computed(() => {
    return this.user()?.nationalCode || '—';
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');

    this.authService.getCurrentUser().subscribe({
      next: (userData) => {
        this.isLoading.set(false);
        if (userData) {
          this.user.set(userData);
        } else {
          // Fallback to cached userDetails if getCurrentUser returned null
          const cached = this.authService.userDetails();
          if (cached) {
            this.user.set(cached);
          } else {
            this.hasError.set(true);
            this.errorMessage.set('اطلاعات حساب کاربری یافت نشد.');
          }
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.hasError.set(true);
        this.errorMessage.set(
          err?.error?.message || 'خطا در دریافت اطلاعات حساب کاربری مدیر سیستم.'
        );
      },
    });
  }

  promptLogout(): void {
    this.showLogoutModal.set(true);
  }

  cancelLogout(): void {
    this.showLogoutModal.set(false);
  }

  confirmLogout(): void {
    this.showLogoutModal.set(false);
    this.authService.logout();
  }
}
