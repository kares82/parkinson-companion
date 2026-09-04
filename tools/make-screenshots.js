/* Generate App Store / Play screenshots straight from the real app.
 *
 *   node tools/make-screenshots.js
 *
 * Apple wants 1290x2796 (6.9"/6.7" iPhone). That is a 430x932 CSS viewport at
 * DPR 3, so these are real screenshots of the running app, not mock-ups.
 * fastlane deliver/supply pick them up from fastlane/screenshots/<locale>/.
 */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8099';
const OUT = 'fastlane/screenshots';
const SIZES = [{ name: 'iphone69', w: 430, h: 932, scale: 3 }];   // 1290x2796

// Plausible two months of history. Deliberately unremarkable numbers: a store
// screenshot must not read as a clinical claim.
function seedScript(lang) {
  return `(() => {
    const now = Date.now(), D = 864e5;
    const at = (dAgo, h, m = 0) => { const d = new Date(now - dAgo * D); d.setHours(h, m, 0, 0); return d.getTime(); };
    localStorage.setItem('lang_v5', ${JSON.stringify(lang)});
    localStorage.setItem('pname_v5', ${JSON.stringify(lang === 'fr' ? 'Marie' : 'Anna')});
    localStorage.setItem('hname_v5', ${JSON.stringify(lang === 'fr' ? 'Jean' : 'David')});
    localStorage.setItem('cname_v5', ${JSON.stringify(lang === 'fr' ? 'Claire' : 'Claire')});
    localStorage.setItem('husband_v5', '06 12 34 56 78');
    localStorage.setItem('caregiver_v5', '06 98 76 54 32');
    localStorage.setItem('medlist_v5', JSON.stringify([
      { name: 'Levodopa', dose: '100 mg', times: '08:00, 12:00, 16:00, 20:00' },
      { name: 'Entacapone', dose: '200 mg', times: '08:00, 16:00' },
    ]));
    localStorage.setItem('supply_v5', JSON.stringify({ bags: 6, days: 1, warn: 5, installedAt: now - D * 0.4 }));
    const crises = [], meds = [];
    let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let d = 55; d >= 0; d--) {
      const n = 1 + Math.floor(rnd() * 2);
      for (let k = 0; k < n; k++) {
        const s = at(d, 9 + Math.floor(rnd() * 11), Math.floor(rnd() * 59));
        crises.push({ start: s, end: s + (8 + rnd() * 26) * 6e4,
          type: ['tremor', 'dysk', 'unk'][Math.floor(rnd() * 3)], pain: rnd() > 0.72,
          presence: rnd() > 0.5 ? 'alone' : ${JSON.stringify(lang === 'fr' ? 'Jean' : 'David')},
          lastMed: s - (40 + rnd() * 80) * 6e4, lastMedLabel: 'Levodopa 100 mg',
          regimen: d > 28 ? 'Levodopa 100 mg; Entacapone 200 mg' : 'Levodopa 150 mg; Entacapone 200 mg' });
      }
      [8, 12, 16, 20].forEach(h => { if (rnd() > 0.12) meds.push({ time: at(d, h, Math.floor(rnd() * 20) - 10), meds: [{ name: 'Levodopa', dose: '100 mg' }] }); });
    }
    localStorage.setItem('crises_v5', JSON.stringify(crises.sort((a, b) => a.start - b.start)));
    localStorage.setItem('meds_v5', JSON.stringify(meds.sort((a, b) => a.time - b.time)));
    const well = [];
    for (let d = 40; d >= 0; d -= 2) well.push({ time: at(d, 20), appetite: 3, mood: 4, pain: 2, sleep: 3, weight: +(61 - d * 0.05).toFixed(1) });
    localStorage.setItem('wellbeing_v5', JSON.stringify(well));
    localStorage.setItem('incidents_v5', JSON.stringify([
      { time: at(6, 15), type: 'presque', injury: false, note: '' },
      { time: at(19, 11), type: 'blocage', injury: false, note: '' },
    ]));
    localStorage.setItem('regimen_v5', JSON.stringify([
      { text: 'Levodopa 100 mg; Entacapone 200 mg', start: 0, end: now - 28 * D },
      { text: 'Levodopa 150 mg; Entacapone 200 mg', start: now - 28 * D, end: null },
    ]));
    localStorage.setItem('lastbackup_v5', String(now - 2 * D));
  })()`;
}

const SHOTS = [
  { id: '1-home',    go: async () => {} },
  { id: '2-episode', go: async p => { await p.click('#tapZone'); await p.waitForTimeout(400);
                                      await p.click('.typeBtn[data-type="tremor"]'); } },
  { id: '3-report',  go: async p => { await p.click('#histLink'); await p.click('#toReport'); await p.waitForTimeout(500); } },
  { id: '4-history', go: async p => { await p.click('#histLink'); await p.waitForTimeout(400); } },
  { id: '5-meds',    go: async p => { await p.click('#setLink'); await p.waitForTimeout(300);
                                      await p.$eval('#medListRows', e => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(300); } },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
    args: process.env.PW_NO_SANDBOX ? ['--no-sandbox'] : [],
  });
  for (const [lang, locale] of [['en', 'en-US'], ['fr', 'fr-FR']]) {
    for (const size of SIZES) {
      const dir = path.join(OUT, locale);
      fs.mkdirSync(dir, { recursive: true });
      for (const shot of SHOTS) {
        const ctx = await browser.newContext({
          viewport: { width: size.w, height: size.h },
          deviceScaleFactor: size.scale, isMobile: true, hasTouch: true,
          locale, colorScheme: 'light',
        });
        const page = await ctx.newPage();
        await page.goto(BASE + '/index.html');
        await page.evaluate(seedScript(lang));
        await page.reload();
        await page.waitForSelector('#startScreen.show');
        await page.waitForTimeout(400);
        await shot.go(page);
        await page.waitForTimeout(400);
        const file = path.join(dir, `${size.name}-${shot.id}.png`);
        await page.screenshot({ path: file });
        const { width, height } = require('child_process').execSync(
          `python3 -c "from PIL import Image;i=Image.open('${file}');print(i.size[0],i.size[1])"`
        ).toString().trim().split(' ').reduce((a, v, i) => (i ? { ...a, height: +v } : { width: +v }), {});
        console.log(`${locale}  ${shot.id.padEnd(10)} ${width}x${height}`);
        await ctx.close();
      }
    }
  }
  await browser.close();
})();
