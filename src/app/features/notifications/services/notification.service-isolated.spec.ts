import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { NotificationService } from './notification.service';
import { MessagePriority, MessageType } from '../models/message-enums';
import { environment } from '../../../../environments/environment';

describe('NotificationService (Isolated Tests)', () => {
  let service: NotificationService;
  let mockHttp: any;

  beforeEach(() => {
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: mockHttp },
        NotificationService,
      ],
    });

    runInInjectionContext(injector, () => {
      service = injector.get(NotificationService);
    });
  });

  it('should call GET /api/notifications/inbox and map response', () => {
    return new Promise<void>((resolve) => {
      const apiResponse = [
        {
          id: '1',
          title: 'تست',
          message: 'محتوا',
          type: MessageType.Information,
          priority: MessagePriority.Normal,
          senderId: 'usr-1',
          senderName: 'فرستنده',
          isRead: false,
        },
      ];
      mockHttp.get.mockReturnValue(of(apiResponse));

      service.getInbox().subscribe((messages) => {
        expect(mockHttp.get).toHaveBeenCalledWith(`${environment.apiUrl}/api/notifications/inbox`);
        expect(messages.length).toBe(1);
        expect(messages[0].content).toBe('محتوا');
        resolve();
      });
    });
  });

  it('should call GET /api/notifications/sent', () => {
    return new Promise<void>((resolve) => {
      mockHttp.get.mockReturnValue(of([]));

      service.getSent().subscribe((messages) => {
        expect(mockHttp.get).toHaveBeenCalledWith(`${environment.apiUrl}/api/notifications/sent`);
        expect(messages).toEqual([]);
        resolve();
      });
    });
  });

  it('should call POST /api/notifications when creating message', () => {
    return new Promise<void>((resolve) => {
      const payload = {
        title: 'پیام تست جدید',
        content: 'متن پیام آزمایش اولیه',
        messageType: MessageType.Information,
        messagePriority: MessagePriority.Normal,
        recipientType: 'Specific' as const,
        recipientIds: ['usr-2'],
        requiresAcknowledgment: false,
      };

      const apiResponse = {
        id: 'msg-99',
        title: payload.title,
        message: payload.content,
        senderId: 'usr-1',
        senderName: 'مدیر',
      };
      mockHttp.post.mockReturnValue(of(apiResponse));

      service.createMessage(payload).subscribe((created) => {
        expect(mockHttp.post).toHaveBeenCalledWith(
          `${environment.apiUrl}/api/notifications`,
          expect.objectContaining({
            title: 'پیام تست جدید',
            message: 'متن پیام آزمایش اولیه',
            recipientUserIds: ['usr-2'],
          })
        );
        expect(created.id).toBe('msg-99');
        resolve();
      });
    });
  });

  it('should call PATCH /api/notifications/{id}/read', () => {
    return new Promise<void>((resolve) => {
      mockHttp.patch.mockReturnValue(of(undefined));

      service.markAsRead('msg-1').subscribe(() => {
        expect(mockHttp.patch).toHaveBeenCalledWith(
          `${environment.apiUrl}/api/notifications/msg-1/read`,
          null
        );
        resolve();
      });
    });
  });

  it('should call PATCH /api/notifications/{id}/acknowledge', () => {
    return new Promise<void>((resolve) => {
      mockHttp.patch.mockReturnValue(of({ acknowledgedAtUtc: '2026-10-17T09:00:00Z' }));

      service.acknowledgeNotification('msg-1').subscribe((res) => {
        expect(mockHttp.patch).toHaveBeenCalledWith(
          `${environment.apiUrl}/api/notifications/msg-1/acknowledge`,
          null
        );
        expect(res.acknowledgedAt).toBe('2026-10-17T09:00:00Z');
        resolve();
      });
    });
  });

  it('should call POST /api/notifications/{id}/replies', () => {
    return new Promise<void>((resolve) => {
      const apiResponse = {
        id: 'rep-1',
        notificationId: 'msg-1',
        senderId: 'usr-1',
        senderName: 'پاسخ دهنده',
        content: 'پاسخ تست',
      };
      mockHttp.post.mockReturnValue(of(apiResponse));

      service.submitReply('msg-1', 'target-user-123', 'پاسخ تست').subscribe((reply) => {
        expect(mockHttp.post).toHaveBeenCalledWith(
          `${environment.apiUrl}/api/notifications/msg-1/replies`,
          {
            targetRecipientUserId: 'target-user-123',
            content: 'پاسخ تست',
          }
        );
        expect(reply.content).toBe('پاسخ تست');
        resolve();
      });
    });
  });
});
