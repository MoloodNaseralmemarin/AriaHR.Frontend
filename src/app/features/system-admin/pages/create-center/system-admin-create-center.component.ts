import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { SystemAdminDataService } from '../../services/system-admin-data.service';

@Component({
  selector: 'app-system-admin-create-center',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './system-admin-create-center.component.html',
  styleUrl: './system-admin-create-center.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminCreateCenterComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly data = inject(SystemAdminDataService);
  private readonly router = inject(Router);

  readonly step = signal(1);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    centerName: this.formBuilder.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(150),
    ]),
    centerType: this.formBuilder.control('', [Validators.required]),
    address: this.formBuilder.control('', [Validators.maxLength(500)]),
    phone: this.formBuilder.control('', [
      Validators.pattern(/^(0\d{2,3})[- ]?\d{7,8}$/),
    ]),
    managerName: this.formBuilder.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(150),
    ]),
    managerMobile: this.formBuilder.control('', [
      Validators.required,
      Validators.pattern(/^09\d{9}$/),
    ]),
    managerEmail: this.formBuilder.control('', [
      Validators.email,
      Validators.maxLength(254),
    ]),
  });

  continue(): void {
    this.errorMessage.set(null);

    if (this.saving()) {
      return;
    }

    if (this.step() === 1) {
      if (!this.validateCenterStep()) {
        return;
      }

      this.step.set(2);
      return;
    }

    if (!this.validateManagerStep()) {
      return;
    }

    this.submit();
  }

  back(): void {
    if (this.saving()) {
      return;
    }

    this.errorMessage.set(null);
    this.step.set(1);
  }

  private validateCenterStep(): boolean {
    const controls = [
      this.form.controls.centerName,
      this.form.controls.centerType,
      this.form.controls.address,
      this.form.controls.phone,
    ];

    controls.forEach((control) => control.markAsTouched());

    return controls.every((control) => control.valid);
  }

  private validateManagerStep(): boolean {
    const controls = [
      this.form.controls.managerName,
      this.form.controls.managerMobile,
      this.form.controls.managerEmail,
    ];

    controls.forEach((control) => control.markAsTouched());

    return controls.every((control) => control.valid);
  }

  private submit(): void {
    this.saving.set(true);
    this.errorMessage.set(null);

    this.data
      .createCenter(this.form.getRawValue())
      .pipe(
        finalize(() => {
          this.saving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/system-admin/centers']);
        },
        error: () => {
          this.errorMessage.set(
            'ثبت مرکز با خطا مواجه شد. لطفاً دوباره تلاش کنید.',
          );
        },
      });
  }
}
