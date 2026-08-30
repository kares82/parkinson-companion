#!/usr/bin/env python3
"""Generate fastlane metadata from store/listing-*.md.

store/listing-{en,fr}.md stay the human-editable source of truth. fastlane needs
one value per file in a fixed tree, so this derives that tree rather than asking
anyone to keep two copies of the same paragraph in step.

Run from the repo root:  python3 tools/sync-store-metadata.py [--check]
--check exits non-zero if the generated files are stale (used in CI).
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOCALES = {"en": "en-US", "fr": "fr-FR"}
HEAD = {
    "name":  r"(?:App name|Nom de l'application)",
    "sub":   r"(?:Subtitle|Sous-titre)",
    "short": r"(?:Short description|Description courte)",
    "full":  r"(?:Full description|Description complète)",
    "keys":  r"(?:Keywords|Mots-clés)",
}
LIMITS = {"sub": 30, "short": 80, "keys": 100}

def section(text, pattern):
    m = re.search(r"^## " + pattern + r"[^\n]*\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    if not m:
        return None
    body = re.sub(r"<!--.*?-->", "", m.group(1), flags=re.S)
    return body.strip()

def write(path, value, check, stale):
    path.parent.mkdir(parents=True, exist_ok=True)
    new = value.rstrip() + "\n"
    old = path.read_text(encoding="utf-8") if path.exists() else None
    if old != new:
        stale.append(str(path.relative_to(ROOT)))
        if not check:
            path.write_text(new, encoding="utf-8")

def main():
    check = "--check" in sys.argv
    stale, problems = [], []
    for lang, locale in LOCALES.items():
        src = ROOT / f"store/listing-{lang}.md"
        text = src.read_text(encoding="utf-8")
        vals = {k: section(text, p) for k, p in HEAD.items()}
        for k, v in vals.items():
            if v is None:
                problems.append(f"{src.name}: missing section '{k}'")
        for k, limit in LIMITS.items():
            if vals.get(k) and len(vals[k]) > limit:
                problems.append(f"{src.name}: {k} is {len(vals[k])} chars, limit {limit}")

        a = ROOT / "fastlane/metadata/android" / locale
        write(a / "title.txt",             vals["name"],  check, stale)
        write(a / "short_description.txt", vals["short"], check, stale)
        write(a / "full_description.txt",  vals["full"],  check, stale)

        i = ROOT / "fastlane/metadata" / locale
        write(i / "name.txt",        vals["name"], check, stale)
        write(i / "subtitle.txt",    vals["sub"],  check, stale)
        write(i / "description.txt", vals["full"], check, stale)
        write(i / "keywords.txt",    vals["keys"], check, stale)
        write(i / "privacy_url.txt", "https://parkinson.red-triangle.net/privacy.html", check, stale)
        write(i / "support_url.txt", "https://parkinson.red-triangle.net/", check, stale)

    if problems:
        print("PROBLEMS:"); [print("  -", p) for p in problems]; return 1
    if check and stale:
        print("Stale metadata (run tools/sync-store-metadata.py):")
        [print("  -", s) for s in stale]; return 1
    print(f"{'up to date' if not stale else 'wrote ' + str(len(stale)) + ' file(s)'}; limits OK")
    return 0

if __name__ == "__main__":
    sys.exit(main())
