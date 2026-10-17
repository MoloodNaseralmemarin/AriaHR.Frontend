import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';

import { NotificationService } from './notification.service';
import { MessagePriority, MessageType } from '../models/message-enums';
import { CreateNotificationDto } from '../models/notification.dto';

describe('NotificationService (Isolated Tests)', () => {
  let service: NotificationService;
  let mockHttpClient: { post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockHttpClient = {
      post: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: NotificationService, useClass: NotificationService },
      ],
    });

    runInInjectionContext(injector, () => {
      service = injector.get(NotificationService);
    });
  });

  it('should initialize with sample messages and unread count', async () => {
    const messages = await firstValueFrom(service.getInbox());
    expect(messages.length).toBeGreaterThan(0);
  });

  it('should filter unread messages correctly', async () => {
    const unreadList = await firstValueFrom(service.getInbox('unread'));
    expect(unreadList.every((m) => !m.isRead)).toBe(true);
  });

  it('should mark message as read', async () => {
    await firstValueFrom(service.markAsRead('msg-1'));
    const msg = await firstValueFrom(service.getMessageById('msg-1'));
    expect(msg?.isRead).toBe(true);
    expect(msg?.readAt).toBeDefined();
  });

  it('should explicitly acknowledge a message with timestamp', async () => {
    const res = await firstValueFrom(service.acknowledgeMessage('msg-1'));
    expect(res.acknowledgedAt).toBeDefined();
    const msg = await firstValueFrom(service.getMessageById('msg-1'));
    expect(msg?.isAcknowledged).toBe(true);
    expect(msg?.acknowledgedAt).toBeDefined();
  });

  it('should call POST /api/notifications when createNotification is invoked', async () => {
    const dto: CreateNotificationDto = {
      title: 'عنوان اطلاعیه جدید',
      message: 'متن اطلاعیه جدید',
      type: MessageType.Information,
      priority: MessagePriority.Normal,
      requiresAcknowledgment: true,
      publishStartAtUtc: '2026-10-17T08:00:00.000Z',
      expiresAtUtc: null,
      recipientUserIds: ['user-123'],
      recipientOrganizationId: null,
      relatedEntityId: null,
      relatedEntityType: null,
    };

    const apiResponse = {
      id: 'backend-msg-99',
      title: dto.title,
      message: dto.message,
      type: dto.type,
      priority: dto.priority,
      requiresAcknowledgment: dto.requiresAcknowledgment,
      publishStartAtUtc: dto.publishStartAtUtc,
      expiresAtUtc: null,
      createdAtUtc: '2026-10-17T08:00:00.000Z',
      senderUserId: 'sys-admin-1',
      senderName: 'مدیریت ارشد سیستم',
    };

    mockHttpClient.post.mockReturnValue(of(apiResponse));

    const res = await firstValueFrom(service.createNotification(dto));
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications'),
      dto
    );
    expect(res.id).toBe('backend-msg-99');
  });

  it('should create new message in memory and append to list using createMessage', async () => {
    const payload = {
      title: 'پیام تست جدید',
      content: 'متن پیام آزمایش اولیه',
      messageType: MessageType.Information,
      messagePriority: MessagePriority.Normal,
      recipientType: 'Organization' as const,
      recipientIds: ['c1'],
      requiresAcknowledgment: false,
    };

    const created = await firstValueFrom(service.createMessage(payload, 'SystemAdmin', 'مدیر ارشد'));
    expect(created.id).toBeDefined();
    expect(created.title).toBe('پیام تست جدید');

    const list = await firstValueFrom(service.getInbox());
    expect(list.some((m) => m.id === created.id)).toBe(true);
  });

  it('should submit reply and update thread', async () => {
    const reply = await firstValueFrom(service.replyToMessage('msg-1', 'پاسخ آزمایشی به اطلاعیه'));
    expect(reply.content).toBe('پاسخ آزمایشی به اطلاعیه');

    const thread = await firstValueFrom(service.getThread('msg-1'));
    expect(thread.some((r) => r.content === 'پاسخ آزمایشی به اطلاعیه')).toBe(true);
  });
});
