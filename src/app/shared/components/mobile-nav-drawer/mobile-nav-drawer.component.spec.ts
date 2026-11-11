import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { MobileNavDrawerComponent } from './mobile-nav-drawer.component';

describe('MobileNavDrawerComponent', () => {
  it('should initialize with closed state and default title', () => {
    const comp = new MobileNavDrawerComponent();
    expect(comp.isOpen).toBe(false);
    expect(comp.title).toBe('منوی دسترسی سریع');
    expect(comp.items).toEqual([]);
  });

  it('should emit close when requested', () => {
    const comp = new MobileNavDrawerComponent();
    let closed = false;
    comp.close.subscribe(() => {
      closed = true;
    });

    comp.close.emit();
    expect(closed).toBe(true);
  });
});
