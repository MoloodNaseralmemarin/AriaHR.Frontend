import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../../core/auth/auth.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { AccountInfoCardComponent } from '../../../../shared/components/account-info-card/account-info-card.component';
import { LogoutButtonComponent } from '../../../../shared/components/logout-button/logout-button.component';

@Component({
  selector: 'app-system-admin-settings',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SkeletonLoaderComponent,
    AccountInfoCardComponent,
    LogoutButtonComponent,
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

  ngOnInit(): void {
    this.loadProfile();
  }

  /**
   * Refreshes the current administrator profile. The account card renders straight from
   * AuthService signals, so this only drives the loading / error states of the page.
   */
  loadProfile(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');

    this.authService.getCurrentUser().subscribe({
      next: (userData) => {
        this.isLoading.set(false);
        if (!userData && !this.authService.userDetails()) {
          this.hasError.set(true);
          this.errorMessage.set('اطلاعات حساب کاربری یافت نشد.');
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
}
