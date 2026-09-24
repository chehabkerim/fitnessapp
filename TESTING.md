# Testing Plus Ultra on your phone

## Before you start

1. `npm run build:web`, then deploy `dist/` (for example `npx eas-cli@latest deploy`), or serve it on your network over HTTPS.
2. Open the site in **iOS Safari** and **Android Chrome**. Later, repeat the checks as an installed app (Share → Add to Home Screen on iOS, Install app on Android).
3. A fresh install starts in **dark** mode. Switch to light mode in Settings → Appearance and repeat the visual checks.

Compare what you see with `design/ignite/reference/` (the mockups) and `design/ignite/built/` (the same screens rendered from this build).

## Ignite redesign

### Train tab
- [ ] The bottom tabs are Train, History, Exercises and Settings. There are no Today, Food or Progress tabs.
- [ ] The date line shows today and the "this week" count updates after you finish a workout.
- [ ] The Up next card shows the template you did least recently. After you finish it, the other template moves up.
- [ ] Start workout on the purple button: the "START WORKOUT" text has a thin black outline and is easy to read in sunlight.
- [ ] The two stat cards (lifted this week, sets this week) change after a workout.

### Active workout (focus mode)
- [ ] One exercise at a time. Swipe left and right to move between exercises. The dashes at the top also jump when tapped.
- [ ] "Exercise 1 of 5" opens the All exercises sheet: jump, reorder, remove, add, notes, discard workout.
- [ ] Tap the big weight number: the in-app keypad opens and the system keyboard doesn't.
  - [ ] Type fast (e.g. 2, 7, ., 5): no key is lost.
  - [ ] The ± chips change the value by the right step (kg: 2.5 / 5; lb: 5 / 10; reps: 1).
  - [ ] "Reps →" switches field; Done closes it.
- [ ] "Previous" copies last session's values into the set.
- [ ] Complete set: a strong buzz (Android; iPhone web can't vibrate), a spring on the tick, and the rest timer appears at the bottom.
- [ ] Rest panel: −15s / +15s / Skip work, and the bar drains. "Next: set N · …" names the set you're about to do.
- [ ] Beat your best weight: the purple PLUS ULTRA banner slides in, and the set row gets a green PR tag.
- [ ] Tap a done set's tick to un-complete it. The ⋯ button opens the warm-up toggle and delete.
- [ ] Minimise (chevron, top left): the workout bar appears above the tabs; tap it to come back.
- [ ] Finish: the "Workout complete" screen shows duration, volume, sets and a "Plus Ultra" records card.

### History, Exercises, Settings
- [ ] History groups workouts by week. Repeat starts a new workout with the same exercises. Tapping a card opens its detail.
- [ ] Exercises lists the exercises under Back & Chest, Arms and My exercises. "Edit template" edits a template; "New template" and "New exercise" create them.
- [ ] Exercise detail shows the muscle figure (green in both themes), cues and "Add your own photo".
- [ ] Settings: the selected option in each segmented control has a green border. The toggles are visible when off.

### Both themes
- [ ] Dark: near-black background, neon green accent, no greyish text that's hard to read.
- [ ] Light: white cards with a green 2px border; small green text is the darker green.
- [ ] The installed app's status bar and splash are dark (#0E0E10).

## Still required from earlier phases

- [ ] Kill test: log a set, immediately swipe the app away in the app switcher, reopen: the set is there. Repeat while typing in a set with the keypad.
- [ ] Data persists after reload and between launches of the installed app.
- [ ] The screen stays on during a workout (wake lock).
- [ ] Rest timer while the screen stays on, and when switching apps (installed app: notification; otherwise the tab-title countdown).
- [ ] Android: vibration when rest ends in the foreground.
- [ ] Opens offline once installed.

## Desktop (Chrome, Safari, Firefox)

- [ ] The centred column is at most 560px wide.
- [ ] Keyboard: type in the weight box, Tab → reps, Tab → Complete set, Enter completes the set and moves to the next set's weight. Escape closes sheets.
- [ ] Hovering a set row shows the delete icon.
- [ ] A second tab shows "open in another tab".
- [ ] Settings → Data: export → reset → import restores everything, including exercise photos.
