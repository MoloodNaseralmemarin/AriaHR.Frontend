import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EmployeeService } from '../../services/employee.service';
import { CreateEmployeeDto } from '../../models/create-employee.dto';
import { UpdateEmployeeDto } from '../../models/update-employee.dto';
import { AuthService } from '../../../../core/auth/auth.service';
import { isValidIranianMobile, normalizeMobileNumber, normalizePersianDigits, toPersianDigits } from '../../../../shared/utils/mobile-number.util';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ToastComponent, ToastTone } from '../../../../shared/components/toast/toast.component';
import { JalaliDatePickerComponent } from '../../../../shared/components/jalali-date-picker/jalali-date-picker.component';

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

export type EmployeeFormControlName =
  | 'firstName'
  | 'lastName'
  | 'phoneNumber'
  | 'email'
  | 'personnelCode'
  | 'nationalCode'
  | 'birthDate'
  | 'gender'
  | 'hireDate'
  | 'isActive';

export type StringEmployeeFormControlName = Exclude<EmployeeFormControlName, 'isActive'>;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    ToastComponent,
    JalaliDatePickerComponent,
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

  // Image upload signals and state
  readonly selectedProfileImage = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly removeProfileImage = signal<boolean>(false);
  readonly imageError = signal<string | null>(null);

  private existingImageUrl: string | null = null;
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
  });

  ngOnInit(): void {
    if (!this.authService.userDetails()) {
      this.authService.getCurrentUser().subscribe();
    }

    this.employeeId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!this.employeeId);

    this.setupServerErrorClearing();

    if (this.employeeId) {
      this.loadEmployee(this.employeeId);
    }
  }

  private setupServerErrorClearing(): void {
    const fields: StringEmployeeFormControlName[] = [
      'phoneNumber',
      'nationalCode',
      'personnelCode',
      'email',
    ];

    fields.forEach((fieldName) => {
      const control = this.form.controls[fieldName];
      control.valueChanges.subscribe(() => {
        if (control.errors?.['server']) {
          const { server, ...remainingErrors } = control.errors;
          const hasRemaining = Object.keys(remainingErrors).length > 0;
          control.setErrors(hasRemaining ? remainingErrors : null);
        }
      });
    });
  }

  private handleDuplicateErrors(err: any): void {
    const errorObj = err?.error;
    const detailMessage: string = errorObj?.detail || errorObj?.message || err?.message || '';

    let errorMapped = false;

    const fieldMappings: Array<{ keyword: string; controlName: StringEmployeeFormControlName }> = [
      { keyword: 'شماره موبایل', controlName: 'phoneNumber' },
      { keyword: 'کد ملی', controlName: 'nationalCode' },
      { keyword: 'کد پرسنلی', controlName: 'personnelCode' },
      { keyword: 'ایمیل', controlName: 'email' },
    ];

    const errorsList: string[] = [];
    if (Array.isArray(errorObj?.errors)) {
      errorsList.push(...errorObj.errors);
    } else if (errorObj?.errors && typeof errorObj.errors === 'object') {
      Object.values(errorObj.errors).forEach((val) => {
        if (Array.isArray(val)) {
          errorsList.push(...val.map(String));
        } else if (typeof val === 'string') {
          errorsList.push(val);
        }
      });
    }

    if (detailMessage) {
      errorsList.push(detailMessage);
    }

    errorsList.forEach((msg) => {
      fieldMappings.forEach(({ keyword, controlName }) => {
        if (msg.includes(keyword)) {
          const control = this.form.controls[controlName];
          if (control) {
            control.setErrors({
              ...control.errors,
              server: msg,
            });
            control.markAsTouched();
            errorMapped = true;
          }
        }
      });
    });

    if (!errorMapped) {
      this.errorMessage.set(
        detailMessage || 'خطا در ثبت کارمند. لطفاً ورودی‌ها را بررسی کنید.'
      );
    }
  }

  private loadEmployee(id: string): void {
    this.isLoading.set(true);
    this.employeeService.getEmployeeById(id).subscribe({
      next: (employee) => {
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
          phoneNumber: employee.phoneNumber ? toPersianDigits(employee.phoneNumber) : '',
          email: employee.email || '',
          personnelCode: employee.personnelCode ? toPersianDigits(employee.personnelCode) : '',
          nationalCode: employee.nationalCode ? toPersianDigits(employee.nationalCode) : '',
          birthDate: employee.birthDate ? employee.birthDate.substring(0, 10) : '',
          gender: employee.gender ?? '',
          hireDate: employee.hireDate ? employee.hireDate.substring(0, 10) : '',
          isActive: employee.isActive ?? true,
        });

        if (employee.profileImagePath) {
          this.existingImageUrl = employee.profileImagePath;
          this.imagePreviewUrl.set(employee.profileImagePath);
        }

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

  isControlInvalid(name: EmployeeFormControlName): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  onDigitInput(controlName: 'phoneNumber' | 'personnelCode' | 'nationalCode', event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const rawVal = inputEl.value;
    const formatted = toPersianDigits(rawVal);
    if (rawVal !== formatted) {
      this.form.controls[controlName].setValue(formatted, { emitEvent: false });
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.imageError.set(null);

    // Validate type
    const fileType = file.type.toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
      this.imageError.set('فرمت تصویر باید یکی از موارد JPG، JPEG، PNG یا WEBP باشد.');
      input.value = '';
      return;
    }

    // Validate size
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      this.imageError.set('حجم تصویر نباید بیشتر از ۵ مگابایت باشد.');
      input.value = '';
      return;
    }

    this.selectedProfileImage.set(file);
    this.removeProfileImage.set(false);

    // Create local object URL for preview safely
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedProfileImage.set(null);
    this.imagePreviewUrl.set(null);
    this.imageError.set(null);

    if (this.isEditMode() && this.existingImageUrl) {
      this.removeProfileImage.set(true);
    } else {
      this.removeProfileImage.set(false);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.imageError()) {
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
    const normalizedPersonnelCode = normalizePersianDigits(raw.personnelCode).trim();
    const emailVal = raw.email.trim() ? raw.email.trim() : null;
    const genderVal = raw.gender ? raw.gender : null;

    if (this.isEditMode() && this.employeeId) {
      const request: UpdateEmployeeDto = {
        organizationId: orgId,
        personnelCode: normalizedPersonnelCode,
        nationalCode: normalizedNationalCode,
        birthDate: raw.birthDate,
        gender: genderVal || undefined,
        hireDate: raw.hireDate,
        isActive: raw.isActive,
        profileImage: this.selectedProfileImage(),
        removeProfileImage: this.removeProfileImage(),
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
          this.isSubmitting.set(false);
          this.handleDuplicateErrors(err);
        },
      });
    } else {
      const request: CreateEmployeeDto = {
        firstName: raw.firstName.trim(),
        lastName: raw.lastName.trim(),
        phoneNumber: normalizedPhone,
        email: emailVal,
        personnelCode: normalizedPersonnelCode,
        nationalCode: normalizedNationalCode,
        birthDate: raw.birthDate,
        hireDate: raw.hireDate,
        gender: genderVal,
        profileImage: this.selectedProfileImage(),
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
          this.isSubmitting.set(false);
          this.handleDuplicateErrors(err);
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/center-manager/employees']);
  }
}
