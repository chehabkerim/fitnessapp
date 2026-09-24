# [APP NAME] — Fitness Tracker (iOS + Android)

## Product
A personal fitness tracker for calories/food, steps, workouts, and body weight. Steps and active energy are read automatically from Apple Health (iOS) and Health Connect (Android). Single user, local-first, no accounts or backend in v1. It should feel like a calm, premium editorial product, not a gamified gym app.

## Tech stack
- Expo (latest stable SDK) + TypeScript (strict), Expo Router for navigation
- Web target via react-native-web with Expo Router static output (`web.output: "static"`). Web is the primary test target for Phase 1 (see "Web first" below); iOS and Android build from the same codebase.
- Development builds via EAS Build (expo-dev-client). This app will NOT run in Expo Go because of native health modules.
- iOS health: @kingstinct/react-native-healthkit (with its Expo config plugin)
- Android health: react-native-health-connect + expo-health-connect config plugin
- Wrap both behind one shared interface in /src/health (e.g. getSteps(date), getStepsRange(start, end), getActiveEnergy(date), requestPermissions(), getPermissionStatus()) so the rest of the app never touches platform-specific code
- Local storage: Drizzle ORM over SQLite, behind a repository layer in /src/db. Native uses expo-sqlite. The web engine is still to be decided (see "Web first → Storage").
- Charts: victory-native (Skia-based)
- Fonts: @expo-google-fonts/fraunces and @expo-google-fonts/inter
- Barcode scanning: expo-camera (on web it uses its bundled barcode-detector polyfill, which needs HTTPS and camera permission)
- Food data: Open Food Facts public API (search + barcode lookup), results cached locally
- Before installing any package, check its current docs and compatibility with our Expo SDK version. If a library above is deprecated or incompatible, tell me and propose the replacement instead of silently swapping.
- No other dependencies without asking me first

## Core features (v1)
1. Onboarding: name, sex, age, height, weight, activity level, goal (lose / maintain / gain), units (metric/imperial). Daily calorie target via Mifflin-St Jeor × activity multiplier ± goal adjustment. Then a health-permissions screen explaining in plain language why we need step and activity data, before triggering the system prompt.
2. Today dashboard: calorie ring (eaten vs target, optionally adding active calories burned from health data), macro bars, steps vs daily goal (live from health data, refreshed on app foreground and pull-to-refresh), today's workout summary, quick-add buttons.
3. Food log: meals (breakfast, lunch, dinner, snacks); Open Food Facts search; barcode scan; custom foods; serving size editing; recents and favourites; copy yesterday's meal.
4. Steps: synced automatically; daily goal; week/month history chart. If permission is denied or unavailable, show a clear state explaining how to enable it in Settings, with manual entry as a fallback.
5. Workouts: exercise library (~40 common exercises by muscle group), log sets × reps × weight, templates, rest timer (with haptics and a local notification if backgrounded), personal records per exercise, estimated calories burned. Optionally write completed workouts to Apple Health / Health Connect (user toggle).
6. Body: weight log with 7-day moving average trend; optional measurements.
7. Progress: weekly/monthly charts for calories, steps, weight, workout volume.
8. Settings: goals, units, health permissions status, export/import JSON, reset data.

## Design direction
- Editorial minimalism, warm and calm. Generous whitespace, strong typographic hierarchy.
- Palette: warm off-white (#F6F1EA), ink (#1F1A17), terracotta accent (#C4623F), muted sand (#E4D9CB), soft sage for goal-met states (#7D8F6E).
- Type: Fraunces for display numbers and headings, Inter for UI and body.
- Large numerals for key stats. Thin rings and bars, no heavy gradients, no neon, no emoji.
- Bottom tab bar: Today, Food, Workouts, Progress, Settings.
- Subtle motion: 150–250ms ease-out, ring fill animation on load, light haptics on key actions.
- Dark mode with the same warm character (deep brown-black, not pure black).
- Respect safe areas and Dynamic Type / font scaling.

## Platform & compliance
- iOS: HealthKit entitlement, NSHealthShareUsageDescription and NSHealthUpdateUsageDescription with clear human wording, configured through app.config.ts, not by hand-editing native folders.
- Android: Health Connect permissions (steps, active calories burned, exercise), the required permissions rationale screen/intent, and handling for devices where Health Connect isn't installed (link to install it).
- Health data is never sent anywhere; state this in the permission copy.

## Engineering rules
- Business logic (calorie maths, PR detection, averages, date handling) lives in /src/lib with Jest unit tests.
- No platform forks in feature code. Platform differences live only in small adapters in /src/platform, /src/health and /src/db, using `*.web.ts` / `*.native.ts` files. Screens and components never branch on `Platform.OS` for behaviour.
- Health integration has a mock implementation used when running tests or when native modules are unavailable, so UI can be developed without a device.
- Store dates as ISO local-date strings (YYYY-MM-DD).
- Every screen has empty, loading, error, and permission-denied states where relevant.
- Accessible: labels, 44pt tap targets, WCAG AA contrast.
- After each phase: run type-check and tests, confirm the web static export builds, fix all errors, then summarise what was built and exactly what I should test, using the checklist in "Web first → Device testing" (plus native devices once native builds are in scope).

## Web first (Phase 1)
Phase 1 is built, used and tested as a website before the native apps. iOS and Android must still type-check, compile and run from the same codebase.

### Storage
- Feature code imports repositories from /src/db only (e.g. `foodLogRepo`, `workoutRepo`, `weightRepo`). It never imports the Drizzle client or a storage engine. There is one Drizzle schema and one set of migrations for all platforms.
- Finding (Expo SDK 57, expo-sqlite 57.x): expo-sqlite web support is marked **alpha** in the docs. It needs `SharedArrayBuffer`, so every response, including the dev server's, must send `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy` (`credentialless` or `require-corp`). It stores data in OPFS with exclusive access handles, so a second tab or window of the app can't open the database at the same time. Also, `credentialless` isn't supported in Safari, and `require-corp` would block cross-origin Open Food Facts product images. **Not treated as production-ready.**
- **Proposed web engine (awaiting owner approval, do not implement yet):** Drizzle's `sql-js` driver (sql.js, SQLite compiled to WASM, in memory). After each write transaction (debounced), the database is saved to IndexedDB, and it is loaded from there on startup. The same migration SQL is applied in the browser by a small shared migrator. The Web Locks API keeps one active tab, and any other tab shows "open in another tab". The app calls `navigator.storage.persist()`. This needs no special hosting headers. New dependency: `sql.js`.
- Alternative (not recommended): hand-written IndexedDB repositories without SQL on web. Every repository would then have two implementations.
- Safari can clear site storage for sites that haven't been used in 7 days and aren't installed. Installed home-screen apps are exempt. So the app encourages installing the PWA and shows the date of the last JSON export in Settings.

### Health on web
- The /src/health web implementation returns status `unavailable` (reason: `platform`). Its reads return `null`, and requesting permissions does nothing.
- Any step UI shows the manual-entry fallback with the note "Automatic step syncing comes with the mobile app." On web, onboarding skips the system permission prompt and shows that note instead. On web, the "add active calories" option and the "write workouts to Health" toggle are hidden.

### Web-specific behaviour (all via /src/platform adapters)
- Haptics: no-op on web.
- Rest timer: timestamp-based. The end time is stored and the remaining time is calculated from the clock, so the timer survives reloads.
  - Native: a local notification.
  - Web: on the first rest timer, show the same explanatory copy, then request Notification permission. When the tab is hidden and the timer ends, notify through the service worker registration.
  - If permission is denied or notifications are unsupported, show the countdown in the tab title ("0:45 · Rest") and restore the title afterwards.
  - Known limitation: mobile browsers suspend or throttle hidden pages. iOS only allows web notifications for installed home-screen apps. So background alerts on phones are best-effort without a push server. They are reliable on desktop, and keep-awake during a workout helps at the gym.
- Keep-awake during an active workout: Screen Wake Lock API on web, re-acquired on `visibilitychange`, silently skipped where unsupported. Native uses expo-keep-awake.
- Gestures are shortcuts only. Every swipe or long-press action has a visible control. Each row has a menu with delete and a warm-up toggle. On web, a delete icon button also appears on hover and focus.
- Full keyboard support:
  - In a set row, Tab moves weight → reps → complete.
  - Enter completes the set and moves focus to the next set's weight.
  - Escape closes sheets and menus.
  - Focus rings are visible (terracotta, 2px).
- Inputs are at least 16px so iOS Safari doesn't zoom when an input is focused. Web gets pointer cursors and subtle hover states.

### Layout
- Mobile-first at 390px wide. On wider screens the app sits in a centred column (max 560px) on the warm background, with the tab bar the same width as the column. No multi-column dashboards; it should still feel like the app. Respect `env(safe-area-inset-*)` in standalone PWA mode.

### PWA
- `public/manifest.webmanifest` with `display: standalone`, `start_url: /`, `background_color` and `theme_color` #F6F1EA. The dark theme colour (#17120F, deep brown-black) is set with `<meta name="theme-color" media="(prefers-color-scheme: dark)">` in `app/+html.tsx`. That file also holds the manifest link, the apple-touch-icon and `viewport-fit=cover`.
- Icons come from a placeholder SVG mark in `assets/brand/`, exported to 192, 512, maskable 512, apple-touch 180 and a favicon.
- A hand-written service worker (no Workbox):
  - Precaches the exported app shell, fonts and WASM so the app opens offline at the gym.
  - Handles Open Food Facts requests network-first, with a cache fallback.
  - Uses a versioned cache that is replaced on each deploy.

### Deployment
- `npx expo export -p web` produces a static site in `dist/`.
- Simplest host: EAS Hosting (`eas deploy`), on the same Expo account as EAS Build, with headers set in the app config. Netlify, Vercel and Cloudflare Pages also work with `dist/`.
- Headers:
  - With the proposed sql.js engine, no special headers are required.
  - If expo-sqlite web is chosen instead, send COOP `same-origin` and COEP on every response.
  - Always serve the service worker with `Cache-Control: no-cache`. HTTPS is required (all hosts above provide it).

### Device testing (after each phase)
- **Phone browser** (iOS Safari and Android Chrome):
  - Layout at phone width and safe areas.
  - Data persists after reload.
  - Barcode scan with the camera.
  - Rest timer while the screen stays on and when switching apps.
  - Wake lock keeps the screen on during a workout.
  - Manual step entry and the "comes with the mobile app" note.
- **Installed PWA** (Add to Home Screen on iOS and Android):
  - Icon, splash and theme colour, in light and dark mode.
  - Standalone mode with no browser chrome.
  - Opens offline.
  - Data is kept between launches and is separate from the browser tab where the platform separates it.
  - Notification permission flow and rest-timer alerts.
- **Desktop browser** (Chrome, Safari, Firefox):
  - Centred column layout.
  - Full keyboard flow in set logging (Tab / Enter / Escape).
  - Delete icon on hover and focus, and the row menu.
  - Tab-title countdown when notifications are denied.
  - A second tab shows "open in another tab".
  - JSON export and import round-trip.
