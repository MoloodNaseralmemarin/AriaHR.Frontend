import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';

/**
 * /center/settings
 * UI-only settings screen: center information, work settings and
 * notification toggles. "ذخیره تغییرات" only shows a success toast —
 * there is no backend call.
 */
@Component({
  selector: 'app-center-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ToastComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent {
  // Center information
  centerName = signal('مرکز سلامت بهار');
  centerType = signal('کلینیک سرپایی');
  phoneNumber = signal('021-88991234');
  address = signal('تهران، خیابان ولیعصر، پلاک ۱۲۴');

  // Work settings
  geoRadius = signal('150');
  workStart = signal('08:00');
  workEnd = signal('16:00');
  attendanceGraceMinutes = signal('15');

  // Notification settings
  notifyRequests = signal(true);
  notifyAbsence = signal(true);
  notifyLate = signal(false);

  showSavedToast = signal(false);

  centerTypeOptions = ['کلینیک سرپایی', 'مرکز توانبخشی', 'مرکز مراقبت سالمندان', 'مرکز خدمات پرستاری'];

  toggle(field: 'notifyRequests' | 'notifyAbsence' | 'notifyLate'): void {
    this[field].update((v) => !v);
  }

  onSave(): void {
    // Visual-only — no backend functionality per requirements.
    this.showSavedToast.set(true);
    setTimeout(() => this.showSavedToast.set(false), 2500);
  }
}
