# Copy-paste answers — App Store Connect (and Play)

Everything here reflects the truth of the app: local-only, no account, no
network, collects nothing, not a medical device.

## App Store Connect → App Privacy
- **Do you or your third-party partners collect data from this app?** → **No.**
  → results in **"Data Not Collected"** on the listing. (No other questions appear.)
- Third-party SDKs: **none.** Tracking: **none.**

## App Store Connect → App Review Information → Notes
```
This app is a local-only diary for the family carer of a person with Parkinson's.

- No account, no login, no sign-up. It opens straight to the main screen.
- No network use: the app makes no network calls and works fully offline. You
  can test it with Airplane Mode ON.
- It collects no data and sends nothing anywhere. All entries are stored only on
  the device (localStorage). "Export" / "Backup" and "Send report" produce a
  file and hand it to the system share sheet — the user chooses the recipient;
  the app itself never transmits.
- The interface auto-selects its language from the device (English, French,
  German, Italian, Spanish) and can be changed under Settings.
- To see populated screens: open "Settings" (top-left) and tap "Load sample
  data"; "Leave demo and restore my data" returns to the empty state.
- The "CALL FOR HELP" screen contains standard tel: links (e.g. 112 / 911).
  Please do not place a real call.
- This is a tracking diary, NOT a medical device. It makes no diagnosis and no
  treatment recommendation, and does not monitor the person or detect falls.

No demo account is needed (there is no login).
```
- **Sign-in required?** → **No.**
- **Contact:** your name / phone / email.

## App Store Connect → other fields
- **Export compliance:** uses non-exempt encryption? → **No.** (Info.plist already
  declares `ITSAppUsesNonExemptEncryption = false`, so it won't ask each upload.)
- **Category:** Primary **Medical** (a symptom/medication diary). Secondary optional.
- **Price:** Free. **Territories:** all (or France + your target countries).
- **Age rating questionnaire:** answer honestly — "Medical/Treatment Information"
  is *Infrequent/Mild* (it's a diary, no clinical instructions). Everything else
  None. That typically yields a **12+** rating; accept whatever it computes.
- **Privacy Policy URL:** https://<your-live-site>/privacy.html
- **Support URL:** your site or the in-app contact.

## Google Play → Data safety (mirror of the above)
- **Does your app collect or share any user data?** → **No.**
- **Is all data encrypted in transit?** → N/A (no data leaves the device).
- **Data deletion:** users can delete all data in-app ("Effacer") or by
  uninstalling. No account to delete.
- **Health apps declaration** (if shown): a personal symptom/medication **diary**;
  not a medical device; no diagnosis; data stays on device.

## Play → App content
- **Privacy policy:** same URL. **Ads:** No. **Target audience:** adults (carers).
- **Content rating questionnaire:** as above (a reference/diary app).
