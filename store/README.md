# Submission playbook

Everything here is preparation for wrapping the PWA. **You cannot upload
`index.html` to either store** — it has to be packaged as a native app.

| | Google Play | Apple App Store |
|---|---|---|
| Wrapper | Capacitor | Capacitor |
| Built by | `.github/workflows/android-play.yml` (ubuntu runner) | `.github/workflows/ios-testflight.yml` (macOS runner) |
| Needs a Mac | no | **no** — GitHub's macOS runners |
| Main risk | none significant | Guideline 4.2 rejection |

Both platforms are one Capacitor project with `ios/` and `android/` committed,
following the setup already proven on OLI. An earlier draft used a Trusted Web
Activity for Android; that is gone. Two different Android wrappers meant two
sets of behaviour to reason about, and the TWA needed `assetlinks.json` hosting
that is one more thing to get wrong.

Order to do this in: **Play first.** It is the easier path, it validates the
listing copy and the declarations, and it gets the app in front of the GP's
patients while you deal with Apple.

---

## 1. Before either store

- [ ] Deploy the current build (including `privacy.html`) to
      `parkinson.red-triangle.net`.
- [ ] Confirm `https://parkinson.red-triangle.net/privacy.html` loads publicly.
      **A missing privacy policy URL is an automatic rejection on both stores.**
- [ ] Take screenshots (below).

### Icon

The icon is a stylised tulip — the international symbol of Parkinson's disease —
in white on the app's red (`#c0392b`). It is drawn from scratch in
`tools/make-icons.py`, not traced from any charity's logo: Parkinson's UK, the
EPDA and others each hold trademarks on their own tulip marks. It deliberately
avoids a red cross, which is a protected emblem under the Geneva Conventions and
must never appear on a commercial app.

It replaces the previous white "S", which came from the personal build for
Sylvie and would have meant nothing to other users.

| File | Purpose |
|---|---|
| `icon-192.png`, `icon-512.png` | PWA, `purpose: any`. Rounded square with alpha. |
| `icon-maskable-512.png` | Android adaptive icon. Full-bleed red, artwork inside the 80% safe zone. Declaring one edge-to-edge asset as `any maskable` (as before) lets the adaptive mask slice its corners off. |
| `icon-1024.png` | App Store. 1024×1024, **no alpha**, square corners — Apple rejects transparency and applies its own rounding. |
| inline `apple-touch-icon` in `index.html` | 180×180, kept in sync. |

Regenerate every size at native resolution with:

```bash
python3 tools/make-icons.py
```

Verified legible down to 48px, and inside the circular adaptive-icon crop.

### Screenshots

**Already generated** into `fastlane/screenshots/{en-US,fr-FR}/` at 1290×2796 —
real captures of the running app with two months of plausible history, five
shots per language. Regenerate after any UI change:

```bash
python3 -m http.server 8099 &
node tools/make-screenshots.js
```

They are deliberately unannotated: overlaid marketing text on a health app
screenshot is where clinical claims creep in. See `regulatory.md`.

---

## 2. Google Play (Capacitor)

Built by `.github/workflows/android-play.yml`: `node tools/build-www.js && npx cap
sync android`, then Gradle (`./gradlew bundleRelease`) produces the `.aab` Play
takes. Signing needs four repo secrets set once — `ANDROID_KEYSTORE_BASE64`,
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` — from
an upload keystore (`keytool -genkeypair ... -keystore upload.jks`, kept safe:
losing it takes a support request to recover). Without those secrets the
workflow still builds an *unsigned* bundle, which proves the project compiles
but Play will refuse to accept.

Then:

- [ ] Download the signed `app-release.aab` artifact from the workflow run and
      upload it in Play Console.
- [ ] Fill the Data safety form and Health apps declaration → `declarations.md`.
- [ ] Listing copy → `listing-en.md`, `listing-fr.md` (`npm run metadata`
      regenerates `fastlane/metadata/` from these; `npm run metadata:check` is
      what CI enforces on every push).

Downloads, printing and storage all work the same as the web app — this is a
real WebView wrapper around the same `index.html`, not a separate rebuild.

---

## 3. Apple App Store

Full checklist: **[`APPSTORE.md`](APPSTORE.md)**. Pricing: **free** — see
[`pricing.md`](pricing.md). Built and shipped entirely from
`.github/workflows/ios-testflight.yml` on a GitHub Actions macOS runner —
**no local Mac needed**, including for code signing.

Two problems that would sink a naive WKWebView wrap, both already solved here:

**Guideline 4.2 (Minimum Functionality).** Apple rejects apps that are "a
repackaged website". What helps: the app is genuinely offline-first and
standalone, the review note in `declarations.md` says so explicitly, and it has
real native integration beyond the webview — local notifications for
medication reminders, haptics for guided breathing, and the native print
bridge below.

**`window.print()` does nothing in WKWebView.** The one-page PDF summary
needs a native bridge — already implemented as `PrintBridge`, a
`WKScriptMessageHandler` in `ios/App/App/AppDelegate.swift` (deliberately not
a Capacitor plugin: `cap sync` would overwrite an app-local plugin's
registration on every sync, silently making it unreachable from JS). JS posts
to it via `window.webkit.messageHandlers.print`, falling back to
`window.print()` in a browser.

Export and backup go through the Web Share API, which WKWebView supports, and
only fall back to `<a download>` (inert in WKWebView) outside it.

Status — done, not a checklist:

- [x] Capacitor iOS project committed (`ios/`), no local `@capacitor/cli init` needed.
- [x] Print bridged natively (`PrintBridge` in `AppDelegate.swift`).
- [x] `WKWebView` `limitsNavigationsToAppBoundDomains` set in `capacitor.config.json`
      so `localStorage` is not evicted.
- [x] Medication reminders (`@capacitor/local-notifications`) and haptics
      (`@capacitor/haptics`) as further native integration.
- [ ] App Privacy → **Data Not Collected** (`declarations.md`).
- [ ] Paste the review note from `declarations.md`.
- [x] `icon-1024.png` as the App Store icon.

---

## 4. Migrating the existing user

The wrapped app is a **different storage origin** from the website. Anyone using
`parkinson.red-triangle.net` today — including the person this was built for —
**will not see their history in the store app.**

The path, in order:

1. In the web app: Settings → *Save a backup*, and keep the file.
2. Install the store app.
3. Settings → *Restore a backup* → choose that file.

Verify this end-to-end on a real device before telling anyone to switch. It is
also worth doing once immediately, as a plain safety backup.

## 5. Do not claim in either listing

See `regulatory.md`. Never: detects, diagnoses, monitors, predicts, alerts,
medical-grade, clinically validated, reduces falls.
