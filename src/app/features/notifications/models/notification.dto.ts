import { MessagePriority, MessageType } from './message-enums';

export interface CreateNotificationDto {
  title: string;
  message: string;
  type: MessageType;
  priority: MessagePriority;
  requiresAcknowledgment: boolean;
  publishStartAtUtc?: string | null;
  expiresAtUtc?: string | null;
  recipientUserIds?: string[] | null;
  recipientOrganizationId?: string | null;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
}

export interface UpdateNotificationStatusDto {
  status: number;
}

export interface CreateNotificationReplyDto {
  targetRecipientUserId: string;
  content: string;
}

export interface NotificationResponseDto {
  id: string;
  title: string;
  message?: string;
  content?: string;
  type?: MessageType;
  messageType?: MessageType;
  priority?: MessagePriority;
  messagePriority?: MessagePriority;
  senderId: string;
  senderName: string;
  senderRole?: string;
  createdAt?: string;
  createdAtUtc?: string;
  publishStartAtUtc?: string;
  publicationStart?: string;
  expiresAtUtc?: string;
  expiration?: string;
  isRead?: boolean;
  readAt?: string;
  readAtUtc?: string;
  requiresAcknowledgment?: boolean;
  isAcknowledged?: boolean;
  acknowledgedAt?: string;
  acknowledgedAtUtc?: string;
  recipientType?: 'Specific' | 'Organization' | 'All' | string;
  recipientCount?: number;
  acknowledgedCount?: number;
  unreadCount?: number;
}

export interface NotificationReplyResponseDto {
  id: string;
  notificationId?: string;
  messageId?: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  createdAt?: string;
  createdAtUtc?: string;
  isSelf?: boolean;
}

export interface NotificationRecipientStatusResponseDto {
  recipientId: string;
  recipientUserId?: string;
  recipientName: string;
  organizationName?: string;
  isRead: boolean;
  readAt?: string;
  readAtUtc?: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedAtUtc?: string;
}
