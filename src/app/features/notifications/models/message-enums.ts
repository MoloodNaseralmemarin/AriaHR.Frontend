export enum MessageType {
  Information = 1,
  Warning = 2,
  Critical = 3,
  Success = 4,
}

export enum MessagePriority {
  Normal = 1,
  High = 2,
  Urgent = 3,
}

export const MessageTypeLabels: Record<MessageType, string> = {
  [MessageType.Information]: 'اطلاعیه',
  [MessageType.Warning]: 'هشدار',
  [MessageType.Critical]: 'فوری / مهم',
  [MessageType.Success]: 'موفقیت',
};

export const MessagePriorityLabels: Record<MessagePriority, string> = {
  [MessagePriority.Normal]: 'عادی',
  [MessagePriority.High]: 'مهم',
  [MessagePriority.Urgent]: 'فوری',
};
