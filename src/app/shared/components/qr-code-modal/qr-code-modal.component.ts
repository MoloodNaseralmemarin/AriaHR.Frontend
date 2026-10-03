import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as QRCode from 'qrcode';

import { PersianDateService } from '../../../core/services/persian-date.service';
import { toPersianDigits } from '../../utils/mobile-number.util';

@Component({
  selector: 'app-qr-code-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-code-modal.component.html',
  styleUrls: ['./qr-code-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrCodeModalComponent implements OnChanges {
  @Input({ required: true }) code!: string;
  @Input({ required: true }) expiresAtUtc!: string;

  @Output() closeModal = new EventEmitter<void>();

  private readonly persianDateService = inject(PersianDateService);

  readonly qrDataUrl = signal<string | null>(null);
  readonly qrError = signal<string | null>(null);
  readonly isGenerating = signal(true);
  readonly formattedExpiration = signal<string>('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['code'] || changes['expiresAtUtc']) {
      this.generateQrCode();
      this.formatExpirationDate();
    }
  }

  private generateQrCode(): void {
    if (!this.code) {
      this.qrError.set('کد QR نامعتبر است.');
      this.isGenerating.set(false);
      return;
    }

    this.isGenerating.set(true);
    this.qrError.set(null);

    QRCode.toDataURL(this.code, {
      width: 256,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    })
      .then((url) => {
        this.qrDataUrl.set(url);
        this.isGenerating.set(false);
      })
      .catch(() => {
        this.qrError.set('خطا در ساخت تصویر QR Code.');
        this.isGenerating.set(false);
      });
  }

  private formatExpirationDate(): void {
    if (!this.expiresAtUtc) {
      this.formattedExpiration.set('-');
      return;
    }

    try {
      const date = new Date(this.expiresAtUtc);
      if (isNaN(date.getTime())) {
        this.formattedExpiration.set('-');
        return;
      }

      // Format Jalali Date & Time in Persian digits
      const jalaliDateStr = this.persianDateService.toJalaliString(
        date.toISOString(),
        'persian',
        'DD-MM-YYYY'
      );

      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const timeStr = toPersianDigits(`${hours}:${minutes}`);

      this.formattedExpiration.set(`${jalaliDateStr} ساعت ${timeStr}`);
    } catch {
      this.formattedExpiration.set('-');
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }
}
