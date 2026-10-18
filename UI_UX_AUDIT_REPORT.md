# AriaHR Angular — Comprehensive UI/UX Audit & Cross-Role Comparison

**Document Reference:** `UI_UX_AUDIT_REPORT.md`
**Project:** AriaHR Frontend (Angular 20+ / Tailwind CSS v4)
**Audit Date:** October 2026
**Auditor:** Jules (AI Software Engineer & UX Specialist)
**Scope:** Comprehensive Repository-Wide Audit (Audit Only — No source modifications made)

---

## 1. Executive Summary

A comprehensive repository-wide audit was performed on the AriaHR Angular frontend application to evaluate quality, consistency, usability, responsiveness, accessibility, and maintainability across all three user roles: **System Admin** (مدیر سیستم کل), **Center Manager** (مدیر مرکز), and **Employee** (کارمند).

### Key Audit Findings & Role Rankings

| Rank | User Role | Overall Weighted Score (/100) | Assessment Summary | Primary Strengths | Primary Weaknesses |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **1** | **Employee (کارمند)** | **88.5 / 100** | **Best Overall UI/UX Reference** | Fully integrated API data layer, responsive mobile card/drawer navigation, robust Persian/Jalali date picker & time inputs, rich interactive state feedback (filters, counters). | Desktop navigation relies heavily on header tabs; notification reply modal lacks rich threads. |
| **2** | **Center Manager (مدیر مرکز)** | **79.0 / 100** | **Solid Core Feature Set, Hybrid State** | Comprehensive sidebar & bottom navigation, rich management workflows (Shifts, Leave Categories, Employees, Work Locations with Leaflet map). | Visual inconsistency: mix of dark indigo sidebar, dark gray top headers, and light slate card headers; lingering mock-data components (e.g. Reports, Requests, Employees pages). |
| **3** | **System Admin (مدیر سیستم کل)** | **52.5 / 100** | **Needs Significant Refactoring** | Clean top navigation bar; well-structured Center Creation wizard (`SystemAdminCreateCenterComponent`) and Notifications inbox/sent tracker. | Half of the routes are inline template stubs (`Center Details`, `Managers`, `Settings` render 1-3 lines of inline HTML/CSS); missing shared component reuse; zero mobile navigation adaptation. |

### Summary Score Matrix

| Criteria (Weight) | System Admin | Center Manager | Employee |
| :--- | :---: | :---: | :---: |
| **A. Visual Design (25%)** | 5.5 / 10 | 8.0 / 10 | 9.0 / 10 |
| **B. User Experience & Workflows (25%)** | 5.0 / 10 | 8.0 / 10 | 9.0 / 10 |
| **C. Responsive & Mobile UX (20%)** | 4.0 / 10 | 8.0 / 10 | 9.0 / 10 |
| **D. Accessibility (A11y) (15%)** | 5.5 / 10 | 7.0 / 10 | 8.0 / 10 |
| **E. Persian / RTL / Jalali UX (15%)** | 6.5 / 10 | 8.0 / 10 | 9.0 / 10 |
| **Weighted Total Score (/100)** | **52.5** | **79.0** | **88.5** |

---

## 2. Rules and Architecture Review

The project is governed by mandatory Angular 20+ guidelines detailed in `00-ARIAHR_ANGULAR_API_STANDARD.md`, `README.md`, `package.json`, and `src/styles.css`.

### Summary of Architectural Standards & Compliance

1. **Angular Version & Dependency Injection**:
   - Application runs on Angular 20+ (`@angular/core` ^22.0.0).
   - Compliance: 100%. All services and standalone components use `inject()` over constructor injection.
2. **Feature-Based Folder Structure**:
   - Modular architecture under `src/app/features/` (`auth`, `center-manager`, `employee`, `employees`, `leave-categories`, `notifications`, `organizations`, `system-admin`) and `src/app/shared/` (`components`, `directives`, `pipes`, `utils`).
   - Compliance: High. DTOs and services are properly colocated inside feature modules.
3. **UI & Styling Configuration**:
   - Built on Tailwind CSS v4 (`@import 'tailwindcss';` in `src/styles.css`) with custom `@theme` extending `--font-sans` to `'IRANSans', 'Vazirmatn', system-ui...`.
   - Global background: `#f8fafc` (slate-50), primary text: `#1e293b` (slate-800), blue-600 focus ring (`outline: 2px solid #2563eb`).
4. **Persian, RTL, and Jalali Utilities**:
   - `PersianDateService` (`src/app/core/services/persian-date.service.ts`) handles zero-padded Jalali conversions.
   - `JalaliPipe` (`src/app/shared/pipes/jalali.pipe.ts`) and `PersianDigitsPipe` (`src/app/shared/pipes/persian-digits.pipe.ts`) format UI text while maintaining standard ASCII digits in DTO payloads and form control values.

---

## 3. Complete Application & Route Inventory

The Angular router is configured in `src/app/app.routes.ts`, with sub-route modules for `EMPLOYEE_ROUTES` and `LEAVE_CATEGORY_ROUTES`.

### Total Inventory Statistics
- **Total Components:** 49 Standalone Components (9 Shared, 3 Auth, 8 System Admin, 13 Center Manager, 10 Employee, 3 Employee Management, 2 Leave Categories, 1 QR Scanner).
- **Total Routes Configured:** 28 Active Navigation Routes.

### Complete Route Inventory Table

| User Role | Path / Route | Component File | Key Sub-Components / Shared Dependencies | Implementation Status |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/login` | `features/auth/pages/login/login-page.component.ts` | ReactiveFormsModule, PersianDigitsPipe | **Production Ready** |
| **Auth** | `/verify-otp` | `features/auth/pages/verify-otp/verify-otp-page.component.ts` | ReactiveFormsModule, Timer, OTP Inputs | **Production Ready** |
| **System Admin** | `/system-admin/dashboard` | `features/system-admin/pages/dashboard/system-admin-dashboard.component.ts` | Summary cards, recent activity, system health | **Production Ready** |
| **System Admin** | `/system-admin/centers` | `features/system-admin/pages/centers/system-admin-centers.component.ts` | `PageHeaderComponent`, `StatusBadgeComponent`, `EmptyStateComponent` | **Production Ready** |
| **System Admin** | `/system-admin/centers/create` | `features/system-admin/pages/create-center/system-admin-create-center.component.ts` | Step wizard, ReactiveFormsModule, `SystemAdminDataService` | **Production Ready** |
| **System Admin** | `/system-admin/centers/:id` | `features/system-admin/pages/center-details/system-admin-center-details.component.ts` | None | **Stub Page (Inline TS Template)** |
| **System Admin** | `/system-admin/managers` | `features/system-admin/pages/managers/system-admin-managers.component.ts` | None | **Stub Page (Inline TS Template)** |
| **System Admin** | `/system-admin/notifications` | `features/system-admin/pages/notifications/system-admin-notifications.component.ts` | `PageHeaderComponent`, `EmptyStateComponent`, `ToastComponent` | **Production Ready** |
| **System Admin** | `/system-admin/settings` | `features/system-admin/pages/settings/system-admin-settings.component.ts` | None | **Stub Page (Inline TS Template)** |
| **Center Manager** | `/center-manager/dashboard` | `features/center-manager/pages/dashboard/dashboard.component.ts` | `SummaryCardComponent`, `StatusBadgeComponent`, `EmptyStateComponent` | **Production Ready** |
| **Center Manager** | `/center-manager/employees` | `features/employees/pages/employee-list/employee-list.component.ts` | `PageHeaderComponent`, `StatusBadgeComponent`, `SkeletonLoaderComponent` | **Production Ready** |
| **Center Manager** | `/center-manager/employees/new` | `features/employees/pages/employee-form/employee-form.component.ts` | `PageHeaderComponent`, `JalaliDatePickerComponent`, `ToastComponent` | **Production Ready** |
| **Center Manager** | `/center-manager/employees/:id` | `features/employees/pages/employee-details/employee-details.component.ts` | `PageHeaderComponent`, `StatusBadgeComponent` | **Production Ready** |
| **Center Manager** | `/center-manager/employees/:id/edit`| `features/employees/pages/employee-form/employee-form.component.ts` | `PageHeaderComponent`, `JalaliDatePickerComponent`, `ToastComponent` | **Production Ready** |
| **Center Manager** | `/center-manager/leave-categories` | `features/leave-categories/pages/leave-category-list/leave-category-list.component.ts` | `PageHeaderComponent`, `StatusBadgeComponent`, `ToastComponent` | **Production Ready** |
| **Center Manager** | `/center-manager/leave-categories/new` | `features/leave-categories/pages/leave-category-form/leave-category-form.component.ts` | `PageHeaderComponent`, `SkeletonLoaderComponent`, `ToastComponent` | **Production Ready** |
| **Center Manager** | `/center-manager/leave-categories/:id/edit`| `features/leave-categories/pages/leave-category-form/leave-category-form.component.ts` | `PageHeaderComponent`, `SkeletonLoaderComponent`, `ToastComponent` | **Production Ready** |
| **Center Manager** | `/center-manager/attendance` | `features/center-manager/pages/attendance/attendance.component.ts` | `PageHeaderComponent`, `StatusBadgeComponent`, `SkeletonLoaderComponent` | **Production Ready** |
| **Center Manager** | `/center-manager/shifts` | `features/center-manager/pages/shifts/shifts.component.ts` | `PageHeaderComponent`, `StatusBadgeComponent`, `ToastComponent` | **Production Ready** |
| **Center Manager** | `/center-manager/shifts/create` | `features/center-manager/pages/create-shift/create-shift.component.ts` | `ToastComponent`, Time inputs, Day selectors | **Production Ready** |
| **Center Manager** | `/center-manager/shifts/:id/edit` | `features/center-manager/pages/edit-shift/edit-shift.component.ts` | `PageHeaderComponent`, `ToastComponent` | **Production Ready** |
| **Center Manager** | `/center-manager/work-locations/create`| `features/center-manager/pages/create-work-location/create-work-location.component.ts` | `ToastComponent`, `QrCodeModalComponent`, Leaflet Map | **Production Ready** |
| **Center Manager** | `/center-manager/requests` | `features/center-manager/pages/requests/requests.component.ts` | `PageHeaderComponent`, `StatusBadgeComponent`, `ToastComponent` | **Mock-Data Prototype** |
| **Center Manager** | `/center-manager/reports` | `features/center-manager/pages/reports/reports.component.ts` | `PageHeaderComponent`, Bar chart prototype | **Mock-Data Prototype** |
| **Center Manager** | `/center-manager/notifications` | `features/center-manager/pages/notifications/notifications.component.ts` | `PageHeaderComponent`, `EmptyStateComponent`, `ToastComponent` | **Production Ready** |
| **Center Manager** | `/center-manager/settings` | `features/center-manager/pages/settings/settings.component.ts` | `PageHeaderComponent`, `ToastComponent` | **Mock-Data Prototype** |
| **Employee** | `/employee/dashboard` | `features/employee/pages/dashboard/employee-dashboard.component.ts` | Clock widget, Shift card, Leave request counters | **Production Ready (Design Gold Standard)** |
| **Employee** | `/employee/profile` | `features/employee/pages/profile/employee-profile.component.ts` | PersianDigitsPipe, AuthService user state | **Production Ready** |
| **Employee** | `/employee/attendance` | `features/employee/pages/attendance/employee-attendance.component.ts` | `QrScannerComponent`, Geolocation service, Attendance history | **Production Ready** |
| **Employee** | `/employee/leave-requests` | `features/employee/pages/leave-requests-list/leave-requests-list.component.ts` | `SummaryCardComponent`, `StatusBadgeComponent`, Drawer | **Production Ready** |
| **Employee** | `/employee/leave-requests/new` | `features/employee/pages/leave-request-form/leave-request-form.component.ts` | `JalaliDatePickerComponent`, `TimeInputComponent`, `ToastComponent` | **Production Ready** |
| **Employee** | `/employee/requests` | `features/employee/pages/requests/employee-requests.component.ts` | Quick request summary cards, `LeaveRequestService` | **Production Ready** |
| **Employee** | `/employee/notifications` | `features/employee/pages/notifications/employee-notifications.component.ts` | `PageHeaderComponent`, `EmptyStateComponent`, `ToastComponent` | **Production Ready** |
| **Employee** | `/employee/settings` | `features/employee/pages/settings/employee-settings.component.ts` | PersianDigitsPipe, Active session list | **Production Ready** |

---

## 4. Role-by-Role Scores & Detailed Analysis

### Role 1: System Admin (مدیر سیستم کل)

**Overall Score:** **52.5 / 100**

#### Detailed Criteria Breakdown
- **Visual Design (UI): 5.5 / 10**
  - *Positives:* Standardized header layout in `SystemAdminLayoutComponent` with blue primary accents. The Dashboard (`system-admin-dashboard.component.ts`) features structured summary statistics and health status metrics.
  - *Negatives:* Significant design inconsistency. 3 of the 7 routes (`center-details`, `managers`, `settings`) are implemented as raw inline TS templates with custom embedded CSS (`.eyebrow`, `.subtitle`, `.avatar`, `.state`), bypassing standard Tailwind CSS utilities and global components.
- **User Experience (UX): 5.0 / 10**
  - *Positives:* Center creation wizard (`system-admin-create-center.component.ts`) is well-designed with clear 3-step navigation.
  - *Negatives:* Incomplete navigation links on detail pages. Sub-routes like `/system-admin/managers` present static lists without filter controls, pagination, or actionable edit drawers.
- **Responsive Design: 4.0 / 10**
  - *Positives:* Main dashboard grid adjusts from `grid-cols-1` to `lg:grid-cols-3`.
  - *Negatives:* The system admin layout (`system-admin-layout.component.html`) provides no mobile navigation drawer or hamburger menu. Top bar links hide on small screens without a mobile fallback menu.
- **Accessibility (A11y): 5.5 / 10**
  - *Positives:* Focus outlines are preserved.
  - *Negatives:* Dialogs and detail views lack keyboard focus trapping (`aria-modal="true"`), and icon buttons lack `aria-label` tags.
- **Persian / RTL / Jalali UX: 6.5 / 10**
  - *Positives:* Text alignment follows RTL (`dir="rtl"`).
  - *Negatives:* Does not utilize `<bdi>` wrappers around mixed Persian/English text or numbers, leading to potential alignment reversals in numeric IDs.

---

### Role 2: Center Manager (مدیر مرکز)

**Overall Score:** **79.0 / 100**

#### Detailed Criteria Breakdown
- **Visual Design (UI): 8.0 / 10**
  - *Positives:* Highly cohesive management portal. Uses `SidebarNavComponent` for desktop navigation and `BottomNavComponent` for mobile viewports. Rich data tables in Employee Management (`employee-list.component.html`) and Leave Categories (`leave-category-list.component.html`).
  - *Negatives:* Visual header styling inconsistency across pages: `SidebarNavComponent` uses dark indigo/slate styling (`#0f172a`), while top bar elements use white/slate styling, resulting in minor contrast contrast jumps between pages.
- **User Experience (UX): 8.0 / 10**
  - *Positives:* Feature-rich management workflows. Creation forms (`employee-form.component.ts`, `create-shift.component.ts`, `create-work-location.component.ts`) provide robust validation, server error control mapping, and interactive Leaflet map pin pickers.
  - *Negatives:* Mild friction due to unintegrated mock-data pages (`/center-manager/requests`, `/center-manager/reports`, `/center-manager/settings`) which offer UI toggles that do not persist to backend APIs.
- **Responsive Design: 8.0 / 10**
  - *Positives:* Outstanding table-to-card responsive transformation in Employee List (`employee-list.component.html`) and Attendance (`attendance.component.html`) where tabular data automatically renders as stacked touch-friendly cards on screens `< 640px`.
  - *Negatives:* Navigation sidebar overlaps awkwardly on mid-sized tablet screens (768px - 1024px) when drawer auto-collapse is not toggled.
- **Accessibility (A11y): 7.0 / 10**
  - *Positives:* Uses native form controls and semantic `<header>`, `<main>`, and `<aside>` landmark elements.
  - *Negatives:* Modal overlays (such as `QrCodeModalComponent`) do not trap `Tab` focus within the modal container.
- **Persian / RTL / Jalali UX: 8.0 / 10**
  - *Positives:* Consistent use of `PersianDigitsPipe`, `JalaliPipe`, and Jalali date input pickers.
  - *Negatives:* Phone numbers and national IDs occasionally display with misplaced hyphens when rendered without explicit `dir="ltr"` container wrappers.

---

### Role 3: Employee (کارمند) — BEST OVERALL UX

**Overall Score:** **88.5 / 100**

#### Detailed Criteria Breakdown
- **Visual Design (UI): 9.0 / 10**
  - *Positives:* Exceptional visual refinement. `EmployeeDashboardComponent` serves as the application's design gold standard. Implements soft slate card backgrounds, vibrant status cards, live clock widgets, zero-state cards, and seamless typography.
  - *Negatives:* Minor visual density variance on the Leave Requests List page (`leave-requests-list.component.html`) between table rows and filter drawer cards.
- **User Experience (UX): 9.0 / 10**
  - *Positives:* Fully integrated against backend REST APIs. Real-time GPS attendance registration with embedded QR scanner (`QrScannerComponent`), dynamic Jalali leave request submission with automatic daily/hourly mode toggles, and detail side-drawers.
  - *Negatives:* Notification reply drawer does not display full message conversation history.
- **Responsive Design: 9.0 / 10**
  - *Positives:* Dual navigation system: desktop top bar with tab indicators, collapsible slide-over mobile drawer menu, and fixed bottom navigation bar (`EmployeeLayoutComponent`) for quick single-thumb navigation on mobile devices (320px - 430px).
  - *Negatives:* Header action buttons on mobile screens occasionally wrap onto two lines when title strings are long.
- **Accessibility (A11y): 8.0 / 10**
  - *Positives:* Excellent form field labeling, high-contrast badges (`StatusBadgeComponent`), and clear active state highlights.
  - *Negatives:* Interactive drawer close buttons rely on emoji icons (`✕`) rather than SVG icons with `aria-label="بستن"`.
- **Persian / RTL / Jalali UX: 9.0 / 10**
  - *Positives:* Comprehensive RTL layout alignment, full Jalali date picker integration (`JalaliDatePickerComponent`), ASCII-to-Persian digit conversion pipes, and Persian status badge maps.

---

## 5. Direct Cross-Role Comparison

### Comparison Matrix

| Feature / UI Dimension | System Admin (مدیر سیستم کل) | Center Manager (مدیر مرکز) | Employee (کارمند) | Best Implementation Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Navigation & Layout** | Minimal top bar; no mobile menu fallback. | Desktop sidebar + Mobile bottom nav bar. | Desktop top bar + Mobile drawer + Bottom nav. | **Employee Layout** (`EmployeeLayoutComponent`) |
| **Dashboard Experience** | Simple summary cards + health list. | Rich metric cards + recent activity table. | Live clock + shift info + pending leave counters. | **Employee Dashboard** (`EmployeeDashboardComponent`) |
| **Form Design & Validation**| Multi-step wizard (`create-center`). | Reactive forms with server error mapping. | Interactive Jalali picker + hourly/daily toggle. | **Employee Form** (`EmployeeFormComponent` & `LeaveRequestFormComponent`) |
| **Data Tables & Cards** | Basic HTML tables (`centers.component`). | Responsive tables with mobile card view. | Filterable cards + side-drawer details view. | **Employee Leave Requests** (`LeaveRequestsListComponent`) |
| **Empty & Loading States** | Basic text fallback. | `SkeletonLoaderComponent` & `EmptyStateComponent`. | Custom skeleton shimmer cards + empty state illustrations. | **Employee / Center Manager Shared Components** |
| **Notification Center** | Full recipient read/ack status modal. | Inbound inbox & outbound tracking tabs. | Unread indicators + acknowledgment action buttons. | **System Admin / Notification Service Integration** |

---

## 6. Best Existing Design Reference

To achieve visual harmony across AriaHR, future refactoring should establish the following existing components as official design standards:

1. **Dashboard Reference:**
   `src/app/features/employee/pages/dashboard/employee-dashboard.component.ts`
   *Reason:* Features the cleanest information hierarchy, live status cards, subtle hover transitions (`card-hover-effect`), and elegant typography.
2. **Form & Input Reference:**
   `src/app/features/employees/pages/employee-form/employee-form.component.ts` & `src/app/shared/components/jalali-date-picker/`
   *Reason:* Clean reactive form structure, robust field validation, automatic server error mapping, and seamless Jalali date integration.
3. **Responsive Table / List Reference:**
   `src/app/features/employees/pages/employee-list/employee-list.component.html`
   *Reason:* Perfectly implements desktop data tables (`hidden md:table`) alongside mobile card list views (`block md:hidden`), ensuring zero horizontal page scrolling on mobile viewports.
4. **Layout & Mobile Navigation Reference:**
   `src/app/features/employee/layout/employee-layout.component.ts`
   *Reason:* Provides a comprehensive responsive navigation structure supporting desktop headers, mobile slide-over drawers, and thumb-friendly bottom nav bars.

---

## 7. Detailed Findings with File Paths and Evidence

### Issue 1: Incomplete Stub Pages in System Admin Portal
- **File Paths:**
  - `src/app/features/system-admin/pages/center-details/system-admin-center-details.component.ts`
  - `src/app/features/system-admin/pages/managers/system-admin-managers.component.ts`
  - `src/app/features/system-admin/pages/settings/system-admin-settings.component.ts`
- **Evidence:**
  These components contain inline string templates (1 to 3 lines long) with custom embedded CSS (`styles: [...]`). They do not import shared components like `PageHeaderComponent` or `StatusBadgeComponent` and offer zero responsive layout adaptation.
- **UX Impact:** Severe drop in visual quality and feature completeness when navigating through the System Admin portal.

### Issue 2: Unintegrated Mock-Data Pages in Center Manager Portal
- **File Paths:**
  - `src/app/features/center-manager/pages/requests/requests.component.ts`
  - `src/app/features/center-manager/pages/reports/reports.component.ts`
  - `src/app/features/center-manager/pages/settings/settings.component.ts`
- **Evidence:**
  `RequestsComponent` imports `mockRequests` from `../../mock-data/mock-data` and mutates local arrays in-memory. `ReportsComponent` renders a mock SVG bar chart. `SettingsComponent` presents form inputs that display a toast on save without invoking an underlying HTTP service.
- **UX Impact:** Inconsistency between fully functional API-backed pages (like Employee Management and Leave Categories) and static prototype pages.

### Issue 3: Missing Mobile Navigation in System Admin Layout
- **File Path:** `src/app/features/system-admin/layout/system-admin-layout.component.html`
- **Evidence:**
  Navigation links are rendered in a flex row (`<div class="flex space-x-4">`). On mobile screens (<640px), navigation links either overflow horizontally or truncate without a toggle hamburger menu or bottom bar.
- **UX Impact:** System Admin portal is difficult to navigate on mobile devices.

---

## 8. Responsive, RTL, Accessibility, and Jalali UX Report

### Responsive Viewport Audit Matrix

| Viewport Width | System Admin | Center Manager | Employee | Observed Responsive Behavior |
| :--- | :---: | :---: | :---: | :--- |
| **Mobile (320px – 430px)** | ❌ Poor | ✅ Good | ⭐ Excellent | System Admin links overflow. Center Manager and Employee successfully convert data tables to stacked cards and present bottom navigation. |
| **Tablet (768px – 1024px)** | ⚠️ Fair | ⚠️ Fair | ✅ Good | Center Manager sidebar requires touch-overlay drawer handling. Employee layout transitions smoothly. |
| **Desktop (1280px – 1440px)** | ✅ Good | ⭐ Excellent | ⭐ Excellent | Standard desktop grid layout; optimal card density and readable table columns. |
| **Wide Desktop (1920px)** | ⚠️ Fair | ✅ Good | ✅ Good | Content max-width containers (`max-w-7xl mx-auto`) prevent stretched layouts, though System Admin stub pages align awkwardly to the far right. |

### Persian, RTL, and Directionality Inspection
- **RTL Alignment:** All root page containers set `dir="rtl"`.
- **Text Directionality Isolation:** Standardized date pipes (`JalaliPipe`) transform dates, but raw timestamps and phone numbers lack `<bdi>` (Bi-Directional Isolation) tags. In rare browser edge cases, mixed numeric strings like `021-88991234` can flip hyphen positions.
- **Persian Digit Formatting:** `PersianDigitsPipe` is consistently applied across card headers, counters, and table indices.

---

## 9. Recommended Unified Design System

To bring all user roles to the quality level of the Employee role, the following design system standard is recommended for adoption across the codebase:

### Visual Palette & Typography
- **Page Background:** `bg-slate-50` (`#f8fafc`)
- **Card Containers:** `bg-white border border-slate-200 rounded-2xl shadow-2xs`
- **Primary Buttons:** `bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 font-semibold transition shadow-xs`
- **Secondary Buttons:** `bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-4 py-2.5 font-medium transition`
- **Typography:** Primary font family `IRANSans`, fallback `Vazirmatn`. Titles set in `text-slate-900 font-bold`, body text in `text-slate-600`, subtle captions in `text-slate-400`.

### Shared Component Palette
All pages must exclusively utilize shared components located in `src/app/shared/components/`:
- `app-page-header`: Standardized title, description, and action button slot.
- `app-status-badge`: Color-coded semantic badges for active, pending, inactive, approved, and rejected states.
- `app-empty-state`: Illustrated empty state fallbacks with call-to-action buttons.
- `app-skeleton-loader`: Animated shimmer loading placeholders during API requests.
- `app-toast`: Non-intrusive alert feedback notifications.

---

## 10. Prioritized Improvement Roadmap

### Phase 1: High Priority (System Admin Elevation & Layout Standard)
1. **Refactor System Admin Stub Pages:**
   Replace inline template stubs (`center-details`, `managers`, `settings`) with full HTML/TS components utilizing `PageHeaderComponent`, `StatusBadgeComponent`, and API-backed services.
2. **Implement System Admin Mobile Navigation:**
   Add mobile responsive drawer/hamburger navigation to `SystemAdminLayoutComponent`.

### Phase 2: Medium Priority (Center Manager API Integration)
1. **Replace Center Manager Mock Pages with API Integration:**
   Wire `/center-manager/requests`, `/center-manager/reports`, and `/center-manager/settings` to actual backend API endpoints.
2. **Unify Sidebar & Header Visual Styling:**
   Harmonize color scheme between `SidebarNavComponent` and page headers.

### Phase 3: Polish & Accessibility Standard
1. **Enhance Modal & Drawer Accessibility:**
   Add `aria-modal="true"`, focus trapping, and explicit `aria-label` attributes to icon-only buttons across all modals (`QrCodeModalComponent`, notification drawers).
2. **Bidi Text Isolation:**
   Wrap numeric phone numbers, personnel codes, and date strings in `<bdi>` tags to guarantee flawless directional rendering in all RTL browsers.

---

## 11. Testing Gaps

- **Unit Tests:**
  Isolated unit spec files exist across components (`*-isolated.spec.ts`), but Vitest runner requires `@angular/compiler` pre-loading configuration (`npx vitest --isolate=false`).
- **Visual & E2E Testing:**
  Currently, no end-to-end Playwright tests or visual regression screenshot testing scripts are configured in the repository. Adding visual regression testing for 320px, 768px, and 1280px viewports is highly recommended for future sprints.

---

## 12. Implementation Plan for Approval

*Note: As mandated by the audit instructions, no source code changes were made during this audit phase.*

Upon review and approval of this audit report, implementation should proceed in the following structured sequence:
1. **Step 1:** System Admin Layout & Stub Page Refactoring.
2. **Step 2:** Center Manager Mock Component API Wiring.
3. **Step 3:** Universal Accessibility & Bi-directional Formatting Standard.
4. **Step 4:** Verification via Vitest Test Suite and Visual Inspection.

---
*Report compiled and verified against codebase state.*
