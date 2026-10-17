import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';

import { NotificationsComponent } from './notifications.component';
import { NotificationService } from '../../../notifications/services/notification.service';
import { EmployeeService } from '../../../employees/services/employee.service';

describe('NotificationsComponent (Center Manager Isolated Tests)', () => {
  let component: NotificationsComponent;
  let mockNotificationService: any;
  let mockEmployeeService: any;

  beforeEach(() => {
    mockNotificationService = {
      getInbox: vi.fn().mockReturnValue(
        of([
          {
            id: 'msg-1',
            title: 'پیام مرکز',
            content: 'محتوا',
            messageType: 1,
            messagePriority: 1,
            senderName: 'فرستنده',
            createdAt: '2026-08-25T08:30:00Z',
            isRead: false,
          },
        ])
      ),
      getSent: vi.fn().mockReturnValue(of([])),
      getThread: vi.fn().mockReturnValue(of([])),
      getRecipientStatuses: vi.fn().mockReturnValue(of([])),
      markAsRead: vi.fn().mockReturnValue(of(undefined)),
      createMessage: vi.fn().mockReturnValue(
        of({
          id: 'new-1',
          title: 'جدید',
          content: 'متن جدید',
        })
      ),
      replyToMessage: vi.fn().mockReturnValue(
        of({
          id: 'rep-1',
          content: 'پاسخ',
        })
      ),
    };

    mockEmployeeService = {
      getEmployees: vi.fn().mockReturnValue(
        of([
          { id: 'emp-1', firstName: 'علی', lastName: 'علوی', personnelCode: '1001' },
        ])
      ),
    };

    const injector = Injector.create({
      providers: [
        FormBuilder,
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: EmployeeService, useValue: mockEmployeeService },
        NotificationsComponent,
      ],
    });

    runInInjectionContext(injector, () => {
      component = injector.get(NotificationsComponent);
    });
  });

  it('should initialize and load inbox notifications', () => {
    component.ngOnInit();
    expect(mockNotificationService.getInbox).toHaveBeenCalled();
    expect(component.messages().length).toBe(1);
    expect(component.employeeOptions().length).toBe(1);
  });

  it('should toggle unread filters', () => {
    component.ngOnInit();
    component.setReadFilter('unread');
    expect(component.readFilter()).toBe('unread');
    expect(component.filteredNotifications().length).toBe(1);
  });

  it('should open details and mark message as read', () => {
    component.ngOnInit();
    const msg = component.messages()[0];
    component.openMessageDetails(msg);

    expect(component.selectedMessage()?.id).toBe('msg-1');
    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('msg-1');
  });

  it('should submit compose message to employees', () => {
    component.ngOnInit();
    component.openCompose();

    component.composeForm.patchValue({
      title: 'اطلاعیه تغییر ساعت کاری',
      content: 'ساعت کاری جدید اطلاع‌رسانی می‌شود.',
      recipientIds: ['emp-1'],
    });

    expect(component.composeForm.valid).toBe(true);

    component.submitCompose();
    expect(mockNotificationService.createMessage).toHaveBeenCalled();
    expect(component.isComposeOpen()).toBe(false);
  });
});
