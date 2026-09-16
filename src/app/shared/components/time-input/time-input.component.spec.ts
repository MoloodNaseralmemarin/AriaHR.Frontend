import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { describe, beforeEach, it, expect } from 'vitest';
import { TimeInputComponent, parseTimeInput } from './time-input.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, TimeInputComponent],
  template: `<app-time-input [formControl]="control" id="test-time"></app-time-input>`,
})
class TestHostComponent {
  control = new FormControl('');
}

describe('TimeInputComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let inputEl: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
    inputEl = fixture.nativeElement.querySelector('input');
  });

  it('should parse various time inputs correctly', () => {
    expect(parseTimeInput('08:30')).toEqual({
      englishValue: '08:30',
      displayPersian: '۰۸:۳۰',
      isValid: true,
      isEmpty: false,
    });

    expect(parseTimeInput('۰۸:۳۰')).toEqual({
      englishValue: '08:30',
      displayPersian: '۰۸:۳۰',
      isValid: true,
      isEmpty: false,
    });

    expect(parseTimeInput('0830')).toEqual({
      englishValue: '08:30',
      displayPersian: '۰۸:۳۰',
      isValid: true,
      isEmpty: false,
    });

    expect(parseTimeInput('۰۸۳۰')).toEqual({
      englishValue: '08:30',
      displayPersian: '۰۸:۳۰',
      isValid: true,
      isEmpty: false,
    });

    expect(parseTimeInput('2345')).toEqual({
      englishValue: '23:45',
      displayPersian: '۲۳:۴۵',
      isValid: true,
      isEmpty: false,
    });

    expect(parseTimeInput('25:00').isValid).toBe(false);
    expect(parseTimeInput('12:70').isValid).toBe(false);
    expect(parseTimeInput('99:99').isValid).toBe(false);
  });

  it('should reflect initial form value in display as Persian digits', () => {
    hostComponent.control.setValue('14:15');
    fixture.detectChanges();
    expect(inputEl.value).toBe('۱۴:۱۵');
  });

  it('should propagate user input to form control as English HH:mm', () => {
    inputEl.value = '۰۸۳۰';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(hostComponent.control.value).toBe('08:30');
    expect(inputEl.value).toBe('۰۸:۳۰');
    expect(hostComponent.control.valid).toBe(true);
  });

  it('should mark form control as invalid when invalid time is typed', () => {
    inputEl.value = '25:00';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(hostComponent.control.value).toBe('25:00');
    expect(hostComponent.control.invalid).toBe(true);
    expect(hostComponent.control.errors).toEqual({ invalidTime: true });
  });

  it('should handle empty input correctly', () => {
    hostComponent.control.setValue('08:30');
    fixture.detectChanges();

    inputEl.value = '';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(hostComponent.control.value).toBe('');
    expect(hostComponent.control.valid).toBe(true);
    expect(hostComponent.control.errors).toBeNull();
  });

  it('should handle disabled state', () => {
    hostComponent.control.disable();
    fixture.detectChanges();

    expect(inputEl.disabled).toBe(true);
  });
});
