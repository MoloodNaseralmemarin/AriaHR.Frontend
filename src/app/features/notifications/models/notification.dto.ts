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
  [key: string]: unknown;
}
