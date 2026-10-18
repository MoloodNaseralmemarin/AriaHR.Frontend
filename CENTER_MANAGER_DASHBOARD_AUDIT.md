# Comprehensive UX/UI Audit & Technical Specification: Center Manager Dashboard

**Document Reference:** `CENTER_MANAGER_DASHBOARD_AUDIT.md`
**Target Screen:** `/center-manager/dashboard` (`DashboardComponent`)
**Role Context:** Center Manager (مدیر مرکز)
**Audit Date:** October 2026
**Auditor:** Jules (AI Software Engineer & UX Specialist)
**Scope:** Deep, implementation-level read-only UX/UI and architecture audit.
**Related Reference:** `UI_UX_AUDIT_REPORT.md` (Contextual reference)

---

## 1. Executive Summary

This document provides an evidence-based UX/UI and technical audit of the Center Manager Dashboard screen (`/center-manager/dashboard`). The dashboard serves as the central operational cockpit for healthcare center managers, presenting a high-level overview of daily employee attendance, shift schedules, action-required management queues, employee status previews, and recent notifications.

### Audit Summary Ratings

| Category | Rating | Summary |
| :--- | :---: | :--- |
| **Visual Design & Token Usage** | **8.5 / 10** | Clean, modern card-based layout utilizing slate neutral colors, high-contrast typography, and consistent status-tone color mapping. |
| **UX & Information Hierarchy** | **8.0 / 10** | Logical 2-column layout on desktop prioritizing critical daily operational metrics on the left and pending queue/notifications on the right. |
| **Angular Architecture** | **8.5 / 10** | Clean Angular 20+ standalone component implementation with signal-based computed state (`managerNameSignal`) and standalone shared components. |
| **Responsive UX** | **8.0 / 10** | Multi-breakpoint grid adaptation (2 columns on mobile, 4 on tablet/desktop) with fixed bottom navigation on mobile viewports. |
| **Accessibility (A11y) & RTL** | **7.0 / 10** | Full Persian RTL layout and zero-padded Jalali date formatting, with minor gaps in icon ARIA labels and focus trapping. |
| **Data API Integration** | **3.5 / 10** | Currently powered primarily by static mock data (`mock-data.ts`), requiring backend endpoint integration for organization-wide metrics. |

---

## 2. Files Inspected & Dependency Map

The inspection traced every file contributing to the rendering, layout, styling, data representation, and routing of the Center Manager Dashboard:

### Direct Component Files
- `src/app/features/center-manager/pages/dashboard/dashboard.component.ts` — Main standalone component class with logic and computed signals.
- `src/app/features/center-manager/pages/dashboard/dashboard.component.html` — Component template structure and data bindings.
- `src/app/features/center-manager/pages/dashboard/dashboard.component.css` — Host element styling definitions.

### Layout & Navigation Container Files
- `src/app/features/center-manager/layout/center-layout.component.ts` — Main portal shell setting `dir="rtl"`, maximum container width (`max-w-6xl`), and routing outlet.
- `src/app/features/center-manager/components/sidebar-nav/sidebar-nav.component.ts` — Sticky desktop navigation sidebar (`hidden md:flex w-64`).
- `src/app/features/center-manager/components/bottom-nav/bottom-nav.component.ts` — Fixed mobile bottom navigation bar (`flex md:hidden`).

### Shared UI Components
- `src/app/shared/components/summary-card/summary-card.component.ts` — Metric stat card with tone-based icon wrapper and big numbers.
- `src/app/shared/components/status-badge/status-badge.component.ts` — Status indicator badge with colored dot and ring borders.
- `src/app/shared/components/empty-state/empty-state.component.ts` — Fallback empty state for empty action item queues.

### Services, Utilities, & Data Files
- `src/app/core/auth/auth.service.ts` — Authentication state provider (`userDetails`, `currentUser`, `getCurrentUser`).
- `src/app/core/services/persian-date.service.ts` — Jalali date formatting utility (`getTodayFormatted`).
- `src/app/shared/utils/status-map.ts` — Semantic mapping for attendance (`attendanceStatusMap`) and shift statuses (`shiftStatusMap`).
- `src/app/features/center-manager/mock-data/mock-data.ts` — Static mock data definitions (`mockDashboardSummary`, `mockTodayAttendanceSummary`, `mockActionRequiredItems`, `mockTodayShifts`, `mockEmployeeStatusPreview`, `mockDashboardNotifications`).
- `src/app/shared/models/center-manager.models.ts` — Type interfaces for dashboard domain entities.

### Global Styles & Design Tokens
- `src/styles.css` — Global Tailwind CSS v4 `@import`, `@theme` font overrides (`IRANSans`, `Vazirmatn`), and focus outlines.

---

## 3. Page Layout & Section Hierarchy

The dashboard layout is structured into a stacked vertical container with a responsive 2-column grid below the primary overview.

```
+-----------------------------------------------------------------------------------+
| [1] Header Card (Greeting, Center Name, Today's Jalali Date)                      |
+-----------------------------------------------------------------------------------+
| [2] Today's Overview (4 Summary Cards: Active Employees, Present, Absent, Pending)|
+-----------------------------------------------------------------------------------+
| [3] Main Content Grid (1 col on mobile -> 3 cols on lg screens)                   |
| +-----------------------------------------------+ +-------------------------------+ |
| | Main Column (lg:col-span-2)                   | | Side Column (lg:col-span-1)   | |
| | - Today's Attendance Breakdown (4 Stat Cards) | | - Action Required Queue      | |
| | - Details Link Button                        | | - Employee Status Preview   | |
| | - Today's Shifts List                         | | - Recent Notifications      | |
| +-----------------------------------------------+ +-------------------------------+ |
+-----------------------------------------------------------------------------------+
```

### Detailed Section Breakdown

1. **Welcome Header Card:**
   - Container: `rounded-2xl border border-slate-200 bg-white p-5 shadow-sm`
   - Primary Greeting: `سلام، {{ managerName }}` in `text-lg font-bold text-slate-800`
   - Sub-metadata: Center name (`مرکز: {{ centerName }}`) and current Persian date (`{{ persianDate }}`) with inline SVG icons in `text-sm text-slate-500`.
2. **Today's Overview (`نمای امروز`):**
   - Grid: `grid grid-cols-2 gap-3 sm:grid-cols-4`
   - Section Title: `text-sm font-semibold text-slate-500`
   - 4 `app-summary-card` instances:
     - "کارکنان فعال" (`tone="default"`)
     - "حاضر امروز" (`tone="success"`)
     - "غایب" (`tone="danger"`)
     - "در انتظار ورود" (`tone="warning"`)
3. **Main Operational Column (`lg:col-span-2`):**
   - **Today's Attendance (`وضعیت حضور امروز`):** Card container with a 4-column sub-grid (`grid-cols-2 sm:grid-cols-4`) displaying color-tinted summary boxes:
     - Present (Emerald: `bg-emerald-50 text-emerald-700`)
     - Late (Amber: `bg-amber-50 text-amber-700`)
     - Absent (Rose: `bg-rose-50 text-rose-700`)
     - On Leave (Sky: `bg-sky-50 text-sky-700`)
     - Full-width action button linking to `/center-manager/attendance`.
   - **Today's Shifts (`شیفت‌های امروز`):** List of shift cards (`rounded-xl border border-slate-100 bg-slate-50/60 p-4`) displaying shift time range (`08:00 -> 16:00`), status badge (`app-status-badge`), planned employee count, and present employee count.
4. **Side Operational Column (`lg:col-span-1`):**
   - **Action Required Queue (`نیازمند بررسی`):** Button list highlighting items requiring approval (e.g. pending leave, attendance correction, unapproved shift) with badge count and action button. Shows `app-empty-state` when count is zero.
   - **Employee Status Preview (`وضعیت کارکنان`):** Compact employee list with avatar initials (`flex h-8 w-8 rounded-full bg-blue-50 text-blue-700`), full name, check-in time, and status badge. Full-width action button linking to `/center-manager/employees`.
   - **Recent Notifications (`اعلان‌ها`):** Vertical list with blue dot indicators (`bg-blue-500`). Full-width action button linking to `/center-manager/notifications`.

---

## 4. Visual Design Specification

### Color Palette & Design Tokens

| Token Role | Tailwind Class / CSS Hex | Used Elements |
| :--- | :--- | :--- |
| **Page Background** | `bg-slate-50` (`#f8fafc`) | `CenterLayoutComponent` root background |
| **Card Surface** | `bg-white` (`#ffffff`) | Card containers, header, sidebar |
| **Sub-Surface / Card Fill**| `bg-slate-50/60` (`#f8fafc`) | Inner shift items, action item buttons |
| **Border Neutral** | `border-slate-200` (`#e2e8f0`) | Outer card borders, layout dividers |
| **Border Light** | `border-slate-100` (`#f1f5f9`) | Inner card item borders, table lines |
| **Text Primary** | `text-slate-800` (`#1e293b`) | Headings, employee names, greeting |
| **Text Secondary** | `text-slate-700` (`#334155`) | Subheadings, section titles, item text |
| **Text Muted** | `text-slate-500` (`#64748b`) | Labels, date strings, icons |
| **Text Subtle** | `text-slate-400` (`#94a3b8`) | Avatar initials, timestamps |
| **Primary Accent** | `bg-blue-600` / `text-blue-600` | Active links, primary avatar backgrounds, action text |
| **Tone: Success** | `bg-emerald-50`, `text-emerald-700`, `bg-emerald-500` | Present attendance count, active badges |
| **Tone: Warning** | `bg-amber-50`, `text-amber-700`, `bg-amber-500` | Late attendance, pending check-in |
| **Tone: Danger** | `bg-rose-50`, `text-rose-700`, `bg-rose-500` | Absent count, error state |
| **Tone: Info / Leave** | `bg-sky-50`, `text-sky-700`, `bg-sky-500` | On leave attendance count |

### Typography & Spacing Scale

- **Font Family:** `var(--font-sans)` resolves to `'IRANSans', 'Vazirmatn', system-ui, -apple-system, sans-serif`.
- **Heading 1 / Welcome:** `text-lg font-bold text-slate-800` (18px / 1.75rem line-height).
- **Section Heading:** `text-sm font-semibold text-slate-700` (14px / 1.25rem line-height).
- **Stat Cards Big Numbers:** `text-xl font-bold text-slate-800` in `SummaryCardComponent`; `text-lg font-bold` in attendance breakdown boxes.
- **Body / Item Label:** `text-sm font-medium text-slate-700`.
- **Caption / Meta:** `text-xs text-slate-500` (12px) and `text-[11px]` for compact badge/avatar text.
- **Card Spacing:** Standard padding `p-5` (20px) on main section cards; `p-4` on inner cards; `p-3` on stat boxes.
- **Grid Gaps:** `gap-6` (24px) between main layout columns; `gap-3` (12px) between summary grid cards; `gap-2` between list items.

---

## 5. Angular Architecture & Implementation Details

### Standalone Component Composition
`DashboardComponent` is implemented as a modern standalone Angular component (`standalone: true`):

```typescript
@Component({
  selector: 'app-center-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SummaryCardComponent, StatusBadgeComponent, EmptyStateComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit { ... }
```

### State Management & Reactive Signals
- **Computed Signal for Manager Name:** Combines user details from `AuthService.userDetails()` signal (`firstName` + `lastName`) and `AuthService.currentUser()` signal (`fullName`) with fallback to `'مدیر مرکز'`:
  ```typescript
  readonly managerNameSignal = computed(() => {
    const details = this.authService.userDetails();
    if (details) {
      const first = details.firstName ? details.firstName.trim() : '';
      const last = details.lastName ? details.lastName.trim() : '';
      const full = `${first} ${last}`.trim();
      if (full) return full;
    }
    const user = this.authService.currentUser();
    if (user?.fullName?.trim()) return user.fullName.trim();
    return 'مدیر مرکز';
  });
  ```
- **Jalali Date Retrieval:** Calls `PersianDateService.getTodayFormatted()` on initialization, producing zero-padded formatted Persian date strings.

---

## 6. Responsive UX Audit Across Viewports

The responsive design analysis evaluated CSS media queries, grid constraints, and layout behavior across 5 standard viewport categories:

| Viewport Category | Width | Observed Grid & Structural Behavior | Evaluation |
| :--- | :--- | :--- | :---: |
| **Mobile Extra Small** | `320px` | Summary grid renders in 2 columns (`grid-cols-2`). Attendance cards render 2x2. Column grid stacks vertically (`grid-cols-1`). Bottom navigation bar is active. | ✅ Functional |
| **Mobile Standard** | `375px` – `430px` | Optimal touch targets and spacing. Full screen width utilized without horizontal overflow. Action item buttons span full width. | ⭐ Excellent |
| **Tablet Portrait** | `768px` | Summary grid transitions to 4 columns (`sm:grid-cols-4`). Desktop sidebar appears (`md:flex`). Bottom navigation bar hides (`hidden md:flex`). | ✅ Responsive |
| **Desktop Standard** | `1024px` – `1280px`| Main grid switches to 3 columns (`lg:grid-cols-3`), placing attendance and shifts in 2 columns and action queue in 1 side column. | ⭐ Reference Quality |
| **Wide Desktop** | `1440px+` | Content centered inside `max-w-6xl mx-auto` (`1152px`), maintaining controlled reading line-length and card proportion. | ✅ Well Constrained |

---

## 7. Accessibility (A11y), RTL, and Jalali Implementation

### Persian & RTL Compliance
- **Root Direction:** `CenterLayoutComponent` explicitly sets `dir="rtl"` on the parent wrapper container (`<div dir="rtl" class="flex min-h-screen ...">`).
- **Text Flow:** Title, subtitles, stat counts, badges, and list items align right-to-left naturally.
- **Jalali Date Integration:** Uses `PersianDateService` to calculate current Jalali year, month, and day strings.

### Identified Accessibility Gaps
1. **Missing Bi-Directional Isolation (`<bdi>`):** Numerical strings (e.g., `{{ shift.startTime }}`, `{{ persianDate }}`) are rendered directly inside text nodes without `<bdi>` wrappers, which can cause browser Bidi algorithm digit reversals in mixed Persian/English contexts.
2. **Action Button ARIA Labels:** Interactive buttons in the Action Required section (`<button type="button" (click)="onActionClick(item.id)">`) lack descriptive `aria-label` tags specifying the target item context for screen readers.
3. **Decorative SVGs:** Inline SVG icons inside `SummaryCardComponent` and section headers lack `aria-hidden="true"`, causing screen readers to announce unlabelled graphic elements.
4. **Keyboard Focus Outlines:** Rely on global focus ring in `styles.css` (`:focus-visible { outline: 2px solid #2563eb; }`). All interactive links and buttons preserve keyboard focus visibility.

---

## 8. Data Integration Audit & Transition Roadmap

Currently, `DashboardComponent` relies on static mock objects defined in `src/app/features/center-manager/mock-data/mock-data.ts`.

### Detailed Section Data Mapping & API Transition Matrix

| Dashboard Section | Current Data Source | Available Backend API Endpoints | Integration Strategy / Gaps |
| :--- | :--- | :--- | :--- |
| **Greeting & Date** | `AuthService` & `PersianDateService` | `GET /api/auth/me` / User state signal | **Live Ready.** Fully wired to current user state. |
| **Center Name** | Static string (`'مرکز سلامت بهار'`) | User profile / Organization payload | Map from authenticated user's organization claim or `OrganizationService`. |
| **Today's Overview** | `mockDashboardSummary` | `GET /api/organizations/employees` | Compute `activeEmployees` from `EmployeeService.getEmployees()`. *Gap:* Need backend endpoint for today's aggregate attendance counts (`present`, `absent`, `pendingCheckIn`). |
| **Today's Attendance** | `mockTodayAttendanceSummary` | Needs aggregate endpoint | *Gap:* `AttendanceService` currently only provides individual employee today status (`GET /api/attendance/today`). Requires organization-wide aggregate API endpoint (e.g. `GET /api/attendance/organization/today`). |
| **Today's Shifts** | `mockTodayShifts` | `ShiftService.getShifts()` (`GET /api/scheduling/shifts`) | `ShiftService` retrieves shift definitions. To show daily assigned counts (`plannedCount`, `presentCount`), integrate daily assignment endpoint if available. |
| **Action Required Queue** | `mockActionRequiredItems` | `LeaveRequestService` & `NotificationService` | Calculate pending counts from pending leave requests and unread inbox notifications via `NotificationService.getInbox('unread')`. |
| **Employee Status Preview**| `mockEmployeeStatusPreview` | `EmployeeService.getEmployees()` (`GET /api/organizations/employees`) | Retrieve employee list, compute `avatarInitials` from `firstName`/`lastName`, and format phone/role. |
| **Notifications** | `mockDashboardNotifications` | `NotificationService.getInbox()` (`GET /api/notifications/inbox`) | **Live Ready.** Connect directly to `NotificationService.getInbox()`, mapping the top 3 items to `{ id, text: title }`. |

---

## 9. Identified Inconsistencies, Defects, and UX/UI Opportunities

1. **Mock Data Dependency:** The dashboard UI is production-ready visually, but relies on hardcoded mock values for all 6 operational sections.
2. **Action Required Click Handler:** `onActionClick(id: string)` in `dashboard.component.ts` currently logs to the browser console (`console.log('action required clicked (UI only):', id);`) without navigating to the corresponding filtered screen (e.g., `/center-manager/requests` or `/center-manager/attendance`).
3. **Hardcoded Center Name:** Center name is hardcoded as `'مرکز سلامت بهار'` rather than reading from the active user's organization context.
4. **Card Padding Density Difference:** The top overview uses `SummaryCardComponent` with `p-4`, while main content section cards use `p-5`. Standardizing all primary cards to `p-5` enhances rhythm.
5. **Missing Bidi Tagging:** Absence of `<bdi>` elements on formatted Jalali dates (`{{ persianDate }}`) and shift time strings (`{{ shift.startTime }}`).

---

## 10. Reusable Reference Design Specification

The Center Manager Dashboard establishes the following standardized UI/UX design rules for application-wide adoption:

### 1. Card Container Standard
```html
<!-- Primary Card Container -->
<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <h2 class="mb-4 text-sm font-semibold text-slate-700">عنوان کارت</h2>
  <!-- Content -->
</div>

<!-- Sub-Card Item -->
<div class="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
  <!-- Content -->
</div>
```

### 2. Action Link Button Standard
```html
<a
  routerLink="/target-route"
  class="mt-4 flex w-full items-center justify-center rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
>
  مشاهده جزئیات
</a>
```

### 3. Status Tone System
- **Active / Present / Approved:** `tone="success"` (`bg-emerald-50 text-emerald-700 ring-emerald-200`)
- **Late / Pending / Attention:** `tone="warning"` (`bg-amber-50 text-amber-700 ring-amber-200`)
- **Absent / Inactive / Rejected:** `tone="danger"` (`bg-rose-50 text-rose-700 ring-rose-200`)
- **On Leave / Informational:** `tone="info"` (`bg-sky-50 text-sky-700 ring-sky-200`)
- **Default / Neutral:** `tone="neutral"` (`bg-slate-100 text-slate-600 ring-slate-200`)

---

## 11. Prioritized Action Roadmap (For Future Execution)

1. **Phase 1: Navigation & Interactive Wire-up (Low Effort, High UX Value)**
   - Wire `onActionClick()` to route users to filtered pages (`/center-manager/requests?status=pending`, `/center-manager/shifts`).
   - Add `<bdi>` wrappers to date and time string interpolations.
2. **Phase 2: Notification & Employee Live Integration (Medium Effort)**
   - Connect notifications card to `NotificationService.getInbox()`.
   - Connect employee status preview card to `EmployeeService.getEmployees()`.
3. **Phase 3: Backend API Endpoint Alignment for Attendance Aggregates (Backend Co-dependency)**
   - Create organization-wide attendance aggregate API endpoint (`GET /api/attendance/organization/today`).
   - Wire Today's Overview and Attendance Breakdown cards to live RxJS streams.

---
*Report verified against codebase state.*
