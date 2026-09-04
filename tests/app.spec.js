/* End-to-end tests for Parkinson Companion.
 *
 *   npx playwright test            (see tests/README.md)
 *
 * These lock down behaviour where a silent failure would cost real clinical
 * data: a lost episode, a swallowed write, a figure that flatters the patient.
 */
const { test, expect } = require('@playwright/test');

const iso = (dAgo, h = 12) => { const d = new Date(Date.now() - dAgo * 864e5); d.setHours(h, 0, 0, 0); return d.getTime(); };

async function seed(page, data) {
  await page.goto('/index.html');
  // scalar settings (language, names) are stored raw; record lists are JSON
  await page.evaluate(d => {
    for (const [k, v] of Object.entries(d))
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  }, data);
  await page.reload();
  await page.waitForSelector('#startScreen.show');
}
const episode = (o = {}) => ({ start: iso(1), end: iso(1) + 6e5, type: 'tremor', pain: false,
  presence: 'alone', lastMed: null, lastMedLabel: '', regimen: '', ...o });

test.beforeEach(async ({ page }) => {
  page.on('pageerror', e => { throw new Error('uncaught page error: ' + e.message); });
});

test.describe('recording an episode', () => {
  test('an accidental start can be cancelled without saving', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#tapZone');
    await expect(page.locator('#activeScreen')).toBeVisible();
    await page.click('#cancelBtn'); await page.click('#confirmYes');
    await expect(page.locator('#startScreen')).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('crises_v5') || '[]').length)).toBe(0);
  });

  test('the start time can be corrected backwards and is what gets saved', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#tapZone');
    await page.click('#startAdj .sa[data-sadj="30"]');
    await page.click('#endBtn'); await page.click('#confirmYes');
    const ep = await page.evaluate(() => JSON.parse(localStorage.getItem('crises_v5'))[0]);
    expect((ep.end - ep.start) / 60000).toBeGreaterThan(29);
  });

  test('presence is confirmed inline, not inherited from the sticky badge', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#tapZone');
    await expect(page.locator('#apBtns .apOpt')).toHaveCount(4);
    await page.click('#apBtns .apOpt:nth-child(2)');
    await page.click('#endBtn'); await page.click('#confirmYes');
    const ep = await page.evaluate(() => JSON.parse(localStorage.getItem('crises_v5'))[0]);
    expect(ep.presence).not.toBe('alone');
  });

  // An episode can run for an hour while the phone is locked; iOS will kill a
  // backgrounded PWA. Losing it would lose a start time nobody can reconstruct.
  test('a running episode survives the app being killed', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#tapZone');
    await page.click('#startAdj .sa[data-sadj="30"]');
    await page.click('.typeBtn[data-type="dysk"]');
    await page.click('#painBtn');
    await page.reload();
    await expect(page.locator('#activeScreen')).toBeVisible();
    await expect(page.locator('.typeBtn[data-type="dysk"]')).toHaveClass(/sel/);
    await expect(page.locator('#painBtn')).toHaveClass(/sel/);
    await page.click('#endBtn'); await page.click('#confirmYes');
    const ep = await page.evaluate(() => JSON.parse(localStorage.getItem('crises_v5'))[0]);
    expect(ep.type).toBe('dysk');
    expect(ep.pain).toBe(true);
    expect((ep.end - ep.start) / 60000).toBeGreaterThan(29);
    expect(await page.evaluate(() => localStorage.getItem('active_v5'))).toBeNull();
  });

  test('a stale running episode from days ago is discarded', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => localStorage.setItem('active_v5', JSON.stringify({ start: Date.now() - 3 * 864e5 })));
    await page.reload();
    await expect(page.locator('#startScreen')).toBeVisible();
  });
});

test.describe('correcting the record', () => {
  test('a single history entry can be deleted', async ({ page }) => {
    await seed(page, { crises_v5: [episode()] });
    await page.click('#histLink');
    await page.click('#histList .ep .epDel'); await page.click('#confirmYes');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('crises_v5') || '[]').length)).toBe(0);
  });

  test('medication is logged at the time it was given, not typed', async ({ page }) => {
    await seed(page, { medlist_v5: [{ name: 'Levodopa', dose: '100mg', times: '' }] });
    await page.click('#medBtn');
    await page.click('#medTAdj .tAdjBtn[data-adj="60"]');
    await page.click('#medCheckRows .medCheckRow:first-child .mcTick');
    await page.click('#medSave');
    const m = await page.evaluate(() => JSON.parse(localStorage.getItem('meds_v5'))[0]);
    expect((Date.now() - m.time) / 60000).toBeGreaterThan(58);
  });
});

test.describe('editing an existing entry', () => {
  test('an episode can be corrected, and derived values follow', async ({ page }) => {
    await seed(page, {
      meds_v5: [{ time: iso(1, 6), meds: [{ name: 'Levodopa', dose: '100mg' }] }],
      crises_v5: [episode({ start: iso(1, 12), end: iso(1, 12) + 6e5 })],
    });
    await page.click('#histLink');
    await page.click('#histList .ep .epEdit');
    await expect(page.locator('#epModal')).toBeVisible();
    // move the start to 07:00 - one hour after the 06:00 dose
    const newStart = new Date(iso(1, 7));
    const pad = n => String(n).padStart(2, '0');
    const local = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    await page.fill('#epStart', local(newStart));
    await page.fill('#epEnd', local(new Date(iso(1, 7) + 18e5)));
    await page.click('#epTypes .incTypeBtn[data-t="dysk"]');
    await page.click('#epPainYes');
    await page.click('#epSave');
    const ep = await page.evaluate(() => JSON.parse(localStorage.getItem('crises_v5'))[0]);
    expect(ep.type).toBe('dysk');
    expect(ep.pain).toBe(true);
    expect((ep.end - ep.start) / 60000).toBeCloseTo(30, 0);
    // the medication-latency figure must be recomputed against the new start
    expect((ep.start - ep.lastMed) / 36e5).toBeCloseTo(1, 1);
    expect(ep.lastMedLabel).toBe('Levodopa 100mg');
  });

  test('an episode ending before it starts is refused', async ({ page }) => {
    await seed(page, { crises_v5: [episode()] });
    await page.click('#histLink');
    await page.click('#histList .ep .epEdit');
    const d = new Date(iso(1, 12)); const pad = n => String(n).padStart(2, '0');
    const local = x => `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
    await page.fill('#epStart', local(d));
    await page.fill('#epEnd', local(new Date(iso(1, 10))));
    await page.click('#epSave');
    await expect(page.locator('#epWarn')).toBeVisible();
    await expect(page.locator('#epModal')).toBeVisible();
  });

  test('a medication entry can be re-timed without duplicating it', async ({ page }) => {
    await seed(page, {
      medlist_v5: [{ name: 'Levodopa', dose: '100mg', times: '' }],
      meds_v5: [{ time: iso(1, 12), meds: [{ name: 'Levodopa', dose: '100mg' }] }],
    });
    await page.click('#histLink');
    await page.click('#histList .ep[data-kind="med"] .epEdit');
    await expect(page.locator('#medModal')).toBeVisible();
    await expect(page.locator('#medCheckRows .mcTick')).toBeChecked();
    await page.click('#medTAdj .tAdjBtn[data-adj="30"]');
    await page.click('#medSave');
    const m = await page.evaluate(() => JSON.parse(localStorage.getItem('meds_v5')));
    expect(m).toHaveLength(1);
    expect((Date.now() - m[0].time) / 60000).toBeCloseTo(30, 0);
  });

  test('a dose removed from the list is still shown when editing an old entry', async ({ page }) => {
    await seed(page, {
      medlist_v5: [{ name: 'Levodopa', dose: '100mg', times: '' }],
      meds_v5: [{ time: iso(1, 12), meds: [{ name: 'Entacapone', dose: '200mg' }] }],
    });
    await page.click('#histLink');
    await page.click('#histList .ep[data-kind="med"] .epEdit');
    await expect(page.locator('#medCheckRows')).toContainText('Entacapone');
    await expect(page.locator('#medCheckRows')).toContainText('no longer in the list');
  });

  test('wellbeing and incidents can be edited', async ({ page }) => {
    await seed(page, {
      wellbeing_v5: [{ time: iso(1), appetite: 2, mood: 2, pain: 2, sleep: 2, weight: 60 }],
      incidents_v5: [{ time: iso(1), type: 'chute', injury: false, note: 'hall' }],
    });
    await page.click('#histLink');
    await page.click('#histList .ep[data-kind="well"] .epEdit');
    await expect(page.locator('#weightInput')).toHaveValue('60');
    await page.fill('#weightInput', '58');
    await page.click('#wellSave');
    let w = await page.evaluate(() => JSON.parse(localStorage.getItem('wellbeing_v5')));
    expect(w).toHaveLength(1);
    expect(w[0].weight).toBe(58);

    await page.click('#histList .ep[data-kind="inc"] .epEdit');
    await expect(page.locator('#incNote')).toHaveValue('hall');
    await expect(page.locator('#incCard .incTypeBtn[data-t="chute"]')).toHaveClass(/sel/);
    await page.click('#incCard .incTypeBtn[data-t="blocage"]');
    await page.click('#incSave');
    const i = await page.evaluate(() => JSON.parse(localStorage.getItem('incidents_v5')));
    expect(i).toHaveLength(1);
    expect(i[0].type).toBe('blocage');
  });

  test('cancelling an edit changes nothing', async ({ page }) => {
    await seed(page, { crises_v5: [episode({ type: 'tremor' })] });
    await page.click('#histLink');
    await page.click('#histList .ep .epEdit');
    await page.click('#epTypes .incTypeBtn[data-t="dysk"]');
    await page.click('#epCancel');
    const ep = await page.evaluate(() => JSON.parse(localStorage.getItem('crises_v5'))[0]);
    expect(ep.type).toBe('tremor');
  });
});

test.describe('figures the doctor relies on', () => {
  // Scoring 3 days of tracking against 30 days of expected doses made a
  // compliant patient look catastrophically non-adherent.
  test('adherence is measured from when tracking began, not the window start', async ({ page }) => {
    await seed(page, {
      medlist_v5: [{ name: 'Levodopa', dose: '100mg', times: '08:00, 20:00' }],
      meds_v5: [{ time: iso(1, 8), meds: [{ name: 'Levodopa', dose: '100mg' }] }],
      crises_v5: [episode()],
    });
    await page.click('#histLink'); await page.click('#toReport');
    const m = (await page.textContent('#reportBody')).match(/(\d+)\s*\/\s*(\d+)\s*doses taken/i);
    expect(m).not.toBeNull();
    expect(Number(m[2])).toBeLessThanOrEqual(6);
  });

  test('weight loss reaches the report', async ({ page }) => {
    const w = []; for (let i = 19; i >= 0; i--) w.push({ time: iso(i), appetite: 2, mood: 3, pain: 4, sleep: 3, weight: +(56 + i * 0.2).toFixed(1) });
    await seed(page, { wellbeing_v5: w, crises_v5: [episode()] });
    await page.click('#histLink'); await page.click('#toReport');
    const t = await page.textContent('#reportBody');
    expect(t).toMatch(/Weight/);
    expect(t).toMatch(/-3\.8 kg/);
    await expect(page.locator('#reportBody svg polyline')).toHaveCount(1);
  });

  test('one or two buckets show a note, never a full-width slab', async ({ page }) => {
    await seed(page, { crises_v5: [episode({ start: iso(0), end: iso(0) + 6e5 }), episode({ start: iso(0) + 1e6, end: iso(0) + 16e5 })] });
    await page.click('#histLink'); await page.click('#toReport');
    await expect(page.locator('#reportBody svg rect')).toHaveCount(0);
    expect(await page.textContent('#reportBody')).toMatch(/Not enough history for a trend/);
  });

  test('a week of data gives daily bars', async ({ page }) => {
    const c = []; for (let i = 0; i < 6; i++) c.push(episode({ start: iso(i), end: iso(i) + 6e5 }));
    await seed(page, { crises_v5: c });
    await page.click('#histLink'); await page.click('#toReport');
    expect(await page.locator('#reportBody svg rect').count()).toBeGreaterThanOrEqual(5);
  });
});

test.describe('not losing data', () => {
  test('a failed write is surfaced, never swallowed', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => {
      const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (k === 'crises_v5') { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
        return real.call(this, k, v);
      };
    });
    await page.click('#tapZone');
    await page.click('#endBtn'); await page.click('#confirmYes');
    await expect(page.locator('#storageWarn')).toBeVisible();
  });

  test('malformed stored data does not break History or Report', async ({ page }) => {
    await seed(page, {
      crises_v5: [{ start: null }, { start: 'x' }, null, 42, episode()],
      wellbeing_v5: [null, { time: 'x' }, {}],
      incidents_v5: [{}, null],
      meds_v5: [null, { time: null }],
    });
    await page.click('#histLink');
    await expect(page.locator('#histList')).toBeVisible();
    await page.click('#toReport');
    await expect(page.locator('#reportBody')).toBeVisible();
  });

  test('backup round-trips through a full wipe', async ({ page }) => {
    await seed(page, { crises_v5: [episode()], medlist_v5: [{ name: 'Levodopa', dose: '100mg', times: '08:00' }] });
    const dl = await Promise.all([page.waitForEvent('download'), page.click('#setLink').then(() => page.click('#backupBtn'))]);
    const file = await dl[0].path();
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    page.on('dialog', d => d.accept());
    await page.click('#setLink');
    await page.setInputFiles('#restoreFile', file);
    await page.click('#confirmYes');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('crises_v5') || '[]').length === 1);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('medlist_v5')).length)).toBe(1);
  });

  test('a backup from a newer version is refused', async ({ page }) => {
    await page.goto('/index.html');
    const refused = await page.evaluate(() => {
      const src = document.documentElement.innerHTML;
      return /data\._v\s*>\s*5/.test(src);
    });
    expect(refused).toBe(true);
  });
});

test.describe('settings round-trip', () => {
  // The supply is the one setting stored as an object rather than a list;
  // an array-only loader silently reset it to "not set up" on every read.
  test('pouch supply survives a reload and reaches the home screen', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#setLink');
    await page.fill('#bagsOnHand', '6');
    await page.fill('#bagDays', '1');
    await page.fill('#warnDays', '5');
    await page.click('#saveSettings');
    await expect(page.locator('#supplyTxt')).toContainText(/Pouches: ~6|Poches : ~6/);
    await page.reload();
    await expect(page.locator('#supplyTxt')).toContainText(/Pouches: ~6|Poches : ~6/);
    const s = await page.evaluate(() => JSON.parse(localStorage.getItem('supply_v5')));
    expect(s.bags).toBe(6);
  });

  test('names and phone numbers survive a reload', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#setLink');
    await page.fill('#patientInput', 'Marie');
    await page.fill('#husbandInput', '06 12 34 56 78');
    await page.click('#saveSettings');
    await page.reload();
    await page.click('#setLink');
    await expect(page.locator('#patientInput')).toHaveValue('Marie');
    await expect(page.locator('#husbandInput')).toHaveValue('06 12 34 56 78');
  });
});

test.describe('both languages', () => {
  for (const [lang, marker, del] of [['fr', 'Historique', 'Supprimer'], ['en', 'History', 'Delete']]) {
    test(`${lang}: interface and delete labels are localised`, async ({ page }) => {
      await seed(page, { lang_v5: lang, crises_v5: [episode()] });
      await expect(page.locator('#histLink')).toHaveText(marker);
      await page.click('#histLink');
      await expect(page.locator('#histList .epDel').first()).toHaveAttribute('aria-label', del);
    });
  }
});

test.describe('the page itself', () => {
  test('privacy policy loads and shows both languages', async ({ page }) => {
    await page.goto('/privacy.html');
    await expect(page.locator('section#en, section#fr')).toHaveCount(2);
    await page.click('#len');
    await expect(page.locator('section#en')).toBeVisible();
    await page.click('#lfr');
    await expect(page.locator('section#fr')).toBeVisible();
  });

  test('every manifest icon resolves', async ({ page, request }) => {
    const m = await (await request.get('/manifest.webmanifest')).json();
    expect(m.icons.filter(i => i.purpose === 'maskable')).toHaveLength(1);
    for (const ic of m.icons) expect((await request.get('/' + ic.src)).status()).toBe(200);
  });
});

test.describe('iOS wrapper compatibility', () => {
  // window.print() does nothing in a WKWebView; the build must hand off to the
  // native handler when it exists, and fall back to window.print in a browser.
  test('print falls back to window.print in a browser', async ({ page }) => {
    await seed(page, { crises_v5: [episode()] });
    await page.addInitScript(() => { window.__printed = false; window.print = () => { window.__printed = true; }; });
    await page.reload();
    await page.click('#histLink'); await page.click('#toReport');
    await page.click('#printBtn');
    expect(await page.evaluate(() => window.__printed)).toBe(true);
  });

  test('print prefers the native handler when the wrapper provides one', async ({ page }) => {
    await seed(page, { crises_v5: [episode()] });
    await page.addInitScript(() => {
      window.__native = null; window.__printed = false;
      window.print = () => { window.__printed = true; };
      window.webkit = { messageHandlers: { print: { postMessage: m => { window.__native = m; } } } };
    });
    await page.reload();
    await page.click('#histLink'); await page.click('#toReport');
    await page.click('#printBtn');
    expect(await page.evaluate(() => window.__native)).not.toBeNull();
    expect(await page.evaluate(() => window.__printed)).toBe(false);
  });
});
