import { MessagePriority, MessageType } from './message-enums';

export interface NotificationMessage {
  id: string;
  title: string;
  content: string;
  messageType: MessageType;
  messagePriority: MessagePriority;
  senderId: string;
  senderName: string;
  senderRole: 'SystemAdmin' | 'CenterManager' | 'Employee' | string;
  createdAt: string;
  publicationStart?: string;
  expiration?: string;
  isRead: boolean;
  readAt?: string;
  requiresAcknowledgment: boolean;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  recipientType?: 'Specific' | 'Organization' | 'All';
  recipientCount?: number;
  acknowledgedCount?: number;
  unreadCount?: number;
}

export interface CreateMessagePayload {
  title: string;
  content: string;
  messageType: MessageType;
  messagePriority: MessagePriority;
  recipientType: 'Specific' | 'Organization' | 'All';
  recipientIds: string[];
  publicationStart?: string;
  expiration?: string;
  requiresAcknowledgment: boolean;
}

export interface MessageReply {
  id: string;
  messageId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
  isSelf: boolean;
}

export interface MessageRecipientStatus {
  recipientId: string;
  recipientName: string;
  organizationName?: string;
  isRead: boolean;
  readAt?: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
}
