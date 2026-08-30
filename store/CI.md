# Automated publishing — setup

Two GitHub Actions workflows publish the app. **No credential is ever stored in
this repo, pasted into a chat, or visible to anyone but you.** Everything
sensitive lives in GitHub Secrets, is written to a temp file during the run, and
is shredded afterwards.

Both workflows are **manual only** (`workflow_dispatch`) and default to a
**testing track**. Nothing reaches the public without you deliberately choosing
it and then promoting the release in the console.

| Workflow | Runs on | Does |
|---|---|---|
| `.github/workflows/android-release.yml` | ubuntu | Builds the TWA with Bubblewrap, uploads to a Play track |
| `.github/workflows/ios-release.yml` | macOS | Builds the Capacitor app, uploads to TestFlight |

---

## Two things that will bite you first

**1. Play rejects the API for a brand-new app.** The Google Play Developer API
cannot create the *first* release. You must upload one build through the Play
Console by hand, and complete the store listing, content rating, Data safety and
Health apps declarations, before the API will accept anything. Download the AAB
from the workflow's artifacts and upload it manually that first time. After
that, this pipeline works.

**2. The iOS workflow needs an Xcode project that doesn't exist yet.** Generate
it once, on a Mac:

```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "Parkinson Companion" net.redtriangle.parkinson --web-dir=.
npx cap add ios
```

Then commit `ios/`. While you're in Xcode, add the native print bridge — without
it the one-page PDF summary silently does nothing on iOS (see `store/README.md`).

---

## Android secrets

Create the signing keystore **once**, locally, and back it up somewhere safe.
If you lose it you cannot update the app.

```bash
keytool -genkeypair -v -keystore android.keystore \
  -alias parkinson -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 android.keystore    # macOS: base64 -i android.keystore
```

Add under **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | the base64 string printed above |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password you chose |
| `ANDROID_KEY_PASSWORD` | key password you chose |
| `PLAY_SERVICE_ACCOUNT_JSON` | whole contents of the service-account JSON below |

**Service account, least privilege:**

1. Play Console → Setup → API access → create a new Google Cloud project (or link one).
2. Create a service account, download its JSON key.
3. Back in Play Console → Users and permissions → invite that service account.
4. Grant **only**: *Release to testing tracks* and *Edit store listing*.
   Do **not** grant "Release to production" or account-level admin. You can widen
   it later once you trust the pipeline.

## iOS secrets

App Store Connect → **Users and Access → Integrations → App Store Connect API**
→ generate a key with role **App Manager** (not Admin). You can download the
`.p8` exactly once.

| Secret | Value |
|---|---|
| `ASC_KEY_ID` | the Key ID shown in the table |
| `ASC_ISSUER_ID` | the Issuer ID above the table |
| `ASC_PRIVATE_KEY` | full contents of the `.p8`, including the BEGIN/END lines |
| `MATCH_GIT_URL` | *(optional)* private repo holding signing certs, if you use fastlane match |
| `MATCH_PASSWORD` | *(optional)* passphrase for that repo |

Using an API key means CI never needs your Apple ID password and never trips 2FA.

---

## Running it

Actions tab → pick the workflow → **Run workflow**.

- Android: choose a track (defaults to `internal`). Tick **dry run** the first
  time — it validates the upload without publishing anything.
- iOS: builds and sends to TestFlight; it does not submit for review.

Push the store listing text on its own, without a binary:

```bash
PLAY_JSON_KEY_PATH=play-key.json fastlane android metadata
```

## Store listing text

`store/listing-en.md` and `store/listing-fr.md` are the source of truth.
`fastlane/metadata/` is generated from them:

```bash
python3 tools/sync-store-metadata.py          # regenerate
python3 tools/sync-store-metadata.py --check  # CI runs this; fails if stale
```

The script also enforces each store's character limits, so an over-long subtitle
fails in CI rather than at review.

---

## Keeping the credentials safe

- `.gitignore` covers `*.keystore`, `*.p8`, `*.p12`, `play-key.json` and friends.
- A pre-commit hook refuses to commit credential files, or any file containing a
  private key or service-account JSON. Enable it once per clone:

  ```bash
  git config core.hooksPath tools/githooks
  ```

- Both workflows shred their temp credential files in an `if: always()` step, so
  they are removed even if the build fails.
- GitHub masks secret values in logs, but never `echo` one deliberately.

**If a credential leaks:** revoke first, rotate second.
Play → Users and permissions → remove the service account, and delete the key in
Google Cloud. App Store Connect → Integrations → revoke the key.
An Android **upload** key can be reset by Google Play support; if you are not on
Play App Signing, a leaked **app signing** key means you can never update the
app again — which is why the keystore should exist in exactly two places: your
backup, and GitHub Secrets.
