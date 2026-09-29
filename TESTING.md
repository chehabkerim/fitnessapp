# Testing Plus Ultra on your phone

## Before you start

1. `npm run build:web`, then deploy `dist/` (for example `npx eas-cli@latest deploy`), or serve it on your network over HTTPS.
2. Open the site in **iOS Safari** and **Android Chrome**. Later, repeat the checks as an installed app (Share → Add to Home Screen on iOS, Install app on Android).
3. The app is always dark. Try it once with your phone in light mode too: nothing should change.

Compare what you see with `design/plus-ultra/reference/` (the approved screens) and `design/plus-ultra/built/` (the same screens rendered from this build, in every scheme).

## Stage 1: design system, colour schemes and screens

### Brand
- [ ] The installed app's icon is the purple square with the white "U" and green "LTRA". It's the same whichever scheme you pick.
- [ ] While the app opens you briefly see the "PLUS ULTRA" wordmark. Settings → About shows it too, with "LTRA" in your scheme's colour.
- [ ] Purple appears nowhere else in the app: buttons, banners and highlights all use the scheme colour.

### Train tab
- [ ] The bottom tabs are Train, History, Exercises and Settings, with the active one in the scheme colour. There are no Today, Food or Progress tabs.
- [ ] The date line shows today, and "N THIS WEEK" updates after you finish a workout.
- [ ] With a workout in progress, a Resume card sits at the top.
- [ ] The Up next card shows the template you did least recently, with a full-width START WORKOUT button filled in the scheme colour. The other template has an outlined START.
- [ ] The two stat cards (kg lifted this week, sets this week) change after a workout.

### Active workout (focus mode)
- [ ] One exercise at a time. Swipe left and right to move between exercises; the dashes at the top also jump when tapped.
- [ ] "Exercise 1 of 5" opens the All exercises sheet: jump, reorder, remove, add, notes, discard workout.
- [ ] Tap the big weight number: the in-app keypad opens and the system keyboard doesn't.
  - [ ] Type fast (e.g. 2, 7, ., 5): no key is lost.
  - [ ] The ± chips change the value by the right step (kg: 2.5 / 5; lb: 5 / 10; reps: 1).
  - [ ] "Reps →" switches field; DONE (filled) closes it.
- [ ] "Previous" copies last session's values into the set.
- [ ] Complete set (the big filled button at the bottom): a strong buzz (Android; iPhone web can't vibrate), a spring on the tick, and the rest panel replaces the button.
- [ ] Rest panel: −15s / +15s / Skip work, and the bar drains. "Next: set N · …" names the set you're about to do.
- [ ] After an exercise's last set, the next exercise appears on its own once rest ends (or when you Skip).
- [ ] Beat your best weight: the PLUS ULTRA banner slides in, filled in the scheme colour with dark (or, for dark accents, white) text, and the set row gets a PR tag.
- [ ] Tap a done set's tick to un-complete it. The ⋯ button opens the warm-up toggle and delete.
- [ ] Minimise (chevron, top left): the workout bar appears above the tabs; tap it to come back.
- [ ] Finish: the "Workout complete" screen shows duration, volume, sets and the PLUS ULTRA records card, then an outlined SAVE AS TEMPLATE and a filled DONE.

### History, Exercises, Settings
- [ ] History groups workouts by week. Repeat starts a new workout with the same exercises. Tapping a card opens its detail.
- [ ] Exercises lists the exercises under Back & Chest, Arms and My exercises. "Edit template" edits a template; "New template" and "New exercise" create them.
- [ ] Exercise detail shows the muscle figure in the scheme colour, the cues and "Add your own photo".

### Colour schemes (Settings → Appearance)
- [ ] Four cards in a 3-column grid: Neon, Volt, Mono, Coral. Each previews its background, a card with an accent dot and bar, and an accent button. Ultraviolet isn't there yet (it unlocks in stage 3).
- [ ] The selected card has a thick border in its colour, a check and "SELECTED". Below the grid: "Plus Ultra is dark by design, so your colour always pops."
- [ ] Tapping a card recolours the whole app at once, with no reload.
- [ ] **Switch schemes mid-workout:** start a workout, log a set, minimise, change the scheme, resume. Everything (ticks, NOW outline, keypad, rest bar, banner) follows the new colour and the logged set is still there.
- [ ] In every scheme, all text is easy to read, including small accent text like "SET 2 OF 3", NOW and "+ Add set". Mono uses white highlights with dark text on the buttons.
- [ ] The browser toolbar or installed app's status bar follows the scheme's background.
- [ ] The scheme survives a reload and is included in Settings → Data export and import.
- [ ] With VoiceOver or TalkBack, the cards read as "Volt colour scheme, selected" and so on.

## Stage 2: badges

- [ ] **Existing log:** the first time you open this version, Train shows "You've already earned N badges" once. "See your badges" opens the case; the × dismisses it for good.
- [ ] **New user:** with no workouts, Train's Next badge card shows First Rep, and the badge case says to finish your first workout.
- [ ] **Earn a badge:** finish a workout. Below the PLUS ULTRA records, "BADGES EARNED" reveals each new badge one after another, each with a shine across the emblem (and a buzz on Android). Revisiting that summary later shows them without the animation.
- [ ] Nothing is awarded mid-set: completing sets never shows a badge; only finishing does.
- [ ] Badge case (Train's Next badge card, History → Badges, or "See all badges" on Workout complete): "N / 26 EARNED", grouped by category, earned first, locked ones with a progress bar like "37 / 50".
- [ ] Badge detail: the large emblem inside a ring, "BRONZE · TIER I", what you've done ("12 workouts finished · Earned 3 Oct"), the bar to the next badge ("3 more workouts to Quarter Century"), the category ladder (tap to switch), and the workout that earned it (tap to open).
- [ ] Emblems look sharp both small (list) and large (detail): bronze, silver, gold and diamond rims, stars, and the grey locked style.
- [ ] Early Riser / Night Shift count by the time you finish (before 08:00 / from 21:00).
- [ ] No Set Left Behind: finish a template workout with every planned set ticked. Skipping a set (finish and discard it) doesn't count.
- [ ] Delete the workout that earned a badge: the badge stays. Settings → Data → Reset all data removes all badges.
- [ ] Export → reset → import: your badges come back.
- [ ] With VoiceOver or TalkBack, emblems read like "Ten Down badge, bronze, locked, 3 of 10 workouts". With Reduce Motion on, there's no shine.

## Still required from earlier phases

- [ ] Kill test: log a set, immediately swipe the app away in the app switcher, reopen: the set is there. Repeat while typing in a set with the keypad.
- [ ] Log a set and immediately pull to refresh (or close the tab and reopen it): the set is still there.
- [ ] Data persists after reload and between launches of the installed app.
- [ ] The screen stays on during a workout (wake lock).
- [ ] Rest timer while the screen stays on, and when switching apps (installed app: notification; otherwise the tab-title countdown).
- [ ] Android: vibration when rest ends in the foreground.
- [ ] Opens offline once installed.

## Desktop (Chrome, Safari, Firefox)

- [ ] The centred column is at most 560px wide.
- [ ] Keyboard: type in the weight box, Tab → reps, Tab → Complete set, Enter completes the set and moves to the next set's weight. Escape closes sheets. ← / → move between exercises (when you're not typing in a box).
- [ ] Hovering a set row shows the delete icon.
- [ ] A second tab shows "open in another tab".
- [ ] Settings → Data: export → reset → import restores everything, including exercise photos.
