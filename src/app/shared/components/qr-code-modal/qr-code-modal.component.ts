import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as QRCode from 'qrcode';

import { PersianDateService } from '../../../core/services/persian-date.service';
import { toPersianDigits } from '../../utils/mobile-number.util';

export type QrCodeModalMode = 'Static' | 'Dynamic';

@Component({
  selector: 'app-qr-code-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-code-modal.component.html',
  styleUrls: ['./qr-code-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrCodeModalComponent implements OnChanges, AfterViewInit {
  @Input({ required: true }) code!: string;
  /** Static codes have no expiration, so this is optional. */
  @Input() expiresAtUtc: string | null = null;
  @Input() qrCodeMode: QrCodeModalMode = 'Static';

  @Output() closeModal = new EventEmitter<void>();

  @ViewChild('closeButton') private closeButton?: ElementRef<HTMLButtonElement>;

  private readonly persianDateService = inject(PersianDateService);

  readonly qrDataUrl = signal<string | null>(null);
  readonly qrError = signal<string | null>(null);
  readonly isGenerating = signal(true);
  readonly formattedExpiration = signal<string>('');

  get isDynamic(): boolean {
    return this.qrCodeMode === 'Dynamic';
  }

  get modeLabel(): string {
    return this.qrCodeMode === 'Dynamic' ? 'پویا' : 'ثابت';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['code'] || changes['expiresAtUtc'] || changes['qrCodeMode']) {
      this.generateQrCode();
      this.formatExpirationDate();
    }
  }

  ngAfterViewInit(): void {
    // Move focus into the dialog so Escape/Tab work predictably and screen
    // readers announce the dialog content instead of the page behind it.
    this.closeButton?.nativeElement.focus();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onClose();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    this.closeModal.emit();
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
      this.formattedExpiration.set('');
      return;
    }

    try {
      const date = new Date(this.expiresAtUtc);
      if (isNaN(date.getTime())) {
        this.formattedExpiration.set('');
        return;
      }

      // Format Jalali Date in ASCII digits DD-MM-YYYY
      const jalaliDateStr = this.persianDateService.toJalaliString(date.toISOString());

      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const timeStr = toPersianDigits(`${hours}:${minutes}`);

      this.formattedExpiration.set(`${jalaliDateStr} ساعت ${timeStr}`);
    } catch {
      this.formattedExpiration.set('');
    }
  }
}
