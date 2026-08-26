import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

import { mockTodayShifts, mockUpcomingShifts } from '../../mock-data/mock-data';
import { shiftStatusMap } from '../../../../shared/utils/status-map';

/**
 * /center/shifts
 * Visual-only shift schedule: a date selector (mock days), today's shift
 * cards and an upcoming-shifts list. No scheduling logic is implemented —
 * "افزودن شیفت" only opens a placeholder action.
 */
@Component({
  selector: 'app-center-shifts',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, StatusBadgeComponent],
  templateUrl: './shifts.component.html',
  styleUrls: ['./shifts.component.css'],
})
export class ShiftsComponent {
  shiftStatusMap = shiftStatusMap;
  todayShifts = mockTodayShifts;
  upcomingShifts = mockUpcomingShifts;

  days = [
    { label: 'ش', date: '۱', selected: false },
    { label: 'ی', date: '۲', selected: false },
    { label: 'د', date: '۳', selected: false },
    { label: 'س', date: '۴', selected: true },
    { label: 'چ', date: '۵', selected: false },
    { label: 'پ', date: '۶', selected: false },
    { label: 'ج', date: '۷', selected: false },
  ];

  selectedDayIndex = signal(3);

  selectDay(index: number): void {
    this.selectedDayIndex.set(index);
  }

  onAddShift(): void {
    // Visual-only — no scheduling logic per requirements.
    console.log('add shift clicked (UI only)');
  }
}
