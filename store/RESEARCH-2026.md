# What 2026 Parkinson's research says a carer diary should capture

Background for the clinical features added to Parkinson Companion. The app stays
a **diary, not a medical device** — it collects nothing off the phone and makes
no diagnosis. These additions make the record match what neurologists and PD
researchers actually use.

## Findings (2025–2026)
- **Motor fluctuations are what clinicians titrate against.** The Hauser diary
  (ON / ON‑with‑dyskinesia / OFF) is the gold standard, and "good ON time" is a
  primary endpoint in current trials. A full 30‑min Hauser diary is too heavy
  for an elderly carer, so we capture a **simplified motor-state snapshot**.
- **OFF is not one thing.** Morning OFF, wearing‑off, delayed‑ON, dose failure
  and sudden OFF each imply a different medication change.
- **Non‑motor fluctuations** (anxiety, fatigue, pain, urinary, brain fog) are a
  top unmet-need/research topic and affect quality of life strongly.
- **WOQ‑9** is a validated 9‑item wearing‑off screen (5 motor + 4 non‑motor),
  positive at ≥2 symptoms.
- **Biological staging (α‑synuclein SAA / NSD‑ISS)** is the big 2026 shift but
  is lab/imaging based — not something a home diary collects. Context only.

## What was implemented
1. **OFF sub-type** on each OFF episode (morning / wearing-off / delayed / dose
   failure / sudden) → report breakdown + CSV column.
2. **Non-motor tags** on an episode (anxiety, fatigue, urinary, brain fog) →
   report counts + CSV column.
3. **Motor-state snapshots** (ON / OFF / dyskinesia) → an approximate "good ON
   time" %, a per-day ON/OFF/dyskinesia bar, and a CSV block.
4. **WOQ‑9** self-check in Settings → auto-scored, shown in the report, in CSV.
5. **Freezing/fall context**: trigger (turning, doorway, dual-task, standing) and
   "during OFF?" on incidents → CSV columns.
6. **De-identified research export** — a CSV with the person's name and free-text
   notes stripped, for contributing to a study/registry (still user-initiated;
   nothing leaves the device automatically).

## Sources
- OFF episodes & dyskinesia (NeurologyLive): https://www.neurologylive.com/view/parkinson-disease-prevalence-and-impact-of-off-episodes-and-dyskinesia
- Recognizing OFF time (NeurologyLive): https://www.neurologylive.com/view/recognizing-off-time-in-parkinson-s-disease
- PD home diary validation (npj Parkinson's Disease): https://www.nature.com/articles/s41531-022-00331-w
- Wearable vs diary medication adjustment RCT (npj PD, 2025): https://www.nature.com/articles/s41531-025-00977-2
- WOQ‑9 non‑motor wearing‑off (J Neural Transm): https://pubmed.ncbi.nlm.nih.gov/21769622/
- α‑synuclein biomarkers & NSD‑ISS staging (PMC, 2025/26): https://pmc.ncbi.nlm.nih.gov/articles/PMC13542848/
- 2026 PD trial pipeline (NeurologyLive): https://www.neurologylive.com/view/previewing-parkinson-disease-pipeline-emerging-trials-to-watch-in-2026

_Not medical advice. These are diary aids; clinical decisions remain the neurologist's._
