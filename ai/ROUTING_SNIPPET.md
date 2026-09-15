# Routing — NOT auto-wired

The actual `center-manager.routes.ts` (or wherever Center Manager routes
live) was never provided, so this could not be inspected or edited
directly. Based on the `/center/dashboard` path comment found in
`dashboard.component.ts`, the routing likely follows a lazy-loaded
feature-routes pattern like:

```ts
// src/app/features/center-manager/center-manager.routes.ts
import { Routes } from '@angular/router';

export const CENTER_MANAGER_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  // ... existing routes ...
  {
    path: 'shifts/create',
    loadComponent: () =>
      import('./pages/create-shift/create-shift.component').then(
        (m) => m.CreateShiftComponent,
      ),
  },
];
```

**Action needed from you:** open the real routes file and add an entry
pointing to `CreateShiftComponent` (adjust the `path` to whatever URL
convention the rest of Center Manager uses — `shifts/create`,
`shift/new`, etc.). If routes are NOT lazy-loaded in this project (i.e.
components are imported eagerly), swap the `loadComponent` line for a
plain `component: CreateShiftComponent` import at the top of the file
instead — match whatever the existing `dashboard` route entry does.

Also add a way to navigate here from the dashboard (e.g. a "شیفت جدید"
button/RouterLink near the "امروز" shifts section) — not added
automatically since the dashboard template itself wasn't available to
edit safely.
