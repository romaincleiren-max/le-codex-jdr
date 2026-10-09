// Server-only boundary. Stripe keeps the authoritative purchase record.
const { createClient } = require('@supabase/supabase-js');
const crypto = require('node:crypto');
const fail = (status, message) => Object.assign(new Error(message), { status });
function env(name) { const value = process.env[name]?.trim(); if (!value) throw fail(503, 'Service temporairement indisponible.'); return value; }
function database() { return createClient(env('VITE_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } }); }
function clients() { return { stripe: require('stripe')(env('STRIPE_SECRET_KEY')), db: database() }; }
function origin() {
  const url = new URL(process.env.APP_URL || 'https://le-codex-jdr.vercel.app');
  if (url.protocol !== 'https:') throw fail(503, 'Configuration du site indisponible.');
  return url.origin;
}
function headers(res) { res.setHeader('Cache-Control', 'no-store'); res.setHeader('Referrer-Policy', 'no-referrer'); }
function errorResponse(res, error) {
  console.error('Commerce request failed', { status: error.status || 503, code: error.code || 'unavailable' });
  return res.status(error.status || 503).json({ error: error.status ? error.message : 'Service temporairement indisponible. Réessayez dans un instant.' });
}
function key(type, id) {
  if (!['scenario', 'saga'].includes(type) || !/^\d{1,16}$/.test(String(id))) throw fail(400, 'Article invalide.');
  return `${type}:${id}`;
}
function editions(row) {
  const files = row.pdf_files === undefined ? (row.pdf_url ? { fr: row.pdf_url } : {}) : row.pdf_files;
  return Object.fromEntries(Object.entries(files || {}).filter(([lang, path]) => /^[a-z]{2}(?:-[A-Z]{2})?$/.test(lang) && typeof path === 'string' && path.trim()).map(([lang, path]) => [lang, path.trim()]));
}
function storagePath(value) {
  let path = value;
  if (/^https?:/i.test(path)) {
    const url = new URL(path);
    if (url.origin !== new URL(env('VITE_SUPABASE_URL')).origin) throw fail(409, 'Le PDF doit être hébergé dans le stockage du site.');
    const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/pdfs\/(.+)$/);
    if (!match) throw fail(409, 'Fichier PDF indisponible.');
    path = decodeURIComponent(match[1]);
  }
  if (!path || path.startsWith('/') || path.split('/').some(p => p === '..' || p === '.') || /[?#\x00-\x1f]/.test(path) || !/\.pdf$/i.test(path)) throw fail(409, 'Chemin PDF invalide.');
  return path;
}
async function catalogItem(db, type, id) {
  key(type, id);
  const { data, error } = await db.from(type === 'saga' ? 'campaigns' : 'scenarios').select('*').eq('id', id).maybeSingle();
  if (error) throw fail(503, 'Catalogue temporairement indisponible.');
  if (!data) throw fail(404, 'Article introuvable.');
  return { ...data, type, name: data.display_name || data.name || data.title, files: editions(data) };
}
async function signedFile(db, item, language) {
  if (!item.files[language]) throw fail(409, 'Cette traduction n’est pas encore disponible.');
  const path = storagePath(item.files[language]);
  const { data, error } = await db.storage.from('pdfs').createSignedUrl(path, 300, { download: true });
  if (error || !data?.signedUrl) throw fail(409, 'Ce fichier n’est pas encore disponible.');
  return data.signedUrl;
}
async function checkoutLines(db, cart) {
  if (!Array.isArray(cart) || !cart.length || cart.length > 20) throw fail(400, 'Panier vide ou invalide.');
  const seen = new Set(); const items = [];
  for (const entry of cart) {
    const id = entry.id ?? entry.item?.id; const identity = key(entry.type, id);
    if (seen.has(identity)) throw fail(400, 'Article en double dans le panier.');
    seen.add(identity);
    const item = await catalogItem(db, entry.type, id);
    if (!Object.keys(item.files).length) throw fail(409, `${item.name} : PDF à venir.`);
    const cents = Math.round(Number(item.price) * 100);
    if (item.is_free || !Number.isSafeInteger(cents) || cents < 50 || cents > 100000) throw fail(409, 'Cet article ne peut pas être acheté.');
    for (const lang of Object.keys(item.files)) await signedFile(db, item, lang);
    items.push({ ...item, cents });
  }
  if (items.some(i => i.type === 'scenario' && seen.has(`saga:${i.campaign_id}`))) throw fail(409, 'Le panier contient une campagne et un de ses chapitres. Retirez le doublon.');
  return items.map(i => ({ quantity: 1, price_data: { currency: 'eur', unit_amount: i.cents, product_data: { name: i.name, metadata: { codex_version: '2', type: i.type, itemId: String(i.id) } } } }));
}
async function receipt(stripe, sessionId) {
  if (typeof sessionId !== 'string' || !/^cs_(?:test_|live_)?[A-Za-z0-9]{16,240}$/.test(sessionId)) throw fail(400, 'Référence de paiement invalide.');
  let session;
  try { session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent.latest_charge'] }); }
  catch (error) { if (error.code === 'resource_missing') throw fail(404, 'Paiement introuvable.'); throw error; }
  if (session.metadata?.codex_version !== '2') throw fail(409, 'Pour cet ancien achat, contactez le support avec votre référence Stripe.');
  if (session.payment_status !== 'paid' || session.status !== 'complete') return { paid: false, status: session.payment_status, items: [] };
  const charge = session.payment_intent?.latest_charge;
  if (!charge || typeof charge !== 'object' || charge.refunded || charge.amount_refunded > 0 || charge.disputed) throw fail(403, 'Ce paiement ne donne plus accès au téléchargement.');
  const lines = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100, expand: ['data.price.product'] });
  if (lines.has_more || !lines.data.length) throw fail(503, 'Commande incomplète.');
  const items = lines.data.map(line => {
    const meta = line.price?.product?.metadata;
    if (meta?.codex_version !== '2') throw fail(503, 'Article non reconnu.');
    key(meta.type, meta.itemId);
    return { id: meta.itemId, type: meta.type, name: line.description };
  });
  return { paid: true, items, email: session.customer_details?.email || session.customer_email, amount: session.amount_total / 100, currency: session.currency };
}
async function sendReceipt(sessionId, data) {
  const secret = env('RESEND_API_KEY'); const from = env('RECEIPT_FROM_EMAIL');
  if (!data.email) throw fail(503, 'Adresse de livraison absente.');
  const link = `${origin()}/payment/success?session_id=${encodeURIComponent(sessionId)}`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', 'Idempotency-Key': `codex-receipt-${sessionId}` },
    body: JSON.stringify({ from, to: [data.email], subject: 'Vos PDF Le Codex', text: `Merci pour votre achat. Retrouvez vos PDF et choisissez leur langue sur votre page privée :\n${link}\n\nConservez ce lien personnel. Les traductions ajoutées à ces chapitres seront incluses dans votre achat.` }),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw fail(503, 'Livraison du reçu temporairement indisponible.');
}
module.exports = { fail, env, clients, database, origin, headers, errorResponse, key, editions, storagePath, catalogItem, signedFile, checkoutLines, receipt, sendReceipt, crypto };
