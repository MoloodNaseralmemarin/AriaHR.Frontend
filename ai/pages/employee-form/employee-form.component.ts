import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { CreateEmployeeDto } from '../../models/create-employee.dto';
import { UpdateEmployeeDto } from '../../models/update-employee.dto';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.css'
})
export class EmployeeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  private employeeId: string | null = null;

  // GUESS — تأیید نشده: مقادیر مجاز gender روی بک‌اند دیده نشده؛ دو گزینه‌ی
  // ساده Male/Female فرض شده. باید با enum/ثابت واقعی بک‌اند جایگزین شود.
  readonly genderOptions = [
    { value: 'Male', label: 'مرد' },
    { value: 'Female', label: 'زن' }
  ];

  readonly form = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    organizationId: ['', Validators.required],
    personnelCode: ['', Validators.required],
    nationalCode: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    birthDate: ['', Validators.required],
    gender: [''],
    hireDate: ['', Validators.required],
    isActive: [true],
    profileImagePath: ['']
  });

  ngOnInit(): void {
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
          userId: employee.userId,
          organizationId: employee.organizationId,
          personnelCode: employee.personnelCode,
          nationalCode: employee.nationalCode,
          birthDate: employee.birthDate,
          gender: employee.gender ?? '',
          hireDate: employee.hireDate,
          isActive: employee.isActive,
          profileImagePath: employee.profileImagePath ?? ''
        });
        // GUESS — چون UserId بعد از ایجاد کارمند قابل تغییر فرض نشده،
        // در حالت ویرایش غیرفعال می‌شود.
        this.form.controls.userId.disable();
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('خطا در دریافت اطلاعات کارمند.');
        this.isLoading.set(false);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const raw = this.form.getRawValue();

    if (this.isEditMode() && this.employeeId) {
      const request: UpdateEmployeeDto = {
        organizationId: raw.organizationId,
        personnelCode: raw.personnelCode,
        nationalCode: raw.nationalCode,
        birthDate: raw.birthDate,
        gender: raw.gender || undefined,
        hireDate: raw.hireDate,
        isActive: raw.isActive,
        profileImagePath: raw.profileImagePath || undefined
      };

      this.employeeService.updateEmployee(this.employeeId, request).subscribe({
        next: () => this.router.navigate(['/employees']),
        error: () => {
          this.errorMessage.set('خطا در ذخیره تغییرات.');
          this.isSubmitting.set(false);
        }
      });
    } else {
      const request: CreateEmployeeDto = {
        userId: raw.userId,
        organizationId: raw.organizationId,
        personnelCode: raw.personnelCode,
        nationalCode: raw.nationalCode,
        birthDate: raw.birthDate,
        gender: raw.gender || undefined,
        hireDate: raw.hireDate,
        profileImagePath: raw.profileImagePath || undefined
      };

      this.employeeService.createEmployee(request).subscribe({
        next: () => this.router.navigate(['/employees']),
        error: () => {
          this.errorMessage.set('خطا در ثبت کارمند جدید.');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/employees']);
  }
}
