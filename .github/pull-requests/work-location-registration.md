# Work-location registration: hardening, security and verification

Branch: `freebuff/d798878b9c845fc673581951` (merged with current `master`, includes #162).
Base: `master`.

> This file holds the ready-to-paste pull-request body for the work-location branch.
> It is intentionally **not** placed at `.github/pull_request_template.md`, because that path
> pre-fills every future PR in the repository.

## Title

```
Harden work-location registration and keep the JWT inside the backend boundary
```

## Summary

Follow-up hardening of the work-location registration screen
(`/center-manager/work-locations/create`), found while reviewing the full registration flow from
the map to `POST /api/organizations/work-locations`.

## Security: the session token no longer leaves the backend boundary

The functional `authInterceptor` attached `Authorization: Bearer <jwt>` to **every** outgoing
request, including third-party Neshan calls (`api.neshan.org`, `static.neshan.org`). A center
manager who opened the map page therefore sent their AriaHR access token to a vendor origin on
every map click (reverse geocoding). Even though Neshan's CORS policy accepts that header, the
token is outside the trust boundary we control, which is unnecessary exposure.

`isBackendRequest(url)` now scopes the header to the configured API base (`environment.apiUrl`)
and to same-origin relative paths (`/api/...`). Third-party requests are forwarded untouched.
The 401 handling behaviour is unchanged.

## Changes

- **No duplicate registrations.** `onSubmit` is idempotent: it ignores a submission while one is
  in flight and after one succeeded. The save button is disabled during/after submission, and
  after success the page shows a saved-location summary plus an explicit reset
  («ثبت محل کار جدید») instead of silently allowing a second POST for the same center.
- **Organization comes from the authenticated profile.** The page loads `/api/auth/me` when
  needed and derives `organizationId` from it; it never submits without a center, and never
  accepts an organization from user input.
- **Validation.** Radius uses `required` + `min(1)` + `max(50 000)` with accurate Persian messages
  (the previous text mixed English: «بزرگ‌تر از zero»). Coordinates are checked against the
  WGS-84 ranges before any HTTP call, and the radius circle is only drawn for a valid radius.
- **Error handling.** Network failure, `ProblemDetails`/`errors` on 400, 401, 403, 409, 5xx and an
  invalid (non-JSON) 2xx response each map to an actionable Persian message. A malformed response
  previously surfaced the raw parser text (`Unexpected token '<' …`) to the user.
- **API contract.** `WorkLocationResponseDto` now documents the real fields, including
  `createdAtUtc` and `createdByUserId`.
- **Map SDK loading.** The loader no longer hangs when the SDK `<script>` tag already exists (its
  `load` event never fires again after SPA navigation), has a timeout, verifies the Leaflet
  global, and calls `invalidateSize()` after mount. The radius subscription is tied to
  `DestroyRef`.
- **Environment flags.** `production` was inverted between `environment.ts` and
  `environment.development.ts`; corrected.
- **Tests.** New `auth-interceptor-isolated.spec.ts` (token scoping + 401) and additional
  component tests for the submit guard, post-success lock, radius messages and coordinate
  rejection. One existing component fixture was missing `hasReverseGeocodingKey`, so its
  reverse-geocoding assertion could never pass; fixed.

## Verification

- `npx ng build` → success (only the pre-existing bundle-budget and CommonJS warnings).
- Work-location + interceptor specs → **106 passed / 107**. The single failure is pre-existing and
  unrelated: `center-manager-dashboard.service-isolated.spec.ts` expects
  `/api/center-manager/dashboard` while `environment.apiUrl` is absolute. The full suite still
  cannot compile on this branch for pre-existing reasons (specs importing
  `TestBed`/`ComponentFixture` from `@angular/core`, stale employee/leave fixtures).
- Browser check against the production build in Chromium:
  - map initializes with real Neshan tiles; a map click positions the marker and fills the
    coordinates;
  - the captured request body is
    `{"organizationId":"<from /api/auth/me>","latitude":34.796184,"longitude":48.51202,"radiusInMeters":200,"isActive":true}`;
  - two programmatic form submits while a request is in flight produce exactly **one** POST;
  - radius `0` shows «شعاع محدوده باید حداقل ۱ متر باشد.» and disables save;
  - API failure (HTTP 500 and a non-JSON 200) both show Persian messages, no parser text;
  - signing out and opening the route redirects to `/login`;
  - RTL layout verified on desktop and at 390 px with no horizontal overflow.
- Screenshots: `artifacts/work-location-desktop.png`, `artifacts/work-location-mobile.png`.

## Not verified in this repository

This repository is the Angular frontend only; nothing listens on `https://localhost:7151` and
there is no database, so the following still need a backend-side check:

1. Server-side authentication/authorization for `POST /api/organizations/work-locations`, whether
   `organizationId: null` is intentionally supported, and how the organization is resolved from
   JWT claims.
2. Persistence: `id`, `createdAtUtc`, `createdByUserId`, duplicate-prevention rules per
   organization, organization isolation, and the returned status code/body shape.
3. Retrieving the saved location after reload.

## External configuration before release

- Add the real deployment domain to the Neshan **Web Map** and **Reverse Geocoding** key scopes. On
  the cloud preview origin both keys answer
  `484 API Key scope (ip, domain or bundle) did not match`, so the basemap renders empty tiles and
  the address field reports failure; on `http://localhost:4200` the same keys return tiles and a
  full Persian address.
- If the API is served from a different origin than the SPA, set `environment.ts` `apiUrl` to the
  API origin. With the current empty value a production build posts to the SPA origin, which
  returns HTML and is reported to the user as an invalid server response.
- The Neshan API keys are currently committed in `environment*.ts` (pre-existing); they should move
  to deployment configuration.
