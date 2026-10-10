import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from '@playwright/test';
const root = path.resolve('dist');
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const cases = [
  ['fr', 'Langue', 'Télécharger le PDF', 'Entrer dans le Codex', 'Mot de passe oublié ?'],
  ['en', 'Language', 'Download PDF', 'Enter the Codex', 'Forgot password?'],
  ['es', 'Idioma', 'Descargar el PDF', 'Entrar en el Codex', '¿Has olvidado tu contraseña?'],
  ['pt', 'Idioma', 'Descarregar o PDF', 'Entrar no Codex', 'Esqueceste-te da palavra-passe?'],
  ['de', 'Sprache', 'PDF herunterladen', 'Codex betreten', 'Passwort vergessen?'],
];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.route('**/*', r => {
      const url = new URL(r.request().url());
      if (url.pathname.startsWith('/_vercel/')) return r.fulfill({ contentType: 'text/javascript', body: '' });
      if (url.pathname.includes('/rest/v1/')) {
        let data = [];
        if (url.pathname.endsWith('/campaigns')) data = [{ id: 13, name: 'Original campaign', theme_id: 'medieval', pdf_files: {}, is_free: false, price: 6.99, scenarios: [{ id: 10, title: 'Chapitre I', display_name: 'Titre original', description: 'Texte original', duration: '4 heures', author: 'Auteur', is_free: true, price: 0, pdf_files: { fr: 'fr.pdf' }, tags: ['Enquête'], ratings: {}, position: 1 }] }];
        if (url.pathname.endsWith('/site_settings')) data = { site_name: 'Le Codex', logo_url: '', tagline: '' };
        return r.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
      }
      if (url.origin === origin) return r.continue();
      return r.fulfill({ status: 404, body: '' });
    });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const [code, label, download, login, forgot] of cases) {
      await page.goto(origin + '/');
      const selector = page.locator('select').filter({ has: page.locator('option[value="de"]') }).first();
      await selector.selectOption(code);
      assert.equal(await page.locator('html').getAttribute('lang'), code);
      await page.goto(origin + '/?campaign=13&chapter=10');
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: download, exact: true }).waitFor();
      assert.deepEqual(await dialog.locator('select option').evaluateAll(options => options.map(o => o.value)), ['fr']);
      assert.equal(await dialog.locator('select').inputValue(), 'fr');
      await page.reload();
      await page.getByRole('dialog').waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'), code);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.goto(origin + '/login');
      assert.equal(await page.getByRole('combobox', { name: label, exact: true }).inputValue(), code);
      await page.getByRole('button', { name: login, exact: true }).waitFor();
      await page.getByRole('link', { name: forgot, exact: true }).click();
      await page.getByRole('heading').waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'), code);
      console.log(`${width}px ${code}: selection, persistence, French-only PDF, login and recovery passed`);
    }
    await page.evaluate(() => localStorage.setItem('le-codex-lang', 'invalid'));
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'), 'fr');
    assert.deepEqual(errors, []);
    await context.close();
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
