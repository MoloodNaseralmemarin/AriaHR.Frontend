import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeResponseDto } from '../../models/employee-response.dto';

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './employee-details.component.html',
  styleUrl: './employee-details.component.css'
})
export class EmployeeDetailsComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly route = inject(ActivatedRoute);

  readonly employee = signal<EmployeeResponseDto | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('شناسه کارمند نامعتبر است.');
      this.isLoading.set(false);
      return;
    }

    this.employeeService.getEmployeeById(id).subscribe({
      next: (employee) => {
        this.employee.set(employee);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('خطا در دریافت اطلاعات کارمند.');
        this.isLoading.set(false);
      }
    });
  }
}
