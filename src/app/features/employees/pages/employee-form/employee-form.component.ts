import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EmployeeService } from '../../services/employee.service';
import { CreateEmployeeDto } from '../../models/create-employee.dto';
import { UpdateEmployeeDto } from '../../models/update-employee.dto';
import { AuthService } from '../../../../core/auth/auth.service';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ToastComponent, ToastTone } from '../../../../shared/components/toast/toast.component';

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
    userId: ['', Validators.required],
    personnelCode: ['', Validators.required],
    nationalCode: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
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
        this.form.patchValue({
          userId: employee.userId || '',
          personnelCode: employee.personnelCode || '',
          nationalCode: employee.nationalCode || '',
          birthDate: employee.birthDate ? employee.birthDate.substring(0, 10) : '',
          gender: employee.gender ?? '',
          hireDate: employee.hireDate ? employee.hireDate.substring(0, 10) : '',
          isActive: employee.isActive ?? true,
          profileImagePath: employee.profileImagePath ?? '',
        });
        this.form.controls.userId.disable();
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

    if (this.isEditMode() && this.employeeId) {
      const request: UpdateEmployeeDto = {
        organizationId: orgId,
        personnelCode: raw.personnelCode.trim(),
        nationalCode: raw.nationalCode.trim(),
        birthDate: raw.birthDate,
        gender: raw.gender || undefined,
        hireDate: raw.hireDate,
        isActive: raw.isActive,
        profileImagePath: raw.profileImagePath ? raw.profileImagePath.trim() : undefined,
      };

      this.employeeService.updateEmployee(this.employeeId, request).subscribe({
        next: () => {
          this.router.navigate(['/center-manager/employees']);
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.message || 'خطا در ذخیره تغییرات.'
          );
          this.isSubmitting.set(false);
        },
      });
    } else {
      const request: CreateEmployeeDto = {
        userId: raw.userId.trim(),
        organizationId: orgId,
        personnelCode: raw.personnelCode.trim(),
        nationalCode: raw.nationalCode.trim(),
        birthDate: raw.birthDate,
        gender: raw.gender || undefined,
        hireDate: raw.hireDate,
        profileImagePath: raw.profileImagePath ? raw.profileImagePath.trim() : undefined,
      };

      this.employeeService.createEmployee(request).subscribe({
        next: () => {
          this.router.navigate(['/center-manager/employees']);
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.message || 'خطا در ثبت کارمند جدید. لطفاً ورودی‌ها را بررسی کنید.'
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
