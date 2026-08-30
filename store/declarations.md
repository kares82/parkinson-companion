# Store declarations — exact answers to give

Verified against the code: `index.html` makes **no** outbound network requests
(no `fetch`, no `XMLHttpRequest`, no WebSocket, no third-party script, no remote
font or image). The service worker only caches the app's own files. There is no
SDK of any kind. Every answer below follows from that.

Privacy policy URL (required by both stores):
**https://parkinson.red-triangle.net/privacy.html**

---

## Google Play — Data safety form

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | N/A (nothing is transmitted) |
| Do you provide a way for users to request that their data is deleted? | **Yes** — in-app, per entry in History or entirely via "Clear" |

Data is entered by the user and stored only on the device. Under Google's
definitions this is **not** "collection" (it never leaves the device and the
developer never receives it) and **not** "sharing".

> If a reviewer pushes back, the wording that resolves it: *"All data is stored
> locally on the user's device. It is never transmitted to the developer or to
> any third party. The app contains no analytics, advertising or third-party
> SDKs and makes no network requests."*

## Google Play — Health apps declaration

Play requires this for apps in the medical/health space.

- App category: **Health & fitness / medical — personal health record keeping.**
- Does the app provide diagnosis, treatment recommendations, or dosage
  calculation? **No.** It records what the user enters and displays summaries of
  their own entries. It performs no interpretation and makes no recommendation.
- Is it a regulated medical device? **No** — see `regulatory.md`.
- Does it handle sensitive health data? **Yes, locally only.** Never transmitted.

## Google Play — content rating (IARC questionnaire)
No violence, no sexual content, no profanity, no gambling, no user-generated
content, no data sharing. Expected outcome: **Everyone / PEGI 3**.

## Google Play — other required declarations
- Ads: **No ads.**
- In-app purchases: **None.**
- Target audience: **18+** (carers, people with Parkinson's, clinicians). Not
  designed for or directed at children.
- Government app: No.
- Financial features: None.

---

## Apple — App Privacy ("nutrition label")

Answer the first question: **"Do you or your third-party partners collect data
from this app?" → No.**

That single answer is correct and ends the questionnaire. It is truthful because
data never leaves the device and is never received by the developer. Apple's
definition of "collect" is *transmitting data off the device*; on-device-only
storage is explicitly excluded.

Resulting label: **"Data Not Collected."**

## Apple — App Review notes (paste into the review submission)

> Parkinson Companion is an offline diary for people living with Parkinson's and
> their carers. It requires no account and no sign-in.
>
> All data is stored locally on the device. The app makes no network requests of
> any kind and contains no analytics, advertising or third-party SDKs.
>
> To test: open the app, tap the large red area to start an episode timer, then
> "Episode ended" to save it. "Medication given", "Wellbeing" and "Report an
> incident" add other entry types. History and Report (top-right) show the saved
> data; Settings (top-left) configures names, phone numbers, the medication list
> and dose times, and contains Save/Restore backup.
>
> The app does not diagnose, does not recommend treatment or dosages, and does
> not claim to. It is a record-keeping diary. A disclaimer to this effect is
> shown in Settings and in the store description.
>
> The "Call for help" screen uses standard `tel:` links to a number the user
> enters themselves; the app never dials automatically.

## Apple — other answers
- Export compliance / encryption: **No** — the app uses no encryption beyond
  standard HTTPS for loading itself.
- Advertising identifier (IDFA): **Not used.**
- Age rating: **17+ is not required.** Expect **4+**, but if the questionnaire
  offers "Medical/Treatment Information" — answer **Infrequent/Mild** only if it
  asks about *references* to medical info. The app provides none of its own.
- Content rights: all content is the developer's own.
