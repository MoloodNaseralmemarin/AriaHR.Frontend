import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';

import { SystemAdminNotificationsComponent } from './system-admin-notifications.component';
import { NotificationService } from '../../../notifications/services/notification.service';
import { OrganizationService } from '../../../organizations/services/organization.service';
import { SystemAdminDataService } from '../../services/system-admin-data.service';

describe('SystemAdminNotificationsComponent (Isolated Tests)', () => {
  let component: SystemAdminNotificationsComponent;
  let mockNotificationService: any;
  let mockOrganizationService: any;
  let mockAdminDataService: any;

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

    mockOrganizationService = {
      getRecentOrganizations: vi.fn().mockReturnValue(
        of([
          { id: '1', name: 'کلینیک آریا', managerFirstName: 'سارا', managerLastName: 'محمدی' },
        ])
      ),
    };

    mockAdminDataService = {
      managers: vi.fn().mockReturnValue([]),
    };

    const injector = Injector.create({
      providers: [
        FormBuilder,
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: OrganizationService, useValue: mockOrganizationService },
        { provide: SystemAdminDataService, useValue: mockAdminDataService },
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
  });

  it('should validate compose form and submit new message', () => {
    component.ngOnInit();
    component.openCompose();

    component.composeForm.patchValue({
      title: 'عنوان پیام ارسالی',
      content: 'متن کامل پیام ارسالی سیستم',
      recipientIds: ['1'],
    });

    expect(component.composeForm.valid).toBe(true);

    component.submitCompose();
    expect(mockNotificationService.createMessage).toHaveBeenCalled();
    expect(component.isComposeOpen()).toBe(false);
  });
});
