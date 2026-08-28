import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: 'attendance' | 'late' | 'absence' | 'hours';
}

interface WeeklyBar {
  label: string;
  presentPercent: number; // 0-100, drives bar height — mock only
}

/**
 * /center/reports
 * A clean reporting dashboard with a date-range / Persian date filter,
 * four report cards, and a single lightweight bar chart for the weekly
 * attendance trend (charts are used only where they add real value —
 * the other report types stay as plain cards + numbers).
 * All figures are mock data.
 */
@Component({
  selector: 'app-center-reports',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent {
  rangeOptions = ['۷ روز گذشته', '۳۰ روز گذشته', 'ماه جاری', 'بازه دلخواه'];
  selectedRange = signal(this.rangeOptions[1]);

  reportCards: ReportCard[] = [
    { id: 'attendance', title: 'گزارش حضور', description: 'میانگین حضور کارکنان در بازه انتخابی', icon: 'attendance' },
    { id: 'late', title: 'گزارش تأخیر', description: 'تعداد و روند تأخیرهای ثبت‌شده', icon: 'late' },
    { id: 'absence', title: 'گزارش غیبت', description: 'موارد غیبت به تفکیک کارمند', icon: 'absence' },
    { id: 'hours', title: 'گزارش ساعات کاری', description: 'مجموع ساعات کاری ثبت‌شده', icon: 'hours' },
  ];

  weeklyTrend: WeeklyBar[] = [
    { label: 'ش', presentPercent: 82 },
    { label: 'ی', presentPercent: 90 },
    { label: 'د', presentPercent: 95 },
    { label: 'س', presentPercent: 78 },
    { label: 'چ', presentPercent: 88 },
    { label: 'پ', presentPercent: 91 },
    { label: 'ج', presentPercent: 60 },
  ];

  selectRange(range: string): void {
    this.selectedRange.set(range);
  }

  onOpenReport(card: ReportCard): void {
    console.log('open report (UI only):', card.id);
  }

  onExport(): void {
    console.log('export report (UI only)');
  }
}
