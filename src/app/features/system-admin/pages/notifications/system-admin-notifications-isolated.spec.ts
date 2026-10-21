import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { SystemAdminNotificationsComponent } from './system-admin-notifications.component';
import { NotificationService } from '../../../notifications/services/notification.service';
import { OrganizationService } from '../../../organizations/services/organization.service';

describe('SystemAdminNotificationsComponent (Isolated Tests)', () => {
  let component: SystemAdminNotificationsComponent;
  let mockNotificationService: any;
  let mockOrganizationService: any;

  beforeEach(() => {
    mockNotificationService = {
      getInbox: vi.fn().mockReturnValue(
        of([
          {
            id: 'msg-1',
            title: 'اطلاعیه مدیریت',
            content: 'محتوای اطلاعیه',
            messageType: 1,
            messagePriority: 1,
            senderName: 'مدیر ارشد',
            createdAt: '2026-08-25T08:30:00Z',
            isRead: false,
            requiresAcknowledgment: true,
            expiration: '2026-09-01T00:00:00Z',
          },
        ])
      ),
      getSent: vi.fn().mockReturnValue(of([])),
      getRecipientStatuses: vi.fn().mockReturnValue(of([])),
      markAsRead: vi.fn().mockReturnValue(of(undefined)),
      createNotification: vi.fn().mockReturnValue(
        of({
          id: 'new-1',
          title: 'جدید',
          message: 'متن جدید',
        })
      ),
    };

    mockOrganizationService = {
      getRecentOrganizations: vi.fn().mockReturnValue(
        of([
          { id: '1', name: 'کلینیک آریا', managerFirstName: 'سارا', managerLastName: 'محمدی' },
        ])
      ),
    };

    const injector = Injector.create({
      providers: [
        FormBuilder,
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: OrganizationService, useValue: mockOrganizationService },
        SystemAdminNotificationsComponent,
      ],
    });

    runInInjectionContext(injector, () => {
      component = injector.get(SystemAdminNotificationsComponent);
    });
  });

  it('should initialize and load inbox messages', () => {
    component.ngOnInit();
    expect(mockNotificationService.getInbox).toHaveBeenCalled();
    expect(component.messages().length).toBe(1);
    expect(component.targetOptions().length).toBe(1);
  });

  it('should toggle tabs and reload messages', () => {
    component.ngOnInit();
    component.setActiveTab('sent');
    expect(component.activeTab()).toBe('sent');
    expect(mockNotificationService.getSent).toHaveBeenCalled();
  });

  it('should filter messages by search query', () => {
    component.ngOnInit();
    component.searchQuery.set('اطلاعیه');
    expect(component.filteredMessages().length).toBe(1);

    component.searchQuery.set('جستجوی ناموجود');
    expect(component.filteredMessages().length).toBe(0);
  });

  it('should open message details and mark unread message as read', () => {
    component.ngOnInit();
    const msg = component.messages()[0];
    component.openMessageDetails(msg);

    expect(component.selectedMessage()?.id).toBe('msg-1');
    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('msg-1');
    expect(component.getExpirationDate(msg)).toBe('2026-09-01T00:00:00Z');
  });

  it('should validate compose form and submit new message via createNotification', () => {
    component.ngOnInit();
    component.openCompose();

    component.composeForm.patchValue({
      title: 'عنوان پیام ارسالی',
      content: 'متن کامل پیام ارسالی سیستم',
      recipientIds: ['1'],
    });

    expect(component.composeForm.valid).toBe(true);

    component.submitCompose();

    expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'عنوان پیام ارسالی',
        message: 'متن کامل پیام ارسالی سیستم',
        recipientUserIds: ['1'],
        type: 1,
        priority: 1,
        requiresAcknowledgment: false,
      })
    );
    expect(component.isComposeOpen()).toBe(false);
    expect(component.activeTab()).toBe('sent');
    expect(component.toastMessage()).toContain('با موفقیت');
  });

  it('should handle submission errors gracefully and preserve form data', () => {
    mockNotificationService.createNotification.mockReturnValue(
      throwError(() => new Error('Server error'))
    );

    component.ngOnInit();
    component.openCompose();

    component.composeForm.patchValue({
      title: 'عنوان تست خطا',
      content: 'متن تست خطا که باید حفظ شود',
      recipientIds: ['1'],
    });

    component.submitCompose();

    expect(component.isSubmitting()).toBe(false);
    expect(component.isComposeOpen()).toBe(true);
    expect(component.composeForm.get('title')?.value).toBe('عنوان تست خطا');
    expect(component.toastTone()).toBe('error');
  });

  it('should handle list error when getSent fails', () => {
    mockNotificationService.getSent.mockReturnValue(throwError(() => new Error('Network error')));
    component.ngOnInit();
    component.setActiveTab('sent');

    expect(component.listError()).toContain('خطا در دریافت پیام‌های ارسالی');
    expect(component.isLoading()).toBe(false);
  });

  it('should load recipient details and enrich missing names from target options', () => {
    mockNotificationService.getRecipientStatuses.mockReturnValue(
      of([
        {
          recipientId: '1',
          recipientName: '1',
          isRead: true,
          readAt: '2026-08-25T10:00:00Z',
          isAcknowledged: false,
        },
      ])
    );

    component.ngOnInit();
    component.loadRecipients('msg-1');

    expect(mockNotificationService.getRecipientStatuses).toHaveBeenCalledWith('msg-1');
    expect(component.selectedRecipients().length).toBe(1);
    expect(component.selectedRecipients()[0].recipientName).toBe('کلینیک آریا (سارا محمدی)');
    expect(component.selectedRecipients()[0].isRead).toBe(true);
    expect(component.selectedRecipients()[0].isAcknowledged).toBe(false);
  });

  it('should handle recipient status API failure gracefully without breaking state', () => {
    mockNotificationService.getRecipientStatuses.mockReturnValue(
      throwError(() => new Error('500 Internal Error'))
    );

    component.ngOnInit();
    component.loadRecipients('msg-1');

    expect(component.isLoadingRecipients()).toBe(false);
    expect(component.recipientsError()).toContain('خطا در دریافت وضعیت دریافت‌کنندگان');
    expect(component.selectedRecipients().length).toBe(0);
  });
});
