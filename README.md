# Parkinson Companion

An offline-first companion for logging Parkinson's episodes, medications, wellbeing
and incidents — built to be usable one-handed, in the moment, by a carer or the
person themselves.

Available in five languages (French, English, German, Italian, Spanish — auto-detected
with a manual toggle in Settings) and fully **local**: every bit of data stays on the
device. Nothing is sent anywhere, there is no account, and there is no server.

## What it does

- **Episode timer** — one tap starts it when an episode begins; log the type
  (tremor / involuntary movements / blocked-stiff / unspecified), non-motor symptoms
  (anxiety, fatigue, urinary, brain fog, constipation, dizziness), whether there's pain,
  and who is present. The start time can be corrected backwards (−5 / −15 / −30 min),
  because the carer is usually busy handling the episode when it starts, and an episode
  started by accident can be cancelled without saving anything.
- **Medications** — keep the current medication list with optional dose times (picked with
  a native time control, with autocomplete over common PD drug names); log each dose
  given, at the time it was actually given rather than the time it was typed in. Optional
  local, on-device reminders at each dose time. The report compares episodes before and
  after a treatment change.
- **Dose schedule** — with times set, the home screen shows the next dose due and flags
  overdue ones, and the report works out adherence (doses taken, and how many on time).
- **Next appointment** — an optional date/time, with who and where, shown on the home
  screen and the top of the report as a pre-visit reminder.
- **Wellbeing** — a quick daily check-in (appetite, mood, pain, sleep, weight).
- **Incidents** — falls, near-falls, freezing, choking, with an optional note.
- **Caregiver handover** — short shift-log notes ("what changed", who wrote it, when),
  so the next carer coming on isn't starting cold. Notes older than 30 days are archived
  automatically.
- **Emergency Medical ID (ICE)** — a one-tap, high-contrast card with diagnosis, DBS
  status, allergies, blood type, current medications and emergency contacts, meant to be
  shown to paramedics without unlocking into the rest of the app.
- **Calm & Focus** — three offline tools for the person themselves: guided breathing
  (a circle that grows/shrinks with a haptic pulse at each turn), a metronome for
  rhythm-cueing gait, and synthesized ambient sound (white noise / rain / waves) — plus
  four freezing-of-gait visual cueing patterns (lines, rhythmic flash, footprints,
  checkerboard) the person can pick between. Nothing here is downloaded; every sound and
  pattern is generated on-device.
- **Help screen** — one-tap dial to the partner, the carer, and a **configurable
  emergency number** (defaults to 112; set 15 / 911 / 999 / etc. for your country).
- **Report** — filterable to the last 7 / 30 / 90 days or the whole history, with a trend
  chart marking treatment changes, daily episode burden, adherence, and time-of-day
  distribution. Printable to a clean one-page PDF for the patient's file, and exportable
  as CSV.
- **Backup and restore** — a full JSON backup you can save off the device and restore
  later. See *Data safety* below.

## Settings you configure

Names (person, partner, carer), their phone numbers, the emergency number, the
medication list and dose times, the diagnosis/DBS/allergies/blood type shown on the ICE
card, the infusion-pouch stock, and the interface language. Nothing is hard-coded to any
individual.

## Data safety

All data lives in the browser's `localStorage` on the one device. That means it can be
lost — by changing phone, reinstalling, or clearing website data — and on iOS, storage
for a site opened in a **Safari tab** can be evicted after about a week without use.
Installing to the Home Screen avoids that eviction, and the app also asks the browser to
mark its storage persistent, but neither is a substitute for a backup.

So: **install it to the Home Screen, and save a backup regularly** (Settings → Data
backup) keeping the file somewhere else. The home screen nags if there has been no
backup for two weeks. The CSV export is a report for the doctor, not a backup — it
cannot be read back in; the JSON backup can.

## What it deliberately does not do

It is a tracking diary. It does not diagnose, advise, or replace a clinician or the
emergency services. It also does **not** monitor the person: it cannot detect a fall or
raise an alarm by itself — use the iPhone's or Apple Watch's own fall detection for that.
The one exception is medication reminders: on the native iOS/Android builds, a dose
reminder is a local, on-device notification scheduled ahead of time, so it can still fire
while the app itself isn't open — nothing is sent anywhere to make that happen.

## Tests

```bash
npm ci && npx playwright install webkit chromium && npm test
```

End-to-end tests cover the paths where a silent failure would cost clinical data.
They run on WebKit (what iPhones use) and Chromium (what the Android TWA uses) on
every push — see [`tests/README.md`](tests/README.md).

## Publishing to the app stores

The store assets, listing copy in both languages, the exact answers for Google's
Data safety / Health apps forms and Apple's privacy questionnaire, and the regulatory
position are in [`store/`](store/) — start with [`store/README.md`](store/README.md).
The generated `fastlane/metadata/` listing text is derived from `store/listing-*.md`;
run `npm run metadata` after editing those (`npm run metadata:check` is what CI enforces).

Short version: the web app is wrapped in a native [Capacitor](https://capacitorjs.com)
project (`ios/`, `android/`) for a few things a PWA can't do on its own — local
medication-reminder notifications, haptics for guided breathing, and (on iOS) a native
print bridge, since `window.print()` is inert inside a WKWebView. iOS builds via `xcodebuild`
on a GitHub Actions macOS runner and ships through TestFlight
(`.github/workflows/ios-testflight.yml`); Android builds the same way via Gradle
(`.github/workflows/android-play.yml`) for the Play Store. The privacy policy at [`privacy.html`](privacy.html)
must be publicly reachable before either store will accept a submission.

## Tech

A single static `index.html` (no build step, ES5-level JavaScript) plus a service
worker for full offline use. No network requests, no analytics, no third-party code of
any kind beyond the two native Capacitor plugins above. Installable as a PWA and
deployed on Cloudflare Pages at **parkinson.red-triangle.net**; also ships as a native
app for iOS (TestFlight/App Store) and Android (Play Store) via the Capacitor wrapper.

© Red Triangle. All rights reserved.
