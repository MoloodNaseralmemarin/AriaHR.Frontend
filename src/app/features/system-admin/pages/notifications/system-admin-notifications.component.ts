import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastComponent, ToastTone } from '../../../../shared/components/toast/toast.component';
import { JalaliPipe } from '../../../../shared/pipes/jalali.pipe';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';

import { NotificationService } from '../../../notifications/services/notification.service';
import { MessagePriorityLabels, MessageTypeLabels, MessagePriority, MessageType } from '../../../notifications/models/message-enums';
import { MessageRecipientStatus, MessageReply, NotificationMessage } from '../../../notifications/models/notification.models';
import { CreateNotificationDto } from '../../../notifications/models/notification.dto';
import { OrganizationService } from '../../../organizations/services/organization.service';
import { RecentOrganizationDto } from '../../../organizations/models/recent-organization.dto';
import { SystemAdminDataService } from '../../services/system-admin-data.service';

type ActiveTab = 'inbox' | 'sent';
type ReadFilter = 'all' | 'unread';

@Component({
  selector: 'app-system-admin-notifications',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ToastComponent,
    JalaliPipe,
    PersianDigitsPipe,
  ],
  templateUrl: './system-admin-notifications.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemAdminNotificationsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly organizationService = inject(OrganizationService);
  private readonly adminDataService = inject(SystemAdminDataService);

  readonly activeTab = signal<ActiveTab>('inbox');
  readonly readFilter = signal<ReadFilter>('all');
  readonly searchQuery = signal<string>('');

  readonly messages = signal<NotificationMessage[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly listError = signal<string | null>(null);

  readonly selectedMessage = signal<NotificationMessage | null>(null);
  readonly selectedThread = signal<MessageReply[]>([]);
  readonly selectedRecipients = signal<MessageRecipientStatus[]>([]);
  readonly isLoadingRecipients = signal<boolean>(false);
  readonly recipientsError = signal<string | null>(null);

  readonly isComposeOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  readonly toastMessage = signal<string>('');
  readonly toastTone = signal<ToastTone>('success');

  readonly replyControl = this.fb.control('', [Validators.required, Validators.minLength(2)]);

  composeForm!: FormGroup;

  readonly MessageType = MessageType;
  readonly MessagePriority = MessagePriority;
  readonly MessageTypeLabels = MessageTypeLabels;
  readonly MessagePriorityLabels = MessagePriorityLabels;

  readonly targetOptions = signal<{ id: string; name: string; managerName: string }[]>([]);

  readonly unreadCount = computed(() => this.messages().filter((m) => !m.isRead).length);

  readonly filteredMessages = computed(() => {
    let list = this.messages();
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.readFilter();

    if (filter === 'unread') {
      list = list.filter((m) => !m.isRead);
    }

    if (query) {
      list = list.filter(
        (m) => m.title.toLowerCase().includes(query) || m.content.toLowerCase().includes(query)
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.initComposeForm();
    this.loadMessages();
    this.loadRecipientOptions();
  }

  private initComposeForm(): void {
    this.composeForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(5)]],
      messageType: [MessageType.Information, [Validators.required]],
      messagePriority: [MessagePriority.Normal, [Validators.required]],
      recipientType: ['Specific', [Validators.required]],
      recipientIds: [[], [Validators.required]],
      requiresAcknowledgment: [false],
      publicationStart: [''],
      expiration: [''],
    });
  }

  loadMessages(): void {
    this.isLoading.set(true);
    this.listError.set(null);
    if (this.activeTab() === 'inbox') {
      this.notificationService.getInbox().subscribe({
        next: (res) => {
          this.messages.set(res);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading inbox notifications', err);
          this.listError.set('خطا در دریافت پیام‌های ورودی. لطفاً دوباره تلاش کنید.');
          this.isLoading.set(false);
        },
      });
    } else {
      this.notificationService.getSent().subscribe({
        next: (res) => {
          this.messages.set(res);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading sent notifications', err);
          this.listError.set('خطا در دریافت پیام‌های ارسالی. لطفاً دوباره تلاش کنید.');
          this.isLoading.set(false);
        },
      });
    }
  }

  loadRecipientOptions(): void {
    this.organizationService.getRecentOrganizations().subscribe({
      next: (orgs: RecentOrganizationDto[]) => {
        if (orgs && orgs.length > 0) {
          const mapped = orgs.map((o) => ({
            id: String(o.id ?? o.Id ?? ''),
            name: o.name ?? o.Name ?? 'مرکز بدون نام',
            managerName: `${o.managerFirstName || ''} ${o.managerLastName || ''}`.trim() || 'مدیر مرکز',
          }));
          this.targetOptions.set(mapped);
        } else {
          this.fallbackRecipients();
        }
      },
      error: () => this.fallbackRecipients(),
    });
  }

  private fallbackRecipients(): void {
    const managers = this.adminDataService.managers();
    const mapped = managers.map((m) => ({
      id: m.id,
      name: m.centerName,
      managerName: m.name,
    }));
    this.targetOptions.set(mapped);
  }

  setActiveTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    this.loadMessages();
  }

  setReadFilter(filter: ReadFilter): void {
    this.readFilter.set(filter);
  }

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  openMessageDetails(msg: NotificationMessage): void {
    this.selectedMessage.set(msg);

    if (!msg.isRead) {
      this.notificationService.markAsRead(msg.id).subscribe(() => {
        this.messages.update((list) =>
          list.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
        );
      });
    }

    this.loadThread(msg.id);
    this.loadRecipients(msg.id);
  }

  closeDetails(): void {
    this.selectedMessage.set(null);
    this.selectedThread.set([]);
    this.selectedRecipients.set([]);
  }

  loadThread(id: string): void {
    this.notificationService.getThread(id).subscribe((res) => this.selectedThread.set(res));
  }

  loadRecipients(id: string): void {
    this.isLoadingRecipients.set(true);
    this.recipientsError.set(null);
    this.selectedRecipients.set([]);

    this.notificationService.getRecipientStatuses(id).subscribe({
      next: (statuses) => {
        const options = this.targetOptions();
        const enriched = statuses.map((rec) => {
          let rName = rec.recipientName?.trim();
          let oName = rec.organizationName?.trim();

          if (!rName || rName === rec.recipientId) {
            const matched = options.find((o) => o.id === rec.recipientId);
            if (matched) {
              rName = matched.managerName ? `${matched.name} (${matched.managerName})` : matched.name;
              if (!oName) oName = matched.name;
            }
          }

          return {
            ...rec,
            recipientName: rName || oName || `گیرنده (${rec.recipientId || 'نامشخص'})`,
            organizationName: oName || rec.organizationName,
          };
        });

        this.selectedRecipients.set(enriched);
        this.isLoadingRecipients.set(false);
      },
      error: (err) => {
        console.error('Failed to load recipient statuses', err);
        this.recipientsError.set('خطا در دریافت وضعیت دریافت‌کنندگان پیام.');
        this.isLoadingRecipients.set(false);
      },
    });
  }

  sendReply(): void {
    const msg = this.selectedMessage();
    if (!msg || this.replyControl.invalid) return;

    const content = this.replyControl.value!.trim();
    this.notificationService.replyToMessage(msg.id, content, 'مدیر ارشد سیستم').subscribe((newReply) => {
      this.selectedThread.update((list) => [...list, newReply]);
      this.replyControl.reset();
      this.triggerToast('پاسخ شما با موفقیت ثبت شد.', 'success');
    });
  }

  openCompose(): void {
    this.composeForm.reset({
      messageType: MessageType.Information,
      messagePriority: MessagePriority.Normal,
      recipientType: 'Specific',
      recipientIds: [],
      requiresAcknowledgment: false,
    });
    this.isComposeOpen.set(true);
  }

  closeCompose(): void {
    this.isComposeOpen.set(false);
  }

  toggleRecipientSelection(id: string): void {
    const current: string[] = this.composeForm.get('recipientIds')?.value || [];
    if (current.includes(id)) {
      this.composeForm.patchValue({ recipientIds: current.filter((x) => x !== id) });
    } else {
      this.composeForm.patchValue({ recipientIds: [...current, id] });
    }
  }

  isRecipientSelected(id: string): boolean {
    const current: string[] = this.composeForm.get('recipientIds')?.value || [];
    return current.includes(id);
  }

  selectAllRecipients(): void {
    const allIds = this.targetOptions().map((t) => t.id);
    this.composeForm.patchValue({ recipientIds: allIds });
  }

  clearRecipientSelection(): void {
    this.composeForm.patchValue({ recipientIds: [] });
  }

  submitCompose(): void {
    if (this.composeForm.invalid) {
      this.composeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const val = this.composeForm.value;

    let publishStartAtUtc = new Date().toISOString();
    if (val.publicationStart) {
      const parsedDate = new Date(val.publicationStart);
      if (!isNaN(parsedDate.getTime())) {
        publishStartAtUtc = parsedDate.toISOString();
      }
    }

    let expiresAtUtc: string | null = null;
    if (val.expiration) {
      const parsedExp = new Date(val.expiration);
      if (!isNaN(parsedExp.getTime())) {
        expiresAtUtc = parsedExp.toISOString();
      }
    }

    const rawRecipientIds: string[] = Array.isArray(val.recipientIds) ? val.recipientIds : [];
    let recipientUserIds: string[] = [];
    let recipientOrganizationId: string | null = null;

    if (val.recipientType === 'Organization') {
      recipientOrganizationId = rawRecipientIds.length > 0 ? rawRecipientIds[0] : null;
      recipientUserIds = [];
    } else {
      recipientUserIds = rawRecipientIds;
      recipientOrganizationId = null;
    }

    const dto: CreateNotificationDto = {
      title: val.title.trim(),
      message: val.content.trim(),
      type: Number(val.messageType),
      priority: Number(val.messagePriority),
      requiresAcknowledgment: !!val.requiresAcknowledgment,
      publishStartAtUtc,
      expiresAtUtc,
      recipientUserIds,
      recipientOrganizationId,
      relatedEntityId: null,
      relatedEntityType: null,
    };

    this.notificationService.createNotification(dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeCompose();
        this.composeForm.reset({
          messageType: MessageType.Information,
          messagePriority: MessagePriority.Normal,
          recipientType: 'Specific',
          recipientIds: [],
          requiresAcknowledgment: false,
        });
        this.triggerToast('اعلان با موفقیت ایجاد و ارسال شد.', 'success');
        this.activeTab.set('sent');
        this.loadMessages();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.triggerToast('خطا در ارسال پیام. لطفاً دوباره تلاش کنید.', 'error');
      },
    });
  }

  triggerToast(message: string, tone: ToastTone): void {
    this.toastMessage.set(message);
    this.toastTone.set(tone);
  }

  getTypeBadgeClass(type: MessageType): string {
    switch (type) {
      case MessageType.Critical:
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case MessageType.Warning:
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case MessageType.Success:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  }

  getPriorityBadgeClass(priority: MessagePriority): string {
    switch (priority) {
      case MessagePriority.Urgent:
        return 'bg-rose-50 text-rose-600 border-rose-200';
      case MessagePriority.High:
        return 'bg-amber-50 text-amber-600 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  }
}
