import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';

import { NotificationService } from './notification.service';
import { MessagePriority, MessageType } from '../models/message-enums';

describe('NotificationService (Isolated Tests)', () => {
  let service: NotificationService;
  let mockHttpClient: { get: any; post: any; patch: any };

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        NotificationService,
      ],
    });

    runInInjectionContext(injector, () => {
      service = injector.get(NotificationService);
    });
  });

  it('should call PATCH /api/notifications/{id}/read when marking a notification as read', async () => {
    mockHttpClient.patch.mockReturnValue(of(undefined));

    await firstValueFrom(service.markAsRead('msg-101'));

    expect(mockHttpClient.patch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/msg-101/read'),
      {}
    );
  });

  it('should call PATCH /api/notifications/{id}/acknowledge when acknowledging a notification', async () => {
    mockHttpClient.patch.mockReturnValue(of({ acknowledgedAtUtc: '2026-10-17T12:00:00Z' }));

    const res = await firstValueFrom(service.acknowledgeMessage('msg-101'));

    expect(mockHttpClient.patch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications/msg-101/acknowledge'),
      {}
    );
    expect(res.acknowledgedAt).toBe('2026-10-17T12:00:00Z');
  });

  it('should call GET /api/notifications/sent and map array response to NotificationMessage[]', async () => {
    const rawBackendData = [
      {
        id: 'sent-101',
        title: 'اطلاعیه ارسالی سیستم',
        message: 'متن کامل اطلاعیه ارسالی',
        type: MessageType.Warning,
        priority: MessagePriority.High,
        requiresAcknowledgment: true,
        publishStartAtUtc: '2026-10-17T10:00:00Z',
        createdAtUtc: '2026-10-17T10:00:00Z',
        senderUserId: 'sys-admin-1',
        senderName: 'مدیر ارشد',
        recipientOrganizationId: 'org-1',
      },
    ];

    mockHttpClient.get.mockReturnValue(of(rawBackendData));

    const messages = await firstValueFrom(service.getSent());

    expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/api/notifications/sent'));
    expect(messages.length).toBe(1);
    expect(messages[0].id).toBe('sent-101');
    expect(messages[0].title).toBe('اطلاعیه ارسالی سیستم');
    expect(messages[0].content).toBe('متن کامل اطلاعیه ارسالی');
    expect(messages[0].messageType).toBe(MessageType.Warning);
    expect(messages[0].messagePriority).toBe(MessagePriority.High);
    expect(messages[0].requiresAcknowledgment).toBe(true);
    expect(messages[0].recipientType).toBe('Organization');
  });

  it('should normalize wrapped paginated response object from GET /api/notifications/sent', async () => {
    const wrappedResponse = {
      items: [
        {
          Id: 'sent-102',
          Title: 'پیام پاسکال کیسی',
          Message: 'محتوای پیام پاسکال',
          Type: 1,
          Priority: 1,
          RequiresAcknowledgment: false,
          CreatedAtUtc: '2026-10-17T11:00:00Z',
        },
      ],
      totalCount: 1,
      pageNumber: 1,
    };

    mockHttpClient.get.mockReturnValue(of(wrappedResponse));

    const messages = await firstValueFrom(service.getSent());

    expect(messages.length).toBe(1);
    expect(messages[0].id).toBe('sent-102');
    expect(messages[0].title).toBe('پیام پاسکال کیسی');
    expect(messages[0].content).toBe('محتوای پیام پاسکال');
  });

  it('should call GET /api/notifications/{id}/recipients and map recipient status response', async () => {
    const rawRecipientsData = [
      {
        recipientUserId: 'usr-1',
        recipientName: 'علی رضایی',
        organizationName: 'مرکز پارس',
        isRead: true,
        readAtUtc: '2026-10-17T10:30:00Z',
        isAcknowledged: true,
        acknowledgedAtUtc: '2026-10-17T10:35:00Z',
      },
      {
        recipientUserId: 'usr-2',
        recipientName: 'مریم حسینی',
        organizationName: 'مرکز پارس',
        isRead: true,
        readAtUtc: '2026-10-17T10:40:00Z',
        isAcknowledged: false,
      },
    ];

    mockHttpClient.get.mockReturnValue(of(rawRecipientsData));

    const statuses = await firstValueFrom(service.getRecipientStatuses('msg-101'));

    expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/api/notifications/msg-101/recipients'));
    expect(statuses.length).toBe(2);

    expect(statuses[0].recipientId).toBe('usr-1');
    expect(statuses[0].recipientName).toBe('علی رضایی');
    expect(statuses[0].organizationName).toBe('مرکز پارس');
    expect(statuses[0].isRead).toBe(true);
    expect(statuses[0].isAcknowledged).toBe(true);

    expect(statuses[1].recipientId).toBe('usr-2');
    expect(statuses[1].isRead).toBe(true);
    expect(statuses[1].isAcknowledged).toBe(false);
  });
});
