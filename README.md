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
- **Medications** — keep the current medication list; log each dose given. The report
  compares episodes before and after a treatment change.
- **Wellbeing** — a quick daily check-in (appetite, mood, pain, sleep, weight).
- **Incidents** — falls, near-falls, freezing, choking, with an optional note.
- **Help screen** — one-tap dial to the partner, the carer, and a **configurable
  emergency number** (defaults to 112; set 15 / 911 / 999 / etc. for your country).
- **Report + CSV export** — a summary to hand to the doctor, exportable as CSV.

## Settings you configure

Names (person, partner, carer), their phone numbers, the emergency number, the
medication list, the infusion-pouch stock, and the interface language. Nothing is
hard-coded to any individual.

## Tech

A single static `index.html` (no build step, ES5-level JavaScript) plus a service
worker for full offline use. Installable as a PWA. Deployed on Cloudflare Pages at
**parkinson.red-triangle.net**.

© Red Triangle. All rights reserved.
