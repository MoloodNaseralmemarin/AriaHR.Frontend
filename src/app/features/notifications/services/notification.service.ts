import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { MessagePriority, MessageType } from '../models/message-enums';
import {
  CreateMessagePayload,
  MessageRecipientStatus,
  MessageReply,
  NotificationMessage,
} from '../models/notification.models';
import {
  CreateNotificationDto,
  CreateNotificationReplyDto,
  NotificationRecipientStatusResponseDto,
  NotificationReplyResponseDto,
  NotificationResponseDto,
  UpdateNotificationStatusDto,
} from '../models/notification.dto';

/**
 * Feature API service for Notification & Messaging.
 * Communicates directly with the ASP.NET Core backend at `${environment.apiUrl}/api/notifications`.
 * Strictly follows ARIAHR Angular API Integration Standard.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/notifications`;

  /** 1. Create notification: POST /api/notifications */
  createNotification(dto: CreateNotificationDto): Observable<NotificationMessage> {
    return this.http
      .post<NotificationResponseDto>(this.apiUrl, dto)
      .pipe(map((res) => this.mapToNotificationMessage(res)));
  }

  /** Convenience wrapper for existing UI payload format */
  createMessage(
    payload: CreateMessagePayload,
    senderRole?: string,
    senderName?: string
  ): Observable<NotificationMessage> {
    const dto: CreateNotificationDto = {
      title: payload.title,
      message: payload.content,
      type: payload.messageType,
      priority: payload.messagePriority,
      requiresAcknowledgment: !!payload.requiresAcknowledgment,
      publishStartAtUtc: payload.publicationStart || null,
      expiresAtUtc: payload.expiration || null,
      recipientUserIds: payload.recipientType === 'Specific' ? payload.recipientIds : null,
      recipientOrganizationId: payload.recipientType === 'Organization' && payload.recipientIds?.length ? payload.recipientIds[0] : null,
      relatedEntityId: null,
      relatedEntityType: null,
    };
    return this.createNotification(dto);
  }

  /** 2. Get inbox: GET /api/notifications/inbox */
  getInbox(filter: 'all' | 'unread' = 'all'): Observable<NotificationMessage[]> {
    return this.http.get<NotificationResponseDto[]>(`${this.apiUrl}/inbox`).pipe(
      map((res) => {
        const list = (Array.isArray(res) ? res : []).map((item) => this.mapToNotificationMessage(item));
        return filter === 'unread' ? list.filter((m) => !m.isRead) : list;
      })
    );
  }

  /** 3. Get history: GET /api/notifications/history */
  getHistory(): Observable<NotificationMessage[]> {
    return this.http.get<NotificationResponseDto[]>(`${this.apiUrl}/history`).pipe(
      map((res) => (Array.isArray(res) ? res : []).map((item) => this.mapToNotificationMessage(item)))
    );
  }

  /** 4. Get sent notifications: GET /api/notifications/sent */
  getSent(): Observable<NotificationMessage[]> {
    return this.http.get<NotificationResponseDto[]>(`${this.apiUrl}/sent`).pipe(
      map((res) => (Array.isArray(res) ? res : []).map((item) => this.mapToNotificationMessage(item)))
    );
  }

  /** 5. Get notification details: GET /api/notifications/{id} */
  getNotificationDetails(id: string): Observable<NotificationMessage> {
    return this.http
      .get<NotificationResponseDto>(`${this.apiUrl}/${id}`)
      .pipe(map((res) => this.mapToNotificationMessage(res)));
  }

  /** Compatibility helper method */
  getMessageById(id: string): Observable<NotificationMessage> {
    return this.getNotificationDetails(id);
  }

  /** 6. Mark as read: PATCH /api/notifications/{id}/read */
  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/read`, null);
  }

  /** 7. Acknowledge notification: PATCH /api/notifications/{id}/acknowledge */
  acknowledgeNotification(id: string): Observable<{ acknowledgedAt: string }> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/acknowledge`, null).pipe(
      map((res) => {
        const ackAt = res?.acknowledgedAt || res?.acknowledgedAtUtc || new Date().toISOString();
        return { acknowledgedAt: ackAt };
      })
    );
  }

  /** Compatibility helper method */
  acknowledgeMessage(id: string): Observable<{ acknowledgedAt: string }> {
    return this.acknowledgeNotification(id);
  }

  /** 8. Update notification status: PATCH /api/notifications/{id}/status */
  updateNotificationStatus(id: string, status: number): Observable<void> {
    const dto: UpdateNotificationStatusDto = { status };
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, dto);
  }

  /** 9. Submit reply: POST /api/notifications/{id}/replies */
  submitReply(
    notificationId: string,
    targetRecipientUserId: string,
    content: string
  ): Observable<MessageReply> {
    const dto: CreateNotificationReplyDto = {
      targetRecipientUserId,
      content,
    };
    return this.http
      .post<NotificationReplyResponseDto>(`${this.apiUrl}/${notificationId}/replies`, dto)
      .pipe(map((res) => this.mapToMessageReply(res, notificationId)));
  }

  /** Compatibility helper method */
  replyToMessage(
    messageId: string,
    content: string,
    senderName?: string,
    targetRecipientUserId?: string
  ): Observable<MessageReply> {
    return this.submitReply(messageId, targetRecipientUserId || '', content);
  }

  /** 10. Get replies: GET /api/notifications/{id}/replies */
  getReplies(id: string): Observable<MessageReply[]> {
    return this.http.get<NotificationReplyResponseDto[]>(`${this.apiUrl}/${id}/replies`).pipe(
      map((res) => (Array.isArray(res) ? res : []).map((item) => this.mapToMessageReply(item, id)))
    );
  }

  /** Compatibility helper method */
  getThread(messageId: string): Observable<MessageReply[]> {
    return this.getReplies(messageId);
  }

  /** 11. Get recipient statuses: GET /api/notifications/{id}/recipients */
  getRecipientStatuses(id: string): Observable<MessageRecipientStatus[]> {
    return this.http
      .get<NotificationRecipientStatusResponseDto[]>(`${this.apiUrl}/${id}/recipients`)
      .pipe(
        map((res) =>
          (Array.isArray(res) ? res : []).map((item) => this.mapToRecipientStatus(item))
        )
      );
  }

  /** Unread count helper computed via GET inbox */
  getUnreadCount(): Observable<number> {
    return this.getInbox('unread').pipe(map((unread) => unread.length));
  }

  /** Helper mapper from NotificationResponseDto to UI NotificationMessage */
  private mapToNotificationMessage(dto: NotificationResponseDto): NotificationMessage {
    return {
      id: dto.id,
      title: dto.title || '',
      content: dto.message || dto.content || '',
      messageType: dto.type ?? dto.messageType ?? MessageType.Information,
      messagePriority: dto.priority ?? dto.messagePriority ?? MessagePriority.Normal,
      senderId: dto.senderId || '',
      senderName: dto.senderName || 'فرستنده',
      senderRole: (dto.senderRole as any) || 'SystemAdmin',
      createdAt: dto.createdAt || dto.createdAtUtc || new Date().toISOString(),
      publicationStart: dto.publishStartAtUtc || dto.publicationStart,
      expiration: dto.expiresAtUtc || dto.expiration,
      isRead: !!dto.isRead,
      readAt: dto.readAt || dto.readAtUtc,
      requiresAcknowledgment: !!dto.requiresAcknowledgment,
      isAcknowledged: !!dto.isAcknowledged,
      acknowledgedAt: dto.acknowledgedAt || dto.acknowledgedAtUtc,
      recipientType: (dto.recipientType as any) || 'Specific',
      recipientCount: dto.recipientCount ?? 0,
      acknowledgedCount: dto.acknowledgedCount ?? 0,
      unreadCount: dto.unreadCount ?? 0,
    };
  }

  /** Helper mapper from NotificationReplyResponseDto to UI MessageReply */
  private mapToMessageReply(dto: NotificationReplyResponseDto, notificationId: string): MessageReply {
    return {
      id: dto.id,
      messageId: dto.notificationId || dto.messageId || notificationId,
      senderId: dto.senderId || '',
      senderName: dto.senderName || 'کاربر',
      senderRole: dto.senderRole || '',
      content: dto.content || '',
      createdAt: dto.createdAt || dto.createdAtUtc || new Date().toISOString(),
      isSelf: dto.isSelf !== undefined ? dto.isSelf : true,
    };
  }

  /** Helper mapper from NotificationRecipientStatusResponseDto to UI MessageRecipientStatus */
  private mapToRecipientStatus(dto: NotificationRecipientStatusResponseDto): MessageRecipientStatus {
    return {
      recipientId: dto.recipientId || dto.recipientUserId || '',
      recipientName: dto.recipientName || '',
      organizationName: dto.organizationName,
      isRead: !!dto.isRead,
      readAt: dto.readAt || dto.readAtUtc,
      isAcknowledged: !!dto.isAcknowledged,
      acknowledgedAt: dto.acknowledgedAt || dto.acknowledgedAtUtc,
    };
  }
}
