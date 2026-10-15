import { Injectable, computed, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MessagePriority, MessageType } from '../models/message-enums';
import {
  CreateMessagePayload,
  MessageRecipientStatus,
  MessageReply,
  NotificationMessage,
} from '../models/notification.models';

/**
 * Temporary Notification Service providing in-memory state and sample Persian data
 * for UI development across System Admin, Center Manager, and Employee portals.
 *
 * Designed to be easily replaced with live API calls once backend contracts are finalized.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly _messages = signal<NotificationMessage[]>([
    {
      id: 'msg-1',
      title: 'بروزرسانی قوانین حضور و غیاب سازمان',
      content:
        'همکاران گرامی، لطفاً توجه داشته باشید از ابتدای ماه آینده تمام ثبت ترددها صرفاً با اسکن کد QR محل کار انجام خواهد پذیرفت.',
      messageType: MessageType.Information,
      messagePriority: MessagePriority.High,
      senderId: 'sys-admin-1',
      senderName: 'مدیریت ارشد سیستم',
      senderRole: 'SystemAdmin',
      createdAt: '2026-08-25T08:30:00Z',
      publicationStart: '2026-08-25T08:00:00Z',
      expiration: '2026-09-25T08:00:00Z',
      isRead: false,
      requiresAcknowledgment: true,
      isAcknowledged: false,
      recipientType: 'All',
      recipientCount: 45,
      acknowledgedCount: 28,
      unreadCount: 17,
    },
    {
      id: 'msg-2',
      title: 'هشدار قطعی موقت سامانه ثبت مرخصی',
      content:
        'به اطلاع می‌رساند سامانه ثبت مرخصی‌ها در روز پنج‌شنبه از ساعت ۲۲ الی ۲ بامداد جهت به‌روزرسانی در دسترس نخواهد بود.',
      messageType: MessageType.Warning,
      messagePriority: MessagePriority.Normal,
      senderId: 'mgr-1',
      senderName: 'سارا محمدی (مدیر مرکز)',
      senderRole: 'CenterManager',
      createdAt: '2026-08-24T14:15:00Z',
      isRead: false,
      requiresAcknowledgment: false,
      isAcknowledged: false,
      recipientType: 'Organization',
      recipientCount: 18,
      acknowledgedCount: 0,
      unreadCount: 5,
    },
    {
      id: 'msg-3',
      title: 'تایید درخواست مرخصی استحقاقی',
      content: 'درخواست مرخصی روزانه شما برای تاریخ ۱۴۰۵/۰۶/۱۰ با موفقیت توسط مدیر مرکز تایید شد.',
      messageType: MessageType.Success,
      messagePriority: MessagePriority.Normal,
      senderId: 'mgr-1',
      senderName: 'سارا محمدی (مدیر مرکز)',
      senderRole: 'CenterManager',
      createdAt: '2026-08-23T11:00:00Z',
      isRead: true,
      readAt: '2026-08-23T11:30:00Z',
      requiresAcknowledgment: false,
      isAcknowledged: false,
      recipientType: 'Specific',
      recipientCount: 1,
      acknowledgedCount: 0,
      unreadCount: 0,
    },
    {
      id: 'msg-4',
      title: 'لزوم ارسال مدرک مرخصی استعلاجی',
      content:
        'جهت نهایی‌سازی درخواست مرخصی استعلاجی ثبت شده، لطفاً گواهی پزشک معالج را تا پایان وقت اداری امروز بارگذاری نمایید.',
      messageType: MessageType.Critical,
      messagePriority: MessagePriority.Urgent,
      senderId: 'mgr-1',
      senderName: 'مدیریت منابع انسانی',
      senderRole: 'CenterManager',
      createdAt: '2026-08-22T09:45:00Z',
      isRead: true,
      readAt: '2026-08-22T10:00:00Z',
      requiresAcknowledgment: true,
      isAcknowledged: true,
      acknowledgedAt: '2026-08-22T10:05:00Z',
      recipientType: 'Specific',
      recipientCount: 1,
      acknowledgedCount: 1,
      unreadCount: 0,
    },
  ]);

  private readonly _replies = signal<Record<string, MessageReply[]>>({
    'msg-1': [
      {
        id: 'rep-1',
        messageId: 'msg-1',
        senderId: 'emp-101',
        senderName: 'علی علوی',
        senderRole: 'Employee',
        content: 'با سلام، آیا امکان استفاده از دستگاه‌های اثر انگشت قدیمی همچنان وجود دارد؟',
        createdAt: '2026-08-25T09:10:00Z',
        isSelf: false,
      },
      {
        id: 'rep-2',
        messageId: 'msg-1',
        senderId: 'sys-admin-1',
        senderName: 'مدیریت ارشد سیستم',
        senderRole: 'SystemAdmin',
        content: 'با سلام، خیر از ابتدای ماه آینده ثبت تردد صرفاً از طریق QR کد امکان‌پذیر خواهد بود.',
        createdAt: '2026-08-25T09:25:00Z',
        isSelf: true,
      },
    ],
    'msg-4': [
      {
        id: 'rep-3',
        messageId: 'msg-4',
        senderId: 'emp-101',
        senderName: 'علی علوی',
        senderRole: 'Employee',
        content: 'گواهی پزشک دریافت شد و اسکن آن بارگذاری گردید.',
        createdAt: '2026-08-22T10:04:00Z',
        isSelf: true,
      },
    ],
  });

  private readonly _recipients = signal<Record<string, MessageRecipientStatus[]>>({
    'msg-1': [
      {
        recipientId: 'c1',
        recipientName: 'مرکز تصویربرداری پارس (دکتر احمدی)',
        organizationName: 'مرکز تصویربرداری پارس',
        isRead: true,
        readAt: '2026-08-25T08:40:00Z',
        isAcknowledged: true,
        acknowledgedAt: '2026-08-25T08:45:00Z',
      },
      {
        recipientId: 'c2',
        recipientName: 'کلینیک آریا (سارا محمدی)',
        organizationName: 'کلینیک آریا',
        isRead: true,
        readAt: '2026-08-25T09:00:00Z',
        isAcknowledged: true,
        acknowledgedAt: '2026-08-25T09:15:00Z',
      },
      {
        recipientId: 'c3',
        recipientName: 'مرکز پزشکی نوین (علی رضایی)',
        organizationName: 'مرکز پزشکی نوین',
        isRead: false,
        isAcknowledged: false,
      },
    ],
    'msg-2': [
      {
        recipientId: 'emp-1',
        recipientName: 'علی علوی',
        organizationName: 'کلینیک آریا',
        isRead: true,
        readAt: '2026-08-24T15:00:00Z',
        isAcknowledged: false,
      },
      {
        recipientId: 'emp-2',
        recipientName: 'مریم حسینی',
        organizationName: 'کلینیک آریا',
        isRead: false,
        isAcknowledged: false,
      },
    ],
  });

  readonly messages = this._messages.asReadonly();
  readonly unreadCount = computed(() => this._messages().filter((m) => !m.isRead).length);

  /** Retrieves all inbox messages for active role view. */
  getInbox(filter: 'all' | 'unread' = 'all'): Observable<NotificationMessage[]> {
    const list = this._messages();
    const filtered = filter === 'unread' ? list.filter((m) => !m.isRead) : list;
    return of(filtered).pipe(delay(100));
  }

  /** Retrieves all sent messages created by current role. */
  getSent(): Observable<NotificationMessage[]> {
    return of(this._messages()).pipe(delay(100));
  }

  /** Retrieves a single message by ID. */
  getMessageById(id: string): Observable<NotificationMessage | null> {
    const msg = this._messages().find((m) => m.id === id) || null;
    return of(msg).pipe(delay(50));
  }

  /** Retrieves unread inbox message count. */
  getUnreadCount(): Observable<number> {
    return of(this.unreadCount()).pipe(delay(50));
  }

  /** Marks a message as read in memory. */
  markAsRead(id: string): Observable<void> {
    const nowIso = new Date().toISOString();
    this._messages.update((list) =>
      list.map((m) => (m.id === id ? { ...m, isRead: true, readAt: m.readAt || nowIso } : m))
    );
    return of(undefined).pipe(delay(50));
  }

  /** Marks a message as explicitly acknowledged in memory with current timestamp. */
  acknowledgeMessage(id: string): Observable<{ acknowledgedAt: string }> {
    const nowIso = new Date().toISOString();
    let updatedIso = nowIso;

    this._messages.update((list) =>
      list.map((m) => {
        if (m.id === id) {
          updatedIso = nowIso;
          return {
            ...m,
            isRead: true,
            readAt: m.readAt || nowIso,
            isAcknowledged: true,
            acknowledgedAt: nowIso,
            acknowledgedCount: (m.acknowledgedCount || 0) + 1,
          };
        }
        return m;
      })
    );

    return of({ acknowledgedAt: updatedIso }).pipe(delay(100));
  }

  /** Creates and posts a new message in memory. */
  createMessage(payload: CreateMessagePayload, senderRole: string = 'CenterManager', senderName: string = 'کاربر جاری'): Observable<NotificationMessage> {
    const nowIso = new Date().toISOString();
    const newMsg: NotificationMessage = {
      id: `msg-${Date.now()}`,
      title: payload.title,
      content: payload.content,
      messageType: payload.messageType,
      messagePriority: payload.messagePriority,
      senderId: 'current-user',
      senderName,
      senderRole,
      createdAt: nowIso,
      publicationStart: payload.publicationStart,
      expiration: payload.expiration,
      isRead: true,
      requiresAcknowledgment: payload.requiresAcknowledgment,
      isAcknowledged: false,
      recipientType: payload.recipientType,
      recipientCount: payload.recipientIds.length || 1,
      acknowledgedCount: 0,
      unreadCount: payload.recipientIds.length || 1,
    };

    this._messages.update((list) => [newMsg, ...list]);
    return of(newMsg).pipe(delay(150));
  }

  /** Submits a private thread reply in memory. */
  replyToMessage(messageId: string, content: string, senderName: string = 'من'): Observable<MessageReply> {
    const nowIso = new Date().toISOString();
    const newReply: MessageReply = {
      id: `rep-${Date.now()}`,
      messageId,
      senderId: 'current-user',
      senderName,
      senderRole: 'CurrentUser',
      content,
      createdAt: nowIso,
      isSelf: true,
    };

    this._replies.update((map) => {
      const existing = map[messageId] || [];
      return {
        ...map,
        [messageId]: [...existing, newReply],
      };
    });

    return of(newReply).pipe(delay(100));
  }

  /** Retrieves private conversation thread for a message. */
  getThread(messageId: string): Observable<MessageReply[]> {
    const thread = this._replies()[messageId] || [];
    return of(thread).pipe(delay(50));
  }

  /** Retrieves recipient read and acknowledgment status for sent messages. */
  getRecipientStatuses(messageId: string): Observable<MessageRecipientStatus[]> {
    const statuses = this._recipients()[messageId] || [];
    return of(statuses).pipe(delay(50));
  }
}
