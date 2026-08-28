import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { OrganizationService } from '../../../organizations/services/organization.service';
import { CreateOrganizationDto } from '../../../organizations/models/create-organization.dto';

const IRAN_LANDLINE_PATTERN = /^0\d{2,3}[-\s]?\d{7,8}$/;
const IRAN_MOBILE_PATTERN = /^09\d{9}$/;

const CENTER_TYPE_MAP: Record<string, number> = {
  'کلینیک': 1,
  'مرکز درمانی': 2,
  'مرکز تصویربرداری': 3,
};

@Component({
  selector: 'app-system-admin-create-center',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './system-admin-create-center.component.html',
  styleUrl: './system-admin-create-center.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminCreateCenterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly organizationService = inject(OrganizationService);
  private readonly router = inject(Router);

  readonly step = signal<1 | 2>(1);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    centerName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    centerCode: ['', [Validators.required, Validators.maxLength(50)]],
    centerType: ['', [Validators.required]],
    address: ['', [Validators.maxLength(500)]],
    phone: ['', [Validators.pattern(IRAN_LANDLINE_PATTERN)]],
    managerFirstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    managerLastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    managerMobile: ['', [Validators.required, Validators.pattern(IRAN_MOBILE_PATTERN)]],
    managerEmail: ['', [Validators.email]],
  });

  private step1ControlNames = ['centerName', 'centerCode', 'centerType', 'address', 'phone'];
  private step2ControlNames = ['managerFirstName', 'managerLastName', 'managerMobile', 'managerEmail'];

  isControlInvalid(name: string): boolean {
    const control = this.form.get(name);
    if (!control) return false;
    return control.invalid && (control.touched || control.dirty);
  }

  getControlError(name: string): string | null {
    const control = this.form.get(name);
    if (!control || !control.errors || !(control.touched || control.dirty)) {
      return null;
    }

    if (control.errors['required']) {
      switch (name) {
        case 'centerName':
          return 'نام مرکز الزامی است.';
        case 'centerCode':
          return 'کد مرکز الزامی است.';
        case 'centerType':
          return 'انتخاب نوع مرکز الزامی است.';
        case 'managerFirstName':
          return 'نام مدیر الزامی است.';
        case 'managerLastName':
          return 'نام خانوادگی مدیر الزامی است.';
        case 'managerMobile':
          return 'شماره موبایل مدیر الزامی است.';
        default:
          return 'این فیلد الزامی است.';
      }
    }

    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `حداقل ${minLength} کاراکتر وارد کنید.`;
    }

    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `حداکثر ${maxLength} کاراکتر مجاز است.`;
    }

    if (control.errors['pattern']) {
      if (name === 'phone') {
        return 'فرمت شماره تماس معتبر نیست (مثلاً ۰۲۱۱۲۳۴۵۶۷۸).';
      }
      if (name === 'managerMobile') {
        return 'شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود.';
      }
    }

    if (control.errors['email']) {
      return 'فرمت ایمیل وارد شده معتبر نیست.';
    }

    return null;
  }

  nextStep(): void {
    let step1Valid = true;
    for (const controlName of this.step1ControlNames) {
      const control = this.form.get(controlName);
      if (control) {
        control.markAsTouched();
        if (control.invalid) {
          step1Valid = false;
        }
      }
    }

    if (step1Valid) {
      this.step.set(2);
    }
  }

  prevStep(): void {
    if (this.saving()) {
      return;
    }
    this.step.set(1);
  }

  onSubmit(): void {
    if (this.step() === 1) {
      this.nextStep();
      return;
    }

    // Mark step 2 controls as touched
    for (const controlName of this.step2ControlNames) {
      this.form.get(controlName)?.markAsTouched();
    }

    if (this.form.invalid) {
      return;
    }

    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const formValues = this.form.getRawValue();

    const requestDto: CreateOrganizationDto = {
      name: formValues.centerName,
      code: formValues.centerCode ? formValues.centerCode.trim() : '',
      type: CENTER_TYPE_MAP[formValues.centerType] ?? 1,
      nationalIdentifier: null,
      phone: formValues.phone ? formValues.phone : null,
      address: formValues.address ? formValues.address : null,
      managerFirstName: formValues.managerFirstName ? formValues.managerFirstName : null,
      managerLastName: formValues.managerLastName ? formValues.managerLastName : null,
      managerMobile: formValues.managerMobile ? formValues.managerMobile : null,
      isActive: true,
    };

    this.organizationService
      .createOrganization(requestDto)
      .pipe(
        finalize(() => {
          this.saving.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/system-admin/centers']);
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.message || err?.message || 'خطایی در ثبت مرکز رخ داد. لطفا مجدداً تلاش کنید.'
          );
        },
      });
  }
}
