# Tests

End-to-end tests covering the paths where a silent failure would cost real
clinical data — a lost episode, a swallowed write, a figure that flatters the
patient.

```bash
npm ci
npx playwright install webkit chromium
npm test
```

Two projects run:

| Project | Engine | Why |
|---|---|---|
| `mobile-safari` | WebKit | What the app actually ships on. The home-screen flicker and the inert `<a download>` were both WebKit-only. |
| `mobile-chromium` | Chromium | What the Android TWA runs. |

One project only: `npx playwright test --project=mobile-chromium`.

In a container running as root, Chromium needs `PW_NO_SANDBOX=1`.

CI (`.github/workflows/test.yml`) also checks that the committed icons still
match `tools/make-icons.py`, that the store listing is in sync with the fastlane
metadata, that the inline scripts parse, and that no credential-shaped file has
been committed.
