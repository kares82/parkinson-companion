# Parkinson Companion

An offline-first companion for logging Parkinson's episodes, medications, wellbeing
and incidents — built to be usable one-handed, in the moment, by a carer or the
person themselves.

Bilingual (English / French, auto-detected with a manual toggle in Settings) and
fully **local**: every bit of data stays in the browser on the device. Nothing is
sent anywhere, there is no account, and there is no server.

## What it does

- **Episode timer** — one tap starts it when an episode begins; log the type
  (tremor / involuntary movements / unspecified), whether there's pain, and who is present.
  The start time can be corrected backwards (−5 / −15 / −30 min), because the carer is
  usually busy handling the episode when it starts, and an episode started by accident
  can be cancelled without saving anything.
- **Medications** — keep the current medication list with optional dose times; log each
  dose given, at the time it was actually given rather than the time it was typed in.
  The report compares episodes before and after a treatment change.
- **Dose schedule** — with times set, the home screen shows the next dose due and flags
  overdue ones, and the report works out adherence (doses taken, and how many on time).
- **Wellbeing** — a quick daily check-in (appetite, mood, pain, sleep, weight).
- **Incidents** — falls, near-falls, freezing, choking, with an optional note.
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
medication list and dose times, the infusion-pouch stock, and the interface language.
Nothing is hard-coded to any individual.

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
emergency services. It also does **not** monitor the person: being a web app it cannot
run in the background, detect a fall, or raise an alarm by itself — use the iPhone's or
Apple Watch's own fall detection for that.

## Tech

A single static `index.html` (no build step, ES5-level JavaScript) plus a service
worker for full offline use. Installable as a PWA. Deployed on Cloudflare Pages at
**parkinson.red-triangle.net**.

© Red Triangle. All rights reserved.
