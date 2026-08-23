# AriaHR — Splash Screen Implementation

## ⚠️ Important context

No AriaHR project files were available on disk in this session (no upload, no
repo access), so step 13 of the spec — "inspect the existing project
structure, routing, logo asset, and Tailwind config" — could not literally be
performed. The files below were built to the exact spec using reasonable,
clearly-marked assumptions. You'll need to do a couple of one-line
adjustments when you drop them into your real project (details below).

## Files included in this download

```
src/app/features/auth/pages/splash/splash.component.ts     (new)
src/app/features/auth/pages/splash/splash.component.html   (new)
src/app/features/auth/pages/splash/splash.component.css    (new)
src/app/app.routes.example.ts                              (reference only — see below)
```

### Files created

- **`splash.component.ts`** — Standalone Angular 20 component. Logo-only
  splash screen. Starts a 2500ms timer in `ngOnInit`, navigates to `/login`
  via `Router.navigate`, and clears the timer in `ngOnDestroy` (no memory
  leak, no navigation after teardown). `OnPush` change detection, no
  services, no HTTP calls, no state management.
- **`splash.component.html`** — `<main>` with
  `min-h-screen flex items-center justify-center bg-white`, containing only
  an `<img>` with `alt="AriaHR"`. No text, no title, no version, no
  copyright. Works identically in RTL and LTR since flex centering doesn't
  depend on text direction.
- **`splash.component.css`** — Fade + subtle scale-up keyframe animation
  (`opacity 0→1`, `scale 0.92→1`, ~900ms, calm easing). Wrapped with a
  `@media (prefers-reduced-motion: reduce)` override that swaps it for a
  quick fade-only animation.

### Files modified

- **None.** No real project files were on disk to modify. Instead,
  `app.routes.example.ts` is provided as a **reference/example only** —
  copy the two relevant lines into your actual routing file (see below).

### Routing changes (to apply yourself)

In your project's real routes file (commonly `src/app/app.routes.ts`):

1. Import `SplashComponent`:
   ```ts
   import { SplashComponent } from './features/auth/pages/splash/splash.component';
   ```
2. Add the route and point the root path at it:
   ```ts
   { path: '', redirectTo: 'splash', pathMatch: 'full' },
   { path: 'splash', component: SplashComponent },
   ```
3. Leave all other existing routes exactly as they are.

### Tailwind / CSS changes

- **No `tailwind.config` changes required.** Only standard utility classes
  are used (`min-h-screen`, `flex`, `items-center`, `justify-center`,
  `bg-white`, `w-32 sm:w-36 md:w-40`, `h-auto`, `px-6`).
- `min-h-[100dvh]` is included alongside `min-h-screen` for better mobile
  viewport/safe-area handling; this is a plain Tailwind arbitrary-value
  utility, not a config change.
- The only custom CSS is the animation keyframes in `splash.component.css`
  (kept local to the component, not global styles).

### Assumption you must verify: the logo path

The template references:
```html
<img src="assets/images/logo.svg" alt="AriaHR" ... />
```
Since the real project wasn't available, this path is a placeholder.
**Update `src/app/features/auth/pages/splash/splash.component.html`** to
point at your actual existing logo asset (e.g. `assets/logo.png`,
`assets/brand/ariahr-logo.svg`, etc.) — do not add a new logo file.

## How to run and verify

1. Copy the three files in
   `src/app/features/auth/pages/splash/` into that path in your project
   (creating the folder if it doesn't exist).
2. Fix the logo `src` path in `splash.component.html` as described above.
3. Apply the two routing lines from `app.routes.example.ts` into your real
   routes file.
4. Run the app:
   ```bash
   ng serve
   ```
5. Navigate to `http://localhost:4200/` (or `/splash` directly) and confirm:
   - The app compiles with no errors.
   - Only the AriaHR logo is visible, centered on the screen.
   - The logo fades and gently scales in on load.
   - After ~2.5 seconds, the app automatically navigates to `/login`
     (URL bar changes, no full page reload).
   - In DevTools → Rendering → "Emulate CSS media feature
     prefers-reduced-motion: reduce", reload `/splash` and confirm the
     animation becomes a quick fade only.
   - Navigate away from `/splash` before the timer fires (e.g. click a link
     manually if reachable) and confirm no console errors/navigation fire
     after — this confirms the timer cleanup in `ngOnDestroy` works.
