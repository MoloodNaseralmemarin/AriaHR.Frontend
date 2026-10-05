import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

import { LeaveCategoryService } from '../../services/leave-category.service';
import { CreateLeaveCategoryDto } from '../../models/create-leave-category.dto';
import { UpdateLeaveCategoryDto } from '../../models/update-leave-category.dto';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ToastComponent, ToastTone } from '../../../../shared/components/toast/toast.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-leave-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    ToastComponent,
    SkeletonLoaderComponent,
  ],
  templateUrl: './leave-category-form.component.html',
  styleUrls: ['./leave-category-form.component.css'],
})
export class LeaveCategoryFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leaveCategoryService = inject(LeaveCategoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  form!: FormGroup;
  readonly isEditMode = signal(false);
  readonly categoryId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);

  readonly toastMessage = signal<string | null>(null);
  readonly toastTone = signal<ToastTone>('success');

  ngOnInit(): void {
    this.initForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.categoryId.set(id);
      this.loadCategoryDetails(id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, this.noWhitespaceValidator]],
      maxDaysPerYear: [0, [Validators.required, Validators.min(0)]],
      isPaid: [true],
      requiresAttachment: [false],
    });
  }

  private noWhitespaceValidator(control: any) {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { whitespace: true };
  }

  loadCategoryDetails(id: string): void {
    this.isLoading.set(true);
    this.leaveCategoryService.getById(id).subscribe({
      next: (cat) => {
        this.form.patchValue({
          name: cat.name,
          maxDaysPerYear: cat.maxDaysPerYear,
          isPaid: cat.isPaid,
          requiresAttachment: cat.requiresAttachment,
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.showToast(
          err?.error?.message || 'خطا در دریافت اطلاعات دسته‌بندی مرخصی.',
          'error'
        );
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.form.value;

    if (this.isEditMode() && this.categoryId()) {
      const updateDto: UpdateLeaveCategoryDto = {
        name: formValue.name.trim(),
        maxDaysPerYear: Number(formValue.maxDaysPerYear),
        isPaid: Boolean(formValue.isPaid),
        requiresAttachment: Boolean(formValue.requiresAttachment),
      };

      this.leaveCategoryService.update(this.categoryId()!, updateDto).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.showToast('دسته‌بندی مرخصی با موفقیت بروزرسانی شد.', 'success');
          setTimeout(() => {
            this.router.navigate(['/center-manager/leave-categories']);
          }, 1200);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.showToast(
            err?.error?.message || 'خطا در بروزرسانی دسته‌بندی مرخصی.',
            'error'
          );
        },
      });
    } else {
      const createDto: CreateLeaveCategoryDto = {
        name: formValue.name.trim(),
        maxDaysPerYear: Number(formValue.maxDaysPerYear),
        isPaid: Boolean(formValue.isPaid),
        requiresAttachment: Boolean(formValue.requiresAttachment),
      };

      this.leaveCategoryService.create(createDto).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.showToast('دسته‌بندی مرخصی جدید با موفقیت ثبت شد.', 'success');
          setTimeout(() => {
            this.router.navigate(['/center-manager/leave-categories']);
          }, 1200);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.showToast(
            err?.error?.message || 'خطا در ثبت دسته‌بندی مرخصی جدید.',
            'error'
          );
        },
      });
    }
  }

  showToast(msg: string, tone: ToastTone = 'success'): void {
    this.toastMessage.set(msg);
    this.toastTone.set(tone);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }
}
