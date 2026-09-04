# App Store — what is ready, and what still needs a Mac

Pricing: **free**, `price_tier(0)` in `fastlane/Deliverfile`. See `pricing.md`.

## Ready in this repo

| | Where |
|---|---|
| Listing text, EN + FR | `fastlane/metadata/{en-US,fr-FR}/` — generated from `store/listing-*.md` |
| **Screenshots, EN + FR** | `fastlane/screenshots/{en-US,fr-FR}/` — 1290×2796, real captures of the running app |
| App icon | `icon-1024.png` — 1024×1024, no alpha, square corners |
| Privacy policy | `privacy.html`, live at parkinson.red-triangle.net/privacy.html |
| Privacy questionnaire answers | `declarations.md` → **Data Not Collected** |
| Review notes | `fastlane/Deliverfile` and `declarations.md` |
| Print bridge (web side) | `printReport()` in `index.html` — posts to the native handler, falls back to `window.print()` |
| Print bridge (native side) | `ios-native/AppDelegate+Print.swift` |
| Info.plist additions | `ios-native/Info.plist.additions.xml` |
| Capacitor config | `capacitor.config.json` |
| Upload pipeline | `.github/workflows/ios-release.yml` + `fastlane ios beta` |

Regenerate screenshots after any UI change:

```bash
python3 -m http.server 8099 &
node tools/make-screenshots.js
```

## Still needs a Mac (about an hour)

**1. Generate the Xcode project.** Cannot be done from Linux.

```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios
npx cap add ios          # reads capacitor.config.json
npx cap sync ios
```

**2. Add the print bridge.** Drag `ios-native/AppDelegate+Print.swift` into the
App target, then call it once the web view exists — in Capacitor, the simplest
place is `AppDelegate.applicationDidBecomeActive` or a `CAPBridgeViewController`
subclass:

```swift
if let vc = window?.rootViewController as? CAPBridgeViewController,
   let wv = vc.webView {
    PrintBridge.attach(to: wv)
}
```

Without this the **Print / PDF** button silently does nothing — and that page is
the reason the GP was interested.

**3. Merge `ios-native/Info.plist.additions.xml` into `ios/App/App/Info.plist`.**
`WKAppBoundDomains` is the one that matters: it exempts the app's storage from
the eviction the system otherwise applies, i.e. it stops the patient's history
being cleared to reclaim space.

**4. Commit `ios/`.** The CI workflow checks for it and refuses to run without it.

**5. Test on a real device** before submitting:
- Print / PDF actually produces a sheet
- Backup and Export open the share sheet (they use the Web Share API, which
  WKWebView supports; `<a download>` does not work there)
- The app resumes a running episode after being force-quit
- Text is legible at the largest accessibility text size

## Then

1. App Store Connect → create the app record, bundle id `net.redtriangle.parkinson`.
2. Run **iOS — build & upload to TestFlight** (needs the `ASC_*` secrets from `CI.md`).
3. `fastlane ios metadata` pushes the listing text, screenshots and price.
4. Submit.

## The one real rejection risk

**Guideline 4.2, Minimum Functionality** — Apple rejects apps that are "a
repackaged website". Mitigations already in place: the app is genuinely
offline-first and standalone, it uses native print and the native share sheet,
and the review note states plainly that it requires no account and makes no
network requests. If it is rejected anyway, the reply that usually resolves it is
that the app functions entirely offline with no server component, which a
website cannot.

Do not argue the point by adding a token native feature. Point at the offline
behaviour, which is real.
