import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EmployeeService } from '../../services/employee.service';
import { CreateEmployeeDto } from '../../models/create-employee.dto';
import { UpdateEmployeeDto } from '../../models/update-employee.dto';
import { AuthService } from '../../../../core/auth/auth.service';
import { isValidIranianMobile, normalizeMobileNumber } from '../../../../shared/utils/mobile-number.util';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ToastComponent, ToastTone } from '../../../../shared/components/toast/toast.component';

export function iranianMobileValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const normalized = normalizeMobileNumber(control.value);
  if (isValidIranianMobile(normalized)) {
    return null;
  }
  return { iranianMobile: true };
}

export function nationalCodeValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const normalized = normalizeMobileNumber(control.value);
  if (/^\d{10}$/.test(normalized)) {
    return null;
  }
  return { nationalCode: true };
}

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    ToastComponent,
  ],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.css'],
})
export class EmployeeFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly toastMessage = signal<string | null>(null);
  readonly toastTone = signal<ToastTone>('success');

  private employeeId: string | null = null;

  readonly genderOptions = [
    { value: 'Male', label: 'مرد' },
    { value: 'Female', label: 'زن' },
  ];

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phoneNumber: ['', [Validators.required, iranianMobileValidator]],
    email: ['', [Validators.email]],
    personnelCode: ['', Validators.required],
    nationalCode: ['', [Validators.required, nationalCodeValidator]],
    birthDate: ['', Validators.required],
    gender: [''],
    hireDate: ['', Validators.required],
    isActive: [true],
    profileImagePath: [''],
  });

  ngOnInit(): void {
    if (!this.authService.userDetails()) {
      this.authService.getCurrentUser().subscribe();
    }

    this.employeeId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!this.employeeId);

    if (this.employeeId) {
      this.loadEmployee(this.employeeId);
    }
  }

  private loadEmployee(id: string): void {
    this.isLoading.set(true);
    this.employeeService.getEmployeeById(id).subscribe({
      next: (employee) => {
        // Extract names if user object or userFullName present, or fallback
        let firstName = '';
        let lastName = '';
        if (employee.firstName) {
          const parts = employee.firstName.trim().split(' ');
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }

        this.form.patchValue({
          firstName: firstName,
          lastName: lastName,
          phoneNumber: '', // EmployeeResponseDto might not carry phone, optional update
          email: employee.email || '',
          personnelCode: employee.personnelCode || '',
          nationalCode: employee.nationalCode || '',
          birthDate: employee.birthDate ? employee.birthDate.substring(0, 10) : '',
          gender: employee.gender ?? '',
          hireDate: employee.hireDate ? employee.hireDate.substring(0, 10) : '',
          isActive: employee.isActive ?? true,
          profileImagePath: employee.profileImagePath ?? '',
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message || 'خطا در دریافت اطلاعات کارمند.'
        );
        this.isLoading.set(false);
      },
    });
  }

  isControlInvalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const orgId = this.authService.userDetails()?.organizationId;
    if (!orgId) {
      this.errorMessage.set(
        'اطلاعات سازمان یافت نشد. لطفاً ابتدا به سیستم وارد شوید.'
      );
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const raw = this.form.getRawValue();

    const normalizedPhone = normalizeMobileNumber(raw.phoneNumber);
    const normalizedNationalCode = normalizeMobileNumber(raw.nationalCode);
    const emailVal = raw.email.trim() ? raw.email.trim() : null;
    const genderVal = raw.gender ? raw.gender : null;
    const profileImagePathVal = raw.profileImagePath.trim() ? raw.profileImagePath.trim() : null;

    if (this.isEditMode() && this.employeeId) {
      const request: UpdateEmployeeDto = {
        organizationId: orgId,
        personnelCode: raw.personnelCode.trim(),
        nationalCode: normalizedNationalCode,
        birthDate: raw.birthDate,
        gender: genderVal || undefined,
        hireDate: raw.hireDate,
        isActive: raw.isActive,
        profileImagePath: profileImagePathVal || undefined,
      };

      this.employeeService.updateEmployee(this.employeeId, request).subscribe({
        next: () => {
          this.toastTone.set('success');
          this.toastMessage.set('اطلاعات کارمند با موفقیت بروزرسانی شد.');
          setTimeout(() => {
            this.router.navigate(['/center-manager/employees']);
          }, 1000);
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.message || err?.message || 'خطا در ذخیره تغییرات.'
          );
          this.isSubmitting.set(false);
        },
      });
    } else {
      const request: CreateEmployeeDto = {
        firstName: raw.firstName.trim(),
        lastName: raw.lastName.trim(),
        phoneNumber: normalizedPhone,
        email: emailVal,
        personnelCode: raw.personnelCode.trim(),
        nationalCode: normalizedNationalCode,
        birthDate: raw.birthDate,
        hireDate: raw.hireDate,
        gender: genderVal,
        profileImagePath: profileImagePathVal,
        organizationId: orgId,
      };

      this.employeeService.createEmployee(request).subscribe({
        next: () => {
          this.toastTone.set('success');
          this.toastMessage.set('کارمند جدید با موفقیت ثبت شد.');
          setTimeout(() => {
            this.router.navigate(['/center-manager/employees']);
          }, 1000);
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.message || err?.message || 'خطا در ثبت کارمند جدید. لطفاً ورودی‌ها را بررسی کنید.'
          );
          this.isSubmitting.set(false);
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/center-manager/employees']);
  }
}
