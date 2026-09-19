# German translation — clinical terms to proofread

The full German UI is machine-quality but written carefully. Everyday wording is
safe to ship. The terms below are **clinical** and should be confirmed by a
native German-speaking clinician (or a person with Parkinson's / carer familiar
with German neurology vocabulary) before the German store listing goes live.
Each row: the app key, the German used, and the point to check.

| Key(s) | German used | Check |
|---|---|---|
| `type.off`, `typeFull.off` | Blockade / Steifheit (OFF-Phase) | "OFF-Phase" is standard in German PD care; confirm "Blockade" reads naturally for lay carers vs. "Blockierung". |
| `inc.freezing`, `report.hoursLegend` | Freezing (Blockade) | German neurology keeps the English "Freezing (of Gait)". Kept as-is — confirm carers recognise it. |
| `off.wearing`, `woq.pos`, `report.woqSec` | Wirkungsnachlassen | Standard term for "wearing-off". Alternative: "Wearing-off" (kept in `woq.btn`). Confirm consistency is acceptable. |
| `off.delayed` | Verzögertes Anfluten | "delayed ON" — "Anfluten" is the pharmacological term; confirm it's understood, else "Verzögerter Wirkungseintritt". |
| `off.failure` | Dosisversagen | "dose failure" — confirm vs. "Dosisausfall". |
| `off.morning` | Morgendlich | "morning OFF" — confirm vs. "Morgendliche OFF-Phase". |
| `typeCsv.dysk`, `typeFull.dysk`, `state.dysk` | Dyskinesie / unwillkürliche Bewegungen | Confirm the lay/clinical split is fine. |
| `woq.*` (WOQ-9 items) | see app | WOQ-9 has a validated German version — align item wording with it if the clinician has it to hand. |
| `nm.*` | Angst, Müdigkeit, Harndrang, Benommenheit | Non-motor symptoms — confirm "Harndrang" (urinary urgency) vs. broader "Blasenprobleme". |
| `inc.tgDual` | Doppelaufgabe | "dual-task" — confirm vs. "Doppeltätigkeit". |
| `set.emergHint` | 112 / 15 / 911 / 999 | Numbers are correct; wording only. |

Everything else (navigation, buttons, backup, wellbeing, report section titles)
is general-language and does not need clinical sign-off.

Note: the CSV export uses ASCII-safe forms (e.g. "unwillkuerliche") for
spreadsheet compatibility — this is intentional, not a typo.
