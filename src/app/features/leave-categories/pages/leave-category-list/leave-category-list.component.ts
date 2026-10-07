import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { LeaveCategoryService } from '../../services/leave-category.service';
import { LeaveCategoryDto } from '../../models/leave-category.dto';
import { AuthService } from '../../../../core/auth/auth.service';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ToastComponent, ToastTone } from '../../../../shared/components/toast/toast.component';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';

type LeaveCategoryFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-leave-category-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    ToastComponent,
    PersianDigitsPipe,
  ],
  templateUrl: './leave-category-list.component.html',
  styleUrls: ['./leave-category-list.component.css'],
})
export class LeaveCategoryListComponent implements OnInit {
  private readonly leaveCategoryService = inject(LeaveCategoryService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly categories = signal<LeaveCategoryDto[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly activeFilter = signal<LeaveCategoryFilter>('all');

  // Processing ID state to prevent duplicate concurrent actions
  readonly processingId = signal<string | null>(null);

  // Modal / Confirmation state
  readonly pendingToggleItem = signal<LeaveCategoryDto | null>(null);

  // Toast notification state
  readonly toastMessage = signal<string | null>(null);
  readonly toastTone = signal<ToastTone>('success');

  readonly filters: { value: LeaveCategoryFilter; label: string }[] = [
    { value: 'all', label: 'همه' },
    { value: 'active', label: 'فعال' },
    { value: 'inactive', label: 'غیرفعال' },
  ];

  filteredCategories = computed<LeaveCategoryDto[]>(() => {
    let list = this.categories();
    const filter = this.activeFilter();
    const query = this.searchTerm().trim().toLowerCase();

    if (filter === 'active') {
      list = list.filter((c) => c.isActive);
    } else if (filter === 'inactive') {
      list = list.filter((c) => !c.isActive);
    }

    if (query) {
      list = list.filter((c) => c.name.toLowerCase().includes(query));
    }

    return list;
  });

  ngOnInit(): void {
    if (!this.authService.userDetails()) {
      this.authService.getCurrentUser().subscribe({
        next: () => this.loadCategories(),
        error: () => this.loadCategories(),
      });
    } else {
      this.loadCategories();
    }
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.leaveCategoryService.getAll().subscribe({
      next: (rawList: any[]) => {
        const normalized = (rawList || []).map((item) => this.normalizeCategory(item));
        this.categories.set(normalized);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message || 'خطا در دریافت لیست دسته‌بندی‌های مرخصی. لطفاً دوباره تلاش کنید.'
        );
        this.isLoading.set(false);
      },
    });
  }

  private normalizeCategory(raw: any): LeaveCategoryDto {
    if (!raw) {
      return {
        id: '',
        organizationId: '',
        name: '',
        maxDaysPerYear: 0,
        isPaid: true,
        requiresAttachment: false,
        isActive: true,
      };
    }

    return {
      id: raw.id ?? raw.Id ?? '',
      organizationId: raw.organizationId ?? raw.OrganizationId ?? '',
      name: raw.name ?? raw.Name ?? '',
      maxDaysPerYear: raw.maxDaysPerYear ?? raw.MaxDaysPerYear ?? 0,
      isPaid: Boolean(raw.isPaid ?? raw.IsPaid ?? true),
      requiresAttachment: Boolean(raw.requiresAttachment ?? raw.RequiresAttachment ?? false),
      isActive: Boolean(raw.isActive ?? raw.IsActive ?? false),
    };
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  setFilter(filter: LeaveCategoryFilter): void {
    this.activeFilter.set(filter);
  }

  confirmToggleActive(category: LeaveCategoryDto): void {
    if (this.processingId()) return;
    this.pendingToggleItem.set(category);
  }

  cancelToggleActive(): void {
    this.pendingToggleItem.set(null);
  }

  executeToggleActive(): void {
    const category = this.pendingToggleItem();
    if (!category || this.processingId()) return;

    this.processingId.set(category.id);
    this.pendingToggleItem.set(null);

    const action$ = category.isActive
      ? this.leaveCategoryService.deactivate(category.id)
      : this.leaveCategoryService.activate(category.id);

    action$.subscribe({
      next: (rawUpdated: any) => {
        const updatedObj = rawUpdated ? this.normalizeCategory(rawUpdated) : null;
        const nextState = updatedObj && typeof updatedObj.isActive === 'boolean' ? updatedObj.isActive : !category.isActive;

        this.categories.update((list) =>
          list.map((c) => (c.id === category.id ? { ...c, isActive: nextState } : c))
        );
        this.processingId.set(null);
        this.showToast(
          nextState ? 'دسته‌بندی با موفقیت فعال شد.' : 'دسته‌بندی با موفقیت غیرفعال شد.',
          'success'
        );
      },
      error: (err) => {
        this.processingId.set(null);
        this.showToast(
          err?.error?.message || 'خطا در تغییر وضعیت دسته‌بندی مرخصی.',
          'error'
        );
      },
    });
  }

  showToast(msg: string, tone: ToastTone = 'success'): void {
    this.toastMessage.set(msg);
    this.toastTone.set(tone);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }
}
