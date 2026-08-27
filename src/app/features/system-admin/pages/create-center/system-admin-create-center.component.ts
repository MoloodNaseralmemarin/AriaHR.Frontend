import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SystemAdminDataService } from '../../services/system-admin-data.service';
@Component({
  selector: 'app-system-admin-create-center',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './system-admin-create-center.component.html',
  styleUrl: './system-admin-create-center.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminCreateCenterComponent {
  private readonly data = inject(SystemAdminDataService);
  private readonly router = inject(Router);
  readonly step = signal(1);
  readonly saving = signal(false);
  readonly form = {
    centerName: '',
    centerType: '',
    address: '',
    phone: '',
    managerFirstName: '',
    managerLastName: '',
    managerMobile: '',
    managerEmail: '',
  };
  next(): void {
    if (this.step() === 1) {
      this.step.set(2);
      return;
    }
    this.saving.set(true);
    this.data
      .createCenter(this.form)
      .subscribe(() => this.router.navigate(['/system-admin/centers']));
  }
}
