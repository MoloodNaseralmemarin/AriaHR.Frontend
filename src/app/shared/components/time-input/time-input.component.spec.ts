import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeInputComponent } from './time-input.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, TimeInputComponent],
  template: `<app-time-input [formControl]="control"></app-time-input>`,
})
class TestHostComponent {
  control = new FormControl('');
}

describe('TimeInputComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let component: TimeInputComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format initial value writeValue from HH:mm to Persian digits in UI', () => {
    host.control.setValue('08:30');
    fixture.detectChanges();

    expect(component.displayHour()).toBe('۰۸');
    expect(component.displayMinute()).toBe('۳۰');
  });

  it('should convert Persian digit input in hour to standard ASCII in emitted value', () => {
    const hourInputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    hourInputEl.value = '۰۹';
    hourInputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.hour()).toBe('09');
    expect(component.displayHour()).toBe('۰۹');
  });

  it('should cap hours at 23 if user inputs a larger number', () => {
    const hourInputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    hourInputEl.value = '25';
    hourInputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.hour()).toBe('23');
    expect(component.displayHour()).toBe('۲۳');
  });

  it('should cap minutes at 59 if user inputs a larger number', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input');
    const minuteInputEl: HTMLInputElement = inputs[1];
    minuteInputEl.value = '70';
    minuteInputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.minute()).toBe('59');
    expect(component.displayMinute()).toBe('۵۹');
  });
});
