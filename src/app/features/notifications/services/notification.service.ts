import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { MessagePriority, MessageType } from '../models/message-enums';
import { CreateNotificationDto, NotificationRecipientStatusResponseDto, NotificationResponseDto } from '../models/notification.dto';
import {
  CreateMessagePayload,
  MessageRecipientStatus,
  MessageReply,
  NotificationMessage,
} from '../models/notification.models';

/**
 * Notification Service providing API integration and fallback state
 * for UI development across System Admin, Center Manager, and Employee portals.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/notifications`;

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

  /**
   * Calls POST /api/notifications API endpoint to create a real backend notification.
   */
  createNotification(request: CreateNotificationDto): Observable<NotificationResponseDto> {
    return this.http.post<NotificationResponseDto>(this.apiUrl, request).pipe(
      tap((res) => {
        // Optimistically prepend mapped NotificationMessage to local signal for UI immediate updates
        const newMsg: NotificationMessage = {
          id: res?.id || `msg-${Date.now()}`,
          title: request.title,
          content: request.message,
          messageType: request.type,
          messagePriority: request.priority,
          senderId: res?.senderUserId || 'sys-admin',
          senderName: res?.senderName || 'مدیریت ارشد سیستم',
          senderRole: 'SystemAdmin',
          createdAt: res?.createdAtUtc || res?.createdAt || new Date().toISOString(),
          publicationStart: request.publishStartAtUtc,
          expiration: request.expiresAtUtc || undefined,
          isRead: true,
          requiresAcknowledgment: request.requiresAcknowledgment,
          isAcknowledged: false,
          recipientType: request.recipientOrganizationId ? 'Organization' : 'Specific',
          recipientCount: request.recipientUserIds?.length || 1,
          acknowledgedCount: 0,
          unreadCount: request.recipientUserIds?.length || 1,
        };
        this._messages.update((list) => [newMsg, ...list]);
      })
    );
  }

  /** Retrieves all inbox messages for active role view. */
  getInbox(filter: 'all' | 'unread' = 'all'): Observable<NotificationMessage[]> {
    return this.http.get<unknown>(`${this.apiUrl}/inbox`).pipe(
      map((res) => {
        const items = this.normalizeNotificationListResponse(res);
        const mapped = items.map((dto) => this.mapDtoToNotificationMessage(dto));
        return filter === 'unread' ? mapped.filter((m) => !m.isRead) : mapped;
      })
    );
  }

  /** Retrieves all sent messages created by current role via real backend API. */
  getSent(): Observable<NotificationMessage[]> {
    return this.http.get<unknown>(`${this.apiUrl}/sent`).pipe(
      map((res) => {
        const items = this.normalizeNotificationListResponse(res);
        return items.map((dto) => this.mapDtoToNotificationMessage(dto));
      })
    );
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

  /** Retrieves recipient read and acknowledgment status for sent messages via real backend API. */
  getRecipientStatuses(messageId: string): Observable<MessageRecipientStatus[]> {
    return this.http.get<unknown>(`${this.apiUrl}/${messageId}/recipients`).pipe(
      map((res) => {
        const items = this.normalizeRecipientListResponse(res);
        return items.map((dto) => this.mapDtoToRecipientStatus(dto));
      })
    );
  }

  private normalizeNotificationListResponse(raw: unknown): NotificationResponseDto[] {
    if (Array.isArray(raw)) {
      return raw as NotificationResponseDto[];
    }
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      if (Array.isArray(obj['items'])) return obj['items'] as NotificationResponseDto[];
      if (Array.isArray(obj['Items'])) return obj['Items'] as NotificationResponseDto[];
      if (Array.isArray(obj['data'])) return obj['data'] as NotificationResponseDto[];
      if (Array.isArray(obj['Data'])) return obj['Data'] as NotificationResponseDto[];
      if (Array.isArray(obj['value'])) return obj['value'] as NotificationResponseDto[];
      if (Array.isArray(obj['Value'])) return obj['Value'] as NotificationResponseDto[];
    }
    return [];
  }

  private normalizeRecipientListResponse(raw: unknown): NotificationRecipientStatusResponseDto[] {
    if (Array.isArray(raw)) {
      return raw as NotificationRecipientStatusResponseDto[];
    }
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      if (Array.isArray(obj['items'])) return obj['items'] as NotificationRecipientStatusResponseDto[];
      if (Array.isArray(obj['Items'])) return obj['Items'] as NotificationRecipientStatusResponseDto[];
      if (Array.isArray(obj['data'])) return obj['data'] as NotificationRecipientStatusResponseDto[];
      if (Array.isArray(obj['Data'])) return obj['Data'] as NotificationRecipientStatusResponseDto[];
      if (Array.isArray(obj['value'])) return obj['value'] as NotificationRecipientStatusResponseDto[];
      if (Array.isArray(obj['Value'])) return obj['Value'] as NotificationRecipientStatusResponseDto[];
    }
    return [];
  }

  private mapDtoToNotificationMessage(dto: NotificationResponseDto | Record<string, unknown>): NotificationMessage {
    const record = dto as Record<string, unknown>;
    const id = String(record['id'] ?? record['Id'] ?? '');
    const title = String(record['title'] ?? record['Title'] ?? '');
    const content = String(
      record['message'] ?? record['Message'] ?? record['content'] ?? record['Content'] ?? ''
    );
    const messageType = Number(
      record['type'] ?? record['Type'] ?? record['messageType'] ?? record['MessageType'] ?? MessageType.Information
    );
    const messagePriority = Number(
      record['priority'] ?? record['Priority'] ?? record['messagePriority'] ?? record['MessagePriority'] ?? MessagePriority.Normal
    );
    const senderId = String(
      record['senderUserId'] ?? record['SenderUserId'] ?? record['senderId'] ?? record['SenderId'] ?? ''
    );
    const senderName = String(
      record['senderName'] ?? record['SenderName'] ?? 'مدیریت ارشد سیستم'
    );
    const createdAt = String(
      record['createdAtUtc'] ?? record['CreatedAtUtc'] ?? record['createdAt'] ?? record['CreatedAt'] ?? new Date().toISOString()
    );
    const publicationStart = record['publishStartAtUtc'] ?? record['PublishStartAtUtc'] ?? record['publicationStart'] ?? record['PublicationStart'];
    const expiration = record['expiresAtUtc'] ?? record['ExpiresAtUtc'] ?? record['expiration'] ?? record['Expiration'];
    const isRead = Boolean(record['isRead'] ?? record['IsRead'] ?? false);
    const readAt = record['readAtUtc'] ?? record['ReadAtUtc'] ?? record['readAt'] ?? record['ReadAt'];
    const requiresAcknowledgment = Boolean(
      record['requiresAcknowledgment'] ?? record['RequiresAcknowledgment'] ?? false
    );
    const isAcknowledged = Boolean(
      record['isAcknowledged'] ?? record['IsAcknowledged'] ?? false
    );
    const acknowledgedAt = record['acknowledgedAtUtc'] ?? record['AcknowledgedAtUtc'] ?? record['acknowledgedAt'] ?? record['AcknowledgedAt'];

    const rawRecUserIds = record['recipientUserIds'] ?? record['RecipientUserIds'];
    const recipientCount = Array.isArray(rawRecUserIds) ? rawRecUserIds.length : 1;

    return {
      id,
      title,
      content,
      messageType,
      messagePriority,
      senderId,
      senderName,
      senderRole: 'SystemAdmin',
      createdAt,
      publicationStart: publicationStart ? String(publicationStart) : undefined,
      expiration: expiration ? String(expiration) : undefined,
      isRead,
      readAt: readAt ? String(readAt) : undefined,
      requiresAcknowledgment,
      isAcknowledged,
      acknowledgedAt: acknowledgedAt ? String(acknowledgedAt) : undefined,
      recipientType: (record['recipientOrganizationId'] || record['RecipientOrganizationId']) ? 'Organization' : 'Specific',
      recipientCount,
    };
  }

  private mapDtoToRecipientStatus(dto: NotificationRecipientStatusResponseDto | Record<string, unknown>): MessageRecipientStatus {
    const record = dto as Record<string, unknown>;
    const recipientId = String(
      record['recipientId'] ?? record['RecipientId'] ?? record['recipientUserId'] ?? record['RecipientUserId'] ?? record['userId'] ?? record['UserId'] ?? record['id'] ?? record['Id'] ?? ''
    );
    const recipientName = String(
      record['recipientName'] ?? record['RecipientName'] ?? record['recipientUserName'] ?? record['RecipientUserName'] ?? record['userName'] ?? record['UserName'] ?? ''
    );
    const organizationName = (record['organizationName'] ?? record['OrganizationName']) ? String(record['organizationName'] ?? record['OrganizationName']) : undefined;
    const isRead = Boolean(record['isRead'] ?? record['IsRead'] ?? false);
    const rawReadAt = record['readAtUtc'] ?? record['ReadAtUtc'] ?? record['readAt'] ?? record['ReadAt'];
    const readAt = rawReadAt ? String(rawReadAt) : undefined;
    const isAcknowledged = Boolean(record['isAcknowledged'] ?? record['IsAcknowledged'] ?? false);
    const rawAckAt = record['acknowledgedAtUtc'] ?? record['AcknowledgedAtUtc'] ?? record['acknowledgedAt'] ?? record['AcknowledgedAt'];
    const acknowledgedAt = rawAckAt ? String(rawAckAt) : undefined;

    return {
      recipientId,
      recipientName,
      organizationName,
      isRead,
      readAt,
      isAcknowledged,
      acknowledgedAt,
    };
  }
}
