import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerifyOtpPageComponent } from './verify-otp-page.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { vi } from 'vitest';

describe('VerifyOtpPageComponent (OTP flow & LTR alignment)', () => {
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

  it('should render 4 input elements with LTR dir attribute', () => {
    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );
    expect(inputs.length).toBe(4);
    inputs.forEach((input) => {
      expect(input.getAttribute('dir')).toBe('ltr');
    });
  });

  it('Test A & Fresh Entry: should auto-verify when typing 2565 fresh from index 0 to 3', () => {
    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );

    const code = ['2', '5', '6', '5'];
    for (let i = 0; i < 4; i++) {
      inputs[i].focus();
      inputs[i].value = code[i];
      inputs[i].dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    expect(component.digits()).toEqual(['2', '5', '6', '5']);
    expect(component.fullCode()).toBe('2565');
    expect(mockAuthService.verifyOtp).toHaveBeenCalledTimes(1);
    expect(mockAuthService.verifyOtp).toHaveBeenCalledWith('09123456789', '2565');
  });

  it('Test B & Persian OTP: should display Persian digits visually LTR and verify normalized ASCII payload', () => {
    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );

    const pDigits = ['۲', '۵', '۶', '۵'];
    for (let i = 0; i < 4; i++) {
      inputs[i].focus();
      inputs[i].value = pDigits[i];
      inputs[i].dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    expect(component.digits()).toEqual(['۲', '۵', '۶', '۵']);
    expect(component.fullCode()).toBe('2565');
    expect(mockAuthService.verifyOtp).toHaveBeenCalledWith('09123456789', '2565');
  });

  it('Test C & D: should NOT auto-verify while editing after a failed OTP verification', () => {
    mockAuthService.verifyOtp.mockReturnValueOnce(of({ success: false, message: 'کد اشتباه است' }));

    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );

    // Initial fresh entry 1234 -> fails
    const initialCode = ['1', '2', '3', '4'];
    for (let i = 0; i < 4; i++) {
      inputs[i].focus();
      inputs[i].value = initialCode[i];
      inputs[i].dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    expect(mockAuthService.verifyOtp).toHaveBeenCalledTimes(1);
    expect(mockAuthService.verifyOtp).toHaveBeenCalledWith('09123456789', '1234');
    expect(component.submitState()).toBe('error');
    expect(component.hasFailedAttempt()).toBe(true);

    // Reset spy call count
    mockAuthService.verifyOtp.mockClear();

    // User edits digit 1 from 2 to 5 -> [1, 5, 3, 4]
    inputs[1].focus();
    inputs[1].value = '5';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.digits()).toEqual(['1', '5', '3', '4']);
    expect(mockAuthService.verifyOtp).not.toHaveBeenCalled();

    // User edits digit 2 from 3 to 6 -> [1, 5, 6, 4]
    inputs[2].focus();
    inputs[2].value = '6';
    inputs[2].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.digits()).toEqual(['1', '5', '6', '4']);
    expect(mockAuthService.verifyOtp).not.toHaveBeenCalled();

    // User edits digit 3 from 4 to 5 -> [1, 5, 6, 5]
    inputs[3].focus();
    inputs[3].value = '5';
    inputs[3].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.digits()).toEqual(['1', '5', '6', '5']);
    // STILL no auto-submit during editing after failure!
    expect(mockAuthService.verifyOtp).not.toHaveBeenCalled();
  });

  it('Test E: should verify edited OTP when pressing Enter key or clicking submit button', () => {
    mockAuthService.verifyOtp.mockReturnValueOnce(of({ success: false, message: 'کد اشتباه است' }));

    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );

    // Initial failed attempt 1234
    for (let i = 0; i < 4; i++) {
      inputs[i].focus();
      inputs[i].value = `${i + 1}`;
      inputs[i].dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    mockAuthService.verifyOtp.mockClear();
    mockAuthService.verifyOtp.mockReturnValue(of({ success: true }));

    // User edits second digit to 5
    inputs[1].focus();
    inputs[1].value = '5';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(mockAuthService.verifyOtp).not.toHaveBeenCalled();

    // Pressing Enter key triggers verification exactly once
    inputs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(mockAuthService.verifyOtp).toHaveBeenCalledTimes(1);
    expect(mockAuthService.verifyOtp).toHaveBeenCalledWith('09123456789', '1534');
  });

  it('Test F & Backspace: should move focus LEFT and clear digits correctly', () => {
    component.digits.set(['1', '2', '3', '4']);
    fixture.detectChanges();

    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );
    inputs[3].focus();

    // Backspace when box 3 has '4'
    inputs[3].value = '';
    inputs[3].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.digits()).toEqual(['1', '2', '3', '']);

    // Backspace keydown when box 3 is empty -> clear box 2 and move focus to box 2
    inputs[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(inputs[2]);
    expect(component.digits()).toEqual(['1', '2', '', '']);
  });

  it('Test G & Arrow Keys: ArrowRight moves index 0->1, ArrowLeft moves index 1->0', () => {
    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );
    inputs[0].focus();

    inputs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(inputs[1]);

    inputs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(inputs[0]);
  });

  it('Test H & Paste: pasting 2565 fills boxes in LTR order [2, 5, 6, 5] and triggers verify once', () => {
    const inputs: HTMLInputElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    );
    inputs[0].focus();

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true }) as any;
    pasteEvent.clipboardData = {
      getData: (format: string) => (format === 'text' || format === 'text/plain' ? '2565' : ''),
    };

    inputs[0].dispatchEvent(pasteEvent);
    fixture.detectChanges();

    expect(component.digits()).toEqual(['2', '5', '6', '5']);
    expect(component.fullCode()).toBe('2565');
    expect(mockAuthService.verifyOtp).toHaveBeenCalledTimes(1);
    expect(mockAuthService.verifyOtp).toHaveBeenCalledWith('09123456789', '2565');
  });

  it('should prevent duplicate verification requests when submit button is clicked multiple times while loading', () => {
    const responseSubject = new Subject<any>();
    mockAuthService.verifyOtp.mockReturnValue(responseSubject.asObservable());

    component.digits.set(['2', '5', '6', '5']);
    fixture.detectChanges();

    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');

    submitBtn.click();
    fixture.detectChanges();
    submitBtn.click();
    fixture.detectChanges();
    submitBtn.click();
    fixture.detectChanges();

    expect(mockAuthService.verifyOtp).toHaveBeenCalledTimes(1);
  });
});
