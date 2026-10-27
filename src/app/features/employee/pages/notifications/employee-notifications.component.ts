import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastComponent, ToastTone } from '../../../../shared/components/toast/toast.component';
import { JalaliPipe } from '../../../../shared/pipes/jalali.pipe';
import { PersianDigitsPipe } from '../../../../shared/pipes/persian-digits.pipe';

import { NotificationService } from '../../../notifications/services/notification.service';
import { MessagePriorityLabels, MessageTypeLabels, MessagePriority, MessageType } from '../../../notifications/models/message-enums';
import { MessageReply, NotificationMessage } from '../../../notifications/models/notification.models';

type ReadFilter = 'all' | 'unread';

@Component({
  selector: 'app-employee-notifications',
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
  template: `
    <div class="space-y-6">
      <!-- Toast Component -->
      <app-toast [message]="toastMessage()" [tone]="toastTone()"></app-toast>

      <!-- Page Header -->
      <app-page-header
        title="اعلان‌ها و پیام‌ها"
        subtitle="اطلاعیه‌های سازمانی، پیام‌های مدیر مرکز و بروزرسانی‌های درخواست‌ها"
      ></app-page-header>

      <!-- Search and Read Filters -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <!-- Filter Pills -->
        <div class="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            (click)="setFilter('all')"
            [class]="
              activeFilter() === 'all'
                ? 'rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-slate-900 shadow-2xs'
                : 'px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900'
            "
          >
            همه
          </button>
          <button
            type="button"
            (click)="setFilter('unread')"
            [class]="
              activeFilter() === 'unread'
                ? 'rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-2xs'
                : 'px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900'
            "
          >
            خوانده نشده
            @if (unreadCount() > 0) {
              <span class="mr-1.5 rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] text-white">
                {{ unreadCount() | persianDigits }}
              </span>
            }
          </button>
        </div>

        <!-- Search Bar -->
        <div class="relative w-full sm:w-64">
          <input
            type="text"
            [value]="searchQuery()"
            (input)="onSearch($event)"
            placeholder="جستجو در متن یا عنوان..."
            class="w-full rounded-xl border border-slate-200 bg-white py-1.5 pr-8 pl-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden"
          />
          <span class="absolute right-2.5 top-2 text-slate-400 text-xs">🔍</span>
        </div>
      </div>

      <!-- Messages List View -->
      @if (isLoading()) {
        <div class="space-y-3">
          <div class="h-24 w-full animate-pulse rounded-2xl bg-slate-200"></div>
          <div class="h-24 w-full animate-pulse rounded-2xl bg-slate-200"></div>
        </div>
      } @else if (filteredMessages().length === 0) {
        <app-empty-state
          title="هیچ اعلانی یافت نشد"
          description="در حال حاضر هیچ پیام یا اطلاعیه جدیدی برای شما ثبت نشده است."
        ></app-empty-state>
      } @else {
        <div class="space-y-3">
          @for (msg of filteredMessages(); track msg.id) {
            <div
              (click)="openDetails(msg)"
              [class]="
                !msg.isRead
                  ? 'relative cursor-pointer rounded-2xl border border-blue-200 bg-blue-50/40 p-4 transition hover:bg-blue-50 sm:p-5 shadow-2xs'
                  : 'relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 sm:p-5 shadow-2xs'
              "
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="space-y-1.5 max-w-2xl">
                  <div class="flex flex-wrap items-center gap-2">
                    @if (!msg.isRead) {
                      <span class="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" title="خوانده نشده"></span>
                    }
                    <span [class]="'rounded-lg border px-2 py-0.5 text-[11px] font-bold ' + getTypeBadgeClass(msg.messageType)">
                      {{ MessageTypeLabels[msg.messageType] }}
                    </span>
                    <span [class]="'rounded-lg border px-2 py-0.5 text-[11px] font-semibold ' + getPriorityBadgeClass(msg.messagePriority)">
                      {{ MessagePriorityLabels[msg.messagePriority] }}
                    </span>
                    @if (msg.requiresAcknowledgment) {
                      @if (msg.isAcknowledged) {
                        <span class="rounded-lg border border-slate-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          ✓ تایید شده
                        </span>
                      } @else {
                        <span class="rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          نیازمند تایید دریافت
                        </span>
                      }
                    }
                  </div>

                  <h3 class="text-sm font-bold text-slate-900 sm:text-base leading-snug">
                    {{ msg.title }}
                  </h3>
                  <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {{ msg.content }}
                  </p>
                </div>

                <div class="flex sm:flex-col items-center sm:items-end justify-between text-xs text-slate-400 gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <span class="font-medium text-slate-500">
                    <bdi dir="ltr">{{ msg.createdAt | jalali }}</bdi>
                  </span>
                  <span class="text-[11px] text-slate-400">
                    {{ msg.senderName }}
                  </span>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Message Details Modal Drawer -->
      @if (selectedMessage()) {
        <div class="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs p-2 sm:p-4 animate-in">
          <div class="flex h-full w-full max-w-xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80">
              <div class="flex items-center gap-2">
                <span [class]="'rounded-lg border px-2.5 py-1 text-xs font-bold ' + getTypeBadgeClass(selectedMessage()!.messageType)">
                  {{ MessageTypeLabels[selectedMessage()!.messageType] }}
                </span>
                <span [class]="'rounded-lg border px-2.5 py-1 text-xs font-semibold ' + getPriorityBadgeClass(selectedMessage()!.messagePriority)">
                  {{ MessagePriorityLabels[selectedMessage()!.messagePriority] }}
                </span>
              </div>
              <button type="button" (click)="closeDetails()" class="rounded-xl p-2 text-slate-400 hover:bg-slate-200 transition text-lg">
                ✕
              </button>
            </div>

            <!-- Content Body -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
              <div class="space-y-2">
                <h2 class="text-base font-bold text-slate-900 leading-snug sm:text-lg">{{ selectedMessage()!.title }}</h2>
                <div class="flex items-center gap-4 text-xs text-slate-500">
                  <span>فرستنده: <strong class="text-slate-700">{{ selectedMessage()!.senderName }}</strong></span>
                  <span>•</span>
                  <span>تاریخ: <bdi dir="ltr">{{ selectedMessage()!.createdAt | jalali }}</bdi></span>
                </div>
              </div>

              <div class="rounded-2xl bg-slate-50 p-4 text-xs sm:text-sm leading-relaxed text-slate-800 whitespace-pre-line border border-slate-100">
                {{ selectedMessage()!.content }}
              </div>

              <!-- Explicit Acknowledgment Section -->
              @if (selectedMessage()!.requiresAcknowledgment) {
                <div class="rounded-2xl border p-4 space-y-3 bg-amber-50/30 border-amber-200">
                  <div class="flex items-start gap-2.5">
                    <span class="text-lg">📋</span>
                    <div>
                      <h4 class="text-xs font-bold text-slate-800">تایید صریح دریافت پیام</h4>
                      <p class="text-[11px] text-slate-500 mt-0.5">فرستنده این پیام الزام به تایید صریح دریافت را فعال کرده است.</p>
                    </div>
                  </div>

                  @if (selectedMessage()!.isAcknowledged) {
                    <div class="flex items-center gap-2 rounded-xl bg-emerald-100/80 px-3 py-2 text-xs font-semibold text-emerald-800">
                      <span>✓</span>
                      <span>تایید صریح دریافت در تاریخ <bdi dir="ltr">{{ selectedMessage()!.acknowledgedAt | jalali }}</bdi> ثبت گردید.</span>
                    </div>
                  } @else {
                    <button
                      type="button"
                      (click)="acknowledgeReceipt()"
                      [disabled]="isAcknowledging()"
                      class="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition cursor-pointer disabled:opacity-50"
                    >
                      @if (isAcknowledging()) {
                        در حال ثبت تاییدیه...
                      } @else {
                        تایید صریح دریافت پیام
                      }
                    </button>
                  }
                </div>
              }

              <!-- Private Reply Thread -->
              <div class="space-y-4 pt-4 border-t border-slate-100">
                <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">گفتگو و پاسخ خصوصی با فرستنده</h4>

                <div class="space-y-3">
                  @for (rep of threadReplies(); track rep.id) {
                    <div [class]="rep.isSelf ? 'mr-auto max-w-[85%] rounded-2xl bg-blue-600 p-3.5 text-white text-xs' : 'ml-auto max-w-[85%] rounded-2xl bg-slate-100 p-3.5 text-slate-800 text-xs'">
                      <div class="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-80">
                        <span class="font-bold">{{ rep.senderName }}</span>
                        <span><bdi dir="ltr">{{ rep.createdAt | jalali }}</bdi></span>
                      </div>
                      <p class="leading-relaxed whitespace-pre-line">{{ rep.content }}</p>
                    </div>
                  }
                </div>

                <div class="space-y-2 pt-2">
                  <textarea
                    [formControl]="replyControl"
                    rows="2"
                    placeholder="پاسخ خصوصی خود را بنویسید..."
                    class="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden"
                  ></textarea>
                  <div class="flex justify-end">
                    <button
                      type="button"
                      (click)="sendReply()"
                      [disabled]="replyControl.invalid || isReplying()"
                      class="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                    >
                      @if (isReplying()) {
                        در حال ارسال...
                      } @else {
                        ارسال پاسخ
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeNotificationsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);

  readonly activeFilter = signal<ReadFilter>('all');
  readonly searchQuery = signal<string>('');

  readonly messages = signal<NotificationMessage[]>([]);
  readonly isLoading = signal<boolean>(true);

  readonly selectedMessage = signal<NotificationMessage | null>(null);
  readonly threadReplies = signal<MessageReply[]>([]);

  readonly isAcknowledging = signal<boolean>(false);
  readonly isReplying = signal<boolean>(false);

  readonly toastMessage = signal<string>('');
  readonly toastTone = signal<ToastTone>('success');

  readonly replyControl = this.fb.control('', [Validators.required, Validators.minLength(2)]);

  readonly MessageTypeLabels = MessageTypeLabels;
  readonly MessagePriorityLabels = MessagePriorityLabels;

  readonly unreadCount = computed(() => this.messages().filter((m) => !m.isRead).length);

  readonly filteredMessages = computed(() => {
    let list = this.messages();
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.activeFilter();

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
    this.loadMessages();
  }

  loadMessages(): void {
    this.isLoading.set(true);
    this.notificationService.getInbox().subscribe({
      next: (res) => {
        this.messages.set(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  setFilter(filter: ReadFilter): void {
    this.activeFilter.set(filter);
  }

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  openDetails(msg: NotificationMessage): void {
    this.selectedMessage.set(msg);

    if (!msg.isRead) {
      this.notificationService.markAsRead(msg.id).subscribe(() => {
        this.messages.update((list) =>
          list.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
        );
      });
    }

    this.loadThread(msg.id);
  }

  closeDetails(): void {
    this.selectedMessage.set(null);
    this.threadReplies.set([]);
  }

  loadThread(messageId: string): void {
    this.notificationService.getThread(messageId).subscribe((res) => this.threadReplies.set(res));
  }

  acknowledgeReceipt(): void {
    const msg = this.selectedMessage();
    if (!msg || msg.isAcknowledged) return;

    this.isAcknowledging.set(true);
    this.notificationService.acknowledgeMessage(msg.id).subscribe({
      next: (res) => {
        this.isAcknowledging.set(false);
        this.selectedMessage.update((m) =>
          m ? { ...m, isAcknowledged: true, acknowledgedAt: res.acknowledgedAt } : null
        );
        this.messages.update((list) =>
          list.map((m) =>
            m.id === msg.id ? { ...m, isAcknowledged: true, acknowledgedAt: res.acknowledgedAt } : m
          )
        );
        this.triggerToast('تایید صریح دریافت پیام با موفقیت ثبت شد.', 'success');
      },
      error: () => {
        this.isAcknowledging.set(false);
        this.triggerToast('خطا در ثبت تاییدیه دریافت.', 'error');
      },
    });
  }

  sendReply(): void {
    const msg = this.selectedMessage();
    if (!msg || this.replyControl.invalid) return;

    this.isReplying.set(true);
    const content = this.replyControl.value!.trim();

    this.notificationService.replyToMessage(msg.id, content, 'من (کارمند)').subscribe({
      next: (newReply) => {
        this.isReplying.set(false);
        this.threadReplies.update((list) => [...list, newReply]);
        this.replyControl.reset();
        this.triggerToast('پاسخ خصوصی شما ارسال شد.', 'success');
      },
      error: () => {
        this.isReplying.set(false);
        this.triggerToast('خطا در ارسال پاسخ.', 'error');
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
        return 'bg-emerald-100 text-emerald-700 border-slate-200';
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
