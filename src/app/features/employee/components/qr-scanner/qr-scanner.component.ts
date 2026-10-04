import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative flex flex-col items-center justify-center w-full max-w-md mx-auto p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
      <div class="w-full text-center mb-3">
        <h3 class="text-base font-bold text-slate-800">اسکن کد QR محل کار</h3>
        <p class="text-xs text-slate-500 mt-1">دوربین را مقابل QR محل کار قرار دهید</p>
      </div>

      <!-- Camera Viewfinder Container -->
      <div class="relative w-full aspect-square bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
        <div id="qr-reader" class="w-full h-full"></div>

        @if (isLoading()) {
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-4 text-center">
            <svg class="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs font-medium">در حال راه‌اندازی دوربین...</span>
          </div>
        }

        @if (errorMessage()) {
          <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-white p-6 text-center">
            <svg class="w-10 h-10 text-rose-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <p class="text-xs font-semibold text-rose-400 mb-4">{{ errorMessage() }}</p>
            <button
              type="button"
              (click)="restartScanner()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
            >
              تلاش مجدد
            </button>
          </div>
        }
      </div>

      <div class="mt-4 flex justify-center w-full">
        <button
          type="button"
          (click)="onCancel()"
          class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition"
        >
          انصراف
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      #qr-reader ::ng-deep video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        border-radius: 0.75rem;
      }
      #qr-reader ::ng-deep #qr-reader__scan_region {
        background: transparent !important;
      }
      #qr-reader ::ng-deep #qr-reader__dashboard {
        display: none !important;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrScannerComponent implements OnInit, OnDestroy {
  @Output() scanSuccess = new EventEmitter<string>();
  @Output() scanError = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  private html5QrCode: Html5Qrcode | null = null;
  private isScanning = false;

  async ngOnInit(): Promise<void> {
    await this.startScanner();
  }

  async ngOnDestroy(): Promise<void> {
    await this.stopScanner();
  }

  async startScanner(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      if (!this.html5QrCode) {
        this.html5QrCode = new Html5Qrcode('qr-reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      await this.html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          this.handleDecodedText(decodedText);
        },
        () => {
          // Frame scan error (no QR in frame) - ignore
        }
      );

      this.isScanning = true;
      this.isLoading.set(false);
    } catch (err: unknown) {
      this.isLoading.set(false);
      this.handleCameraError(err);
    }
  }

  private handleDecodedText(decodedText: string): void {
    if (!decodedText) return;
    this.stopScanner().then(() => {
      this.scanSuccess.emit(decodedText);
    });
  }

  private handleCameraError(err: unknown): void {
    let message = 'دسترسی به دوربین برقرار نشد. لطفاً دسترسی دوربین را از تنظیمات مرورگر فعال کنید.';
    if (err && typeof err === 'object') {
      const errName = (err as { name?: string }).name;
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        message = 'دسترسی به دوربین فعال نیست. لطفاً دسترسی دوربین را در تنظیمات مرورگر اجازه دهید.';
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        message = 'هیچ دوربینی در دستگاه شما یافت نشد.';
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        message = 'دوربین در حال استفاده توسط برنامه دیگری است.';
      }
    }
    this.errorMessage.set(message);
    this.scanError.emit(message);
  }

  async restartScanner(): Promise<void> {
    await this.stopScanner();
    await this.startScanner();
  }

  async stopScanner(): Promise<void> {
    if (this.html5QrCode && this.isScanning) {
      try {
        await this.html5QrCode.stop();
      } catch {
        // Ignore stop error if already stopped
      } finally {
        this.isScanning = false;
      }
    }
  }

  async onCancel(): Promise<void> {
    await this.stopScanner();
    this.cancel.emit();
  }
}
