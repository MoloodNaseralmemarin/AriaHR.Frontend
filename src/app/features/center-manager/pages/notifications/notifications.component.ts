import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastComponent, ToastTone } from '../../../../shared/components/toast/toast.component';
import { JalaliPipe } from '../../../../shared/pipes/jalali.pipe';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';
import { CustomSelectComponent } from '../../../../shared/components/custom-select/custom-select.component';

import { NotificationService } from '../../../notifications/services/notification.service';
import { MessagePriorityLabels, MessageTypeLabels, MessagePriority, MessageType } from '../../../notifications/models/message-enums';
import { CreateMessagePayload, MessageRecipientStatus, MessageReply, NotificationMessage } from '../../../notifications/models/notification.models';
import { EmployeeService } from '../../../employees/services/employee.service';
import { EmployeeResponseDto } from '../../../employees/models/employee-response.dto';

type ActiveTab = 'inbox' | 'sent';
type ReadFilter = 'all' | 'unread';

@Component({
  selector: 'app-center-notifications',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    EmptyStateComponent,
    ToastComponent,
    JalaliPipe,
    PersianDigitsPipe,
    CustomSelectComponent,
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly employeeService = inject(EmployeeService);

  readonly activeTab = signal<ActiveTab>('inbox');
  readonly readFilter = signal<ReadFilter>('all');
  readonly searchQuery = signal<string>('');

  readonly messages = signal<NotificationMessage[]>([]);
  readonly isLoading = signal<boolean>(true);

  readonly selectedMessage = signal<NotificationMessage | null>(null);
  readonly selectedThread = signal<MessageReply[]>([]);
  readonly selectedRecipients = signal<MessageRecipientStatus[]>([]);

  readonly isComposeOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly isAcknowledging = signal<boolean>(false);

  readonly toastMessage = signal<string>('');
  readonly toastTone = signal<ToastTone>('success');

  readonly replyControl = this.fb.control('', [Validators.required, Validators.minLength(2)]);

  composeForm!: FormGroup;

  readonly MessageType = MessageType;
  readonly MessagePriority = MessagePriority;
  readonly MessageTypeLabels = MessageTypeLabels;
  readonly MessagePriorityLabels = MessagePriorityLabels;

  readonly messageTypeOptions = [
    { value: MessageType.Information, label: 'اطلاعیه' },
    { value: MessageType.Warning, label: 'هشدار' },
    { value: MessageType.Critical, label: 'فوری / مهم' },
    { value: MessageType.Success, label: 'موفقیت' },
  ];

  readonly messagePriorityOptions = [
    { value: MessagePriority.Normal, label: 'عادی' },
    { value: MessagePriority.High, label: 'مهم' },
    { value: MessagePriority.Urgent, label: 'فوری' },
  ];

  readonly employeeOptions = signal<{ id: string; name: string; personnelCode: string }[]>([]);

  readonly unreadCount = computed(() => this.messages().filter((m) => !m.isRead).length);

  readonly filteredNotifications = computed(() => {
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
    this.loadEmployees();
  }

  private initComposeForm(): void {
    this.composeForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(5)]],
      messageType: [MessageType.Information, [Validators.required]],
      messagePriority: [MessagePriority.Normal, [Validators.required]],
      recipientType: ['Organization', [Validators.required]],
      recipientIds: [[], [Validators.required]],
      requiresAcknowledgment: [false],
    });
  }

  loadMessages(): void {
    this.isLoading.set(true);
    if (this.activeTab() === 'inbox') {
      this.notificationService.getInbox().subscribe({
        next: (res) => {
          this.messages.set(res);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    } else {
      this.notificationService.getSent().subscribe({
        next: (res) => {
          this.messages.set(res);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (emps: EmployeeResponseDto[]) => {
        if (emps && emps.length > 0) {
          const mapped = emps.map((e) => ({
            id: String(e.id ?? ''),
            name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'کارمند',
            personnelCode: e.personnelCode || '---',
          }));
          this.employeeOptions.set(mapped);
        } else {
          this.fallbackEmployees();
        }
      },
      error: () => this.fallbackEmployees(),
    });
  }

  private fallbackEmployees(): void {
    this.employeeOptions.set([
      { id: 'emp-1', name: 'علی علوی', personnelCode: '1001' },
      { id: 'emp-2', name: 'مریم حسینی', personnelCode: '1002' },
      { id: 'emp-3', name: 'رضا قاسمی', personnelCode: '1003' },
    ]);
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
      this.notificationService.markAsRead(msg.id).subscribe({
        next: () => {
          this.messages.update((list) =>
            list.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
          );
          if (this.selectedMessage()?.id === msg.id) {
            this.selectedMessage.update((m) => (m ? { ...m, isRead: true } : null));
          }
        },
        error: () => {
          // Keep UI consistent on read status failure
        },
      });
    }

    this.loadThread(msg.id);
    this.loadRecipients(msg.id);
  }

  acknowledgeMessage(msg: NotificationMessage): void {
    if (this.isAcknowledging() || msg.isAcknowledged) return;

    this.isAcknowledging.set(true);
    this.notificationService.acknowledgeMessage(msg.id).subscribe({
      next: (res) => {
        this.isAcknowledging.set(false);
        const acknowledgedAt = res.acknowledgedAt;
        this.messages.update((list) =>
          list.map((m) =>
            m.id === msg.id ? { ...m, isRead: true, isAcknowledged: true, acknowledgedAt } : m
          )
        );
        if (this.selectedMessage()?.id === msg.id) {
          this.selectedMessage.update((m) =>
            m ? { ...m, isRead: true, isAcknowledged: true, acknowledgedAt } : null
          );
        }
        this.triggerToast('تأیید دریافت پیام با موفقیت ثبت شد.', 'success');
      },
      error: () => {
        this.isAcknowledging.set(false);
        this.triggerToast('خطا در ثبت تأیید دریافت. لطفاً مجدداً تلاش نمایید.', 'error');
      },
    });
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
    this.notificationService.getRecipientStatuses(id).subscribe((res) => this.selectedRecipients.set(res));
  }

  sendReply(): void {
    const msg = this.selectedMessage();
    if (!msg || this.replyControl.invalid) return;

    const content = this.replyControl.value!.trim();
    this.notificationService.replyToMessage(msg.id, content, 'مدیر مرکز').subscribe((newReply) => {
      this.selectedThread.update((list) => [...list, newReply]);
      this.replyControl.reset();
      this.triggerToast('پاسخ شما با موفقیت ثبت شد.', 'success');
    });
  }

  markAllAsRead(): void {
    this.notificationService.getInbox().subscribe((list) => {
      list.forEach((m) => {
        if (!m.isRead) {
          this.notificationService.markAsRead(m.id).subscribe();
        }
      });
      this.loadMessages();
      this.triggerToast('تمامی اعلان‌ها به‌عنوان خوانده‌شده علامت‌گذاری شدند.', 'success');
    });
  }

  openCompose(): void {
    this.composeForm.reset({
      messageType: MessageType.Information,
      messagePriority: MessagePriority.Normal,
      recipientType: 'Organization',
      recipientIds: [],
      requiresAcknowledgment: false,
    });
    this.selectAllEmployees();
    this.isComposeOpen.set(true);
  }

  closeCompose(): void {
    this.isComposeOpen.set(false);
  }

  onRecipientTypeChange(type: 'Organization' | 'Specific'): void {
    this.composeForm.patchValue({ recipientType: type });
    if (type === 'Organization') {
      this.selectAllEmployees();
    } else {
      this.composeForm.patchValue({ recipientIds: [] });
    }
  }

  toggleEmployeeSelection(id: string): void {
    const current: string[] = this.composeForm.get('recipientIds')?.value || [];
    if (current.includes(id)) {
      this.composeForm.patchValue({ recipientIds: current.filter((x) => x !== id) });
    } else {
      this.composeForm.patchValue({ recipientIds: [...current, id] });
    }
  }

  isEmployeeSelected(id: string): boolean {
    const current: string[] = this.composeForm.get('recipientIds')?.value || [];
    return current.includes(id);
  }

  selectAllEmployees(): void {
    const allIds = this.employeeOptions().map((e) => e.id);
    this.composeForm.patchValue({ recipientIds: allIds });
  }

  clearEmployeeSelection(): void {
    this.composeForm.patchValue({ recipientIds: [] });
  }

  submitCompose(): void {
    if (this.composeForm.invalid) {
      this.composeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const val = this.composeForm.value;

    const payload: CreateMessagePayload = {
      title: val.title.trim(),
      content: val.content.trim(),
      messageType: Number(val.messageType),
      messagePriority: Number(val.messagePriority),
      recipientType: val.recipientType,
      recipientIds: val.recipientIds,
      requiresAcknowledgment: !!val.requiresAcknowledgment,
    };

    this.notificationService.createMessage(payload, 'CenterManager', 'مدیر مرکز').subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeCompose();
        this.loadMessages();
        this.triggerToast('پیام جدید با موفقیت به پرسنل ارسال شد.', 'success');
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
