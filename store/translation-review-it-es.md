# Italian & Spanish translation — clinical terms to proofread

The full Italian and Spanish UI is machine-quality but written carefully.
Everyday wording is safe to ship. The **clinical** terms below should be
confirmed by a native-speaking clinician (or a person with Parkinson's / carer
familiar with the local neurology vocabulary) before each store listing goes
live. Same approach as `translation-review-de.md`.

| Key(s) | Italian | Spanish | Check |
|---|---|---|---|
| `type.off`, `typeFull.off` | Blocco / rigidità (periodo OFF) | Bloqueo / rigidez (periodo OFF) | "periodo OFF" is standard in both; confirm the lay wording "blocco/bloqueo" reads naturally. |
| `inc.freezing`, `report.hoursLegend` | Freezing (blocco) | Freezing (bloqueo) | English "freezing" is used in IT/ES neurology; confirm carers recognise it, else "blocco motorio" / "congelación de la marcha". |
| `off.wearing`, `woq.pos`, `report.woqSec` | Esaurimento dose | Fin de dosis | "wearing-off". Confirm vs. IT "wearing-off"/"deterioramento di fine dose", ES "deterioro de fin de dosis". |
| `off.delayed` | ON ritardato | ON retardado | "delayed ON" — confirm vs. "risposta ritardata" / "respuesta retardada". |
| `off.failure` | Dose inefficace | Fallo de dosis | "dose failure" — confirm IT wording ("mancata risposta alla dose"?). |
| `off.morning` | Mattutino | Matutino | "morning OFF" — confirm. |
| `typeCsv.dysk`, `typeFull.dysk`, `state.dysk` | Discinesia | Discinesia | Confirm the lay/clinical split is fine. |
| `woq.*` (WOQ-9 items) | see app | see app | If a validated Italian/Spanish WOQ-9 exists, align item wording with it. |
| `nm.*` | Ansia, Affaticamento, Urinario, Mente annebbiata | Ansiedad, Fatiga, Urinario, Mente nublada | Confirm "urinario" vs. a fuller "urgenza urinaria" / "urgencia urinaria". |
| `inc.tgDual` | Doppio compito | Doble tarea | "dual-task" — confirm. |
| `set.emergHint` | 112 / 15 / 911 / 999 | 112 / 15 / 911 / 999 | Numbers correct (IT & ES both use 112); wording only. |

Gendered strings use the inclusive "solo/a", "cuidador(a)" forms; confirm this is
acceptable house style for each market.

Everything else (navigation, buttons, backup, wellbeing, report section titles)
is general-language and does not need clinical sign-off.

Note: the CSV export uses ASCII-safe forms where needed (e.g. IT "rigidita")
for spreadsheet compatibility — intentional, not a typo.
