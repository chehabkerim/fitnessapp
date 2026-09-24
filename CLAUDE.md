# Plus Ultra — Fitness Tracker (iOS + Android)

## Product
"Plus Ultra" is a personal fitness tracker for calories/food, steps, workouts, and body weight. Steps and active energy are read automatically from Apple Health (iOS) and Health Connect (Android). Single user, local-first, no accounts or backend in v1. It should feel like a calm, premium editorial product, not a gamified gym app.
- Name: "Plus Ultra" is used in app.config (name), the web manifest (`name` and `short_name`), the HTML `<title>`, the splash screen and Settings → About. The name is the only reference: no My Hero Academia artwork, characters, logos, fonts or colour schemes.
- PR moment: when a set breaks a personal record, a small "Plus Ultra" label in Fraunces italic appears on its own line under the set row's inputs, right-aligned, with a 200ms fade-in and a light haptic. It's terracotta, using #B0532F in light mode for small-text contrast. On the finish summary, the PR section is headed "Plus Ultra". The phrase appears nowhere else.

## Tech stack
- Expo (latest stable SDK) + TypeScript (strict), Expo Router for navigation
- Web target via react-native-web with Expo Router static output (`web.output: "static"`). Web is the primary test target for Phase 1 (see "Web first" below); iOS and Android build from the same codebase.
- Phases 1–4 run in Expo Go on a phone (no custom native modules). From Phase 5, development builds via EAS Build (expo-dev-client) are required because of the native health modules.
- iOS health (Phase 5): @kingstinct/react-native-healthkit (with its Expo config plugin). v16 also needs react-native-nitro-modules as a peer dependency.
- Android health (Phase 5): react-native-health-connect v4, using its own config plugin. `expo-health-connect` is deprecated and was merged into it, so don't install it.
- Wrap both behind one shared interface in /src/health (e.g. getSteps(date), getStepsRange(start, end), getActiveEnergy(date), requestPermissions(), getPermissionStatus()) so the rest of the app never touches platform-specific code
- Local storage: Drizzle ORM over SQLite, behind a repository layer in /src/db. Native uses expo-sqlite; web uses sql.js with IndexedDB persistence (see "Web first → Storage").
- Charts: Phase 1 uses thin line charts drawn with react-native-svg. victory-native (Skia) is revisited in Phase 4; on web, Skia loads CanvasKit, a 7.2 MB wasm file (2.9 MB gzipped).
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
5. Workouts: a hand-authored exercise library (see "Exercise library"), log sets × reps × weight, templates, rest timer (with haptics and a local notification if backgrounded), personal records per exercise, estimated calories burned. Optionally write completed workouts to Apple Health / Health Connect (user toggle).
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
- Dark mode with the same warm character: background #1A1512 (deep brown-black, not pure black), ink #F2E9DE, accent #D9774F (terracotta lightened to 5.8:1 on the background).
- Contrast: #C4623F on #F6F1EA is 3.6:1, and white on #C4623F is 4.1:1. Both pass for large text and graphics but fail AA for normal-size text. Use #C4623F for fills, rings and large numerals. Button backgrounds and small terracotta text in light mode use the deeper #B0532F (5.1:1 with white text).
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

## Commands
- `npm install`: also copies the sql.js WASM into `public/` (postinstall).
- `npm run web`: dev server. `npm start`: Expo Go (scan the QR code on your phone).
- `npm run typecheck`, `npm test` (Jest), `npm run lint`.
- `npm run build:web`: static export to `dist/` plus the generated service worker (`dist/sw.js`).
- `npm run test:e2e`: Playwright against `dist/` (build first). Set `PW_CHROMIUM_PATH` to use a preinstalled Chromium.
- `npm run db:generate`: new Drizzle migration after a schema change (both engines use it).
- Package installs in this environment: `EXPO_OFFLINE=1 npx expo install <pkg>` (the Expo version API is blocked here).

## Implementation notes (Phase 1)
- Routes live in `/app`. Records are addressed with query params (`/workouts/exercise?id=3`), not `[id]` segments, so the static export works on any static host and offline without rewrite rules.
- Tabs use Expo Router's headless tabs (`expo-router/ui`) so the minimised-workout bar can sit above a custom tab bar.
- Live data: `useLive(selector, deps)` re-runs synchronous repository reads after every write; `useRepos()` for event handlers.
- Web accessibility state uses RN's `aria-*` props (`aria-checked`, `aria-selected`); `accessibilityState` alone doesn't reach the DOM in react-native-web. Elements that must be skipped by Tab use `tabIndex={-1}`.

## Roadmap
- **Phase 1:** foundation + workouts (web-first, phone-first). Other tabs are styled placeholders.
- **Phase 2:** onboarding + calorie target + body weight.
- **Phase 3:** food log (Open Food Facts search, barcode scanning, custom foods).
- **Phase 4:** Today dashboard + progress charts.
- **Phase 5:** native iOS/Android builds + Apple Health / Health Connect steps and workout write-back.

## Exercise library
- Hand-authored. The app ships no third-party exercise data, illustrations or photos. You can add custom exercises in the app.
- Seeded once from /src/db/seed, gated by `app_state.seed_version`, so a seeded template or exercise you delete stays deleted. There are 12 exercises and two editable, deletable templates:
  - **Back & Chest:** Incline Dumbbell Bench Press, Flat Chest Press, Lat Pulldown, Close Grip Row, Upper Back Row.
  - **Arms:** Tricep Pushdown, Weighted Dips, Lateral Raise, Shoulder Press, Hammer Curl, Preacher Curl, Bicep Curl.
  - Every template exercise is 3 sets × 8–12 reps.
- Exercise fields:
  - `primary_muscles` / `secondary_muscles`: JSON arrays of MuscleMap region keys.
  - `equipment`: dumbbell, machine, cable, ez_bar, bodyweight, barbell, kettlebell or other.
  - `log_type`: weight_reps, reps, bodyweight_added or duration. With `bodyweight_added`, reps are required and the weight input is optional and labelled "added".
  - `load_mode`: total or per_dumbbell. With per_dumbbell, the input is labelled "kg each" / "lb each", volume counts the weight ×2, and PRs show the weight as entered ("22.5 kg each").
  - Also `default_rest_sec`, `cues` (JSON array of short lines) and `photo_id`.
- Rest time priority: `workout_exercises.rest_sec` → `template_exercises.rest_sec` → `exercises.default_rest_sec` → `settings.default_rest_sec`. The template value is copied into the workout exercise when a workout starts from a template.
- Library grouping is derived, not stored. Exercises are grouped under the templates they belong to, in template order, plus "My exercises" for those in no template. There are no muscle or equipment filter chips.
- Visuals: every exercise visual goes through `getExerciseVisual(exercise, size)` in /src/lib/media, in this order:
  1. Your own photo.
  2. An illustration (the mapping is empty for now).
  3. The MuscleMap.
- Muscle figure (/src/components/MuscleMap):
  - Original drawing; the design source is in /design/muscle-figure. The earlier outline figure is archived in /design/archive.
  - Style: in the tradition of a classic gym muscle chart, but drawn from scratch.
    - A solid filled silhouette with heroic but anatomically plausible proportions: broad shoulders, a clear V-taper, thick arms.
    - Muscles are separated only by thin gaps in the background colour. There are no outlines and no face details; the head is a simple solid shape.
    - The abs have only two simple separations, drawn at large size only.
  - Colours, light: body #E4D9CB, primary #C4623F, secondary #D19277 (40% of the way towards sand).
  - Colours, dark: body #3B312A, primary #D9774F, secondary #A15E45.
  - Gap colour: always the colour of the surface the figure sits on.
  - Separately fillable regions: upper_chest, chest, front_delts, side_delts, rear_delts, traps, upper_back, lats, biceps (brachialis shares it), triceps, forearms.
    - Lats are two wings either side of the spine, tapering towards the waist; the lower back between them stays body colour.
    - The front view shows the lateral head of the triceps as a thin outer strip.
  - Every other area is body shape only. The keys abs, obliques, lower_back, glutes, quads, hamstrings and calves stay valid for custom exercises but aren't highlighted yet.
  - Views: front and back.
  - Small size (56px library, 44px workout cards):
    - A square crop from chin to belt, so the torso and arms fill the tile's width and the head is mostly out of frame.
    - No internal separations except the gaps around filled regions.
    - View choice: score = 2 × primary + secondary regions visible in that view. Partly visible regions (the front triceps strip) count half, and ties go to front.
  - Large size (detail screen): full front and back side by side.
- Equipment glyphs: geometric, at most 4 strokes, 1.5px stroke at every size, readable at 20px. There are glyphs for dumbbell, cable, machine and kettlebell. Bodyweight, barbell, EZ bar and Other are text only; the barbell and EZ bar glyphs were dropped because they aren't readable at 20px.
- Photos:
  - Never store image data in SQLite. On web the photos live in a separate IndexedDB store; on native, in the file system. Both are keyed by `photo_id`.
  - Each photo is kept at two sizes: a thumbnail (~160px) and a detail image (~800px wide). WebP where the browser can encode it; Safari can't, so it falls back to JPEG.
  - JSON export and import include photos as base64.
  - A photo replaces the MuscleMap as the thumbnail. The detail screen shows the photo with the MuscleMap beneath it.
  - Native photo capture needs expo-image-picker and expo-image-manipulator, so it is deferred to Phase 5.

## Web first
Phases 1–4 are built, used and tested as a website first. iOS and Android must still type-check, compile and run from the same codebase.

### Storage (decided)
- Feature code imports repositories from /src/db only (e.g. `workoutRepo`, `exerciseRepo`, `settingsRepo`). It never imports the Drizzle client or a storage engine.
- Engines: native uses `drizzle-orm/expo-sqlite`; web uses `drizzle-orm/sql-js` (sql.js, SQLite compiled to WASM, in memory) with persistence to IndexedDB. The client is chosen by `client.native.ts` / `client.web.ts`.
- Why not expo-sqlite on web: on SDK 57 its web support is marked **alpha**. It needs COOP/COEP headers for `SharedArrayBuffer`, and it keeps an exclusive OPFS lock, so only one tab can open the database. Safari lacks COEP `credentialless`, and `require-corp` would block Open Food Facts images.
- One schema and one set of migrations for both engines:
  - `drizzle-kit generate` (driver `expo`) produces `drizzle/migrations.js`. It is bundled on both platforms (`.sql` inlined with babel-plugin-inline-import).
  - A small shared migrator in /src/db/migrate.ts calls `dialect.migrate`. This is exactly what Drizzle's Expo migrator does, minus its React hook.
  - Verified with drizzle-orm 0.45.3 and sql.js 1.14.2. Migrations are idempotent, incremental migrations apply to a restored database, and export → re-import round-trips.
- Use the core query builder only (`select`/`insert`/`update`/`delete`, joins, `returning`). **Do not use the relational `db.query` API.** In drizzle-orm 0.45.3 the sql-js session drops the relational result mapper, so `db.query` returns unmapped rows on web. The client is created without the `schema` option, so `db.query` can't be used by mistake.
- SQLite: run `PRAGMA foreign_keys = ON` on every open. Bundled versions are 3.49+ on both engines. Timestamps are stored as integer epoch ms, dates as `YYYY-MM-DD` text, and weights in kg (converted for display).
- The sql.js WASM (`sql.js/dist/sql-wasm-browser.wasm`) is bundled with the app as a local asset and precached by the service worker. No CDN.
- Web persistence rules (never lose a logged set):
  - Every repository write marks the database dirty. A set change saves with a short trailing debounce (≤ 250ms, max wait 1s).
  - Force an immediate save on `visibilitychange` → hidden and on `pagehide`. iOS can kill a backgrounded page without warning.
  - A save exports the database and writes it to IndexedDB in one transaction, then waits for `complete`.
  - On startup, load from IndexedDB, then run migrations and seed.
- Web Locks API: one tab owns the database. Another tab shows "open in another tab" with a "Use here instead" action; the tab that loses the lock stops writing and shows the same screen.
- Call `navigator.storage.persist()` after the first workout is saved. Record it in `app_state`.
- Safari can clear storage for sites that haven't been used in 7 days and aren't installed; installed home-screen apps are exempt. So:
  - Settings shows an install prompt (Android: `beforeinstallprompt`; iOS: Share → Add to Home Screen instructions) and the date of the last JSON export.
  - After the third finished workout, show a gentle nudge once, only if the app isn't running standalone and there has been no export in the last 14 days.

### Health on web
- The /src/health web implementation returns status `unavailable` (reason: `platform`). Its reads return `null`, and requesting permissions does nothing.
- Any step UI shows the manual-entry fallback with the note "Automatic step syncing comes with the mobile app." On web, onboarding skips the system permission prompt and shows that note instead. On web, the "add active calories" option and the "write workouts to Health" toggle are hidden.

### Web-specific behaviour (all via /src/platform adapters)
- Haptics: no-op on web.
- Rest timer: timestamp-based. The end time is stored and the remaining time is calculated from the clock, so the timer survives reloads.
  - Native: a local notification.
  - Web: on the first rest timer, show the same explanatory copy, then request Notification permission. When the tab is hidden and the timer ends, notify through the service worker registration.
  - If permission is denied or notifications are unsupported, show the countdown in the tab title ("0:45 · Rest") and restore the title afterwards.
  - When the timer ends in the foreground, call `navigator.vibrate` where supported (Android; iPhone web apps can't vibrate). If the Settings toggle "Rest timer sound" is on (off by default), also play a short soft tone generated with Web Audio. The audio context is unlocked on the tap that starts the rest.
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
- `public/manifest.webmanifest` with `display: standalone`, `start_url: /`, `background_color` and `theme_color` #F6F1EA. The dark theme colour (#1A1512) is set with `<meta name="theme-color" media="(prefers-color-scheme: dark)">` in `app/+html.tsx`. That file also holds the manifest link, the apple-touch-icon and `viewport-fit=cover`.
- Icons come from a placeholder SVG mark in `assets/brand/`, exported to 192, 512, maskable 512, apple-touch 180 and a favicon.
- A hand-written service worker (no Workbox):
  - Precaches the exported app shell, fonts and WASM so the app opens offline at the gym.
  - Handles Open Food Facts requests network-first, with a cache fallback.
  - Uses a versioned cache that is replaced on each deploy.

### Deployment
- `npx expo export -p web` produces a static site in `dist/`.
- Simplest host: EAS Hosting (`npx eas-cli@latest deploy` after `npm run build:web`). Netlify and Cloudflare Pages use `public/_headers`; Vercel uses `vercel.json`. All serve `dist/` with no rewrites.
- Headers: sql.js needs no COOP/COEP headers. Serve the service worker with `Cache-Control: no-cache`. HTTPS is required (all hosts above provide it).

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
  - Kill test: log a set, immediately swipe the app away in the app switcher, reopen, and confirm the set is there. Repeat while typing in a set.
  - Android: vibration when rest ends in the foreground.
- **Desktop browser** (Chrome, Safari, Firefox):
  - Centred column layout.
  - Full keyboard flow in set logging (Tab / Enter / Escape).
  - Delete icon on hover and focus, and the row menu.
  - Tab-title countdown when notifications are denied.
  - Rest-end tone when enabled in Settings, and silence when it's off.
  - Exercise photo: add one, check it replaces the thumbnail, then confirm it survives export → reset → import.
  - A second tab shows "open in another tab".
  - JSON export and import round-trip.
