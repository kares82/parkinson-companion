# Shipping to both stores

Pricing: **free**, both stores. See `pricing.md`.

**Neither store needs a Mac or an Android SDK.** Both apps are built by GitHub
Actions — macOS runners for iOS, Ubuntu for Android — following the setup
already proven on OLI. The hardware requirement becomes a secret in a settings
page instead of a purchase.

One Capacitor project serves both. `ios/` and `android/` are committed; `www/`
is not, because it is assembled from the repo by `tools/build-www.js` on every
build.

## What is in the repo already

| | Where |
|---|---|
| iOS project | `ios/` — Xcode project, SPM (no CocoaPods) |
| Android project | `android/` — Gradle |
| App bundle assembly | `tools/build-www.js` |
| Print bridge, iOS | `ios/App/App/PrintBridge.swift`, wired in `SceneDelegate` |
| Print bridge, Android | `MainActivity.java` |
| App icons, both | generated into the projects from `icon-1024.png` |
| Listing text, EN + FR | `fastlane/metadata/` — generated from `store/listing-*.md` |
| Screenshots, EN + FR | `fastlane/screenshots/` — 1290×2796, real captures |
| Privacy policy | `privacy.html`, live on the site |
| Declaration answers | `declarations.md` |
| iOS build + upload | `.github/workflows/ios-testflight.yml` |
| Android build | `.github/workflows/android-play.yml` |

## Secrets

**iOS** — App Store Connect > Users and Access > Integrations > Keys, role
**App Manager** (not Admin; it only uploads builds):

| Secret | Where from |
|---|---|
| `APPLE_TEAM_ID` | developer.apple.com > Membership, 10 characters |
| `ASC_KEY_ID` | the key's row |
| `ASC_ISSUER_ID` | above the key list on that page |
| `ASC_KEY_P8` | the whole `.p8`, BEGIN/END included — **downloadable once** |

**Android** — create the upload key once, locally, and back it up:

```bash
keytool -genkeypair -v -keystore upload.jks -alias parkinson \
        -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 upload.jks          # macOS: base64 -i upload.jks
```

`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
`ANDROID_KEY_PASSWORD`. With Play App Signing, Google holds the key that signs
what users install, but this upload key is the only thing proving a bundle came
from you — losing it takes a support request.

## Order to do it in

**1. Android first.** It needs no secrets to prove itself: run **Android —
build** and it produces a debug APK you can sideload. Set the four secrets and
it produces a signed `.aab`. That validates the whole Capacitor project before
Apple is involved at all.

**2. Play Console.** Create the app, then upload that first `.aab` **by hand** —
the Play Developer API cannot create an app's first release. Complete the store
listing, content rating, Data safety and Health apps declarations
(`declarations.md`) before the API will accept anything.

**3. App Store Connect.** Create the app record with bundle id
`net.redtriangle.parkinson`, then run **iOS — TestFlight**.

**4. Submit**, using the review notes in `declarations.md`.

## Things that will bite

**Xcode 26+ or the upload is refused**, and the refusal arrives at the *end* of
a ten-minute build. The workflow selects the newest Xcode on the runner and
asserts the version up front so a too-old image fails in five seconds.

**Never sign at archive time.** Capacitor sets `CODE_SIGN_IDENTITY = "iPhone
Developer"` for Release too, so an App Store archive asks for a *development*
profile — which needs a registered device, and a CI runner is not one.
Overriding to "Apple Distribution" fails the other way with a conflicting
identity error. The workflow archives with signing off and lets
`-exportArchive` sign once. Do not "fix" this by adding a signing identity.

**Build numbers are remembered forever.** Both stores refuse one they have seen.
`github.run_number` supplies them, so they are never chosen by hand.

**Test on a real device before submitting:** Print / PDF produces a sheet;
Backup and Export open the share sheet; a running episode survives a force-quit;
text is legible at the largest accessibility text size.

## The one real rejection risk

**Guideline 4.2, Minimum Functionality** — Apple rejects "a repackaged website".
Mitigations in place: the app genuinely works offline with no server, uses native
print and the native share sheet, and the review note says so plainly. If it is
rejected anyway, answer with the offline behaviour, which is real and which a
website cannot do. Do not bolt on a token native feature to win the argument.

Apple also asks for a way to see the whole app without an account. There is no
account here at all, and the review note says so.
