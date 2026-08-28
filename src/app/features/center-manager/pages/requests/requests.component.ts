import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';

import { mockRequests } from '../../mock-data/mock-data';
import { requestStatusMap } from '../../../../shared/utils/status-map';
import { RequestItem, RequestStatus } from '../../../../shared/models/center-manager.models';

type RequestTab = 'all' | RequestStatus;

/**
 * /center/requests
 * Tabs + request cards with تأیید / رد / مشاهده جزئیات actions.
 * Approve/reject only mutate the local mock array and show a toast —
 * there is no API call, per the "UI only" requirement.
 */
@Component({
  selector: 'app-center-requests',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, StatusBadgeComponent, EmptyStateComponent, ToastComponent],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.css'],
})
export class RequestsComponent {
  requestStatusMap = requestStatusMap;

  requests = signal<RequestItem[]>(mockRequests);
  activeTab = signal<RequestTab>('all');

  toastMessage = signal<string | null>(null);

  tabs: { value: RequestTab; label: string }[] = [
    { value: 'all', label: 'همه' },
    { value: 'pending', label: 'در انتظار بررسی' },
    { value: 'approved', label: 'تأیید شده' },
    { value: 'rejected', label: 'رد شده' },
  ];

  filteredRequests = computed<RequestItem[]>(() => {
    const tab = this.activeTab();
    const all = this.requests();
    return tab === 'all' ? all : all.filter((r) => r.status === tab);
  });

  setTab(tab: RequestTab): void {
    this.activeTab.set(tab);
  }

  approve(item: RequestItem): void {
    this.updateStatus(item.id, 'approved');
    this.showToast(`درخواست ${item.employeeName} تأیید شد.`);
  }

  reject(item: RequestItem): void {
    this.updateStatus(item.id, 'rejected');
    this.showToast(`درخواست ${item.employeeName} رد شد.`);
  }

  viewDetails(item: RequestItem): void {
    console.log('view request details (UI only):', item.id);
  }

  private updateStatus(id: string, status: RequestStatus): void {
    this.requests.update((list) =>
      list.map((r) => (r.id === id ? { ...r, status } : r))
    );
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 2500);
  }
}
