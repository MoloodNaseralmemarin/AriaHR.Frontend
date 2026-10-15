import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';

import { NotificationService } from './notification.service';
import { MessagePriority, MessageType } from '../models/message-enums';

describe('NotificationService (Isolated Tests)', () => {
  let service: NotificationService;

  beforeEach(() => {
    const injector = Injector.create({
      providers: [{ provide: NotificationService, useClass: NotificationService }],
    });

    runInInjectionContext(injector, () => {
      service = injector.get(NotificationService);
    });
  });

  it('should initialize with sample messages and unread count', (done) => {
    service.getInbox().subscribe((messages) => {
      expect(messages.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should filter unread messages correctly', (done) => {
    service.getInbox('unread').subscribe((unreadList) => {
      expect(unreadList.every((m) => !m.isRead)).toBe(true);
      done();
    });
  });

  it('should mark message as read', (done) => {
    service.markAsRead('msg-1').subscribe(() => {
      service.getMessageById('msg-1').subscribe((msg) => {
        expect(msg?.isRead).toBe(true);
        expect(msg?.readAt).toBeDefined();
        done();
      });
    });
  });

  it('should explicitly acknowledge a message with timestamp', (done) => {
    service.acknowledgeMessage('msg-1').subscribe((res) => {
      expect(res.acknowledgedAt).toBeDefined();
      service.getMessageById('msg-1').subscribe((msg) => {
        expect(msg?.isAcknowledged).toBe(true);
        expect(msg?.acknowledgedAt).toBeDefined();
        done();
      });
    });
  });

  it('should create new message and append to list', (done) => {
    const payload = {
      title: 'پیام تست جدید',
      content: 'متن پیام آزمایش اولیه',
      messageType: MessageType.Information,
      messagePriority: MessagePriority.Normal,
      recipientType: 'Organization' as const,
      recipientIds: ['c1'],
      requiresAcknowledgment: false,
    };

    service.createMessage(payload, 'SystemAdmin', 'مدیر ارشد').subscribe((created) => {
      expect(created.id).toBeDefined();
      expect(created.title).toBe('پیام تست جدید');

      service.getInbox().subscribe((list) => {
        expect(list.some((m) => m.id === created.id)).toBe(true);
        done();
      });
    });
  });

  it('should submit reply and update thread', (done) => {
    service.replyToMessage('msg-1', 'پاسخ آزمایشی به اطلاعیه').subscribe((reply) => {
      expect(reply.content).toBe('پاسخ آزمایشی به اطلاعیه');

      service.getThread('msg-1').subscribe((thread) => {
        expect(thread.some((r) => r.content === 'پاسخ آزمایشی به اطلاعیه')).toBe(true);
        done();
      });
    });
  });
});
