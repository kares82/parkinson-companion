/* Record a short demo video of the running app for Apple App Review.
 *
 *   node tools/make-demo-video.js         (serve the app on 8099 first)
 *
 * Produces store/demo-review.webm — a real screen recording of the app being
 * used, showing it works fully offline with no account. Upload it to an
 * UNLISTED YouTube video and paste the link in App Store Connect →
 * Vérification de l'app → Notes (App Review notes), not the Marketing URL.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8099';
const OUTDIR = 'store';
const VIDEO = { width: 720, height: 1560 };

function seedScript() {
  return `(() => {
    const now = Date.now(), D = 864e5;
    const at = (dAgo, h, m = 0) => { const d = new Date(now - dAgo * D); d.setHours(h, m, 0, 0); return d.getTime(); };
    localStorage.setItem('introseen_v5', '1');
    localStorage.setItem('lang_v5', 'en');
    localStorage.setItem('pname_v5', 'Anna');
    localStorage.setItem('hname_v5', 'David');
    localStorage.setItem('cname_v5', 'Claire');
    localStorage.setItem('husband_v5', '06 12 34 56 78');
    localStorage.setItem('caregiver_v5', '06 98 76 54 32');
    localStorage.setItem('medlist_v5', JSON.stringify([
      { name: 'Levodopa', dose: '100 mg', times: '08:00, 12:00, 16:00, 20:00' },
      { name: 'Entacapone', dose: '200 mg', times: '08:00, 16:00' },
    ]));
    localStorage.setItem('supply_v5', JSON.stringify({ bags: 6, days: 1, warn: 5, installedAt: now - D * 0.4 }));
    const crises = [], meds = [];
    let s = 7; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let d = 40; d >= 0; d--) {
      const n = 1 + Math.floor(rnd() * 2);
      for (let k = 0; k < n; k++) {
        const st = at(d, 9 + Math.floor(rnd() * 11), Math.floor(rnd() * 59));
        crises.push({ start: st, end: st + (8 + rnd() * 26) * 6e4,
          type: ['tremor', 'dysk', 'unk'][Math.floor(rnd() * 3)], pain: rnd() > 0.7,
          presence: rnd() > 0.5 ? 'alone' : 'David',
          lastMed: st - (40 + rnd() * 80) * 6e4, lastMedLabel: 'Levodopa 100 mg',
          regimen: 'Levodopa 100 mg; Entacapone 200 mg' });
      }
      [8, 12, 16, 20].forEach(h => { if (rnd() > 0.15) meds.push({ time: at(d, h), meds: [{ name: 'Levodopa', dose: '100 mg' }] }); });
    }
    localStorage.setItem('crises_v5', JSON.stringify(crises.sort((a, b) => a.start - b.start)));
    localStorage.setItem('meds_v5', JSON.stringify(meds.sort((a, b) => a.time - b.time)));
    const well = [];
    for (let d = 30; d >= 0; d -= 2) well.push({ time: at(d, 20), appetite: 3, mood: 4, pain: 2, sleep: 3, weight: +(61 - d * 0.05).toFixed(1) });
    localStorage.setItem('wellbeing_v5', JSON.stringify(well));
    localStorage.setItem('regimen_v5', JSON.stringify([{ text: 'Levodopa 100 mg; Entacapone 200 mg', start: 0, end: null }]));
    localStorage.setItem('lastbackup_v5', String(now - 2 * D));
  })()`;
}

const wait = (p, ms) => p.waitForTimeout(ms);
const tap = async (p, sel, pause = 1200) => { try { await p.click(sel, { timeout: 4000 }); } catch (e) {} await wait(p, pause); };

(async () => {
  const browser = await chromium.launch({ args: process.env.PW_NO_SANDBOX ? ['--no-sandbox'] : [] });
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    locale: 'en-US', colorScheme: 'light',
    recordVideo: { dir: OUTDIR, size: VIDEO },
  });
  const page = await ctx.newPage();
  await page.goto(BASE + '/index.html');
  await page.evaluate(seedScript());
  await page.reload();
  await page.waitForSelector('#startScreen.show');
  await wait(page, 2000);                                   // hold on the home / crisis button

  // A crisis, start to finish
  await tap(page, '#tapZone', 1500);                        // start episode
  await tap(page, '.typeBtn[data-type="tremor"]', 1200);    // choose a type
  await tap(page, '#painBtn', 1200);                        // mark pain
  await tap(page, '#endBtn', 900);
  await tap(page, '#confirmYes', 1200);                     // confirm end
  await tap(page, '.exOpt[data-ex="helped"]', 1500);        // extra-dose question

  // Help screen
  await tap(page, '#helpBtnMain', 2000);
  await tap(page, '[data-back]', 1200);

  // Daily logs
  await tap(page, '#wellBtn', 1800);
  await tap(page, '#wellCancel', 1000);
  await tap(page, '#medBtn', 1800);
  await tap(page, '#medCancel', 1000);

  // History + report (the doctor view)
  await tap(page, '#histLink', 1800);
  await tap(page, '#toReport', 1200);
  await page.mouse.wheel(0, 700); await wait(page, 1500);
  await page.mouse.wheel(0, 700); await wait(page, 1500);
  await page.mouse.wheel(0, 700); await wait(page, 1500);
  await tap(page, '[data-back]', 1200);

  // Settings — languages
  await tap(page, '#setLink', 1500);
  await wait(page, 2000);

  await ctx.close();                                        // flushes the video file
  await browser.close();

  // Rename the random video file to something meaningful.
  const files = fs.readdirSync(OUTDIR).filter(f => f.endsWith('.webm'));
  files.sort((a, b) => fs.statSync(path.join(OUTDIR, b)).mtimeMs - fs.statSync(path.join(OUTDIR, a)).mtimeMs);
  if (files[0]) {
    const dest = path.join(OUTDIR, 'demo-review.webm');
    fs.renameSync(path.join(OUTDIR, files[0]), dest);
    console.log('wrote', dest, (fs.statSync(dest).size / 1e6).toFixed(1) + ' MB');
  } else {
    console.log('no video produced');
  }
})();
