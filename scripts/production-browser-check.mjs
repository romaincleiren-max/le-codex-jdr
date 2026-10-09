import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const origin = 'https://le-codex-jdr.vercel.app';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(origin + '/?campaign=13&chapter=10');
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await dialog.getByRole('combobox', { name: 'Langue du PDF' }).selectOption('fr');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: 'Télécharger le PDF', exact: true }).click(),
    ]);
    assert.equal(await download.failure(), null);
    const path = await download.path();
    assert.equal(fs.readFileSync(path).subarray(0, 5).toString(), '%PDF-');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.goto(origin + '/admin');
    await page.getByRole('button', { name: 'Entrer dans le Codex' }).waitFor();
    await page.getByRole('link', { name: 'Mot de passe oublié ?' }).click();
    await page.getByRole('heading', { name: 'Mot de passe oublié' }).waitFor();
    await page.goto(origin + '/reset-password');
    await page.getByRole('heading', { name: 'Choisir un nouveau mot de passe' }).waitFor();
    assert.deepEqual(errors, []);
    results.push({ width, pdfDownloaded: true, adminRequiresLogin: true, recoveryPages: true, javascriptErrors: 0 });
    await page.close();
  }
} finally { await browser.close(); }
fs.writeFileSync('docs/audit-halloween-2026/production-browser.json', JSON.stringify({ date: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify(results, null, 2));
