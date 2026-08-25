import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerifyOtpPageComponent } from './verify-otp-page.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('VerifyOtpPageComponent', () => {
  let component: VerifyOtpPageComponent;
  let fixture: ComponentFixture<VerifyOtpPageComponent>;
  let mockAuthService: { verifyOtp: any; resendOtp: any };

  beforeEach(async () => {
    mockAuthService = {
      verifyOtp: vi.fn().mockReturnValue(of({ success: true })),
      resendOtp: vi.fn().mockReturnValue(of({ success: true })),
    };

    await TestBed.configureTestingModule({
      imports: [VerifyOtpPageComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyOtpPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should render 4 input elements', () => {
    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );
    expect(inputs.length).toBe(4);
  });

  it('should auto focus next input when entering digit 1 by 1', () => {
    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );

    inputs[0].focus();
    expect(document.activeElement).toBe(inputs[0]);

    inputs[0].value = '1';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.digits()).toEqual(['1', '', '', '']);
    expect(document.activeElement).toBe(inputs[1]);
  });

  it('should overwrite existing digit and move focus to next input', () => {
    component.digits.set(['1', '2', '', '']);
    fixture.detectChanges();

    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );
    inputs[0].focus();

    inputs[0].value = '5';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.digits()).toEqual(['5', '2', '', '']);
    expect(document.activeElement).toBe(inputs[1]);
  });

  it('should handle Backspace when box is filled vs when empty', () => {
    component.digits.set(['1', '2', '', '']);
    fixture.detectChanges();

    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );
    inputs[1].focus();

    // Backspace when box 1 has '2' -> clear box 1
    inputs[1].value = '';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.digits()).toEqual(['1', '', '', '']);

    // Backspace keydown when box 1 is already empty -> move focus to box 0 without deleting box 0 digit
    inputs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(inputs[0]);
    expect(component.digits()).toEqual(['1', '', '', '']);
  });

  it('should support Left and Right arrow navigation', () => {
    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );
    inputs[1].focus();

    inputs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(inputs[0]);

    inputs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(inputs[1]);
  });

  it('should handle pasting full 4-digit OTP starting from index 0', () => {
    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );
    inputs[0].focus();

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as any;
    pasteEvent.clipboardData = {
      getData: (format: string) => (format === 'text' || format === 'text/plain' ? '1234' : ''),
    };

    inputs[0].dispatchEvent(pasteEvent);
    fixture.detectChanges();

    expect(component.digits()).toEqual(['1', '2', '3', '4']);
    expect(document.activeElement).toBe(inputs[3]);
    expect(mockAuthService.verifyOtp).toHaveBeenCalledWith('09123456789', '1234');
  });

  it('should handle pasting partial OTP starting from focused index', () => {
    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );
    inputs[1].focus();

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as any;
    pasteEvent.clipboardData = {
      getData: (format: string) => (format === 'text' || format === 'text/plain' ? '89' : ''),
    };

    inputs[1].dispatchEvent(pasteEvent);
    fixture.detectChanges();

    expect(component.digits()).toEqual(['', '8', '9', '']);
    expect(document.activeElement).toBe(inputs[3]);
  });

  it('should keep focus on 4th input and auto submit on final digit', () => {
    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );

    component.digits.set(['1', '2', '3', '']);
    fixture.detectChanges();

    inputs[3].focus();
    inputs[3].value = '4';
    inputs[3].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.digits()).toEqual(['1', '2', '3', '4']);
    expect(document.activeElement).toBe(inputs[3]);
    expect(mockAuthService.verifyOtp).toHaveBeenCalledWith('09123456789', '1234');
  });
});
