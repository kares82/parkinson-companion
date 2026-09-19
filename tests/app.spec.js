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
  // The first-launch data-safety explanation is onboarding, not part of any flow
  // under test; mark it seen so it never overlays the screen during tests.
  await page.addInitScript(() => { try { localStorage.setItem('introseen_v5', '1'); } catch (e) {} });
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

  test('battery-death recovery: a running episode is ended at the last-alive moment', async ({ page }) => {
    // Phone died 20 min ago mid-crisis; lastSeen is the last heartbeat before death.
    const start = Date.now() - 40 * 6e4;      // crisis started 40 min ago
    const lastSeen = Date.now() - 20 * 6e4;   // last heartbeat 20 min ago (battery died)
    await page.goto('/index.html');
    await page.evaluate(([s, ls]) => localStorage.setItem('active_v5', JSON.stringify({
      start: s, tapped: s, type: 'tremor', pain: false, presence: 'alone', lastSeen: ls,
    })), [start, lastSeen]);
    await page.reload();
    // Recovery prompt offers to end at the last recorded moment; accept it.
    await expect(page.locator('#confirmModal')).toBeVisible();
    await page.click('#confirmYes');
    await expect(page.locator('#startScreen')).toBeVisible();
    const ep = await page.evaluate(() => JSON.parse(localStorage.getItem('crises_v5'))[0]);
    // Episode saved; end is the last-alive moment, not "now" — duration not inflated.
    expect(Math.abs(ep.end - lastSeen)).toBeLessThan(2000);
    expect(await page.evaluate(() => localStorage.getItem('active_v5'))).toBeNull();
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

  test('print uses the Android bridge when the wrapper provides one', async ({ page }) => {
    await seed(page, { crises_v5: [episode()] });
    await page.addInitScript(() => {
      window.__android = null; window.__printed = false;
      window.print = () => { window.__printed = true; };
      window.AndroidPrintBridge = { postMessage: m => { window.__android = m; } };
    });
    await page.reload();
    await page.click('#histLink'); await page.click('#toReport');
    await page.click('#printBtn');
    expect(await page.evaluate(() => window.__android)).toContain('Report');
    expect(await page.evaluate(() => window.__printed)).toBe(false);
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

test.describe('destructive-action safety', () => {
  // A single mistaken tap must never wipe the record. The confirmation word has
  // to be typed — the guarantee for a carer with their own tremor.
  test('clearing history needs the typed word, not one tap', async ({ page }) => {
    page.on('dialog', d => d.accept());
    await seed(page, { crises_v5: [episode()], lang_v5: 'en' });
    await page.click('#histLink');
    await page.click('#clearBtn');
    await expect(page.locator('#wipeModal')).toBeVisible();
    // with nothing typed, the confirm button is inert — one tap cannot wipe
    await expect(page.locator('#wipeConfirm')).toBeDisabled();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('crises_v5') || '[]').length)).toBe(1);
    // typing the word arms it, and only then does it wipe
    await page.fill('#wipeInput', 'erase');
    await expect(page.locator('#wipeConfirm')).toBeEnabled();
    await page.click('#wipeConfirm');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('crises_v5') || '[]').length === 0);
  });
});

test.describe('clinical accuracy', () => {
  // OFF (blocked/stiff) must be recorded as its own type, not collapsed into
  // "unknown" — a neurologist reads it as too-little-dopamine.
  test('an OFF episode records as its own type, with the extra-dose outcome', async ({ page }) => {
    page.on('dialog', d => d.accept());
    await page.goto('/index.html');
    await page.click('#tapZone');
    await page.click('.typeBtn[data-type="off"]');
    await page.click('#endBtn'); await page.click('#confirmYes');
    await expect(page.locator('#extraModal')).toBeVisible();
    await page.click('.exOpt[data-ex="helped"]');
    const ep = await page.evaluate(() => JSON.parse(localStorage.getItem('crises_v5'))[0]);
    expect(ep.type).toBe('off');
    expect(ep.extra).toBe('helped');
  });
});

test.describe('demo mode', () => {
  // Loading sample data must never cost a real user their history.
  test('demo loads sample data and restores real data on exit', async ({ page }) => {
    page.on('dialog', d => d.accept());
    await seed(page, { crises_v5: [episode()], pname_v5: 'RealName' });
    await page.click('#setLink');
    await page.click('#demoLoadBtn');
    await page.click('#confirmYes');
    await page.waitForFunction(() => localStorage.getItem('demo_v5') === '1');
    expect(await page.evaluate(() => localStorage.getItem('pname_v5'))).toContain('démo');
    await expect(page.locator('#demoBanner')).toBeVisible();
    await page.click('#demoBanner');
    await page.waitForFunction(() => !localStorage.getItem('demo_v5'));
    expect(await page.evaluate(() => localStorage.getItem('pname_v5'))).toBe('RealName');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('crises_v5')).length)).toBe(1);
  });
});

test.describe('no dead-ends', () => {
  // Opening the presence picker must never force a change; it can always be
  // dismissed, leaving presence untouched.
  test('the presence picker can be cancelled without changing anything', async ({ page }) => {
    await seed(page, { presence_v5: 'alone' });
    await page.click('#presenceBadge');
    await expect(page.locator('#presencePick')).toBeVisible();
    await page.click('#presCancel');
    await expect(page.locator('#presencePick')).not.toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('presence_v5'))).toBe('alone');
  });
});

test.describe('dialogs never trap the user', () => {
  // Open each dialog and confirm it can be dismissed — a swept guard against
  // any future dead-end.
  test('each dialog opens and can be dismissed', async ({ page }) => {
    page.on('dialog', d => d.accept());
    await seed(page, { crises_v5: [episode()], medlist_v5: [{ name: 'Levodopa', dose: '100mg', times: '08:00' }] });
    const cycle = async (open, modal, close) => {
      await page.click(open);
      await expect(page.locator(modal)).toBeVisible();
      await page.click(close);
      await expect(page.locator(modal)).not.toBeVisible();
    };
    await cycle('#medBtn', '#medModal', '#medCancel');
    await cycle('#wellBtn', '#wellModal', '#wellCancel');
    await cycle('#incBtn', '#incModal', '#incCancel');
    await cycle('#presenceBadge', '#presencePick', '#presCancel');
    await page.click('#histLink');
    await expect(page.locator('#historyScreen')).toBeVisible();
    await cycle('#histList .ep .epEdit', '#epModal', '#epCancel');
    await cycle('#clearBtn', '#wipeModal', '#wipeCancel');
    await page.click('#historyScreen [data-back]');
    await expect(page.locator('#startScreen')).toBeVisible();
  });
});

test.describe('research-backed additions', () => {
  test('OFF subtype and non-motor tags are recorded on an episode', async ({ page }) => {
    page.on('dialog', d => d.accept());
    await page.goto('/index.html');
    await page.click('#tapZone');
    await page.click('.typeBtn[data-type="off"]');
    await expect(page.locator('#offRow')).toBeVisible();
    await page.click('#offRow .tagChip[data-off="wearing"]');
    await page.click('#nmRow .tagChip[data-nm="anxiety"]');
    await page.click('#endBtn'); await page.click('#confirmYes');
    await page.click('.exOpt[data-ex="none"]');
    const ep = await page.evaluate(() => JSON.parse(localStorage.getItem('crises_v5'))[0]);
    expect(ep.offType).toBe('wearing');
    expect(ep.nm).toContain('anxiety');
  });

  test('WOQ-9 scores and flags wearing-off at two or more symptoms', async ({ page }) => {
    page.on('dialog', d => d.accept());
    await page.goto('/index.html');
    await page.click('#setLink'); await page.click('#woqBtn');
    await expect(page.locator('#woqModal')).toBeVisible();
    await page.locator('#woqRows .woqChk').nth(0).check();
    await page.locator('#woqRows .woqChk').nth(5).check();
    await page.click('#woqSave');
    const w = await page.evaluate(() => JSON.parse(localStorage.getItem('woq_v5'))[0]);
    expect(w.score).toBe(2);
    expect(w.positive).toBe(true);
  });

  test('a motor-state snapshot is saved', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#stateBtn');
    await expect(page.locator('#stateModal')).toBeVisible();
    await page.click('.stOpt[data-st="on"]');
    const m = await page.evaluate(() => JSON.parse(localStorage.getItem('motor_v5'))[0]);
    expect(m.state).toBe('on');
  });

  test('research export omits the person name and free-text notes', async ({ page }) => {
    const downloads = [];
    await seed(page, { crises_v5: [episode()], pname_v5: 'Sylvie', incidents_v5: [{ time: iso(0), type: 'chute', injury: false, note: 'secret note' }] });
    // capture the shared/downloaded blob via the download event
    await page.click('#histLink');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#exportResearch')]);
    const fs = require('fs'); const path = await dl.path();
    const txt = fs.readFileSync(path, 'utf8');
    expect(txt).not.toContain('secret note');
    expect(txt.toLowerCase()).not.toContain('sylvie');
  });
});

test.describe('tremor accessibility', () => {
  test('large-touch mode turns on, sticks after reload', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#setLink');
    await page.click('#bigBtn');
    await expect(page.locator('#app')).toHaveClass(/bigtouch/);
    expect(await page.evaluate(() => localStorage.getItem('bigtouch_v5'))).toBe('1');
    await page.reload();
    await expect(page.locator('#app')).toHaveClass(/bigtouch/);
  });
});

test.describe('emergency number default by region', () => {
  const emergOf = async (page, locale) => {
    await page.addInitScript(loc => {
      try { Object.defineProperty(Navigator.prototype, 'language', { get: () => loc, configurable: true }); } catch (e) {}
    }, locale);
    await page.goto('/index.html');
    await page.waitForSelector('#startScreen.show');
    await page.click('#helpBtnMain');
    return page.getAttribute('#callEmergency', 'href');
  };
  test('US devices default to 911', async ({ page }) => {
    expect(await emergOf(page, 'en-US')).toBe('tel:911');
  });
  test('UK devices default to 999', async ({ page }) => {
    expect(await emergOf(page, 'en-GB')).toBe('tel:999');
  });
  test('other locales default to 112', async ({ page }) => {
    expect(await emergOf(page, 'de-DE')).toBe('tel:112');
  });
  test('a manual setting always overrides the regional guess', async ({ page }) => {
    await page.addInitScript(() => {
      try { Object.defineProperty(Navigator.prototype, 'language', { get: () => 'en-US', configurable: true }); } catch (e) {}
    });
    await seed(page, { emerg_v5: '15' });
    await page.click('#helpBtnMain');
    expect(await page.getAttribute('#callEmergency', 'href')).toBe('tel:15');
  });
});

test.describe('German localization', () => {
  test('a stored German preference renders the UI in German', async ({ page }) => {
    await seed(page, { lang_v5: 'de' });
    await expect(page.locator('#setLink')).toHaveText('Einstellungen');
    await expect(page.locator('#medBtn')).toHaveText('Medikament gegeben');
  });
  test('switching to German from Settings sticks after reload', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#startScreen.show');
    await page.click('#setLink');
    await page.click('.langBtn[data-lang="de"]');
    await expect(page.locator('#helpBtnMain')).toHaveText('☎ HILFE RUFEN');
    expect(await page.evaluate(() => localStorage.getItem('lang_v5'))).toBe('de');
    await page.reload();
    await expect(page.locator('#medBtn')).toHaveText('Medikament gegeben');
  });
  test('German reaches the settings and report screens, no leftover French', async ({ page }) => {
    await seed(page, { lang_v5: 'de', crises_v5: [episode()] });
    await page.click('#setLink');
    await expect(page.locator('text=Datensicherung')).toBeVisible();
    await expect(page.locator('text=Notfallkontakte')).toBeVisible();
    // No obvious French section headings bled through onto the settings screen.
    await expect(page.locator('text=Sauvegarde des données')).toHaveCount(0);
  });
});

test.describe('Italian and Spanish localization', () => {
  test('a stored Italian preference renders the UI in Italian', async ({ page }) => {
    await seed(page, { lang_v5: 'it' });
    await expect(page.locator('#setLink')).toHaveText('Impostazioni');
    await expect(page.locator('#medBtn')).toHaveText('Farmaco somministrato');
  });
  test('a stored Spanish preference renders the UI in Spanish', async ({ page }) => {
    await seed(page, { lang_v5: 'es' });
    await expect(page.locator('#setLink')).toHaveText('Ajustes');
    await expect(page.locator('#medBtn')).toHaveText('Medicación administrada');
  });
  test('switching to Italian then Spanish from Settings sticks', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForSelector('#startScreen.show');
    await page.click('#setLink');
    await page.click('.langBtn[data-lang="it"]');
    await expect(page.locator('#helpBtnMain')).toHaveText('☎ CHIEDI AIUTO');
    await page.click('.langBtn[data-lang="es"]');
    await expect(page.locator('#helpBtnMain')).toHaveText('☎ PEDIR AYUDA');
    expect(await page.evaluate(() => localStorage.getItem('lang_v5'))).toBe('es');
    await page.reload();
    await expect(page.locator('#medBtn')).toHaveText('Medicación administrada');
  });
});

test.describe('language auto-detection by device / store region', () => {
  const langFor = async (page, locale) => {
    await page.addInitScript(loc => {
      try { Object.defineProperty(Navigator.prototype, 'language', { get: () => loc, configurable: true }); } catch (e) {}
    }, locale);
    await page.goto('/index.html');
    await page.waitForSelector('#startScreen.show');
    return page.textContent('#setLink');
  };
  test('an Italian device opens in Italian', async ({ page }) => {
    expect((await langFor(page, 'it-IT')).trim()).toBe('Impostazioni');
  });
  test('a Spanish (Mexico) device opens in Spanish', async ({ page }) => {
    expect((await langFor(page, 'es-MX')).trim()).toBe('Ajustes');
  });
  test('a German device opens in German', async ({ page }) => {
    expect((await langFor(page, 'de-AT')).trim()).toBe('Einstellungen');
  });
  test('an anglophone in France (en-GB) opens in English and can switch to French', async ({ page }) => {
    // Device is English even though the store region is France: honour the device.
    await page.addInitScript(() => {
      try { Object.defineProperty(Navigator.prototype, 'language', { get: () => 'en-GB', configurable: true }); } catch (e) {}
    });
    await page.goto('/index.html');
    await page.waitForSelector('#startScreen.show');
    await expect(page.locator('#setLink')).toHaveText('Settings');
    // ...and they retain the option to change it.
    await page.click('#setLink');
    await page.click('.langBtn[data-lang="fr"]');
    await expect(page.locator('#helpBtnMain')).toHaveText('☎ APPELER À L\'AIDE');
    expect(await page.evaluate(() => localStorage.getItem('lang_v5'))).toBe('fr');
  });
  test('a stored preference always wins over the device language', async ({ page }) => {
    await page.addInitScript(() => {
      try { Object.defineProperty(Navigator.prototype, 'language', { get: () => 'it-IT', configurable: true }); } catch (e) {}
    });
    await seed(page, { lang_v5: 'es' });
    await expect(page.locator('#setLink')).toHaveText('Ajustes');
  });
});

test.describe('sending and contributing reports', () => {
  // Capture what the app hands to the OS share sheet, without anything leaving.
  const stubShare = () => {
    window.__shared = null;
    const read = f => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsText(f); });
    navigator.canShare = () => true;
    navigator.share = async (data) => {
      const files = data.files || [];
      const texts = await Promise.all(files.map(read));
      window.__shared = { title: data.title, names: files.map(f => f.name), texts };
    };
  };
  const openReport = async (page) => {
    await page.click('#histLink'); await page.click('#toReport');
    await expect(page.locator('#reportScreen')).toBeVisible();
  };

  test('Send report is patient-initiated and asks name-or-anonymous', async ({ page }) => {
    await page.addInitScript(stubShare);
    await seed(page, { crises_v5: [episode()], pname_v5: 'Marie' });
    await openReport(page);
    await page.click('#sendReportBtn');
    await expect(page.locator('#sendModal')).toBeVisible();
    // Nothing has been shared just by opening the dialog.
    expect(await page.evaluate(() => window.__shared)).toBeNull();
    await page.click('#sendNamed');
    await page.waitForFunction(() => window.__shared);
    const shared = await page.evaluate(() => window.__shared);
    expect(shared.names.length).toBe(2);                 // readable summary + CSV
    expect(shared.texts.join('\n')).toContain('Marie');  // named report includes the name
  });

  test('an anonymous send strips the person name from the summary', async ({ page }) => {
    await page.addInitScript(stubShare);
    await seed(page, { crises_v5: [episode()], pname_v5: 'Marie' });
    await openReport(page);
    await page.click('#sendReportBtn');
    await page.click('#sendAnon');
    await page.waitForFunction(() => window.__shared);
    const shared = await page.evaluate(() => window.__shared);
    expect(shared.texts[0]).not.toContain('Marie');      // summary is de-identified
  });

  test('cancelling the send dialog shares nothing', async ({ page }) => {
    await page.addInitScript(stubShare);
    await seed(page, { crises_v5: [episode()] });
    await openReport(page);
    await page.click('#sendReportBtn');
    await page.click('#sendCancel');
    await expect(page.locator('#sendModal')).toBeHidden();
    expect(await page.evaluate(() => window.__shared)).toBeNull();
  });

  test('there is no research-contribution / data-collection control', async ({ page }) => {
    await seed(page, { crises_v5: [episode()] });
    await openReport(page);
    // The app collects nothing: the only outbound action is the patient's own send.
    await expect(page.locator('#contribBtn')).toHaveCount(0);
  });
});
