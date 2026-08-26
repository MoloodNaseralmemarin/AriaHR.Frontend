import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

import { mockNotifications } from '../../mock-data/mock-data';
import { NotificationItem, NotificationType } from '../../../../shared/models/center-manager.models';

type NotificationFilter = 'all' | 'unread';

/**
 * /center/notifications
 * Notification list with visually distinct read/unread rows and an
 * "همه / خوانده نشده" filter. Marking as read only mutates local state.
 */
@Component({
  selector: 'app-center-notifications',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, EmptyStateComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent {
  notifications = signal<NotificationItem[]>(mockNotifications);
  activeFilter = signal<NotificationFilter>('all');

  filters: { value: NotificationFilter; label: string }[] = [
    { value: 'all', label: 'همه' },
    { value: 'unread', label: 'خوانده نشده' },
  ];

  filteredNotifications = computed<NotificationItem[]>(() => {
    const filter = this.activeFilter();
    const all = this.notifications();
    return filter === 'unread' ? all.filter((n) => !n.isRead) : all;
  });

  unreadCount = computed(() => this.notifications().filter((n) => !n.isRead).length);

  setFilter(filter: NotificationFilter): void {
    this.activeFilter.set(filter);
  }

  markAsRead(item: NotificationItem): void {
    this.notifications.update((list) =>
      list.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
  }

  markAllAsRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
  }

  iconFor(type: NotificationType): 'shift' | 'request' | 'report' | 'system' {
    return type;
  }
}
