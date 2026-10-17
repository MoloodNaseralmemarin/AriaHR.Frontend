import { MessagePriority, MessageType } from './message-enums';

export interface CreateNotificationDto {
  title: string;
  message: string;
  type: MessageType;
  priority: MessagePriority;
  requiresAcknowledgment: boolean;
  publishStartAtUtc: string;
  expiresAtUtc: string | null;
  recipientUserIds: string[];
  recipientOrganizationId: string | null;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
}

export interface NotificationResponseDto {
  id: string;
  title: string;
  message: string;
  type: MessageType;
  priority: MessagePriority;
  requiresAcknowledgment: boolean;
  publishStartAtUtc?: string | null;
  expiresAtUtc?: string | null;
  createdAtUtc?: string;
  createdAt?: string;
  senderUserId?: string;
  senderName?: string;
  recipientOrganizationId?: string | null;
  recipientUserIds?: string[];
  isRead?: boolean | null;
  readAtUtc?: string | null;
  isAcknowledged?: boolean | null;
  acknowledgedAtUtc?: string | null;
  [key: string]: unknown;
}

export interface NotificationRecipientStatusResponseDto {
  id?: string;
  recipientId?: string;
  recipientUserId?: string;
  userId?: string;
  recipientName?: string;
  recipientUserName?: string;
  userName?: string;
  organizationId?: string;
  organizationName?: string;
  isRead: boolean;
  readAtUtc?: string | null;
  readAt?: string | null;
  isAcknowledged: boolean;
  acknowledgedAtUtc?: string | null;
  acknowledgedAt?: string | null;
  [key: string]: unknown;
}
