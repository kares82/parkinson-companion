# Submission playbook

Everything here is preparation for wrapping the PWA. **You cannot upload
`index.html` to either store** — it has to be packaged as a native app.

| | Google Play | Apple App Store |
|---|---|---|
| Wrapper | TWA (Bubblewrap) | WKWebView (Capacitor / PWABuilder) |
| Engine | real Chrome | WKWebView |
| Difficulty | straightforward | needs native work |
| Main risk | none significant | Guideline 4.2 rejection |

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

Both stores want them; Play will not publish without at least two.

- Play: phone 16:9 or 9:16, min 320px, max 3840px. 2–8 shots.
- Apple: 6.7" (1290×2796) **and** 6.5" (1242×2688) are the practical minimum.

Suggested set, in both languages: home screen · episode timer running · report
with the trend chart · medication list with dose times · the printed summary.

**Do not annotate screenshots with clinical claims.** See `regulatory.md`.

---

## 2. Google Play (TWA)

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://parkinson.red-triangle.net/manifest.webmanifest
# or use the prepared config:
cp store/twa-manifest.json ./twa-manifest.json && bubblewrap build
```

Then:

- [ ] Bubblewrap prints a SHA-256 fingerprint. Put it in
      `store/assetlinks-template.json`, rename to `assetlinks.json`, and serve it
      at `https://parkinson.red-triangle.net/.well-known/assetlinks.json`.
      **Without this the app opens with a browser URL bar across the top** and
      looks broken.
- [ ] After uploading, take the fingerprint from Play Console → Setup → App
      signing (Play re-signs the app) and update `assetlinks.json` to include it
      too. Missing this step is the single most common TWA launch failure.
- [ ] Fill the Data safety form and Health apps declaration → `declarations.md`.
- [ ] Listing copy → `listing-en.md`, `listing-fr.md`.

Downloads, printing and storage all work in a TWA because it is Chrome.

---

## 3. Apple App Store

Harder. Two specific problems, both solvable but neither automatic.

**Guideline 4.2 (Minimum Functionality).** Apple rejects apps that are "a
repackaged website". A bare WKWebView wrapper is a real rejection risk. What
helps: the app is genuinely offline-first and standalone, and the review note in
`declarations.md` says so explicitly. Strengthen it with native integration —
Share sheet, Files access for backups, and a native print path (below).

**`window.print()` does nothing in WKWebView.** The one-page PDF summary — the
feature the GP actually asked for — will silently do nothing in a naive wrap.
It needs a native bridge:

```swift
// Capacitor: expose a native print, call it from JS instead of window.print()
let fmt = webView.viewPrintFormatter()
let pc = UIPrintInteractionController.shared
pc.printFormatter = fmt
pc.present(animated: true)
```

Export and backup are already handled — they go through the Web Share API, which
WKWebView supports, and only fall back to `<a download>` (which is inert there).

Checklist:

- [ ] `npx @capacitor/cli init` or PWABuilder's iOS package.
- [ ] Bridge printing as above, or drop the Print button on iOS and rely on CSV
      export + share.
- [ ] Set `WKWebView` `limitsNavigationsToAppBoundDomains` and declare
      `WKAppBoundDomains` in `Info.plist` so `localStorage` is not evicted.
- [ ] App Privacy → **Data Not Collected** (`declarations.md`).
- [ ] Paste the review note from `declarations.md`.
- [ ] `icon-1024.png` as the App Store icon.

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
