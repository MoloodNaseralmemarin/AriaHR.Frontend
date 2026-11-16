import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new NotificationService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows an error only once for duplicate messages', () => {
    service.showError('شرح دقیق خطای رخ داده در سیستم');
    service.showError('شرح دقیق خطای رخ داده در سیستم');

    expect(service.notifications()).toHaveLength(1);
    expect(service.notifications()[0].tone).toBe('error');
  });

  it('keeps different error messages', () => {
    service.showError('خطای اول');
    service.showError('خطای دوم');

    expect(service.notifications()).toHaveLength(2);
  });

  it('dismisses a notification by id', () => {
    service.showError('خطای اول');
    const id = service.notifications()[0].id;

    service.dismiss(id);

    expect(service.notifications()).toHaveLength(0);
  });

  it('auto-dismisses notifications after their timeout', () => {
    service.showSuccess('با موفقیت ثبت شد.');
    expect(service.notifications()).toHaveLength(1);

    vi.advanceTimersByTime(3500);

    expect(service.notifications()).toHaveLength(0);
  });

  it('ignores blank messages', () => {
    service.showError('   ');
    expect(service.notifications()).toHaveLength(0);
  });
});
