import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { LogoutModalComponent } from './logout-modal.component';

describe('LogoutModalComponent', () => {
  it('should create and emit cancel when requested', () => {
    const modal = new LogoutModalComponent();
    expect(modal.isOpen).toBe(false);

    let cancelled = false;
    modal.cancel.subscribe(() => {
      cancelled = true;
    });

    modal.cancel.emit();
    expect(cancelled).toBe(true);
  });

  it('should emit confirm when requested', () => {
    const modal = new LogoutModalComponent();
    let confirmed = false;
    modal.confirm.subscribe(() => {
      confirmed = true;
    });

    modal.confirm.emit();
    expect(confirmed).toBe(true);
  });
});
