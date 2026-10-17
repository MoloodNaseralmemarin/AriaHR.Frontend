import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';

import { EmployeeNotificationsComponent } from './employee-notifications.component';
import { NotificationService } from '../../../notifications/services/notification.service';

describe('EmployeeNotificationsComponent (Isolated Tests)', () => {
  let component: EmployeeNotificationsComponent;
  let mockNotificationService: any;

  beforeEach(() => {
    mockNotificationService = {
      getInbox: vi.fn().mockReturnValue(
        of([
          {
            id: 'msg-1',
            senderId: 'sender-usr-1',
            title: 'پیام برای کارمند',
            content: 'متن پیام کارمند',
            messageType: 1,
            messagePriority: 1,
            senderName: 'مدیر مرکز',
            createdAt: '2026-08-25T08:30:00Z',
            isRead: false,
            requiresAcknowledgment: true,
            isAcknowledged: false,
          },
        ])
      ),
      getThread: vi.fn().mockReturnValue(of([])),
      markAsRead: vi.fn().mockReturnValue(of(undefined)),
      acknowledgeMessage: vi.fn().mockReturnValue(
        of({ acknowledgedAt: '2026-08-25T09:00:00Z' })
      ),
      replyToMessage: vi.fn().mockReturnValue(
        of({
          id: 'rep-1',
          content: 'پاسخ من',
          senderName: 'من (کارمند)',
          isSelf: true,
        })
      ),
    };

    const injector = Injector.create({
      providers: [
        FormBuilder,
        { provide: NotificationService, useValue: mockNotificationService },
        EmployeeNotificationsComponent,
      ],
    });

    runInInjectionContext(injector, () => {
      component = injector.get(EmployeeNotificationsComponent);
    });
  });

  it('should initialize and load employee inbox messages', () => {
    component.ngOnInit();
    expect(mockNotificationService.getInbox).toHaveBeenCalled();
    expect(component.messages().length).toBe(1);
    expect(component.unreadCount()).toBe(1);
  });

  it('should mark message read on detail open', () => {
    component.ngOnInit();
    const msg = component.messages()[0];
    component.openDetails(msg);

    expect(component.selectedMessage()?.id).toBe('msg-1');
    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('msg-1');
  });

  it('should process explicit message acknowledgment with timestamp', () => {
    component.ngOnInit();
    const msg = component.messages()[0];
    component.openDetails(msg);

    component.acknowledgeReceipt();
    expect(mockNotificationService.acknowledgeMessage).toHaveBeenCalledWith('msg-1');
    expect(component.selectedMessage()?.isAcknowledged).toBe(true);
    expect(component.selectedMessage()?.acknowledgedAt).toBe('2026-08-25T09:00:00Z');
  });

  it('should submit private thread reply using notification senderId', () => {
    component.ngOnInit();
    const msg = component.messages()[0];
    component.openDetails(msg);

    component.replyControl.setValue('پاسخ اختصاصی کارمند');
    component.sendReply();

    expect(mockNotificationService.replyToMessage).toHaveBeenCalledWith(
      'msg-1',
      'پاسخ اختصاصی کارمند',
      'من (کارمند)',
      'sender-usr-1'
    );
    expect(component.threadReplies().length).toBe(1);
  });
});
