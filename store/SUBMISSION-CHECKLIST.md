# Parkinson Companion — App Store submission checklist (tailored)

Mapped from the proven Le Dossier 101 / Oli playbook to THIS app. Most of it is
already handled in the repo; the rest is portal work only you can do.

## 0. The stack (settled)
- **Native, not a bare PWA** — Capacitor, committed `ios/` project. (Oli path.)
- **Capacitor**, built on GitHub Actions macOS via `.github/workflows/ios-testflight.yml`.
- **Sells nothing** → the whole IAP section is **N/A** (no StoreKit, no RevenueCat).
- **No login, no email verification** → **no demo account required**, and the
  account-deletion rule (5.1.1(v)) is **N/A** (there are no accounts).
  Data deletion = uninstall, plus in-app "Effacer". Say this in the listing.

## Already done in the repo (verify, don't redo)
- [x] Bundle id fixed: `net.redtriangle.parkinson` (capacitor + Xcode project).
- [x] Export compliance: `ITSAppUsesNonExemptEncryption = false` in Info.plist.
- [x] Reliable Apple auth: workflow uses an **ASC API key (.p8)** via secrets,
      not Apple ID/password.
- [x] iPhone-only (`TARGETED_DEVICE_FAMILY = "1"`) — no iPad review burden.
- [x] Privacy policy page (`privacy.html`, served on the site).
- [x] Medical disclaimer in-app; **collects nothing**; offline.
- [x] Store listing text (FR/EN), data declarations, screenshots (`store/`).
- [x] Secrets git-ignored (`.p8`, keystore, service-account json).

## You must do — Apple portals (in this order)
1. **Apple Developer → Identifiers**: register `net.redtriangle.parkinson`.
2. **App Store Connect**: create the app; note the numeric app id and your **Team ID**.
3. **Users and Access → Integrations → Keys**: create an **App Store Connect API key**;
   download the `.p8` **once**. Note **Key ID** and **Issuer ID** (different fields).
4. **GitHub repo → Settings → Secrets → Actions**, add:
   - `ASC_KEY_P8` (the whole .p8, BEGIN/END included)
   - `ASC_KEY_ID`
   - `ASC_ISSUER_ID`
   - `APPLE_TEAM_ID`
5. Run the **iOS — TestFlight** workflow (Actions tab → Run workflow). It builds,
   signs and uploads. In App Store Connect, **attach the build to the version**
   (Build → "+") after ~10–30 min of processing.

## Metadata to fill in App Store Connect
- [ ] Screenshots (use `store/screenshots/`; resize to the required 6.7"/6.5" sizes).
- [ ] Description / keywords (from `store/listing-en.md`, `listing-fr.md`).
- [ ] **App Privacy → "Data Not Collected."**
- [ ] Privacy policy URL (your live `…/privacy.html`).
- [ ] Age rating, copyright, pricing = **Free**, territories, **DSA trader** declaration.
- [ ] Export compliance question → already answered by the Info.plist flag.
- [ ] Review notes: "Local-only diary, no account, no network. Fully usable offline."

## Health-app specifics (extra scrutiny — 1.4.1 / 5.1.3)
- Keep the "**not a medical device, no diagnosis**" line in the listing and app.
- Privacy policy states plainly: data stays on device, nothing collected or shared,
  never used for advertising.
- The main risk is **4.2 (minimum functionality / "just a website")** — the
  mitigation is that it genuinely runs offline as a native app; say so in review notes.

## Google Play (if it follows)
- `.aab` is already produced by `android-play.yml` (now green).
- **New personal Play account: closed test, 20+ testers, 14 consecutive days**
  before production unlocks — start recruiting testers now (longest pole).
- Data safety form → **no data collected, no data shared**.

## The habit that matters most
Before submitting, open the shipped app as a stranger: fresh install → the
first-launch explainer appears, the crisis button is the first thing, everything
works with the network off.
