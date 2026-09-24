# [APP NAME] — Fitness Tracker (iOS + Android)

## Product
A personal fitness tracker for calories/food, steps, workouts, and body weight. Steps and active energy are read automatically from Apple Health (iOS) and Health Connect (Android). Single user, local-first, no accounts or backend in v1. It should feel like a calm, premium editorial product, not a gamified gym app.

## Tech stack
- Expo (latest stable SDK) + TypeScript (strict), Expo Router for navigation
- Development builds via EAS Build (expo-dev-client). This app will NOT run in Expo Go because of native health modules.
- iOS health: @kingstinct/react-native-healthkit (with its Expo config plugin)
- Android health: react-native-health-connect + expo-health-connect config plugin
- Wrap both behind one shared interface in /src/health (e.g. getSteps(date), getStepsRange(start, end), getActiveEnergy(date), requestPermissions(), getPermissionStatus()) so the rest of the app never touches platform-specific code
- Local storage: expo-sqlite with Drizzle ORM
- Charts: victory-native (Skia-based)
- Fonts: @expo-google-fonts/fraunces and @expo-google-fonts/inter
- Barcode scanning: expo-camera
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
- Health integration has a mock implementation used when running tests or when native modules are unavailable, so UI can be developed without a device.
- Store dates as ISO local-date strings (YYYY-MM-DD).
- Every screen has empty, loading, error, and permission-denied states where relevant.
- Accessible: labels, 44pt tap targets, WCAG AA contrast.
- After each phase: run type-check and tests, fix all errors, then summarise what was built and exactly what I should test on a real device.
